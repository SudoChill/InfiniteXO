<template>
  <div class="flex flex-col h-full safe-area">
    <div class="absolute left-4 top-4 flex gap-2 pointer-events-auto">
      <button class="btn btn-xs" @click="showStats=!showStats">Stats</button>
      <button class="btn btn-xs" @click.stop="clearAll">Reset</button>
    </div>
    <div v-if="showStats" class="absolute left-4 top-12 bg-base-200/90 p-2 rounded text-xs pointer-events-auto">
      <div>Chunk {{ cx }}, {{ cy }}</div>
      <div>FPS {{ fps }}</div>
      <div>Coords {{ coords.x }}, {{ coords.y }}</div>
      <div>Team X: {{ team.X }} / O: {{ team.O }} | You: {{ score }}</div>
    </div>
    <!-- Floating Panel: Players / Sessions -->
    <div class="absolute md:right-4 md:bottom-4 md:w-80 md:rounded md:p-2 md:bg-base-200/80 pointer-events-auto w-[calc(100%-1rem)] left-2 right-2 bottom-2 bg-base-200/90 rounded-lg p-2 pb-safe">
      <div class="text-sm font-semibold">Sessions</div>
      <div class="mt-2">
        <SessionPanel />
      </div>
    </div>

    <!-- Match popup -->
    <div v-if="ui.showMatchPopup" class="absolute left-1/2 -translate-x-1/2 bottom-24 bg-base-100 text-base-content rounded shadow px-3 py-2 pointer-events-auto">
      <div class="text-sm">{{ ui.matchPopupText }}</div>
      <div v-if="ui.pendingChallenge" class="mt-2 flex gap-2 justify-end">
        <button class="btn btn-success btn-xs" @click="acceptChallenge">Accept</button>
        <button class="btn btn-ghost btn-xs" @click="declineChallenge">Decline</button>
      </div>
      <div v-else class="text-xs opacity-70">A 3×3 XO board has spawned. Take turns!</div>
      <div v-if="!ui.pendingChallenge" class="mt-2 flex justify-end"><button class="btn btn-xs" @click="ui.showMatchPopup=false">OK</button></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useChunksStore } from '~/stores/chunks'
import SessionPanel from '~/components/SessionPanel.vue'
import { useUiStore } from '~/stores/ui'
import { useInput } from '~/composables/useInput'

const store = useChunksStore()
const { screenToWorld, worldToChunk } = useInput()

const fps = ref(0)
let last = performance.now()
let frames = 0
let raf = 0
const mini = ref<HTMLCanvasElement | null>(null)
function loop() {
  frames++
  const now = performance.now()
  if (now - last >= 500) {
    fps.value = Math.round((frames * 1000) / (now - last))
    frames = 0
    last = now
  }
  // update coords and chunk indices on the same loop to avoid SSR access
  if (typeof window !== 'undefined') {
    const w = screenToWorld({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    const wx = Number.isFinite(w.x) ? w.x : 0
    const wy = Number.isFinite(w.y) ? w.y : 0
    coords.value = { x: Math.floor(wx), y: Math.floor(wy) }
    const [cxi, cyi] = worldToChunk(coords.value.x, coords.value.y)
    cx.value = Number.isFinite(cxi) ? cxi : 0
    cy.value = Number.isFinite(cyi) ? cyi : 0
  }
  raf = requestAnimationFrame(loop)
}
const coords = ref({ x: 0, y: 0 })
const cx = ref(0)
const cy = ref(0)
const nearby = computed(() => store.presence.get(`chunk:${cx.value}:${cy.value}`) || 0)
const score = computed(() => store.sessionScore)
const team = computed(() => store.teamScore)
const showStats = ref(false)
if (typeof window !== 'undefined') {
  window.addEventListener('xo:toggle-stats', () => { showStats.value = !showStats.value })
}
const ui = useUiStore()

function onJoinSession(s: any) {
  // center camera to that session area (placeholder)
  // In future: highlight/select tiles area and open a ready modal
}

onMounted(loop)
onUnmounted(() => cancelAnimationFrame(raf))

function jump(e: MouseEvent) {
  if (!mini.value) return
  const rect = mini.value.getBoundingClientRect()
  const px = (e.clientX - rect.left) / rect.width - 0.5
  const py = (e.clientY - rect.top) / rect.height - 0.5
  // center move by a few chunks
  const dx = Math.round(px * 10)
  const dy = Math.round(py * 10)
  cx.value += dx
  cy.value += dy
}

async function clearAll() {
  try {
    await $fetch('/api/clear', { method: 'POST', body: { scope: 'all' } })
  } catch {}
}

function challenge(p: { actorId: string, name?: string }) {
  // send a WS challenge request using current center tile
  const centerX = window.innerWidth / 2
  const centerY = window.innerHeight / 2
  const at = { tx: Math.floor(centerX), ty: Math.floor(centerY) }
  // @ts-ignore internal ws sender
  store._sendWs?.({ type: 'challenge:request', targetActorId: p.actorId, fromName: 'player', at, actorId: 'self' })
}

function acceptChallenge() {
  if (!ui.pendingChallenge) return
  // @ts-ignore
  store._sendWs?.({ type: 'challenge:accept', fromActorId: ui.pendingChallenge.fromActorId, at: ui.pendingChallenge.at })
  ui.pendingChallenge = null
  ui.showMatchPopup = false
}
function declineChallenge() {
  ui.pendingChallenge = null
  ui.showMatchPopup = false
}
</script>


