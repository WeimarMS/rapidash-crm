// Firma sutil del autor en los headers del dashboard.
// Desktop: inline en la esquina superior derecha del header.
// Móvil: apilada bajo el badge/botón del cluster derecho, alineada a la
// derecha (no ocupa una línea propia ni compite con el título).

const TEXT = '// built by Weimar Miranda'

export default function BuiltBy() {
  return (
    <span className="hidden md:inline font-data text-[11px] text-slate-400 select-none whitespace-nowrap">
      {TEXT}
    </span>
  )
}

export function BuiltByMobile() {
  return (
    <span className="md:hidden font-data text-[10px] text-slate-300 select-none whitespace-nowrap leading-none">
      {TEXT}
    </span>
  )
}
