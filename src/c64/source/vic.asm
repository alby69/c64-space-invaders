; ==============================================================================
; COMMODORE 64 SPACE INVADERS - FILE: vic.asm
; ==============================================================================
; Gestione del chip video VIC-II (MOS 6569 PAL / 6567 NTSC).
; 
; RESPONSABILITÀ DI QUESTO MODULO:
; - Inizializzazione colori bordo e sfondo (Nero Arcade: $00)
; - Pulizia della memoria video (Screen RAM $0400-$07E7 e Color RAM $D800-$DBE7)
; - Configurazione dei registri Hardware Sprite ($D000 - $D02E)
; - Assegnazione dei puntatori ai blocchi di memoria sprite ($07F8 - $07FF)
; - Gestione dell'aggiornamento grafico delle coordinate ad ogni frame
; ==============================================================================

!src "constants.inc"

; ------------------------------------------------------------------------------
; ROUTINE: vic_init
; DESCRIZIONE: Configura il display per lo stile arcade di Space Invaders.
; ------------------------------------------------------------------------------
vic_init:
    ; 1. Bordo e Sfondo neri per un autentico look arcade
    lda #COLOR_BLACK
    sta VIC_BORDER_COL      ; $D020 = 0 (Bordo nero)
    sta VIC_BG_COL0         ; $D021 = 0 (Sfondo nero)

    ; 2. Pulisce la memoria schermo ($0400) inserendo lo spazio PETSCII ($20)
    ;    e imposta la RAM colori ($D800) con colore Bianco ($01)
    ldx #$00
    lda #$20                ; Codice PETSCII per il carattere 'Spazio'
    ldy #COLOR_WHITE        ; Colore predefinito per il testo
.clear_loop:
    sta SCREEN_RAM, x           ; Primi 256 byte ($0400)
    sta SCREEN_RAM + $100, x    ; Secondi 256 byte ($0500)
    sta SCREEN_RAM + $200, x    ; Terzi 256 byte ($0600)
    sta SCREEN_RAM + $300, x    ; Quarti 256 byte ($0700)

    tya
    sta COLOR_RAM, x            ; Colore RAM $D800
    sta COLOR_RAM + $100, x     ; Colore RAM $D900
    sta COLOR_RAM + $200, x     ; Colore RAM $DA00
    sta COLOR_RAM + $300, x     ; Colore RAM $DB00
    lda #$20
    inx
    bne .clear_loop

    ; --------------------------------------------------------------------------
    ; 3. CONFIGURAZIONE DEI PUNTATORI AGLI SPRITE ($07F8 - $07FF)
    ; Sul C64, gli ultimi 8 byte della pagina video selezionata ($0400 + $03F8)
    ; contengono gli indirizzi dei blocchi da 64 byte in cui risiedono gli sprite.
    ; Il nostro sprite buffer inizia a $2000 (blocco $2000 / 64 = $80 = 128 dec).
    ; --------------------------------------------------------------------------
    lda #SPRITE_BLOCK_START         ; $80 = Sprite 0: Cannone Giocatore
    sta SPRITE_PTR_0
    lda #(SPRITE_BLOCK_START + 1)   ; $81 = Sprite 1: Invasore 1 (Squid)
    sta SPRITE_PTR_1
    lda #(SPRITE_BLOCK_START + 3)   ; $83 = Sprite 2: Invasore 2 (Crab)
    sta SPRITE_PTR_2
    lda #(SPRITE_BLOCK_START + 5)   ; $85 = Sprite 3: Invasore 3 (Octopus)
    sta SPRITE_PTR_3
    lda #(SPRITE_BLOCK_START + 7)   ; $87 = Sprite 4: UFO Mystery Ship
    sta SPRITE_PTR_4
    lda #(SPRITE_BLOCK_START + 8)   ; $88 = Sprite 5: Esplosione
    sta SPRITE_PTR_5
    lda #(SPRITE_BLOCK_START + 9)   ; $89 = Sprite 6: Proiettile Giocatore
    sta SPRITE_PTR_6
    lda #(SPRITE_BLOCK_START + 10)  ; $8A = Sprite 7: Bomba Aliena
    sta SPRITE_PTR_7

    ; 4. CONFIGURAZIONE COLORI DEGLI SPRITE ($D027 - $D02E)
    lda #COLOR_LIGHTGREEN   ; Cannone Giocatore: Verde Chiaro brillante ($0D)
    sta VIC_SPR0_COL
    lda #COLOR_CYAN         ; Invasore 1: Ciano ($03)
    sta VIC_SPR1_COL
    lda #COLOR_YELLOW       ; Invasore 2: Giallo ($07)
    sta VIC_SPR2_COL
    lda #COLOR_LIGHTRED     ; Invasore 3: Rosso Chiaro ($0A)
    sta VIC_SPR3_COL
    lda #COLOR_RED          ; UFO: Rosso ($02)
    sta VIC_SPR4_COL
    lda #COLOR_WHITE        ; Esplosione: Bianco / Giallo ($01)
    sta VIC_SPR5_COL
    lda #COLOR_WHITE        ; Proiettile: Bianco ($01)
    sta VIC_SPR6_COL
    lda #COLOR_CYAN         ; Bomba Aliena: Ciano ($03)
    sta VIC_SPR7_COL

    ; 5. MODALITÀ HI-RES E NESSUNA ESPANSIONE
    ; Tutti gli sprite sono in alta risoluzione monocolore 24x21
    lda #$00
    sta VIC_SPR_MCOLOR      ; Nessun sprite multicolore ($D01C = 0)
    sta VIC_SPR_EXP_X       ; Nessuna espansione orizzontale ($D01D = 0)
    sta VIC_SPR_EXP_Y       ; Nessuna espansione verticale ($D017 = 0)
    sta VIC_SPR_X_MSB       ; Azzera bit 8 coordinate X ($D010 = 0)

    ; 6. ABILITAZIONE DEGLI SPRITE INIZIALI ($D015)
    ; Attiviamo inizialmente:
    ; Sprite 0 (Giocatore), Sprite 1, 2, 3 (Alieni pilota dello sciame)
    ; Bitmask: %00001111 = $0F (Sprite 0, 1, 2, 3 abilitati)
    lda #%00001111
    sta VIC_SPR_ENA

    ; Imposta le coordinate iniziali del Giocatore (in basso al centro)
    lda #160                ; X = 160 (centro orizzontale dello schermo visibile)
    sta ZP_PLAYER_X
    sta VIC_SPR0_X
    lda #228                ; Y = 228 (appena sopra il fondo dello schermo)
    sta ZP_PLAYER_Y
    sta VIC_SPR0_Y

    rts

; ------------------------------------------------------------------------------
; ROUTINE: vic_wait_raster
; DESCRIZIONE:
; Sincronizza l'esecuzione del codice con la linea di raster del pennello elettronico
; del monitor CRT. Questo impedisce il flickering ("sfarfallio") e lo screen tearing.
; Attendiamo la riga 250 (quando il pennello si trova nella zona del bordo inferiore).
; ------------------------------------------------------------------------------
vic_wait_raster:
    ; 1. Attende finché non raggiungiamo la riga 250
.loop1:
    lda VIC_RASTER
    cmp #250
    bne .loop1

    ; 2. Attende che la linea 250 passi per evitare doppio trigger nello stesso frame
.loop2:
    lda VIC_RASTER
    cmp #250
    beq .loop2

    rts
