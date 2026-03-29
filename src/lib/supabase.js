import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon)
  console.error('⚠️  Missing Supabase env vars — buat file .env dari .env.example')

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnon || 'placeholder-key'
)

// ─── Merchants CRUD ───────────────────────────────────────────────────────────

export const getMerchants = async (filters = {}) => {
  let q = supabase.from('merchants').select('*').order('merchant_id', { ascending: true })
  if (filters.followup && filters.followup !== 'semua') q = q.eq('followup', filters.followup)
  if (filters.hasil_fu && filters.hasil_fu !== 'semua') q = q.eq('hasil_fu', filters.hasil_fu)
  if (filters.pic      && filters.pic      !== 'semua') q = q.eq('pic', filters.pic)
  if (filters.search)  q = q.ilike('nama_merchant', `%${filters.search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export const addMerchant = async (payload) => {
  if (!payload.merchant_id) {
    const { data: last } = await supabase
      .from('merchants').select('merchant_id')
      .order('merchant_id', { ascending: false }).limit(1).maybeSingle()
    const lastNum = last ? parseInt(last.merchant_id.replace(/\D/g, '')) : 0
    payload.merchant_id = `TJD${String(lastNum + 1).padStart(4, '0')}`
  }
  const { data, error } = await supabase
    .from('merchants')
    .insert([{ ...payload, followup: payload.followup || 'Belum', jumlah_fu: payload.jumlah_fu || 0 }])
    .select().single()
  if (error) throw error
  return data
}

export const updateMerchant = async (id, updates) => {
  const { data, error } = await supabase
    .from('merchants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw error
  return data
}

export const deleteMerchant = async (id) => {
  const { data: evs } = await supabase
    .from('visit_evidence').select('photo_url').eq('merchant_id', id)
  if (evs?.length) {
    const paths = evs
      .map(e => e.photo_url.split('/object/public/visit-evidence/')[1])
      .filter(Boolean)
    if (paths.length) await supabase.storage.from('visit-evidence').remove(paths)
  }
  const { error } = await supabase.from('merchants').delete().eq('id', id)
  if (error) throw error
}

// ─── Follow-Up History ────────────────────────────────────────────────────────

export const addFollowUp = async (payload) => {
  const { merchant_id, hasil_fu, catatan, nominal, edc_mandiri, edc_lain, pic, alamat, created_by } = payload

  const { data: hist, error: hErr } = await supabase
    .from('followup_history')
    .insert([{ merchant_id, hasil_fu, catatan, nominal, edc_mandiri, edc_lain, pic, created_by }])
    .select().single()
  if (hErr) throw hErr

  const upd = {
    followup: 'Sudah',
    tanggal_fu_terakhir: new Date().toISOString(),
    hasil_fu,
    updated_at: new Date().toISOString(),
  }
  if (nominal     !== undefined && nominal !== null) upd.potensi_nominal = nominal
  if (edc_mandiri !== undefined)                     upd.edc_mandiri     = edc_mandiri
  if (edc_lain    !== undefined)                     upd.edc_lain        = edc_lain
  if (pic         !== undefined && pic)              upd.pic             = pic
  if (alamat      !== undefined && alamat)           upd.alamat          = alamat

  const { error: uErr } = await supabase.from('merchants').update(upd).eq('id', merchant_id)
  if (uErr) throw uErr

  return hist
}

export const getFollowUpHistory = async (merchantId) => {
  const { data, error } = await supabase
    .from('followup_history').select('*')
    .eq('merchant_id', merchantId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const deleteFollowUp = async (id) => {
  const { error } = await supabase.from('followup_history').delete().eq('id', id)
  if (error) throw error
}

// ─── Visit Evidence ───────────────────────────────────────────────────────────

export const uploadEvidence = async (merchantId, file, caption = '') => {
  const ext     = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const safeExt = ['jpg','jpeg','png','webp','heic','gif'].includes(ext) ? ext : 'jpg'
  const path    = `${merchantId}/${Date.now()}-${Math.random().toString(36).slice(2,7)}.${safeExt}`

  const { error: upErr } = await supabase.storage
    .from('visit-evidence')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false })
  if (upErr) throw new Error(`Upload storage gagal: ${upErr.message}`)

  const { data: urlData } = supabase.storage.from('visit-evidence').getPublicUrl(path)
  if (!urlData?.publicUrl) throw new Error('Gagal mendapatkan public URL foto')

  const { data, error: dbErr } = await supabase
    .from('visit_evidence')
    .insert([{ merchant_id: merchantId, photo_url: urlData.publicUrl, caption: caption || null }])
    .select().single()
  if (dbErr) throw new Error(`Insert DB gagal: ${dbErr.message}`)

  return data
}

export const getVisitEvidence = async (merchantId) => {
  const { data, error } = await supabase
    .from('visit_evidence').select('*')
    .eq('merchant_id', merchantId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const deleteEvidence = async (id, photoUrl) => {
  const storagePath = photoUrl?.split('/object/public/visit-evidence/')[1]
  if (storagePath) await supabase.storage.from('visit-evidence').remove([storagePath])
  const { error } = await supabase.from('visit_evidence').delete().eq('id', id)
  if (error) throw error
}

export const updateEvidenceCaption = async (id, caption) => {
  const { data, error } = await supabase
    .from('visit_evidence').update({ caption }).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const { data, error } = await supabase
    .from('merchants')
    .select('followup, hasil_fu, pic, jumlah_fu, potensi_nominal, edc_mandiri')
  if (error) throw error

  const total         = data.length
  const sudah         = data.filter(m => m.followup  === 'Sudah').length
  const belum         = data.filter(m => m.followup  === 'Belum').length
  const berminat      = data.filter(m => m.hasil_fu  === 'berminat').length
  const tidakBerminat = data.filter(m => m.hasil_fu  === 'Tidak Berminat').length
  const pikirPikir    = data.filter(m => m.hasil_fu  === 'pikir-pikir dulu').length
  const edcMandiri    = data.filter(m => m.edc_mandiri === true).length
  const totalNominal  = data.reduce((s, m) => s + (parseFloat(m.potensi_nominal) || 0), 0)

  const picMap = {}
  data.forEach(m => {
    const p = m.pic || 'Belum Ditentukan'
    if (!picMap[p]) picMap[p] = { total: 0, sudah: 0, berminat: 0 }
    picMap[p].total++
    if (m.followup === 'Sudah')    picMap[p].sudah++
    if (m.hasil_fu === 'berminat') picMap[p].berminat++
  })

  return {
    total, sudah, belum, berminat, tidakBerminat, pikirPikir,
    edcMandiri, totalNominal, picStats: picMap,
    progressPercent:   total > 0 ? Math.round((sudah    / total) * 100) : 0,
    conversionPercent: sudah > 0 ? Math.round((berminat / sudah) * 100) : 0,
  }
}

export const getPICs = async () => {
  const { data, error } = await supabase.from('merchants').select('pic')
  if (error) throw error
  return [...new Set(data.map(m => m.pic).filter(Boolean))]
}

// Alias — beberapa komponen memakai nama createMerchant
export const createMerchant = addMerchant
