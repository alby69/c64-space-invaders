; ==============================================================================
; COMMODORE 64 SPACE INVADERS - FILE: sid.asm
; ==============================================================================
; Questo file implementa il driver sonoro per il leggendario chip SID (MOS 6581).
; 
; FUNZIONALITÀ AUDIO IMPLEMENTATE:
; 1. VOCE 1 ($D400-$D406): Sparo Laser del Giocatore (Laser Cannon Shot)
;    - Forma d'onda: Triangolare/Dente di sega con sweep discendente di frequenza
;    - Inviluppo ADSR: Attacco istantaneo (0), Decay rapido (5), Sustain zero (0)
; 2. VOCE 2 ($D407-$D40D): Marcia Ossessiva a 4 Note degli Space Invaders
;    - 4 note basse discendenti (Basso ritmico a passo di marcia):
;      Nota 1: Fa# (F#1) -> $0470
;      Nota 2: Mi  (E1)  -> $03F0
;      Nota 3: Re  (D1)  -> $0380
;      Nota 4: Do  (C1)  -> $0320
;    - Forma d'onda: Dente di sega ($21 = Sawtooth + Gate)
; 3. VOCE 3 ($D40E-$D414): Esplosione Aliena e Distruzione Giocatore
;    - Forma d'onda: Rumore Bianco ($81 = White Noise + Gate)
;    - Inviluppo ADSR: Attacco 0, Decay lungo per simulare un boato metallico
; 4. VOCE 1 (Alternativa): Sirena UFO Misterioso
;    - Forma d'onda: Triangolare con frequenza oscillante bitonale
; ==============================================================================

!src "constants.inc"

; ------------------------------------------------------------------------------
; TABELLA FREQUENZE PER LA MARCIA DEGLI INVADERS (4 NOTE BASSE)
; In SID, il valore della frequenza F_out = (F_reg * 0.05960464) Hz (su PAL)
; ------------------------------------------------------------------------------
march_freq_lo:
    !byte $70, $F0, $80, $20    ; Byte bassi delle 4 note
march_freq_hi:
    !byte $04, $03, $03, $03    ; Byte alti delle 4 note

; ------------------------------------------------------------------------------
; ROUTINE: sid_init
; DESCRIZIONE:
; Inizializza il chip SID spegnendo tutte le voci e impostando il volume al massimo.
; ------------------------------------------------------------------------------
sid_init:
    ; Azzera tutti i registri SID da $D400 a $D41C (29 registri)
    ldx #$1C
    lda #$00
.clear_loop:
    sta $D400, x
    dex
    bpl .clear_loop

    ; Imposta il volume master al massimo (15 su una scala da 0 a 15)
    ; I 4 bit inferiori del registro $D418 controllano il volume principale:
    ; $0F = 0000 1111 (Volume 15, nessun filtro passa-alto/basso forzato)
    lda #$0F
    sta SID_VOL_CTRL

    ; Inizializza i timer software degli effetti sonori in Pagina Zero
    lda #$00
    sta ZP_SFX_SHOOT_TMR
    sta ZP_SFX_EXPL_TMR
    sta ZP_SFX_UFO_TMR
    sta ZP_INV_MARCH_NOTE
    rts

; ------------------------------------------------------------------------------
; ROUTINE: sid_stop_all
; DESCRIZIONE: Spegne istantaneamente tutte le 3 voci del SID
; ------------------------------------------------------------------------------
sid_stop_all:
    lda #$00
    sta SID_V1_CTRL     ; Spegne Voce 1 (Gate = 0)
    sta SID_V2_CTRL     ; Spegne Voce 2 (Gate = 0)
    sta SID_V3_CTRL     ; Spegne Voce 3 (Gate = 0)
    rts

; ------------------------------------------------------------------------------
; ROUTINE: sid_play_shoot
; DESCRIZIONE:
; Avvia l'effetto sonoro del laser del cannone sulla VOCE 1.
; Crea un tipico suono "PEW" arcade con sweep di frequenza discendente.
; ------------------------------------------------------------------------------
sid_play_shoot:
    ; 1. Spegne temporaneamente la voce per resettare l'inviluppo
    lda #$00
    sta SID_V1_CTRL

    ; 2. Frequenza iniziale acuta (circa 1200 Hz): byte alto=$18, basso=$00
    lda #$00
    sta SID_V1_FREQ_LO
    lda #$1E
    sta SID_V1_FREQ_HI

    ; 3. Inviluppo ADSR: Attack rapido (0), Decay medio (4)
    ; Registro $D405: i 4 bit alti sono Attack, i 4 bit bassi Decay -> $04
    lda #$04
    sta SID_V1_AD

    ; Registro $D406: Sustain 0 (nessuna tenuta), Release rapido (2) -> $02
    lda #$02
    sta SID_V1_SR

    ; 4. Attiva l'oscillatore con forma d'onda Triangolare ($10) + Gate On ($01)
    ; $10 | $01 = $11
    lda #(SID_WAVE_TRI | SID_WAVE_GATE)
    sta SID_V1_CTRL

    ; Imposta il contatore di frame per la durata dello sweep laser
    lda #18
    sta ZP_SFX_SHOOT_TMR
    rts

