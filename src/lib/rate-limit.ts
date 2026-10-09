import { getDb } from "./db";

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const row = db
    .prepare("SELECT count, window_start FROM rate_limits WHERE key = ?")
    .get(key) as { count: number; window_start: number } | undefined;

  if (!row || now - row.window_start >= windowSeconds) {
    db.prepare(
      `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET count = 1, window_start = ?`,
    ).run(key, now, now);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (row.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: windowSeconds - (now - row.window_start),
    };
  }

  db.prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?").run(key);
  return { allowed: true, retryAfterSeconds: 0 };
}
