-- ============================================================
-- TJD Merchant Follow-Up Monitor — Supabase SQL Schema
-- Jalankan query ini di Supabase SQL Editor
-- ============================================================

-- ─── 1. Extension ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 2. Tabel utama merchants ─────────────────────────────────
CREATE TABLE IF NOT EXISTS merchants (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id           TEXT UNIQUE NOT NULL,
  nama_merchant         TEXT NOT NULL,
  pic                   TEXT,
  "3p"                  TEXT DEFAULT 'Pebisnis',
  followup              TEXT NOT NULL DEFAULT 'Belum' CHECK (followup IN ('Sudah','Belum')),
  jumlah_fu             INTEGER NOT NULL DEFAULT 0,
  tanggal_fu_terakhir   TIMESTAMPTZ,
  hasil_fu              TEXT CHECK (hasil_fu IN ('berminat','Tidak Berminat','pikir-pikir dulu') OR hasil_fu IS NULL),
  alamat                TEXT,
  potensi_nominal       NUMERIC(18,2),
  edc_mandiri           BOOLEAN DEFAULT FALSE,
  edc_lain              TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. Tabel riwayat follow-up ──────────────────────────────
CREATE TABLE IF NOT EXISTS followup_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id   UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  hasil_fu      TEXT NOT NULL CHECK (hasil_fu IN ('berminat','Tidak Berminat','pikir-pikir dulu')),
  catatan       TEXT,
  nominal       NUMERIC(18,2),
  edc_mandiri   BOOLEAN DEFAULT FALSE,
  edc_lain      TEXT,
  pic           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  created_by    TEXT DEFAULT 'user'
);

-- ─── 4. Tabel bukti kunjungan ─────────────────────────────────
CREATE TABLE IF NOT EXISTS visit_evidence (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id   UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  photo_url     TEXT NOT NULL,
  caption       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. Index ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_merchants_merchant_id  ON merchants(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchants_followup     ON merchants(followup);
CREATE INDEX IF NOT EXISTS idx_merchants_hasil_fu     ON merchants(hasil_fu);
CREATE INDEX IF NOT EXISTS idx_merchants_nama         ON merchants USING gin(to_tsvector('indonesian', nama_merchant));
CREATE INDEX IF NOT EXISTS idx_fu_history_merchant    ON followup_history(merchant_id);
CREATE INDEX IF NOT EXISTS idx_evidence_merchant      ON visit_evidence(merchant_id);

-- ─── 6. Trigger: auto-increment jumlah_fu ───────────────────
CREATE OR REPLACE FUNCTION increment_jumlah_fu()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE merchants
  SET
    jumlah_fu = jumlah_fu + 1,
    tanggal_fu_terakhir = NOW(),
    updated_at = NOW()
  WHERE id = NEW.merchant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_jumlah_fu ON followup_history;
CREATE TRIGGER trg_increment_jumlah_fu
  AFTER INSERT ON followup_history
  FOR EACH ROW EXECUTE FUNCTION increment_jumlah_fu();

-- ─── 7. Trigger: updated_at auto-update ──────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_merchants_updated_at ON merchants;
CREATE TRIGGER trg_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 8. Row Level Security (RLS) ─────────────────────────────
ALTER TABLE merchants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_evidence   ENABLE ROW LEVEL SECURITY;

-- Allow anon read (dashboard publik) – ganti ke authenticated jika butuh auth
CREATE POLICY "allow_read_merchants"
  ON merchants FOR SELECT USING (true);

CREATE POLICY "allow_all_merchants"
  ON merchants FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_fu_history"
  ON followup_history FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_evidence"
  ON visit_evidence FOR ALL USING (true) WITH CHECK (true);

-- ─── 9. Storage bucket untuk foto ───────────────────────────
-- Jalankan di Supabase Dashboard → Storage → New Bucket
-- Nama bucket: visit-evidence, Public: YES
-- Atau jalankan SQL ini:
INSERT INTO storage.buckets (id, name, public)
VALUES ('visit-evidence', 'visit-evidence', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "allow_upload_evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'visit-evidence');

CREATE POLICY "allow_read_evidence"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'visit-evidence');

CREATE POLICY "allow_delete_evidence"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'visit-evidence');

-- ─── 12. Placeholder logo note ──────────────────────────────
-- Simpan file logo Bank Mandiri sebagai:
--   /public/logo-mandiri.png   → digunakan di Header & favicon
--   /public/favicon.svg        → fallback favicon SVG
-- Format rekomendasi: PNG transparan 64x64px atau 128x128px
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  COUNT(*)                                         AS total,
  COUNT(*) FILTER (WHERE followup = 'Sudah')       AS sudah_fu,
  COUNT(*) FILTER (WHERE followup = 'Belum')       AS belum_fu,
  COUNT(*) FILTER (WHERE hasil_fu = 'berminat')    AS berminat,
  COUNT(*) FILTER (WHERE hasil_fu = 'Tidak Berminat') AS tidak_berminat,
  COUNT(*) FILTER (WHERE hasil_fu = 'pikir-pikir dulu') AS pikir_pikir,
  COUNT(*) FILTER (WHERE edc_mandiri = true)       AS edc_mandiri,
  COALESCE(SUM(potensi_nominal), 0)                AS total_nominal,
  ROUND(
    COUNT(*) FILTER (WHERE followup = 'Sudah') * 100.0 / NULLIF(COUNT(*), 0), 1
  )                                                AS progress_pct,
  ROUND(
    COUNT(*) FILTER (WHERE hasil_fu = 'berminat') * 100.0
    / NULLIF(COUNT(*) FILTER (WHERE followup = 'Sudah'), 0), 1
  )                                                AS conversion_pct
FROM merchants;

-- ─── 11. View: per-PIC summary ───────────────────────────────
CREATE OR REPLACE VIEW v_pic_summary AS
SELECT
  COALESCE(pic, 'Belum Ditentukan')               AS pic,
  COUNT(*)                                         AS total,
  COUNT(*) FILTER (WHERE followup = 'Sudah')       AS sudah,
  COUNT(*) FILTER (WHERE hasil_fu = 'berminat')    AS berminat,
  ROUND(
    COUNT(*) FILTER (WHERE followup = 'Sudah') * 100.0 / NULLIF(COUNT(*), 0), 1
  )                                                AS progress_pct
FROM merchants
GROUP BY COALESCE(pic, 'Belum Ditentukan')
ORDER BY sudah DESC;
