<template>
  <div class="p-2">
    <div v-if="banner" class="alert alert-success py-2 mb-2 text-xs">
      {{ banner }}
    </div>

    <!-- Status row -->
    <div class="flex items-center justify-between mb-2">
      <div class="text-xs flex items-center gap-2">
        <span class="font-semibold">Status:</span>
        <span v-if="ui.joinedSessionId" class="badge badge-success badge-sm">In session</span>
        <span v-else class="badge badge-ghost badge-sm">Not in a session</span>
        <span v-if="joinedFraction" class="opacity-70">• {{ joinedFraction }}</span>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs flex items-center gap-1"><input type="checkbox" class="checkbox checkbox-xs" v-model="showAll"/> Show all</label>
        <button class="btn btn-xs" @click="refresh">Refresh</button>
      </div>
    </div>

    <!-- Nearby list -->
    <div class="mt-2 space-y-2 max-h-40 overflow-auto">
      <div v-for="s in sessionList" :key="s.id" class="flex items-center justify-between bg-base-300 rounded p-2">
        <div class="text-xs">XO • {{ s.name || s.id.slice(0,6) }} • {{ filledOfTwo(s) }}</div>
        <div class="flex items-center gap-2">
          <button v-if="ui.joinedSessionId!==s.id" class="btn btn-ghost btn-xs" @click="join(s)">Join</button>
          <button v-else disabled class="btn btn-ghost btn-xs">Joined</button>
        </div>
      </div>
      <div v-if="!sessionList.length" class="text-xs opacity-70">No sessions nearby.</div>
    </div>

    <div class="divider my-2"></div>

    <!-- Create / Leave -->
    <div class="flex items-center gap-2 flex-wrap">
      <input v-model="name" class="input input-xs input-bordered flex-1 min-w-[140px]" placeholder="Session name (optional)" />
      <button class="btn btn-primary btn-xs" :disabled="ui.joinedSessionId!==null" @click="create">Create & Join</button>
      <button class="btn btn-ghost btn-xs" :disabled="ui.joinedSessionId===null" @click="leave">Leave</button>
    </div>

    <div class="mt-2 text-[11px] opacity-70">
      Tip: Open two browser windows nearby the same area. Create a session on one, then Join from the other.
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
// Only XO (ttt) for now
const kind = ref<'ttt'>('ttt')
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
  // Auto-join the created session
  const created = sessionList.value.find(s => s.id === res.id)
  if (created) join(created)
  banner.value = 'Session created'
  setTimeout(() => (banner.value = ''), 2500)
}
let timer: any
onMounted(() => { refresh(); timer = setInterval(refresh, 5000) })
onUnmounted(() => clearInterval(timer))

const ui = useUiStore()
const { pan } = useInput()
const joinedFraction = computed(() => {
  const id = ui.joinedSessionId
  if (!id) return ''
  const s: any = store.sessions.get(id)
  if (!s) return ''
  const members = typeof s.count === 'number' ? s.count : 0
  const host = s?.hostId ? 1 : 0
  const total = members + host
  if (total <= 0) return ''
  const filled = Math.min(2, total)
  return `${filled}/2`
})
function filledOfTwo(s: any) {
  if (!s) return ''
  const members = typeof s.count === 'number' ? s.count : 0
  const host = s?.hostId ? 1 : 0
  const total = members + host
  if (total <= 0) return ''
  const filled = Math.min(2, total)
  return `${filled}/2`
}
function join(s: any) {
  // register join on server so counts update and ready can emit
  try {
    session.init()
    $fetch('/api/sessions-join', { method: 'POST', body: { id: s.id, actorId: session.actorId } })
  } catch {}
  ui.setJoinedSession(s.id)
  // center camera to approx location
  pan.x = -(s.cx * 128 * 18) // approximate pan to chunk; will refine later if needed
  pan.y = -(s.cy * 128 * 18)
  banner.value = 'Joined ' + (s.name || s.id.slice(0,6))
  setTimeout(() => (banner.value = ''), 2000)
}
async function leave() {
  try {
    session.init()
    await $fetch('/api/clear', { method: 'POST', body: { scope: 'mine', actorId: session.actorId } })
  } catch {}
  ui.setJoinedSession(null)
  banner.value = 'Left session'
  setTimeout(() => (banner.value = ''), 1500)
}
</script>


