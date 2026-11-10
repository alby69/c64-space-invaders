; ==============================================================================
; COMMODORE 64 SPACE INVADERS - FILE: hud.asm
; ==============================================================================
; Questo file gestisce l'interfaccia a schermo (Heads-Up Display):
; - Visualizzazione del punteggio SCORE e record HI-SCORE in alto
; - Visualizzazione delle vite rimanenti LIVES e del livello corrente
; - Schermata del Titolo (Title Screen)
; - Schermata di Game Over
; - Routine di stampa caratteri PETSCII nella RAM schermo ($0400).
; ==============================================================================

!src "constants.inc"

; ------------------------------------------------------------------------------
; ROUTINE: hud_init
; DESCRIZIONE:
; Stampa le etichette fisse dell'interfaccia: "SCORE", "HI-SCORE", "LIVES".
; ------------------------------------------------------------------------------
hud_init:
    ; Stampa "SCORE<1>" alla colonna 2 della riga 0 (indirizzo $0400 + 2)
    ldx #0
.lbl_score_loop:
    lda str_score, x
    beq .lbl_hiscore
    sta SCREEN_RAM + 2, x
    inx
    jmp .lbl_score_loop

.lbl_hiscore:
    ; Stampa "HI-SCORE" alla colonna 16 della riga 0 (indirizzo $0400 + 16)
    ldx #0
.lbl_hi_loop:
    lda str_hiscore, x
    beq .lbl_lives
    sta SCREEN_RAM + 16, x
    inx
    jmp .lbl_hi_loop

.lbl_lives:
    ; Stampa "LIVES:" alla colonna 2 dell'ultima riga (riga 24, indirizzo $07C0 + 2)
    ldx #0
.lbl_lives_loop:
    lda str_lives, x
    beq .done_labels
    sta SCREEN_RAM + 962, x     ; 960 = riga 24, + 2 colonna
    inx
    jmp .lbl_lives_loop

.done_labels:
    jsr hud_draw_score
    jsr hud_draw_lives
    rts

; ------------------------------------------------------------------------------
; ROUTINE: hud_draw_score
; DESCRIZIONE:
; Stampa il punteggio corrente (4 cifre BCD) alla riga 1 sotto la scritta SCORE.
; ------------------------------------------------------------------------------
hud_draw_score:
    ; Cifra migliaia e centinaia da ZP_SCORE_HI
    lda ZP_SCORE_HI
    lsr
    lsr
    lsr
    lsr
    ora #$30                ; Converti in carattere PETSCII numerico ('0'-'9')
    sta SCREEN_RAM + 42     ; Riga 1, Colonna 2

    lda ZP_SCORE_HI
    and #$0F
    ora #$30
    sta SCREEN_RAM + 43

    ; Cifra decine e unità da ZP_SCORE_LO
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

; ------------------------------------------------------------------------------
; ROUTINE: hud_draw_lives
; DESCRIZIONE:
; Stampa il numero di vite rimaste nell'angolo inferiore sinistro.
; ------------------------------------------------------------------------------
hud_draw_lives:
    lda ZP_PLAYER_LIVES
    ora #$30                ; Converti in numero PETSCII
    sta SCREEN_RAM + 969    ; Accanto a "LIVES: "
    rts

; ------------------------------------------------------------------------------
; ROUTINE: hud_add_score
; DESCRIZIONE:
; Aggiunge i punti passati nel registro A al punteggio (aritmetica BCD).
; ------------------------------------------------------------------------------
hud_add_score:
    sed                     ; Attiva la modalità decimale BCD del 6502!
    clc
    adc ZP_SCORE_LO
    sta ZP_SCORE_LO
    lda ZP_SCORE_HI
    adc #0
    sta ZP_SCORE_HI
    cld                     ; Disattiva SEMPRE la modalità decimale prima di uscire!

    jsr hud_draw_score
    rts

; ------------------------------------------------------------------------------
; ROUTINE: hud_show_title
; DESCRIZIONE: Stampa la schermata iniziale col titolo e le istruzioni.
; ------------------------------------------------------------------------------
hud_show_title:
    ldx #0
.t_loop1:
    lda str_title, x
    beq .t_inst
    sta SCREEN_RAM + 208, x     ; Riga 5
    inx
    jmp .t_loop1

.t_inst:
    ldx #0
.t_loop2:
    lda str_press_fire, x
    beq .t_done
    sta SCREEN_RAM + 490, x     ; Riga 12
    inx
    jmp .t_loop2

.t_done:
    rts

; ------------------------------------------------------------------------------
; ROUTINE: hud_show_game_over
; DESCRIZIONE: Stampa la scritta di fine partita al centro dello schermo.
; ------------------------------------------------------------------------------
hud_show_game_over:
    ldx #0
.go_loop:
    lda str_game_over, x
    beq .go_done
    sta SCREEN_RAM + 495, x     ; Centro schermo
    inx
    jmp .go_loop
.go_done:
    rts

; ------------------------------------------------------------------------------
; TESTI E STRINGHE PETSCII (Codici schermo nativi C64)
; ------------------------------------------------------------------------------
str_score:
    !scr "SCORE<1>", 0
str_hiscore:
    !scr "HI-SCORE", 0
str_lives:
    !scr "LIVES: ", 0
str_title:
    !scr "COMMODORE 64 SPACE INVADERS", 0
str_press_fire:
    !scr "PRESS FIRE OR SPACE TO START", 0
str_game_over:
    !scr "GAME OVER", 0
