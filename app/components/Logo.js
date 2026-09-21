export default function Logo({ size = 22, withText = true }) {
  return (
    <span className="logo">
      <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="18" r="9" fill="var(--brand)" />
        <circle cx="19" cy="31" r="9" fill="var(--brand)" opacity="0.85" />
        <circle cx="45" cy="31" r="9" fill="var(--brand)" opacity="0.85" />
        <circle cx="26" cy="45" r="9" fill="var(--brand)" opacity="0.7" />
        <circle cx="39" cy="45" r="9" fill="var(--brand)" opacity="0.7" />
      </svg>
      {withText && <span className="logo-text">Chorus</span>}
    </span>
  );
}
