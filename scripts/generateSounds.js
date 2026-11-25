/**
 * Ludo Champion - Audio Waveform Synthesizer
 * Generates high-fidelity 16-bit PCM WAV audio assets for game sound effects and background music.
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050; // High quality 22.05 kHz

/**
 * Creates a 16-bit PCM Mono RIFF WAV buffer from float samples [-1.0, 1.0]
 */
function createWavBuffer(samples, sampleRate = SAMPLE_RATE) {
  const numSamples = samples.length;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // 'fmt ' Subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);            // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);             // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);   // Mono
  buffer.writeUInt32LE(sampleRate, 24);    // Sample Rate
  buffer.writeUInt32LE(byteRate, 28);      // Byte Rate
  buffer.writeUInt16LE(blockAlign, 32);    // Block Align
  buffer.writeUInt16LE(bitsPerSample, 34); // Bits Per Sample (16-bit)

  // 'data' Subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write 16-bit signed PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    let intVal = s < 0 ? Math.floor(s * 32768) : Math.floor(s * 32767);
    buffer.writeInt16LE(intVal, offset);
    offset += 2;
  }

  return buffer;
}

// -------------------------------------------------------------
// SOUND GENERATORS
// -------------------------------------------------------------

/**
 * 1. CLICK / BUTTON TAP (45ms)
 * Modern, clean tactile bubble pop with smooth envelope
 */
function generateClick() {
  const duration = 0.045;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / totalSamples;
    // Pitch drops from 720 Hz down to 380 Hz
    const freq = 720 - 340 * progress;
    // Soft raised-cosine envelope to prevent clicks
    const env = Math.sin(Math.PI * progress);
    const wave = Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(4 * Math.PI * freq * t);
    samples[i] = wave * env * 0.7;
  }
  return samples;
}

/**
 * 2. DICE ROLL (450ms)
 * Realistic rattling dice in cup & board bouncing:
 * Multiple tumbling collisions with wooden body resonance and sharp clicks
 */
function generateRoll() {
  const duration = 0.45;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  // Collision impacts (time in seconds, intensity, pitch)
  const impacts = [
    { t: 0.00, power: 0.85, freq: 850 },
    { t: 0.04, power: 0.70, freq: 920 },
    { t: 0.09, power: 0.95, freq: 780 },
    { t: 0.15, power: 0.75, freq: 880 },
    { t: 0.21, power: 0.90, freq: 820 },
    { t: 0.28, power: 0.65, freq: 760 },
    { t: 0.34, power: 0.80, freq: 840 },
    { t: 0.39, power: 0.70, freq: 900 },
    { t: 0.42, power: 0.60, freq: 960 },
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    let val = 0;

    for (const impact of impacts) {
      const dt = t - impact.t;
      if (dt >= 0 && dt < 0.08) {
        // Wooden die body resonance (fast decaying sine wave)
        const toneDecay = Math.exp(-dt * 65);
        const tone = Math.sin(2 * Math.PI * impact.freq * dt) * toneDecay;

        // Sharp plastic/wooden edge click (filtered high noise burst)
        const clickDecay = Math.exp(-dt * 180);
        const noise = (Math.sin(dt * 13749.2) * 43758.5453 % 1) * 2 - 1;
        const click = noise * clickDecay;

        val += (tone * 0.65 + click * 0.35) * impact.power;
      }
    }

    // Subtle rolling rumble underneath
    const rumble = (Math.sin(2 * Math.PI * 140 * t) * 0.15 + (Math.random() * 2 - 1) * 0.05) * Math.sin(Math.PI * (t / duration));
    samples[i] = Math.max(-1, Math.min(1, (val + rumble) * 0.75));
  }
  return samples;
}

/**
 * 3. TOKEN HOP / STEP (80ms)
 * Melodic, cheerful wooden marimba / xylophone step:
 * Warm harmonic body (580 Hz) + sharp wooden attack chirp
 */
function generateHop() {
  const duration = 0.08;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / totalSamples;
    const freq = 620 - 40 * progress; // Gentle pitch inflection

    // Quick wood-percussion decay
    const decay = Math.exp(-t * 38);
    // Fundamental + soft overtone + transient attack
    const fundamental = Math.sin(2 * Math.PI * freq * t);
    const overtone = 0.35 * Math.sin(2 * Math.PI * (freq * 2.02) * t);
    const transient = Math.exp(-t * 120) * Math.sin(2 * Math.PI * 1800 * t) * 0.3;

    samples[i] = (fundamental + overtone + transient) * decay * 0.85;
  }
  return samples;
}

/**
 * 4. TOKEN CAPTURED (500ms)
 * Dramatic, triumphant knock-out strike!
 * Low-frequency punch sweep (240Hz down to 60Hz) followed by sparkling reward chimes
 */
