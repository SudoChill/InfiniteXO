<template>
  <div class="container mx-auto p-6">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="font-semibold">Admin</div>
        </div>
      </template>
      <div class="flex items-center gap-2">
        <UInput v-model="token" placeholder="Admin token" />
        <UButton color="red" @click="clearAll">Clear Grid</UButton>
      </div>
      <div class="text-xs opacity-70 mt-2">Set ADMIN_SECRET in server env. Sends X-Admin header.</div>
      <div v-if="msg" class="mt-3">
        <UAlert :color="msgColor" :title="msg" />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const token = ref('')
const msg = ref('')
const msgColor = ref<'primary'|'secondary'|'success'|'info'|'warning'|'error'|'neutral'>('primary')
async function clearAll() {
  try {
    await $fetch('/api/clear', { method: 'POST', headers: { 'x-admin': token.value }, body: { scope: 'all' } })
    msg.value = 'Cleared'
    msgColor.value = 'success'
  } catch (e: any) {
    msg.value = 'Failed: ' + (e?.data?.error || 'unknown')
    msgColor.value = 'error'
  }
}
</script>


