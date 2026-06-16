import { useLang } from '../contexts/LanguageContext'

// ─── Toggle de idioma EN/ES ─────────────────────────────────────────────────
// Segmented control compacto y discreto. Por defecto se fija arriba a la derecha
// (Layout y Login). Refleja el idioma activo desde el LanguageContext.

// Banderas como SVG inline: Windows no renderiza los emoji de bandera (mostraría
// "ES"/"US" en texto), así que dibujamos las banderas para que se vean siempre.
function FlagES() {
  return (
    <svg viewBox="0 0 3 2" className="w-5 h-3.5 rounded-[3px] block" aria-hidden>
      <rect width="3" height="2" fill="#c60b1e" />
      <rect y="0.5" width="3" height="1" fill="#ffc400" />
    </svg>
  )
}
function FlagUS() {
  return (
    <svg viewBox="0 0 19 10" className="w-5 h-3.5 rounded-[3px] block" aria-hidden>
      <rect width="19" height="10" fill="#fff" />
      {[0, 2, 4, 6, 8].map(y => (
        <rect key={y} y={y} width="19" height="1" fill="#b22234" />
      ))}
      <rect width="9" height="6" fill="#3c3b6e" />
    </svg>
  )
}

export default function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useLang()
  const langs: { code: 'es' | 'en'; flag: React.ReactNode; label: string }[] = [
    { code: 'es', flag: <FlagES />, label: 'Español' },
    { code: 'en', flag: <FlagUS />, label: 'English' },
  ]

  return (
    <div
      className={
        className ??
        'fixed top-3 right-3 lg:top-4 lg:right-4 z-50 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur border border-slate-200 shadow-sm p-1'
      }
      role="group"
      aria-label={t('header.language')}
    >
      {langs.map(({ code, flag, label }) => {
        const active = lang === code
        return (
          <button
            key={code}
            onClick={() => setLang(code)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={`flex items-center justify-center w-8 h-7 rounded-full transition-all duration-200 ${
              active
                ? 'bg-blue-50 ring-1 ring-blue-200 shadow-sm'
                : 'opacity-50 hover:opacity-100 hover:bg-slate-100'
            }`}
          >
            {flag}
          </button>
        )
      })}
    </div>
  )
}
