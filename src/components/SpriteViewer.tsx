import React, { useState } from 'react';
import { C64_PALETTE } from './C64GameCanvas';
import { Eye, Layers, Palette, Grid } from 'lucide-react';

interface SpriteInfo {
  name: string;
  block: string;
  address: string;
  colorName: string;
  colorHex: string;
  description: string;
  bytes: number[][]; // 21 rows of 3 bytes
}

// Convertiamo le stringhe dei pattern in 21 righe di 3 byte ciascuna
function patternToBytes(pattern: string[]): number[][] {
  const result: number[][] = [];
  for (let r = 0; r < 21; r++) {
    const rowStr = pattern[r] || '........................';
    const rowBytes: number[] = [0, 0, 0];
    for (let c = 0; c < 24; c++) {
      const byteIdx = Math.floor(c / 8);
      const bitIdx = 7 - (c % 8);
      if (rowStr[c] === 'x') {
        rowBytes[byteIdx] |= (1 << bitIdx);
      }
    }
    result.push(rowBytes);
  }
  return result;
}

const SPRITES_DATA: SpriteInfo[] = [
  {
    name: 'Cannone Giocatore (Player Cannon)',
    block: '$80 (128 dec)',
    address: '$2000 (8192)',
    colorName: 'Verde Chiaro ($0D)',
    colorHex: C64_PALETTE.lightGreen,
    description: 'Il carro armato difensivo terrestre a 24x21 pixel con torretta laser centrale perfettamente simmetrica.',
    bytes: patternToBytes([
      "...........xx...........",
      "...........xx...........",
      "..........xxxx..........",
      "..........xxxx..........",
      ".........xxxxxx.........",
      "....xxxxxxxxxxxxxxxx....",
      "...xxxxxxxxxxxxxxxxxx...",
      "..xxxxxxxxxxxxxxxxxxxx..",
      "..xxxxxxxxxxxxxxxxxxxx..",
      "..xxxxxxxxxxxxxxxxxxxx..",
      "..xxxxxxxxxxxxxxxxxxxx..",
      "..xx..xxxxxxxxxxxx..xx..",
      "..xx...xxxxxxxxxx...xx..",
      "..xx................xx..",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ])
  },
  {
    name: 'Invasore 1 - Squid (Frame A)',
    block: '$81 (129 dec)',
    address: '$2040 (8256)',
    colorName: 'Ciano ($03)',
    colorHex: C64_PALETTE.cyan,
    description: 'Invasore della riga superiore (30 Punti). Calamaro spaziale con tentacoli aperti.',
    bytes: patternToBytes([
      "..........xxxx..........",
      "........xxxxxxxx........",
      ".......xxxxxxxxxx.......",
      "......xxx..xx..xxx......",
      "......xxxxxxxxxxxx......",
      "........xx....xx........",
      ".......xx.xxxx.xx.......",
      "......xx..x..x..xx......",
      ".....xx..........xx.....",
      "....xx............xx....",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ])
  },
  {
    name: 'Invasore 2 - Crab (Frame A)',
    block: '$83 (131 dec)',
    address: '$20C0 (8384)',
    colorName: 'Giallo ($07)',
    colorHex: C64_PALETTE.yellow,
    description: 'Invasore delle righe centrali (20 Punti). Granchio con chele laterali e occhi minacciosi.',
    bytes: patternToBytes([
      "....xx............xx....",
      ".....xx..........xx.....",
      "....xxxxxxxxxxxxxxxx....",
      "...xxx..xxxxxxxx..xxx...",
      "..xxxxxxxxxxxxxxxxxxxx..",
      "..xx.xxxxxxxxxxxxxx.xx..",
      "..xx.xx..........xx.xx..",
      "......xx........xx......",
      ".....xx..........xx.....",
      "....xx............xx....",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ])
  },
  {
    name: 'Invasore 3 - Octopus (Frame A)',
    block: '$85 (133 dec)',
    address: '$2140 (8512)',
    colorName: 'Rosso Chiaro ($0A)',
    colorHex: C64_PALETTE.lightRed,
    description: 'Invasore delle righe inferiori (10 Punti). Polpo alieno con tentacoli ad arco.',
    bytes: patternToBytes([
      ".........xxxxxx.........",
      ".......xxxxxxxxxx.......",
      ".....xxxxxxxxxxxxxx.....",
      "....xxx..xxxxxx..xxx....",
      "....xxxxxxxxxxxxxxxx....",
      "......xxx......xxx......",
      ".....xx.xxxxxxxx.xx.....",
      "....xx..xx....xx..xx....",
      "...xx..............xx...",
      "..xx................xx..",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ])
  },
  {
    name: 'Disco Volante (Mystery UFO)',
    block: '$87 (135 dec)',
    address: '$21C0 (8640)',
    colorName: 'Rosso ($02)',
    colorHex: C64_PALETTE.red,
    description: 'Navicella misteriosa che attraversa la cima dello schermo per bonus punteggio.',
    bytes: patternToBytes([
      ".........xxxxxx.........",
      ".......xxxxxxxxxx.......",
      ".....xxxxxxxxxxxxxx.....",
      "...xxx.xx.xxxx.xx.xxx...",
      "..xxxxxxxxxxxxxxxxxxxx..",
      "..xxxxxxxxxxxxxxxxxxxx..",
      "...xxxxxxxxxxxxxxxxxx...",
      ".....xx...xxxx...xx.....",
      "......x..........x......",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ])
  }
];

