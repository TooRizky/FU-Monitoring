import React, { useState, useEffect, useCallback } from 'react'
import { ChevronDown, Image } from 'lucide-react'
import { getMerchants, getVisitEvidence } from '../lib/supabase'
import Header from '../components/Header'
import EvidenceManager from '../components/EvidenceManager'
import { useToast } from '../lib/toast'

// ─── Merchant Selector Dropdown ───────────────────────────────────────────────
function MerchantSelector({ merchants, loading, selected, onSelect }) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')

  const filtered = merchants.filter(m =>
    m.nama_merchant.toLowerCase().includes(query.toLowerCase()) ||
    m.merchant_id.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 14px',
          background: selected ? 'var(--mandiri-yellow-bg)' : '#fff',
          border: `2px solid ${selected ? 'var(--mandiri-yellow)' : 'var(--gray-300)'}`,
          borderRadius: 10, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'var(--font)', textAlign: 'left',
          transition: 'border-color 0.15s',
        }}
      >
        {selected ? (
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
              {selected.nama_merchant}
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--gray-500)', margin: 0 }}>
              {selected.merchant_id} · {selected['3p'] || 'Pebisnis'}
            </p>
          </div>
        ) : (
          <span style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>
            {loading ? 'Memuat daftar merchant...' : '— Pilih merchant —'}
          </span>
        )}
        <ChevronDown
          size={16} color="var(--gray-400)"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          marginTop: 4, background: '#fff',
          border: '1px solid var(--gray-200)', borderRadius: 10,
          boxShadow: 'var(--shadow-md)', overflow: 'hidden',
          maxHeight: 300, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid var(--gray-100)' }}>
            <input
              className="form-input"
              style={{ fontSize: '0.8125rem', padding: '7px 11px' }}
              placeholder="Cari nama atau ID merchant..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <p style={{ padding: '16px', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                Merchant tidak ditemukan
              </p>
            ) : filtered.map(m => (
              <button
                key={m.id}
                onClick={() => { onSelect(m); setOpen(false); setQuery('') }}
                style={{
                  width: '100%', padding: '10px 14px', border: 'none',
                  background: selected?.id === m.id ? 'var(--mandiri-yellow-bg)' : 'transparent',
                  borderBottom: '1px solid var(--gray-100)',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)',
                }}
              >
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-900)', margin: 0 }}>
                  {m.nama_merchant}
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--gray-500)', margin: 0 }}>
                  {m.merchant_id}
                  {m.pic ? ` · ${m.pic}` : ''}
                  {m.followup === 'Sudah'
                    ? <span style={{ color: 'var(--status-berminat)', marginLeft: 4 }}>✓ FU</span>
                    : <span style={{ color: 'var(--gray-400)', marginLeft: 4 }}>• Belum FU</span>
                  }
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main EvidencePage ────────────────────────────────────────────────────────
export default function EvidencePage() {
  const toast = useToast()
  const [merchants,   setMerchants]   = useState([])
  const [loadingM,    setLoadingM]    = useState(true)
  const [selected,    setSelected]    = useState(null)
  const [evidence,    setEvidence]    = useState([])
  const [loadingE,    setLoadingE]    = useState(false)

  // Load merchant list sekali
  useEffect(() => {
    getMerchants()
      .then(setMerchants)
      .catch(e => toast('Gagal memuat merchant: ' + e.message, 'error'))
      .finally(() => setLoadingM(false))
  }, [])

  // Load evidence tiap merchant berganti
  const loadEvidence = useCallback(async () => {
    if (!selected) { setEvidence([]); return }
    setLoadingE(true)
    try {
      const data = await getVisitEvidence(selected.id)
      setEvidence(data)
    } catch (e) {
      toast('Gagal memuat foto: ' + e.message, 'error')
    } finally {
      setLoadingE(false)
    }
  }, [selected])

  useEffect(() => { loadEvidence() }, [loadEvidence])

  return (
    <div className="page">
      <Header
        title="Bukti Kunjungan"
        subtitle={selected
          ? `${selected.nama_merchant} · ${evidence.length} foto`
          : 'Upload & kelola foto bukti kunjungan'}
      />

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Merchant picker */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '11px 14px', background: 'var(--gray-50)',
            borderBottom: '1px solid var(--gray-200)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Image size={14} color="var(--mandiri-navy)" />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gray-800)', margin: 0 }}>
              Pilih Merchant
            </h3>
          </div>
          <div style={{ padding: 12 }}>
            <MerchantSelector
              merchants={merchants}
              loading={loadingM}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
        </div>

        {/* Evidence manager — komponen lengkap dengan upload, galeri, hapus, edit caption */}
        {selected ? (
          <EvidenceManager
            merchantId={selected.id}
            evidence={evidence}
            loading={loadingE}
            onRefresh={loadEvidence}
          />
        ) : (
          <div className="card" style={{ padding: '32px 16px' }}>
            <div className="empty-state">
              <Image size={36} color="var(--gray-300)" />
              <h3 style={{ color: 'var(--gray-500)' }}>Pilih merchant terlebih dahulu</h3>
              <p>Foto bukti kunjungan akan ditampilkan di sini</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
