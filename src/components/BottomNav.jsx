import React from 'react'
import { LayoutDashboard, Store, Camera, FileBarChart2 } from 'lucide-react'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { key: 'merchants', label: 'Merchant',  Icon: Store },
  { key: 'evidence',  label: 'Bukti',     Icon: Camera },
  { key: 'report',    label: 'Report',    Icon: FileBarChart2 },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ key, label, Icon }) => (
        <button
          key={key}
          className={`nav-item ${active === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
        >
          <Icon size={22} strokeWidth={active === key ? 2.5 : 1.8} />
          {label}
        </button>
      ))}
    </nav>
  )
}
