import React from 'react'

function MandiriLogo({ size = 32 }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <img
        src="/mandiri-logo.png"
        alt="Bank Mandiri"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
        onError={e => {
          e.target.style.display = 'none'
          e.target.nextSibling.style.display = 'flex'
        }}
      />
      <div style={{
        display: 'none', width: size, height: size,
        background: 'rgba(255,255,255,0.15)', borderRadius: 7,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#F5A623"/>
          <text x="12" y="17" textAnchor="middle" fill="#003F88"
            fontSize="13" fontWeight="800" fontFamily="Arial, sans-serif">M</text>
        </svg>
      </div>
    </div>
  )
}

export default function Header({ title, subtitle, right, backBtn }) {
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {backBtn && (
          <button
            onClick={backBtn}
            style={{
              background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 8,
              color: '#fff', width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, fontSize: '1.35rem', lineHeight: 1,
            }}
          >
            ‹
          </button>
        )}

        {/* Hide logo in desktop mode (sidebar already shows branding) */}
        <div className="header-logo-wrap">
          <MandiriLogo size={34} />
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontSize: '0.9375rem', fontWeight: 700, color: '#fff',
            margin: 0, lineHeight: 1.25,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.68)', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>

        {right && <div style={{ flexShrink: 0 }}>{right}</div>}
      </div>
    </header>
  )
}
