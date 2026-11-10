/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { C64GameCanvas } from './components/C64GameCanvas';
import { CodeExplorer } from './components/CodeExplorer';
import { SidLab } from './components/SidLab';
import { SpriteViewer } from './components/SpriteViewer';
import { BuildGuide } from './components/BuildGuide';
import { downloadC64PrgFile } from './c64/c64BinaryGenerator';
import { downloadCompleteProjectZip } from './c64/c64SourceFiles';
import { Download, Terminal, Cpu, Radio, Layers, Gamepad2, BookOpen } from 'lucide-react';

type ActiveTab = 'game' | 'code' | 'sid' | 'sprites' | 'build';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('game');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* ==================================================================== */}
      {/* TOP BAR CONTRACT: Zone 1 (Wordmark) - Zone 2 (Nav Links) - Zone 3 (Action) */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (Single element, whitespace-nowrap) */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-mono font-bold text-xs shadow-md shadow-cyan-500/20">
              64
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              C64 Space Invaders Studio
            </span>
          </div>

          {/* Zone 2: 4-5 Concise Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
            <button
              onClick={() => setActiveTab('game')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'game' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Simulatore C64</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'code' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Codice Assembly</span>
            </button>

            <button
              onClick={() => setActiveTab('sid')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'sid' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Chip Audio SID</span>
            </button>

            <button
              onClick={() => setActiveTab('sprites')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'sprites' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sprite VIC-II</span>
            </button>

            <button
              onClick={() => setActiveTab('build')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'build' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Guida Build & VICE</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action (Single action button) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => downloadC64PrgFile()}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 font-sans shadow-md shadow-cyan-400/10"
              title="Scarica il file binario space_invaders.prg pronto per emulatore VICE o vero C64"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Scarica .PRG</span>
            </button>

            <button
              onClick={() => downloadCompleteProjectZip()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="Scarica tutti i file sorgente, Makefile, build.bat e PRG in un archivio ZIP"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ZIP Completo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Barra Navigazione per Mobile */}
      <div className="flex md:hidden items-center justify-around px-2 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-medium overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('game')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'game' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
        >
          Simulatore
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'code' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
        >
          Codice
        </button>
        <button
          onClick={() => setActiveTab('sid')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'sid' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
        >
          Chip SID
        </button>
        <button
          onClick={() => setActiveTab('sprites')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'sprites' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
        >
          Sprite
        </button>
        <button
          onClick={() => setActiveTab('build')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'build' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
        >
          Build
        </button>
      </div>

      {/* ==================================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ==================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        {/* Intestazione Editoriale e Metadati Unboxed (Zero-pill discipline) */}
        <div className="flex flex-col gap-2 pb-2 border-b border-slate-900">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>Commodore 64</span>
            <span aria-hidden="true">·</span>
            <span>Assembly 6502 / 6510</span>
            <span aria-hidden="true">·</span>
            <span>Grafica VIC-II Sprite (24x21)</span>
            <span aria-hidden="true">·</span>
            <span>Sintesi Sonora SID 6581</span>
            <span aria-hidden="true">·</span>
            <span>Formato Eseguibile .PRG ($0801)</span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white text-balance">
            Space Invaders per Commodore 64: Sviluppo in Assembly 6502
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Codice sorgente modulare commentato in dettaglio, driver audio per il chip SID 6581, grafica sprite per il chip video VIC-II, simulatore giocabile in tempo reale e script di build multipiattaforma per Windows e Linux/macOS.
          </p>
        </div>

        {/* Tab Viewport */}
        <div className="w-full">
          {activeTab === 'game' && <C64GameCanvas />}
          {activeTab === 'code' && <CodeExplorer />}
          {activeTab === 'sid' && <SidLab />}
          {activeTab === 'sprites' && <SpriteViewer />}
          {activeTab === 'build' && <BuildGuide />}
        </div>
      </main>

      {/* ==================================================================== */}
      {/* FOOTER */}
      {/* ==================================================================== */}
      <footer className="w-full border-t border-slate-900 py-6 px-4 md:px-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>Commodore 64 Space Invaders Assembly Project</span>
            <span>·</span>
            <span>Target MOS 6502 / 6510 Microprocessor</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setActiveTab('code')} className="hover:text-cyan-400 transition-colors">
              File Sorgenti (.asm)
            </button>
            <button onClick={() => setActiveTab('build')} className="hover:text-cyan-400 transition-colors">
              Istruzioni VICE
            </button>
            <button onClick={() => downloadC64PrgFile()} className="hover:text-cyan-400 transition-colors">
              Scarica .PRG
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
