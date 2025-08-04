/**
 * Lightweight SFX using ZzFX-like parameterization but implemented inline with WebAudio.
 * No external dependency; generates short blips suitable for hits, pickups, and level-up.
 */
export class SFX {
  private ctx: AudioContext | null = null;

  private get audio(): AudioContext {
    if (!this.ctx) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      this.ctx = new Ctx();
    }
    return this.ctx!;
  }

  private play(params: {
    freq?: number;        // base frequency
    vol?: number;         // volume 0..1
    attack?: number;      // seconds
    decay?: number;       // seconds
    type?: OscillatorType;// 'sine'|'square'|'sawtooth'|'triangle'
    slide?: number;       // frequency slide over time (Hz per second)
    noise?: boolean;      // noise burst instead of tone
    lpCutoff?: number;    // lowpass cutoff
  } = {}) {
    const ctx = this.audio;
    const now = ctx.currentTime;

    const vol = params.vol ?? 0.15;
    const attack = params.attack ?? 0.005;
    const decay = params.decay ?? 0.12;
    const total = attack + decay;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + total);

    let source: AudioNode;

    if (params.noise) {
      const bufferSize = 1 << 14;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = false;
      source = noise;
      (noise as AudioBufferSourceNode).start(now);
      (noise as AudioBufferSourceNode).stop(now + total);
    } else {
      const osc = ctx.createOscillator();
      osc.type = params.type ?? "triangle";
      const baseFreq = params.freq ?? 440;
      osc.frequency.setValueAtTime(baseFreq, now);
      if (params.slide && params.slide !== 0) {
        osc.frequency.linearRampToValueAtTime(Math.max(20, baseFreq + params.slide * total), now + total);
      }
      source = osc;
      (osc as OscillatorNode).start(now);
      (osc as OscillatorNode).stop(now + total);
    }

    let node: AudioNode = source;

    if (params.lpCutoff) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(params.lpCutoff, now);
      node.connect(lp);
      node = lp;
    }

    node.connect(gain).connect(ctx.destination);
  }

  hit() {
    // quick 'tick' for projectile hit
    this.play({ freq: 900, vol: 0.12, attack: 0.002, decay: 0.07, type: "square", slide: -800, lpCutoff: 8000 });
  }

  pickup() {
    // rising blip for XP pickup
    this.play({ freq: 650, vol: 0.12, attack: 0.003, decay: 0.09, type: "triangle", slide: 500, lpCutoff: 6000 });
  }

  levelUp() {
    // two-step arpeggio
    this.play({ freq: 440, vol: 0.16, attack: 0.004, decay: 0.12, type: "sawtooth", slide: 300 });
    setTimeout(() => this.play({ freq: 660, vol: 0.14, attack: 0.004, decay: 0.14, type: "sawtooth", slide: 200 }), 60);
  }
}

export const Sfx = new SFX();