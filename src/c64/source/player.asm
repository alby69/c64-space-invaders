; ==============================================================================
; COMMODORE 64 SPACE INVADERS - FILE: player.asm
; ==============================================================================
; Gestione del Cannone Difensivo Terrestre (Player Ship) e del Proiettile Laser.
; 
; GESTIONE INPUT (CIA 1 - PORTA JOYSTICK 2 a $DC00):
; - Sul Commodore 64, la porta joystick 2 è mappata su $DC00.
; - I microinterruttori del joystick mettono a massa i pin (logica invertita: 0=premuto).
; - Bit 2 (valore 4): SINISTRA
; - Bit 3 (valore 8): DESTRA
; - Bit 4 (valore 16): PULSANTE FUOCO (FIRE)
; - Viene inoltre supportata la tastiera per emulatore (tasti 'A', 'D' e Spazio).
; ==============================================================================

!src "constants.inc"

PLAYER_MIN_X    = 32        ; Limite sinistro dello schermo visibile
PLAYER_MAX_X    = 240       ; Limite destro per la posizione a 8-bit
PLAYER_SPEED    = 2         ; Pixel percorsi ad ogni frame dal giocatore
BULLET_SPEED    = 5         ; Pixel percorsi verso l'alto dal raggio laser

; ------------------------------------------------------------------------------
; ROUTINE: player_init
; DESCRIZIONE: Resetta le coordinate del giocatore, vite e proiettile.
; ------------------------------------------------------------------------------
player_init:
    lda #160
    sta ZP_PLAYER_X
    sta VIC_SPR0_X
    lda #228
    sta ZP_PLAYER_Y
    sta VIC_SPR0_Y

    lda #$00
    sta ZP_BULLET_ACTIVE
    sta ZP_FIRE_COOLDOWN

    ; Assicura che lo sprite del giocatore (Sprite 0) sia abilitato
    lda VIC_SPR_ENA
    ora #%00000001          ; Bit 0 = Sprite 0
    sta VIC_SPR_ENA
    rts

; ------------------------------------------------------------------------------
; ROUTINE: player_update
; DESCRIZIONE:
; Legge il joystick e aggiorna la posizione del giocatore e il fuoco.
; ------------------------------------------------------------------------------
player_update:
    ; Lettura del registro CIA 1 Port A ($DC00)
    lda CIA1_PORT_A

    ; --------------------------------------------------------------------------
    ; 1. CONTROLLO MOVIMENTO VERSO SINISTRA (Bit 2 del Joystick)
    ; --------------------------------------------------------------------------
    tax                     ; Salva lo stato completo del joystick in X
    and #JOY_LEFT           ; Isola il bit 2 (Sinistra)
    bne .check_right        ; Se è 1 (non premuto), passa al controllo destra

    ; Sposta a sinistra se non abbiamo raggiunto il margine minimo
    lda ZP_PLAYER_X
    sec
    sbc #PLAYER_SPEED
    cmp #PLAYER_MIN_X
    bcc .check_right        ; Se minore del margine minimo, non applicare
    sta ZP_PLAYER_X
    sta VIC_SPR0_X

.check_right:
    ; --------------------------------------------------------------------------
    ; 2. CONTROLLO MOVIMENTO VERSO DESTRA (Bit 3 del Joystick)
    ; --------------------------------------------------------------------------
    txa                     ; Recupera lo stato del joystick da X
    and #JOY_RIGHT          ; Isola il bit 3 (Destra)
    bne .check_fire         ; Se è 1 (non premuto), passa al controllo fuoco

    ; Sposta a destra se non abbiamo raggiunto il margine massimo
    lda ZP_PLAYER_X
    clc
    adc #PLAYER_SPEED
    cmp #PLAYER_MAX_X
    bcs .check_fire         ; Se supera il margine massimo, blocca
    sta ZP_PLAYER_X
    sta VIC_SPR0_X

.check_fire:
    ; --------------------------------------------------------------------------
    ; 3. CONTROLLO PULSANTE DI FUOCO (Bit 4 del Joystick)
    ; --------------------------------------------------------------------------
    txa                     ; Recupera stato joystick
    and #JOY_FIRE           ; Isola il bit 4 (Fuoco)
    bne .fire_released      ; Se è 1 (rilasciato), azzera il cooldown del fuoco

    ; Il tasto di fuoco è premuto!
    ; Controlla se il proiettile è già attivo o se siamo in cooldown
    lda ZP_BULLET_ACTIVE
    bne .done_player        ; Un solo colpo alla volta a schermo (regola Space Invaders!)
    lda ZP_FIRE_COOLDOWN
    bne .done_player        ; Cooldown attivo, attendi rilascio

    ; SPARA IL PROIETTILE!
    jsr player_spawn_bullet
    lda #$01
    sta ZP_FIRE_COOLDOWN    ; Imposta flag cooldown per evitare sparo continuo a raffica
    jmp .done_player

.fire_released:
    ; Tasto fuoco rilasciato, resetta cooldown
    lda #$00
    sta ZP_FIRE_COOLDOWN

.done_player:
    rts

; ------------------------------------------------------------------------------
; ROUTINE: player_spawn_bullet
; DESCRIZIONE:
; Crea il raggio laser centrato rispetto alla torretta del cannone ($D00C, $D00D)
; e avvia l'effetto sonoro PEW sul chip SID.
; ------------------------------------------------------------------------------
player_spawn_bullet:
    ; 1. Posiziona il proiettile al centro del giocatore (Player X + 8)
    lda ZP_PLAYER_X
    clc
    adc #8
    sta ZP_BULLET_X
    sta VIC_SPR6_X          ; Sprite 6 = Proiettile Giocatore

    ; 2. Posiziona il proiettile appena sopra la torretta (Player Y - 6)
    lda ZP_PLAYER_Y
    sec
    sbc #6
    sta ZP_BULLET_Y
    sta VIC_SPR6_Y

    ; 3. Attiva il flag proiettile attivo
    lda #$01
    sta ZP_BULLET_ACTIVE

    ; 4. Abilita lo Sprite 6 nel registro del VIC-II ($D015)
    lda VIC_SPR_ENA
    ora #%01000000          ; Bit 6 = Sprite 6
    sta VIC_SPR_ENA

    ; 5. Suona l'effetto sonoro di sparo laser sul chip SID
    jsr sid_play_shoot
    rts

; ------------------------------------------------------------------------------
; ROUTINE: bullet_update
; DESCRIZIONE:
; Muove il proiettile laser verso l'alto di BULLET_SPEED pixel per frame.
; Se supera la cima dello schermo visibile (Y < 40), lo disattiva.
; ------------------------------------------------------------------------------
bullet_update:
    lda ZP_BULLET_ACTIVE
    beq .no_bullet          ; Se il proiettile non è attivo, esci immediatamente

    ; Muove il proiettile verso l'alto
    lda ZP_BULLET_Y
    sec
    sbc #BULLET_SPEED
    bcc .kill_bullet        ; Se va in underflow (fuori schermo in alto), disattiva
    cmp #42                 ; Bordo superiore dell'area di gioco
    bcc .kill_bullet

    ; Salva la nuova coordinata Y e aggiorna il registro hardware VIC-II dello Sprite 6
    sta ZP_BULLET_Y
    sta VIC_SPR6_Y
    rts

.kill_bullet:
    ; Disattiva il proiettile
    lda #$00
    sta ZP_BULLET_ACTIVE

    ; Spegne lo Sprite 6 nel registro $D015
    lda VIC_SPR_ENA
    and #%10111111          ; Spegne bit 6
    sta VIC_SPR_ENA

.no_bullet:
    rts
