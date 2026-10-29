export function createWindowLimiter(windowMs: number, maxRequests: number, maxKeys = 5000) {
  const entries = new Map<string, { count: number; resetAt: number }>();
  return (key: string, now = Date.now()): number => {
    const current = entries.get(key);
    if (current && current.resetAt > now) {
      if (current.count >= maxRequests) return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      current.count += 1;
      return 0;
    }
    if (entries.size >= maxKeys) {
      for (const [id, value] of entries) if (value.resetAt <= now) entries.delete(id);
    }
    if (entries.size >= maxKeys && !entries.has(key)) return Math.ceil(windowMs / 1000);
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return 0;
  };
}
