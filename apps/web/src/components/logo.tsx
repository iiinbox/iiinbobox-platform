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

      {/* Yellow fills the full rounded square (top half visible) */}
      <rect width="32" height="32" rx="7" fill="#F59E0B" />

      {/* Blue covers the bottom half, clipped to rounded corners */}
      <rect y="16" width="32" height="16" fill="#2563EB" clipPath="url(#logo-clip)" />
    </svg>
  );
}
