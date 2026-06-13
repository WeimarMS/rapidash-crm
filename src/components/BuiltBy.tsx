// Firma sutil en los headers del dashboard. Oculta en móvil para no
// competir con los botones de acción.

export default function BuiltBy() {
  return (
    <span className="hidden md:inline font-data text-[11px] text-slate-400 select-none whitespace-nowrap">
      {'// built by Weimar Miranda'}
    </span>
  )
}