; ------------------------------------------------------------------------------
; ROUTINE: sid_play_march
; DESCRIZIONE:
; Suona la nota corrente della celebre marcia a 4 battiti degli invasori (Voce 2).
; Ad ogni passo della flotta aliena, questa routine viene chiamata per dare il ritmo.
; ------------------------------------------------------------------------------
sid_play_march:
    ; Spegne il gate precedente per consentire il re-trigger
    lda #$00
    sta SID_V2_CTRL

    ; Carica l'indice della nota corrente (0, 1, 2, 3)
    ldx ZP_INV_MARCH_NOTE

    ; Imposta la frequenza della nota caricando i byte dalla tabella
    lda march_freq_lo, x
    sta SID_V2_FREQ_LO
    lda march_freq_hi, x
    sta SID_V2_FREQ_HI

    ; Imposta inviluppo percussivo secco (Attack=0, Decay=6, Sustain=0, Release=2)
    lda #$06
    sta SID_V2_AD
    lda #$02
    sta SID_V2_SR

    ; Attiva Voce 2 con forma d'onda a Dente di Sega (Sawtooth) + Gate
    ; $20 | $01 = $21 (produce un basso caldo e penetrante caratteristico del 6581)
    lda #(SID_WAVE_SAW | SID_WAVE_GATE)
    sta SID_V2_CTRL

    ; Avanza alla nota successiva per il prossimo battito: 0 -> 1 -> 2 -> 3 -> 0
    inx
    cpx #$04
    bcc .save_note
    ldx #$00            ; Ricomincia dalla prima nota dopo la quarta
.save_note:
    stx ZP_INV_MARCH_NOTE
    rts

; ------------------------------------------------------------------------------
; ROUTINE: sid_play_explosion
; DESCRIZIONE:
; Genera l'esplosione quando un invasore o il cannone viene distrutto (Voce 3).
; Utilizza il generatore di Rumore Bianco (White Noise) hardware del SID.
; ------------------------------------------------------------------------------
sid_play_explosion:
    ; Reset gate voce 3
    lda #$00
    sta SID_V3_CTRL

    ; Frequenza del generatore di rumore (impatto profondo a bassa frequenza)
    lda #$20
    sta SID_V3_FREQ_LO
    lda #$08
    sta SID_V3_FREQ_HI

    ; Attack nullo (0), Decay prolungato (A = 10) per simulare l'eco dell'esplosione
    lda #$0A
    sta SID_V3_AD

    ; Sustain 0, Release medio (4)
    lda #$04
    sta SID_V3_SR

    ; Attiva Voce 3 con Rumore Bianco ($80) + Gate ($01) = $81
    lda #(SID_WAVE_NOISE | SID_WAVE_GATE)
    sta SID_V3_CTRL

    ; Timer per il decadimento del rumore
    lda #32
    sta ZP_SFX_EXPL_TMR
    rts

; ------------------------------------------------------------------------------
; ROUTINE: sid_play_ufo
; DESCRIZIONE:
; Attiva il caratteristico ronzio/sirena continua dell'UFO misterioso (Voce 1).
; ------------------------------------------------------------------------------
sid_play_ufo:
    lda #$00
    sta SID_V1_FREQ_LO
    lda #$20
    sta SID_V1_FREQ_HI

    lda #$22
    sta SID_V1_AD
    lda #$88
    sta SID_V1_SR

    lda #(SID_WAVE_PULSE | SID_WAVE_GATE)
    sta SID_V1_CTRL
    rts

; ------------------------------------------------------------------------------
; ROUTINE: sid_tick
; DESCRIZIONE:
; Viene chiamata una volta per frame (ad ogni sincronizzazione raster a 50Hz/60Hz).
; Gestisce l'evoluzione temporale degli effetti sonori (sweep di frequenza,
; spegnimento del gate quando i suoni terminano).
; ------------------------------------------------------------------------------
sid_tick:
    ; 1. GESTIONE SWEEP LASER (VOCE 1)
    lda ZP_SFX_SHOOT_TMR
    beq .check_explosion        ; Se il timer è zero, salta
    dec ZP_SFX_SHOOT_TMR
    bne .laser_sweep
    ; Se il timer laser ha raggiunto lo zero, spegni il Gate
    lda #$00
    sta SID_V1_CTRL
    jmp .check_explosion

.laser_sweep:
    ; Fai scendere la frequenza della Voce 1 di 2 unità ad ogni frame
    ; Questo genera il tipico effetto discendente "Pewwww"
    lda SID_V1_FREQ_HI
    sec
    sbc #$02
    bcs .store_laser_freq
    lda #$00
.store_laser_freq:
    sta SID_V1_FREQ_HI

.check_explosion:
    ; 2. GESTIONE TIMER ESPLOSIONE (VOCE 3)
    lda ZP_SFX_EXPL_TMR
    beq .done
    dec ZP_SFX_EXPL_TMR
    bne .done
    ; Spegni il gate del rumore bianco quando il timer scade
    lda #$00
    sta SID_V3_CTRL

.done:
    rts
