<template>
  <div class="p-3">
    <div class="flex items-center justify-between mb-2">
      <div class="font-semibold">Minesweeper</div>
      <div class="flex items-center gap-2">
        <select v-model.number="size" class="select select-xs">
          <option :value="8">8x8</option>
          <option :value="12">12x12</option>
          <option :value="16">16x16</option>
        </select>
        <button class="btn btn-xs" @click="reset">New</button>
      </div>
    </div>
    <div class="grid" :style="{ gridTemplateColumns: `repeat(${size}, minmax(0,1fr))` }">
      <button v-for="(cell, idx) in cells" :key="idx" class="btn btn-sm h-8 min-h-0"
        :class="cell.revealed ? (cell.mine ? 'btn-error' : 'btn-ghost') : 'btn-neutral'"
        @click="reveal(idx)" @contextmenu.prevent="toggleFlag(idx)">
        <span v-if="cell.revealed && !cell.mine" class="text-xs">{{ cell.count || '' }}</span>
        <span v-else-if="cell.revealed && cell.mine">💣</span>
        <span v-else-if="cell.flag">🚩</span>
        <span v-else>&nbsp;</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

interface Cell { mine: boolean; revealed: boolean; flag: boolean; count: number }
const size = ref(12)
const cells = reactive<Cell[]>([])

function idx(x: number, y: number) { return y * size.value + x }
function neighbors(x: number, y: number) {
  const list: [number, number][] = []
  for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) if (dx||dy) {
    const nx = x+dx, ny = y+dy
    if (nx>=0 && ny>=0 && nx<size.value && ny<size.value) list.push([nx,ny])
  }
  return list
}

function reset() {
  cells.splice(0, cells.length)
  const total = size.value * size.value
  const mines = Math.max(1, Math.floor(total * 0.15))
  for (let i=0;i<total;i++) cells.push({ mine: false, revealed: false, flag: false, count: 0 })
  // random mines
  let placed = 0
  while (placed < mines) {
    const i = Math.floor(Math.random() * total)
    const c = cells[i] as Cell
    if (!c.mine) { c.mine = true; placed++ }
  }
  // counts
  for (let y=0;y<size.value;y++) for (let x=0;x<size.value;x++) {
    const i = idx(x,y)
    const here = cells[i] as Cell
    here.count = neighbors(x,y).reduce((acc,[nx,ny]) => acc + ((cells[idx(nx,ny)] as Cell).mine?1:0), 0)
  }
}

function reveal(i: number) {
  const cell = cells[i] as Cell
  if (cell.revealed || cell.flag) return
  cell.revealed = true
  if (!cell.mine && cell.count === 0) {
    const x = i % size.value, y = Math.floor(i / size.value)
    for (const [nx,ny] of neighbors(x,y)) reveal(idx(nx,ny))
  }
}
function toggleFlag(i: number) {
  const c = cells[i] as Cell
  if (c.revealed) return
  c.flag = !c.flag
}

reset()
</script>


