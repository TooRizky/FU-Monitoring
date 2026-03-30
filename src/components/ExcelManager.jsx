import React, { useState, useRef } from 'react'
import { X, Download, Upload, FileSpreadsheet, ArrowRightLeft } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const HEADERS = [
  'MerchantID', 'Nama Merchant', 'PIC', '3P', 'Follow-Up',
  'Jumlah FU', 'Tanggal FU Terakhir', 'Hasil FU',
  'Potensi Nominal', 'EDC Mandiri', 'EDC Lain',
]

const COL_CANDIDATES = {
  id:      ['merchantid', 'merchant_id', 'id'],
  nama:    ['nama merchant', 'nama_merchant', 'nama'],
  pic:     ['pic'],
  cat:     ['3p', 'kategori', 'kategori 3p'],
  nominal: ['potensi nominal', 'potensi_nominal', 'nominal'],
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function findCol(headers, candidates) {
  for (const c of candidates) {
    const idx = headers.map(h => h.toLowerCase().trim()).indexOf(c)
    if (idx >= 0) return idx
  }
  return -1
}

function rowsToMerchants(jsonRows) {
  // jsonRows: array of objects from XLSX.utils.sheet_to_json
  const headers = Object.keys(jsonRows[0] || {})
  const COL = {}
  for (const [key, cands] of Object.entries(COL_CANDIDATES)) {
    COL[key] = headers.find(h => cands.includes(h.toLowerCase().trim())) || null
  }

  if (!COL.id || !COL.nama)
    throw new Error('Kolom "MerchantID" dan "Nama Merchant" wajib ada di file')

  return jsonRows
    .map(row => {
      const mid  = String(row[COL.id] || '').trim()
      const nama = String(row[COL.nama] || '').trim()
      if (!mid || !nama) return null
      return {
        merchant_id:     mid.toUpperCase(),
        nama_merchant:   nama,
        pic:             COL.pic     ? (String(row[COL.pic]  || '').trim() || null) : null,
        '3p':            COL.cat     ? (String(row[COL.cat]  || '').trim() || 'Pebisnis') : 'Pebisnis',
        potensi_nominal: COL.nominal
          ? (parseFloat(String(row[COL.nominal] || '').replace(/[^\d.]/g, '')) || null)
          : null,
      }
    })
    .filter(Boolean)
}

// ─── PARSE FILE (xlsx atau csv) ───────────────────────────────────────────────
function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data   = new Uint8Array(ev.target.result)
        const wb     = XLSX.read(data, { type: 'array' })
        const ws     = wb.Sheets[wb.SheetNames[0]]
        const json   = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (!json.length) throw new Error('Sheet pertama kosong atau tidak ada data')
        const rows = rowsToMerchants(json)
        if (!rows.length) throw new Error('Tidak ada baris data valid di file')
        resolve(rows)
      } catch (e) { reject(e) }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsArrayBuffer(file)
  })
}

// ─── EXPORT ke XLSX ───────────────────────────────────────────────────────────
async function doExport(format, toast, setExporting) {
  setExporting(true)
  try {
    const { data, error } = await supabase
      .from('merchants')
      .select('merchant_id,nama_merchant,pic,3p,followup,jumlah_fu,tanggal_fu_terakhir,hasil_fu,potensi_nominal,edc_mandiri,edc_lain')
      .order('merchant_id', { ascending: true })
    if (error) throw error

    const rows = data.map(m => ({
      'MerchantID':          m.merchant_id,
      'Nama Merchant':       m.nama_merchant,
      'PIC':                 m.pic || '',
      '3P':                  m['3p'] || 'Pebisnis',
      'Follow-Up':           m.followup || 'Belum',
      'Jumlah FU':           m.jumlah_fu || 0,
      'Tanggal FU Terakhir': m.tanggal_fu_terakhir
        ? new Date(m.tanggal_fu_terakhir).toLocaleDateString('id-ID') : '',
      'Hasil FU':            m.hasil_fu && m.hasil_fu !== '-' ? m.hasil_fu : '',
      'Potensi Nominal':     m.potensi_nominal || '',
      'EDC Mandiri':         m.edc_mandiri ? 'Ya' : 'Tidak',
      'EDC Lain':            m.edc_lain || '',
    }))

    const ws = XLSX.utils.json_to_sheet(rows, { header: HEADERS })

    // Style header row (bold + background) — basic sheetjs styling
    const range = XLSX.utils.decode_range(ws['!ref'])
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })]
      if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: '003F88' } }, fontColor: { rgb: 'FFFFFF' } }
    }

    // Column widths
    ws['!cols'] = [
      { wch: 12 }, { wch: 40 }, { wch: 22 }, { wch: 12 },
      { wch: 12 }, { wch: 10 }, { wch: 22 }, { wch: 18 },
      { wch: 16 }, { wch: 14 }, { wch: 20 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Merchant TJD')

    const date = new Date().toISOString().slice(0, 10)

    if (format === 'xlsx') {
      XLSX.writeFile(wb, `merchant_TJD_${date}.xlsx`)
    } else {
      // CSV dengan BOM agar Excel bisa baca UTF-8
      const csvData = XLSX.utils.sheet_to_csv(ws)
      const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `merchant_TJD_${date}.csv`; a.click()
      URL.revokeObjectURL(url)
    }

    toast(`✅ Berhasil export ${data.length} merchant ke ${format.toUpperCase()}`, 'success')
  } catch (e) {
    toast('Gagal export: ' + e.message, 'error')
  } finally {
    setExporting(false)
  }
}

