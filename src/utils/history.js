const STORAGE_KEY = 'icfes_history_v2'
const GOAL_KEY = 'icfes_goal'
const DEFAULT_GOAL = 380

export function getGoal() {
  const stored = localStorage.getItem(GOAL_KEY)
  return stored ? parseInt(stored, 10) : DEFAULT_GOAL
}

export function setGoal(g) {
  localStorage.setItem(GOAL_KEY, String(g))
}

export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveAttempt(result) {
  const history = getHistory()
  const entry = {
    id: `${Date.now()}`,
    date: new Date().toISOString(),
    mode: result.mode,
    globalIcfes: result.globalIcfes ?? null,
    percentage: result.percentage,
    areaScores: (result.areaScores || []).map(a => ({
      areaId: a.areaId,
      nombre: a.nombre,
      percentage: a.percentage,
      weight: a.weight ?? 1,
    })),
    totalCorrect: result.totalCorrect,
    totalQuestions: result.totalQuestions,
    duration: result.duration ?? null,
  }
  // Avoid duplicate if same session storage result was already saved
  const last = history[history.length - 1]
  if (last && last.date === entry.date) return history
  history.push(entry)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch { /* storage full */ }
  return history
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY)
}

// Returns what delta is needed per area to hit the goal
// Assumes full-5-area scoring formula: (3×LC+3×M+3×CN+3×SC+1×I)/13×5 = goal
export function analyzeGap(areaScores, goal = DEFAULT_GOAL) {
  if (!areaScores?.length) return null

  const MAX_WEIGHT = 13
  const neededWeighted = (goal / 500) * MAX_WEIGHT * 100
  const currentWeighted = areaScores.reduce((sum, a) => sum + a.percentage * (a.weight ?? 1), 0)
  const gap = Math.max(0, neededWeighted - currentWeighted)

  if (gap === 0) return { achieved: true, gap: 0, suggestions: [] }

  const suggestions = areaScores
    .map(a => {
      const w = a.weight ?? 1
      const room = (100 - a.percentage) * w
      return { ...a, room, weightedGainPer10: w * 10 }
    })
    .filter(a => a.percentage < 100)
    .sort((a, b) => b.room - a.room)

  return {
    achieved: false,
    gap: Math.round(gap),
    currentWeighted: Math.round(currentWeighted),
    neededWeighted: Math.round(neededWeighted),
    suggestions,
  }
}

// Generates the personalized coach message for reaching the goal
// byCompetencia: { [competencia]: { total, correct, area } }
export function generateCoachMessage(areaScores, byCompetencia, goal = DEFAULT_GOAL) {
  if (!areaScores?.length) return null

  const gap = analyzeGap(areaScores, goal)
  if (!gap) return null

  if (gap.achieved) {
    return { achieved: true, lines: ['🎉 ¡Ya alcanzaste tu meta! Ahora apunta más alto.'] }
  }

  // Find weak competencias per area
  const weakByArea = {}
  if (byCompetencia) {
    Object.entries(byCompetencia).forEach(([competencia, data]) => {
      const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 100
      if (pct < 60) {
        if (!weakByArea[data.area]) weakByArea[data.area] = []
        weakByArea[data.area].push({ competencia, pct, correct: data.correct, total: data.total })
      }
    })
    Object.keys(weakByArea).forEach(a => {
      weakByArea[a].sort((x, y) => x.pct - y.pct)
    })
  }

  const lines = []
  const topAreas = gap.suggestions.slice(0, 3)

  topAreas.forEach((a, i) => {
    const w = a.weight ?? 1
    const pointsNeeded = Math.ceil(gap.gap / w)
    const realGain = Math.min(pointsNeeded, 100 - a.percentage)
    const weakConcepts = weakByArea[a.areaId] || []
    const conceptList = weakConcepts.slice(0, 2).map(c => c.competencia).join(' y ')

    let line = `${i === 0 ? '🔴' : i === 1 ? '🟡' : '🟢'} **${a.nombre}** (${a.percentage}/100)`
    line += ` → sube ${realGain} pts para ganar ${Math.round(realGain * w)} puntos ponderados`
    if (conceptList) {
      line += `. Trabaja en: ${conceptList}`
    } else {
      line += `. Sigue practicando esta área`
    }
    lines.push(line)
  })

  const extraNote = gap.suggestions.find(a => a.areaId === 'ingles' && a.percentage < 70)
  if (extraNote) {
    lines.push(`💡 Inglés solo pesa ×1, pero si está muy bajo también suma. Sube ${Math.min(20, 100 - extraNote.percentage)} pts con vocabulario y comprensión de lectura en inglés.`)
  }

  return { achieved: false, gap, lines }
}
