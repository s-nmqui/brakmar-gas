import { DEFAULT_SITE_CONFIG } from "./config";
import { getDb } from "./db";
import type { SiteConfig } from "./types";

const KEY = "site_config";

function mergeConfig(partial: Partial<SiteConfig>): SiteConfig {
  return {
    ...DEFAULT_SITE_CONFIG,
    ...partial,
    social: { ...DEFAULT_SITE_CONFIG.social, ...(partial.social ?? {}) },
    seo: { ...DEFAULT_SITE_CONFIG.seo, ...(partial.seo ?? {}) },
  };
}

export function getSiteConfig(): SiteConfig {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(KEY) as { value: string } | undefined;
  if (!row) return mergeConfig({});
  try {
    return mergeConfig(JSON.parse(row.value) as Partial<SiteConfig>);
  } catch {
    return mergeConfig({});
  }
}

export function updateSiteConfig(partial: Partial<SiteConfig>): SiteConfig {
  const current = getSiteConfig();
  const next = mergeConfig({ ...current, ...partial });
  const db = getDb();
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(KEY, JSON.stringify(next));
  return next;
}
