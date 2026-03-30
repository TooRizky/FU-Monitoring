import React, { useState } from 'react'
import { X, Save } from 'lucide-react'
import { addFollowUp } from '../lib/supabase'
import { useToast } from '../lib/toast'
import { formatDateTime, formatCurrency } from '../lib/utils'

const EDC_LAIN_OPTIONS = [
  'BCA', 'BRI', 'BNI', 'CIMB', 'Danamon',
  'GoPay', 'OVO', 'DANA', 'ShopeePay', 'Lainnya',
]

function parseEdcLain(val) {
  if (!val || val === '') return []
  if (Array.isArray(val)) return val
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

// Chip read-only untuk info merchant
function InfoChip({ label, value }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--gray-50)', borderRadius: 8,
      padding: '6px 10px', flex: 1,
      border: '1px solid var(--gray-200)',
    }}>
      <span style={{ fontSize: '0.625rem', color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--gray-800)', marginTop: 1 }}>
        {value}
      </span>
    </div>
  )
}

export default function FollowUpForm({ merchant, onClose, onSuccess }) {
  const toast = useToast()

  const [form, setForm] = useState({
    hasil_fu:    merchant.hasil_fu && merchant.hasil_fu !== '-' ? merchant.hasil_fu : '',
    nominal:     merchant.potensi_nominal || '',
    edc_mandiri: merchant.edc_mandiri || false,
    edc_lain:    parseEdcLain(merchant.edc_lain),
    catatan:     '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const toggleEdcLain = (val) => {
    set('edc_lain', form.edc_lain.includes(val)
      ? form.edc_lain.filter(x => x !== val)
      : [...form.edc_lain, val]
    )
  }

  const handleSave = async () => {
    if (!form.hasil_fu) { toast('Pilih hasil FU terlebih dahulu', 'error'); return }
    setSaving(true)
    try {
      await addFollowUp({
        merchant_id:  merchant.id,
        hasil_fu:     form.hasil_fu,
        nominal:      form.nominal ? parseFloat(String(form.nominal).replace(/\D/g, '')) : null,
        edc_mandiri:  form.edc_mandiri,
        edc_lain:     form.edc_lain.length > 0 ? form.edc_lain.join(', ') : null,
        catatan:      form.catatan || null,
        created_by:   'user',
      })
      toast('Follow-up berhasil disimpan ✅', 'success')
      onSuccess?.()
      onClose()
    } catch (e) {
      toast('Gagal menyimpan: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const HASIL_BUTTONS = [
    { value: 'berminat',         label: '✅  Berminat',       active: 'var(--status-berminat)',  bg: 'var(--status-berminat-bg)' },
    { value: 'pikir-pikir dulu', label: '🤔  Pikir-Pikir',    active: 'var(--status-pikir)',     bg: 'var(--status-pikir-bg)' },
    { value: 'Tidak Berminat',   label: '❌  Tidak Berminat', active: 'var(--status-tidak)',     bg: 'var(--status-tidak-bg)' },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{
          padding: '14px 16px 12px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          borderBottom: '1px solid var(--gray-100)',
        }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1.3, margin: 0 }}>
              {merchant.nama_merchant}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 2 }}>
              {merchant.jumlah_fu > 0
                ? `FU ke-${merchant.jumlah_fu + 1} · Terakhir: ${formatDateTime(merchant.tanggal_fu_terakhir)}`
                : 'Follow-up pertama'
              }
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6, borderRadius: 8 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 24 }}>

          {/* Info chips read-only: Merchant ID + Kategori 3P */}
          <div style={{ display: 'flex', gap: 8 }}>
            <InfoChip label="Merchant ID" value={merchant.merchant_id} />
            <InfoChip label="Kategori 3P" value={merchant['3p'] || 'Pebisnis'} />
            <InfoChip label="PIC" value={merchant.pic && !merchant.pic.startsWith('Belum Tau') ? merchant.pic : '—'} />
          </div>

          {/* Hasil FU */}
          <div className="form-group">
            <label className="form-label">
              Hasil Follow-Up <span style={{ color: 'var(--status-tidak)' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HASIL_BUTTONS.map(btn => {
                const isActive = form.hasil_fu === btn.value
                return (
                  <button
                    key={btn.value}
                    type="button"
                    onClick={() => set('hasil_fu', btn.value)}
                    style={{
                      padding: '12px 16px', borderRadius: 10,
                      border: `2px solid ${isActive ? btn.active : 'var(--gray-200)'}`,
                      background: isActive ? btn.bg : '#fff',
                      color: isActive ? btn.active : 'var(--gray-600)',
                      fontWeight: 600, fontSize: '0.9375rem',
                      cursor: 'pointer', transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                  >
                    {btn.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Potensi Nominal — selalu tampil */}
          <div className="form-group">
            <label className="form-label">Potensi Nominal (Rp)</label>
            <input
              className="form-input"
              type="number"
              value={form.nominal}
              onChange={e => set('nominal', e.target.value)}
              placeholder="cth: 5000000"
              min="0"
            />
            {form.nominal ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--mandiri-blue)', fontWeight: 600, marginTop: 3 }}>
                = {formatCurrency(parseFloat(form.nominal))}
              </p>
            ) : null}
          </div>

          {/* EDC Section */}
          <div style={{
            background: 'var(--gray-50)', borderRadius: 10, padding: 12,
            border: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--gray-700)' }}>Status EDC</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-800)' }}>EDC Mandiri</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Sudah punya EDC Mandiri?</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={form.edc_mandiri} onChange={e => set('edc_mandiri', e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* EDC Lain — multiple choice chips */}
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: 8 }}>
                EDC / E-Wallet Lain
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EDC_LAIN_OPTIONS.map(opt => {
                  const checked = form.edc_lain.includes(opt)
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleEdcLain(opt)}
                      style={{
                        padding: '6px 12px', borderRadius: 20,
                        border: `1.5px solid ${checked ? 'var(--mandiri-blue)' : 'var(--gray-300)'}`,
                        background: checked ? 'var(--mandiri-blue)' : '#fff',
                        color: checked ? '#fff' : 'var(--gray-600)',
                        fontSize: '0.8125rem', fontWeight: checked ? 600 : 400,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {checked ? '✓ ' : ''}{opt}
                    </button>
                  )
                })}
              </div>
              {form.edc_lain.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--mandiri-blue)', marginTop: 6, fontWeight: 500 }}>
                  Dipilih: {form.edc_lain.join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Catatan */}
          <div className="form-group">
            <label className="form-label">Catatan</label>
            <textarea
              className="form-input"
              value={form.catatan}
              onChange={e => set('catatan', e.target.value)}
              placeholder="Catatan tambahan hasil kunjungan..."
              rows={2}
              style={{ resize: 'none' }}
            />
          </div>

          {/* Save */}
          <button
            className="btn btn-primary btn-full"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '14px', marginTop: 4 }}
          >
            {saving ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> Menyimpan...</>
            ) : (
              <><Save size={16} /> Simpan Follow-Up</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
