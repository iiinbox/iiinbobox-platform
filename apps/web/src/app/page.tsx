const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

type ButtonStyle = "solid" | "outline" | "ghost" | "link";
type ButtonActionType = "url" | "buy" | "search" | "custom";

interface PageComponent {
  id: string;
  type: "text" | "header" | "shape" | "image" | "button";
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
  buttonStyle?: ButtonStyle;
  borderColor?: string;
  hoverBgColor?: string;
  hoverFontColor?: string;
  buttonAction?: { type: ButtonActionType; value: string };
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

function buttonHref(comp: PageComponent): string | undefined {
  const action = comp.buttonAction;
  if (!action?.value) return undefined;
  switch (action.type) {
    case "url": return action.value;
    case "buy": return `/products/${action.value}`;
    case "search": return `/search?q=${encodeURIComponent(action.value)}`;
    default: return undefined;
  }
}

function Canvas({ components, canvasW, canvasH }: { components: PageComponent[]; canvasW: number; canvasH: number }) {
  // Generate per-button hover CSS so we don't need a client component
  const hoverCss = components
    .filter((c) => c.type === "button")
    .map((c) => {
      const isSolid = !c.buttonStyle || c.buttonStyle === "solid";
      const hoverBg = c.hoverBgColor ?? (isSolid ? (c.bgColor ?? "#2563eb") : "rgba(0,0,0,0.05)");
      const hoverColor = c.hoverFontColor ?? c.fontColor;
      return [
        `#hpbtn-${c.id}:hover{`,
        hoverBg ? `background-color:${hoverBg}!important;` : "",
        hoverColor ? `color:${hoverColor}!important;` : "",
        `}`,
      ].join("");
    })
    .join("");

  return (
    <>
      {hoverCss && <style>{hoverCss}</style>}
      <div className="w-full overflow-hidden">
        <div className="relative w-full" style={{ paddingBottom: `${(canvasH / canvasW) * 100}%` }}>
          {components.map((comp) => {
            const left = `${(comp.x / canvasW) * 100}%`;
            const top = `${(comp.y / canvasH) * 100}%`;
            const width = `${(comp.width / canvasW) * 100}%`;
            const height = `${(comp.height / canvasH) * 100}%`;
            const isBtn = comp.type === "button";
            const isSolid = !comp.buttonStyle || comp.buttonStyle === "solid";
            const isOutline = comp.buttonStyle === "outline";
            const isGhost = comp.buttonStyle === "ghost";
            const isLink = comp.buttonStyle === "link";

            return (
              <div
                key={comp.id}
                className="absolute"
                style={{
                  left, top, width, height,
                  borderRadius: isBtn ? 0 : (comp.borderRadius ?? 0),
                  backgroundColor: isBtn
                    ? "transparent"
                    : (comp.bgColor === "transparent" ? "transparent" : (comp.bgColor ?? "transparent")),
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

                {isBtn && (() => {
                  const href = buttonHref(comp);
                  const sharedStyle: React.CSSProperties = {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    borderRadius: comp.borderRadius ?? 8,
                    backgroundColor: isSolid ? (comp.bgColor ?? "#3b82f6") : "transparent",
                    color: comp.fontColor ?? (isSolid ? "#ffffff" : (comp.bgColor ?? "#3b82f6")),
                    border: (isOutline || isGhost) ? `2px solid ${comp.borderColor ?? comp.bgColor ?? "#3b82f6"}` : "none",
                    textDecoration: isLink ? "underline" : "none",
                    fontSize: `${((comp.fontSize ?? 16) / canvasW) * 100}vw`,
                    fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif",
                    fontWeight: comp.fontWeight ?? 600,
                    cursor: "pointer",
                    transition: "background-color 0.15s, color 0.15s",
                    overflow: "hidden",
                  };
                  return href ? (
                    <a
                      id={`hpbtn-${comp.id}`}
                      href={href}
                      target={comp.buttonAction?.type === "url" ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      style={sharedStyle}
                    >
                      {comp.content ?? "Button"}
                    </a>
                  ) : (
                    <button id={`hpbtn-${comp.id}`} type="button" style={sharedStyle}>
                      {comp.content ?? "Button"}
                    </button>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default async function HomePage() {
  const config = await getPageConfig();
  if (!config) return null;

  // Dual-view format: { desktop: { components, height }, mobile: { components, height } }
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

  // Legacy format: { components: [] }
  const components: PageComponent[] = Array.isArray(config.components) ? config.components : [];
  if (components.length === 0) return null;
  return <Canvas components={components} canvasW={1200} canvasH={700} />;
}
