// ─── Logo RapiDash: cápsula en movimiento ─────────────────────────────────────
// Marca del sistema. Diseñado para fondos oscuros (navy del sidebar/login).

export default function LogoCapsula({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="RapiDash">
      <defs>
        <linearGradient id="rd-cap" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
      </defs>
      {/* Trazos de velocidad */}
      <line x1="4"  y1="30" x2="20" y2="30" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" opacity="0.25" />
      <line x1="9"  y1="39" x2="22" y2="39" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      <line x1="14" y1="48" x2="24" y2="48" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      {/* Cápsula inclinada 45° apuntando arriba-derecha */}
      <g transform="rotate(45 40 28)">
        {/* Mitad inferior: contorno */}
        <path
          d="M30 28 V38 A10 10 0 0 0 50 38 V28 Z"
          fill="white" fillOpacity="0.06"
          stroke="#22c55e" strokeWidth="2.5"
        />
        {/* Mitad superior: sólida con gradiente */}
        <path
          d="M30 28 V18 A10 10 0 0 1 50 18 V28 Z"
          fill="url(#rd-cap)"
          stroke="#22c55e" strokeWidth="2.5"
        />
        {/* Brillo */}
        <line x1="35" y1="14" x2="35" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </g>
    </svg>
  )
}
