; ==============================================================================
; COMMODORE 64 SPACE INVADERS - FILE: constants.inc
; ==============================================================================
; Questo file contiene tutte le costanti hardware del C64:
; - Registri del chip video VIC-II ($D000 - $D02E)
; - Registri del chip sonoro SID ($D400 - $D41C)
; - Registri CIA 1 e 2 per Joystick e Tastiera ($DC00 - $DD0D)
; - Mappatura della memoria (RAM schermo, RAM colori, puntatori sprite)
; - Definizioni delle variabili in Pagina Zero (Zero Page: $02 - $FF)
; - Costanti dei 16 colori del Commodore 64
; ==============================================================================

; ------------------------------------------------------------------------------
; 1. REGISTRI VIC-II (MOS 6569 / 8565 - Video Interface Controller)
; ------------------------------------------------------------------------------
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

VIC_SPR_X_MSB   = $D010     ; 9° bit coordinate X (bit 0-7 per sprite 0-7, permette X > 255)
VIC_CTRL_1      = $D011     ; Registro di controllo 1 (bit 7: 9° bit linea raster, bit 4: schermo on/off)
VIC_RASTER      = $D012     ; Linea di raster corrente (0-255) usata per la sincronizzazione video
VIC_SPR_ENA     = $D015     ; Abilitazione sprite (1 bit per sprite: 1=attivo, 0=spento)
VIC_CTRL_2      = $D016     ; Registro di controllo 2 (scrolling orizzontale, 40/38 colonne)
VIC_SPR_EXP_Y   = $D017     ; Espansione Y sprite (raddoppia altezza a 42 pixel se bit=1)
VIC_MEM_SETUP   = $D018     ; Configurazione locazione RAM schermo e font caratteri
VIC_IRQ_STATUS  = $D019     ; Flag interrupt raster/sprite
VIC_IRQ_MASK    = $D01A     ; Maschera abilitazione interrupt VIC-II
VIC_SPR_PRIO    = $D01B     ; Priorità Sprite/Sfondo (0=sprite sopra sfondo, 1=dietro)
VIC_SPR_MCOLOR  = $D01C     ; Modalità multicolore sprite (1=multicolore 12x21, 0=hires 24x21)
VIC_SPR_EXP_X   = $D01D     ; Espansione X sprite (raddoppia larghezza a 48 pixel se bit=1)
VIC_SPR_COLL_S  = $D01E     ; Collisione Hardware Sprite-Sprite (lettura cancella il registro)
VIC_SPR_COLL_B  = $D01F     ; Collisione Hardware Sprite-Sfondo

VIC_BORDER_COL  = $D020     ; Colore del bordo dello schermo (0-15)
VIC_BG_COL0     = $D021     ; Colore sfondo principale 0
VIC_BG_COL1     = $D022     ; Colore sfondo aggiuntivo 1
VIC_BG_COL2     = $D023     ; Colore sfondo aggiuntivo 2
VIC_BG_COL3     = $D024     ; Colore sfondo aggiuntivo 3
VIC_SPR_MCOL0   = $D025     ; Colore comune multicolore sprite 1
VIC_SPR_MCOL1   = $D026     ; Colore comune multicolore sprite 2
VIC_SPR0_COL    = $D027     ; Colore individuale Sprite 0 (Player)
VIC_SPR1_COL    = $D028     ; Colore individuale Sprite 1
VIC_SPR2_COL    = $D029     ; Colore individuale Sprite 2
VIC_SPR3_COL    = $D02A     ; Colore individuale Sprite 3
VIC_SPR4_COL    = $D02B     ; Colore individuale Sprite 4
VIC_SPR5_COL    = $D02C     ; Colore individuale Sprite 5
VIC_SPR6_COL    = $D02D     ; Colore individuale Sprite 6
VIC_SPR7_COL    = $D02E     ; Colore individuale Sprite 7

