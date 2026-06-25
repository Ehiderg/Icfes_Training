import { AREAS } from '../data/questions'

// ─────────────────────────────────────────────────────────────
// Fórmula ICFES Saber 11 oficial
// Cada área tiene puntaje 0-100 (basado en % de correctas)
// Puntaje global = (LC×3 + MAT×3 + CN×3 + SC×3 + ING×1) / 13 × 5
// Máximo: 1300/1300 × 500 = 500
// Inglés pesa 1/13 del total, cada otra área pesa 3/13
// ─────────────────────────────────────────────────────────────

const AREA_WEIGHTS = {
  lectura_critica:    3,
  matematicas:        3,
  ciencias_naturales: 3,
  sociales_ciudadanas:3,
  ingles:             1,
}

const MAX_WEIGHT = Object.values(AREA_WEIGHTS).reduce((a, b) => a + b, 0) // = 13

export function calculateScore(questions, answers) {
  if (!questions.length) return null

  let totalCorrect = 0
  const byArea = {}
  const byCompetencia = {}
  const wrongQuestions = []
  const correctQuestions = []

  questions.forEach(q => {
    const userAnswer = answers[q.id]
    const isCorrect = userAnswer === q.correct

    if (!byArea[q.area]) {
      byArea[q.area] = { total: 0, correct: 0, nombre: AREAS[q.area]?.nombre || q.area }
    }
    byArea[q.area].total++

    if (!byCompetencia[q.competencia]) {
      byCompetencia[q.competencia] = { total: 0, correct: 0, area: q.area }
    }
    byCompetencia[q.competencia].total++

    if (isCorrect) {
      byArea[q.area].correct++
      byCompetencia[q.competencia].correct++
      totalCorrect++
      correctQuestions.push(q)
    } else {
      wrongQuestions.push({ ...q, userAnswer })
    }
  })

  const totalQuestions = questions.length
  const overallPct = Math.round((totalCorrect / totalQuestions) * 100)

  // Per-area score: 0-100 (percentage)
  const areaScores = Object.entries(byArea).map(([areaId, data]) => {
    const pct = Math.round((data.correct / data.total) * 100)
    return {
      areaId,
      nombre: data.nombre,
      correct: data.correct,
      total: data.total,
      percentage: pct,
      icfesScore: pct,
      weight: AREA_WEIGHTS[areaId] ?? 1,
    }
  })

  // Global ICFES score (only meaningful with all 5 areas)
  const allAreas = new Set(areaScores.map(a => a.areaId))
  const hasAllAreas = Object.keys(AREA_WEIGHTS).every(a => allAreas.has(a))

  let globalIcfes = null
  if (hasAllAreas) {
    const weightedSum = areaScores.reduce((sum, a) => sum + a.percentage * a.weight, 0)
    globalIcfes = Math.round((weightedSum / (MAX_WEIGHT * 100)) * 500)
  }

  return {
    totalCorrect,
    totalQuestions,
    percentage: overallPct,
    globalIcfes,        // 0-500 only when all 5 areas present, else null
    hasAllAreas,
    areaScores,
    byCompetencia,
    wrongQuestions,
    correctQuestions,
    grade: getGrade(overallPct),
  }
}

function getGrade(pct) {
  if (pct >= 90) return { label: 'Excelente', color: 'text-emerald-500', emoji: '🏆' }
  if (pct >= 75) return { label: 'Muy bien', color: 'text-blue-500', emoji: '⭐' }
  if (pct >= 60) return { label: 'Bien', color: 'text-yellow-500', emoji: '👍' }
  if (pct >= 45) return { label: 'Regular', color: 'text-orange-500', emoji: '📖' }
  return { label: 'Necesitas practicar más', color: 'text-red-500', emoji: '💪' }
}

export function getRecommendations(areaScores) {
  const recs = []
  areaScores.forEach(({ areaId, nombre, percentage }) => {
    if (percentage < 50) {
      recs.push({ area: nombre, areaId, priority: 'alta', icon: '🔴',
        message: `Tu puntaje en ${nombre} es ${percentage}/100. Dedica al menos 1 hora diaria a reforzar esta área.` })
    } else if (percentage < 70) {
      recs.push({ area: nombre, areaId, priority: 'media', icon: '🟡',
        message: `En ${nombre} tienes ${percentage}/100. Repasa los temas donde más fallaste.` })
    } else if (percentage < 85) {
      recs.push({ area: nombre, areaId, priority: 'baja', icon: '🟢',
        message: `¡Buen trabajo en ${nombre} (${percentage}/100)! Sigue practicando para llegar al 90+.` })
    }
  })
  recs.sort((a, b) => ({ alta: 0, media: 1, baja: 2 }[a.priority] - { alta: 0, media: 1, baja: 2 }[b.priority]))
  return recs
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = n => String(n).padStart(2, '0')
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`
  if (m > 0) return `${m}m ${pad(s)}s`
  return `${s}s`
}
