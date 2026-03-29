# 🏦 TJD Merchant Follow-Up Monitor

> Aplikasi monitoring potensi Follow-Up Merchant berbasis React Vite + Supabase  
> Dengan desain mobile-first, palet warna Bank Mandiri, dan fitur lengkap.

---

## 📱 Screenshot & Fitur

```
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│  📊 DASHBOARD       │   │  🏪 MERCHANT LIST    │   │  📄 REPORT          │
│                     │   │                     │   │                     │
│  Progress bar hero  │   │  Search + filter    │   │  Summary closing    │
│  7% ████░░░░░░░░    │   │  chip (Belum/Sudah/ │   │  Top FU merchants   │
│                     │   │  Berminat/dll)      │   │  Filter by status   │
│  Stat cards:        │   │                     │   │  Export CSV         │
│  • Sudah FU: 8      │   │  MerchantCard:      │   │  Data table         │
│  • Belum FU: 103    │   │  - ID & nama        │   │                     │
│  • Berminat: 2      │   │  - Status badge     │   └─────────────────────┘
│  • Tidak Berminat:4 │   │  - Jumlah FU
│  • Pikir-Pikir: 1   │   │  - Tgl terakhir     │   ┌─────────────────────┐
│  • EDC Mandiri: 0   │   │  - EDC indicator    │   │  📋 MERCHANT DETAIL │
│                     │   │                     │   │                     │
│  Distribusi chart   │   │  FAB (+FU)          │   │  Status hero card   │
│  Per-PIC progress   │   │                     │   │  Info merchant      │
│                     │   └─────────────────────┘   │  Timeline riwayat   │
└─────────────────────┘                             │  Bukti foto/lightbox│
                                                    │  + FU form modal    │
                                                    └─────────────────────┘
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo-url> merchant-fu-monitor
cd merchant-fu-monitor
npm install
```

### 2. Setup Supabase

#### 2a. Buat project baru di [supabase.com](https://supabase.com)

#### 2b. Jalankan schema SQL

Buka **SQL Editor** di Supabase dashboard, lalu jalankan file `supabase_schema.sql`:

```sql
-- Copy-paste isi file supabase_schema.sql
-- Ini akan membuat:
--   • Tabel merchants, followup_history, visit_evidence
--   • Trigger auto-increment jumlah_fu
--   • Trigger auto updated_at
--   • RLS policies
--   • Storage bucket visit-evidence
--   • Views: v_dashboard_summary, v_pic_summary
```

#### 2c. Seed data merchant

Jalankan file `supabase_seed.sql` di SQL Editor untuk memasukkan 111 merchant dari TJD:

```sql
-- Copy-paste isi file supabase_seed.sql
-- Ini akan INSERT 111 merchant dari file MerchantTJD.xlsx
```

#### 2d. Ambil credentials

Di Supabase Dashboard → Settings → API:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon (public) key` → `VITE_SUPABASE_ANON_KEY`

### 3. Environment variables

```bash
cp .env.example .env
# Edit .env:
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Jalankan

```bash
npm run dev
# Buka http://localhost:5173
```

---

## 🗄️ Struktur Database (Supabase)

### Tabel `merchants`

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID PK | Auto generated |
| `merchant_id` | TEXT UNIQUE | Kode merchant (TJD0001...) |
| `nama_merchant` | TEXT | Nama lengkap merchant |
| `pic` | TEXT | Nama kontak di merchant |
| `3p` | TEXT | Kategori (Pebisnis, dll) |
| `followup` | TEXT | `'Sudah'` / `'Belum'` |
| `jumlah_fu` | INTEGER | Jumlah total follow-up (auto-increment via trigger) |
| `tanggal_fu_terakhir` | TIMESTAMPTZ | Timestamp FU terakhir |
| `hasil_fu` | TEXT | `'berminat'` / `'Tidak Berminat'` / `'pikir-pikir dulu'` |
| `alamat` | TEXT | Alamat lengkap |
| `potensi_nominal` | NUMERIC | Potensi nilai transaksi |
| `edc_mandiri` | BOOLEAN | Sudah punya EDC Mandiri? |
| `edc_lain` | TEXT | EDC bank lain (BCA, BRI, dll) |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto-update via trigger |

### Tabel `followup_history`

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID PK | Auto |
| `merchant_id` | UUID FK | Referensi ke merchants.id |
| `hasil_fu` | TEXT | Hasil FU sesi ini |
| `catatan` | TEXT | Catatan tambahan |
| `nominal` | NUMERIC | Potensi nominal (jika berminat) |
| `edc_mandiri` | BOOLEAN | Status EDC Mandiri |
| `edc_lain` | TEXT | EDC bank lain |
| `pic` | TEXT | Kontak yang ditemui |
| `created_at` | TIMESTAMPTZ | Auto |
| `created_by` | TEXT | User yang merekam FU |

