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
  fontColor?: string;
  bgColor?: string;
  borderRadius?: number;
  bold?: boolean;
  italic?: boolean;
  textAlign?: "left" | "center" | "right";
  imageUrl?: string;
}

const CANVAS_W = 1200;
const CANVAS_H = 700;

async function getPageConfig(): Promise<{ components: PageComponent[] }> {
  try {
    const res = await fetch(`${API}/page-config/home`, { next: { revalidate: 10 } });
    if (!res.ok) return { components: [] };
    return res.json();
  } catch {
    return { components: [] };
  }
}

export default async function HomePage() {
  const config = await getPageConfig();
  const components = Array.isArray(config?.components) ? config.components : [];

  if (components.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="relative w-full" style={{ paddingBottom: `${(CANVAS_H / CANVAS_W) * 100}%` }}>
        {components.map((comp) => {
          const left = `${(comp.x / CANVAS_W) * 100}%`;
          const top = `${(comp.y / CANVAS_H) * 100}%`;
          const width = `${(comp.width / CANVAS_W) * 100}%`;
          const height = `${(comp.height / CANVAS_H) * 100}%`;
          const fontSize = `${(comp.fontSize ?? 16) / CANVAS_W * 100}vw`;

          return (
            <div
              key={comp.id}
              className="absolute"
              style={{
                left, top, width, height,
                borderRadius: comp.borderRadius ?? 0,
                backgroundColor: comp.bgColor === "transparent" ? "transparent" : (comp.bgColor ?? "transparent"),
              }}
            >
              {(comp.type === "text" || comp.type === "header") && (
                <div
                  className="w-full h-full flex items-center px-1 overflow-hidden"
                  style={{
                    fontSize,
                    color: comp.fontColor ?? "#111",
                    fontWeight: comp.bold ? "bold" : "normal",
                    fontStyle: comp.italic ? "italic" : "normal",
                    textAlign: comp.textAlign ?? "left",
                    justifyContent: comp.textAlign === "center" ? "center" : comp.textAlign === "right" ? "flex-end" : "flex-start",
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
          );
        })}
      </div>
    </div>
  );
}
