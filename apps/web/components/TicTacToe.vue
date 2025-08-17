<template>
  <div class="p-3">
    <div class="flex items-center justify-between mb-2">
      <div class="font-semibold">Tic Tac Toe</div>
      <button class="btn btn-xs" @click="reset">Reset</button>
    </div>
    <div class="grid grid-cols-3 gap-1">
      <button v-for="(cell,i) in board" :key="i" class="btn h-14" :class="cell==='X'?'btn-primary':cell==='O'?'btn-secondary':'btn-ghost'" @click="play(i)" :disabled="!!winner || !!cell">
        <span class="text-xl">{{ cell || '\u00A0' }}</span>
      </button>
    </div>
    <div class="mt-2 text-sm">
      <template v-if="winner">Winner: <span class="font-bold">{{ winner }}</span></template>
      <template v-else>Turn: <span class="font-bold">{{ turn }}</span></template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type V = 'X'|'O'|null
const board = ref<V[]>(Array(9).fill(null))
const turn = ref<'X'|'O'>('X')

const lines = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
]

const winner = computed(() => {
  for (const line of lines) {
    const a = line[0]!, b = line[1]!, c = line[2]!
    const v = board.value[a] as V
    if (v && v === (board.value[b] as V) && v === (board.value[c] as V)) return v
  }
  return null
})

function play(i: number) {
  if (board.value[i] || winner.value) return
  board.value[i] = turn.value
  turn.value = turn.value === 'X' ? 'O' : 'X'
}
function reset() {
  board.value = Array(9).fill(null)
  turn.value = 'X'
}
</script>


