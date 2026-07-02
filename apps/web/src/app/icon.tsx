import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
