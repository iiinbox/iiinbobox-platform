import { Injectable } from "@nestjs/common";
import { prisma } from "@iiiiibox/database";
import { RedisService } from "../redis/redis.service";

// Singleton row, always id "global" — the only site-wide setting in the app
// (everything else lives per-page in PageConfig.config). Favicon/logo change
// rarely and are actively purged on every write, so a long TTL here is only
// a safety net, same reasoning as PageConfigService's PUBLISHED_TTL_SECONDS.
const SETTINGS_ID = "global";
const PUBLIC_TTL_SECONDS = 60 * 60;
const PUBLIC_KEY = "settings:public";

export interface SiteSettingsPatch {
  logoUrl?: string | null;
  logoWidth?: number;
  logoAlign?: string;
  logoLink?: string;
  faviconUrl?: string | null;
  faviconContentType?: string;
}

@Injectable()
export class SettingsService {
  constructor(private readonly redis: RedisService) {}

  // Uncached — hit by the admin editor, which must always see the latest
  // saved values (same reasoning as PageConfigService.get()), AND by
  // getPublic() below on every cache miss — meaning with Redis down, this
  // runs on essentially every public page load. findUnique-first (not
  // upsert) is deliberate: Prisma's upsert isn't atomic against concurrent
  // callers (it's a find-then-branch, not a real `INSERT ... ON CONFLICT`),
  // so two simultaneous first-ever requests could both see "no row" and both
  // attempt to create it, and the loser crashes on the unique constraint
  // instead of getting the settings back. Caught here: fall back to a plain
  // re-fetch if that race is hit, rather than letting it 500.
  async get() {
    const existing = await prisma.siteSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (existing) return existing;
    try {
      return await prisma.siteSettings.create({ data: { id: SETTINGS_ID } });
    } catch (err: any) {
      if (err?.code === "P2002") {
        const row = await prisma.siteSettings.findUnique({ where: { id: SETTINGS_ID } });
        if (row) return row;
      }
      throw err;
    }
  }

  // Cached — hit by the live site's header render and the favicon route,
  // both of which fire on essentially every page load/tab.
  async getPublic() {
    const cached = await this.redis.get(PUBLIC_KEY);
    if (cached !== null) return cached;
    const settings = await this.get();
    await this.redis.set(PUBLIC_KEY, settings, PUBLIC_TTL_SECONDS);
    return settings;
  }

  async update(patch: SiteSettingsPatch) {
    const result = await prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      update: patch,
      create: { id: SETTINGS_ID, ...patch },
    });
    // Purge immediately so the very next live/favicon read reflects the
    // change instantly rather than waiting out the safety-net TTL.
    await this.redis.del(PUBLIC_KEY);
    return result;
  }
}
