import React, { useState, useEffect } from 'react'
import {
  Calendar, ClipboardList, Image,
  Plus, Clock, CheckCircle2, AlertTriangle,
  Trash2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { getFollowUpHistory, deleteFollowUp } from '../lib/supabase'
import Header from '../components/Header'
import FollowUpForm from '../components/FollowUpForm'
import EvidenceSection from '../components/EvidenceSection'
import { useToast } from '../lib/toast'
import {
  formatDateTime, formatCurrency,
  getHasilBadgeClass, getHasilLabel,
} from '../lib/utils'

function Section({ title, icon: Icon, children, action, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 16px',
          borderBottom: open ? '1px solid var(--gray-100)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--gray-50)', cursor: 'pointer', border: 'none', borderRadius: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {Icon && <Icon size={15} color="var(--mandiri-navy)" />}
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gray-800)', margin: 0 }}>
            {title}
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {action && <div onClick={e => e.stopPropagation()}>{action}</div>}
          {open ? <ChevronUp size={14} color="var(--gray-400)" /> : <ChevronDown size={14} color="var(--gray-400)" />}
        </div>
      </button>
      {open && <div style={{ padding: 16 }}>{children}</div>}
    </div>
  )
}

function InfoRow({ label, value, mono, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: 12, padding: '8px 0', borderBottom: '1px solid var(--gray-100)',
    }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', flexShrink: 0, minWidth: 100 }}>
        {label}
      </span>
      <span style={{
        fontSize: '0.8125rem', fontWeight: highlight ? 700 : 600,
        color: highlight ? 'var(--mandiri-navy)' : 'var(--gray-800)',
        textAlign: 'right', fontFamily: mono ? 'monospace' : undefined,
      }}>
        {value || '—'}
      </span>
    </div>
  )
}

