import { useEffect, useState } from 'react'

const R = 54
const C = 2 * Math.PI * R // ≈ 339.3

export default function ScoreCircle({ percentage, grade }) {
  const [displayed, setDisplayed] = useState(0)
  const offset = C - (displayed / 100) * C

  useEffect(() => {
    let start = null
    const duration = 1200
    const animate = (ts) => {
      if (!start) start = ts
      const elapsed = ts - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * percentage))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [percentage])

  const color = percentage >= 75 ? '#10B981' : percentage >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg width="144" height="144" viewBox="0 0 144 144" className="rotate-[-90deg]">
          <circle cx="72" cy="72" r={R} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="72" cy="72" r={R}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-800 count-up">{displayed}%</span>
          <span className="text-xs text-slate-400 font-medium">puntaje</span>
        </div>
      </div>
      <div className="text-lg font-bold" style={{ color }}>
        {grade?.emoji} {grade?.label}
      </div>
    </div>
  )
}
