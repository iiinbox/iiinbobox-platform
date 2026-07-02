import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 7,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Yellow top half */}
      <div style={{ flex: 1, background: "#F59E0B" }} />
      {/* Blue bottom half */}
      <div style={{ flex: 1, background: "#2563EB" }} />
    </div>,
    { width: 32, height: 32 },
  );
}
