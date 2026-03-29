export const HASIL_FU_OPTIONS = [
  { value: '',                 label: '— Pilih Hasil FU —', color: null },
  { value: 'berminat',         label: 'Berminat ✅',        color: 'berminat' },
  { value: 'pikir-pikir dulu', label: 'Pikir-Pikir 🤔',    color: 'pikir' },
  { value: 'Tidak Berminat',   label: 'Tidak Berminat ❌',  color: 'tidak' },
]

export const EDC_LAIN_OPTIONS = [
  'BCA', 'BRI', 'BNI', 'CIMB', 'Danamon',
  'GoPay', 'OVO', 'DANA', 'ShopeePay',
  'Tidak Ada', 'Lainnya',
]

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return '—'
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatCurrency(amount) {
  if (!amount && amount !== 0) return '—'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCompact(amount) {
  if (!amount && amount !== 0) return '—'
  if (amount >= 1e9) return `Rp ${(amount / 1e9).toFixed(1)} M`
  if (amount >= 1e6) return `Rp ${(amount / 1e6).toFixed(1)} Jt`
  if (amount >= 1e3) return `Rp ${(amount / 1e3).toFixed(0)} Rb`
  return `Rp ${amount}`
}

export function getHasilBadgeClass(hasil) {
  if (!hasil || hasil === '-') return 'badge-belum'
  if (hasil === 'berminat') return 'badge-berminat'
  if (hasil === 'Tidak Berminat') return 'badge-tidak'
  if (hasil === 'pikir-pikir dulu') return 'badge-pikir'
  return 'badge-belum'
}

export function getHasilLabel(hasil) {
  if (!hasil || hasil === '-' || hasil === '') return 'Belum FU'
  return hasil
}

export function buildMapsUrl(alamat, nama) {
  const q = encodeURIComponent(alamat || nama)
  return `https://maps.google.com/maps?q=${q}`
}

export function daysSinceLastFU(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d)) return null
  const now = new Date()
  return Math.floor((now - d) / (1000 * 60 * 60 * 24))
}

export function getFUUrgency(merchant) {
  if (merchant.followup !== 'Sudah') return 'belum'
  if (merchant.hasil_fu === 'pikir-pikir dulu') {
    const days = daysSinceLastFU(merchant.tanggal_fu_terakhir)
    if (days !== null && days >= 7) return 'urgent'
    return 'follow'
  }
  return 'done'
}
