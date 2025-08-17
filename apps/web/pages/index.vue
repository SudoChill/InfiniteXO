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

definePageMeta({ layout: false })
</script>


