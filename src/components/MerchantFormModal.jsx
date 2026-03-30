import React, { useState } from 'react'
import { X, Trash2, AlertTriangle } from 'lucide-react'
import { deleteMerchant } from '../lib/supabase'
import { useToast } from '../lib/toast'

// Daftar PIC sesuai data sheet
const PIC_OPTIONS = [
  'Ahmad Dika Widjaya',
  'Amelia Andremica',
  'Danar',
  'Didik Setiawan',
  'Henny Esteria Manalu',
  'Ineu Fajri Pratiwi',
  'Nurul Juwita Ningsih',
  'Olivia Sidabutar',
  'Parlip',
  'Rafly',
  'Raja Natalius Dava',
  'Rokieb',
  'Rusdi Sandi',
  'Ruspika Situmorang',
  'Selly Selmainiar',
  'Sunardi',
  'Yola Rahma Suhada',
  'Zola Rauldhan',
]

const KATEGORI_OPTIONS = ['Pebisnis', 'Retail', 'F&B', 'Hotel', 'Jasa', 'Lainnya']

// Field read-only yang hanya ditampilkan, tidak bisa diedit
function ReadOnlyField({ label, value }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{
        padding: '10px 12px',
        background: 'var(--gray-100)',
        borderRadius: 8,
        border: '1px solid var(--gray-200)',
        fontSize: '0.9375rem',
        color: 'var(--gray-600)',
        minHeight: 42,
        lineHeight: 1.4,
      }}>
        {value || <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>—</span>}
      </div>
    </div>
  )
}

export default function MerchantFormModal({ merchant, onClose, onSuccess }) {
  const toast = useToast()
  const isEdit = !!merchant
  const [deleting,   setDeleting]   = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  // Edit mode: hanya tampilkan info, tidak ada form save
  // Create mode: form tambah merchant baru
  const [form, setForm] = useState({
    merchant_id:   '',
    nama_merchant: '',
    pic:           PIC_OPTIONS[0],
    '3p':          'Pebisnis',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    const { createMerchant } = await import('../lib/supabase')
    if (!form.merchant_id.trim())   { toast('Merchant ID wajib diisi', 'error'); return }
    if (!form.nama_merchant.trim()) { toast('Nama merchant wajib diisi', 'error'); return }
    try {
      await createMerchant({
        merchant_id:   form.merchant_id.trim().toUpperCase(),
        nama_merchant: form.nama_merchant.trim(),
        pic:           form.pic || null,
        '3p':          form['3p'] || 'Pebisnis',
      })
      toast('Merchant baru ditambahkan ✅', 'success')
      onSuccess?.()
      onClose()
    } catch (e) {
      toast('Gagal menyimpan: ' + e.message, 'error')
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
            {isEdit ? '📋 Info Merchant' : '➕ Tambah Merchant Baru'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--gray-400)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {isEdit ? (
            // ─── MODE VIEW (read-only) ───────────────────────────────────────
            <>
              <ReadOnlyField label="Merchant ID" value={merchant.merchant_id} />
              <ReadOnlyField label="Nama Merchant" value={merchant.nama_merchant} />
              <ReadOnlyField label="PIC" value={merchant.pic} />
              <ReadOnlyField label="Kategori" value={merchant['3p']} />

              <div style={{
                background: '#FEF9C3', border: '1px solid #FDE047',
                borderRadius: 8, padding: '10px 12px',
                fontSize: '0.8125rem', color: '#854D0E', fontWeight: 500,
              }}>
                ℹ️ Data merchant tidak bisa diedit. Gunakan form <strong>Mulai Follow-Up</strong> untuk memperbarui informasi kunjungan.
              </div>

              {/* Hapus merchant */}
              {!confirmDel ? (
                <button
                  className="btn btn-ghost btn-full"
                  onClick={() => setConfirmDel(true)}
                  style={{ color: 'var(--status-tidak)', fontSize: '0.875rem', marginTop: 4 }}
                >
                  <Trash2 size={15} /> Hapus Merchant
                </button>
              ) : (
                <div style={{
                  background: 'var(--status-tidak-bg)', border: '1px solid #FECACA',
                  borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <AlertTriangle size={16} color="var(--status-tidak)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: '0.875rem', color: 'var(--status-tidak)', fontWeight: 600 }}>
                      Hapus merchant ini? Semua data FU dan foto akan ikut terhapus.
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
            </>
          ) : (
            // ─── MODE TAMBAH BARU ────────────────────────────────────────────
            <>
              {/* Merchant ID */}
              <div className="form-group">
                <label className="form-label">
                  Merchant ID <span style={{ color: 'var(--status-tidak)' }}>*</span>
                </label>
                <input
                  className="form-input"
                  value={form.merchant_id}
                  onChange={e => set('merchant_id', e.target.value)}
                  placeholder="Contoh: TJD0112"
                  style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
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

              {/* PIC — dropdown */}
              <div className="form-group">
                <label className="form-label">PIC</label>
                <select className="form-select" value={form.pic} onChange={e => set('pic', e.target.value)}>
                  <option value="">— Pilih PIC —</option>
                  {PIC_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Kategori */}
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-select" value={form['3p']} onChange={e => set('3p', e.target.value)}>
                  {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              {/* Save */}
              <button className="btn btn-primary btn-full" onClick={handleSave} style={{ padding: 13 }}>
                Tambah Merchant
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
