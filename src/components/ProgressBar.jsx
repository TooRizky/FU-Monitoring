import React, { useEffect, useRef } from 'react'

export function ProgressBar({ value = 0, max = 100, color, height = 8, label, showPercent = false }) {
  const fillRef = useRef(null)
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0

  useEffect(() => {
    if (fillRef.current) {
      fillRef.current.style.width = `${pct}%`
    }
  }, [pct])

  return (
    <div>
      {(label || showPercent) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 4,
        }}>
          {label && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--gray-600)', fontWeight: 500 }}>
              {label}
            </span>
          )}
          {showPercent && (
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--mandiri-navy)' }}>
              {pct}%
            </span>
          )}
        </div>
      )}
      <div
        className="progress-bar"
        style={{ height }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          ref={fillRef}
          className="progress-fill"
          style={{
            width: 0,
            background: color || undefined,
          }}
        />
      </div>
    </div>
  )
}

export function MultiSegmentProgress({ segments, total, height = 10 }) {
  // segments: [{label, count, color}]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        height,
        display: 'flex',
        borderRadius: 99,
        overflow: 'hidden',
        background: 'var(--gray-200)',
      }}>
        {segments.map((seg, i) => {
          const pct = total > 0 ? (seg.count / total) * 100 : 0
          if (pct === 0) return null
          return (
            <div
              key={i}
              style={{
                width: `${pct}%`,
                background: seg.color,
                transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {segments.map((seg, i) => {
          const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                {seg.label} <strong>{seg.count}</strong> ({pct}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