### Tabel `visit_evidence`

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID PK | Auto |
| `merchant_id` | UUID FK | Referensi ke merchants.id |
| `photo_url` | TEXT | Public URL dari Supabase Storage |
| `caption` | TEXT | Keterangan foto |
| `created_at` | TIMESTAMPTZ | Auto |

---

## 🔧 Query Supabase Penting

### Ambil semua merchant dengan filter

```sql
-- Semua merchant belum di-FU
SELECT * FROM merchants WHERE followup = 'Belum' ORDER BY merchant_id;

-- Merchant berminat
SELECT * FROM merchants WHERE hasil_fu = 'berminat';

-- Merchant pikir-pikir yang sudah > 7 hari
SELECT *
FROM merchants
WHERE hasil_fu = 'pikir-pikir dulu'
  AND tanggal_fu_terakhir < NOW() - INTERVAL '7 days';

-- Summary dashboard
SELECT * FROM v_dashboard_summary;

-- Summary per PIC
SELECT * FROM v_pic_summary;
```

### Tambah follow-up baru

```sql
-- 1. Insert ke history (trigger akan auto-update merchants)
INSERT INTO followup_history (merchant_id, hasil_fu, catatan, nominal, pic)
VALUES (
  'uuid-merchant-id-here',
  'berminat',
  'Pemilik tertarik, akan konfirmasi minggu depan',
  5000000,
  'Budi (Owner)'
);

-- 2. Update data merchant (sudah dilakukan otomatis oleh trigger)
-- Tapi jika perlu manual:
UPDATE merchants
SET
  followup = 'Sudah',
  hasil_fu = 'berminat',
  potensi_nominal = 5000000,
  pic = 'Budi (Owner)',
  edc_mandiri = false,
  edc_lain = 'BCA'
WHERE id = 'uuid-merchant-id-here';
```

### Cari merchant by nama

```sql
SELECT * FROM merchants
WHERE nama_merchant ILIKE '%central park%'
ORDER BY merchant_id;
```

### Laporan closing

```sql
SELECT
  merchant_id,
  nama_merchant,
  pic,
  jumlah_fu,
  hasil_fu,
  potensi_nominal,
  edc_mandiri,
  tanggal_fu_terakhir
FROM merchants
WHERE hasil_fu = 'berminat'
ORDER BY potensi_nominal DESC NULLS LAST;
```

---

## 📁 Struktur Project

```
merchant-fu-monitor/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── BottomNav.jsx       # Tab navigasi bawah
│   │   ├── FollowUpForm.jsx    # Modal form input FU + upload foto
│   │   ├── Header.jsx          # Header dengan Mandiri branding
│   │   ├── MerchantCard.jsx    # Card item merchant di list
│   │   └── ProgressBar.jsx     # Progress bar + multi-segment
│   ├── hooks/
│   │   └── useMerchants.js     # Custom hooks: useMerchants, useDashboard
│   ├── lib/
│   │   ├── supabase.js         # Supabase client + semua API calls
│   │   ├── toast.jsx           # Toast notification system
│   │   └── utils.js            # Helper functions (format, badge, dll)
│   ├── pages/
│   │   ├── DashboardPage.jsx   # Halaman dashboard utama
│   │   ├── MerchantsPage.jsx   # List merchant + search + filter
│   │   ├── MerchantDetail.jsx  # Detail merchant + riwayat + foto
│   │   └── ReportPage.jsx      # Laporan + export CSV
│   ├── App.jsx                 # Root component + routing
│   ├── index.css               # Global CSS + Mandiri palette
│   └── main.jsx                # Entry point
├── supabase_schema.sql         # DDL lengkap (jalankan pertama)
├── supabase_seed.sql           # Data 111 merchant TJD
├── seed_data.json              # Data seed dalam format JSON
├── .env.example                # Template environment variables
├── package.json
├── vite.config.js
└── README.md
```

---

## 🎨 Desain

### Palet Warna Bank Mandiri

| Token | Nilai | Kegunaan |
|-------|-------|---------|
| `--mandiri-navy` | `#003F88` | Warna utama, header, tombol |
| `--mandiri-blue` | `#005BAA` | Aksen biru |
| `--mandiri-blue-light` | `#0073CE` | Gradient |
| `--mandiri-yellow` | `#F5A623` | Aksen kuning Mandiri |
| `--mandiri-yellow-dark` | `#E0951A` | Hover state kuning |
| `--status-berminat` | `#16A34A` | Badge/status berminat |
| `--status-tidak` | `#DC2626` | Badge tidak berminat |
| `--status-pikir` | `#D97706` | Badge pikir-pikir |

