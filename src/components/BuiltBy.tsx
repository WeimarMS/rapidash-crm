// Firma sutil del autor en los headers del dashboard.
// Desktop: inline en la esquina superior derecha del header.
// Móvil: segunda línea bajo el título (no compite con el botón de acción).

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
    <p className="md:hidden font-data text-[11px] text-slate-400 select-none mt-0.5">
      {TEXT}
    </p>
  )
}
