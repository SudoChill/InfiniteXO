<template>
  <div class="container mx-auto p-6 prose prose-invert">
    <h1>About Infinite XO</h1>
    <p>
      Infinite XO is a real-time, infinite grid where everyone places X or O on tiles.
      The world is split into <strong>chunks</strong> for fast streaming. Your client loads only the chunks around your view.
    </p>
    <h3>Controls</h3>
    <ul>
      <li>Click: place current tile (X/O)</li>
      <li>Space + Drag or Right-Click Drag: pan</li>
      <li>Ctrl/Cmd + Wheel: zoom to cursor</li>
      <li>Arrows: pan by steps; +/-: zoom in/out</li>
    </ul>
    <h3>Gameplay</h3>
    <ul>
      <li>Place X or O on empty tiles. Optimistic placement updates instantly.</li>
      <li>Server is authoritative and broadcasts <code>tile:update</code> to the chunk room.</li>
      <li>Soft rules (combos, cooldowns) will be added later; presence shows nearby players.</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
</script>


