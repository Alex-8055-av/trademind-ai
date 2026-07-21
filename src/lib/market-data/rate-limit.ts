/**
 * Simple in-memory token bucket per provider. Suitable for a single Worker
 * instance; for horizontal scale swap for a Redis / Durable Object impl
 * behind the same interface.
 */
export interface RateLimiter {
  acquire(): Promise<void>;
}

class TokenBucket implements RateLimiter {
  private tokens: number;
  private lastRefill = Date.now();
  constructor(private capacity: number, private refillPerSecond: number) {
    this.tokens = capacity;
  }
  async acquire(): Promise<void> {
    for (let i = 0; i < 5; i++) {
      this.refill();
      if (this.tokens >= 1) { this.tokens -= 1; return; }
      const waitMs = Math.max(50, ((1 - this.tokens) / this.refillPerSecond) * 1000);
      await new Promise((r) => setTimeout(r, waitMs));
    }
    throw new Error("Rate limit exceeded");
  }
  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSecond);
    this.lastRefill = now;
  }
}

const buckets = new Map<string, TokenBucket>();

export function getRateLimiter(provider: string, capacity = 5, refillPerSecond = 5): RateLimiter {
  const existing = buckets.get(provider);
  if (existing) return existing;
  const b = new TokenBucket(capacity, refillPerSecond);
  buckets.set(provider, b);
  return b;
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseMs = 250): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await fn(); } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      const jitter = Math.random() * 100;
      await new Promise((r) => setTimeout(r, baseMs * 2 ** attempt + jitter));
    }
  }
  throw lastErr;
}
