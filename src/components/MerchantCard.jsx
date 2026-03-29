import React from 'react'
import { MapPin, Phone, Clock, ChevronRight, AlertCircle } from 'lucide-react'
import { formatDate, getHasilBadgeClass, getHasilLabel, daysSinceLastFU } from '../lib/utils'

export default function MerchantCard({ merchant, onClick }) {
  const days = daysSinceLastFU(merchant.tanggal_fu_terakhir)
  const needsRevisit = merchant.hasil_fu === 'pikir-pikir dulu' && days !== null && days >= 7

  return (
    <div
      className="card"
      onClick={() => onClick(merchant)}
      style={{
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'transform 0.12s, box-shadow 0.12s',
        borderLeft: needsRevisit ? '3px solid var(--mandiri-yellow)' : '3px solid transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
      onTouchStart={e => e.currentTarget.style.background = 'var(--gray-50)'}
      onTouchEnd={e => e.currentTarget.style.background = '#fff'}
    >
      {/* Merchant ID + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '0.6875rem', color: 'var(--mandiri-blue)', fontWeight: 600, marginBottom: 2 }}>
            {merchant.merchant_id}
          </p>
          <h3 style={{
            fontSize: '0.9375rem', fontWeight: 700, color: 'var(--gray-900)',
            lineHeight: 1.3, margin: 0,
          }}>
            {merchant.nama_merchant}
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span className={`badge ${getHasilBadgeClass(merchant.hasil_fu)}`}>
            {getHasilLabel(merchant.hasil_fu)}
          </span>
          {needsRevisit && (
            <span style={{
              fontSize: '0.6875rem', color: 'var(--mandiri-yellow-dark)',
              display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600,
            }}>
              <AlertCircle size={11} /> {days}h lalu
            </span>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: merchant.followup === 'Sudah' ? 'var(--status-berminat)' : 'var(--gray-300)',
          }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
            {merchant.followup === 'Sudah' ? `${merchant.jumlah_fu}x FU` : 'Belum di-FU'}
          </span>
        </div>

        {merchant.pic && merchant.pic !== 'Belum Tau' && !merchant.pic.startsWith('Belum Tau') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Phone size={11} color="var(--gray-400)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
              {merchant.pic}
            </span>
          </div>
        )}

        {merchant.tanggal_fu_terakhir && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} color="var(--gray-400)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
              {formatDate(merchant.tanggal_fu_terakhir)}
            </span>
          </div>
        )}

        {merchant.edc_mandiri && (
          <span style={{
            fontSize: '0.6875rem', background: '#DBEAFE', color: '#1D4ED8',
            padding: '2px 6px', borderRadius: 4, fontWeight: 600,
          }}>
            EDC ✓
          </span>
        )}
      </div>

      {/* 3P badge */}
      <div style={{ position: 'absolute', top: 12, right: 36 }}>
        <span style={{
          fontSize: '0.625rem', background: 'var(--mandiri-yellow-light)',
          color: 'var(--mandiri-yellow-dark)', padding: '1px 6px', borderRadius: 4,
          fontWeight: 700, letterSpacing: '0.02em',
        }}>
          {merchant['3p'] || 'Pebisnis'}
        </span>
      </div>

      <ChevronRight
        size={16}
        color="var(--gray-400)"
        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}
      />
    </div>
  )
}
