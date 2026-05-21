export function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <img
      src="/verified-badge.png"
      alt="Verified"
      width={size}
      height={size}
      className="inline-block shrink-0 select-none"
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
