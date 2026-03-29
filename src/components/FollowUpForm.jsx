import React, { useState } from 'react'
import {
  X, MapPin, Save, ExternalLink,
} from 'lucide-react'
import { addFollowUp } from '../lib/supabase'
import { useToast } from '../lib/toast'
import {
  HASIL_FU_OPTIONS, EDC_LAIN_OPTIONS,
  buildMapsUrl, formatDateTime, formatCurrency,
} from '../lib/utils'

export default function FollowUpForm({ merchant, onClose, onSuccess }) {
  const toast = useToast()

  const [form, setForm] = useState({
    hasil_fu:  merchant.hasil_fu && merchant.hasil_fu !== '-' ? merchant.hasil_fu : '',
    nominal:   merchant.potensi_nominal || '',
    edc_mandiri: merchant.edc_mandiri || false,
    edc_lain:  merchant.edc_lain || '',
    pic:       merchant.pic && !merchant.pic.startsWith('Belum Tau') ? merchant.pic : '',
    catatan:   '',
    alamat:    merchant.alamat || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.hasil_fu) {
      toast('Pilih hasil FU terlebih dahulu', 'error'); return
    }
    setSaving(true)
    try {
      await addFollowUp({
        merchant_id:  merchant.id,
        hasil_fu:     form.hasil_fu,
        nominal:      form.nominal ? parseFloat(String(form.nominal).replace(/\D/g, '')) : null,
        edc_mandiri:  form.edc_mandiri,
        edc_lain:     form.edc_lain   || null,
        pic:          form.pic        || null,
        catatan:      form.catatan    || null,
        alamat:       form.alamat     || null,
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
    { value: 'berminat',           label: '✅  Berminat',        active: 'var(--status-berminat)',    bg: 'var(--status-berminat-bg)' },
    { value: 'pikir-pikir dulu',   label: '🤔  Pikir-Pikir',     active: 'var(--status-pikir)',       bg: 'var(--status-pikir-bg)' },
    { value: 'Tidak Berminat',     label: '❌  Tidak Berminat',  active: 'var(--status-tidak)',       bg: 'var(--status-tidak-bg)' },
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
            <p style={{ fontSize: '0.6875rem', color: 'var(--mandiri-blue)', fontWeight: 600, marginBottom: 2 }}>
              {merchant.merchant_id} · {merchant['3p'] || 'Pebisnis'}
            </p>
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

          {/* Alamat + Google Maps */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }} className="form-group">
              <label className="form-label">Alamat</label>
              <input
                className="form-input"
                value={form.alamat}
                onChange={e => set('alamat', e.target.value)}
                placeholder="Alamat merchant..."
              />
            </div>
            <a
              href={buildMapsUrl(form.alamat, merchant.nama_merchant)}
              target="_blank" rel="noopener noreferrer"
              style={{
                alignSelf: 'flex-end',
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '11px 12px',
                background: '#EFF6FF', color: '#1D4ED8',
                borderRadius: 8, fontWeight: 600, fontSize: '0.8125rem',
                textDecoration: 'none', flexShrink: 0,
                border: '1px solid #BFDBFE',
              }}
            >
              <MapPin size={14} />
              <ExternalLink size={12} />
            </a>
          </div>

          {/* PIC */}
          <div className="form-group">
            <label className="form-label">PIC Merchant</label>
            <input
              className="form-input"
              value={form.pic}
              onChange={e => set('pic', e.target.value)}
              placeholder="Nama kontak / pemilik..."
            />
          </div>

          {/* EDC */}
          <div style={{
            background: 'var(--gray-50)', borderRadius: 10, padding: 12,
            border: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', gap: 10,
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
            <div className="form-group">
              <label className="form-label">EDC Bank Lain</label>
              <select className="form-select" value={form.edc_lain} onChange={e => set('edc_lain', e.target.value)}>
                <option value="">— Pilih EDC lain —</option>
                {EDC_LAIN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Hasil FU — button group */}
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

          {/* Nominal — tampil jika berminat/pikir */}
          {(form.hasil_fu === 'berminat' || form.hasil_fu === 'pikir-pikir dulu') && (
            <div className="form-group" style={{ animation: 'fadeIn 0.2s ease' }}>
              <label className="form-label">Potensi Nominal (Rp)</label>
              <input
                className="form-input"
                type="number"
                value={form.nominal}
                onChange={e => set('nominal', e.target.value)}
                placeholder="cth: 5000000"
                min="0"
              />
              {form.nominal && (
                <p style={{ fontSize: '0.75rem', color: 'var(--mandiri-blue)', fontWeight: 600 }}>
                  = {formatCurrency(parseFloat(form.nominal))}
                </p>
              )}
            </div>
          )}

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
