<template>
  <div class="w-screen h-screen overflow-hidden">
    <WorldCanvas class="absolute inset-0" />
    <HudOverlay class="absolute inset-0 pointer-events-none" />
    <UiToolbar />
  </div>
</template>

<script setup lang="ts">
import WorldCanvas from '~/components/WorldCanvas.vue'
import HudOverlay from '~/components/HudOverlay.vue'
import UiToolbar from '~/components/UiToolbar.vue'
import { useInput } from '~/composables/useInput'

definePageMeta({ layout: false })

// Center camera if deep-linked (?x=&y=)
const route = useRoute()
const { pan, zoom } = useInput()
onMounted(() => {
  const x = Number(route.query.x)
  const y = Number(route.query.y)
  if (Number.isFinite(x) && Number.isFinite(y)) {
    pan.x = -x
    pan.y = -y
  } else {
    // default focus at world origin (0,0) centered on screen
    pan.x = window.innerWidth / 2
    pan.y = window.innerHeight / 2
  }
})
</script>


