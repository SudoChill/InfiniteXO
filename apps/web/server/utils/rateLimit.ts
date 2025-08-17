const buckets = new Map<string, { tokens: number; last: number }>()

export function rateLimit(key: string, ratePerSec = 4, burst = 8) {
  const now = Date.now()
  const bucket = buckets.get(key) || { tokens: burst, last: now }
  const delta = (now - bucket.last) / 1000
  bucket.tokens = Math.min(burst, bucket.tokens + delta * ratePerSec)
  bucket.last = now
  if (bucket.tokens < 1) {
    buckets.set(key, bucket)
    return false
  }
  bucket.tokens -= 1
  buckets.set(key, bucket)
  return true
}


