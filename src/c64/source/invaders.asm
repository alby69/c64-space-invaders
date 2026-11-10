; ==============================================================================
; COMMODORE 64 SPACE INVADERS - FILE: invaders.asm
; ==============================================================================
; Gestione dello Sciame di Invasori Alieni (Invader Swarm) e delle Bombe Alieni.
; 
; MECCANICA DI GIOCO ORIGINALE:
; - Lo sciame si muove in formazione a griglia da sinistra a destra.
; - Al raggiungimento del bordo destro, lo sciame scende di una riga (8 pixel)
;   e inverte la marcia muovendosi verso sinistra.
; - Ad ogni passo:
;   1. Si alternano i frame grafici degli sprite (A <-> B)
;   2. Il chip SID suona il battito successivo della marcia a 4 note
;   3. Più alieni vengono eliminati, più il timer del passo diminuisce,
;      accelerando la marcia fino al parossismo finale quando ne resta solo uno!
; ==============================================================================

!src "constants.inc"

INV_MIN_X       = 32        ; Margine sinistro dello sciame
INV_MAX_X       = 230       ; Margine destro prima dell'inversione
INV_DROP_STEP   = 8         ; Discesa in pixel ad ogni inversione
BOMB_SPEED      = 2         ; Velocità di caduta delle bombe aliene

; ------------------------------------------------------------------------------
; ROUTINE: invaders_init
; DESCRIZIONE: Inizializza le posizioni e le variabili per una nuova ondata.
; ------------------------------------------------------------------------------
invaders_init:
    lda #40                 ; Posizione X di partenza
    sta ZP_INV_BASE_X
    lda #70                 ; Posizione Y di partenza
    sta ZP_INV_BASE_Y

    lda #$01                ; Direzione iniziale: 1 = Verso Destra
    sta ZP_INV_DIR

    lda #24                 ; Numero di alieni nello sciame (3 righe da 8 alieni)
    sta ZP_INV_ALIVE_CNT

    lda #30                 ; Timer iniziale del passo (circa 0.6 secondi)
    sta ZP_INV_SPEED
    sta ZP_INV_STEP_TIMER

    lda #$00
    sta ZP_INV_ANIM_FRAME
    sta ZP_BOMB_ACTIVE

    ; Aggiorna le coordinate iniziali degli sprite pilota dello sciame
    jsr invaders_refresh_sprites
    rts

; ------------------------------------------------------------------------------
; ROUTINE: invaders_update
; DESCRIZIONE:
; Chiamata ad ogni frame: decrementa il timer del passo; quando scade,
; muove lo sciame, suona la marcia SID e alterna il frame di animazione.
; ------------------------------------------------------------------------------
invaders_update:
    ; 1. Decrementa il timer tra un passo e l'altro
    dec ZP_INV_STEP_TIMER
    bne .update_bombs       ; Se non è scaduto, aggiorna solo le bombe e ritorna

    ; 2. Il timer è scaduto: resetta al valore di velocità attuale
    lda ZP_INV_SPEED
    sta ZP_INV_STEP_TIMER

    ; 3. Suona la marcia a 4 note sul chip SID (Voce 2)
    jsr sid_play_march

    ; 4. Alterna il frame di animazione tra A e B (0 <-> 1)
    lda ZP_INV_ANIM_FRAME
    eor #$01                ; Inverte il bit 0
    sta ZP_INV_ANIM_FRAME
    jsr invaders_toggle_animation

    ; 5. Sposta lo sciame orizzontalmente
    lda ZP_INV_DIR
    bne .move_right

    ; --------------------------------------------------------------------------
    ; MOVIMENTO VERSO SINISTRA
    ; --------------------------------------------------------------------------
    lda ZP_INV_BASE_X
    sec
    sbc #4
    cmp #INV_MIN_X
    bcc .drop_and_reverse_right
    sta ZP_INV_BASE_X
    jmp .refresh_pos

.drop_and_reverse_right:
    ; Raggiunto il bordo sinistro: scendi di una riga e inverti a destra
    lda ZP_INV_BASE_Y
    clc
    adc #INV_DROP_STEP
    sta ZP_INV_BASE_Y
    lda #$01
    sta ZP_INV_DIR
    jmp .refresh_pos

    ; --------------------------------------------------------------------------
    ; MOVIMENTO VERSO DESTRA
    ; --------------------------------------------------------------------------
.move_right:
    lda ZP_INV_BASE_X
    clc
    adc #4
    cmp #INV_MAX_X
    bcs .drop_and_reverse_left
    sta ZP_INV_BASE_X
    jmp .refresh_pos

.drop_and_reverse_left:
    ; Raggiunto il bordo destro: scendi di una riga e inverti a sinistra
    lda ZP_INV_BASE_Y
    clc
    adc #INV_DROP_STEP
    sta ZP_INV_BASE_Y
    lda #$00
    sta ZP_INV_DIR

.refresh_pos:
    jsr invaders_refresh_sprites

.update_bombs:
    jsr bomb_update
    rts

