<template>
  <div class="join bg-base-200 rounded">
    <button class="btn btn-sm join-item" :class="value==='X'?'btn-primary':''" @click="value='X'">X</button>
    <button class="btn btn-sm join-item" :class="value==='O'?'btn-secondary':''" @click="value='O'">O</button>
  </div>
</template>

<script setup lang="ts">
import { useChunksStore } from '~/stores/chunks'
import { storeToRefs } from 'pinia'
const store = useChunksStore()
const { value } = storeToRefs(store)
</script>


