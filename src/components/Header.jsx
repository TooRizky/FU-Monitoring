import React from 'react'

function MandiriLogo({ size = 34 }) {
  return (
    <img
      src="/logo.png"
      alt="Logo"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block', flexShrink: 0 }}
      onError={e => {
        // Coba logo.svg sebagai fallback
        if (!e.target.src.endsWith('.svg')) {
          e.target.src = '/logo.svg'
        } else {
          // Sembunyikan sepenuhnya jika keduanya tidak ada
          e.target.style.display = 'none'
        }
      }}
    />
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

        {/* Logo — hanya tampil di mobile, disembunyikan di desktop via CSS */}
        <div className="header-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MandiriLogo size={34} />
          {/* Divider vertikal — hanya tampil jika logo ada */}
          <div className="header-logo-divider" style={{
            width: 1, height: 28,
            background: 'rgba(255,255,255,0.25)',
            flexShrink: 0,
          }} />
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
