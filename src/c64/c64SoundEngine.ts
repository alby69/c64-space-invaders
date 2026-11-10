/**
 * Sintetizzatore Web Audio per simulare il chip sonoro SID 6581 del Commodore 64.
 * Riproduce fedelmente i registri hardware:
 * - Voce 1: Sparo Laser (Sweep di frequenza + Inviluppo ADSR)
 * - Voce 2: Marcia a 4 note degli Invaders (Basso a dente di sega)
 * - Voce 3: Esplosione (Generatore di Rumore Bianco + Filtro passa-basso)
 * - Voce 1 (alt): Sirena continua UFO
 */

export interface SidRegisterState {
  v1FreqLo: string;
  v1FreqHi: string;
  v1Waveform: string;
  v1Adsr: string;
  v2FreqLo: string;
  v2FreqHi: string;
  v2Waveform: string;
  v2Adsr: string;
  v3FreqLo: string;
  v3FreqHi: string;
  v3Waveform: string;
  v3Adsr: string;
  filterCutoff: string;
  masterVol: string;
}

class C64SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isMuted: boolean = false;
  private marchNoteIndex: number = 0;
  private ufoOscillator: OscillatorNode | null = null;
  private ufoGain: GainNode | null = null;

  // Stato registri virtuali del SID per ispezione
  public registers: SidRegisterState = {
    v1FreqLo: '$00',
    v1FreqHi: '$1E',
    v1Waveform: 'TRI ($11)',
    v1Adsr: 'A:0 D:4 S:0 R:2',
    v2FreqLo: '$70',
    v2FreqHi: '$04',
    v2Waveform: 'SAW ($21)',
    v2Adsr: 'A:0 D:6 S:0 R:2',
    v3FreqLo: '$20',
    v3FreqHi: '$08',
    v3Waveform: 'NOISE ($81)',
    v3Adsr: 'A:0 D:10 S:0 R:4',
    filterCutoff: '$00',
    masterVol: '$0F (15/15)'
  };

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Pre-genera 1 secondo di Rumore Bianco per la Voce 3 del SID
      const bufferSize = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.registers.masterVol = muted ? '$00 (MUTED)' : '$0F (15/15)';
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * VOCE 1: Sparo Laser del Giocatore ($D400-$D406)
   * Sweep rapido di frequenza da 1100 Hz a 180 Hz con onda triangolare
   */
  public playShoot() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    this.registers.v1FreqHi = '$1E';
    this.registers.v1FreqLo = '$00';
    this.registers.v1Waveform = 'TRI+GATE ($11)';
    this.registers.v1Adsr = 'A:0 D:4 S:0 R:2';

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1150, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.16);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * VOCE 2: Marcia a 4 Note degli Invasori ($D407-$D40D)
   * 4 note basse in scala discendente a dente di sega (Fa#, Mi, Re, Do)
   */
  public playMarchStep(forcedIndex?: number) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const noteIdx = forcedIndex !== undefined ? forcedIndex : this.marchNoteIndex;
    const notes = [
      { freq: 92.5, hi: '$04', lo: '$70', name: 'Fa#1 (F#1)' },
      { freq: 82.4, hi: '$03', lo: '$F0', name: 'Mi1  (E1)' },
      { freq: 73.4, hi: '$03', lo: '$80', name: 'Re1  (D1)' },
      { freq: 65.4, hi: '$03', lo: '$20', name: 'Do1  (C1)' }
    ];

    const currentNote = notes[noteIdx % 4];
    this.registers.v2FreqHi = currentNote.hi;
    this.registers.v2FreqLo = currentNote.lo;
    this.registers.v2Waveform = 'SAW+GATE ($21)';
    this.registers.v2Adsr = 'A:0 D:6 S:0 R:2';

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Il SID ha un timbro ricco di armoniche, usiamo sawtooth
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(currentNote.freq, now);

    // Inviluppo percussivo secco
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.12);

    if (forcedIndex === undefined) {
      this.marchNoteIndex = (this.marchNoteIndex + 1) % 4;
    }
  }

  /**
   * VOCE 3: Esplosione Aliena / Giocatore ($D40E-$D414)
   * Rumore Bianco sintetico con filtro passa-basso
   */
  public playExplosion() {
    this.initContext();
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.isMuted) return;

    this.registers.v3FreqHi = '$08';
    this.registers.v3FreqLo = '$20';
    this.registers.v3Waveform = 'NOISE+GATE ($81)';
    this.registers.v3Adsr = 'A:0 D:10 S:0 R:4';

    const now = this.ctx.currentTime;
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    // Filtro per simulare la risposta di frequenza del MOS 6581
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + 0.4);
  }

  /**
   * VOCE 1: Sirena UFO Volante Misterioso
   */
  public startUfoSound() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.ufoOscillator || this.isMuted) return;

    const now = this.ctx.currentTime;
    this.ufoOscillator = this.ctx.createOscillator();
    this.ufoGain = this.ctx.createGain();

    this.ufoOscillator.type = 'square';
    this.ufoOscillator.frequency.setValueAtTime(460, now);

    // LFO per creare l'effetto bitonale a sirena
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(8, now); // 8 Hz vibrato
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(60, now);
    lfo.connect(lfoGain);
    lfoGain.connect(this.ufoOscillator.frequency);
    lfo.start(now);

    this.ufoGain.gain.setValueAtTime(0.18, now);

    this.ufoOscillator.connect(this.ufoGain);
    this.ufoGain.connect(this.masterGain);

    this.ufoOscillator.start(now);
  }

  public stopUfoSound() {
    if (this.ufoOscillator && this.ufoGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.ufoGain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        this.ufoOscillator.stop(now + 0.06);
      } catch {
        // Ignora se già fermato
      }
      this.ufoOscillator = null;
      this.ufoGain = null;
    }
  }

  /**
   * Jingle Vittoria / Nuova Ondata
   */
  public playWaveClear() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const notes = [261.6, 329.6, 392.0, 523.2]; // Do4, Mi4, Sol4, Do5
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const start = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.16);
    });
  }
}

export const c64Sound = new C64SoundEngine();