### Responsive Design

- **Mobile-first**: Dioptimasi untuk layar 375–430px
- **Bottom navigation**: Fixed tab bar dengan safe area inset
- **Modal sheet**: Slide-up modal seperti native app
- **Touch interactions**: Active states, haptic-like feedback
- **Max width 640px**: Centered di tablet/desktop

---

## ✨ Fitur Lengkap

### Dashboard
- [x] Progress bar hero dengan animasi
- [x] Stat cards: Total, Sudah FU, Belum, Berminat, Tidak Berminat, Pikir-Pikir, EDC Mandiri
- [x] Distribusi hasil FU (multi-segment progress bar)
- [x] Total potensi nominal (format compact Rp X Jt)
- [x] Leaderboard progress per PIC
- [x] Pull to refresh

### Daftar Merchant
- [x] Search real-time by nama merchant
- [x] Filter chips: Semua / Belum FU / Sudah FU / Berminat / Tidak Berminat / Pikir-Pikir
- [x] Progress bar mini (X/111 di-FU)
- [x] Merchant card: ID, nama, status badge, jumlah FU, tanggal, EDC indicator
- [x] Highlight merchant pikir-pikir yang sudah > 7 hari (urgent revisit)
- [x] FAB button untuk FU merchant berikutnya (belum FU)
- [x] Skeleton loading state

### Form Follow-Up (Modal)
- [x] Input alamat + tombol buka Google Maps
- [x] Input PIC merchant
- [x] Toggle EDC Mandiri (yes/no)
- [x] Dropdown EDC bank lain (BCA, BRI, BNI, dll)
- [x] Pilih hasil FU (button group dengan warna): Berminat / Tidak Berminat / Pikir-Pikir
- [x] Input potensi nominal (muncul jika berminat/pikir-pikir)
- [x] Textarea catatan
- [x] Upload bukti foto kunjungan (maks 3, preview langsung)
- [x] Upload ke Supabase Storage
- [x] Auto-update jumlah_fu via trigger

### Detail Merchant
- [x] Hero status card (animasi)
- [x] Info lengkap merchant (ID, PIC, EDC, nominal, 3P)
- [x] Tombol buka Google Maps
- [x] Timeline riwayat follow-up (visual timeline)
- [x] Gallery bukti kunjungan dengan lightbox
- [x] Hapus foto individual
- [x] Tombol tambah FU

### Report
- [x] Summary closing card (total, selesai, berminat)
- [x] Progress & conversion rate
- [x] Top 3 merchant paling banyak di-FU
- [x] Filter: Semua / Berminat / Pikir-Pikir / Belum FU / EDC
- [x] Export CSV (dengan BOM untuk Excel-compatible)
- [x] Tabel data detail seluruh merchant

---

## 🔒 Security Notes

Untuk production, ubah RLS policy dari `true` menjadi berbasis authentication:

```sql
-- Contoh policy dengan auth (setelah setup Supabase Auth)
DROP POLICY "allow_all_merchants" ON merchants;

CREATE POLICY "allow_authenticated"
  ON merchants FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

---

## 🛠️ Development

```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Build production
npm run preview  # Preview production build
```

---

## 📦 Dependencies

| Package | Version | Keterangan |
|---------|---------|-----------|
| `react` | ^18.2 | UI library |
| `react-dom` | ^18.2 | DOM renderer |
| `@supabase/supabase-js` | ^2.39 | Supabase client |
| `lucide-react` | ^0.383 | Icon library |
| `vite` | ^5.2 | Build tool |
| `@vitejs/plugin-react` | ^4.2 | React plugin untuk Vite |

---

## 📝 Changelog

### v1.0.0
- Initial release
- 111 merchant TJD seeded
- Dashboard, Merchant List, Detail, Report
- Follow-up form dengan upload foto
- Export CSV
- Mandiri color palette

---

*Dibuat untuk monitoring potensi Follow-Up Merchant Bank Mandiri wilayah TJD*

---

## 🖼️ Logo Mandiri

Letakkan file logo Bank Mandiri di folder `public/`:

```
public/
└── mandiri-logo.png    ← Logo Mandiri (disarankan PNG transparan 64×64px)
```

File ini digunakan di:
- **Header** app (kiri atas)
- **Favicon** browser tab (`<link rel="icon" href="/mandiri-logo.png">`)
- **Apple Touch Icon** (saat di-bookmark di iPhone)

Jika file belum ada, app akan menampilkan fallback: kotak kuning berisi huruf **M** berwarna biru.

### Format yang disarankan
- PNG dengan background transparan
- Ukuran minimal: 64×64px
- Ukuran favicon optimal: 32×32px (browser akan auto-resize)
