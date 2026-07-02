export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Gift box icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Box body */}
        <rect x="3" y="14" width="26" height="16" fill="black" />

        {/* Box lid */}
        <rect x="1" y="10" width="30" height="6" fill="black" />

        {/* Vertical ribbon on body (white) */}
        <rect x="14" y="14" width="4" height="16" fill="white" />

        {/* Vertical ribbon on lid (white) */}
        <rect x="14" y="10" width="4" height="6" fill="white" />

        {/* Bow left loop */}
        <path
          d="M16 10 C16 10 8 8 8 4 C8 2 10 1 12 2 C14 3 16 10 16 10Z"
          fill="black"
          stroke="white"
          strokeWidth="1"
        />

        {/* Bow right loop */}
        <path
          d="M16 10 C16 10 24 8 24 4 C24 2 22 1 20 2 C18 3 16 10 16 10Z"
          fill="black"
          stroke="white"
          strokeWidth="1"
        />

        {/* Bow centre knot */}
        <circle cx="16" cy="10" r="2" fill="white" />
      </svg>

      {/* BOX wordmark */}
      <span className="text-sm font-extrabold tracking-widest text-black">BOX</span>
    </div>
  );
}
