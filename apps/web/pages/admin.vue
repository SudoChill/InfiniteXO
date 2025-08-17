<template>
  <div class="container mx-auto p-6">
    <div class="p-4 rounded bg-base-200/60 space-y-4">
      <div class="font-semibold">Admin</div>
      <div class="flex items-center gap-2">
        <input v-model="token" placeholder="Admin token" class="input input-bordered" />
        <button class="btn btn-error" @click="clearAll">Reset World (Tiles + Sessions)</button>
      </div>
      <div class="text-xs opacity-70">Set ADMIN_SECRET in server env. Sends X-Admin header.</div>
      <div v-if="msg" class="alert" :class="msgOk? 'alert-success' : 'alert-error'">{{ msg }}</div>

      <div class="divider">Stats</div>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>Players nearby: {{ stats.playersNearby }}</div>
        <div>Sessions nearby: {{ stats.sessionsNearby }}</div>
        <div>Last updates: {{ new Date(stats.lastUpdates).toLocaleTimeString() }}</div>
      </div>

      <div class="divider">Controls</div>
      <ul class="text-sm list-disc pl-5">
        <li>Left click: place tile</li>
        <li>Right drag or Space+Drag: pan</li>
        <li>Ctrl/Cmd + wheel: zoom</li>
        <li>Mobile: one-finger drag to pan</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const token = ref('')
const msg = ref('')
const msgOk = ref(false)
const stats = ref<{ playersNearby: number, sessionsNearby: number, lastUpdates: number }>({ playersNearby: 0, sessionsNearby: 0, lastUpdates: 0 })
async function clearAll() {
  try {
    await $fetch('/api/clear', { method: 'POST', headers: { 'x-admin': token.value }, body: { scope: 'all' } })
    msg.value = 'Cleared'
    msgOk.value = true
  } catch (e: any) {
    msg.value = 'Failed: ' + (e?.data?.error || 'unknown')
    msgOk.value = false
  }
}

async function loadStats() {
  try {
    const res: any = await $fetch('/api/nearby', { query: { x: 0, y: 0 } })
    stats.value = res
  } catch {}
}

onMounted(loadStats)
</script>



