/** Logo PATY: la P armada en cinco piezas, el mismo del cierre del video. */
export function LogoPaty({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 160 240" height={size} width={(size * 160) / 240} aria-hidden>
      <path d="M0 0H80V80H0Z" fill="#ff1f3d" />
      <path d="M80 0H120A40 40 0 0 1 160 40V80H80Z" fill="#ffffff" />
      <path d="M0 80H80V160H0Z" fill="#d0001f" />
      <path d="M80 80H160A40 40 0 0 1 120 120H80Z" fill="#ff4d63" />
      <path d="M0 160H80V240H0Z" fill="#ff1f3d" />
    </svg>
  );
}
