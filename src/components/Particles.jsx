import { useEffect, useState } from 'react'

const EMOJIS = ['⭐', '✨', '🎉', '🏆', '💡', '🎯', '🌟', '✅']

export function useParticles() {
  const [particles, setParticles] = useState([])

  const burst = (x, y, count = 8) => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 60,
      y: y + (Math.random() - 0.5) * 30,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    }))
    setParticles(prev => [...prev, ...newParticles])
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(n => n.id === p.id)))
    }, 1100)
  }

  return { particles, burst }
}

export function ParticleLayer({ particles }) {
  return (
    <>
      {particles.map(p => (
        <span
          key={p.id}
          className="particle"
          style={{ left: p.x, top: p.y }}
        >
          {p.emoji}
        </span>
      ))}
    </>
  )
}
