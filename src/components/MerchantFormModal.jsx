import React, { useState } from 'react'
import { X, Save, Trash2, AlertTriangle } from 'lucide-react'
import { createMerchant, updateMerchant, deleteMerchant } from '../lib/supabase'
import { useToast } from '../lib/toast'

const EDC_LAIN_OPTIONS = [
  'BCA', 'BRI', 'BNI', 'CIMB', 'Danamon',
  'GoPay', 'OVO', 'DANA', 'ShopeePay', 'Tidak Ada', 'Lainnya',
]

const KATEGORI_OPTIONS = ['Pebisnis', 'Retail', 'F&B', 'Hotel', 'Jasa', 'Lainnya']

export default function MerchantFormModal({ merchant, onClose, onSuccess }) {
  const toast = useToast()
  const isEdit = !!merchant
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const [form, setForm] = useState({
    merchant_id:   merchant?.merchant_id  || '',
    nama_merchant: merchant?.nama_merchant || '',
    pic:           merchant?.pic && !merchant.pic.startsWith('Belum Tau') ? merchant.pic : '',
    '3p':          merchant?.['3p']       || 'Pebisnis',
    alamat:        merchant?.alamat       || '',
    edc_mandiri:   merchant?.edc_mandiri  ?? false,
    edc_lain:      merchant?.edc_lain     || '',
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.merchant_id.trim())   { toast('Merchant ID wajib diisi', 'error'); return }
    if (!form.nama_merchant.trim()) { toast('Nama merchant wajib diisi', 'error'); return }

    setSaving(true)
    try {
      if (isEdit) {
        await updateMerchant(merchant.id, {
          nama_merchant: form.nama_merchant.trim(),
          pic:           form.pic.trim()     || null,
          '3p':          form['3p']          || 'Pebisnis',
          alamat:        form.alamat.trim()  || null,
          edc_mandiri:   form.edc_mandiri,
          edc_lain:      form.edc_lain       || null,
        })
        toast('Data merchant diperbarui ✅', 'success')
      } else {
        await createMerchant({
          merchant_id:   form.merchant_id.trim().toUpperCase(),
          nama_merchant: form.nama_merchant.trim(),
          pic:           form.pic.trim()     || null,
          '3p':          form['3p']          || 'Pebisnis',
          alamat:        form.alamat.trim()  || null,
        })
        toast('Merchant baru ditambahkan ✅', 'success')
      }
      onSuccess?.()
      onClose()
    } catch (e) {
      toast('Gagal menyimpan: ' + e.message, 'error')
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
          padding: '14px 16px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--gray-100)',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
            {isEdit ? '✏️ Edit Merchant' : '➕ Tambah Merchant Baru'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--gray-400)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Merchant ID — read-only jika edit */}
          <div className="form-group">
            <label className="form-label">
              Merchant ID {!isEdit && <span style={{ color: 'var(--status-tidak)' }}>*</span>}
            </label>
            <input
              className="form-input"
              value={form.merchant_id}
              onChange={e => set('merchant_id', e.target.value)}
              disabled={isEdit}
              placeholder="Contoh: TJD0112"
              style={{ fontFamily: 'monospace', textTransform: 'uppercase',
                background: isEdit ? 'var(--gray-100)' : '#fff',
                color: isEdit ? 'var(--gray-500)' : undefined }}
            />
            {isEdit && (
              <p style={{ fontSize: '0.6875rem', color: 'var(--gray-400)', marginTop: 2 }}>
                Merchant ID tidak bisa diubah
              </p>
            )}
          </div>

          {/* Nama Merchant */}
          <div className="form-group">
            <label className="form-label">
              Nama Merchant <span style={{ color: 'var(--status-tidak)' }}>*</span>
            </label>
            <input
              className="form-input"
              value={form.nama_merchant}
              onChange={e => set('nama_merchant', e.target.value)}
              placeholder="Nama lengkap merchant..."
            />
          </div>

          {/* PIC */}
          <div className="form-group">
            <label className="form-label">PIC / Kontak Merchant</label>
            <input
              className="form-input"
              value={form.pic}
              onChange={e => set('pic', e.target.value)}
              placeholder="Nama pemilik / kontak..."
            />
          </div>

          {/* Kategori 3P */}
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <select className="form-select" value={form['3p']} onChange={e => set('3p', e.target.value)}>
              {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          {/* Alamat */}
          <div className="form-group">
            <label className="form-label">Alamat</label>
            <textarea
              className="form-input"
              rows={2}
              style={{ resize: 'none' }}
              value={form.alamat}
              onChange={e => set('alamat', e.target.value)}
              placeholder="Alamat lengkap merchant..."
            />
          </div>

          {/* EDC */}
          <div style={{
            background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
            borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--gray-700)' }}>Status EDC</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>EDC Bank Mandiri</p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--gray-400)' }}>Sudah terpasang?</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={form.edc_mandiri}
                  onChange={e => set('edc_mandiri', e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">EDC / E-Wallet Lain</label>
              <select className="form-select" value={form.edc_lain} onChange={e => set('edc_lain', e.target.value)}>
                <option value="">— Tidak ada —</option>
                {EDC_LAIN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Save */}
          <button className="btn btn-primary btn-full" onClick={handleSave}
            disabled={saving} style={{ padding: 13 }}>
            {saving
              ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> Menyimpan...</>
              : <><Save size={15} /> {isEdit ? 'Simpan Perubahan' : 'Tambah Merchant'}</>
            }
          </button>

          {/* Delete (only edit mode) */}
          {isEdit && !confirmDel && (
            <button
              className="btn btn-ghost btn-full"
              onClick={() => setConfirmDel(true)}
              style={{ color: 'var(--status-tidak)', fontSize: '0.875rem' }}
            >
              <Trash2 size={15} /> Hapus Merchant
            </button>
          )}

          {/* Confirm delete */}
          {isEdit && confirmDel && (
            <div style={{
              background: 'var(--status-tidak-bg)', border: '1px solid #FECACA',
              borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertTriangle size={16} color="var(--status-tidak)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--status-tidak)', fontWeight: 600 }}>
                  Hapus merchant ini? Semua data FU dan foto akan ikut terhapus dan tidak bisa dikembalikan.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-danger" onClick={handleDelete}
                  disabled={deleting} style={{ flex: 1 }}>
                  {deleting
                    ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} />
                    : '🗑️ Ya, Hapus'
                  }
                </button>
                <button className="btn btn-outline" onClick={() => setConfirmDel(false)} style={{ flex: 1 }}>
                  Batal
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
