#!/usr/bin/env bash
# ==============================================================================
# COMMODORE 64 SPACE INVADERS - BUILD SCRIPT (Linux & macOS)
# ==============================================================================
set -e

TARGET="space_invaders.prg"
MAIN_SRC="main.asm"

echo "=============================================================================="
echo "  COMMODORE 64 SPACE INVADERS - BUILD SCRIPT (LINUX / MACOS)"
echo "=============================================================================="

# Controllo compilatore ACME
if command -v acme &> /dev/null; then
    echo "[INFO] Compilazione con ACME..."
    acme -f cbm -o "$TARGET" "$MAIN_SRC"
elif command -v kickass &> /dev/null; then
    echo "[INFO] Compilazione con KickAssembler..."
    kickass "$MAIN_SRC" -o "$TARGET"
else
    echo "[AVVISO] Nessun assembler 6502 trovato (installa 'acme' con: sudo apt install acme o brew install acme)."
    echo "Puoi scaricare il file $TARGET già compilato direttamente dall'applicazione web!"
    exit 1
fi

echo "[SUCCESSO] File binario C64 generato con successo: $TARGET"

# Avvio VICE se installato
if command -v x64sc &> /dev/null; then
    echo "[INFO] Avvio emulatore VICE x64sc..."
    x64sc "$TARGET" &
elif command -v x64 &> /dev/null; then
    echo "[INFO] Avvio emulatore VICE x64..."
    x64 "$TARGET" &
else
    echo "[INFO] Per giocare, trascina '$TARGET' dentro l'emulatore VICE."
fi
