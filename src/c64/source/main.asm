; ==============================================================================
; COMMODORE 64 SPACE INVADERS - MAIN ASSEMBLY ENTRY POINT
; ==============================================================================
; Autore: Assembly 6502 per C64 Studio
; Target: Commodore 64 (PAL / NTSC)
; Assemblatori supportati: ACME, KickAssembler, 64tass, DASM
;
; STRUTTURA DEL PROGETTO:
; - constants.inc   : Mappatura registri hardware VIC-II, SID, CIA e Pagina Zero
; - vic.asm         : Configurazione video, colori e sincronizzazione raster
; - sid.asm         : Sintetizzatore sonoro SID 6581 (laser, marcia 4 note, esplosione)
; - sprites.asm     : Grafica bitmap 24x21 a 64 byte per ogni sprite (a $2000)
; - player.asm      : Controllo cannone terrestre, joystick CIA 1 e proiettile laser
; - invaders.asm    : Movimento a sciame, accelerazione marcia, bombe aliene
; - hud.asm         : Stampa testi PETSCII, punteggio BCD, vite e record
; ==============================================================================

; Inizio del programma nella memoria del Commodore 64: $0801 (RAM BASIC standard)
* = $0801

; ------------------------------------------------------------------------------
; STUB BASIC C64: "10 SYS 2064"
; Permette di avviare il gioco con il classico comando RUN dopo LOAD "*",8,1.
; In memoria:
;   $0801: $0B $08 (puntatore alla riga successiva a $080B)
;   $0803: $0A $00 (numero riga: 10 in decimale)
;   $0805: $9E     (token BASIC per il comando SYS)
;   $0806: "2064"  (indirizzo in formato testo ASCII: $0810 in esadecimale)
;   $080A: $00     (terminatore riga)
;   $080B: $00 $00 (fine programma BASIC)
; ------------------------------------------------------------------------------
basic_header:
    !byte $0B, $08, $0A, $00, $9E, $32, $30, $36, $34, $00, $00, $00

; ------------------------------------------------------------------------------
; CODICE MACCHINA 6502 INIZIALE ($0810 = 2064 Decimale)
; ------------------------------------------------------------------------------
* = $0810

entry_point:
    sei                     ; Disabilita interrupt CPU per configurazione sicura
    cld                     ; Assicura che il flag decimale sia disattivato

    ; Inizializza i moduli hardware
    jsr sid_init            ; Resetta e inizializza il chip sonoro SID
    jsr vic_init            ; Inizializza il controller video VIC-II e gli sprite
    jsr hud_init            ; Inizializza le scritte a schermo e il punteggio

    ; Inizializza lo stato del gioco su Titolo (0 = STATE_TITLE)
    lda #0
    sta ZP_GAME_STATE
    jsr hud_show_title

    cli                     ; Riabilita gli interrupt

; ------------------------------------------------------------------------------
; CICLO PRINCIPALE DEL GIOCO (MAIN GAME LOOP)
; ------------------------------------------------------------------------------
main_loop:
    ; 1. Sincronizzazione con il pennello elettronico CRT (linea raster 250)
    ; Garantisce che tutte le modifiche visive avvengano durante il blanking verticale
    jsr vic_wait_raster

    ; 2. Macchina a stati finiti (Game State Machine)
    lda ZP_GAME_STATE
    cmp #0                  ; 0 = STATO TITOLO
    beq .state_title
    cmp #1                  ; 1 = STATO IN GIOCO (PLAYING)
    beq .state_playing
    cmp #2                  ; 2 = STATO GAME OVER
    beq .state_gameover
    cmp #3                  ; 3 = STATO ONDATA SUCCESSIVA (NEXT WAVE)
    beq .state_next_wave
    jmp main_loop

; ------------------------------------------------------------------------------
; GESTIONE STATO 0: SCHERMATA DEL TITOLO
; ------------------------------------------------------------------------------
.state_title:
    ; Attende la pressione del tasto FUOCO o SPAZIO
    lda CIA1_PORT_A
    and #JOY_FIRE
    bne .title_no_start

    ; Tasto premuto: inizia nuova partita!
    jsr start_new_game
    lda #1                  ; Passa a STATO IN GIOCO
    sta ZP_GAME_STATE

.title_no_start:
    jmp main_loop

; ------------------------------------------------------------------------------
; GESTIONE STATO 1: PARTITA IN CORSO
; ------------------------------------------------------------------------------
.state_playing:
    ; Incrementa contatore frame generale
    inc ZP_FRAME_COUNT

    ; 1. Aggiorna input giocatore e movimento cannone
    jsr player_update

    ; 2. Aggiorna il raggio laser sparato dal giocatore
    jsr bullet_update

    ; 3. Aggiorna lo sciame degli invasori e le loro bombe
    jsr invaders_update

    ; 4. Controlla le collisioni fisiche tra proiettili e bersagli
    jsr check_collisions

    ; 5. Aggiorna gli inviluppi sonori e sweep del chip SID
    jsr sid_tick

    jmp main_loop

