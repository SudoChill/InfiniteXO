export default defineNuxtPlugin(() => {
  if (process.server) return
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        reg.update()
      } catch (e) {
        // ignore
      }
    })
  }
})


