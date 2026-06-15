// Firma del autor.
// - BuiltBy / BuiltByMobile: firma sutil en los headers del dashboard.
// - BuiltBySignature: firma destacada y enlazada para la pantalla de login.

const TEXT = '// built by Weimar Miranda'

// ─── Firma sutil de headers (dashboard) ───────────────────────────────────────

export default function BuiltBy() {
  return (
    <span className="hidden md:inline font-data text-[11px] text-slate-400 select-none whitespace-nowrap">
      {TEXT}
    </span>
  )
}

export function BuiltByMobile() {
  return (
    <p className="md:hidden font-data text-xs text-slate-400 mt-0.5 select-none">
      {TEXT}
    </p>
  )
}

// ─── Firma destacada (login) ──────────────────────────────────────────────────
// Badge premium con monograma "WM" y el crédito "// built by Weimar Miranda".
// Pensado para fondo oscuro. Sin enlaces ni datos de contacto.

export function BuiltBySignature({ className = '' }: { className?: string }) {
  return (
    <div
      className={
        'group inline-flex items-center gap-3 rounded-xl border border-emerald-500/20 ' +
        'bg-white/[0.03] backdrop-blur-sm px-3 py-2 ' +
        'transition-all duration-300 hover:border-emerald-400/40 hover:bg-white/[0.06] ' +
        className
      }
    >
      {/* Monograma WM */}
      <span
        aria-hidden
        className="relative flex-shrink-0 grid place-items-center w-9 h-9 rounded-lg text-white text-[13px] font-extrabold tracking-tight
                   transition-transform duration-300 group-hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}
      >
        WM
        <span
          className="absolute -inset-1.5 rounded-lg blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
          style={{ background: 'rgba(34,197,94,0.45)' }}
        />
      </span>

      {/* Texto */}
      <span className="flex flex-col gap-1">
        <span className="rd-mono text-[11px] leading-none text-emerald-300/80 select-none">
          {'// built by'}
        </span>
        <span className="text-sm font-bold leading-none text-white tracking-tight whitespace-nowrap">
          Weimar Miranda
        </span>
      </span>
    </div>
  )
}
