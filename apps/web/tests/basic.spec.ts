import { describe, it, expect } from 'vitest'

function toChunk(tx: number, ty: number, size: number) {
  const cx = Math.floor(tx / size)
  const cy = Math.floor(ty / size)
  const lx = ((tx % size) + size) % size
  const ly = ((ty % size) + size) % size
  return { cx, cy, lx, ly }
}

describe('chunk math', () => {
  it('maps to chunk correctly', () => {
    const r = toChunk(-1, -1, 128)
    expect(r.cx).toBe(-1)
    expect(r.cy).toBe(-1)
    expect(r.lx).toBe(127)
    expect(r.ly).toBe(127)
  })
})


