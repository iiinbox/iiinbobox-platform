import { getPublishedPageConfig, getPublicSettings, RenderedPage } from "./PageRenderer";

// Header/Template/Footer are all embedded in this one page's own config row
// (see PageEditor.tsx's single combined save()). A row saved before this
// change is the older flat {components:[]} or {name,desktop,mobile} shape —
// treated as template-only, with header/footer simply absent (ZoneCanvas
// already renders nothing for a null config).
//
// Rendering itself is shared with every other published page via
// PageRenderer.tsx — this file only pins the slug to "home". See
// apps/web/src/app/[slug]/page.tsx for the generic version.
export default async function HomePage() {
  const [data, settings] = await Promise.all([getPublishedPageConfig("home"), getPublicSettings()]);
  if (!data) return null;
  return <RenderedPage data={data} settings={settings} />;
}