; ------------------------------------------------------------------------------
; ROUTINE: invaders_toggle_animation
; DESCRIZIONE:
; Aggiorna i puntatori degli sprite ($07F9, $07FA, $07FB) tra Frame A e Frame B.
; ------------------------------------------------------------------------------
invaders_toggle_animation:
    lda ZP_INV_ANIM_FRAME
    bne .frame_b

    ; FRAME A
    lda #SPRITE_BLOCK_START + 1     ; Squid A ($81)
    sta SPRITE_PTR_1
    lda #SPRITE_BLOCK_START + 3     ; Crab A ($83)
    sta SPRITE_PTR_2
    lda #SPRITE_BLOCK_START + 5     ; Octopus A ($85)
    sta SPRITE_PTR_3
    rts

.frame_b:
    ; FRAME B
    lda #SPRITE_BLOCK_START + 2     ; Squid B ($82)
    sta SPRITE_PTR_1
    lda #SPRITE_BLOCK_START + 4     ; Crab B ($84)
    sta SPRITE_PTR_2
    lda #SPRITE_BLOCK_START + 6     ; Octopus B ($86)
    sta SPRITE_PTR_3
    rts

; ------------------------------------------------------------------------------
; ROUTINE: invaders_refresh_sprites
; DESCRIZIONE:
; Calcola le coordinate X/Y per i 3 tipi di invasori in base a ZP_INV_BASE_X/Y.
; ------------------------------------------------------------------------------
invaders_refresh_sprites:
    ; Riga Superiore: Invasore 1 (Squid - Sprite 1)
    lda ZP_INV_BASE_X
    sta VIC_SPR1_X
    lda ZP_INV_BASE_Y
    sta VIC_SPR1_Y

    ; Riga Centrale: Invasore 2 (Crab - Sprite 2, 20 pixel sotto)
    lda ZP_INV_BASE_X
    clc
    adc #24
    sta VIC_SPR2_X
    lda ZP_INV_BASE_Y
    clc
    adc #22
    sta VIC_SPR2_Y

    ; Riga Inferiore: Invasore 3 (Octopus - Sprite 3, 44 pixel sotto)
    lda ZP_INV_BASE_X
    clc
    adc #48
    sta VIC_SPR3_X
    lda ZP_INV_BASE_Y
    clc
    adc #44
    sta VIC_SPR3_Y

    rts

; ------------------------------------------------------------------------------
; ROUTINE: invaders_on_hit
; DESCRIZIONE:
; Chiamata quando un invasore viene colpito dal raggio laser del giocatore.
; 1. Decrementa il conteggio alieni vivi
; 2. Aumenta la velocità dello sciame (diminuisce ZP_INV_SPEED)
; 3. Suona l'esplosione sul chip SID
; 4. Aggiunge i punti al punteggio del giocatore
; ------------------------------------------------------------------------------
invaders_on_hit:
    ; Suona l'esplosione su SID Voce 3
    jsr sid_play_explosion

    ; Decrementa alieni rimasti
    dec ZP_INV_ALIVE_CNT
    beq .wave_cleared       ; Se sono finiti tutti, ondata completata!

    ; Accelera lo sciame: ogni 2 alieni distrutti, riduci il tempo del passo
    lda ZP_INV_SPEED
    cmp #4                  ; Velocità massima di sicurezza
    bcc .done_hit
    sec
    sbc #1
    sta ZP_INV_SPEED
.done_hit:
    rts

.wave_cleared:
    ; Segnala passaggio alla nuova ondata
    lda #$03                ; STATE_NEXT_WAVE
    sta ZP_GAME_STATE
    rts

; ------------------------------------------------------------------------------
; ROUTINE: bomb_update
; DESCRIZIONE:
; Gestisce la caduta della bomba aliena verso il basso (Sprite 7).
; Se non c'è una bomba attiva, ha una probabilità random di generarne una.
; ------------------------------------------------------------------------------
bomb_update:
    lda ZP_BOMB_ACTIVE
    bne .move_bomb

    ; Nessuna bomba attiva: prova a lanciarne una
    ; Usiamo il registro raster del VIC-II come generatore pseudo-casuale
    lda VIC_RASTER
    and #%00011111          ; Maschera 5 bit (valori 0-31)
    bne .no_new_bomb        ; Se non è zero, non sparare in questo frame

    ; Genera nuova bomba alla posizione dello sciame
    lda ZP_INV_BASE_X
    clc
    adc #24
    sta ZP_BOMB_X
    sta VIC_SPR7_X

    lda ZP_INV_BASE_Y
    clc
    adc #50
    sta ZP_BOMB_Y
    sta VIC_SPR7_Y

    lda #$01
    sta ZP_BOMB_ACTIVE

    ; Abilita Sprite 7 nel VIC-II
    lda VIC_SPR_ENA
    ora #%10000000          ; Bit 7
    sta VIC_SPR_ENA
.no_new_bomb:
    rts

.move_bomb:
    ; Muove la bomba verso il basso
    lda ZP_BOMB_Y
    clc
    adc #BOMB_SPEED
    cmp #245                ; Oltrepassato il fondo dello schermo?
    bcs .kill_bomb
    sta ZP_BOMB_Y
    sta VIC_SPR7_Y
    rts

.kill_bomb:
    lda #$00
    sta ZP_BOMB_ACTIVE
    lda VIC_SPR_ENA
    and #%01111111          ; Spegne Sprite 7
    sta VIC_SPR_ENA
    rts
