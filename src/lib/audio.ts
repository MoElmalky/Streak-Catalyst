// Procedural Web Audio API sound synthesis for Catalyst
// No external mp3 or wav files required - zero latency and lightweight!

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("catalyst_muted");
      this.isMuted = savedMute === "true";
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("catalyst_muted", String(this.isMuted));
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Explosive flare-up sound on task completion
  public playIgnition(tierLevel: number = 1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sub bass drop
    const oscSub = this.ctx.createOscillator();
    const gainSub = this.ctx.createGain();
    oscSub.type = "sine";
    oscSub.frequency.setValueAtTime(140 + tierLevel * 20, now);
    oscSub.frequency.exponentialRampToValueAtTime(45, now + 0.35);

    gainSub.gain.setValueAtTime(0.3, now);
    gainSub.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    oscSub.connect(gainSub);
    gainSub.connect(this.ctx.destination);
    oscSub.start(now);
    oscSub.stop(now + 0.4);

    // Cosmic shimmer chord
    const baseFreq = [261.63, 329.63, 392.0, 523.25, 659.25][Math.min(tierLevel - 1, 4)] || 392.0;
    const harmonicOsc = this.ctx.createOscillator();
    const harmonicGain = this.ctx.createGain();

    harmonicOsc.type = tierLevel >= 4 ? "sawtooth" : "triangle";
    harmonicOsc.frequency.setValueAtTime(baseFreq, now);
    harmonicOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.25);

    harmonicGain.gain.setValueAtTime(0.18, now);
    harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    // Filter to soften
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.5);

    harmonicOsc.connect(filter);
    filter.connect(harmonicGain);
    harmonicGain.connect(this.ctx.destination);

    harmonicOsc.start(now);
    harmonicOsc.stop(now + 0.5);
  }

  // Broken streak extinguishing / fizzle effect
  public playFizzle() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.6);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(180, now + 0.6);
    filter.Q.value = 3;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Subtle button click
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const soundFX = new SoundEngine();
