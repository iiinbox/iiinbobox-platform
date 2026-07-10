import { notFound } from "next/navigation";
import { getPublishedPageConfig, getPublicSettings, RenderedPage } from "../(home)/PageRenderer";

// A slug with no PageConfig row doesn't fetch-fail (getPublishedPageConfig
// still returns 200) — the backend's get() falls back to an empty
// {components:[]} shape rather than null (see page-config.service.ts), same
// as "home" always has. Treat that empty shape as "not found" here so a
// genuinely nonexistent page 404s instead of silently rendering blank.
function isEmptyConfig(data: any): boolean {
  if (!data) return true;
  const hasZones = data.template || data.header || data.footer;
  if (hasZones) return false;
  return !Array.isArray(data.components) || data.components.length === 0;
}

// Generic live route for any published page besides "home" (which keeps its
// own route at "/" via the (home) group). Every PageConfig row is meant to be
// public-facing — Login/Checkout/etc. are legitimately public pages, same
// trust level "home" already has — so this needs no auth gate.
export default async function SlugPage({ params }: { params: { slug: string } }) {
  const [data, settings] = await Promise.all([getPublishedPageConfig(params.slug), getPublicSettings()]);
  if (isEmptyConfig(data)) notFound();
  return <RenderedPage data={data} settings={settings} />;
}
