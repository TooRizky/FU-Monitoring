import React, { useState, useRef } from 'react'
import {
  Camera, Upload, Trash2, X, CheckCircle2,
  AlertCircle, Eye, Edit3, Check,
} from 'lucide-react'
import { uploadEvidence, deleteEvidence, updateEvidenceCaption } from '../lib/supabase'
import { useToast } from '../lib/toast'
import { formatDateTime } from '../lib/utils'

/** Standalone komponen untuk upload, lihat, hapus foto bukti kunjungan */
export default function EvidenceManager({ merchantId, evidence, onRefresh, loading }) {
  const toast     = useToast()
  const fileRef   = useRef()
  const [queue,   setQueue]   = useState([])   // [{file, preview, caption, status}]
  const [lightbox, setLightbox] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [editId,   setEditId]  = useState(null)
  const [editCap,  setEditCap] = useState('')

  // ─── Queue handlers ──────────────────────────────────────────────────────
  const addToQueue = (e) => {
    const files = Array.from(e.target.files || [])
    files.slice(0, 5).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev =>
        setQueue(q => [...q, { file, preview: ev.target.result, caption: '', status: 'pending' }])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removeFromQueue = (i) => setQueue(q => q.filter((_, idx) => idx !== i))
  const setQueueCaption = (i, v) =>
    setQueue(q => q.map((x, idx) => idx === i ? { ...x, caption: v } : x))

  // ─── Upload ──────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (queue.length === 0) { toast('Pilih foto terlebih dahulu', 'error'); return }
    setUploading(true)
    let ok = 0

    for (let i = 0; i < queue.length; i++) {
      setQueue(q => q.map((x, idx) => idx === i ? { ...x, status: 'uploading' } : x))
      try {
        // Upload ke Supabase Storage → INSERT row ke visit_evidence
        await uploadEvidence(merchantId, queue[i].file, queue[i].caption)
        setQueue(q => q.map((x, idx) => idx === i ? { ...x, status: 'done' } : x))
        ok++
      } catch (err) {
        setQueue(q => q.map((x, idx) => idx === i ? { ...x, status: 'error', errMsg: err.message } : x))
      }
    }

    toast(`${ok} dari ${queue.length} foto berhasil diupload`, ok === queue.length ? 'success' : 'info')
    setUploading(false)

    // Reset queue after short delay to show done states
    setTimeout(() => {
      setQueue([])
      onRefresh?.()
    }, 1000)
  }

  // ─── Delete evidence ──────────────────────────────────────────────────────
  const handleDelete = async (item) => {
    if (!confirm(`Hapus foto ini?`)) return
    try {
      await deleteEvidence(item.id, item.photo_url)
      toast('Foto dihapus', 'success')
      onRefresh?.()
    } catch (e) {
      toast('Gagal hapus: ' + e.message, 'error')
    }
  }

  // ─── Edit caption ─────────────────────────────────────────────────────────
  const startEdit = (item) => { setEditId(item.id); setEditCap(item.caption || '') }
  const saveCaption = async (id) => {
    try {
      await updateEvidenceCaption(id, editCap)
      toast('Keterangan diperbarui', 'success')
      setEditId(null)
      onRefresh?.()
    } catch (e) {
      toast('Gagal update: ' + e.message, 'error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Existing evidence grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ aspectRatio: '1', borderRadius: 10 }} />)}
        </div>
      ) : evidence.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {evidence.map(item => (
            <div key={item.id} style={{
              borderRadius: 10, overflow: 'hidden',
              border: '1px solid var(--gray-200)',
              background: '#fff',
            }}>
              {/* Photo */}
              <div style={{ position: 'relative', aspectRatio: '1', cursor: 'pointer' }}
                onClick={() => setLightbox(item)}>
                <img
                  src={item.photo_url}
                  alt={item.caption || 'Bukti kunjungan'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.src = '/placeholder-photo.png' }}
                />
                {/* View overlay */}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                >
                  <Eye size={18} color="#fff" style={{ opacity: 0.8 }} />
                </div>
                {/* Delete */}
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(item) }}
                  style={{
                    position: 'absolute', top: 5, right: 5,
                    background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff',
                  }}
                >
                  <Trash2 size={10} />
                </button>
              </div>

              {/* Caption row */}
              <div style={{ padding: '5px 6px' }}>
                {editId === item.id ? (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input
                      className="form-input"
                      style={{ fontSize: '0.625rem', padding: '3px 6px', flex: 1 }}
                      value={editCap}
                      onChange={e => setEditCap(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveCaption(item.id)}
                      autoFocus
                    />
                    <button onClick={() => saveCaption(item.id)} style={{
                      background: 'var(--status-berminat)', border: 'none', borderRadius: 4,
                      width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                    }}>
                      <Check size={11} color="#fff" />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}
                    onClick={() => startEdit(item)}>
                    <p style={{
                      fontSize: '0.625rem', color: item.caption ? 'var(--gray-600)' : 'var(--gray-300)',
                      lineHeight: 1.3, flex: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.caption || 'Tap untuk tambah keterangan'}
                    </p>
                    <Edit3 size={9} color="var(--gray-300)" style={{ flexShrink: 0 }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '16px 0' }}>
          <Camera size={30} />
          <p>Belum ada foto bukti kunjungan</p>
        </div>
      )}

      {/* ── Upload queue ── */}
      {queue.length > 0 && (
        <div style={{
          background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
          borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--gray-700)' }}>
            Antrian Upload ({queue.length} foto)
          </p>

          {queue.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {item.status === 'uploading' && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} />
                  </div>
                )}
                {item.status === 'done' && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,163,74,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={16} color="#fff" />
                  </div>
                )}
              </div>
              <input
                className="form-input"
                style={{ fontSize: '0.8125rem', flex: 1 }}
                placeholder="Keterangan foto..."
                value={item.caption}
                onChange={e => setQueueCaption(i, e.target.value)}
                disabled={item.status !== 'pending'}
              />
              {item.status === 'pending' && (
                <button onClick={() => removeFromQueue(i)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: 'var(--gray-400)', flexShrink: 0,
                }}>
                  <X size={14} />
                </button>
              )}
              {item.status === 'error' && (
                <span style={{ fontSize: '0.625rem', color: 'var(--status-tidak)', flexShrink: 0 }}>
                  Gagal
                </span>
              )}
            </div>
          ))}

          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={uploading}
            style={{ alignSelf: 'stretch' }}
          >
            {uploading
              ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} /> Mengupload...</>
              : <><Upload size={14} /> Upload {queue.length} Foto ke Supabase</>
            }
          </button>
        </div>
      )}

      {/* ── Add photo button ── */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '10px 16px',
          border: '2px dashed var(--gray-300)', borderRadius: 8,
          background: '#fff', color: 'var(--gray-500)',
          cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--mandiri-blue)'; e.currentTarget.style.color = 'var(--mandiri-blue)'; e.currentTarget.style.background = '#EFF6FF' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-300)'; e.currentTarget.style.color = 'var(--gray-500)'; e.currentTarget.style.background = '#fff' }}
      >
        <Camera size={16} /> + Tambah Foto Bukti Kunjungan
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={addToQueue} />

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)',
            zIndex: 2000, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: '50%', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
          >
            <X size={18} />
          </button>
          <img
            src={lightbox.photo_url}
            alt={lightbox.caption}
            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8 }}
            onClick={e => e.stopPropagation()}
          />
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            {lightbox.caption && (
              <p style={{ color: '#fff', fontSize: '0.875rem', marginBottom: 4 }}>{lightbox.caption}</p>
            )}
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6875rem' }}>
              {formatDateTime(lightbox.created_at)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
