import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

// Thin wrapper around ioredis that turns "Redis is unreachable" into a silent
// cache miss instead of a thrown error — every consumer (sessions, page/
// category/asset caching) can call these methods unconditionally and fall
// back to Postgres/JWT-only behavior without its own try/catch. This is the
// one place that graceful degradation (item 5) is actually implemented.
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private warnedDown = false;

  onModuleInit() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn("REDIS_URL not set — sessions/caching disabled, falling back to Postgres/JWT-only");
      return;
    }
    this.client = new Redis(url, {
      // Individual commands fail fast (reject) instead of queuing while
      // disconnected — queuing would make a request hang until Redis comes
      // back, which is not "graceful, just slower", it's a stall.
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 200, 5000),
      lazyConnect: false,
    });
    // ioredis emits 'error' on every failed connection attempt — with no
    // listener attached, Node treats that as an unhandled error and crashes
    // the process. This listener is what actually makes "Redis down never
    // crashes the app" true; everything else here is just convenience.
    this.client.on("error", (err) => {
      if (!this.warnedDown) {
        this.logger.warn(`Redis unavailable, degrading to Postgres/JWT-only: ${err.message}`);
        this.warnedDown = true;
      }
    });
    this.client.on("connect", () => {
      if (this.warnedDown) {
        this.logger.log("Redis connection restored");
        this.warnedDown = false;
      }
    });
  }

  async onModuleDestroy() {
    await this.client?.quit().catch(() => {});
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // swallow — caching is best-effort
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // swallow
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.expire(key, ttlSeconds);
    } catch {
      // swallow
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      return (await this.client.exists(key)) === 1;
    } catch {
      // Redis down — no way to confirm the session; callers treat this as
      // "can't verify, trust the JWT signature alone" rather than "revoked".
      return false;
    }
  }

  get isConnected(): boolean {
    return this.client?.status === "ready";
  }
}
