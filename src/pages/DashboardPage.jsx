import React, { useEffect, useRef } from 'react'
import {
  Store, CheckCircle2, Clock, TrendingUp, XCircle,
  ThumbsUp, HelpCircle, CreditCard, DollarSign, Users,
  RefreshCw, AlertTriangle,
} from 'lucide-react'
import { useDashboard } from '../hooks/useMerchants'
import Header from '../components/Header'
import { ProgressBar, MultiSegmentProgress } from '../components/ProgressBar'
import { formatCompact } from '../lib/utils'

function StatCard({ icon: Icon, label, value, sub, color = 'var(--mandiri-navy)', bg }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 500, marginBottom: 4 }}>{label}</p>
          <p style={{ fontSize: '1.625rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 3 }}>{sub}</p>}
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: bg || `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 28, width: '40%', marginBottom: 4 }} />
      <div className="skeleton" style={{ height: 11, width: '50%' }} />
    </div>
  )
}

function PICLeaderboard({ picStats }) {
  const entries = Object.entries(picStats)
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.sudah - a.sudah)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {entries.map((pic, i) => {
        const pct = pic.total > 0 ? Math.round((pic.sudah / pic.total) * 100) : 0
        const conv = pic.sudah > 0 ? Math.round((pic.berminat / pic.sudah) * 100) : 0
        return (
          <div key={pic.name} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0',
            borderBottom: i < entries.length - 1 ? '1px solid var(--gray-100)' : 'none',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: i === 0 ? 'var(--mandiri-yellow)' : 'var(--gray-200)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.875rem',
              color: i === 0 ? 'var(--mandiri-navy)' : 'var(--gray-600)',
              flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-800)' }}>
                  {pic.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  {pic.sudah}/{pic.total} FU
                </span>
              </div>
              <ProgressBar value={pic.sudah} max={pic.total} height={6} />
              <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--gray-400)' }}>{pct}% selesai</span>
                {conv > 0 && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--status-berminat)', fontWeight: 600 }}>
                    · {conv}% konversi
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const { stats, loading, error, refetch } = useDashboard()
  const heroRef = useRef()

  useEffect(() => {
    if (stats && heroRef.current) {
      // Trigger progress animation
      const fills = heroRef.current.querySelectorAll('.progress-fill')
      fills.forEach(el => {
        el.style.width = '0%'
        setTimeout(() => {
          el.style.width = el.dataset.target || el.style.width
        }, 100)
      })
    }
  }, [stats])

  return (
    <div className="page">
      <Header
        title="TJD Merchant Monitor"
        subtitle="Dashboard Monitoring Follow-Up"
        right={
          <button
            onClick={refetch}
            className="btn btn-ghost btn-sm"
            style={{ color: '#fff', padding: 8, borderRadius: 8 }}
          >
            <RefreshCw size={16} />
          </button>
        }
      />

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Hero Progress Card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--mandiri-navy) 0%, var(--mandiri-blue-light) 100%)',
          borderRadius: 16, padding: 20, color: '#fff',
          boxShadow: '0 8px 24px rgba(0, 63, 136, 0.25)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                Progress Follow-Up
              </p>
              {loading ? (
                <div className="skeleton" style={{ height: 36, width: 100, background: 'rgba(255,255,255,0.2)' }} />
              ) : (
                <p style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1, color: '#fff' }}>
                  {stats?.progressPercent ?? 0}
                  <span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.7 }}>%</span>
                </p>
              )}
            </div>
            <div style={{
              background: 'rgba(245, 166, 35, 0.2)', borderRadius: 12, padding: '8px 14px',
              textAlign: 'center', border: '1px solid rgba(245,166,35,0.3)',
            }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F5A623', lineHeight: 1 }}>
                {loading ? '—' : stats?.sudah ?? 0}
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)' }}>
                dari {loading ? '—' : stats?.total ?? 0}
              </p>
            </div>
          </div>

          {/* Main progress bar */}
          {loading ? (
            <div className="skeleton" style={{ height: 12, borderRadius: 99, background: 'rgba(255,255,255,0.2)' }} />
          ) : (
            <div ref={heroRef}>
              <div style={{
                height: 12, background: 'rgba(255,255,255,0.2)',
                borderRadius: 99, overflow: 'hidden',
              }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${stats?.progressPercent ?? 0}%`,
                    background: 'linear-gradient(90deg, #F5A623, #FFD166)',
                    boxShadow: '0 0 12px rgba(245,166,35,0.5)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)' }}>
                  {stats?.sudah ?? 0} sudah FU
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)' }}>
                  {stats?.belum ?? 0} belum FU
                </span>
              </div>
            </div>
          )}

          {/* Conversion rate */}
          {!loading && stats && (
            <div style={{
              marginTop: 12, paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', gap: 16,
            }}>
              <div>
                <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)' }}>Konversi Berminat</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#4ADE80' }}>
                  {stats.conversionPercent}%
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)' }}>Total Potensi</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#F5A623' }}>
                  {formatCompact(stats.totalNominal)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)' }}>EDC Mandiri</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#93C5FD' }}>
                  {stats.edcMandiri}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stat Grid */}
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {loading ? (
            Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : stats ? (
            <>
              <StatCard
                icon={CheckCircle2}
                label="Sudah FU"
                value={stats.sudah}
                sub={`${stats.progressPercent}% selesai`}
                color="var(--mandiri-blue)"
              />
              <StatCard
                icon={Clock}
                label="Belum FU"
                value={stats.belum}
                sub="Antrian FU"
                color="var(--gray-500)"
              />
              <StatCard
                icon={ThumbsUp}
                label="Berminat"
                value={stats.berminat}
                sub={`${stats.conversionPercent}% konversi`}
                color="var(--status-berminat)"
              />
              <StatCard
                icon={XCircle}
                label="Tidak Berminat"
                value={stats.tidakBerminat}
                sub="dari total FU"
                color="var(--status-tidak)"
              />
              <StatCard
                icon={HelpCircle}
                label="Pikir-Pikir"
                value={stats.pikirPikir}
                sub="Butuh follow-up lagi"
                color="var(--status-pikir)"
              />
              <StatCard
                icon={CreditCard}
                label="EDC Mandiri"
                value={stats.edcMandiri}
                sub="Terpasang"
                color="var(--mandiri-navy)"
              />
            </>
          ) : null}
        </div>

        {/* Hasil FU Breakdown */}
        {!loading && stats && (
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{
              fontSize: '0.875rem', fontWeight: 700, color: 'var(--gray-800)',
              marginBottom: 14,
            }}>
              Distribusi Hasil FU
            </h3>
            <MultiSegmentProgress
              total={stats.sudah}
              segments={[
                { label: 'Berminat', count: stats.berminat,       color: 'var(--status-berminat)' },
                { label: 'Pikir-Pikir', count: stats.pikirPikir,  color: 'var(--status-pikir)' },
                { label: 'Tidak Berminat', count: stats.tidakBerminat, color: 'var(--status-tidak)' },
              ]}
              height={12}
            />
          </div>
        )}

        {/* Potensi Nominal */}
        {!loading && stats && stats.totalNominal > 0 && (
          <div className="card" style={{
            padding: 16,
            background: 'linear-gradient(135deg, #FFFBF0, #FFF3CC)',
            border: '1px solid #F5C842',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--mandiri-yellow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <DollarSign size={22} color="var(--mandiri-navy)" />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', fontWeight: 500 }}>
                  Total Potensi Nominal
                </p>
                <p style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--mandiri-navy)' }}>
                  {formatCompact(stats.totalNominal)}
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--gray-500)' }}>
                  Dari {stats.berminat + stats.pikirPikir} merchant berpotensi
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PIC Leaderboard */}
        {!loading && stats && Object.keys(stats.picStats).length > 0 && (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Users size={16} color="var(--mandiri-navy)" />
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gray-800)' }}>
                Progress per PIC
              </h3>
            </div>
            <PICLeaderboard picStats={stats.picStats} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--status-tidak-bg)', borderRadius: 10, padding: 14,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <AlertTriangle size={16} color="var(--status-tidak)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 600, color: 'var(--status-tidak)', fontSize: '0.875rem' }}>
                Gagal memuat data
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--status-tidak)', marginTop: 2 }}>{error}</p>
              <button className="btn btn-sm" onClick={refetch} style={{
                marginTop: 8, background: 'var(--status-tidak)', color: '#fff',
              }}>Coba Lagi</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