function generateCapture() {
  const duration = 0.50;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  // Reward chimes: C6, E6, G6, C7
  const chimes = [
    { t: 0.08, freq: 1046.5 },
    { t: 0.16, freq: 1318.5 },
    { t: 0.24, freq: 1568.0 },
    { t: 0.32, freq: 2093.0 },
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    let val = 0;

    // Heavy comic punch impact (0 - 180ms)
    if (t < 0.20) {
      const punchPitch = 240 * Math.exp(-t * 18);
      const punchDecay = Math.exp(-t * 14);
      const punch = (Math.sin(2 * Math.PI * punchPitch * t) + 0.4 * Math.sin(2 * Math.PI * (punchPitch * 0.5) * t)) * punchDecay;
      // High snap
      const snap = Math.exp(-t * 70) * (Math.random() * 2 - 1) * 0.4;
      val += punch * 0.85 + snap;
    }

    // Sparkle chimes
    for (const chime of chimes) {
      const dt = t - chime.t;
      if (dt >= 0) {
        const decay = Math.exp(-dt * 12);
        const tone = Math.sin(2 * Math.PI * chime.freq * dt) + 0.3 * Math.sin(4 * Math.PI * chime.freq * dt);
        val += tone * decay * 0.35;
      }
    }

    samples[i] = Math.max(-1, Math.min(1, val * 0.8));
  }
  return samples;
}

/**
 * 5. SIX BONUS JINGLE (400ms)
 * Magical lucky bell chime when rolling a 6!
 * Bright dual bell chimes with harmonic shimmer
 */
function generateSix() {
  const duration = 0.40;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  const bells = [
    { t: 0.00, freq: 987.77 },  // B5
    { t: 0.11, freq: 1318.51 }, // E6
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    let val = 0;

    for (const bell of bells) {
      const dt = t - bell.t;
      if (dt >= 0) {
        const decay = Math.exp(-dt * 9);
        // Glockenspiel inharmonics (1x, 2.76x, 5.4x)
        const tone = Math.sin(2 * Math.PI * bell.freq * dt) +
                     0.35 * Math.sin(2 * Math.PI * (bell.freq * 2.76) * dt) +
                     0.15 * Math.sin(2 * Math.PI * (bell.freq * 5.4) * dt);
        val += tone * decay * 0.45;
      }
    }

    samples[i] = Math.max(-1, Math.min(1, val * 0.85));
  }
  return samples;
}

/**
 * 6. HOME REACHED (600ms)
 * Ascending triumphal bells when a token reaches the center home triangle
 */
function generateHome() {
  const duration = 0.60;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  const notes = [
    { t: 0.00, freq: 783.99 },  // G5
    { t: 0.14, freq: 1046.50 }, // C6
    { t: 0.28, freq: 1318.51 }, // E6
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    let val = 0;

    for (const note of notes) {
      const dt = t - note.t;
      if (dt >= 0) {
        const decay = Math.exp(-dt * 7);
        const tone = Math.sin(2 * Math.PI * note.freq * dt) +
                     0.4 * Math.sin(2 * Math.PI * (note.freq * 2) * dt);
        val += tone * decay * 0.4;
      }
    }

    samples[i] = Math.max(-1, Math.min(1, val * 0.85));
  }
  return samples;
}

/**
 * 7. VICTORY FANFARE (2.2 seconds)
 * Royal Championship Win Fanfare!
 * Festive brass chords + ascending arpeggio + sparkling grand finale
 */
function generateWin() {
  const duration = 2.2;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  // Motifs: [start_time, duration, [frequencies]]
  const motifs = [
    // Motif 1: C Major arpeggio
    { t: 0.00, d: 0.25, freqs: [523.25, 659.25] },          // C5, E5
    { t: 0.22, d: 0.25, freqs: [659.25, 783.99] },          // E5, G5
    { t: 0.44, d: 0.35, freqs: [783.99, 1046.50] },         // G5, C6

    // Motif 2: F Major triumph
    { t: 0.75, d: 0.25, freqs: [698.46, 880.00] },          // F5, A5
    { t: 0.98, d: 0.35, freqs: [880.00, 1046.50] },         // A5, C6

    // Motif 3: G Major leading chord
    { t: 1.25, d: 0.30, freqs: [783.99, 987.77, 1174.66] }, // G5, B5, D6

    // Grand Finale: Sustained Royal C Major Chords + Shimmer (1.50s - 2.2s)
    { t: 1.55, d: 0.65, freqs: [523.25, 659.25, 783.99, 1046.50, 1318.51] },
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    let val = 0;

    for (const m of motifs) {
      const dt = t - m.t;
      if (dt >= 0 && dt < m.d + 0.4) {
        const decay = Math.exp(-dt * (1.8 / m.d));
        let chord = 0;
        for (const f of m.freqs) {
          // Warm brass/synthesizer sound with 2nd and 3rd harmonics + vibrato
          const vibrato = 1 + 0.008 * Math.sin(2 * Math.PI * 6 * dt);
          const tone = Math.sin(2 * Math.PI * f * vibrato * dt) +
                       0.35 * Math.sin(2 * Math.PI * (f * 2) * vibrato * dt) +
                       0.15 * Math.sin(2 * Math.PI * (f * 3) * vibrato * dt);
          chord += tone;
        }
        val += (chord / m.freqs.length) * decay * 0.7;
      }
    }

    // Finale sparkling bell cascade during grand chord (1.6s - 2.2s)
    if (t > 1.55) {
      const dt = t - 1.55;
      const sparkleFreq = 1567.98 + 523.25 * Math.sin(2 * Math.PI * 8 * dt);
      const sparkle = Math.sin(2 * Math.PI * sparkleFreq * dt) * Math.exp(-dt * 3.5) * 0.15;
      val += sparkle;
    }

    samples[i] = Math.max(-1, Math.min(1, val * 0.8));
  }
  return samples;
}

