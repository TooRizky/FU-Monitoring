import React, { useState, useRef, useEffect } from 'react'
import {
  Camera, X, Trash2, Edit3, Check, Image,
  Upload, ZoomIn, ChevronLeft, ChevronRight,
  Loader,
} from 'lucide-react'
import { uploadEvidence, getVisitEvidence, deleteEvidence, updateEvidenceCaption } from '../lib/supabase'
import { useToast } from '../lib/toast'
import { formatDateTime } from '../lib/utils'

// ─── Lightbox ────────────────────────────────────────────────────────────────
function Lightbox({ items, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const item = items[idx]

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIdx(i => Math.min(items.length - 1, i + 1))
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [items.length, onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)',
        zIndex: 2000, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: '50%', width: 36, height: 36,
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <X size={18} />
      </button>

      {/* Counter */}
      <p style={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem',
      }}>
        {idx + 1} / {items.length}
      </p>

      {/* Prev */}
      {idx > 0 && (
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => i - 1) }}
          style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: '50%', width: 40, height: 40,
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Image */}
      <img
        src={item.photo_url}
        alt={item.caption || `Bukti ${idx + 1}`}
        style={{
          maxWidth: 'calc(100vw - 48px)', maxHeight: 'calc(100vh - 120px)',
          objectFit: 'contain', borderRadius: 8,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      />

      {/* Caption & meta */}
      {(item.caption || item.created_at) && (
        <div style={{
          position: 'absolute', bottom: 24,
          background: 'rgba(0,0,0,0.6)',
          padding: '8px 16px', borderRadius: 10,
          maxWidth: 'calc(100vw - 48px)',
          textAlign: 'center',
        }}
          onClick={e => e.stopPropagation()}
        >
          {item.caption && (
            <p style={{ color: '#fff', fontSize: '0.875rem', margin: 0 }}>{item.caption}</p>
          )}
          {item.created_at && (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6875rem', marginTop: 2 }}>
              {formatDateTime(item.created_at)}
            </p>
          )}
        </div>
      )}

      {/* Next */}
      {idx < items.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => i + 1) }}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: '50%', width: 40, height: 40,
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronRight size={22} />
        </button>
      )}
    </div>
  )
}

