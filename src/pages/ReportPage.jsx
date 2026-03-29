import React, { useState } from 'react'
import {
  FileText, Download, TrendingUp, Award,
  AlertCircle, CheckSquare, RefreshCw, Filter,
} from 'lucide-react'
import { useMerchants } from '../hooks/useMerchants'
import { useDashboard } from '../hooks/useMerchants'
import Header from '../components/Header'
import { ProgressBar } from '../components/ProgressBar'
import { formatCurrency, formatDate, getHasilBadgeClass, getHasilLabel } from '../lib/utils'

function ReportTable({ merchants }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: 8 }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontSize: '0.75rem',
      }}>
        <thead>
          <tr style={{ background: 'var(--mandiri-navy)' }}>
            {['ID', 'Merchant', 'PIC', 'FU', 'Hasil', 'Nominal'].map(h => (
              <th key={h} style={{
                padding: '8px 10px', color: '#fff', textAlign: 'left',
                fontWeight: 600, whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {merchants.map((m, i) => (
            <tr
              key={m.id}
              style={{ background: i % 2 === 0 ? '#fff' : 'var(--gray-50)' }}
            >
              <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: 'var(--mandiri-blue)', fontWeight: 600 }}>
                {m.merchant_id}
              </td>
              <td style={{ padding: '7px 10px', maxWidth: 160 }}>
                <div style={{
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  color: 'var(--gray-800)', fontWeight: 500,
                }}>
                  {m.nama_merchant}
                </div>
              </td>
              <td style={{ padding: '7px 10px', color: 'var(--gray-600)' }}>
                {m.pic && !m.pic.startsWith('Belum Tau') ? m.pic : '—'}
              </td>
              <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                <span style={{
                  display: 'inline-block', fontWeight: 700,
                  color: m.followup === 'Sudah' ? 'var(--status-berminat)' : 'var(--gray-400)',
                }}>
                  {m.jumlah_fu || 0}x
                </span>
              </td>
              <td style={{ padding: '7px 10px' }}>
                <span className={`badge ${getHasilBadgeClass(m.hasil_fu)}`} style={{ fontSize: '0.6875rem' }}>
                  {getHasilLabel(m.hasil_fu)}
                </span>
              </td>
              <td style={{ padding: '7px 10px', fontWeight: 600, color: 'var(--mandiri-navy)' }}>
                {m.potensi_nominal ? formatCurrency(m.potensi_nominal) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ReportPage() {
  const { merchants, loading, refetch } = useMerchants()
  const { stats } = useDashboard()
  const [filter, setFilter] = useState('semua')

  const filtered = merchants.filter(m => {
    if (filter === 'berminat') return m.hasil_fu === 'berminat'
    if (filter === 'belum') return m.followup === 'Belum'
    if (filter === 'pikir') return m.hasil_fu === 'pikir-pikir dulu'
    if (filter === 'edc') return m.edc_mandiri
    return true
  })

  // Top performers (most FU)
  const topFU = [...merchants]
    .filter(m => m.jumlah_fu > 0)
    .sort((a, b) => b.jumlah_fu - a.jumlah_fu)
    .slice(0, 3)

  const handleExportCSV = () => {
    const header = ['MerchantID', 'Nama Merchant', 'PIC', '3P', 'Followup', 'Jumlah FU',
      'Tgl FU Terakhir', 'Hasil FU', 'Alamat', 'Potensi Nominal', 'EDC Mandiri', 'EDC Lain']
    const rows = filtered.map(m => [
      m.merchant_id, `"${m.nama_merchant}"`,
      m.pic || '', m['3p'] || '',
      m.followup, m.jumlah_fu || 0,
      m.tanggal_fu_terakhir ? formatDate(m.tanggal_fu_terakhir) : '',
      m.hasil_fu || '',
      m.alamat || '',
      m.potensi_nominal || '',
      m.edc_mandiri ? 'Ya' : 'Tidak',
      m.edc_lain || '',
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `TJD_Merchant_FU_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <Header
        title="Report & Closing"
        subtitle={`${filtered.length} dari ${merchants.length} merchant`}
        right={
          <button onClick={refetch} className="btn btn-ghost btn-sm" style={{ color: '#fff', padding: 8 }}>
            <RefreshCw size={16} />
          </button>
        }
      />

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Summary Closing Card */}
        <div style={{
          borderRadius: 12,
          background: 'linear-gradient(135deg, var(--mandiri-navy), var(--mandiri-blue-light))',
          padding: 16, color: '#fff',
          boxShadow: '0 6px 20px rgba(0,63,136,0.2)',
        }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
            Summary Closing Report
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Total', val: stats?.total ?? '—', color: '#fff' },
              { label: 'Selesai', val: stats?.sudah ?? '—', color: '#4ADE80' },
              { label: 'Berminat', val: stats?.berminat ?? '—', color: '#FCD34D' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 4px' }}>
                <p style={{ fontSize: '1.375rem', fontWeight: 800, color: item.color }}>{item.val}</p>
                <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)' }}>{item.label}</p>
              </div>
            ))}
          </div>
          <ProgressBar
            value={stats?.sudah || 0}
            max={stats?.total || 1}
            height={6}
            color="linear-gradient(90deg, #F5A623, #FFD166)"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)' }}>
              {stats?.progressPercent ?? 0}% progress
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)' }}>
              {stats?.conversionPercent ?? 0}% konversi
            </span>
          </div>
        </div>

        {/* Top FU Merchants */}
        {topFU.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{
              padding: '10px 14px', background: 'var(--gray-50)',
              borderBottom: '1px solid var(--gray-100)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Award size={14} color="var(--mandiri-yellow-dark)" />
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gray-800)' }}>
                Paling Banyak Di-FU
              </h3>
            </div>
            <div style={{ padding: '8px 14px' }}>
              {topFU.map((m, i) => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0',
                  borderBottom: i < topFU.length - 1 ? '1px solid var(--gray-100)' : 'none',
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: i === 0 ? 'var(--mandiri-yellow)' : 'var(--gray-200)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6875rem', fontWeight: 800,
                    color: i === 0 ? 'var(--mandiri-navy)' : 'var(--gray-600)',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-800)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {m.nama_merchant}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <span style={{
                      fontSize: '0.875rem', fontWeight: 800, color: 'var(--mandiri-blue)',
                    }}>
                      {m.jumlah_fu}x
                    </span>
                    <span className={`badge ${getHasilBadgeClass(m.hasil_fu)}`} style={{
                      display: 'block', marginTop: 2, fontSize: '0.6rem',
                    }}>
                      {getHasilLabel(m.hasil_fu)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter + Export */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flex: 1, overflowX: 'auto' }}>
            {[
              { k: 'semua', l: 'Semua' },
              { k: 'berminat', l: '✅ Berminat' },
              { k: 'pikir', l: '🤔 Pikir-Pikir' },
              { k: 'belum', l: '⏳ Belum FU' },
              { k: 'edc', l: '💳 EDC' },
            ].map(f => (
              <button
                key={f.k}
                className={`chip ${filter === f.k ? 'active' : ''}`}
                onClick={() => setFilter(f.k)}
              >
                {f.l}
              </button>
            ))}
          </div>
          <button
            className="btn btn-yellow btn-sm"
            onClick={handleExportCSV}
            style={{ flexShrink: 0 }}
          >
            <Download size={14} /> CSV
          </button>
        </div>

        {/* Data Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '10px 14px',
            background: 'var(--gray-50)',
            borderBottom: '1px solid var(--gray-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={14} color="var(--mandiri-navy)" />
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gray-800)' }}>
                Detail Merchant
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
              {filtered.length} data
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <span className="spinner" />
            </div>
          ) : (
            <ReportTable merchants={filtered} />
          )}
        </div>

      </div>
    </div>
  )
}
