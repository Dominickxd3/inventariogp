function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function FloatingToolbar({ actions, hint }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-3">
      {hint && (
        <p className="pointer-events-none max-w-sm rounded-full bg-neutral-900/85 px-3 py-1 text-center text-xs text-white shadow-lg backdrop-blur-sm">
          {hint}
        </p>
      )}
      <nav
        aria-label="Herramientas del documento"
        className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-neutral-200/80 bg-white/95 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md"
      >
        {actions.map((action) => (
          <div key={action.id} className="flex items-center">
            {action.dividerBefore && <span aria-hidden className="mx-1 h-7 w-px bg-neutral-200" />}
            <div className="group relative">
              <button
                type="button"
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                aria-label={action.label}
                title={action.label}
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 disabled:cursor-not-allowed disabled:opacity-40 ${
                  action.primary
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95'
                    : action.danger
                      ? 'text-red-600 hover:bg-red-50 active:scale-95'
                      : 'text-neutral-700 hover:bg-neutral-100 active:scale-95'
                }`}
              >
                {action.loading ? <Spinner /> : action.icon}
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition group-hover:opacity-100 group-focus-within:opacity-100"
              >
                {action.label}
                <span aria-hidden className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-neutral-900" />
              </span>
            </div>
          </div>
        ))}
      </nav>
    </div>
  )
}
