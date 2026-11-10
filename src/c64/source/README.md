# Commodore 64 Space Invaders - Assembly 6502

Progetto completo di un videogioco stile **Space Invaders** scritto interamente in linguaggio **Assembly 6502 / 6510** per il leggendario computer **Commodore 64** (1982).

Il codice sfrutta direttamente le peculiarità dell'architettura hardware del C64:
- **Grafica Sprite Hardware con VIC-II (MOS 6569)**: gestione degli 8 sprite hardware contemporanei, collisioni, forme d'onda pixel 24x21 ad alta risoluzione (Hi-Res).
- **Audio ed Effetti Sonori con SID (MOS 6581 / 8580)**: sintesi analogica a 3 voci reali (Voce 1 per laser gun, Voce 2 per la tipica marcia ossessiva a 4 note degli Space Invaders, Voce 3 per le esplosioni con generatore di rumore bianco).
- **Input Joystick con CIA 1 (MOS 6526)**: lettura diretta della porta $DC00.
- **Sincronizzazione Raster**: sincronizzazione con la scansione del pennello a elettroni (riga raster 250 a $D012) per evitare qualsiasi sfarfallio (tearing).

---

## Struttura Modulare dei File Sorgente

Il codice sorgente è stato suddiviso in file modulari altamente commentati per facilitare lo studio e la comprensione di ogni singolo registro e istruzione:

| File | Descrizione |
| :--- | :--- |
| `constants.inc` | Definizioni di tutti i registri hardware del C64 (VIC-II, SID, CIA 1), colori e allocazione delle variabili veloci in Pagina Zero ($02-$80). |
| `main.asm` | Punto di ingresso principale, stub BASIC C64 (`10 SYS 2064` a `$0801`), ciclo principale (`main_loop`), sincronizzazione raster e collisioni. |
| `vic.asm` | Inizializzazione video VIC-II, impostazione colori bordo e sfondo ($D020, $D021), puntatori agli sprite ($07F8-$07FF) e pulizia della memoria video. |
| `sprites.asm` | Matrici bitmap degli sprite a 24x21 pixel (64 byte per sprite) posizionati a partire dall'indirizzo di memoria `$2000` (blocco $80): Cannone giocatore, Invasori Tipo 1/2/3 con Frame A e B, UFO e proiettili. |
| `sid.asm` | Driver sonoro per il chip SID: sintetizzazione del suono laser, marcia ritmica a 4 note discendenti, boato di esplosione a rumore bianco e sweep di frequenza. |
| `player.asm` | Lettura del joystick dalla porta 2 (registro CIA 1 a `$DC00`), movimento orizzontale e sparo del raggio laser con controllo di debounce. |
| `invaders.asm` | Formazione dello sciame alieno, movimento orizzontale a zigzag, discesa al raggiungimento dei bordi, accelerazione progressiva della marcia e lancio di bombe aliene. |
| `hud.asm` | Disegno dell'interfaccia a caratteri PETSCII nella RAM schermo (`$0400`): punteggio in formato decimale BCD, vite rimaste e schermata di Game Over. |
| `Makefile` | File di automazione compilazione per Linux e macOS (con supporto ad ACME o KickAssembler). |
| `build.bat` | Script batch per compilare ed eseguire con un click su Windows. |
| `build.sh` | Script shell per compilare ed eseguire con un click su Linux e macOS. |

---

## Mappa della Memoria del Commodore 64

```
Indirizzo Esadecimale   Indirizzo Decimale   Utilizzo nel Progetto
---------------------   ------------------   ---------------------
$0000 - $00FF           0 - 255              Pagina Zero (Zero Page - variabili veloci di gioco)
$0400 - $07E7           1024 - 2023          RAM Schermo (Screen RAM - 40x25 caratteri PETSCII)
$07F8 - $07FF           2040 - 2047          Puntatori Sprite del VIC-II
$0801 - $080F           2049 - 2063          Stub BASIC "10 SYS 2064"
$0810 - $1FFF           2064 - 8191          Codice Macchina Assembly del Gioco
$2000 - $22BF           8192 - 8895          Dati Grafici Bitmap degli Sprite (Blocchi da 64 byte)
$D000 - $D02E           53248 - 53294        Registri di Controllo Video VIC-II
$D400 - $D41C           54272 - 54300        Registri del Sintetizzatore Audio SID 6581
$D800 - $DBE7           55296 - 56295        RAM Colori del Testo (Color RAM)
$DC00 - $DC0F           56320 - 56335        Registri Interfaccia CIA 1 (Joystick Porta 2 a $DC00)
```

---

## Come Compilare ed Eseguire

### 1. Esecuzione Immediata (Senza installare nulla!)
Puoi scaricare direttamente il file già compilato `space_invaders.prg` tramite il pulsante apposito nella nostra applicazione web.
Per giocarci, basta trascinare il file dentro l'emulatore **VICE** (`x64sc`).

### 2. Compilazione su Windows
1. Scarica l'assembler open-source **ACME** (o **KickAssembler**) e mettilo nel tuo PATH di sistema o nella cartella del progetto.
2. Fai doppio clic su `build.bat`.
3. Lo script genererà `space_invaders.prg` e, se trova l'emulatore VICE installato, lo avvierà automaticamente.

### 3. Compilazione su Linux / macOS
Installa l'assembler ACME:
- **Ubuntu / Debian**: `sudo apt install acme`
- **macOS (Homebrew)**: `brew install acme`

Poi compila ed esegui con il comando:
```bash
make
# Oppure per compilare ed eseguire direttamente su VICE:
make run
```

---

## Esecuzione su Vero Hardware Commodore 64

Se possiedi un autentico Commodore 64 o una riproduzione moderna (**THEC64**, **Ultimate64**, scheda **Kung Fu Flash**, **EasyFlash 3** o periferica **SD2IEC**):
1. Copia `space_invaders.prg` su una scheda SD o chiavetta USB.
2. Sul Commodore 64 digita:
   ```basic
   LOAD "SPACE_INVADERS.PRG",8,1
   ```
3. Una volta caricato, avvia il gioco digitando:
   ```basic
   RUN
   ```

---

## Controlli di Gioco

- **Joystick (Porta 2)**:
  - Sinistra / Destra: Spostamento del Cannone
  - Pulsante Fuoco: Spara Raggio Laser
- **Tastiera (per Emulatori)**:
  - `A` / `D` oppure Frecce Sinistra / Destra: Movimento
  - `BARRA SPAZIATRICE`: Fuoco
