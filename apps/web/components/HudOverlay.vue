<template>
  <div class="flex flex-col h-full">
    <div class="mt-auto mb-4 ml-4 p-2 rounded bg-base-200/80 backdrop-blur pointer-events-auto">
      <div class="text-xs opacity-80">Chunk {{ cx }}, {{ cy }} | {{ fps }} FPS</div>
      <div class="text-xs opacity-80">Coords {{ coords.x }}, {{ coords.y }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useChunksStore } from '~/stores/chunks'
import { useInput } from '~/composables/useInput'

const store = useChunksStore()
const { screenToWorld, worldToChunk } = useInput()

const fps = ref(0)
let last = performance.now()
let frames = 0
let raf = 0
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
    coords.value = { x: Math.floor(w.x), y: Math.floor(w.y) }
    const [cxi, cyi] = worldToChunk(coords.value.x, coords.value.y)
    cx.value = cxi
    cy.value = cyi
  }
  raf = requestAnimationFrame(loop)
}
const coords = ref({ x: 0, y: 0 })
const cx = ref(0)
const cy = ref(0)

onMounted(loop)
onUnmounted(() => cancelAnimationFrame(raf))
</script>