// ─── Single Evidence Card ─────────────────────────────────────────────────────
function EvidenceCard({ item, onDelete, onZoom, onCaptionSave }) {
  const toast = useToast()
  const [editing, setEditing]   = useState(false)
  const [caption, setCaption]   = useState(item.caption || '')
  const [saving,  setSaving]    = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSaveCaption = async () => {
    setSaving(true)
    try {
      await updateEvidenceCaption(item.id, caption)
      onCaptionSave(item.id, caption)
      setEditing(false)
      toast('Caption disimpan', 'success')
    } catch (e) {
      toast('Gagal: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Hapus foto ini?')) return
    setDeleting(true)
    try {
      await deleteEvidence(item.id, item.photo_url)
      onDelete(item.id)
      toast('Foto dihapus', 'success')
    } catch (e) {
      toast('Gagal hapus: ' + e.message, 'error')
      setDeleting(false)
    }
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Photo */}
      <div
        style={{ position: 'relative', aspectRatio: '4/3', cursor: 'pointer' }}
        onClick={() => onZoom(item)}
      >
        <img
          src={item.photo_url}
          alt={item.caption || 'Bukti kunjungan'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
        {/* Overlay zoom hint */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
          padding: 8,
        }}>
          <ZoomIn size={16} color="rgba(255,255,255,0.8)" />
        </div>
        {/* Date badge */}
        {item.created_at && (
          <div style={{
            position: 'absolute', top: 6, left: 6,
            background: 'rgba(0,0,0,0.55)', borderRadius: 5,
            padding: '2px 7px',
          }}>
            <p style={{ color: '#fff', fontSize: '0.625rem', fontWeight: 500 }}>
              {formatDateTime(item.created_at)}
            </p>
          </div>
        )}
      </div>

      {/* Caption area */}
      <div style={{ padding: '8px 10px 10px' }}>
        {editing ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="form-input"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Tulis keterangan foto..."
              style={{ flex: 1, padding: '7px 10px', fontSize: '0.8125rem' }}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSaveCaption()}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSaveCaption}
              disabled={saving}
              style={{ padding: '7px 10px' }}
            >
              {saving
                ? <span className="spinner" style={{ width: 12, height: 12, borderTopColor: '#fff' }} />
                : <Check size={13} />
              }
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setCaption(item.caption || ''); setEditing(false) }}
              style={{ padding: '7px 10px' }}
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <p style={{
              fontSize: '0.8125rem', color: caption ? 'var(--gray-700)' : 'var(--gray-400)',
              flex: 1, fontStyle: caption ? 'normal' : 'italic',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {caption || 'Tambah keterangan...'}
            </p>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setEditing(true)}
                style={{ padding: '4px 6px', color: 'var(--gray-500)' }}
                title="Edit keterangan"
              >
                <Edit3 size={13} />
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleDelete}
                disabled={deleting}
                style={{ padding: '4px 6px', color: 'var(--status-tidak)' }}
                title="Hapus foto"
              >
                {deleting
                  ? <span className="spinner" style={{ width: 12, height: 12, borderTopColor: 'var(--status-tidak)' }} />
                  : <Trash2 size={13} />
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Upload Button ─────────────────────────────────────────────────────────────
function UploadButton({ onFilesSelected, uploading }) {
  const ref = useRef()
  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        disabled={uploading}
        style={{
          width: '100%', padding: '14px',
          border: '2px dashed var(--mandiri-blue)',
          borderRadius: 10, background: uploading ? 'var(--gray-50)' : '#EFF6FF',
          color: 'var(--mandiri-blue)', cursor: uploading ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, fontWeight: 600, fontSize: '0.875rem',
          transition: 'background 0.15s',
        }}
      >
        {uploading ? (
          <><Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Mengunggah foto...</>
        ) : (
          <><Camera size={16} /> Unggah Bukti Kunjungan</>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={onFilesSelected}
      />
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EvidenceSection({ merchantId }) {
  const toast = useToast()
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightbox,  setLightbox]  = useState(null) // { index }

  // Load existing evidence
  useEffect(() => {
    if (!merchantId) return
    setLoading(true)
    getVisitEvidence(merchantId)
      .then(setItems)
      .catch(e => toast('Gagal memuat foto: ' + e.message, 'error'))
      .finally(() => setLoading(false))
  }, [merchantId])

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    e.target.value = ''

    setUploading(true)
    let successCount = 0

    for (const file of files) {
      try {
        // Upload file ke Supabase Storage → insert row ke DB → dapat { id, photo_url, ... }
        const row = await uploadEvidence(merchantId, file, '')
        setItems(prev => [row, ...prev])   // Tambah row baru ke list
        successCount++
      } catch (err) {
        toast(`Gagal upload "${file.name}": ${err.message}`, 'error')
      }
    }

    setUploading(false)
    if (successCount > 0) {
      toast(`${successCount} foto berhasil diunggah ✅`, 'success')
    }
  }

  const handleDelete = (id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleCaptionSave = (id, caption) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, caption } : i))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Upload button */}
      <UploadButton onFilesSelected={handleFilesSelected} uploading={uploading} />

      {/* Info */}
      <p style={{
        fontSize: '0.75rem', color: 'var(--gray-400)',
        textAlign: 'center', lineHeight: 1.4,
      }}>
        Foto diunggah ke cloud storage Supabase • Tap foto untuk memperbesar
      </p>

      {/* Loading state */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ aspectRatio: '4/3', borderRadius: 10 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <Image size={32} color="var(--gray-300)" />
          <h3 style={{ color: 'var(--gray-500)' }}>Belum Ada Foto</h3>
          <p style={{ fontSize: '0.8125rem' }}>Unggah bukti kunjungan ke merchant</p>
        </div>
      ) : (
        <>
          {/* Count badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: '0.75rem', fontWeight: 700,
              color: 'var(--mandiri-navy)',
            }}>
              {items.length} Foto
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {items.map((item, idx) => (
              <EvidenceCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onZoom={() => setLightbox({ index: idx })}
                onCaptionSave={handleCaptionSave}
              />
            ))}
          </div>
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          items={items}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
