import React, { useState, useEffect } from 'react';
import { Keyboard, RotateCcw, X, Check, SlidersHorizontal, ArrowLeftRight, Crosshair, Sparkles } from 'lucide-react';

export interface KeyBindings {
  moveLeft: string;
  moveLeftAlt: string;
  moveRight: string;
  moveRightAlt: string;
  fire: string;
  fireAlt: string;
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  moveLeft: 'KeyA',
  moveLeftAlt: 'ArrowLeft',
  moveRight: 'KeyD',
  moveRightAlt: 'ArrowRight',
  fire: 'Space',
  fireAlt: 'ArrowUp'
};

export const C64_CONTROLS_STORAGE_KEY = 'c64_space_invaders_controls';

export function getStoredKeyBindings(): KeyBindings {
  if (typeof window === 'undefined') return DEFAULT_KEY_BINDINGS;
  try {
    const raw = localStorage.getItem(C64_CONTROLS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.moveLeft === 'string' &&
        typeof parsed.moveRight === 'string' &&
        typeof parsed.fire === 'string'
      ) {
        return {
          moveLeft: parsed.moveLeft || DEFAULT_KEY_BINDINGS.moveLeft,
          moveLeftAlt: typeof parsed.moveLeftAlt === 'string' ? parsed.moveLeftAlt : DEFAULT_KEY_BINDINGS.moveLeftAlt,
          moveRight: parsed.moveRight || DEFAULT_KEY_BINDINGS.moveRight,
          moveRightAlt: typeof parsed.moveRightAlt === 'string' ? parsed.moveRightAlt : DEFAULT_KEY_BINDINGS.moveRightAlt,
          fire: parsed.fire || DEFAULT_KEY_BINDINGS.fire,
          fireAlt: typeof parsed.fireAlt === 'string' ? parsed.fireAlt : DEFAULT_KEY_BINDINGS.fireAlt
        };
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_KEY_BINDINGS;
}

export function formatKeyCode(code: string): string {
  if (!code) return 'Nessuno';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  switch (code) {
    case 'Space':
      return 'Spazio';
    case 'ArrowLeft':
      return '← Sinistra';
    case 'ArrowRight':
      return '→ Destra';
    case 'ArrowUp':
      return '↑ Su';
    case 'ArrowDown':
      return '↓ Giù';
    case 'Enter':
      return 'Invio';
    case 'ShiftLeft':
      return 'Shift Sin.';
    case 'ShiftRight':
      return 'Shift Des.';
    case 'ControlLeft':
      return 'Ctrl Sin.';
    case 'ControlRight':
      return 'Ctrl Des.';
    case 'AltLeft':
      return 'Alt';
    case 'AltRight':
      return 'Alt Gr';
    case 'Tab':
      return 'Tab';
    case 'Backspace':
      return 'Backspace';
    default:
      return code;
  }
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  bindings: KeyBindings;
}

export const CONTROL_PRESETS: Preset[] = [
  {
    id: 'default',
    name: 'Ibrido C64 (A/D + Frecce)',
    description: 'A/D o frecce per muoversi, Spazio o Freccia Su per sparare',
    bindings: DEFAULT_KEY_BINDINGS
  },
  {
    id: 'wasd',
    name: 'WASD & Spazio',
    description: 'Movimento classico mano sinistra (A/D) e pollice su Spazio',
    bindings: {
      moveLeft: 'KeyA',
      moveLeftAlt: '',
      moveRight: 'KeyD',
      moveRightAlt: '',
      fire: 'Space',
      fireAlt: 'KeyW'
    }
  },
  {
    id: 'arrows',
    name: 'Frecce Direzionali',
    description: 'Mano destra sui tasti cursore (← / →) e Spazio per fare fuoco',
    bindings: {
      moveLeft: 'ArrowLeft',
      moveLeftAlt: '',
      moveRight: 'ArrowRight',
      moveRightAlt: '',
      fire: 'Space',
      fireAlt: 'ArrowUp'
    }
  },
  {
    id: 'righthand',
    name: 'Mano Destra (J / L / I)',
    description: 'Configurazione arcade alternativa per la mano destra',
    bindings: {
      moveLeft: 'KeyJ',
      moveLeftAlt: '',
      moveRight: 'KeyL',
      moveRightAlt: '',
      fire: 'KeyI',
      fireAlt: 'Space'
    }
  },
  {
    id: 'numpad',
    name: 'Tastierino Numerico',
    description: '4 = Sinistra, 6 = Destra, 0/5 = Sparo Laser',
    bindings: {
      moveLeft: 'Numpad4',
      moveLeftAlt: '',
      moveRight: 'Numpad6',
      moveRightAlt: '',
      fire: 'Numpad0',
      fireAlt: 'Numpad5'
    }
  }
];

export type BindingKey = keyof KeyBindings;

interface ControlsConfigPanelProps {
  bindings: KeyBindings;
  onChangeBindings: (newBindings: KeyBindings) => void;
  onClose: () => void;
  activeRemapKey: BindingKey | null;
  onSetRemapKey: (key: BindingKey | null) => void;
}

export const ControlsConfigPanel: React.FC<ControlsConfigPanelProps> = ({
  bindings,
  onChangeBindings,
  onClose,
  activeRemapKey,
  onSetRemapKey
}) => {
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Ascolta la pressione del nuovo tasto quando activeRemapKey è impostato
  useEffect(() => {
    if (!activeRemapKey) return;

    const handleCapture = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Escape annulla la rimappatura
      if (e.code === 'Escape') {
        onSetRemapKey(null);
        return;
      }

      // Backspace o Delete su uno slot alternativo permette di rimuoverlo
      if ((e.code === 'Backspace' || e.code === 'Delete') && activeRemapKey.endsWith('Alt')) {
        const updated = {
          ...bindings,
          [activeRemapKey]: ''
        };
        onChangeBindings(updated);
        try {
          localStorage.setItem(C64_CONTROLS_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        onSetRemapKey(null);
        setSaveNotice('Tasto alternativo rimosso');
        setTimeout(() => setSaveNotice(null), 1800);
        return;
      }

      // Assegna il nuovo tasto
      const updated = {
        ...bindings,
        [activeRemapKey]: e.code
      };
      onChangeBindings(updated);
      try {
        localStorage.setItem(C64_CONTROLS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      onSetRemapKey(null);
      setSaveNotice(`Tasto [${formatKeyCode(e.code)}] assegnato con successo!`);
      setTimeout(() => setSaveNotice(null), 2000);
    };

    window.addEventListener('keydown', handleCapture, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleCapture, { capture: true });
    };
  }, [activeRemapKey, bindings, onChangeBindings, onSetRemapKey]);

  const handleResetDefaults = () => {
    onChangeBindings(DEFAULT_KEY_BINDINGS);
    try {
      localStorage.setItem(C64_CONTROLS_STORAGE_KEY, JSON.stringify(DEFAULT_KEY_BINDINGS));
    } catch {
      // ignore
    }
    onSetRemapKey(null);
    setSaveNotice('Comandi ripristinati ai valori predefiniti');
    setTimeout(() => setSaveNotice(null), 2000);
  };

  const handleApplyPreset = (preset: Preset) => {
    onChangeBindings(preset.bindings);
    try {
      localStorage.setItem(C64_CONTROLS_STORAGE_KEY, JSON.stringify(preset.bindings));
    } catch {
      // ignore
    }
    onSetRemapKey(null);
    setSaveNotice(`Preset "${preset.name}" applicato!`);
    setTimeout(() => setSaveNotice(null), 2000);
  };

  const actionRows: Array<{
    title: string;
    description: string;
    primaryKey: BindingKey;
    altKey: BindingKey;
    icon: React.ReactNode;
  }> = [
    {
      title: 'Muovi a Sinistra',
      description: 'Sposta il cannone mobile verso il bordo sinistro',
      primaryKey: 'moveLeft',
      altKey: 'moveLeftAlt',
      icon: <ArrowLeftRight className="w-4 h-4 text-cyan-400 rotate-180" />
    },
    {
      title: 'Muovi a Destra',
      description: 'Sposta il cannone mobile verso il bordo destro',
      primaryKey: 'moveRight',
      altKey: 'moveRightAlt',
      icon: <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
    },
    {
      title: 'Fuoco Laser',
      description: 'Spara un raggio verso la flotta degli invasori alieni',
      primaryKey: 'fire',
      altKey: 'fireAlt',
      icon: <Crosshair className="w-4 h-4 text-rose-400" />
    }
  ];

  return (
    <div className="w-full mt-4 p-4 md:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl text-slate-200">
      {/* Intestazione Pannello */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/80">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Configurazione Comandi & Rimappatura Tasti
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                VIC-II / Canvas
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Clicca sul tasto che desideri cambiare e premi il nuovo tasto sulla tastiera (Esc per annullare).
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Chiudi pannello configurazione"
          aria-label="Chiudi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Notifica di salvataggio / conferma */}
      {saveNotice && (
        <div className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Istruzione attiva durante la cattura */}
      {activeRemapKey && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-amber-950/70 border border-amber-600/80 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-semibold">
              In ascolto: premi un tasto sulla tastiera per l'azione{' '}
              <span className="underline font-bold text-white uppercase">{activeRemapKey}</span>
            </span>
          </div>
          <button
            onClick={() => onSetRemapKey(null)}
            className="px-2 py-0.5 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded text-[11px] font-mono"
          >
            Annulla (Esc)
          </button>
        </div>
      )}

      {/* Preset Rapidi */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>Preset di Controllo Rapidi:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CONTROL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors flex items-center gap-1"
              title={preset.description}
            >
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabella Rimappatura Azioni */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {actionRows.map((row) => {
          const isPrimaryActive = activeRemapKey === row.primaryKey;
          const isAltActive = activeRemapKey === row.altKey;
          const primaryVal = bindings[row.primaryKey];
          const altVal = bindings[row.altKey];

          return (
            <div
              key={row.title}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between gap-2.5"
            >
              <div>
                <div className="flex items-center gap-2">
                  {row.icon}
                  <span className="text-xs font-bold text-white">{row.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{row.description}</p>
              </div>

              <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/80">
                {/* Tasto Primario */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Primario:</span>
                  <button
                    onClick={() => onSetRemapKey(isPrimaryActive ? null : row.primaryKey)}
                    className={`px-2.5 py-1 rounded font-mono text-xs font-bold transition-all border ${
                      isPrimaryActive
                        ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700 hover:border-cyan-500'
                    }`}
                    title="Clicca per rimappare il tasto primario"
                  >
                    {isPrimaryActive ? 'Premi tasto...' : formatKeyCode(primaryVal)}
                  </button>
                </div>

                {/* Tasto Alternativo */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Alternativo:</span>
                  <button
                    onClick={() => onSetRemapKey(isAltActive ? null : row.altKey)}
                    className={`px-2.5 py-1 rounded font-mono text-xs font-bold transition-all border ${
                      isAltActive
                        ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 animate-pulse'
                        : altVal
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-500'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-500 border-dashed border-slate-800 hover:text-slate-400'
                    }`}
                    title="Clicca per rimappare (o premi Backspace per cancellare)"
                  >
                    {isAltActive ? 'Premi tasto...' : formatKeyCode(altVal)}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra Azioni Inferiore & Tasti Fissi */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-slate-400 text-[11px]">
          <span className="font-semibold text-slate-300">Tasti Fissi C64:</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">P</kbd> Pausa
          <span className="text-slate-600">·</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">M</kbd> Muto SID
          <span className="text-slate-600">·</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">1-3</kbd> Difficoltà
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs"
            title="Ripristina i comandi predefiniti di fabbrica (A/D/Spazio)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ripristina Predefiniti</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors text-xs"
          >
            Fatto
          </button>
        </div>
      </div>
    </div>
  );
};
