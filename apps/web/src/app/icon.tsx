import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

function defaultIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Gift box body */}
      <div
        style={{
          width: 24,
          height: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Bow left */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 2,
            width: 8,
            height: 5,
            background: "black",
            borderRadius: "50% 0 0 50%",
          }}
        />
        {/* Bow right */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 2,
            width: 8,
            height: 5,
            background: "black",
            borderRadius: "0 50% 50% 0",
          }}
        />
        {/* Bow centre */}
        <div
          style={{
            position: "absolute",
            top: 1,
            left: "50%",
            transform: "translateX(-50%)",
            width: 5,
            height: 5,
            background: "black",
            borderRadius: "50%",
          }}
        />
        {/* Lid */}
        <div
          style={{
            position: "absolute",
            top: 5,
            width: 24,
            height: 6,
            background: "black",
            borderRadius: "2px 2px 0 0",
          }}
        />
        {/* Lid ribbon stripe */}
        <div
          style={{
            position: "absolute",
            top: 5,
            left: "50%",
            transform: "translateX(-50%)",
            width: 4,
            height: 6,
            background: "white",
          }}
        />
        {/* Box body */}
        <div
          style={{
            position: "absolute",
            top: 11,
            width: 22,
            height: 14,
            background: "black",
            borderRadius: "0 0 2px 2px",
          }}
        />
        {/* Box ribbon stripe */}
        <div
          style={{
            position: "absolute",
            top: 11,
            left: "50%",
            transform: "translateX(-50%)",
            width: 4,
            height: 14,
            background: "white",
          }}
        />
      </div>
    </div>,
    { width: 32, height: 32 },
  );
}

// Admin-uploaded favicon (see PageEditor.tsx's "Logo & Favicon" sidebar
// section) takes over once set; falls back to the hardcoded gift-box glyph
// above if unset, or if anything along the way fails — a broken/unreachable
// settings fetch must never take the site's favicon down entirely.
export default async function Icon() {
  try {
    const settingsRes = await fetch(`${API}/settings/public`, { next: { revalidate: 60 } });
    if (!settingsRes.ok) return defaultIcon();
    const settings = await settingsRes.json();
    if (!settings?.faviconUrl) return defaultIcon();

    const imageRes = await fetch(settings.faviconUrl, { next: { revalidate: 60 } });
    if (!imageRes.ok) return defaultIcon();
    const bytes = await imageRes.arrayBuffer();
    return new Response(bytes, {
      headers: { "content-type": settings.faviconContentType || "image/png" },
    });
  } catch {
    return defaultIcon();
  }
}