/**
 * 8. BACKGROUND MUSIC THEME (4.0s seamless loop)
 * Gentle, playful, upbeat royal board game melody.
 * Soft electric piano / kalimba melody over a warm acoustic bassline.
 */
function generateBgm() {
  const duration = 4.0;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  // Melody notes: [start_time, duration, frequency, volume]
  const melody = [
    { t: 0.00, d: 0.22, f: 523.25 }, // C5
    { t: 0.25, d: 0.22, f: 659.25 }, // E5
    { t: 0.50, d: 0.35, f: 783.99 }, // G5
    { t: 0.85, d: 0.20, f: 659.25 }, // E5

    { t: 1.00, d: 0.22, f: 587.33 }, // D5
    { t: 1.25, d: 0.22, f: 698.46 }, // F5
    { t: 1.50, d: 0.35, f: 880.00 }, // A5
    { t: 1.85, d: 0.20, f: 698.46 }, // F5

    { t: 2.00, d: 0.22, f: 659.25 }, // E5
    { t: 2.25, d: 0.22, f: 783.99 }, // G5
    { t: 2.50, d: 0.35, f: 987.77 }, // B5
    { t: 2.85, d: 0.20, f: 783.99 }, // G5

    { t: 3.00, d: 0.22, f: 1046.50 }, // C6
    { t: 3.25, d: 0.22, f: 783.99 },  // G5
    { t: 3.50, d: 0.30, f: 659.25 },  // E5
    { t: 3.80, d: 0.18, f: 587.33 },  // D5
  ];

  // Bass accompaniment: [start_time, duration, frequency]
  const bass = [
    { t: 0.00, d: 0.95, f: 130.81 }, // C3
    { t: 1.00, d: 0.95, f: 174.61 }, // F3
    { t: 2.00, d: 0.95, f: 196.00 }, // G3
    { t: 3.00, d: 0.95, f: 130.81 }, // C3
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    let melVal = 0;
    let bassVal = 0;

    // Render melody
    for (const n of melody) {
      const dt = t - n.t;
      if (dt >= 0 && dt < n.d + 0.15) {
        const decay = Math.exp(-dt * 5.5);
        const tone = Math.sin(2 * Math.PI * n.f * dt) + 0.3 * Math.sin(4 * Math.PI * n.f * dt);
        melVal += tone * decay * 0.35;
      }
    }

    // Render bass
    for (const b of bass) {
      const dt = t - b.t;
      if (dt >= 0 && dt < b.d + 0.2) {
        const decay = Math.exp(-dt * 2.2);
        const tone = Math.sin(2 * Math.PI * b.f * dt) + 0.25 * Math.sin(2 * Math.PI * (b.f * 2) * dt);
        bassVal += tone * decay * 0.22;
      }
    }

    // Keep background music volume soft & pleasant (around 40% overall)
    samples[i] = Math.max(-1, Math.min(1, (melVal + bassVal) * 0.5));
  }
  return samples;
}

// -------------------------------------------------------------
// BUILD FILES
// -------------------------------------------------------------

function buildAll() {
  const soundsDir = path.join(__dirname, '..', 'assets', 'sounds');
  if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true });
  }

  const generators = {
    click: generateClick,
    roll: generateRoll,
    hop: generateHop,
    capture: generateCapture,
    six: generateSix,
    home: generateHome,
    win: generateWin,
    bgm: generateBgm,
  };

  const dataUris = {};

  for (const [name, fn] of Object.entries(generators)) {
    console.log(`Generating sound: ${name}...`);
    const samples = fn();
    const wavBuffer = createWavBuffer(samples, SAMPLE_RATE);
    const filePath = path.join(soundsDir, `${name}.wav`);
    fs.writeFileSync(filePath, wavBuffer);

    const base64 = wavBuffer.toString('base64');
    dataUris[name] = `data:audio/wav;base64,${base64}`;
    console.log(`  -> Saved ${filePath} (${wavBuffer.length} bytes)`);
  }

  // Write base64 data URIs module for instant fallback & web support
  const dataUrisPath = path.join(__dirname, '..', 'src', 'utils', 'soundDataUris.js');
  const code = `/**
 * Ludo Champion - Synthesized Audio Data URIs
 * Provides 100% self-contained, offline-compatible audio URIs.
 * Auto-generated by scripts/generateSounds.js
 */

export const SOUND_DATA_URIS = ${JSON.stringify(dataUris, null, 2)};
export default SOUND_DATA_URIS;
`;
  fs.writeFileSync(dataUrisPath, code, 'utf8');
  console.log(`  -> Saved data URIs to ${dataUrisPath}`);

  console.log('All sounds generated successfully!');
}

buildAll();
