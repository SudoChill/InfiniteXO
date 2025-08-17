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
    el.addEventListener('mousedown', (e) => {
      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
        dragging = true
        lastX = e.clientX
        lastY = e.clientY
      }
    })
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      pan.x += dx
      pan.y += dy
      lastX = e.clientX
      lastY = e.clientY
    })
    window.addEventListener('mouseup', () => (dragging = false))

    el.addEventListener('wheel', (e) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const delta = -Math.sign(e.deltaY) * 0.1
      zoom.value = Math.min(3, Math.max(0.2, zoom.value + delta))
    }, { passive: false })
  }

  function detach(_el: HTMLElement) {
    // noop for simplicity in MVP
  }

  function screenToWorld(p: { x: number, y: number }) {
    return { x: p.x, y: p.y }
  }

  function worldToChunk(x: number, y: number): [number, number] {
    const cs = store.chunkSize
    const tileSize = Math.max(4, 18 * zoom.value)
    const tx = Math.floor((x - pan.x) / tileSize)
    const ty = Math.floor((y - pan.y) / tileSize)
    const cx = Math.floor(tx / cs)
    const cy = Math.floor(ty / cs)
    return [cx, cy]
  }

  return { pan, zoom, attach, detach, screenToWorld, worldToChunk }
}


