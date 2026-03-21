// src/hooks/useSound.js
// Pure Web Audio API — mobile-safe with early unlock

let ctx = null
let unlocked = false

export function unlockAudio() {
  if (unlocked) return
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Play a silent buffer — this is the gesture-triggered unlock
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
    if (ctx.state === 'suspended') ctx.resume()
    unlocked = true
  } catch (e) {}
}

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function playSwish() {
  try {
    const ac = getCtx()
    const now = ac.currentTime

    const buf = ac.createBuffer(1, ac.sampleRate * 0.18, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1)
    const noise = ac.createBufferSource()
    noise.buffer = buf

    const bp = ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.setValueAtTime(2200, now)
    bp.frequency.exponentialRampToValueAtTime(800, now + 0.18)
    bp.Q.value = 1.2

    const g = ac.createGain()
    g.gain.setValueAtTime(0.55, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

    noise.connect(bp)
    bp.connect(g)
    g.connect(ac.destination)
    noise.start(now)
    noise.stop(now + 0.18)

    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(520, now)
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.12)
    const og = ac.createGain()
    og.gain.setValueAtTime(0.18, now)
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
    osc.connect(og)
    og.connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.14)
  } catch (e) {}
}

export function playClank() {
  try {
    const ac = getCtx()
    const now = ac.currentTime

    ;[180, 243].forEach((freq, i) => {
      const osc = ac.createOscillator()
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, now)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.18)

      const g = ac.createGain()
      g.gain.setValueAtTime(i === 0 ? 0.22 : 0.15, now)
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

      const dist = ac.createWaveShaper()
      const curve = new Float32Array(256)
      for (let j = 0; j < 256; j++) {
        const x = (j * 2) / 256 - 1
        curve[j] = (Math.PI + 120) * x / (Math.PI + 120 * Math.abs(x))
      }
      dist.curve = curve

      osc.connect(dist)
      dist.connect(g)
      g.connect(ac.destination)
      osc.start(now)
      osc.stop(now + 0.22)
    })

    const buf = ac.createBuffer(1, ac.sampleRate * 0.06, ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
    const ns = ac.createBufferSource()
    ns.buffer = buf
    const ng = ac.createGain()
    ng.gain.setValueAtTime(0.3, now)
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
    ns.connect(ng)
    ng.connect(ac.destination)
    ns.start(now)
    ns.stop(now + 0.06)
  } catch (e) {}
}

export function playCombo(comboCount) {
  try {
    const ac = getCtx()
    const now = ac.currentTime
    const baseFreq = 440
    const notes = Math.min(comboCount, 6)
    const scale = [1, 1.25, 1.5, 1.78, 2, 2.4]

    for (let i = 0; i < notes; i++) {
      const t = now + i * 0.07
      const osc = ac.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(baseFreq * scale[i], t)

      const g = ac.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.22, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14)

      osc.connect(g)
      g.connect(ac.destination)
      osc.start(t)
      osc.stop(t + 0.14)
    }
  } catch (e) {}
}

export function playCountdownBeep(isLast = false) {
  try {
    const ac = getCtx()
    const now = ac.currentTime
    const freq = isLast ? 880 : 440

    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)

    const g = ac.createGain()
    g.gain.setValueAtTime(0.35, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + (isLast ? 0.5 : 0.12))

    osc.connect(g)
    g.connect(ac.destination)
    osc.start(now)
    osc.stop(now + (isLast ? 0.5 : 0.12))
  } catch (e) {}
}

export function playBuzzer() {
  try {
    const ac = getCtx()
    const now = ac.currentTime

    const osc = ac.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.7)

    const dist = ac.createWaveShaper()
    const curve = new Float32Array(256)
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1
      curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x))
    }
    dist.curve = curve

    const g = ac.createGain()
    g.gain.setValueAtTime(0.5, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.7)

    osc.connect(dist)
    dist.connect(g)
    g.connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.7)
  } catch (e) {}
}

export function playShootWhoosh() {
  try {
    const ac = getCtx()
    const now = ac.currentTime

    const buf = ac.createBuffer(1, ac.sampleRate * 0.1, ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1)

    const hp = ac.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 1800

    const ns = ac.createBufferSource()
    ns.buffer = buf

    const g = ac.createGain()
    g.gain.setValueAtTime(0.18, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

    ns.connect(hp)
    hp.connect(g)
    g.connect(ac.destination)
    ns.start(now)
    ns.stop(now + 0.1)
  } catch (e) {}
}
