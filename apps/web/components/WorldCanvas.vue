<template>
  <canvas ref="canvasEl" class="bg-neutral" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useChunksStore } from '~/stores/chunks'
import { useInput } from '~/composables/useInput'
import { useWs } from '~/composables/useWs'

const store = useChunksStore()
const { pan, zoom, attach, detach, screenToWorld, worldToChunk } = useInput()
useWs()

const canvasEl = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let rafId = 0

function resize() {
  if (!canvasEl.value) return
  const dpr = window.devicePixelRatio || 1
  const { clientWidth, clientHeight } = canvasEl.value
  canvasEl.value.width = Math.floor(clientWidth * dpr)
  canvasEl.value.height = Math.floor(clientHeight * dpr)
  ctx?.scale(dpr, dpr)
}

function draw() {
  if (!canvasEl.value || !ctx) return
  const { width, height } = canvasEl.value
  const cssW = width / (window.devicePixelRatio || 1)
  const cssH = height / (window.devicePixelRatio || 1)
  ctx.clearRect(0, 0, cssW, cssH)

  const tileSize = Math.max(4, 18 * zoom.value)

  // Determine visible chunks
  const topLeftWorld = screenToWorld({ x: 0, y: 0 })
  const bottomRightWorld = screenToWorld({ x: cssW, y: cssH })
  const [minCx, minCy] = worldToChunk(topLeftWorld.x, topLeftWorld.y)
  const [maxCx, maxCy] = worldToChunk(bottomRightWorld.x, bottomRightWorld.y)

  // Prefetch window
  store.ensureWindow({ cx0: minCx - 1, cy0: minCy - 1, cx1: maxCx + 1, cy1: maxCy + 1 })

  // Draw tiles
  for (let cy = minCy - 1; cy <= maxCy + 1; cy++) {
    for (let cx = minCx - 1; cx <= maxCx + 1; cx++) {
      const chunk = store.getChunk(cx, cy)
      if (!chunk) continue
      for (const tile of chunk.tiles.values()) {
        const worldX = (cx * store.chunkSize + tile.lx) * tileSize + pan.x
        const worldY = (cy * store.chunkSize + tile.ly) * tileSize + pan.y
        if (worldX < -tileSize || worldY < -tileSize || worldX > cssW + tileSize || worldY > cssH + tileSize) continue
        ctx.fillStyle = tile.v === 'X' ? '#60a5fa' : '#f472b6'
        ctx.fillRect(worldX, worldY, tileSize - 1, tileSize - 1)
      }
      // Optional: debug chunk borders
      if (store.debug.showChunkBorders) {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'
        ctx.strokeRect(
          cx * store.chunkSize * tileSize + pan.x,
          cy * store.chunkSize * tileSize + pan.y,
          store.chunkSize * tileSize,
          store.chunkSize * tileSize
        )
      }
    }
  }

  rafId = requestAnimationFrame(draw)
}

function onClick(ev: MouseEvent) {
  const rect = canvasEl.value!.getBoundingClientRect()
  const x = ev.clientX - rect.left
  const y = ev.clientY - rect.top
  const world = screenToWorld({ x, y })
  const tileSize = Math.max(4, 18 * zoom.value)
  const tx = Math.floor((world.x - pan.x) / tileSize)
  const ty = Math.floor((world.y - pan.y) / tileSize)
  store.placeAtGlobal(tx, ty)
}

onMounted(() => {
  ctx = canvasEl.value?.getContext('2d') ?? null
  resize()
  window.addEventListener('resize', resize)
  canvasEl.value?.addEventListener('click', onClick)
  attach(canvasEl.value!)
  draw()
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', resize)
  canvasEl.value?.removeEventListener('click', onClick)
  if (canvasEl.value) detach(canvasEl.value)
})
</script>

<style scoped>
canvas {
  width: 100vw;
  height: 100vh;
}
</style>


