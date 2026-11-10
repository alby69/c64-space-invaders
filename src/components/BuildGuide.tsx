import React from 'react';
import { Terminal, Download, Monitor, HardDrive, CheckCircle2, ExternalLink } from 'lucide-react';
import { downloadC64PrgFile } from '../c64/c64BinaryGenerator';
import { downloadCompleteProjectZip } from '../c64/c64SourceFiles';

export const BuildGuide: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Box di download rapido */}
      <div className="p-6 bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-800/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">DOWNLOAD ISTANTANEO</span>
          <h3 className="text-lg font-bold text-white">File .PRG Pronto per Emulatore & Archivio Sorgenti</h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Puoi scaricare direttamente il file binario compilato <code className="text-cyan-300 font-mono">space_invaders.prg</code> per giocarci subito su VICE, oppure scaricare l&apos;intero pacchetto con file sorgente, Makefile e build script per Windows/Linux.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => downloadC64PrgFile()}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-cyan-500/20"
          >
            <Download className="w-4 h-4" />
            Scarica .PRG Compilato
          </button>

          <button
            onClick={() => downloadCompleteProjectZip()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Scarica Progetto Completo (.ZIP)
          </button>
        </div>
      </div>

      {/* Sezioni Istruzioni di Build */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compilazione Windows */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Guida Compilazione: Windows</span>
          </div>

          <div className="text-xs text-slate-400 space-y-2">
            <p>1. Estrai il file ZIP del progetto in una cartella.</p>
            <p>2. Scarica l&apos;assembler gratuito <strong>ACME</strong> (o <strong>KickAssembler</strong>) e inserisci l&apos;eseguibile nel tuo percorso PATH di Windows oppure nella cartella del progetto.</p>
            <p>3. Fai doppio clic su <code className="text-amber-300 font-mono">build.bat</code>.</p>
            <p>4. Lo script compilerà automaticamente <code className="text-cyan-300 font-mono">space_invaders.prg</code> e, se trova l&apos;emulatore <strong>VICE (x64sc.exe)</strong> installato, avvierà subito il gioco!</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
            <div className="text-slate-500">C:\C64-Space-Invaders&gt; build.bat</div>
            <div className="text-green-400">[INFO] Rilevato ACME Assembler. Compilazione in corso...</div>
            <div className="text-cyan-400">[SUCCESSO] File binario C64 generato: space_invaders.prg</div>
          </div>
        </div>

        {/* Compilazione Linux & macOS */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Guida Compilazione: Linux & macOS</span>
          </div>

          <div className="text-xs text-slate-400 space-y-2">
            <p>1. Installa l&apos;assembler ACME con il tuo gestore pacchetti:</p>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-emerald-400">
              sudo apt install acme &nbsp;&nbsp;# Ubuntu/Debian<br />
              brew install acme &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# macOS Homebrew
            </div>
            <p>2. Compila il file con il comando Makefile:</p>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-cyan-300">
              make
            </div>
            <p>3. Oppure compila e lancia direttamente nell&apos;emulatore VICE:</p>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-yellow-300">
              make run
            </div>
          </div>
        </div>
      </div>

      {/* Come Giocare su Emulatore VICE o Vero Hardware */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <HardDrive className="w-4 h-4 text-amber-400" />
          <span>Come eseguire il gioco su Emulatore VICE o Vero Hardware C64</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-400">
              <Monitor className="w-4 h-4" />
              <span>Emulatore VICE (x64sc)</span>
            </div>
            <p className="text-slate-400">
              VICE è l&apos;emulatore di riferimento per Commodore 64. Scarica VICE da <em>vice-emu.sourceforge.io</em>. Una volta aperto, trascina semplicemente il file <code className="text-cyan-300 font-mono">space_invaders.prg</code> nella finestra di VICE per avviarlo all&apos;istante con autostart!
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <HardDrive className="w-4 h-4" />
              <span>SD2IEC / Kung Fu Flash</span>
            </div>
            <p className="text-slate-400">
              Copia il file <code className="text-emerald-300 font-mono">space_invaders.prg</code> su una scheda SD inserita nella cartuccia o periferica SD2IEC/Kung Fu Flash. Digita sul C64 reale:
              <br />
              <code className="text-amber-300 font-mono">LOAD &quot;SPACE_INVADERS.PRG&quot;,8,1</code>
              <br />
              poi digita <code className="text-amber-300 font-mono">RUN</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-yellow-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>THEC64 / THEC64 Mini</span>
            </div>
            <p className="text-slate-400">
              Rinomina il file in <code className="text-yellow-300 font-mono">space_invaders_J2.prg</code> (il suffisso _J2 imposta automaticamente il joystick sulla porta 2). Salvalo su una chiavetta USB e selezionalo dal menu Media Access del THEC64!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
