import React from 'react'
import { LayoutDashboard, Store, Camera, FileBarChart2 } from 'lucide-react'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
  { key: 'merchants', label: 'Merchant',   Icon: Store },
  { key: 'evidence',  label: 'Bukti',      Icon: Camera },
  { key: 'report',    label: 'Report',     Icon: FileBarChart2 },
]

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="sidebar">
      {/* Logo / Brand */}
      <div className="sidebar-brand">
        {/* Logo container — taruh file logo di /public/logo.png */}
        <div className="sidebar-logo" style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.12)',
          flexShrink: 0,
        }}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
            onError={e => {
              // Jika logo.png belum ada, coba logo.svg
              if (!e.target.src.endsWith('.svg')) {
                e.target.src = '/logo.svg'
              } else {
                // Sembunyikan img, tampilkan placeholder kosong (tidak ada "M")
                e.target.style.display = 'none'
              }
            }}
          />
        </div>

        <div>
          <div className="sidebar-brand-name">TJD Monitor</div>
          <div className="sidebar-brand-sub">Cabang Tanjung Duren</div>
        </div>
      </div>

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`sidebar-nav-item ${active === key ? 'active' : ''}`}
            onClick={() => onChange(key)}
          >
            <Icon size={18} strokeWidth={active === key ? 2.5 : 1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-badge">Bank Mandiri</div>
        <div className="sidebar-footer-text">© 2025 · Merchant Acquisition</div>
      </div>
    </aside>
  )
}