; ------------------------------------------------------------------------------
; GESTIONE STATO 2: GAME OVER
; ------------------------------------------------------------------------------
.state_gameover:
    ; Mostra scritta Game Over
    jsr hud_show_game_over

    ; Se si preme nuovamente fuoco, torna al titolo o riavvia
    lda CIA1_PORT_A
    and #JOY_FIRE
    bne .wait_go

    ; Attendi rilascio e riavvia
    jsr start_new_game
    lda #1
    sta ZP_GAME_STATE

.wait_go:
    jmp main_loop

; ------------------------------------------------------------------------------
; GESTIONE STATO 3: ONDATA SUCCESSIVA (NEXT WAVE)
; ------------------------------------------------------------------------------
.state_next_wave:
    ; Riposiziona lo sciame in cima con velocità incrementata
    jsr invaders_init
    lda #1
    sta ZP_GAME_STATE
    jmp main_loop

; ------------------------------------------------------------------------------
; ROUTINE: start_new_game
; DESCRIZIONE:
; Resetta punteggio, vite (3), stato dello sciame e ripulisce lo schermo.
; ------------------------------------------------------------------------------
start_new_game:
    lda #$00
    sta ZP_SCORE_LO
    sta ZP_SCORE_HI
    lda #3
    sta ZP_PLAYER_LIVES

    jsr vic_init
    jsr hud_init
    jsr player_init
    jsr invaders_init
    rts

; ------------------------------------------------------------------------------
; ROUTINE: check_collisions
; DESCRIZIONE:
; Rileva le collisioni tra:
; 1. Proiettile Giocatore (Sprite 6) e Invasori Alieni (Sprite 1, 2, 3)
; 2. Bomba Aliena (Sprite 7) e Cannone Giocatore (Sprite 0)
; 3. Sciame che tocca il fondo dello schermo (Invasione riuscita!)
; ------------------------------------------------------------------------------
check_collisions:
    ; 1. Controllo: Proiettile Giocatore contro Invasori
    lda ZP_BULLET_ACTIVE
    beq .check_alien_bomb   ; Se non c'è proiettile attivo, salta

    ; Confronto coordinata Y con lo sciame
    lda ZP_BULLET_Y
    sec
    sbc ZP_INV_BASE_Y
    bcc .check_alien_bomb   ; Sopra lo sciame
    cmp #64                 ; Altezza complessiva dello sciame
    bcs .check_alien_bomb   ; Sotto lo sciame

    ; Confronto coordinata X con lo sciame
    lda ZP_BULLET_X
    sec
    sbc ZP_INV_BASE_X
    bcc .check_alien_bomb   ; A sinistra dello sciame
    cmp #72                 ; Larghezza blocco alieni
    bcs .check_alien_bomb   ; A destra dello sciame

    ; COLPITO!
    ; Disattiva il proiettile
    lda #0
    sta ZP_BULLET_ACTIVE
    lda VIC_SPR_ENA
    and #%10111111          ; Spegne Sprite 6
    sta VIC_SPR_ENA

    ; Notifica il modulo invasori e aggiungi 20 punti
    jsr invaders_on_hit
    lda #$20                ; 20 punti in formato BCD
    jsr hud_add_score

.check_alien_bomb:
    ; 2. Controllo: Bomba Aliena contro Giocatore
    lda ZP_BOMB_ACTIVE
    beq .check_invasion_bottom

    ; Confronta Y bomba con Y giocatore (228)
    lda ZP_BOMB_Y
    cmp #220
    bcc .check_invasion_bottom
    cmp #236
    bcs .check_invasion_bottom

    ; Confronta X bomba con X giocatore
    lda ZP_BOMB_X
    sec
    sbc ZP_PLAYER_X
    clc
    adc #12                 ; Bounding box di tolleranza
    cmp #24
    bcs .check_invasion_bottom

    ; GIOCATORE COLPITO DALLA BOMBA!
    jsr player_hit

.check_invasion_bottom:
    ; 3. Controllo: Gli alieni hanno raggiunto la base terrestre?
    lda ZP_INV_BASE_Y
    cmp #190
    bcc .done_col
    ; Gli alieni sono atterrati: fine immediata della partita!
    lda #2
    sta ZP_GAME_STATE

.done_col:
    rts

; ------------------------------------------------------------------------------
; ROUTINE: player_hit
; DESCRIZIONE:
; Gestisce la perdita di una vita quando il giocatore viene colpito.
; ------------------------------------------------------------------------------
player_hit:
    ; Disattiva la bomba
    lda #0
    sta ZP_BOMB_ACTIVE
    lda VIC_SPR_ENA
    and #%01111111
    sta VIC_SPR_ENA

    ; Suona esplosione sul SID
    jsr sid_play_explosion

    ; Decrementa vite
    dec ZP_PLAYER_LIVES
    jsr hud_draw_lives
    lda ZP_PLAYER_LIVES
    bne .keep_playing

    ; Vite esaurite: GAME OVER
    lda #2
    sta ZP_GAME_STATE
    rts

.keep_playing:
    ; Ripristina posizione del cannone al centro
    lda #160
    sta ZP_PLAYER_X
    sta VIC_SPR0_X
    rts

; ------------------------------------------------------------------------------
; INCLUSIONE DEI SOTTOMODULI MODULARI
; ------------------------------------------------------------------------------
!src "vic.asm"
!src "sid.asm"
!src "player.asm"
!src "invaders.asm"
!src "hud.asm"
!src "sprites.asm"