function HistoryItem({ item, isLast, onDelete }) {
  const toast = useToast()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Hapus riwayat FU ini?')) return
    setDeleting(true)
    try {
      await deleteFollowUp(item.id)
      onDelete(item.id)
      toast('Riwayat dihapus', 'info')
    } catch (e) {
      toast('Gagal hapus: ' + e.message, 'error')
      setDeleting(false)
    }
  }

  const color = item.hasil_fu === 'berminat' ? 'var(--status-berminat)'
    : item.hasil_fu === 'Tidak Berminat' ? 'var(--status-tidak)'
    : 'var(--status-pikir)'

  return (
    <div style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 16, position: 'relative' }}>
      {!isLast && (
        <div style={{
          position: 'absolute', left: 11, top: 24, bottom: 0,
          width: 2, background: 'var(--gray-200)',
        }} />
      )}
      <div style={{
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        background: `${color}18`,
        border: `2px solid ${color}`, zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {item.hasil_fu === 'berminat'
          ? <CheckCircle2 size={12} color={color} />
          : item.hasil_fu === 'Tidak Berminat'
          ? <AlertTriangle size={12} color={color} />
          : <Clock size={12} color={color} />
        }
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
          <span className={`badge ${getHasilBadgeClass(item.hasil_fu)}`}>
            {getHasilLabel(item.hasil_fu)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--gray-400)' }}>
              {formatDateTime(item.created_at)}
            </span>
            <button
              onClick={handleDelete} disabled={deleting}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 2 }}
            >
              {deleting
                ? <span className="spinner" style={{ width: 10, height: 10 }} />
                : <Trash2 size={11} />
              }
            </button>
          </div>
        </div>
        {item.catatan && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--gray-600)', marginTop: 4, lineHeight: 1.4 }}>
            {item.catatan}
          </p>
        )}
        {item.nominal && (
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--mandiri-blue)', marginTop: 3 }}>
            💰 {formatCurrency(item.nominal)}
          </p>
        )}
        <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
          {item.edc_mandiri && (
            <span style={{ fontSize: '0.6875rem', background: '#DBEAFE', color: '#1D4ED8', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>
              EDC Mandiri ✓
            </span>
          )}
          {item.edc_lain && (
            <span style={{ fontSize: '0.6875rem', background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '2px 7px', borderRadius: 4 }}>
              {item.edc_lain}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MerchantDetail({ merchant: init, onBack, onRefresh }) {
  const toast                       = useToast()
  const [merchant,  setMerchant]    = useState(init)
  const [history,   setHistory]     = useState([])
  const [loadingH,  setLoadingH]    = useState(true)
  const [showFU,    setShowFU]      = useState(false)

  const loadHistory = async () => {
    setLoadingH(true)
    try   { setHistory(await getFollowUpHistory(merchant.id)) }
    catch (e) { toast('Gagal memuat riwayat: ' + e.message, 'error') }
    finally   { setLoadingH(false) }
  }

  useEffect(() => { loadHistory() }, [merchant.id])

  return (
    <div className="page">
      <Header
        title={merchant.merchant_id}
        subtitle={merchant.nama_merchant}
        backBtn={onBack}
        right={
          <button
            className="btn btn-yellow btn-sm"
            onClick={() => setShowFU(true)}
            style={{ gap: 5, padding: '7px 14px' }}
          >
            <Plus size={14} /> FU
          </button>
        }
      />

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Hero status */}
        <div style={{
          borderRadius: 12, padding: 16,
          background: merchant.followup === 'Sudah'
            ? 'linear-gradient(135deg, #DCFCE7, #BBF7D0)'
            : 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
          border: `1px solid ${merchant.followup === 'Sudah' ? '#86EFAC' : 'var(--gray-300)'}`,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: merchant.followup === 'Sudah' ? 'var(--status-berminat)' : 'var(--gray-400)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {merchant.followup === 'Sudah'
              ? <CheckCircle2 size={26} color="#fff" />
              : <Clock size={26} color="#fff" />
            }
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: 2 }}>Status Follow-Up</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--gray-900)' }}>
              {merchant.followup === 'Sudah' ? `${merchant.jumlah_fu}× Follow-Up` : 'Belum di-FU'}
            </p>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <span className={`badge ${getHasilBadgeClass(merchant.hasil_fu)}`}>
                {getHasilLabel(merchant.hasil_fu)}
              </span>
              {merchant.edc_mandiri && (
                <span style={{ fontSize: '0.6875rem', background: '#DBEAFE', color: '#1D4ED8', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                  EDC Mandiri ✓
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info Merchant (read-only) */}
        <Section title="Informasi Merchant" icon={ClipboardList}>
          <InfoRow label="Merchant ID"     value={merchant.merchant_id} mono />
          <InfoRow label="Kategori 3P"     value={merchant['3p']} />
          <InfoRow label="PIC"             value={merchant.pic && !merchant.pic.startsWith('Belum Tau') ? merchant.pic : '—'} />
          <InfoRow label="EDC Mandiri"     value={merchant.edc_mandiri ? '✅  Ya' : '❌  Belum'} />
          <InfoRow label="EDC Lain"        value={merchant.edc_lain || '—'} />
          <InfoRow label="Potensi Nominal" value={merchant.potensi_nominal ? formatCurrency(merchant.potensi_nominal) : '—'} highlight />
          <InfoRow label="FU Terakhir"     value={formatDateTime(merchant.tanggal_fu_terakhir)} />
        </Section>

        {/* Riwayat FU */}
        <Section
          title={`Riwayat Follow-Up (${history.length})`}
          icon={Calendar}
          action={
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowFU(true)}
              style={{ color: 'var(--mandiri-blue)', fontSize: '0.75rem', padding: '4px 8px' }}
            >
              + Tambah
            </button>
          }
        >
          {loadingH ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2].map(i => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <div className="skeleton" style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 13, width: '40%', marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 11, width: '70%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state" style={{ padding: '16px 0' }}>
              <Calendar size={28} />
              <p>Belum ada riwayat FU</p>
              <button className="btn btn-outline btn-sm" onClick={() => setShowFU(true)} style={{ marginTop: 4 }}>
                Mulai Follow-Up
              </button>
            </div>
          ) : (
            history.map((item, i) => (
              <HistoryItem
                key={item.id} item={item}
                isLast={i === history.length - 1}
                onDelete={id => setHistory(p => p.filter(h => h.id !== id))}
              />
            ))
          )}
        </Section>

        {/* Bukti Kunjungan */}
        <Section title="Bukti Kunjungan" icon={Image}>
          <EvidenceSection merchantId={merchant.id} />
        </Section>

      </div>

      {showFU && (
        <FollowUpForm
          merchant={merchant}
          onClose={() => setShowFU(false)}
          onSuccess={() => {
            loadHistory()
            onRefresh?.()
            // update local merchant state with fresh data
          }}
        />
      )}
    </div>
  )
}
