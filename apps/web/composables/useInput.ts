import { ref } from 'vue'
import { useChunksStore } from '~/stores/chunks'

const panState = ref({ x: 0, y: 0 })
const zoomState = ref(1)

export function useInput() {
  const store = useChunksStore()
  const pan = panState.value
  const zoom = zoomState

  function attach(el: HTMLElement) {
    let dragging = false
    let lastX = 0
    let lastY = 0
    let vx = 0
    let vy = 0
    let raf = 0
    let spaceDown = false

    function onMouseDown(e: MouseEvent) {
      // Pan with right mouse or Space+Left
      if (e.button === 2 || (e.button === 0 && spaceDown)) {
        dragging = true
        lastX = e.clientX
        lastY = e.clientY
      }
    }
    function onMouseMove(e: MouseEvent) {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      pan.x += dx
      pan.y += dy
      vx = dx
      vy = dy
      lastX = e.clientX
      lastY = e.clientY
    }
    function onMouseUp() {
      dragging = false
      // inertial fling
      cancelAnimationFrame(raf)
      const friction = 0.9
      function step() {
        vx *= friction
        vy *= friction
        if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) return
        pan.x += vx
        pan.y += vy
        raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }
    function onWheel(e: WheelEvent) {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const anchor = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      const oldTile = Math.max(4, 18 * zoom.value)
      const delta = -Math.sign(e.deltaY) * 0.1
      const newZoom = Math.min(3, Math.max(0.2, zoom.value + delta))
      const newTile = Math.max(4, 18 * newZoom)
      // Zoom towards cursor: adjust pan so anchor stays fixed
      pan.x = anchor.x - (anchor.x - pan.x) * (newTile / oldTile)
      pan.y = anchor.y - (anchor.y - pan.y) * (newTile / oldTile)
      zoom.value = newZoom
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space') spaceDown = true
      const step = 60
      if (e.key === 'ArrowLeft') pan.x += step
      if (e.key === 'ArrowRight') pan.x -= step
      if (e.key === 'ArrowUp') pan.y += step
      if (e.key === 'ArrowDown') pan.y -= step
      if (e.key === '+' || e.key === '=') zoomToCenter(0.1)
      if (e.key === '-' || e.key === '_') zoomToCenter(-0.1)
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') spaceDown = false
    }
    function onContextMenu(e: MouseEvent) {
      e.preventDefault()
    }
    function zoomToCenter(delta: number) {
      const anchor = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      const oldTile = Math.max(4, 18 * zoom.value)
      const newZoom = Math.min(3, Math.max(0.2, zoom.value + delta))
      const newTile = Math.max(4, 18 * newZoom)
      pan.x = anchor.x - (anchor.x - pan.x) * (newTile / oldTile)
      pan.y = anchor.y - (anchor.y - pan.y) * (newTile / oldTile)
      zoom.value = newZoom
    }

    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    el.addEventListener('contextmenu', onContextMenu)
  }

  function detach(_el: HTMLElement) {
    // noop for simplicity in MVP
  }

  function screenToWorld(p: { x: number, y: number }) {
    return { x: p.x, y: p.y }
  }

  function worldToChunk(x: number, y: number): [number, number] {
    const cs = store.chunkSize
    const tileSize = Math.max(4, 18 * (Number.isFinite(zoom.value) ? zoom.value : 1))
    const sx = Number.isFinite(x) ? x : 0
    const sy = Number.isFinite(y) ? y : 0
    const tx = Math.floor((sx - pan.x) / tileSize)
    const ty = Math.floor((sy - pan.y) / tileSize)
    const cx = Math.floor(tx / cs)
    const cy = Math.floor(ty / cs)
    return [Number.isFinite(cx) ? cx : 0, Number.isFinite(cy) ? cy : 0]
  }

  return { pan, zoom, attach, detach, screenToWorld, worldToChunk }
}