; ------------------------------------------------------------------------------
; 2. REGISTRI SID (MOS 6581 / 8580 - Sound Interface Device)
; ------------------------------------------------------------------------------
; VOCE 1: Usata per lo sparo del giocatore (Laser) e sirena UFO
SID_V1_FREQ_LO  = $D400     ; Frequenza Voce 1 (byte basso)
SID_V1_FREQ_HI  = $D401     ; Frequenza Voce 1 (byte alto)
SID_V1_PW_LO    = $D402     ; Pulse Width Voce 1 (byte basso)
SID_V1_PW_HI    = $D403     ; Pulse Width Voce 1 (byte alto, 4 bit)
SID_V1_CTRL     = $D404     ; Controllo forma d'onda Voce 1 (Noise, Pulse, Saw, Tri, Gate)
SID_V1_AD       = $D405     ; Attack (4 bit) / Decay (4 bit) Voce 1
SID_V1_SR       = $D406     ; Sustain (4 bit) / Release (4 bit) Voce 1

; VOCE 2: Usata per la marcia a 4 note degli Invaders (Marcia ossessiva)
SID_V2_FREQ_LO  = $D407     ; Frequenza Voce 2 (byte basso)
SID_V2_FREQ_HI  = $D408     ; Frequenza Voce 2 (byte alto)
SID_V2_PW_LO    = $D409     ; Pulse Width Voce 2 (byte basso)
SID_V2_PW_HI    = $D40A     ; Pulse Width Voce 2 (byte alto)
SID_V2_CTRL     = $D40B     ; Controllo forma d'onda Voce 2
SID_V2_AD       = $D40C     ; Attack / Decay Voce 2
SID_V2_SR       = $D40D     ; Sustain / Release Voce 2

; VOCE 3: Usata per le esplosioni (rumore bianco)
SID_V3_FREQ_LO  = $D40E     ; Frequenza Voce 3 (byte basso)
SID_V3_FREQ_HI  = $D40F     ; Frequenza Voce 3 (byte alto)
SID_V3_PW_LO    = $D410     ; Pulse Width Voce 3 (byte basso)
SID_V3_PW_HI    = $D411     ; Pulse Width Voce 3 (byte alto)
SID_V3_CTRL     = $D412     ; Controllo forma d'onda Voce 3 (bit 7 = White Noise)
SID_V3_AD       = $D413     ; Attack / Decay Voce 3
SID_V3_SR       = $D414     ; Sustain / Release Voce 3

; REGISTRI FILTRO E VOLUME MASTER
SID_FLT_LO      = $D415     ; Taglio filtro basso (3 bit)
SID_FLT_HI      = $D416     ; Taglio filtro alto (8 bit)
SID_FLT_CTRL    = $D417     ; Risonanza e voci filtrate (V1, V2, V3)
SID_VOL_CTRL    = $D418     ; Volume Master (0-15 nei 4 bit bassi) e modalità filtro

; Bitmask forme d'onda SID per i registri CTRL ($D404, $D40B, $D412):
SID_WAVE_GATE   = $01       ; Bit 0: Attiva inviluppo (1 = Key On / Start sound)
SID_WAVE_SYNC   = $02       ; Bit 1: Sincronizzazione oscillatore
SID_WAVE_RING   = $04       ; Bit 2: Ring Modulation
SID_WAVE_TEST   = $08       ; Bit 3: Test bit (azzera oscillatore)
SID_WAVE_TRI    = $10       ; Bit 4: Onda Triangolare
SID_WAVE_SAW    = $20       ; Bit 5: Onda a Dente di Sega (Sawtooth)
SID_WAVE_PULSE  = $40       ; Bit 6: Onda Quadra / Rettangolare (Pulse)
SID_WAVE_NOISE  = $80       ; Bit 7: Rumore Bianco (White Noise per esplosioni)