export const SpriteViewer: React.FC = () => {
  const [selectedSpriteIndex, setSelectedSpriteIndex] = useState(0);
  const sprite = SPRITES_DATA[selectedSpriteIndex];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Intro del modulo Sprite */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-slate-100 text-sm">VIC-II Hardware Sprite Architecture & Memory Map</h3>
          </div>
          <p className="text-xs text-slate-400">
            Gli sprite del Commodore 64 sono matrici di 24×21 pixel. Ciascuna riga è formata da 3 byte (8 pixel per byte). 21 righe × 3 byte = 63 byte + 1 byte di padding = esattamente 64 byte per sprite ($40 esadecimale).
          </p>
        </div>

        <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 shrink-0">
          Puntatori Sprite: $07F8-$07FF
        </div>
      </div>

      {/* Barra selezione Sprite */}
      <div className="flex flex-wrap items-center gap-2">
        {SPRITES_DATA.map((s, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedSpriteIndex(idx)}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap ${
              idx === selectedSpriteIndex
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {s.name.split(' (')[0]}
          </button>
        ))}
      </div>

      {/* Dettaglio e Visualizzazione Sprite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Griglia Ingrandita 24x21 con pixel reali */}
        <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-4">
          <div className="flex items-center justify-between w-full pb-2 border-b border-slate-800 text-xs">
            <span className="font-semibold text-slate-200">{sprite.name}</span>
            <span className="font-mono text-cyan-400">{sprite.colorName}</span>
          </div>

          {/* Griglia 24x21 pixel con bordo monitor */}
          <div className="p-3 bg-black border-4 border-slate-950 rounded-lg shadow-inner">
            <div className="grid grid-cols-24 gap-[1px] bg-slate-950" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
              {sprite.bytes.map((rowBytes, r) => {
                const bits: boolean[] = [];
                for (let b = 0; b < 3; b++) {
                  const val = rowBytes[b];
                  for (let bit = 7; bit >= 0; bit--) {
                    bits.push(((val >> bit) & 1) === 1);
                  }
                }
                return bits.map((isSet, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] transition-all"
                    style={{
                      backgroundColor: isSet ? sprite.colorHex : '#0a0d14'
                    }}
                    title={`Riga ${r + 1}, Pixel ${c + 1}: ${isSet ? 'Acceso (1)' : 'Spento (0)'}`}
                  />
                ));
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center">
            Risoluzione: <strong>24 × 21 pixel</strong> · Hi-Res Monocolore ($D01C = $00)
          </div>
        </div>

        {/* Tabella Byte Esadecimali e Binari (Hex Dump) */}
        <div className="lg:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-200">Byte Assembly (!byte %xxxxxxxx, %xxxxxxxx, %xxxxxxxx)</span>
            </div>
            <span className="font-mono text-xs text-amber-400">{sprite.address}</span>
          </div>

          <div className="text-xs text-slate-400">
            {sprite.description}
          </div>

          {/* Tabella dei 63 byte riga per riga */}
          <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300">
            <div className="space-y-1">
              {sprite.bytes.map((row, r) => (
                <div key={r} className="flex items-center justify-between py-0.5 hover:bg-slate-900/60 px-1 rounded">
                  <span className="text-slate-500 w-16">Riga {r + 1}:</span>
                  <span className="text-emerald-400">
                    %{row[0].toString(2).padStart(8, '0')}, %{row[1].toString(2).padStart(8, '0')}, %{row[2].toString(2).padStart(8, '0')}
                  </span>
                  <span className="text-amber-300">
                    ${row[0].toString(16).toUpperCase().padStart(2, '0')}, ${row[1].toString(16).toUpperCase().padStart(2, '0')}, ${row[2].toString(16).toUpperCase().padStart(2, '0')}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between py-0.5 text-slate-500 border-t border-slate-800/80 pt-1">
                <span className="w-16">Byte 64:</span>
                <span className="text-slate-600">%00000000 (Padding per allineamento a 64 byte)</span>
                <span className="text-slate-600">$00</span>
              </div>
            </div>
          </div>

          {/* Scheda Tecnico-Informativa */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Blocco di Memoria:</span>
              <strong className="text-cyan-400 font-mono">{sprite.block}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Indirizzo Inizio:</span>
              <strong className="text-amber-400 font-mono">{sprite.address}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Occupazione:</span>
              <strong className="text-emerald-400 font-mono">64 Byte</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
