import React, { useState } from 'react';
import { c64Sound, SidRegisterState } from '../c64/c64SoundEngine';
import { Volume2, Play, Sparkles, Activity, Music, Radio } from 'lucide-react';

export const SidLab: React.FC = () => {
  const [currentRegisters, setCurrentRegisters] = useState<SidRegisterState>({ ...c64Sound.registers });
  const [activeVoice, setActiveVoice] = useState<string>('Tutte le voci pronte');
  const [marchStep, setMarchStep] = useState<number>(0);

  const refreshRegs = () => {
    setCurrentRegisters({ ...c64Sound.registers });
  };

  const testShoot = () => {
    c64Sound.playShoot();
    setActiveVoice('VOCE 1: Laser Pew ($D400-$D406) - Onda Triangolare + Sweep');
    refreshRegs();
  };

  const testMarch = (noteIndex?: number) => {
    const idx = noteIndex !== undefined ? noteIndex : marchStep;
    c64Sound.playMarchStep(idx);
    setMarchStep((idx + 1) % 4);
    setActiveVoice(`VOCE 2: Marcia Battito #${idx + 1} ($D407-$D40D) - Onda a Dente di Sega`);
    refreshRegs();
  };

  const testExplosion = () => {
    c64Sound.playExplosion();
    setActiveVoice('VOCE 3: Esplosione ($D40E-$D414) - Rumore Bianco + Filtro');
    refreshRegs();
  };

  const testUfo = () => {
    c64Sound.startUfoSound();
    setActiveVoice('VOCE 1: Sirena UFO ($D400) - Modulazione a Onda Quadra');
    setTimeout(() => {
      c64Sound.stopUfoSound();
      setActiveVoice('Sirena UFO arrestata');
    }, 1800);
    refreshRegs();
  };

  const testWaveClear = () => {
    c64Sound.playWaveClear();
    setActiveVoice('Jingle Vittoria Ondata - Arpeggio Sawtooth');
    refreshRegs();
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Intro del modulo sonoro */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Sintetizzatore Sonoro MOS 6581 SID (Sound Interface Device)</h3>
          </div>
          <p className="text-xs text-slate-400">
            Il chip SID del Commodore 64 contiene 3 oscillatori analogici indipendenti a 16-bit, 4 forme d&apos;onda (Senoide, Dente di sega, Quadra con Pulse Width Modulation, Rumore bianco), inviluppi ADSR hardware e filtri multimodali.
          </p>
        </div>

        <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 shrink-0 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-green-400 animate-pulse" />
          <span>{activeVoice}</span>
        </div>
      </div>

      {/* Pulsanti Test Effetti Sonori */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card Voce 1 Laser */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">VOCE 1 · $D400</span>
            <h4 className="text-sm font-semibold text-slate-200">Laser Cannon Shot</h4>
            <p className="text-xs text-slate-400">Sweep di frequenza discendente da 1150 Hz a 150 Hz, forma d&apos;onda triangolare ($11).</p>
          </div>
          <button
            onClick={testShoot}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-md shadow-cyan-500/10"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Ascolta Laser PEW
          </button>
        </div>

        {/* Card Voce 2 Marcia 4 Note */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-mono text-yellow-400 font-bold uppercase tracking-wider">VOCE 2 · $D407</span>
            <h4 className="text-sm font-semibold text-slate-200">Marcia 4 Note Invaders</h4>
            <p className="text-xs text-slate-400">4 note di basso discendenti (Fa#, Mi, Re, Do) con onda a dente di sega ($21) e decay secco.</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => testMarch()}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-md shadow-yellow-500/10"
            >
              <Music className="w-3.5 h-3.5" />
              Passo Marcia ({marchStep + 1}/4)
            </button>
          </div>
        </div>

        {/* Card Voce 3 Esplosione */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-mono text-red-400 font-bold uppercase tracking-wider">VOCE 3 · $D40E</span>
            <h4 className="text-sm font-semibold text-slate-200">Esplosione White Noise</h4>
            <p className="text-xs text-slate-400">Generatore di rumore bianco pseudo-casuale hardware ($81) con inviluppo ad alto decay.</p>
          </div>
          <button
            onClick={testExplosion}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg text-xs transition-colors shadow-md shadow-red-500/10"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Ascolta Esplosione
          </button>
        </div>

        {/* Card Sirena UFO */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">VOCE 1 · UFO SIREN</span>
            <h4 className="text-sm font-semibold text-slate-200">Sirena Mystery UFO</h4>
            <p className="text-xs text-slate-400">Modulazione continua bitonale ad onda quadra/pulse ($41) durante il volo del disco volante.</p>
          </div>
          <button
            onClick={testUfo}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-lg text-xs transition-colors shadow-md shadow-purple-500/10"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Ascolta Sirena UFO
          </button>
        </div>
      </div>

      {/* Tabella Registri Hardware SID Live */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Mappa dei Registri Hardware del Chip SID ($D400 - $D418)</span>
          </div>
          <span className="text-xs font-mono text-slate-500">Clock PAL 0.985 MHz</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Voce 1 */}
          <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
              <span>VOCE 1 ($D400-$D406)</span>
              <span className="text-slate-500 font-mono">Laser / UFO</span>
            </div>
            <div className="text-xs space-y-1 font-mono text-slate-300">
              <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                <span className="text-slate-500">$D400 Freq Lo:</span>
                <span className="text-cyan-300">{currentRegisters.v1FreqLo}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                <span className="text-slate-500">$D401 Freq Hi:</span>
                <span className="text-cyan-300">{currentRegisters.v1FreqHi}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                <span className="text-slate-500">$D404 Forma Onda:</span>
                <span className="text-emerald-300">{currentRegisters.v1Waveform}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">$D405/$D406 ADSR:</span>
                <span className="text-amber-300">{currentRegisters.v1Adsr}</span>
              </div>
            </div>
          </div>

          {/* Voce 2 */}
          <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-yellow-400">
              <span>VOCE 2 ($D407-$D40D)</span>
              <span className="text-slate-500 font-mono">Marcia 4 Note</span>
            </div>
            <div className="text-xs space-y-1 font-mono text-slate-300">
              <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                <span className="text-slate-500">$D407 Freq Lo:</span>
                <span className="text-yellow-300">{currentRegisters.v2FreqLo}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                <span className="text-slate-500">$D408 Freq Hi:</span>
                <span className="text-yellow-300">{currentRegisters.v2FreqHi}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                <span className="text-slate-500">$D40B Forma Onda:</span>
                <span className="text-emerald-300">{currentRegisters.v2Waveform}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">$D40C/$D40D ADSR:</span>
                <span className="text-amber-300">{currentRegisters.v2Adsr}</span>
              </div>
            </div>
          </div>

          {/* Voce 3 */}
          <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-red-400">
              <span>VOCE 3 ($D40E-$D414)</span>
              <span className="text-slate-500 font-mono">Esplosione</span>
            </div>
            <div className="text-xs space-y-1 font-mono text-slate-300">
              <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                <span className="text-slate-500">$D40E Freq Lo:</span>
                <span className="text-red-300">{currentRegisters.v3FreqLo}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                <span className="text-slate-500">$D40F Freq Hi:</span>
                <span className="text-red-300">{currentRegisters.v3FreqHi}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                <span className="text-slate-500">$D412 Forma Onda:</span>
                <span className="text-emerald-300">{currentRegisters.v3Waveform}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">$D413/$D414 ADSR:</span>
                <span className="text-amber-300">{currentRegisters.v3Adsr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Master Volume e Info */}
        <div className="p-3 bg-slate-900 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            <strong className="text-slate-200">Volume Master ($D418):</strong>{' '}
            <span className="font-mono text-cyan-300">15 / 15 ($0F)</span> · Uscita audio analogica al massimo dinamismo.
          </div>
          <button
            onClick={testWaveClear}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Suona Jingle Vittoria
          </button>
        </div>
      </div>
    </div>
  );
};
