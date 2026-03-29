import React, { useState } from 'react'
import { ToastProvider } from './lib/toast'
import BottomNav from './components/BottomNav'
import Sidebar from './components/Sidebar'
import DashboardPage from './pages/DashboardPage'
import MerchantsPage from './pages/MerchantsPage'
import ReportPage from './pages/ReportPage'
import EvidencePage from './pages/EvidencePage'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />
      case 'merchants': return <MerchantsPage />
      case 'evidence':  return <EvidencePage />
      case 'report':    return <ReportPage />
      default:          return <DashboardPage />
    }
  }

  return (
    <ToastProvider>
      {/* Mobile layout (< 1024px): original + bottom nav */}
      <div className="layout-mobile">
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', minHeight: '100vh' }}>
          {renderPage()}
          <BottomNav active={activePage} onChange={setActivePage} />
        </div>
      </div>

      {/* Desktop layout (>= 1024px): sidebar + main */}
      <div className="layout-desktop">
        <Sidebar active={activePage} onChange={setActivePage} />
        <div className="desktop-main">
          {renderPage()}
        </div>
      </div>
    </ToastProvider>
  )
}
