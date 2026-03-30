import React, { useState, useMemo, useCallback } from 'react'
import {
  Search, X, CheckCircle2, Clock,
  ThumbsUp, XCircle, HelpCircle, RefreshCw,
  FileSpreadsheet,
} from 'lucide-react'
import { useMerchants } from '../hooks/useMerchants'
import Header from '../components/Header'
import MerchantCard from '../components/MerchantCard'
import FollowUpForm from '../components/FollowUpForm'
import MerchantDetail from './MerchantDetail'
import ExcelManager from '../components/ExcelManager'
import { ProgressBar } from '../components/ProgressBar'

const FILTER_CHIPS = [
  { key: 'semua',            label: 'Semua',          icon: null },
  { key: 'Belum',            label: 'Belum FU',       icon: <Clock size={11} /> },
  { key: 'Sudah',            label: 'Sudah FU',       icon: <CheckCircle2 size={11} /> },
  { key: 'berminat',         label: 'Berminat',       icon: <ThumbsUp size={11} /> },
  { key: 'Tidak Berminat',   label: 'Tidak Berminat', icon: <XCircle size={11} /> },
  { key: 'pikir-pikir dulu', label: 'Pikir-Pikir',   icon: <HelpCircle size={11} /> },
]

function FilterChips({ active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2,
      scrollbarWidth: 'none', msOverflowStyle: 'none',
    }}>
      {FILTER_CHIPS.map(chip => (
        <button
          key={chip.key}
          className={`chip ${active === chip.key ? 'active' : ''}`}
          onClick={() => onChange(chip.key)}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {chip.icon}{chip.label}
        </button>
      ))}
    </div>
  )
}

function MerchantListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="card" style={{ padding: 16 }}>
          <div className="skeleton" style={{ height: 11, width: '28%', marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 16, width: '72%', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="skeleton" style={{ height: 11, width: 60 }} />
            <div className="skeleton" style={{ height: 11, width: 80 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MerchantsPage() {
  const [search,      setSearch]      = useState('')
  const [activeChip,  setActiveChip]  = useState('semua')
  const [fuMerchant,  setFuMerchant]  = useState(null)
  const [showExcel,   setShowExcel]   = useState(false)   // excel manager
  const [detail,      setDetail]      = useState(null)

  const filters = useMemo(() => {
    const f = {}
    if (search.trim())          f.search    = search.trim()
    if (activeChip !== 'semua') {
      if (activeChip === 'Sudah' || activeChip === 'Belum')
        f.followup = activeChip
      else
        f.hasil_fu = activeChip
    }
    return f
  }, [search, activeChip])

  const { merchants, loading, error, refetch } = useMerchants(filters)

  const handleDetail = useCallback(m => setDetail(m), [])

  if (detail) {
    return (
      <MerchantDetail
        merchant={detail}
        onBack={() => { setDetail(null); refetch() }}
        onRefresh={refetch}
      />
    )
  }

  const sudah = merchants.filter(m => m.followup === 'Sudah').length

  return (
    <div className="page">
      <Header
        title="Daftar Merchant"
        subtitle={`${merchants.length} merchant`}
        right={
          <div style={{ display: 'flex', gap: 6 }}>
            {/* Excel export/import */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowExcel(true)}
              title="Export / Import Excel"
              style={{
                color: 'rgba(255,255,255,0.85)', padding: '6px 10px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <FileSpreadsheet size={15} />
            </button>

            <button onClick={refetch} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
              color: '#fff', width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <RefreshCw size={15} />
            </button>
          </div>
        }
      />

      {/* Search + Filter bar */}
      <div style={{
        padding: '10px 16px', background: '#fff',
        borderBottom: '1px solid var(--gray-200)',
        display: 'flex', flexDirection: 'column', gap: 8,
        position: 'sticky', top: 56, zIndex: 40,
      }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} color="var(--gray-400)"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 34, paddingRight: search ? 34 : 12 }}
            placeholder="Cari nama merchant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
              background: 'var(--gray-200)', border: 'none', borderRadius: '50%',
              width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <X size={10} color="var(--gray-600)" />
            </button>
          )}
        </div>
        <FilterChips active={activeChip} onChange={setActiveChip} />
      </div>

      {/* Progress bar */}
      {!loading && merchants.length > 0 && (
        <div style={{ padding: '8px 16px 0', background: '#fff', borderBottom: '1px solid var(--gray-100)' }}>
          <ProgressBar value={sudah} max={merchants.length} height={4}
            label={`${sudah}/${merchants.length} di-FU`} showPercent />
          <div style={{ height: 8 }} />
        </div>
      )}

      {/* List */}
      <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <MerchantListSkeleton />
        ) : error ? (
          <div style={{
            background: 'var(--status-tidak-bg)', borderRadius: 10,
            padding: 16, textAlign: 'center',
          }}>
            <p style={{ color: 'var(--status-tidak)', fontWeight: 600 }}>Gagal memuat data</p>
            <p style={{ color: 'var(--status-tidak)', fontSize: '0.875rem', marginTop: 4 }}>{error}</p>
            <button className="btn btn-danger btn-sm" onClick={refetch} style={{ marginTop: 10 }}>
              Coba Lagi
            </button>
          </div>
        ) : merchants.length === 0 ? (
          <div className="empty-state">
            <Search size={40} />
            <h3>Merchant tidak ditemukan</h3>
            <p>Coba ubah filter atau kata pencarian</p>
            <button className="btn btn-outline btn-sm"
              onClick={() => { setSearch(''); setActiveChip('semua') }}>
              Reset Filter
            </button>
          </div>
        ) : (
          merchants.map(m => (
            <MerchantCard key={m.id} merchant={m} onClick={handleDetail} />
          ))
        )}
      </div>

      {/* Modals */}
      {fuMerchant && (
        <FollowUpForm
          merchant={fuMerchant}
          onClose={() => setFuMerchant(null)}
          onSuccess={refetch}
        />
      )}

      {showExcel && (
        <ExcelManager
          onClose={() => setShowExcel(false)}
          onRefresh={refetch}
        />
      )}
    </div>
  )
}
