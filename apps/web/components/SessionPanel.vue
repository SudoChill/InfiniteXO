<template>
  <div class="p-2">
    <div v-if="banner" class="alert alert-success py-2 mb-2 text-xs">
      {{ banner }}
    </div>
    <div class="flex items-center justify-between">
      <div class="font-semibold text-sm">Nearby Sessions</div>
      <div class="flex items-center gap-2">
        <label class="text-xs flex items-center gap-1"><input type="checkbox" class="checkbox checkbox-xs" v-model="showAll"/> Show all</label>
        <button class="btn btn-xs" @click="refresh">Refresh</button>
      </div>
    </div>
    <div class="mt-2 space-y-2 max-h-40 overflow-auto">
      <div v-for="s in sessionList" :key="s.id" class="flex items-center justify-between bg-base-300 rounded p-2">
        <div class="text-xs">{{ s.kind }} • {{ s.name || s.id.slice(0,6) }} • {{ s.count }} players</div>
        <button class="btn btn-ghost btn-xs" @click="join(s)">Join</button>
      </div>
      <div v-if="!sessions.length" class="text-xs opacity-70">No sessions nearby.</div>
    </div>
    <div class="divider my-2"></div>
    <div class="text-xs font-semibold mb-2">Create</div>
    <div class="flex items-center gap-2 flex-wrap">
      <select v-model="kind" class="select select-xs w-24">
        <option value="ttt">TTT</option>
        <option value="mine">Mines</option>
        <option value="xo-battle">XO Battle</option>
      </select>
      <input v-model="name" class="input input-xs input-bordered flex-1 min-w-[140px]" placeholder="Name (optional)" />
      <button class="btn btn-primary btn-xs" @click="create">Create / Update</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useChunksStore } from '~/stores/chunks'
import { useSessionStore } from '~/stores/session'
import { useInput } from '~/composables/useInput'
import { useUiStore } from '~/stores/ui'

const store = useChunksStore()
const session = useSessionStore()
const sessions = ref<Array<{ id: string, kind: string, name?: string, cx: number, cy: number, width: number, height: number, count: number }>>([])
const sessionList = computed(() => {
  const fromStore = Array.from(store.sessions.values()) as any[]
  const local = sessions.value
  const map = new Map<string, any>()
  for (const s of [...fromStore, ...local]) map.set(s.id, s)
  return Array.from(map.values())
})
const kind = ref<'ttt'|'mine'|'xo-battle'>('ttt')
const name = ref('')
const showAll = ref(false)
const banner = ref('')

const { worldToChunk } = useInput()
async function refresh() {
  if (typeof window === 'undefined') return
  const [cx, cy] = worldToChunk(window.innerWidth / 2, window.innerHeight / 2)
  const res = await $fetch<{ data: any[] }>('/api/sessions', { query: { cx, cy, radius: showAll.value ? 64 : 6 } })
  // upsert into store so WS-created sessions also appear
  for (const s of res.data) store.upsertSession(s)
  sessions.value = res.data
  console.log('[sessions.refresh]', { cx, cy, count: sessionList.value.length })
}
async function create() {
  session.init()
  const [cx, cy] = worldToChunk(window.innerWidth / 2, window.innerHeight / 2)
  const res = await $fetch<{ id: string }>('/api/sessions', { method: 'POST', body: { kind: kind.value, name: name.value, cx, cy, hostId: session.actorId } })
  await refresh()
  banner.value = 'Session created'
  setTimeout(() => (banner.value = ''), 2500)
}
let timer: any
onMounted(() => { refresh(); timer = setInterval(refresh, 5000) })
onUnmounted(() => clearInterval(timer))

const ui = useUiStore()
const { pan } = useInput()
function join(s: any) {
  ui.setJoinedSession(s.id)
  // center camera to approx location
  pan.x = -(s.cx * 128 * 18) // approximate pan to chunk; will refine later if needed
  pan.y = -(s.cy * 128 * 18)
  banner.value = 'Joined ' + (s.name || s.id.slice(0,6))
  setTimeout(() => (banner.value = ''), 2000)
}
</script>


