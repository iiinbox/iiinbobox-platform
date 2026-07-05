const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

interface PageComponent {
  id: string;
  type: "text" | "header" | "shape" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  lineHeight?: number;
  fontColor?: string;
  bgColor?: string;
  borderRadius?: number;
  bold?: boolean;
  italic?: boolean;
  textAlign?: "left" | "center" | "right";
  imageUrl?: string;
}

async function getPageConfig() {
  try {
    const res = await fetch(`${API}/page-config/home`, { next: { revalidate: 10 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function Canvas({ components, canvasW, canvasH }: { components: PageComponent[]; canvasW: number; canvasH: number }) {
  return (
    <div className="w-full overflow-hidden">
      <div className="relative w-full" style={{ paddingBottom: `${(canvasH / canvasW) * 100}%` }}>
        {components.map((comp) => (
          <div
            key={comp.id}
            className="absolute"
            style={{
              left: `${(comp.x / canvasW) * 100}%`,
              top: `${(comp.y / canvasH) * 100}%`,
              width: `${(comp.width / canvasW) * 100}%`,
              height: `${(comp.height / canvasH) * 100}%`,
              borderRadius: comp.borderRadius ?? 0,
              backgroundColor: comp.bgColor === "transparent" ? "transparent" : (comp.bgColor ?? "transparent"),
            }}
          >
            {(comp.type === "text" || comp.type === "header") && (
              <div
                className="w-full h-full flex items-center px-1 overflow-hidden"
                style={{
                  fontSize: `${((comp.fontSize ?? 16) / canvasW) * 100}vw`,
                  fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif",
                  fontWeight: comp.fontWeight ?? (comp.bold ? 700 : 400),
                  fontStyle: comp.italic ? "italic" : "normal",
                  lineHeight: comp.lineHeight ?? 1.4,
                  color: comp.fontColor ?? "#111",
                  textAlign: comp.textAlign ?? "left",
                  justifyContent:
                    comp.textAlign === "center" ? "center"
                    : comp.textAlign === "right" ? "flex-end"
                    : "flex-start",
                }}
              >
                {comp.content}
              </div>
            )}
            {comp.type === "image" && comp.imageUrl && (
              <img
                src={comp.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                style={{ borderRadius: comp.borderRadius ?? 4 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const config = await getPageConfig();
  if (!config) return null;

  // New dual-view format: { desktop: { components, height }, mobile: { components, height } }
  if (config.desktop) {
    const desktopComps: PageComponent[] = Array.isArray(config.desktop.components) ? config.desktop.components : [];
    const mobileComps: PageComponent[] = Array.isArray(config.mobile?.components) ? config.mobile.components : [];
    const desktopH: number = typeof config.desktop.height === "number" ? config.desktop.height : 900;
    const mobileH: number = typeof config.mobile?.height === "number" ? config.mobile.height : 812;

    const hasDesktop = desktopComps.length > 0;
    const hasMobile = mobileComps.length > 0;

    if (!hasDesktop && !hasMobile) return null;

    return (
      <>
        {hasDesktop && (
          <div className={hasMobile ? "hidden md:block" : undefined}>
            <Canvas components={desktopComps} canvasW={1920} canvasH={desktopH} />
          </div>
        )}
        {hasMobile && (
          <div className={hasDesktop ? "md:hidden" : undefined}>
            <Canvas components={mobileComps} canvasW={375} canvasH={mobileH} />
          </div>
        )}
      </>
    );
  }

  // Legacy format: { components: [] } — treated as a 1200×700 desktop canvas
  const components: PageComponent[] = Array.isArray(config.components) ? config.components : [];
  if (components.length === 0) return null;
  return <Canvas components={components} canvasW={1200} canvasH={700} />;
}
