export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset=".55" stopColor="#a855f7" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" style={{ fill: "var(--color-panel)", stroke: "var(--color-line)" }} />
      <path d="M9 16c0-2.6 1.9-4.5 4.2-4.5 4 0 5.6 9 9.6 9 2.3 0 4.2-1.9 4.2-4.5M23 16c0 2.6-1.9 4.5-4.2 4.5-4 0-5.6-9-9.6-9" fill="none" stroke="url(#lg)" strokeWidth="2.6" strokeLinecap="round" transform="translate(-1.5 0) scale(.95) translate(.8 .8)" />
    </svg>
  );
}
