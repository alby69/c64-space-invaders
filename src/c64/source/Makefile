# ==============================================================================
# COMMODORE 64 SPACE INVADERS - MAKEFILE (Linux / macOS / MinGW)
# ==============================================================================
# Questo Makefile permette di compilare il gioco in assembly 6502 per Commodore 64
# producendo il file binario eseguibile .PRG pronto per qualsiasi emulatore (VICE,
# CCS64, Micro64) o per vero hardware (SD2IEC, 1541 Ultimate, Kung Fu Flash).
# ==============================================================================

# Nome dell'eseguibile di output
TARGET      = space_invaders.prg
MAIN_SRC    = main.asm
SRCS        = main.asm constants.inc vic.asm sid.asm sprites.asm player.asm invaders.asm hud.asm

# Rilevamento assembler (ACME o KickAssembler)
ACME        = acme
KICKASS     = java -jar KickAss.jar
EMULATOR    = x64sc

.PHONY: all run clean help

# Target predefinito: compila con ACME
all: $(TARGET)

$(TARGET): $(SRCS)
	@echo "=========================================================="
	@echo "Compilazione C64 Space Invaders con ACME Assembler..."
	@echo "=========================================================="
	$(ACME) -f cbm -o $(TARGET) $(MAIN_SRC)
	@echo "Compilazione riuscita! Generato file: $(TARGET)"

# Compilazione alternativa con KickAssembler (se preferito)
kickass: $(SRCS)
	@echo "Compilazione con KickAssembler..."
	$(KICKASS) $(MAIN_SRC) -o $(TARGET)

# Esegui direttamente nell'emulatore VICE (x64sc)
run: $(TARGET)
	@echo "Avvio emulatore VICE con $(TARGET)..."
	$(EMULATOR) $(TARGET)

# Pulizia dei file compilati
clean:
	rm -f $(TARGET)
	@echo "Pulizia completata."

# Guida rapida
help:
	@echo "Opzioni disponibili nel Makefile:"
	@echo "  make         - Compila space_invaders.prg usando ACME"
	@echo "  make kickass - Compila usando KickAssembler"
	@echo "  make run     - Compila e avvia in VICE (x64sc)"
	@echo "  make clean   - Rimuove il file .prg generato"
