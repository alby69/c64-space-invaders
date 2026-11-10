import React, { useState } from 'react';
import { C64_SOURCE_FILES, SourceFileItem, downloadSingleFile } from '../c64/c64SourceFiles';
import { Copy, Check, Download, FileCode, Cpu, Layers } from 'lucide-react';

export const CodeExplorer: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>('main-asm');
  const [copied, setCopied] = useState<boolean>(false);

  const selectedFile = C64_SOURCE_FILES.find((f) => f.id === selectedFileId) || C64_SOURCE_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Syntax highlighting semplice e pulito per 6502 Assembly
  const renderHighlightedCode = (code: string) => {
    const lines = code.split('\n');

    return lines.map((line, lineIndex) => {
      // Commenti (; o rem o #)
      const isComment = line.trim().startsWith(';') || line.trim().startsWith('rem') || line.trim().startsWith('#');
      if (isComment) {
        return (
          <div key={lineIndex} className="table-row leading-relaxed hover:bg-slate-900/60">
            <span className="table-cell pr-4 text-right select-none text-slate-600 font-mono text-xs tabular-nums w-12">
              {lineIndex + 1}
            </span>
            <span className="table-cell font-mono text-xs text-slate-500 whitespace-pre">
              {line}
            </span>
          </div>
        );
      }

      // Evidenziazione istruzioni 6502 e direttive
      const opcodes = /\b(sei|cli|cld|sed|lda|sta|ldx|stx|ldy|sty|inx|dex|iny|dey|tax|txa|tay|tya|jmp|jsr|rts|bne|beq|bcc|bcs|bpl|bmi|and|ora|eor|clc|sec|adc|sbc|cmp|cpx|cpy|lsr|asl|ror|rol|nop|inc|dec)\b/gi;
      const directives = /\b(!byte|!src|!scr|!zone|!to)\b/gi;

      const formattedLine = line
        .replace(directives, '<span class="text-pink-400 font-semibold">$1</span>')
        .replace(opcodes, '<span class="text-cyan-400 font-semibold uppercase">$1</span>')
        .replace(/(\$[0-9A-Fa-f]{2,4})/g, '<span class="text-amber-300 font-mono">$1</span>')
        .replace(/(%[01]{8})/g, '<span class="text-emerald-400 font-mono">$1</span>')
        .replace(/(;.*$)/g, '<span class="text-slate-500 italic">$1</span>');

      return (
        <div key={lineIndex} className="table-row leading-relaxed hover:bg-slate-900/60">
          <span className="table-cell pr-4 text-right select-none text-slate-600 font-mono text-xs tabular-nums w-12">
            {lineIndex + 1}
          </span>
          <span
            className="table-cell font-mono text-xs text-slate-300 whitespace-pre"
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        </div>
      );
    });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* File Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto">
        {C64_SOURCE_FILES.map((file) => {
          const isActive = file.id === selectedFile.id;
          return (
            <button
              key={file.id}
              onClick={() => setSelectedFileId(file.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 shrink-0" />
              <span>{file.name}</span>
            </button>
          );
        })}
      </div>

      {/* Header Dettaglio File Attivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-cyan-400 font-semibold">{selectedFile.name}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              {selectedFile.hardwareFocus}
            </span>
          </div>
          <p className="text-xs text-slate-400">{selectedFile.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiato!' : 'Copia Codice'}
          </button>

          <button
            onClick={() => downloadSingleFile(selectedFile)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Scarica {selectedFile.name}
          </button>
        </div>
      </div>

      {/* Finestra Codice con Line Numbers */}
      <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
          <span>Assembly 6502 / C64 Architecture</span>
          <span>{selectedFile.content.split('\n').length} Righe</span>
        </div>

        <div className="p-4 overflow-x-auto max-h-[580px] overflow-y-auto">
          <div className="table w-full">
            {renderHighlightedCode(selectedFile.content)}
          </div>
        </div>
      </div>
    </div>
  );
};
