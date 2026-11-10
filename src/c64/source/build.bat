@echo off
rem ==============================================================================
rem COMMODORE 64 SPACE INVADERS - BUILD SCRIPT PER WINDOWS (build.bat)
rem ==============================================================================
rem Questo script compila il codice sorgente assembly 6502 in un file binario .PRG
rem ed eventualmente avvia l'emulatore VICE (x64sc.exe) se presente nel PATH.
rem ==============================================================================

set TARGET=space_invaders.prg
set MAIN_SRC=main.asm

echo ==============================================================================
echo   COMMODORE 64 SPACE INVADERS - COMPILATORE ASSEMBLY 6502 (WINDOWS)
echo ==============================================================================
echo.

rem 1. Verifica se ACME e' presente nel sistema
where acme >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Rilevato ACME Assembler. Inizio compilazione...
    acme -f cbm -o %TARGET% %MAIN_SRC%
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRORE] Errore durante la compilazione con ACME!
        pause
        exit /b 1
    )
    goto compile_success
)

rem 2. Verifica se KickAssembler e' presente
where kickass >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Rilevato KickAssembler. Inizio compilazione...
    kickass %MAIN_SRC% -o %TARGET%
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRORE] Errore durante la compilazione con KickAssembler!
        pause
        exit /b 1
    )
    goto compile_success
)

rem 3. Se ne' acme ne' kickass sono installati
echo [AVVISO] Nessun compilatore assembly per C64 (ACME o KickAssembler) trovato nel PATH.
echo.
echo Puoi scaricare rapidamente ACME per Windows da:
echo   https://sourceforge.net/projects/acme-crossass/
echo oppure KickAssembler da:
echo   http://www.theweb.dk/KickAssembler/
echo.
echo Nota: Puoi anche scaricare il file compilato space_invaders.prg direttamente
echo dal pulsante 'Scarica .PRG' presente nella nostra web app!
echo.
pause
exit /b 1

:compile_success
echo.
echo ==============================================================================
echo [SUCCESSO] File generato con successo: %TARGET%
echo ==============================================================================
echo.

rem 4. Chiede se si desidera avviare VICE
where x64sc >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Trovato emulatore VICE (x64sc). Avvio in corso...
    start x64sc %TARGET%
) else (
    echo [INFO] Per eseguire il gioco, trascina il file %TARGET% dentro
    echo        l'emulatore VICE (x64sc.exe) oppure caricalo su una chiavetta SD
    echo        per SD2IEC / 1541 Ultimate / THEC64.
)

echo.
pause
