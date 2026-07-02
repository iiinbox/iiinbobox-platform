export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span
      className="font-extrabold tracking-widest text-black"
      style={{ fontSize: size + 'px', lineHeight: 1 }}
    >
      BOX
    </span>
  );
}
