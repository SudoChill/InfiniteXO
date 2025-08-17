import { ref } from 'vue'

let audioCtx: AudioContext | null = null
const enabled = ref(false)

function ensureCtx() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return audioCtx
}

function beep(freq: number, durationMs: number, type: OscillatorType = 'sine', gain = 0.05) {
  const ctx = ensureCtx()
  if (!ctx || !enabled.value) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = gain
  osc.connect(g).connect(ctx.destination)
  const now = ctx.currentTime
  osc.start(now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
  osc.stop(now + durationMs / 1000)
}

export function useSfx() {
  function setEnabled(v: boolean) {
    enabled.value = v
    if (v) ensureCtx()
    if (typeof window !== 'undefined') localStorage.setItem('sfx', v ? '1' : '0')
  }
  if (typeof window !== 'undefined') setEnabled(localStorage.getItem('sfx') === '1')

  const place = () => beep(420, 60, 'triangle', 0.03)
  const combo = () => {
    beep(660, 90, 'sine', 0.04)
    setTimeout(() => beep(880, 120, 'sine', 0.03), 60)
  }
  const error = () => beep(220, 120, 'sawtooth', 0.03)

  return { enabled, setEnabled, place, combo, error }
}