; ------------------------------------------------------------------------------
; 3. CIA 1 E JOYSTICK (Complex Interface Adapter - MOS 6526)
; ------------------------------------------------------------------------------
CIA1_PORT_A     = $DC00     ; Joystick Porta 2 (e matrice tastiera)
CIA1_PORT_B     = $DC01     ; Joystick Porta 1 (e matrice tastiera)
; Maschere bit joystick (i bit sono attivi a 0 / pull-up resistor):
JOY_UP          = $01       ; Bit 0: 0 = Su
JOY_DOWN        = $02       ; Bit 1: 0 = Giù
JOY_LEFT        = $04       ; Bit 2: 0 = Sinistra
JOY_RIGHT       = $08       ; Bit 3: 0 = Destra
JOY_FIRE        = $10       ; Bit 4: 0 = Pulsante Fuoco

; ------------------------------------------------------------------------------
; 4. MAPPA MEMORIA SCHERMO E SPRITE DEL C64
; ------------------------------------------------------------------------------
SCREEN_RAM      = $0400     ; Indirizzo base RAM schermo standard (40x25 = 1000 caratteri: $0400 - $07E7)
COLOR_RAM       = $D800     ; Indirizzo base RAM colori testo (1000 byte: $D800 - $DBE7)

; Puntatori agli sprite (ultimi 8 byte della pagina dello schermo $0400):
; Ciascun puntatore contiene il numero del blocco da 64 byte dove risiede lo sprite.
; Esempio: se il puntatore vale $80 (128 dec), lo sprite è a 128 * 64 = $2000 (8192 dec).
SPRITE_PTR_BASE = $07F8     ; Inizio puntatori sprite
SPRITE_PTR_0    = $07F8     ; Puntatore dati Sprite 0 (Player)
SPRITE_PTR_1    = $07F9     ; Puntatore dati Sprite 1 (Invader 1)
SPRITE_PTR_2    = $07FA     ; Puntatore dati Sprite 2 (Invader 2)
SPRITE_PTR_3    = $07FB     ; Puntatore dati Sprite 3 (Invader 3)
SPRITE_PTR_4    = $07FC     ; Puntatore dati Sprite 4 (UFO)
SPRITE_PTR_5    = $07FD     ; Puntatore dati Sprite 5 (Esplosione)
SPRITE_PTR_6    = $07FE     ; Puntatore dati Sprite 6 (Proiettile)
SPRITE_PTR_7    = $07FF     ; Puntatore dati Sprite 7 (Bomba Aliena)

; Indirizzo dati Sprite in memoria: blocco $80 = $2000 (8192 in decimale)
SPRITE_MEM_ADDR = $2000
SPRITE_BLOCK_START = $80    ; $2000 / 64 = $80

; ------------------------------------------------------------------------------
; 5. TABELLA DEI 16 COLORI STANDARD DEL COMMODORE 64
; ------------------------------------------------------------------------------
COLOR_BLACK     = 0         ; Nero ($00)
COLOR_WHITE     = 1         ; Bianco ($01)
COLOR_RED       = 2         ; Rosso ($02)
COLOR_CYAN      = 3         ; Ciano ($03)
COLOR_PURPLE    = 4         ; Viola ($04)
COLOR_GREEN     = 5         ; Verde ($05)
COLOR_BLUE      = 6         ; Blu ($06)
COLOR_YELLOW    = 7         ; Giallo ($07)
COLOR_ORANGE    = 8         ; Arancione ($08)
COLOR_BROWN     = 9         ; Marrone ($09)
COLOR_LIGHTRED  = 10        ; Rosso chiaro / Rosa ($0A)
COLOR_DARKGREY  = 11        ; Grigio scuro ($0B)
COLOR_GREY      = 12        ; Grigio medio ($0C)
COLOR_LIGHTGREEN= 13        ; Verde chiaro ($0D)
COLOR_LIGHTBLUE = 14        ; Blu chiaro ($0E)
COLOR_LIGHTGREY = 15        ; Grigio chiaro ($0F)

