export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="iiinbox logo"
    >
      <defs>
        <clipPath id="logo-clip">
          <rect width="32" height="32" rx="7" />
        </clipPath>
      </defs>

      {/* Blue half — top-left triangle */}
      <rect width="32" height="32" rx="7" fill="#2563EB" />

      {/* Yellow half — bottom-right triangle, clipped to rounded square */}
      <polygon
        points="32,0 32,32 0,32"
        fill="#F59E0B"
        clipPath="url(#logo-clip)"
      />

      {/* White "i" letter centred */}
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fill="white"
        fontSize="18"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        i
      </text>
    </svg>
  );
}
