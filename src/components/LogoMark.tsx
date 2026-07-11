export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-lockup ${compact ? 'brand-lockup--compact' : ''}`}>
      <svg className="logo-mark" viewBox="0 0 120 120" role="img" aria-label="Hand inside an energy ring">
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#39e7ff" />
            <stop offset="0.55" stopColor="#7868ff" />
            <stop offset="1" stopColor="#d46cff" />
          </linearGradient>
          <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="60" cy="60" r="48" fill="none" stroke="url(#ringGradient)" strokeWidth="3.5" strokeDasharray="17 8" filter="url(#logoGlow)" />
        <circle cx="60" cy="60" r="39" fill="rgba(32,225,255,.035)" stroke="rgba(94,220,255,.25)" strokeWidth="1" />
        <path
          d="M39 77c-2-11-1-20 1-27 1-4 6-4 8 0l1 11V36c0-5 7-6 8 0l1 22 2-28c0-5 7-5 8 0l1 28 3-22c1-5 8-4 8 1v25l4-11c2-5 9-2 8 3l-5 22c-2 11-10 19-22 20-14 2-24-5-26-19Z"
          fill="rgba(5,13,29,.86)"
          stroke="#eaffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#logoGlow)"
        />
        <path d="M45 72c11-7 24-8 39-2" fill="none" stroke="#39e7ff" strokeWidth="2" strokeLinecap="round" opacity=".75" />
      </svg>
      {!compact && (
        <div>
          <strong>GestureVerse</strong>
          <span>FX Studio</span>
        </div>
      )}
    </div>
  )
}
