<template>
  <div data-theme="candy" class="min-h-screen bg-base-100 text-base-content">
    <UApp>
      <NuxtPage />
    </UApp>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Infinite XO',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
  ]
})
</script>


