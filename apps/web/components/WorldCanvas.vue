<template>
  <canvas ref="canvasEl" class="bg-neutral" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useChunksStore } from '~/stores/chunks'
import { useInput } from '~/composables/useInput'
import { useWs } from '~/composables/useWs'
import { useSessionStore } from '~/stores/session'
// remove duplicate import
import { useSfx } from '~/composables/useSfx'
import { useUiStore } from '~/stores/ui'

const store = useChunksStore()
const { pan, zoom, attach, detach, screenToWorld, worldToChunk } = useInput()
useWs()
const session = useSessionStore()
const storeState = useChunksStore()
const { place } = useSfx()
const ui = useUiStore()

const canvasEl = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let rafId = 0
let pulseUntil = 0

function resize() {
  if (!canvasEl.value) return
  const dpr = window.devicePixelRatio || 1
  const { clientWidth, clientHeight } = canvasEl.value
  canvasEl.value.width = Math.floor(clientWidth * dpr)
  canvasEl.value.height = Math.floor(clientHeight * dpr)
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
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
        // background cell
        ctx.fillStyle = 'rgba(255,255,255,0.03)'
        ctx.fillRect(worldX, worldY, tileSize - 1, tileSize - 1)
        // draw glyph
        ctx.fillStyle = tile.v === 'X' ? '#60a5fa' : '#f472b6'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const fontSize = Math.max(10, Math.floor(tileSize * 0.8))
        ctx.font = `${fontSize}px ui-sans-serif`
        ctx.fillText(tile.v, worldX + (tileSize - 1) / 2, worldY + (tileSize - 1) / 2)
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

  // Highlight any session 3x3 anchors (simple visualization)
  for (const s of storeState.sessions ? storeState.sessions.values() : []) {
    const ss: any = s
    if (typeof ss.tx !== 'number' || typeof ss.ty !== 'number') continue
    const worldX = ss.tx * tileSize + pan.x
    const worldY = ss.ty * tileSize + pan.y
    // faint outline for all sessions
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(worldX - tileSize, worldY - tileSize, tileSize * 3, tileSize * 3)
  }

  // Highlight joined session area with a faded rectangle
  if (ui.joinedSessionId) {
    const s: any = storeState.sessions.get(ui.joinedSessionId)
    if (s && typeof s.tx === 'number' && typeof s.ty === 'number') {
      const worldX = s.tx * tileSize + pan.x
      const worldY = s.ty * tileSize + pan.y
      ctx.fillStyle = 'rgba(250, 204, 21, 0.08)'
      ctx.fillRect(worldX - tileSize, worldY - tileSize, tileSize * 3, tileSize * 3)
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.95)'
      ctx.lineWidth = 2.5
      ctx.strokeRect(worldX - tileSize, worldY - tileSize, tileSize * 3, tileSize * 3)

      // Off-screen indicator: draw a chevron pointing toward the session if it's out of view
      const cssW = canvasEl.value!.width / (window.devicePixelRatio || 1)
      const cssH = canvasEl.value!.height / (window.devicePixelRatio || 1)
      const rectX = worldX - tileSize
      const rectY = worldY - tileSize
      const rectW = tileSize * 3
      const rectH = tileSize * 3
      const isOffscreen = rectX + rectW < 0 || rectY + rectH < 0 || rectX > cssW || rectY > cssH
      if (isOffscreen) {
        // Vector from screen center to session center
        const centerX = cssW / 2
        const centerY = cssH / 2
        const targetX = rectX + rectW / 2
        const targetY = rectY + rectH / 2
        const dx = targetX - centerX
        const dy = targetY - centerY
        const angle = Math.atan2(dy, dx)
        const radius = Math.min(centerX, centerY) - 16
        const tipX = centerX + Math.cos(angle) * radius
        const tipY = centerY + Math.sin(angle) * radius
        const leftX = centerX + Math.cos(angle + Math.PI * 0.85) * 18
        const leftY = centerY + Math.sin(angle + Math.PI * 0.85) * 18
        const rightX = centerX + Math.cos(angle - Math.PI * 0.85) * 18
        const rightY = centerY + Math.sin(angle - Math.PI * 0.85) * 18
        ctx.fillStyle = 'rgba(250, 204, 21, 0.9)'
        ctx.beginPath()
        ctx.moveTo(tipX, tipY)
        ctx.lineTo(leftX, leftY)
        ctx.lineTo(rightX, rightY)
        ctx.closePath()
        ctx.fill()
      }
    }
  }

  // Draw active match overlay (XO board)
  if (ui.activeMatch) {
    const { tx, ty, board } = ui.activeMatch
    // Auto-center once when match becomes ready
    if (ui.activeMatch.centerPending) {
      const centerTargetX = (tx + 0.5) * tileSize
      const centerTargetY = (ty + 0.5) * tileSize
      const cssW = width / (window.devicePixelRatio || 1)
      const cssH = height / (window.devicePixelRatio || 1)
      pan.x = Math.round((cssW / 2) - centerTargetX)
      pan.y = Math.round((cssH / 2) - centerTargetY)
      ui.activeMatch.centerPending = false
      pulseUntil = performance.now() + 2000
    }
    const startX = tx * tileSize + pan.x - tileSize
    const startY = ty * tileSize + pan.y - tileSize
    // pulsing highlight when just centered
    if (pulseUntil > performance.now()) {
      const phase = (pulseUntil - performance.now()) / 2000
      const alpha = 0.08 + 0.12 * Math.abs(Math.sin((1 - phase) * Math.PI * 2))
      ctx.fillStyle = `rgba(34,197,94,${alpha})`
      ctx.fillRect(startX, startY, tileSize * 3, tileSize * 3)
    }
    ctx.strokeStyle = 'rgba(34,197,94,0.9)'
    ctx.lineWidth = 3
    // grid lines
    for (let i=1;i<3;i++) {
      ctx.beginPath(); ctx.moveTo(startX + i*tileSize, startY); ctx.lineTo(startX + i*tileSize, startY + 3*tileSize); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(startX, startY + i*tileSize); ctx.lineTo(startX + 3*tileSize, startY + i*tileSize); ctx.stroke()
    }
    // marks
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${Math.floor(tileSize*0.8)}px ui-sans-serif`
    for (let i=0;i<9;i++) {
      const col = i % 3, row = Math.floor(i/3)
      const val = board[i]
      if (!val) continue
      ctx.fillStyle = val === 'X' ? '#60a5fa' : '#f472b6'
      ctx.fillText(val, startX + col*tileSize + tileSize/2, startY + row*tileSize + tileSize/2)
    }
  }

  // Draw remote cursors
  store.purgeOldCursors()
  for (const [id, c] of store.cursors) {
    const worldX = (Math.floor(c.tx) * tileSize) + pan.x
    const worldY = (Math.floor(c.ty) * tileSize) + pan.y
    if (worldX < -tileSize || worldY < -tileSize || worldX > cssW + tileSize || worldY > cssH + tileSize) continue
    ctx.strokeStyle = '#22d3ee'
    ctx.strokeRect(worldX, worldY, tileSize - 1, tileSize - 1)
    if (c.name) {
      ctx.fillStyle = 'rgba(34,211,238,0.8)'
      ctx.font = '12px ui-sans-serif'
      ctx.fillText(c.name, worldX + 4, worldY - 4)
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
  place()
}

function onMouseMove(ev: MouseEvent) {
  const rect = canvasEl.value!.getBoundingClientRect()
  const x = ev.clientX - rect.left
  const y = ev.clientY - rect.top
  const world = screenToWorld({ x, y })
  const tileSize = Math.max(4, 18 * zoom.value)
  const tx = Math.floor((world.x - pan.x) / tileSize)
  const ty = Math.floor((world.y - pan.y) / tileSize)
  const [cx, cy] = worldToChunk(world.x, world.y)
  const room = `chunk:${cx}:${cy}`
  store._sendWs?.({ type: 'cursor', room, actorId: session.actorId, name: session.name, x: tx, y: ty })
}

onMounted(() => {
  session.init()
  ctx = canvasEl.value?.getContext('2d') ?? null
  resize()
  window.addEventListener('resize', resize)
  canvasEl.value?.addEventListener('click', onClick)
  canvasEl.value?.addEventListener('mousemove', onMouseMove)
  attach(canvasEl.value!)
  draw()
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', resize)
  canvasEl.value?.removeEventListener('click', onClick)
  canvasEl.value?.removeEventListener('mousemove', onMouseMove)
  if (canvasEl.value) detach(canvasEl.value)
})
</script>

<style scoped>
canvas {
  width: 100vw;
  height: 100vh;
}
</style>


