<template>
  <div class="absolute left-4 top-4 z-10 safe-area">
    <div class="p-3 min-w-[320px] rounded bg-base-200/80 backdrop-blur">
      <div class="flex items-center gap-2">
        <select v-model="theme" class="select select-sm w-36">
          <option v-for="t in themes" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
        <input v-model="name" placeholder="Your name" class="input input-sm input-bordered flex-1" @change="saveName" />
      </div>
      <div class="flex items-center gap-2 mt-3">
        <div class="join">
          <button class="btn btn-xs join-item" :class="store.value==='X'?'btn-primary':''" @click="store.value='X'">X</button>
          <button class="btn btn-xs join-item" :class="store.value==='O'?'btn-secondary':''" @click="store.value='O'">O</button>
        </div>
        <div class="text-xs opacity-70">Zoom {{ zoomPct }}</div>
        <button class="btn btn-xs" @click="openSessions">Create/Join</button>
        <button class="btn btn-xs" @click="toggleStats">Stats</button>
        <NuxtLink class="btn btn-ghost btn-xs" to="/admin">Admin</NuxtLink>
        <label class="flex items-center gap-1 text-xs"><input type="checkbox" class="toggle toggle-xs" v-model="store.debug.showChunkBorders"/> Grid</label>
        <label v-if="mounted" class="flex items-center gap-1 text-xs"><input type="checkbox" class="toggle toggle-xs" :checked="sfx.enabled.value" @change="onSfxToggle"/> SFX</label>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useChunksStore } from '~/stores/chunks'
import { useInput } from '~/composables/useInput'
import { useSessionStore } from '~/stores/session'
import { useSfx } from '~/composables/useSfx'
import { useUiStore } from '~/stores/ui'

const store = useChunksStore()
const { zoom } = useInput()
const session = useSessionStore()
const sfx = useSfx()
const ui = useUiStore()

const name = ref('')
const theme = ref('candy')
const themes = [
  { label: 'Candy (playful)', value: 'candy' },
  { label: 'Neon (arcade)', value: 'neon' },
  { label: 'Minimal', value: 'lofi' },
  { label: 'Terminal', value: 'business' }
]

const zoomPct = computed(() => `${Math.round(zoom.value * 100)}%`)

function applyTheme() {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem('theme', theme.value)
}
function saveName() {
  session.setName(name.value)
}

onMounted(() => {
  session.init()
  name.value = session.name
  theme.value = localStorage.getItem('theme') || 'candy'
  applyTheme()
  mounted.value = true
})

watch(theme, applyTheme)

function openSessions() { ui.setHudTab('sessions') }

const mounted = ref(false)
// debug log for Create/Join
function onSfxToggle(e: Event) { console.debug('[ui] sfx toggle'); sfx.setEnabled((e.target as HTMLInputElement).checked) }
function toggleStats() { window.dispatchEvent(new CustomEvent('xo:toggle-stats')) }
</script>


