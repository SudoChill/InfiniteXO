<template>
  <select class="select select-sm" v-model="theme" @change="apply">
    <option value="candy">Candy</option>
    <option value="neon">Neon</option>
    <option value="lofi">Minimal</option>
    <option value="business">Terminal</option>
  </select>
  
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const theme = ref('candy')
function apply() {
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem('theme', theme.value)
}
onMounted(() => {
  theme.value = localStorage.getItem('theme') || 'candy'
  apply()
})
</script>