; ------------------------------------------------------------------------------
; 6. ALLOCAZIONE VARIABILI IN PAGINA ZERO (Zero Page: $02 - $8F)
; ------------------------------------------------------------------------------
; La Pagina Zero del 6502 è la memoria più veloce (richiede 1 ciclo di clock in meno).
; Usiamo locazioni non utilizzate dal BASIC né dal KERNAL durante l'esecuzione del gioco.
ZP_GAME_STATE   = $02       ; Stato del gioco (0=Titolo, 1=In Gioco, 2=Game Over, 3=Nuova Ondata)
ZP_FRAME_COUNT  = $03       ; Contatore frame video incrementato ogni raster sync

; Coordinate e stato del Giocatore (Cannon)
ZP_PLAYER_X     = $04       ; Posizione orizzontale X giocatore (24 - 320)
ZP_PLAYER_Y     = $05       ; Posizione verticale Y giocatore (fissa a 228)
ZP_PLAYER_LIVES = $06       ; Vite rimaste (inizio con 3)
ZP_FIRE_COOLDOWN= $07       ; Debounce tasto fuoco

; Coordinate e stato del Proiettile Giocatore
ZP_BULLET_ACTIVE= $08       ; 1 = proiettile a schermo, 0 = inattivo
ZP_BULLET_X     = $09       ; Coordinata X proiettile
ZP_BULLET_Y     = $0A       ; Coordinata Y proiettile

; Coordinate e stato della Bomba Aliena
ZP_BOMB_ACTIVE  = $0B       ; 1 = bomba aliena in caduta, 0 = inattiva
ZP_BOMB_X       = $0C       ; Coordinata X bomba
ZP_BOMB_Y       = $0D       ; Coordinata Y bomba

; Stato dello sciame degli Invasori
ZP_INV_BASE_X   = $0E       ; Coordinata X di riferimento dello sciame
ZP_INV_BASE_Y   = $0F       ; Coordinata Y di riferimento dello sciame
ZP_INV_DIR      = $10       ; Direzione di marcia: 1 = destra, 0 = sinistra
ZP_INV_STEP_TIMER= $11      ; Timer tra un passo e l'altro dello sciame
ZP_INV_SPEED    = $12       ; Velocità attuale dello sciame (diminuisce con l'eliminazione alieni)
ZP_INV_ALIVE_CNT= $13       ; Numero totale di alieni ancora in vita (es. 24)
ZP_INV_ANIM_FRAME= $14      ; Frame animazione alieni (0 o 1: braccia aperte/chiuse)
ZP_INV_MARCH_NOTE=$15       ; Indice nota corrente della marcia SID (0, 1, 2, 3)

; Punteggio in formato decimale/BCD (Binary Coded Decimal)
ZP_SCORE_LO     = $16       ; Byte basso punteggio (es. decine e unità)
ZP_SCORE_HI     = $17       ; Byte alto punteggio (es. centinaia e migliaia)
ZP_HISCORE_LO   = $18       ; Record byte basso
ZP_HISCORE_HI   = $19       ; Record byte alto

; Stato UFO (Mystery Flying Saucer)
ZP_UFO_ACTIVE   = $1A       ; 1 = UFO in volo, 0 = assente
ZP_UFO_X        = $1B       ; Coordinata X UFO
ZP_UFO_TIMER    = $1C       ; Timer per apparizione UFO

; Timer sonori SID
ZP_SFX_SHOOT_TMR= $1D       ; Durata suono sparo laser
ZP_SFX_EXPL_TMR = $1E       ; Durata suono esplosione
ZP_SFX_UFO_TMR  = $1F       ; Durata sirena UFO

; Puntatori a 16 bit per indirizzamento indiretto ($FB-$FE)
ZP_PTR_LO       = $FB
ZP_PTR_HI       = $FC
ZP_SRC_LO       = $FD
ZP_SRC_HI       = $FE
