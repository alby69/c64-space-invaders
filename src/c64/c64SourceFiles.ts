import JSZip from 'jszip';
import { generateC64Prg } from './c64BinaryGenerator';

export interface SourceFileItem {
  id: string;
  name: string;
  language: 'assembly' | 'makefile' | 'batch' | 'bash' | 'markdown';
  category: 'core' | 'driver' | 'data' | 'build';
  description: string;
  hardwareFocus: string;
  content: string;
}

export const C64_SOURCE_FILES: SourceFileItem[] = [
  {
    id: 'main-asm',
    name: 'main.asm',
    language: 'assembly',
    category: 'core',
    description: 'Punto di ingresso principale del programma, stub BASIC (10 SYS 2064), ciclo principale e collisioni.',
    hardwareFocus: 'CPU 6502 / 6510, Raster Loop, BASIC Start $0801',
    content: `; ==============================================================================
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
`
  },
  {
    id: 'constants-inc',
    name: 'constants.inc',
    language: 'assembly',
    category: 'core',
    description: 'Registri hardware del C64 (VIC-II, SID, CIA 1), colori e allocazione della Pagina Zero ($02-$80).',
    hardwareFocus: 'Memory Map: $D000, $D400, $DC00, Zero Page',
    content: `; ==============================================================================
; COMMODORE 64 SPACE INVADERS - FILE: constants.inc
; ==============================================================================
; Registri hardware del C64, costanti video e allocazione Pagina Zero
; ==============================================================================

; REGISTRI VIC-II ($D000 - $D02E)
VIC_SPR0_X      = $D000     ; Coordinata X Sprite 0 (Player)
VIC_SPR0_Y      = $D001     ; Coordinata Y Sprite 0
VIC_SPR1_X      = $D002     ; Coordinata X Sprite 1 (Invader 1)
VIC_SPR1_Y      = $D003     ; Coordinata Y Sprite 1
VIC_SPR2_X      = $D004     ; Coordinata X Sprite 2 (Invader 2)
VIC_SPR2_Y      = $D005     ; Coordinata Y Sprite 2
VIC_SPR3_X      = $D006     ; Coordinata X Sprite 3 (Invader 3)
VIC_SPR3_Y      = $D007     ; Coordinata Y Sprite 3
VIC_SPR4_X      = $D008     ; Coordinata X Sprite 4 (UFO / Saucer)
VIC_SPR4_Y      = $D009     ; Coordinata Y Sprite 4
VIC_SPR5_X      = $D00A     ; Coordinata X Sprite 5 (Esplosione)
VIC_SPR5_Y      = $D00B     ; Coordinata Y Sprite 5
VIC_SPR6_X      = $D00C     ; Coordinata X Sprite 6 (Proiettile Giocatore)
VIC_SPR6_Y      = $D00D     ; Coordinata Y Sprite 6
VIC_SPR7_X      = $D00E     ; Coordinata X Sprite 7 (Bomba Aliena)
VIC_SPR7_Y      = $D00F     ; Coordinata Y Sprite 7

VIC_SPR_X_MSB   = $D010     ; 9° bit coordinate X (bit 0-7)
VIC_CTRL_1      = $D011     ; Registro di controllo 1 (linea raster bit 8, schermo on)
VIC_RASTER      = $D012     ; Linea di raster corrente (0-255)
VIC_SPR_ENA     = $D015     ; Abilitazione sprite (1=on, 0=off)
VIC_CTRL_2      = $D016     ; Registro di controllo 2
VIC_SPR_EXP_Y   = $D017     ; Espansione Y sprite (raddoppia a 42 pixel)
VIC_MEM_SETUP   = $D018     ; Configurazione locazione RAM schermo
VIC_IRQ_STATUS  = $D019     ; Flag interrupt raster
VIC_SPR_MCOLOR  = $D01C     ; Modalità multicolore sprite
VIC_SPR_EXP_X   = $D01D     ; Espansione X sprite (raddoppia a 48 pixel)

VIC_BORDER_COL  = $D020     ; Colore del bordo (0-15)
VIC_BG_COL0     = $D021     ; Colore sfondo principale 0
VIC_SPR0_COL    = $D027     ; Colore individuale Sprite 0 (Player)
VIC_SPR1_COL    = $D028     ; Colore individuale Sprite 1
VIC_SPR2_COL    = $D029     ; Colore individuale Sprite 2
VIC_SPR3_COL    = $D02A     ; Colore individuale Sprite 3
VIC_SPR4_COL    = $D02B     ; Colore individuale Sprite 4
VIC_SPR5_COL    = $D02C     ; Colore individuale Sprite 5
VIC_SPR6_COL    = $D02D     ; Colore individuale Sprite 6
VIC_SPR7_COL    = $D02E     ; Colore individuale Sprite 7

; REGISTRI SID ($D400 - $D41C)
SID_V1_FREQ_LO  = $D400     ; Frequenza Voce 1 (basso)
SID_V1_FREQ_HI  = $D401     ; Frequenza Voce 1 (alto)
SID_V1_PW_LO    = $D402     ; Pulse Width Voce 1
SID_V1_PW_HI    = $D403
SID_V1_CTRL     = $D404     ; Controllo forma d'onda Voce 1
SID_V1_AD       = $D405     ; Attack / Decay Voce 1
SID_V1_SR       = $D406     ; Sustain / Release Voce 1

SID_V2_FREQ_LO  = $D407     ; Frequenza Voce 2 (Marcia 4 note)
SID_V2_FREQ_HI  = $D408
SID_V2_CTRL     = $D40B
SID_V2_AD       = $D40C
SID_V2_SR       = $D40D

SID_V3_FREQ_LO  = $D40E     ; Frequenza Voce 3 (Esplosione Noise)
SID_V3_FREQ_HI  = $D40F
SID_V3_CTRL     = $D412
SID_V3_AD       = $D413
SID_V3_SR       = $D414

SID_VOL_CTRL    = $D418     ; Volume Master (0-15 nei 4 bit bassi)

; FORME D'ONDA SID
SID_WAVE_GATE   = $01       ; Gate On (Start sound)
SID_WAVE_TRI    = $10       ; Onda Triangolare
SID_WAVE_SAW    = $20       ; Onda a Dente di Sega
SID_WAVE_PULSE  = $40       ; Onda Quadra / Rettangolare
SID_WAVE_NOISE  = $80       ; Rumore Bianco

; CIA 1 E JOYSTICK PORTA 2 ($DC00)
CIA1_PORT_A     = $DC00
JOY_UP          = $01
JOY_DOWN        = $02
JOY_LEFT        = $04
JOY_RIGHT       = $08
JOY_FIRE        = $10

; MAPPA MEMORIA SCHERMO E SPRITE
SCREEN_RAM      = $0400     ; 40x25 = 1000 byte
COLOR_RAM       = $D800     ; RAM colori testo
SPRITE_PTR_BASE = $07F8     ; Ultimi 8 byte per puntatori sprite
SPRITE_PTR_0    = $07F8
SPRITE_PTR_1    = $07F9
SPRITE_PTR_2    = $07FA
SPRITE_PTR_3    = $07FB
SPRITE_PTR_4    = $07FC
SPRITE_PTR_5    = $07FD
SPRITE_PTR_6    = $07FE
SPRITE_PTR_7    = $07FF

SPRITE_MEM_ADDR = $2000     ; Dati Sprite a $2000 (8192)
SPRITE_BLOCK_START = $80    ; $2000 / 64 = $80

; COLORI COMMODORE 64
COLOR_BLACK     = 0
COLOR_WHITE     = 1
COLOR_RED       = 2
COLOR_CYAN      = 3
COLOR_PURPLE    = 4
COLOR_GREEN     = 5
COLOR_BLUE      = 6
COLOR_YELLOW    = 7
COLOR_ORANGE    = 8
COLOR_LIGHTRED  = 10
COLOR_LIGHTGREEN= 13
COLOR_LIGHTBLUE = 14

; VARIABILI IN PAGINA ZERO ($02 - $80)
ZP_GAME_STATE   = $02       ; 0=Titolo, 1=In Gioco, 2=Game Over, 3=Nuova Ondata
ZP_FRAME_COUNT  = $03
ZP_PLAYER_X     = $04
ZP_PLAYER_Y     = $05
ZP_PLAYER_LIVES = $06
ZP_FIRE_COOLDOWN= $07
ZP_BULLET_ACTIVE= $08
ZP_BULLET_X     = $09
ZP_BULLET_Y     = $0A
ZP_BOMB_ACTIVE  = $0B
ZP_BOMB_X       = $0C
ZP_BOMB_Y       = $0D
ZP_INV_BASE_X   = $0E
ZP_INV_BASE_Y   = $0F
ZP_INV_DIR      = $10
ZP_INV_STEP_TIMER= $11
ZP_INV_SPEED    = $12
ZP_INV_ALIVE_CNT= $13
ZP_INV_ANIM_FRAME= $14
ZP_INV_MARCH_NOTE=$15
ZP_SCORE_LO     = $16
ZP_SCORE_HI     = $17
ZP_SFX_SHOOT_TMR= $1D
ZP_SFX_EXPL_TMR = $1E
`
  },
  {
    id: 'sid-asm',
    name: 'sid.asm',
    language: 'assembly',
    category: 'driver',
    description: 'Driver sonoro per il chip MOS 6581 SID: laser sweep, marcia 4 note, rumore bianco per esplosioni.',
    hardwareFocus: 'MOS 6581 SID, Voice 1/2/3, ADSR, Waveforms, Frequency Registers',
    content: `; ==============================================================================
; COMMODORE 64 SPACE INVADERS - FILE: sid.asm
; ==============================================================================
; Driver audio per chip sonoro SID (MOS 6581 / 8580).
; ==============================================================================

!src "constants.inc"

; Frequenze per la marcia a 4 note degli Invaders (Voce 2)
march_freq_lo:
    !byte $70, $F0, $80, $20    ; Byte bassi delle 4 note
march_freq_hi:
    !byte $04, $03, $03, $03    ; Byte alti delle 4 note

sid_init:
    ; Azzera tutti i registri SID ($D400 - $D41C)
    ldx #$1C
    lda #$00
.clear_loop:
    sta $D400, x
    dex
    bpl .clear_loop

    ; Volume Master al massimo (15 nei 4 bit bassi di $D418)
    lda #$0F
    sta SID_VOL_CTRL

    lda #$00
    sta ZP_SFX_SHOOT_TMR
    sta ZP_SFX_EXPL_TMR
    sta ZP_INV_MARCH_NOTE
    rts

sid_play_shoot:
    ; VOCE 1: Sparo Laser Giocatore
    lda #$00
    sta SID_V1_CTRL

    ; Frequenza iniziale acuta (1200 Hz)
    lda #$00
    sta SID_V1_FREQ_LO
    lda #$1E
    sta SID_V1_FREQ_HI

    ; Attack=0, Decay=4
    lda #$04
    sta SID_V1_AD
    ; Sustain=0, Release=2
    lda #$02
    sta SID_V1_SR

    ; Forma d'onda Triangolare ($10) + Gate On ($01) = $11
    lda #(SID_WAVE_TRI | SID_WAVE_GATE)
    sta SID_V1_CTRL

    lda #18
    sta ZP_SFX_SHOOT_TMR
    rts

sid_play_march:
    ; VOCE 2: Marcia Invasori (4 note percussive)
    lda #$00
    sta SID_V2_CTRL

    ldx ZP_INV_MARCH_NOTE
    lda march_freq_lo, x
    sta SID_V2_FREQ_LO
    lda march_freq_hi, x
    sta SID_V2_FREQ_HI

    ; Attack=0, Decay=6, Sustain=0, Release=2
    lda #$06
    sta SID_V2_AD
    lda #$02
    sta SID_V2_SR

    ; Dente di Sega (Sawtooth $20) + Gate ($01) = $21
    lda #(SID_WAVE_SAW | SID_WAVE_GATE)
    sta SID_V2_CTRL

    inx
    cpx #$04
    bcc .save_note
    ldx #$00
.save_note:
    stx ZP_INV_MARCH_NOTE
    rts

sid_play_explosion:
    ; VOCE 3: Esplosione a Rumore Bianco
    lda #$00
    sta SID_V3_CTRL

    lda #$20
    sta SID_V3_FREQ_LO
    lda #$08
    sta SID_V3_FREQ_HI

    ; Attack=0, Decay=10 (prolungato)
    lda #$0A
    sta SID_V3_AD
    lda #$04
    sta SID_V3_SR

    ; Rumore Bianco (White Noise $80) + Gate ($01) = $81
    lda #(SID_WAVE_NOISE | SID_WAVE_GATE)
    sta SID_V3_CTRL

    lda #32
    sta ZP_SFX_EXPL_TMR
    rts

sid_tick:
    ; Aggiorna sweep laser Voce 1
    lda ZP_SFX_SHOOT_TMR
    beq .check_explosion
    dec ZP_SFX_SHOOT_TMR
    bne .laser_sweep
    lda #$00
    sta SID_V1_CTRL
    jmp .check_explosion

.laser_sweep:
    lda SID_V1_FREQ_HI
    sec
    sbc #$02
    bcs .store_laser_freq
    lda #$00
.store_laser_freq:
    sta SID_V1_FREQ_HI

.check_explosion:
    lda ZP_SFX_EXPL_TMR
    beq .done
    dec ZP_SFX_EXPL_TMR
    bne .done
    lda #$00
    sta SID_V3_CTRL

.done:
    rts
`
  },
  {
    id: 'sprites-asm',
    name: 'sprites.asm',
    language: 'assembly',
    category: 'data',
    description: 'Matrici bitmap degli sprite a 24x21 pixel (64 byte ciascuno a partire da $2000 blocco $80).',
    hardwareFocus: 'VIC-II Sprite Data Format (3 bytes x 21 rows = 63 bytes + 1 padding byte)',
    content: `; ==============================================================================
; COMMODORE 64 SPACE INVADERS - FILE: sprites.asm
; ==============================================================================
; Dati bitmap degli sprite per il chip VIC-II (blocco $80 = $2000).
; 24x21 pixel: 3 byte per riga x 21 righe = 63 byte + 1 byte padding = 64 byte.
; ==============================================================================

* = $2000

; BLOCCO $80 ($2000): CANNONE DIFENSIVO GIOCATORE (24x21 PIXEL - CENTRATO)
sprite_player:
    !byte %00000000, %00011000, %00000000
    !byte %00000000, %00011000, %00000000
    !byte %00000000, %00111100, %00000000
    !byte %00000000, %00111100, %00000000
    !byte %00000000, %01111110, %00000000
    !byte %00001111, %11111111, %11110000
    !byte %00011111, %11111111, %11111000
    !byte %00111111, %11111111, %11111100
    !byte %00111111, %11111111, %11111100
    !byte %00111111, %11111111, %11111100
    !byte %00111111, %11111111, %11111100
    !byte %00110011, %11111111, %11001100
    !byte %00110001, %11111111, %10001100
    !byte %00110000, %00000000, %00001100
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte $00

; BLOCCO $81 ($2040): INVASORE 1 (SQUID) - FRAME A (CENTRATO)
sprite_invader1_a:
    !byte %00000000, %00111100, %00000000
    !byte %00000000, %11111111, %00000000
    !byte %00000001, %11111111, %10000000
    !byte %00000011, %10011001, %11000000
    !byte %00000011, %11111111, %11000000
    !byte %00000000, %11000011, %00000000
    !byte %00000001, %10111101, %10000000
    !byte %00000011, %00100100, %11000000
    !byte %00000110, %00000000, %01100000
    !byte %00001100, %00000000, %00110000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte $00

; BLOCCO $83 ($20C0): INVASORE 2 (CRAB) - FRAME A (CENTRATO)
sprite_invader2_a:
    !byte %00001100, %00000000, %00110000
    !byte %00000110, %00000000, %01100000
    !byte %00001111, %11111111, %11110000
    !byte %00011100, %11111111, %00111000
    !byte %00111111, %11111111, %11111100
    !byte %00110111, %11111111, %11101100
    !byte %00110110, %00000000, %01101100
    !byte %00000011, %00000000, %11000000
    !byte %00000110, %00000000, %01100000
    !byte %00001100, %00000000, %00110000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte %00000000, %00000000, %00000000
    !byte $00
`
  },
  {
    id: 'vic-asm',
    name: 'vic.asm',
    language: 'assembly',
    category: 'driver',
    description: 'Inizializzazione del display VIC-II, impostazione colori bordo e sfondo, configurazione registri sprite.',
    hardwareFocus: 'MOS 6569 VIC-II, Border ($D020), Background ($D021), Sprite Pointers ($07F8)',
    content: `; ==============================================================================
; COMMODORE 64 SPACE INVADERS - FILE: vic.asm
; ==============================================================================
; Gestione del chip video VIC-II e sincronizzazione raster.
; ==============================================================================

!src "constants.inc"

vic_init:
    ; Bordo e sfondo neri per look arcade
    lda #COLOR_BLACK
    sta VIC_BORDER_COL      ; $D020 = 0
    sta VIC_BG_COL0         ; $D021 = 0

    ; Pulizia RAM schermo ($0400) e RAM colori ($D800)
    ldx #$00
    lda #$20                ; Codice PETSCII spazio
    ldy #COLOR_WHITE
.clear_loop:
    sta SCREEN_RAM, x
    sta SCREEN_RAM + $100, x
    sta SCREEN_RAM + $200, x
    sta SCREEN_RAM + $300, x

    tya
    sta COLOR_RAM, x
    sta COLOR_RAM + $100, x
    sta COLOR_RAM + $200, x
    sta COLOR_RAM + $300, x
    lda #$20
    inx
    bne .clear_loop

    ; Puntatori Sprite ($07F8 - $07FF)
    lda #SPRITE_BLOCK_START         ; $80 = Player Cannon
    sta SPRITE_PTR_0
    lda #(SPRITE_BLOCK_START + 1)   ; $81 = Invader 1
    sta SPRITE_PTR_1
    lda #(SPRITE_BLOCK_START + 3)   ; $83 = Invader 2
    sta SPRITE_PTR_2
    lda #(SPRITE_BLOCK_START + 5)   ; $85 = Invader 3
    sta SPRITE_PTR_3
    lda #(SPRITE_BLOCK_START + 9)   ; $89 = Bullet
    sta SPRITE_PTR_6
    lda #(SPRITE_BLOCK_START + 10)  ; $8A = Alien Bomb
    sta SPRITE_PTR_7

    ; Colori degli sprite
    lda #COLOR_LIGHTGREEN   ; Cannone: Verde
    sta VIC_SPR0_COL
    lda #COLOR_CYAN         ; Invader 1: Ciano
    sta VIC_SPR1_COL
    lda #COLOR_YELLOW       ; Invader 2: Giallo
    sta VIC_SPR2_COL
    lda #COLOR_LIGHTRED     ; Invader 3: Rosso chiaro
    sta VIC_SPR3_COL
    lda #COLOR_WHITE        ; Proiettile: Bianco
    sta VIC_SPR6_COL
    lda #COLOR_CYAN         ; Bomba: Ciano
    sta VIC_SPR7_COL

    ; Disabilita multicolore ed espansioni (Hi-Res 24x21)
    lda #$00
    sta VIC_SPR_MCOLOR
    sta VIC_SPR_EXP_X
    sta VIC_SPR_EXP_Y
    sta VIC_SPR_X_MSB

    ; Abilita Sprite 0, 1, 2, 3
    lda #%00001111
    sta VIC_SPR_ENA
    rts

vic_wait_raster:
    ; Attende linea raster 250 (zona blanking inferiore)
.loop1:
    lda VIC_RASTER
    cmp #250
    bne .loop1
.loop2:
    lda VIC_RASTER
    cmp #250
    beq .loop2
    rts
`
  },
  {
    id: 'player-asm',
    name: 'player.asm',
    language: 'assembly',
    category: 'core',
    description: 'Lettura joystick CIA 1 ($DC00), movimento orizzontale cannone, sparo raggio laser e collision bounds.',
    hardwareFocus: 'CIA 1 ($DC00) Joystick Port 2, Fire Debounce',
    content: `; ==============================================================================
; COMMODORE 64 SPACE INVADERS - FILE: player.asm
; ==============================================================================
; Controllo del Cannone Giocatore e Raggio Laser.
; ==============================================================================

!src "constants.inc"

PLAYER_MIN_X    = 32
PLAYER_MAX_X    = 240
PLAYER_SPEED    = 2
BULLET_SPEED    = 5

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

    lda VIC_SPR_ENA
    ora #%00000001
    sta VIC_SPR_ENA
    rts

player_update:
    lda CIA1_PORT_A

    ; Controllo Sinistra (Bit 2 = 0)
    tax
    and #JOY_LEFT
    bne .check_right

    lda ZP_PLAYER_X
    sec
    sbc #PLAYER_SPEED
    cmp #PLAYER_MIN_X
    bcc .check_right
    sta ZP_PLAYER_X
    sta VIC_SPR0_X

.check_right:
    ; Controllo Destra (Bit 3 = 0)
    txa
    and #JOY_RIGHT
    bne .check_fire

    lda ZP_PLAYER_X
    clc
    adc #PLAYER_SPEED
    cmp #PLAYER_MAX_X
    bcs .check_fire
    sta ZP_PLAYER_X
    sta VIC_SPR0_X

.check_fire:
    ; Controllo Fuoco (Bit 4 = 0)
    txa
    and #JOY_FIRE
    bne .fire_released

    lda ZP_BULLET_ACTIVE
    bne .done_player
    lda ZP_FIRE_COOLDOWN
    bne .done_player

    jsr player_spawn_bullet
    lda #$01
    sta ZP_FIRE_COOLDOWN
    jmp .done_player

.fire_released:
    lda #$00
    sta ZP_FIRE_COOLDOWN

.done_player:
    rts

player_spawn_bullet:
    lda ZP_PLAYER_X
    clc
    adc #8
    sta ZP_BULLET_X
    sta VIC_SPR6_X

    lda ZP_PLAYER_Y
    sec
    sbc #6
    sta ZP_BULLET_Y
    sta VIC_SPR6_Y

    lda #$01
    sta ZP_BULLET_ACTIVE

    lda VIC_SPR_ENA
    ora #%01000000          ; Sprite 6
    sta VIC_SPR_ENA

    jsr sid_play_shoot
    rts

bullet_update:
    lda ZP_BULLET_ACTIVE
    beq .no_bullet

    lda ZP_BULLET_Y
    sec
    sbc #BULLET_SPEED
    bcc .kill_bullet
    cmp #42
    bcc .kill_bullet

    sta ZP_BULLET_Y
    sta VIC_SPR6_Y
    rts

.kill_bullet:
    lda #$00
    sta ZP_BULLET_ACTIVE
    lda VIC_SPR_ENA
    and #%10111111
    sta VIC_SPR_ENA
.no_bullet:
    rts
`
  },
  {
    id: 'invaders-asm',
    name: 'invaders.asm',
    language: 'assembly',
    category: 'core',
    description: 'Movimento a sciame degli invasori, accelerazione marcia, bombe aliene e collisioni con laser.',
    hardwareFocus: 'Swarm Matrix Logic, Frame Flip Animation, Bomb Drop',
    content: `; ==============================================================================
; COMMODORE 64 SPACE INVADERS - FILE: invaders.asm
; ==============================================================================
; Movimento dello sciame alieno, accelerazione del ritmo e bombe aliene.
; ==============================================================================

!src "constants.inc"

INV_MIN_X       = 32
INV_MAX_X       = 230
INV_DROP_STEP   = 8
BOMB_SPEED      = 2

invaders_init:
    lda #40
    sta ZP_INV_BASE_X
    lda #70
    sta ZP_INV_BASE_Y

    lda #$01
    sta ZP_INV_DIR

    lda #24
    sta ZP_INV_ALIVE_CNT

    lda #30
    sta ZP_INV_SPEED
    sta ZP_INV_STEP_TIMER

    lda #$00
    sta ZP_INV_ANIM_FRAME
    sta ZP_BOMB_ACTIVE

    jsr invaders_refresh_sprites
    rts

invaders_update:
    dec ZP_INV_STEP_TIMER
    bne .update_bombs

    lda ZP_INV_SPEED
    sta ZP_INV_STEP_TIMER

    jsr sid_play_march

    lda ZP_INV_ANIM_FRAME
    eor #$01
    sta ZP_INV_ANIM_FRAME
    jsr invaders_toggle_animation

    lda ZP_INV_DIR
    bne .move_right

    ; Sinistra
    lda ZP_INV_BASE_X
    sec
    sbc #4
    cmp #INV_MIN_X
    bcc .drop_and_reverse_right
    sta ZP_INV_BASE_X
    jmp .refresh_pos

.drop_and_reverse_right:
    lda ZP_INV_BASE_Y
    clc
    adc #INV_DROP_STEP
    sta ZP_INV_BASE_Y
    lda #$01
    sta ZP_INV_DIR
    jmp .refresh_pos

.move_right:
    lda ZP_INV_BASE_X
    clc
    adc #4
    cmp #INV_MAX_X
    bcs .drop_and_reverse_left
    sta ZP_INV_BASE_X
    jmp .refresh_pos

.drop_and_reverse_left:
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

invaders_toggle_animation:
    lda ZP_INV_ANIM_FRAME
    bne .frame_b
    lda #SPRITE_BLOCK_START + 1
    sta SPRITE_PTR_1
    lda #SPRITE_BLOCK_START + 3
    sta SPRITE_PTR_2
    rts
.frame_b:
    lda #SPRITE_BLOCK_START + 2
    sta SPRITE_PTR_1
    lda #SPRITE_BLOCK_START + 4
    sta SPRITE_PTR_2
    rts

invaders_refresh_sprites:
    lda ZP_INV_BASE_X
    sta VIC_SPR1_X
    lda ZP_INV_BASE_Y
    sta VIC_SPR1_Y

    lda ZP_INV_BASE_X
    clc
    adc #24
    sta VIC_SPR2_X
    lda ZP_INV_BASE_Y
    clc
    adc #22
    sta VIC_SPR2_Y
    rts

invaders_on_hit:
    jsr sid_play_explosion
    dec ZP_INV_ALIVE_CNT
    beq .wave_cleared

    lda ZP_INV_SPEED
    cmp #4
    bcc .done_hit
    sec
    sbc #1
    sta ZP_INV_SPEED
.done_hit:
    rts
.wave_cleared:
    lda #$03
    sta ZP_GAME_STATE
    rts

bomb_update:
    lda ZP_BOMB_ACTIVE
    bne .move_bomb

    lda VIC_RASTER
    and #%00011111
    bne .no_new_bomb

    lda ZP_INV_BASE_X
    clc
    adc #24
    sta ZP_BOMB_X
    sta VIC_SPR7_X

    lda ZP_INV_BASE_Y
    clc
    adc #44
    sta ZP_BOMB_Y
    sta VIC_SPR7_Y

    lda #$01
    sta ZP_BOMB_ACTIVE
    lda VIC_SPR_ENA
    ora #%10000000
    sta VIC_SPR_ENA
.no_new_bomb:
    rts

.move_bomb:
    lda ZP_BOMB_Y
    clc
    adc #BOMB_SPEED
    cmp #245
    bcs .kill_bomb
    sta ZP_BOMB_Y
    sta VIC_SPR7_Y
    rts

.kill_bomb:
    lda #$00
    sta ZP_BOMB_ACTIVE
    lda VIC_SPR_ENA
    and #%01111111
    sta VIC_SPR_ENA
    rts
`
  },
  {
    id: 'hud-asm',
    name: 'hud.asm',
    language: 'assembly',
    category: 'core',
    description: 'Interfaccia utente a caratteri PETSCII: visualizzazione SCORE BCD, vite rimaste e testi di stato.',
    hardwareFocus: 'Screen RAM $0400, Decimal BCD Mode (SED/CLD)',
    content: `; ==============================================================================
; COMMODORE 64 SPACE INVADERS - FILE: hud.asm
; ==============================================================================
; Testi PETSCII e punteggio decimale BCD.
; ==============================================================================

!src "constants.inc"

hud_init:
    ldx #0
.lbl_score_loop:
    lda str_score, x
    beq .lbl_lives
    sta SCREEN_RAM + 2, x
    inx
    jmp .lbl_score_loop

.lbl_lives:
    ldx #0
.lbl_lives_loop:
    lda str_lives, x
    beq .done_labels
    sta SCREEN_RAM + 962, x
    inx
    jmp .lbl_lives_loop

.done_labels:
    jsr hud_draw_score
    jsr hud_draw_lives
    rts

hud_draw_score:
    lda ZP_SCORE_HI
    lsr
    lsr
    lsr
    lsr
    ora #$30
    sta SCREEN_RAM + 42

    lda ZP_SCORE_HI
    and #$0F
    ora #$30
    sta SCREEN_RAM + 43

    lda ZP_SCORE_LO
    lsr
    lsr
    lsr
    lsr
    ora #$30
    sta SCREEN_RAM + 44

    lda ZP_SCORE_LO
    and #$0F
    ora #$30
    sta SCREEN_RAM + 45
    rts

hud_draw_lives:
    lda ZP_PLAYER_LIVES
    ora #$30
    sta SCREEN_RAM + 969
    rts

hud_add_score:
    sed
    clc
    adc ZP_SCORE_LO
    sta ZP_SCORE_LO
    lda ZP_SCORE_HI
    adc #0
    sta ZP_SCORE_HI
    cld
    jsr hud_draw_score
    rts

hud_show_title:
    ldx #0
.t_loop:
    lda str_title, x
    beq .t_done
    sta SCREEN_RAM + 208, x
    inx
    jmp .t_loop
.t_done:
    rts

hud_show_game_over:
    ldx #0
.go_loop:
    lda str_game_over, x
    beq .go_done
    sta SCREEN_RAM + 495, x
    inx
    jmp .go_loop
.go_done:
    rts

str_score:
    !scr "SCORE<1>", 0
str_lives:
    !scr "LIVES: ", 0
str_title:
    !scr "COMMODORE 64 SPACE INVADERS", 0
str_game_over:
    !scr "GAME OVER", 0
`
  },
  {
    id: 'makefile',
    name: 'Makefile',
    language: 'makefile',
    category: 'build',
    description: 'File di build per Linux e macOS con supporto ACME, KickAssembler e avvio su emulatore VICE.',
    hardwareFocus: 'Cross-platform GNU Make',
    content: `# ==============================================================================
# COMMODORE 64 SPACE INVADERS - MAKEFILE (Linux / macOS / MinGW)
# ==============================================================================
TARGET      = space_invaders.prg
MAIN_SRC    = main.asm
SRCS        = main.asm constants.inc vic.asm sid.asm sprites.asm player.asm invaders.asm hud.asm

ACME        = acme
KICKASS     = java -jar KickAss.jar
EMULATOR    = x64sc

.PHONY: all run clean help

all: $(TARGET)

$(TARGET): $(SRCS)
	@echo "Compilazione C64 Space Invaders con ACME..."
	$(ACME) -f cbm -o $(TARGET) $(MAIN_SRC)
	@echo "Compilazione riuscita: $(TARGET)"

kickass: $(SRCS)
	$(KICKASS) $(MAIN_SRC) -o $(TARGET)

run: $(TARGET)
	$(EMULATOR) $(TARGET)

clean:
	rm -f $(TARGET)

help:
	@echo "Comandi disponibili:"
	@echo "  make         - Compila $(TARGET) con ACME"
	@echo "  make kickass - Compila con KickAssembler"
	@echo "  make run     - Compila e avvia in VICE (x64sc)"
	@echo "  make clean   - Rimuove il file compilato"
`
  },
  {
    id: 'build-bat',
    name: 'build.bat',
    language: 'batch',
    category: 'build',
    description: 'Script di compilazione ed esecuzione con un click per sistemi Windows.',
    hardwareFocus: 'Windows CMD / Batch',
    content: `@echo off
rem ==============================================================================
rem COMMODORE 64 SPACE INVADERS - BUILD SCRIPT PER WINDOWS (build.bat)
rem ==============================================================================

set TARGET=space_invaders.prg
set MAIN_SRC=main.asm

echo ==============================================================================
echo   COMMODORE 64 SPACE INVADERS - COMPILATORE ASSEMBLY 6502 (WINDOWS)
echo ==============================================================================
echo.

where acme >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Rilevato ACME Assembler. Compilazione in corso...
    acme -f cbm -o %TARGET% %MAIN_SRC%
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRORE] Compilazione fallita!
        pause
        exit /b 1
    )
    goto compile_success
)

where kickass >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Rilevato KickAssembler. Compilazione in corso...
    kickass %MAIN_SRC% -o %TARGET%
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRORE] Compilazione fallita!
        pause
        exit /b 1
    )
    goto compile_success
)

echo [AVVISO] Nessun compilatore assembly trovato (ACME o KickAssembler).
echo Puoi scaricare ACME da: https://sourceforge.net/projects/acme-crossass/
echo oppure scaricare direttamente il file %TARGET% pronto dalla nostra web app!
pause
exit /b 1

:compile_success
echo.
echo [SUCCESSO] File binario C64 generato con successo: %TARGET%
echo.

where x64sc >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Avvio emulatore VICE (x64sc)...
    start x64sc %TARGET%
) else (
    echo [INFO] Trascina %TARGET% nell'emulatore VICE per giocare.
)
pause
`
  },
  {
    id: 'build-sh',
    name: 'build.sh',
    language: 'bash',
    category: 'build',
    description: 'Script di compilazione ed esecuzione per Linux e macOS.',
    hardwareFocus: 'Bash / Linux / macOS',
    content: `#!/usr/bin/env bash
set -e
TARGET="space_invaders.prg"
MAIN_SRC="main.asm"

echo "=============================================================================="
echo "  COMMODORE 64 SPACE INVADERS - BUILD SCRIPT (LINUX / MACOS)"
echo "=============================================================================="

if command -v acme &> /dev/null; then
    echo "[INFO] Compilazione con ACME..."
    acme -f cbm -o "$TARGET" "$MAIN_SRC"
elif command -v kickass &> /dev/null; then
    echo "[INFO] Compilazione con KickAssembler..."
    kickass "$MAIN_SRC" -o "$TARGET"
else
    echo "[AVVISO] Nessun assembler 6502 trovato. Installa 'acme' (sudo apt install acme / brew install acme)."
    exit 1
fi

echo "[SUCCESSO] File generato: $TARGET"

if command -v x64sc &> /dev/null; then
    echo "[INFO] Avvio VICE x64sc..."
    x64sc "$TARGET" &
elif command -v x64 &> /dev/null; then
    x64 "$TARGET" &
fi
`
  },
  {
    id: 'readme-md',
    name: 'README.md',
    language: 'markdown',
    category: 'core',
    description: 'Manuale e guida completa all’architettura del Commodore 64, mappa di memoria e istruzioni.',
    hardwareFocus: 'Documentazione & Guida Tecnica',
    content: `# Commodore 64 Space Invaders - Assembly 6502

Videogioco completo stile **Space Invaders** scritto in linguaggio **Assembly 6502 / 6510** per **Commodore 64**.

## Caratteristiche Hardware
- **Grafica Sprite VIC-II (MOS 6569)**: 8 sprite hardware monocolore 24x21, collisioni e sincronizzazione raster alla riga 250 ($D012).
- **Chip Audio SID (MOS 6581)**: Voce 1 (laser pew con sweep di frequenza), Voce 2 (marcia a 4 note basse discendenti), Voce 3 (rumore bianco per esplosioni).
- **Input Joystick CIA 1 (MOS 6526)**: Lettura porta 2 a $DC00.
- **Punteggio BCD**: Aritmetica decimale 6502 con SED / CLD.

## Compilazione
- **Windows**: doppio click su \`build.bat\`
- **Linux/macOS**: esegui \`make\` oppure \`./build.sh\`
- **VICE**: esegui \`make run\` oppure trascina \`space_invaders.prg\` nella finestra dell'emulatore.
`
  }
];

/**
 * Genera e avvia il download dell'archivio .ZIP contenente tutti i file sorgente,
 * gli script di build e il binario compilato .PRG!
 */
export async function downloadCompleteProjectZip() {
  const zip = new JSZip();

  // Aggiungi tutti i file sorgente
  for (const file of C64_SOURCE_FILES) {
    zip.file(file.name, file.content);
  }

  // Aggiungi anche il file .PRG binario compilato
  const prgBinary = generateC64Prg();
  zip.file('space_invaders.prg', prgBinary);

  // Genera l'archivio ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'c64_space_invaders_assembly_project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Scarica un singolo file di testo
 */
export function downloadSingleFile(file: SourceFileItem) {
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
