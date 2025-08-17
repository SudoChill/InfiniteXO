<template>
  <div class="flex flex-col h-full">
    <div class="mt-auto mb-4 ml-4 p-2 rounded bg-base-200/80 backdrop-blur pointer-events-auto flex items-center gap-2">
      <div class="text-xs opacity-80">Chunk {{ cx }}, {{ cy }} | {{ fps }} FPS | Nearby: {{ nearby }} | Score: {{ score }}</div>
      <div class="text-xs opacity-80">Coords {{ coords.x }}, {{ coords.y }}</div>
      <button class="btn btn-xs" @click.stop="clearAll">Clear</button>
    </div>
    <!-- MiniMap -->
    <div class="absolute right-4 bottom-4 w-40 h-40 bg-base-200/80 rounded pointer-events-auto overflow-hidden">
      <canvas ref="mini" class="w-full h-full" @click="jump"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useChunksStore } from '~/stores/chunks'
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
</script>


