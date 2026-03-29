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
        <div className="sidebar-logo">
          <img
            src="/mandiri-logo.png"
            alt="Bank Mandiri"
            style={{ width: 32, height: 32, objectFit: 'contain' }}
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div className="sidebar-logo-fallback" style={{ display: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="4" fill="#F5A623"/>
              <text x="12" y="17" textAnchor="middle" fill="#003F88"
                fontSize="13" fontWeight="800" fontFamily="Arial, sans-serif">M</text>
            </svg>
          </div>
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
