import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, ReferenceLine, Legend,
} from 'recharts'
import { getRecommendations, formatDuration } from '../utils/scoring'
import { saveAttempt, getHistory, getGoal, analyzeGap, generateCoachMessage } from '../utils/history'
import { AREAS, getAreaColor } from '../data/questions'
import ScoreCircle from '../components/ScoreCircle'

const AREA_COLORS = {
  lectura_critica:    '#10B981',
  matematicas:        '#3B82F6',
  ciencias_naturales: '#8B5CF6',
  sociales_ciudadanas:'#F59E0B',
  ingles:             '#EF4444',
}

function CoachCard({ coach, goal, globalIcfes }) {
  if (!coach) return null
  const achieved = coach.achieved || (globalIcfes != null && globalIcfes >= goal)

  return (
    <div className={`rounded-2xl p-5 shadow-sm border ${achieved ? 'bg-emerald-50 border-emerald-300' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl flex-shrink-0 shadow-md">
          🎓
        </div>
        <div>
          <div className="font-extrabold text-slate-800">Lo que te falta para llegar a {goal}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {achieved
              ? '¡Felicitaciones! Has alcanzado tu meta.'
              : globalIcfes != null
                ? `Tu puntaje actual: ${globalIcfes}/500 · Faltan ${goal - globalIcfes} pts`
                : 'Completa un simulacro completo para activar el análisis'}
          </div>
        </div>
      </div>

      {!achieved && coach.lines && (
        <div className="space-y-2.5 mt-1">
          {coach.lines.map((line, i) => {
            const parts = line.split(/\*\*(.*?)\*\*/)
            return (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-white/70 rounded-xl p-3 border border-white">
                <span className="leading-relaxed">
                  {parts.map((part, j) =>
                    j % 2 === 1
                      ? <strong key={j} className="text-indigo-700">{part}</strong>
                      : part
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {!achieved && globalIcfes != null && (
        <div className="mt-3 bg-white/80 rounded-xl p-3 border border-indigo-200 text-xs text-indigo-700">
          <strong>Recuerda:</strong> subir 10 pts en LC, MAT, CN o SC vale 3× más que subir 10 pts en Inglés.
          Prioriza las áreas de mayor peso.
        </div>
      )}
    </div>
  )
}
const AREA_SHORT = {
  lectura_critica:    'LC',
  matematicas:        'MAT',
  ciencias_naturales: 'CN',
  sociales_ciudadanas:'SC',
  ingles:             'ING',
}

export default function Results() {
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('resumen')
  const [visibleBars, setVisibleBars] = useState(false)
  const goal = getGoal()

  useEffect(() => {
    const raw = sessionStorage.getItem('icfes_result')
    if (raw) {
      const parsed = JSON.parse(raw)
      setResult(parsed)
      const newHistory = saveAttempt(parsed)
      setHistory(newHistory)
    } else {
      // Came from "Ver historial" on Home — load last history entry
      const hist = getHistory()
      if (!hist.length) { navigate('/'); return }
      setHistory(hist)
      // Reconstruct a partial result object from the last entry (no questions/wrongQuestions)
      const last = hist[hist.length - 1]
      setResult({
        ...last,
        wrongQuestions: [],
        hasAllAreas: last.globalIcfes != null,
        grade: null,
        totalCorrect: last.totalCorrect,
        totalQuestions: last.totalQuestions,
        percentage: last.percentage,
      })
      setActiveTab('progreso')
    }
    setTimeout(() => setVisibleBars(true), 400)
  }, [])

  if (!result) return null

  const {
    totalCorrect, totalQuestions, percentage, areaScores,
    wrongQuestions, grade, duration, mode, globalIcfes, hasAllAreas,
  } = result

  const recommendations = getRecommendations(areaScores)
  const gap = hasAllAreas ? analyzeGap(areaScores, goal) : null
  const coach = hasAllAreas ? generateCoachMessage(areaScores, result.byCompetencia, goal) : null

  // Only full-sim attempts for the progress chart
  const fullAttempts = history.filter(h => h.globalIcfes != null)
  const progressData = fullAttempts.map((h, i) => ({
    attempt: `#${i + 1}`,
    date: new Date(h.date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }),
    global: h.globalIcfes,
    ...Object.fromEntries((h.areaScores || []).map(a => [AREA_SHORT[a.areaId] || a.areaId, a.percentage])),
  }))

  const prevAttempt = fullAttempts.length >= 2 ? fullAttempts[fullAttempts.length - 2] : null
  const delta = globalIcfes != null && prevAttempt ? globalIcfes - prevAttempt.globalIcfes : null

  const radarData = areaScores.map(a => ({
    subject: AREA_SHORT[a.areaId] || a.nombre,
    score: a.percentage,
    fullMark: 100,
  }))
  const barData = areaScores.map(a => ({
    name: AREA_SHORT[a.areaId] || a.nombre,
    pct: a.percentage,
    areaId: a.areaId,
  }))
  const modeLabel = { completo: 'Simulacro Completo', area: 'Test por Área', rapido: 'Test Rápido' }[mode] || mode

  const tabs = [
    { id: 'resumen', label: '📊', full: 'Resumen' },
    { id: 'progreso', label: '📈', full: `Progreso (${fullAttempts.length})` },
    { id: 'areas', label: '🗂', full: 'Por Área' },
    { id: 'errores', label: '❌', full: `Errores (${wrongQuestions.length})` },
    { id: 'ruta', label: '🗺', full: 'Ruta' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-20 animate-page">
      {/* ── Hero ── */}
      <div className="animated-gradient py-10 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="mb-5 animate-bounce-in">
            <div className="glass inline-block px-4 py-1.5 rounded-full text-white/80 text-xs font-medium mb-3">
              {modeLabel} {duration ? `· ${formatDuration(duration)}` : ''}
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-1">¡Test completado!</h1>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 animate-fade-in">
            <ScoreCircle percentage={percentage} grade={grade} />
            <div className="grid grid-cols-2 gap-3 text-left">
              {[
                { l: 'Correctas', v: totalCorrect, icon: '✅' },
                { l: 'Incorrectas', v: totalQuestions - totalCorrect, icon: '❌' },
                { l: 'Total preguntas', v: totalQuestions, icon: '📝' },
                ...(globalIcfes != null
                  ? [{ l: 'Puntaje ICFES', v: `${globalIcfes}/500`, icon: '🏆' }]
                  : [{ l: 'Promedio', v: `${percentage}/100`, icon: '📊' }]
                ),
              ].map(s => (
                <div key={s.l} className="glass rounded-xl px-4 py-3 text-white">
                  <div className="text-xl font-extrabold">{s.icon} {s.v}</div>
                  <div className="text-white/60 text-xs">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Global score + goal progress */}
          {globalIcfes != null && (
            <div className="mt-5 glass rounded-2xl px-8 py-4 inline-block animate-slide-up">
              <div className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Puntaje Global ICFES</div>
              <div className="text-5xl font-black text-white leading-none">
                {globalIcfes}<span className="text-2xl text-white/40">/500</span>
              </div>
              {/* Goal bar */}
              <div className="mt-3 w-64 mx-auto">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>0</span>
                  <span className="font-bold text-white/80">Meta: {goal}</span>
                  <span>500</span>
                </div>
                <div className="h-2.5 bg-white/20 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.min(globalIcfes / 500 * 100, 100)}%`,
                      background: globalIcfes >= goal ? '#10B981' : 'linear-gradient(90deg,#6366f1,#a855f7)',
                    }}
                  />
                  <div
                    className="absolute top-0 h-full w-0.5 bg-yellow-300"
                    style={{ left: `${(goal / 500) * 100}%` }}
                  />
                </div>
                <div className="text-center mt-1.5 text-xs">
                  {globalIcfes >= goal
                    ? <span className="text-emerald-300 font-bold">🎉 ¡Meta alcanzada!</span>
                    : <span className="text-white/70">Faltan <strong className="text-white">{goal - globalIcfes} puntos</strong> para llegar a {goal}</span>
                  }
                </div>
              </div>
              {delta !== null && (
                <div className={`mt-2 text-xs font-semibold ${delta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {delta >= 0 ? `▲ +${delta}` : `▼ ${delta}`} pts vs. intento anterior
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm overflow-x-auto">
        <div className="max-w-4xl mx-auto px-4 flex min-w-max">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 py-3.5 px-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{t.label}</span>
              <span className="hidden sm:inline">{t.full}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── RESUMEN ── */}
        {activeTab === 'resumen' && (
          <div className="space-y-5 animate-fade-in">
            {areaScores.length > 1 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-800 mb-1">Perfil de habilidades</h2>
                <p className="text-xs text-slate-400 mb-4">Puntaje por área (0–100)</p>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Puntaje" dataKey="score" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} strokeWidth={2.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 mb-1">Puntaje por área</h2>
              <p className="text-xs text-slate-400 mb-4">Puntos 0–100 por área</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}/100`, 'Puntaje']} />
                  <Bar dataKey="pct" radius={[8, 8, 0, 0]} animationDuration={800}>
                    {barData.map((entry) => (
                      <Cell key={entry.areaId} fill={AREA_COLORS[entry.areaId] || '#6366F1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Weighted breakdown */}
            {globalIcfes != null && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-800 mb-1">Contribución al puntaje global</h2>
                <p className="text-xs text-slate-400 mb-4">Cada área aporta distinto (ING peso×1, demás peso×3)</p>
                <div className="space-y-3">
                  {areaScores.map(a => {
                    const w = a.weight ?? 1
                    const contribution = Math.round((a.percentage * w) / (13 * 100) * 500)
                    const maxContrib = Math.round((100 * w) / (13 * 100) * 500)
                    const clr = AREA_COLORS[a.areaId] || '#6366F1'
                    return (
                      <div key={a.areaId}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-700">{AREAS[a.areaId]?.icon} {a.nombre}</span>
                          <span className="font-mono text-slate-500">{contribution}/{maxContrib} pts · peso×{w}</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: visibleBars ? `${a.percentage}%` : '0%', backgroundColor: clr }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Area chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {areaScores.map(a => (
                <div key={a.areaId} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                  <div className="text-xl mb-1">{AREAS[a.areaId]?.icon}</div>
                  <div className={`text-xl font-extrabold ${
                    a.percentage >= 70 ? 'text-emerald-600' : a.percentage >= 50 ? 'text-amber-600' : 'text-red-500'
                  }`}>{a.percentage}/100</div>
                  <div className="text-xs text-slate-400">{AREAS[a.areaId]?.nombre?.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROGRESO ── */}
        {activeTab === 'progreso' && (
          <div className="space-y-5 animate-fade-in">
            {fullAttempts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-3">📈</div>
                <div className="font-bold text-slate-700">Aún no hay simulacros completos</div>
                <p className="text-slate-400 text-sm mt-2">Completa un Simulacro Completo para ver tu progreso aquí.</p>
              </div>
            ) : (
              <>
                {/* Coach message */}
                {coach && (
                  <CoachCard coach={coach} goal={goal} globalIcfes={globalIcfes} />
                )}

                {/* Meta banner */}
                <div className={`rounded-2xl p-5 shadow-sm border ${
                  (globalIcfes ?? 0) >= goal
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-indigo-50 border-indigo-200'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-0.5">Meta personal</div>
                      <div className="text-3xl font-black text-indigo-700">{goal}/500</div>
                      <div className="text-sm text-slate-500 mt-0.5">Puntaje objetivo ICFES Saber 11</div>
                    </div>
                    {globalIcfes != null && (
                      <div className="text-right">
                        <div className="text-xs text-slate-500 mb-0.5">Mejor intento</div>
                        <div className="text-3xl font-black text-slate-800">
                          {Math.max(...fullAttempts.map(h => h.globalIcfes))}
                        </div>
                        <div className="text-sm mt-0.5">
                          {(globalIcfes ?? 0) >= goal
                            ? <span className="text-emerald-600 font-bold">🎉 ¡Meta alcanzada!</span>
                            : <span className="text-indigo-600 font-semibold">Faltan {goal - Math.max(...fullAttempts.map(h => h.globalIcfes))} pts</span>
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress line chart */}
                {progressData.length >= 1 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-base font-bold text-slate-800 mb-1">Evolución del puntaje global</h2>
                    <p className="text-xs text-slate-400 mb-4">Puntaje 0–500 por simulacro · línea amarilla = meta {goal}</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={progressData} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 500]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v, name) => [name === 'global' ? `${v}/500` : `${v}/100`, name === 'global' ? 'Puntaje global' : name]} />
                        <ReferenceLine y={goal} stroke="#F59E0B" strokeDasharray="5 5" strokeWidth={2}
                          label={{ value: `Meta ${goal}`, position: 'right', fontSize: 11, fill: '#d97706' }} />
                        <Line type="monotone" dataKey="global" stroke="#6366F1" strokeWidth={3}
                          dot={{ r: 5, fill: '#6366F1' }} activeDot={{ r: 7 }} name="global" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Area evolution chart */}
                {progressData.length >= 2 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-base font-bold text-slate-800 mb-1">Evolución por área</h2>
                    <p className="text-xs text-slate-400 mb-4">Puntaje 0–100 en cada área a lo largo del tiempo</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={progressData} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                        {Object.entries(AREA_SHORT).map(([areaId, short]) => (
                          <Line key={areaId} type="monotone" dataKey={short}
                            stroke={AREA_COLORS[areaId]} strokeWidth={2}
                            dot={{ r: 4 }} name={short} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Gap analysis: what to do to hit goal */}
                {gap && !gap.achieved && (
                  <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🎯</span>
                      <h2 className="font-bold text-slate-800">¿Qué necesitas para llegar a {goal}?</h2>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                      Tu puntaje ponderado actual es <strong className="text-slate-700">{gap.currentWeighted}/1300</strong>.
                      Necesitas <strong className="text-indigo-700">{gap.neededWeighted}/1300</strong> para alcanzar {goal}.
                      Te faltan <strong className="text-red-600">{gap.gap} puntos ponderados</strong>.
                    </p>
                    <div className="space-y-3">
                      {gap.suggestions.slice(0, 4).map((s, i) => {
                        const w = s.weight ?? 1
                        // How many real points do they need in this area to close gap?
                        const pointsNeeded = Math.ceil(gap.gap / w)
                        const achievable = pointsNeeded <= (100 - s.percentage)
                        return (
                          <div key={s.areaId} className={`p-3.5 rounded-xl border ${
                            i === 0 ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-slate-50'
                          }`}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{AREAS[s.areaId]?.icon}</span>
                                <div>
                                  <div className="text-sm font-bold text-slate-800">{s.nombre}</div>
                                  <div className="text-xs text-slate-500">Puntaje actual: {s.percentage}/100 · peso×{w}</div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className={`text-sm font-bold ${achievable ? 'text-indigo-700' : 'text-slate-500'}`}>
                                  Sube {Math.min(pointsNeeded, 100 - s.percentage)} puntos aquí
                                </div>
                                <div className="text-xs text-slate-400">→ {Math.min(s.percentage + pointsNeeded, 100)}/100</div>
                              </div>
                            </div>
                            {i === 0 && (
                              <div className="mt-2 text-xs text-indigo-700 bg-indigo-100 rounded-lg px-3 py-1.5 font-medium">
                                💡 Esta área tiene más potencial: cada 10 pts aquí suma {w * 10} pts ponderados al global
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* All attempts list */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h2 className="font-bold text-slate-800 mb-3">Historial de simulacros</h2>
                  <div className="space-y-2">
                    {[...fullAttempts].reverse().map((h, i) => {
                      const d = new Date(h.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      const prevH = fullAttempts[fullAttempts.length - 2 - i]
                      const dlt = prevH ? h.globalIcfes - prevH.globalIcfes : null
                      return (
                        <div key={h.id} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                              #{fullAttempts.length - i}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-800">{h.globalIcfes}/500</div>
                              <div className="text-xs text-slate-400">{d}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {dlt !== null && (
                              <span className={`text-xs font-bold ${dlt > 0 ? 'text-emerald-600' : dlt < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                {dlt > 0 ? `▲ +${dlt}` : dlt < 0 ? `▼ ${dlt}` : '='}
                              </span>
                            )}
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${h.globalIcfes >= goal ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {h.globalIcfes >= goal ? '✅ Meta' : `${goal - h.globalIcfes} para meta`}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ÁREAS ── */}
        {activeTab === 'areas' && (
          <div className="space-y-4 animate-fade-in">
            {areaScores.map((a, i) => {
              const area = AREAS[a.areaId]
              const clr = AREA_COLORS[a.areaId] || '#6366F1'
              const w = a.weight ?? 1
              // Find area score from prev full attempt for delta
              const prevArea = prevAttempt?.areaScores?.find(x => x.areaId === a.areaId)
              const areaDelta = prevArea ? a.percentage - prevArea.percentage : null
              return (
                <div key={a.areaId} className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm stagger-${Math.min(i+1,5)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{area?.icon}</span>
                      <div>
                        <div className="font-bold text-slate-800">{a.nombre}</div>
                        <div className="text-xs text-slate-400">{a.correct} de {a.total} correctas · peso×{w}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-extrabold" style={{ color: clr }}>{a.percentage}</div>
                      <div className="text-xs text-slate-400">de 100</div>
                      {areaDelta !== null && (
                        <div className={`text-xs font-bold ${areaDelta >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                          {areaDelta >= 0 ? `▲ +${areaDelta}` : `▼ ${areaDelta}`} vs anterior
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: visibleBars ? `${a.percentage}%` : '0%', backgroundColor: clr }}
                    />
                  </div>
                  {area?.competencias && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {area.competencias.map(c => (
                        <span key={c} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── ERRORES ── */}
        {activeTab === 'errores' && (
          <div className="space-y-4 animate-fade-in">
            {wrongQuestions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-3 animate-bounce-in">🏆</div>
                <div className="text-xl font-bold text-slate-800">¡Sin errores!</div>
                <p className="text-slate-400 text-sm mt-2">Perfección total. Eso es lo que queremos ver.</p>
              </div>
            ) : (
              wrongQuestions.map((q, idx) => {
                const colors = getAreaColor(q.area)
                return (
                  <div key={q.id} className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm stagger-${Math.min(idx+1,5)}`}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                        {AREAS[q.area]?.nombre}{q.subarea ? ` · ${q.subarea}` : ''}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Error #{idx + 1}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mb-3 leading-relaxed border-l-4 border-red-200 pl-3 whitespace-pre-line">{q.question}</p>
                    <div className="space-y-1.5 mb-3">
                      {Object.entries(q.options).map(([opt, text]) => (
                        <div key={opt} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${
                          opt === q.correct ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200' :
                          opt === q.userAnswer ? 'bg-red-50 text-red-700 border border-red-200' :
                          'text-slate-400'
                        }`}>
                          <span className="font-bold flex-shrink-0 w-4">{opt}.</span>
                          <span className="flex-1">{text}</span>
                          {opt === q.correct && <span className="ml-auto text-emerald-600">✅</span>}
                          {opt === q.userAnswer && opt !== q.correct && <span className="ml-auto text-red-500">✗</span>}
                        </div>
                      ))}
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                      <div className="text-xs font-bold text-indigo-700 mb-1">📖 Explicación</div>
                      <p className="text-xs text-indigo-800 leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── RUTA ── */}
        {activeTab === 'ruta' && (
          <div className="space-y-4 animate-fade-in">
            {coach && <CoachCard coach={coach} goal={goal} globalIcfes={globalIcfes} />}

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-1">Tu ruta personalizada</h2>
              <p className="text-sm text-slate-400 mb-4">Prioridades según tus resultados de hoy</p>
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🌟</div>
                  <div className="font-bold text-slate-800">¡Excelente en todas las áreas!</div>
                  <p className="text-slate-400 text-sm mt-1">Mantén la práctica constante.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((r, i) => (
                    <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${
                      r.priority === 'alta' ? 'bg-red-50 border-red-200' :
                      r.priority === 'media' ? 'bg-amber-50 border-amber-200' :
                      'bg-emerald-50 border-emerald-200'
                    } stagger-${Math.min(i+1,5)}`}>
                      <span className="text-2xl">{r.icon}</span>
                      <div>
                        <div className="font-bold text-sm text-slate-800">{r.area}</div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{r.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Goal targets */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-3">🎯 Metas de referencia</h2>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                {[
                  { label: 'Básico', pts: 250, desc: 'Acceso general', color: 'text-slate-600' },
                  { label: 'Tu meta', pts: goal, desc: 'Objetivo personal', color: 'text-indigo-700' },
                  { label: 'Top', pts: 430, desc: 'Mejores universidades', color: 'text-purple-700' },
                ].map(m => (
                  <div key={m.label} className={`bg-white rounded-xl p-3 border ${(globalIcfes ?? 0) >= m.pts ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
                    <div className={`text-lg font-extrabold ${(globalIcfes ?? 0) >= m.pts ? 'text-emerald-600' : m.color}`}>{m.pts}</div>
                    <div className="font-semibold text-slate-700">{m.label}</div>
                    <div className="text-slate-400">{m.desc}</div>
                    {(globalIcfes ?? 0) >= m.pts && <div className="text-emerald-500 mt-1">✅</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-3">📌 Consejos para el ICFES</h2>
              <div className="space-y-2.5">
                {[
                  ['📅', 'Haz simulacros completos 2 veces por semana en las últimas semanas.'],
                  ['⏱', 'En el examen real tienes ~1.5 min por pregunta. Practica velocidad.'],
                  ['📌', 'No dejes preguntas en blanco — descarta y arriesga entre las plausibles.'],
                  ['💡', 'En Lectura Crítica, lee primero las preguntas, luego el texto.'],
                  ['🧮', 'En Matemáticas: domina geometría básica y fracciones.'],
                  ['🔬', 'En Ciencias, Física y Química aportan más preguntas que Biología.'],
                  ['🌍', 'En Sociales, la Constitución del 91 es la fuente más frecuente.'],
                  ['🇬🇧', 'Inglés vale solo ×1: si el tiempo aprieta, respóndelo primero y rápido.'],
                ].map(([emoji, tip]) => (
                  <div key={tip} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="text-base flex-shrink-0">{emoji}</span>
                    <span className="leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link to="/seleccion" className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-center rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95">
            Nuevo test
          </Link>
          <Link to="/" className="flex-1 py-3.5 border-2 border-slate-200 text-slate-700 font-semibold text-center rounded-xl hover:bg-slate-50 transition-all hover:border-slate-300 active:scale-95">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
