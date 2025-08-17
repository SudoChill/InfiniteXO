export default defineNuxtPlugin(() => {
  const log = (event: string, data?: Record<string, any>) => {
    // placeholder for Plausible or custom endpoint
    // console.debug('[analytics]', event, data)
  }
  return { provide: { analytics: { log } } }
})


