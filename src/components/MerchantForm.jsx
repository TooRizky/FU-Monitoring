import React, { useState } from 'react'
import { X, Save, Store, User, MapPin, Tag, Trash2 } from 'lucide-react'
import { addMerchant, updateMerchant, deleteMerchant } from '../lib/supabase'
import { useToast } from '../lib/toast'

const TIGA_P_OPTIONS = ['Pebisnis', 'Retailer', 'F&B', 'Hotel', 'Transportasi', 'Jasa', 'Lainnya']

const EMPTY = {
  merchant_id: '',
  nama_merchant: '',
  pic: '',
  '3p': 'Pebisnis',
  alamat: '',
  edc_mandiri: false,
  edc_lain: '',
  potensi_nominal: '',
}

export default function MerchantForm({ merchant = null, onClose, onSuccess }) {
  const isEdit = Boolean(merchant)
  const toast  = useToast()
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [form, setForm] = useState(
    isEdit ? {
      merchant_id:     merchant.merchant_id     || '',
      nama_merchant:   merchant.nama_merchant   || '',
      pic:             merchant.pic && !merchant.pic.startsWith('Belum Tau') ? merchant.pic : '',
      '3p':            merchant['3p']           || 'Pebisnis',
      alamat:          merchant.alamat          || '',
      edc_mandiri:     merchant.edc_mandiri     || false,
      edc_lain:        merchant.edc_lain        || '',
      potensi_nominal: merchant.potensi_nominal || '',
    } : EMPTY
  )

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.nama_merchant.trim()) {
      toast('Nama merchant wajib diisi', 'error'); return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        potensi_nominal: form.potensi_nominal
          ? parseFloat(String(form.potensi_nominal).replace(/\D/g, ''))
          : null,
      }
      if (isEdit) {
        await updateMerchant(merchant.id, payload)
        toast('Merchant berhasil diperbarui ✅', 'success')
      } else {
        await addMerchant(payload)
        toast('Merchant berhasil ditambahkan ✅', 'success')
      }
      onSuccess?.()
      onClose()
    } catch (e) {
      toast('Gagal: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteMerchant(merchant.id)
      toast('Merchant dihapus', 'info')
      onSuccess?.()
      onClose()
    } catch (e) {
      toast('Gagal hapus: ' + e.message, 'error')
      setDeleting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{
          padding: '16px 16px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--gray-100)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--mandiri-navy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Store size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                {isEdit ? 'Edit Merchant' : 'Tambah Merchant'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', margin: 0 }}>
                {isEdit ? merchant.merchant_id : 'ID akan digenerate otomatis'}
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6, borderRadius: 8 }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 24 }}>

          {/* Merchant ID (hanya edit) */}
          {isEdit && (
            <div className="form-group">
              <label className="form-label">Merchant ID</label>
              <input
                className="form-input"
                value={form.merchant_id}
                onChange={e => set('merchant_id', e.target.value)}
                placeholder="TJD0001"
                style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--mandiri-blue)' }}
              />
            </div>
          )}

          {/* Nama Merchant */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Nama Merchant <span style={{ color: 'var(--status-tidak)' }}>*</span>
            </label>
            <input
              className="form-input"
              value={form.nama_merchant}
              onChange={e => set('nama_merchant', e.target.value)}
              placeholder="Nama lengkap merchant..."
              autoFocus
            />
          </div>

          {/* PIC */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={12} /> PIC / Kontak Merchant
            </label>
            <input
              className="form-input"
              value={form.pic}
              onChange={e => set('pic', e.target.value)}
              placeholder="Nama pemilik / kontak..."
            />
          </div>

          {/* Kategori 3P */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={12} /> Kategori 3P
            </label>
            <select
              className="form-select"
              value={form['3p']}
              onChange={e => set('3p', e.target.value)}
            >
              {TIGA_P_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Alamat */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={12} /> Alamat
            </label>
            <textarea
              className="form-input"
              value={form.alamat}
              onChange={e => set('alamat', e.target.value)}
              placeholder="Alamat lengkap merchant..."
              rows={2}
              style={{ resize: 'none' }}
            />
          </div>

          {/* EDC Mandiri */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', background: 'var(--gray-50)',
            borderRadius: 10, border: '1px solid var(--gray-200)',
          }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-800)' }}>EDC Mandiri</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Sudah pasang EDC Bank Mandiri?</p>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={form.edc_mandiri} onChange={e => set('edc_mandiri', e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>

          {/* Potensi Nominal */}
          <div className="form-group">
            <label className="form-label">Potensi Nominal (Rp)</label>
            <input
              className="form-input"
              type="number"
              value={form.potensi_nominal}
              onChange={e => set('potensi_nominal', e.target.value)}
              placeholder="Estimasi nilai transaksi..."
              min="0"
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <button
              className="btn btn-primary btn-full"
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '14px' }}
            >
              {saving ? (
                <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> Menyimpan...</>
              ) : (
                <><Save size={15} /> {isEdit ? 'Simpan Perubahan' : 'Tambah Merchant'}</>
              )}
            </button>

            {isEdit && !confirmDelete && (
              <button
                className="btn btn-ghost btn-full"
                onClick={() => setConfirmDelete(true)}
                style={{ color: 'var(--status-tidak)', padding: '12px' }}
              >
                <Trash2 size={14} /> Hapus Merchant
              </button>
            )}

            {isEdit && confirmDelete && (
              <div style={{
                background: 'var(--status-tidak-bg)',
                border: '1px solid #FCA5A5',
                borderRadius: 10, padding: 14,
              }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--status-tidak)', marginBottom: 10 }}>
                  ⚠️ Yakin hapus merchant ini? Semua riwayat FU dan foto akan ikut terhapus.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-danger"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{ flex: 1, padding: '11px' }}
                  >
                    {deleting
                      ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} /> Menghapus...</>
                      : <><Trash2 size={14} /> Ya, Hapus</>
                    }
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => setConfirmDelete(false)}
                    style={{ flex: 1, padding: '11px' }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
