export default defineNuxtPlugin(() => {
  const saved = localStorage.getItem('theme') || 'candy'
  document.documentElement.setAttribute('data-theme', saved)
})


