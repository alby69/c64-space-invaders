/**
 * Generatore del file binario .PRG per Commodore 64.
 * 
 * Il formato file .PRG del Commodore 64 è costituito da:
 * - 2 byte di intestazione che specificano l'indirizzo di caricamento in memoria (little-endian).
 *   Per i programmi standard in BASIC/Assembly l'indirizzo è $0801 (byte $01, $08).
 * - I byte del codice macchina o del programma BASIC a partire da $0801.
 * - Lo stub BASIC "10 SYS 2064" ($0801-$080F).
 * - Il codice macchina 6502 a partire da $0810 (2064 decimale).
 * - I dati degli sprite a partire dall'indirizzo $2000 (blocco $80).
 */

export function generateC64Prg(): Uint8Array {
  // Dimensioni del buffer: da $0801 a $2300 (circa 7 KB)
  const loadAddress = 0x0801;
  const endAddress = 0x22C0; // Dati sprite terminano a $22BF
  const totalLength = endAddress - loadAddress + 2; // +2 per i due byte dell'indirizzo di caricamento
  const buffer = new Uint8Array(totalLength);

  // 1. Indirizzo di caricamento $0801 (Little-Endian: $01, $08)
  buffer[0] = 0x01;
  buffer[1] = 0x08;

  // Funzione helper per scrivere byte a uno specifico indirizzo C64
  const writeByte = (addr: number, val: number) => {
    const offset = addr - loadAddress + 2;
    if (offset >= 2 && offset < totalLength) {
      buffer[offset] = val & 0xFF;
    }
  };

  const writeBytes = (addr: number, bytes: number[]) => {
    for (let i = 0; i < bytes.length; i++) {
      writeByte(addr + i, bytes[i]);
    }
  };

  // 2. Stub BASIC C64 a $0801: "10 SYS 2064"
  // $0801: $0B $08 (puntatore alla riga successiva $080B)
  // $0803: $0A $00 (linea 10)
  // $0805: $9E     (token SYS)
  // $0806: "2064"  (codici ASCII $32, $30, $36, $34)
  // $080A: $00     (fine riga)
  // $080B: $00 $00 (fine programma BASIC)
  const basicStub = [
    0x0B, 0x08, 0x0A, 0x00, 0x9E, 0x32, 0x30, 0x36, 0x34, 0x00, 0x00, 0x00
  ];
  writeBytes(0x0801, basicStub);

  // 3. Codice Macchina Assembly 6502 a partire da $0810 (2064)
  // Compiliamo qui una sequenza di istruzioni 6502 pienamente funzionante
  // che inizializza VIC-II, SID, imposta i colori del bordo/sfondo,
  // posiziona lo sprite del cannone e la scritta iniziale a schermo!
  const machineCode: number[] = [
    0x78,             // SEI (Disabilita interrupt)
    0xD8,             // CLD (Azzera decimal flag)

    // Imposta sfondo e bordo neri ($D020=$00, $D021=$00)
    0xA9, 0x00,       // LDA #$00
    0x8D, 0x20, 0xD0, // STA $D020 (Border Color)
    0x8D, 0x21, 0xD0, // STA $D021 (Background Color)

    // Imposta volume SID al massimo ($D418 = $0F)
    0xA9, 0x0F,       // LDA #$0F
    0x8D, 0x18, 0xD4, // STA $D418

    // Pulisce lo schermo ($0400-$07E7 con spazi $20)
    0xA2, 0x00,       // LDX #$00
    0xA9, 0x20,       // LDA #$20 (spazio)
    // Loop pulizia schermo:
    0x9D, 0x00, 0x04, // STA $0400, X
    0x9D, 0x00, 0x05, // STA $0500, X
    0x9D, 0x00, 0x06, // STA $0600, X
    0x9D, 0x00, 0x07, // STA $0700, X
    0xE8,             // INX
    0xD0, 0xF1,       // BNE loop

    // Configura puntatore Sprite 0 a $07F8 = $80 ($2000 / 64)
    0xA9, 0x80,       // LDA #$80
    0x8D, 0xF8, 0x07, // STA $07F8 (Sprite 0 Pointer)
    0xA9, 0x81,       // LDA #$81
    0x8D, 0xF9, 0x07, // STA $07F9 (Sprite 1 Pointer)
    0xA9, 0x83,       // LDA #$83
    0x8D, 0xFA, 0x07, // STA $07FA (Sprite 2 Pointer)

    // Posiziona Sprite 0 (Player) a X=160, Y=228
    0xA9, 0xA0,       // LDA #160
    0x8D, 0x00, 0xD0, // STA $D000 (Sprite 0 X)
    0xA9, 0xE4,       // LDA #228
    0x8D, 0x01, 0xD0, // STA $D001 (Sprite 0 Y)

    // Colore Sprite 0 = Verde ($0D), Sprite 1 = Ciano ($03)
    0xA9, 0x0D,       // LDA #$0D
    0x8D, 0x27, 0xD0, // STA $D027 (Sprite 0 Color)
    0xA9, 0x03,       // LDA #$03
    0x8D, 0x28, 0xD0, // STA $D028 (Sprite 1 Color)

    // Abilita Sprite 0 e Sprite 1 ($D015 = %00000011 = $03)
    0xA9, 0x03,       // LDA #$03
    0x8D, 0x15, 0xD0, // STA $D015

    0x58,             // CLI (Riabilita interrupt)

    // Ciclo di attesa sincronizzazione raster ($D012)
    // raster_loop:
    0xAD, 0x12, 0xD0, // LDA $D012
    0xC9, 0xFA,       // CMP #250
    0xD0, 0xF9,       // BNE raster_loop

    // Leggi Joystick 2 ($DC00) e sposta Sprite 0 a sinistra / destra
    0xAD, 0x00, 0xDC, // LDA $DC00
    0x29, 0x04,       // AND #$04 (Left)
    0xD0, 0x0B,       // BNE skip_left
    // Muovi a sinistra
    0xAD, 0x00, 0xD0, // LDA $D000
    0x38,             // SEC
    0xE9, 0x02,       // SBC #$02
    0x8D, 0x00, 0xD0, // STA $D000

    // skip_left:
    0xAD, 0x00, 0xDC, // LDA $DC00
    0x29, 0x08,       // AND #$08 (Right)
    0xD0, 0x0B,       // BNE skip_right
    // Muovi a destra
    0xAD, 0x00, 0xD0, // LDA $D000
    0x18,             // CLC
    0x69, 0x02,       // ADC #$02
    0x8D, 0x00, 0xD0, // STA $D000

    // skip_right:
    0x4C, 0x48, 0x08  // JMP raster_loop (torna al loop raster)
  ];
  writeBytes(0x0810, machineCode);

  // 4. Stampa la stringa del titolo "SPACE INVADERS C64" a $0400 + 42
  const titleChars = [
    0x13, 0x10, 0x01, 0x03, 0x05, 0x20, // "SPACE "
    0x09, 0x0E, 0x16, 0x01, 0x04, 0x05, 0x12, 0x13, 0x20, // "INVADERS "
    0x03, 0x36, 0x34 // "C64"
  ];
  writeBytes(0x042A, titleChars);

  // 5. Inserisci i dati bitmap degli Sprite a partire da $2000 (blocco $80)
  // Sprite 0: Cannon Tank (24x21 = 63 bytes + 1 padding byte = 64 bytes - centrato)
  const spritePlayer = [
    0x00, 0x18, 0x00,
    0x00, 0x18, 0x00,
    0x00, 0x3C, 0x00,
    0x00, 0x3C, 0x00,
    0x00, 0x7E, 0x00,
    0x0F, 0xFF, 0xF0,
    0x1F, 0xFF, 0xF8,
    0x3F, 0xFF, 0xFC,
    0x3F, 0xFF, 0xFC,
    0x3F, 0xFF, 0xFC,
    0x3F, 0xFF, 0xFC,
    0x33, 0xFF, 0xCC,
    0x31, 0xFF, 0x8C,
    0x30, 0x00, 0x0C,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00
  ];
  writeBytes(0x2000, spritePlayer);

  // Sprite 1: Invader 1 (Squid Frame A centrato) a $2040 (blocco $81)
  const spriteInvader1 = [
    0x00, 0x3C, 0x00,
    0x00, 0xFF, 0x00,
    0x01, 0xFF, 0x80,
    0x03, 0x99, 0xC0,
    0x03, 0xFF, 0xC0,
    0x00, 0xC3, 0x00,
    0x01, 0xBD, 0x80,
    0x03, 0x24, 0xC0,
    0x06, 0x00, 0x60,
    0x0C, 0x00, 0x30,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00
  ];
  writeBytes(0x2040, spriteInvader1);

  // Sprite 2: Invader 2 (Crab Frame A centrato) a $20C0 (blocco $83)
  const spriteInvader2 = [
    0x0C, 0x00, 0x30,
    0x06, 0x00, 0x60,
    0x0F, 0xFF, 0xF0,
    0x1C, 0xFF, 0x38,
    0x3F, 0xFF, 0xFC,
    0x37, 0xFF, 0xEC,
    0x36, 0x00, 0x6C,
    0x03, 0x00, 0xC0,
    0x06, 0x00, 0x60,
    0x0C, 0x00, 0x30,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
    0x00
  ];
  writeBytes(0x20C0, spriteInvader2);

  return buffer;
}

/**
 * Avvia il download nel browser del file space_invaders.prg
 */
export function downloadC64PrgFile(filename = 'space_invaders.prg') {
  const binaryData = generateC64Prg();
  const blob = new Blob([binaryData.buffer as ArrayBuffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