// ─── CONVERT xlsx → csv (standalone, tanpa upload ke DB) ──────────────────────
function doConvert(file, toast) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result)
        const wb   = XLSX.read(data, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const csv  = '\uFEFF' + XLSX.utils.sheet_to_csv(ws)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        const outName = file.name.replace(/\.xlsx?$/i, '') + '_converted.csv'
        a.href = url; a.download = outName; a.click()
        URL.revokeObjectURL(url)
        toast(`✅ Konversi selesai → ${outName}`, 'success')
        resolve()
      } catch (e) { reject(e) }
    }
    reader.onerror = () => reject(new Error('Gagal baca file'))
    reader.readAsArrayBuffer(file)
  })
}

// ─── IMPORT PANEL ─────────────────────────────────────────────────────────────
function ImportPanel({ onDone }) {
  const toast    = useToast()
  const fileRef  = useRef()
  const [preview,   setPreview]   = useState(null)
  const [importing, setImporting] = useState(false)
  const [converting, setConverting] = useState(false)
  const [result,    setResult]    = useState(null)

  const handleFile = async (file) => {
    if (!file) return
    if (!file.name.match(/\.(xlsx?|csv)$/i)) {
      toast('Hanya file .xlsx atau .csv yang didukung', 'error'); return
    }
    try {
      const rows = await parseFile(file)
      setPreview({ rows, fileName: file.name, isXlsx: /\.xlsx?$/i.test(file.name), fileRef: file })
      setResult(null)
    } catch (e) {
      toast('Gagal baca file: ' + e.message, 'error')
    }
  }

  const handleConvert = async () => {
    if (!preview?.fileRef) return
    setConverting(true)
    try { await doConvert(preview.fileRef, toast) }
    catch (e) { toast('Gagal konversi: ' + e.message, 'error') }
    finally { setConverting(false) }
  }

  const handleImport = async () => {
    if (!preview?.rows?.length) return
    setImporting(true)
    let updated = 0, inserted = 0, failed = 0, failedIds = []

    try {
      for (const row of preview.rows) {
        try {
          const { data: existing } = await supabase
            .from('merchants').select('id')
            .eq('merchant_id', row.merchant_id).maybeSingle()

          if (existing) {
            const upd = { nama_merchant: row.nama_merchant, updated_at: new Date().toISOString() }
            if (row.pic)             upd.pic             = row.pic
            if (row['3p'])           upd['3p']           = row['3p']
            if (row.potensi_nominal) upd.potensi_nominal = row.potensi_nominal
            const { error } = await supabase.from('merchants').update(upd).eq('id', existing.id)
            if (error) throw error
            updated++
          } else {
            const { error } = await supabase.from('merchants').insert([{
              merchant_id:     row.merchant_id,
              nama_merchant:   row.nama_merchant,
              pic:             row.pic || null,
              '3p':            row['3p'] || 'Pebisnis',
              potensi_nominal: row.potensi_nominal || null,
              followup:        'Belum', jumlah_fu: 0,
              created_at:      new Date().toISOString(),
              updated_at:      new Date().toISOString(),
            }])
            if (error) throw error
            inserted++
          }
        } catch {
          failed++
          failedIds.push(row.merchant_id)
        }
      }
      setResult({ updated, inserted, failed, failedIds })
      if (failed === 0) toast(`✅ Import selesai: ${updated} diperbarui, ${inserted} ditambah`, 'success')
      else              toast(`⚠️ Import selesai dengan ${failed} gagal`, 'warning')
      onDone?.()
    } finally {
      setImporting(false)
    }
  }

  const reset = () => { setPreview(null); setResult(null); if (fileRef.current) fileRef.current.value = '' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Info */}
      <div style={{
        background: '#EFF6FF', border: '1px solid #BFDBFE',
        borderRadius: 8, padding: '10px 12px', fontSize: '0.8125rem', color: '#1D4ED8',
      }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>📋 Format yang didukung: <code>.xlsx</code> dan <code>.csv</code></p>
        <p style={{ color: '#3B82F6' }}>
          Kolom wajib: <strong>MerchantID</strong>, <strong>Nama Merchant</strong><br/>
          Kolom opsional: PIC, 3P, Potensi Nominal<br/>
          • Data ada → <strong>diperbarui</strong> &nbsp;·&nbsp; Data baru → <strong>ditambah</strong><br/>
          • Riwayat FU &amp; EDC tidak terpengaruh
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => !preview && fileRef.current?.click()}
        style={{
          border: `2px dashed ${preview ? 'var(--mandiri-blue)' : 'var(--gray-300)'}`,
          borderRadius: 12, padding: 24, textAlign: 'center',
          cursor: preview ? 'default' : 'pointer',
          background: preview ? '#EFF6FF' : '#fff',
          transition: 'all 0.15s',
        }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
      >
        <input
          ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
          onChange={e => handleFile(e.target.files?.[0])}
          style={{ display: 'none' }}
        />
        <FileSpreadsheet size={32} color={preview ? 'var(--mandiri-blue)' : 'var(--gray-400)'}
          style={{ margin: '0 auto 8px' }} />
        {preview ? (
          <div>
            <p style={{ fontWeight: 700, color: 'var(--mandiri-blue)', marginBottom: 2 }}>
              {preview.fileName}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
              {preview.rows.length} baris siap diproses
            </p>
          </div>
        ) : (
          <p style={{ color: 'var(--gray-500)', fontWeight: 500 }}>
            Klik atau drag & drop file <strong>.xlsx</strong> / <strong>.csv</strong> di sini
          </p>
        )}
      </div>

      {/* Action buttons saat file sudah dipilih */}
      {preview && !result && (
        <>
          {/* Tombol ganti file */}
          <button onClick={reset}
            style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', fontSize: '0.8125rem', alignSelf: 'flex-end' }}>
            ✕ Ganti file
          </button>

          {/* Convert xlsx → csv (hanya jika file xlsx) */}
          {preview.isXlsx && (
            <button
              className="btn btn-outline btn-full"
              onClick={handleConvert}
              disabled={converting}
              style={{ gap: 6 }}
            >
              {converting
                ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Mengkonversi...</>
                : <><ArrowRightLeft size={14} /> Convert XLSX → CSV (Download)</>
              }
            </button>
          )}

          {/* Preview table */}
          <div style={{
            background: 'var(--gray-50)', borderRadius: 10,
            border: '1px solid var(--gray-200)', overflow: 'hidden',
          }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--gray-200)' }}>
              <p style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '0.875rem' }}>
                Preview — {preview.rows.length} baris
              </p>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 200 }}>
              <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--gray-100)' }}>
                    {['ID', 'Nama', 'PIC', '3P', 'Nominal'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 8).map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--gray-200)' }}>
                      <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: 'var(--mandiri-blue)', fontWeight: 600 }}>{r.merchant_id}</td>
                      <td style={{ padding: '6px 10px', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nama_merchant}</td>
                      <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>{r.pic || '—'}</td>
                      <td style={{ padding: '6px 10px' }}>{r['3p'] || '—'}</td>
                      <td style={{ padding: '6px 10px' }}>{r.potensi_nominal ? `Rp ${r.potensi_nominal.toLocaleString('id-ID')}` : '—'}</td>
                    </tr>
                  ))}
                  {preview.rows.length > 8 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '6px 10px', color: 'var(--gray-400)', fontStyle: 'italic', textAlign: 'center' }}>
                        ...dan {preview.rows.length - 8} baris lainnya
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import ke DB */}
          <button
            className="btn btn-primary btn-full"
            onClick={handleImport}
            disabled={importing}
            style={{ padding: 13 }}
          >
            {importing
              ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> Mengimport {preview.rows.length} baris...</>
              : <><Upload size={15} /> Import {preview.rows.length} Merchant ke Database</>
            }
          </button>
        </>
      )}

      {/* Result */}
      {result && (
        <div style={{
          background: result.failed === 0 ? '#F0FDF4' : '#FFFBEB',
          border: `1px solid ${result.failed === 0 ? '#86EFAC' : '#FDE68A'}`,
          borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <p style={{ fontWeight: 700, color: result.failed === 0 ? '#166534' : '#92400E' }}>
            {result.failed === 0 ? '✅ Import Berhasil' : '⚠️ Import Selesai dengan Error'}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {result.updated  > 0 && <span style={{ fontSize: '0.8125rem', background: '#DBEAFE', color: '#1D4ED8', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>🔄 {result.updated} diperbarui</span>}
            {result.inserted > 0 && <span style={{ fontSize: '0.8125rem', background: '#DCFCE7', color: '#166534', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>➕ {result.inserted} ditambah</span>}
            {result.failed   > 0 && <span style={{ fontSize: '0.8125rem', background: '#FEE2E2', color: '#991B1B', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>❌ {result.failed} gagal</span>}
          </div>
          {result.failedIds.length > 0 && (
            <p style={{ fontSize: '0.75rem', color: '#92400E' }}>Gagal: {result.failedIds.join(', ')}</p>
          )}
          <button className="btn btn-outline btn-sm" onClick={reset} style={{ alignSelf: 'flex-start' }}>
            Import File Lain
          </button>
        </div>
      )}
    </div>
  )
}

// ─── EXPORT PANEL ─────────────────────────────────────────────────────────────
function ExportPanel() {
  const toast = useToast()
  const [exporting, setExporting] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        background: '#F0FDF4', border: '1px solid #86EFAC',
        borderRadius: 8, padding: '12px 14px', fontSize: '0.8125rem', color: '#166534',
      }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>📤 Export semua data merchant</p>
        <p>Berisi: ID, Nama, PIC, Kategori, Status FU, Hasil FU, Nominal, EDC.<br/>
        Tersedia format <strong>.xlsx</strong> (Excel native) dan <strong>.csv</strong>.</p>
      </div>

      {/* XLSX */}
      <button
        className="btn btn-primary btn-full"
        onClick={() => doExport('xlsx', toast, setExporting)}
        disabled={exporting}
        style={{ padding: 13, gap: 8 }}
      >
        {exporting
          ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> Mengexport...</>
          : <><Download size={15} /> Download .xlsx (Excel)</>
        }
      </button>

      {/* CSV */}
      <button
        className="btn btn-outline btn-full"
        onClick={() => doExport('csv', toast, setExporting)}
        disabled={exporting}
        style={{ padding: 13, gap: 8 }}
      >
        <Download size={15} /> Download .csv
      </button>
    </div>
  )
}

// ─── MAIN MODAL ───────────────────────────────────────────────────────────────
export default function ExcelManager({ onClose, onRefresh }) {
  const [tab, setTab] = useState('export')

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}
        style={{ maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{
          padding: '14px 16px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
            📊 Kelola Data Excel
          </h2>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--gray-400)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '12px 16px 0', borderBottom: '1px solid var(--gray-200)' }}>
          {[
            { key: 'export', icon: <Download size={14} />, label: 'Export' },
            { key: 'import', icon: <Upload size={14} />,   label: 'Import / Update' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '10px 8px',
              borderBottom: `3px solid ${tab === t.key ? 'var(--mandiri-blue)' : 'transparent'}`,
              color: tab === t.key ? 'var(--mandiri-blue)' : 'var(--gray-500)',
              fontWeight: tab === t.key ? 700 : 500,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: 16 }}>
          {tab === 'export' ? <ExportPanel /> : <ImportPanel onDone={onRefresh} />}
        </div>
      </div>
    </div>
  )
}
