<template>
  <div class="w-screen h-screen overflow-hidden">
    <WorldCanvas class="absolute inset-0" />
    <HudOverlay class="absolute inset-0 pointer-events-none" />
    <div class="absolute left-4 top-4 flex gap-2 pointer-events-auto">
      <ThemeSwitcher />
      <TilePicker />
    </div>
  </div>
</template>

<script setup lang="ts">
import WorldCanvas from '~/components/WorldCanvas.vue'
import HudOverlay from '~/components/HudOverlay.vue'
import ThemeSwitcher from '~/components/ThemeSwitcher.vue'
import TilePicker from '~/components/TilePicker.vue'

definePageMeta({ layout: false })
</script>


