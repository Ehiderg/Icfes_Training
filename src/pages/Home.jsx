import { Link } from 'react-router-dom'
import { useRef, useEffect, useState } from 'react'
import { AREAS, QUESTIONS } from '../data/questions'
import { getHistory, getGoal } from '../utils/history'

const MODES = [
  {
    id: 'completo',
    title: 'Simulacro Completo',
    subtitle: 'ICFES oficial',
    description: 'Todas las áreas del Saber 11: Lectura Crítica, Matemáticas, Ciencias, Sociales e Inglés.',
    icon: '🎯',
    badge: `${QUESTIONS.length} preguntas`,
    from: '#4f46e5', to: '#7c3aed',
    params: '?mode=completo',
    delay: 'stagger-1',
  },
  {
    id: 'area',
    title: 'Test por Área',
    subtitle: 'Entrenamiento enfocado',
    description: 'Practica una asignatura a fondo. Perfecto para reforzar tus puntos débiles.',
    icon: '📘',
    badge: 'Por asignatura',
    from: '#059669', to: '#0d9488',
    params: '?mode=area',
    delay: 'stagger-2',
  },
  {
    id: 'rapido',
    title: 'Test Rápido',
    subtitle: '~15 min',
    description: 'Un reto corto de 10 preguntas aleatorias. Ideal para calentar antes de estudiar.',
    icon: '⚡',
    badge: '10 preguntas',
    from: '#d97706', to: '#dc2626',
    params: '?mode=rapido',
    delay: 'stagger-3',
  },
]

function Card3D({ children, className = '' }) {
  const ref = useRef(null)

  const handleMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const rx = ((y - cy) / cy) * -10
    const ry = ((x - cx) / cx) * 10
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`
  }

  const handleLeave = () => {
    if (ref.current) {
      ref.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    }
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`card-3d ${className}`}
    >
      {children}
    </div>
  )
}

export default function Home() {
  const areaList = Object.values(AREAS).map(a => ({
    ...a,
    count: QUESTIONS.filter(q => q.area === a.id).length,
  }))
  const totalQ = QUESTIONS.length
  const [history, setHistory] = useState([])
  const goal = getGoal()

  useEffect(() => {
    setHistory(getHistory().filter(h => h.globalIcfes != null))
  }, [])

  const bestScore = history.length ? Math.max(...history.map(h => h.globalIcfes)) : null
  const lastScore = history.length ? history[history.length - 1].globalIcfes : null
  const prevScore = history.length >= 2 ? history[history.length - 2].globalIcfes : null
  const delta = lastScore !== null && prevScore !== null ? lastScore - prevScore : null

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ── Hero ── */}
      <div className="animated-gradient py-20 px-4 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="animate-bounce-in">
            <div className="inline-flex items-center gap-2 glass text-white/90 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Plataforma de entrenamiento ICFES · Saber 11
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight tracking-tight">
              Supera el<br />
              <span className="text-yellow-300">ICFES Saber 11</span>
            </h1>

            <p className="text-white/75 text-lg max-w-lg mx-auto leading-relaxed mb-8">
              Más de <strong className="text-white">{totalQ} preguntas</strong> estilo ICFES con retroalimentación inmediata, análisis de habilidades y ruta personalizada de mejora.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              {[
                { v: totalQ + '+', l: 'Preguntas' },
                { v: '5', l: 'Áreas' },
                { v: '3', l: 'Modos' },
                { v: '100%', l: 'Gratis' },
              ].map(s => (
                <div key={s.l} className="glass text-white px-4 py-2 rounded-xl text-sm">
                  <span className="font-extrabold text-lg text-yellow-300">{s.v}</span>
                  <span className="ml-1.5 text-white/70">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress summary ── */}
      {history.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 mt-6 animate-fade-in">
          <div className="bg-white border border-indigo-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Tu progreso</div>
                <div className="text-base font-extrabold text-slate-800">{history.length} simulacro{history.length !== 1 ? 's' : ''} completado{history.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <div className="flex gap-5 flex-wrap flex-1">
              <div className="text-center">
                <div className="text-2xl font-black text-indigo-700">{lastScore}<span className="text-sm text-slate-400">/500</span></div>
                <div className="text-xs text-slate-400">Último resultado</div>
                {delta !== null && (
                  <div className={`text-xs font-bold ${delta >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                    {delta >= 0 ? `▲ +${delta}` : `▼ ${delta}`}
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-slate-800">{bestScore}<span className="text-sm text-slate-400">/500</span></div>
                <div className="text-xs text-slate-400">Mejor puntaje</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-amber-600">{goal}<span className="text-sm text-slate-400">/500</span></div>
                <div className="text-xs text-slate-400">Tu meta</div>
              </div>
            </div>

            {/* Mini goal bar */}
            <div className="flex-1 min-w-[180px]">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{lastScore}</span>
                <span className="font-semibold text-amber-600">Meta {goal}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min((lastScore / 500) * 100, 100)}%`,
                    background: lastScore >= goal ? '#10b981' : 'linear-gradient(90deg,#6366f1,#a855f7)',
                  }}
                />
                <div className="absolute top-0 h-full w-0.5 bg-amber-400" style={{ left: `${(goal / 500) * 100}%` }} />
              </div>
              <div className="text-xs mt-1 text-center">
                {lastScore >= goal
                  ? <span className="text-emerald-600 font-bold">🎉 ¡Meta alcanzada!</span>
                  : <span className="text-slate-500">Faltan <strong>{goal - lastScore} pts</strong> para tu meta</span>
                }
              </div>
            </div>

            <Link
              to="/resultados"
              className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors active:scale-95"
            >
              Ver historial
            </Link>
          </div>
        </div>
      )}

      {/* ── Mode cards ── */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MODES.map(mode => (
            <Link key={mode.id} to={`/seleccion${mode.params}`} className={`block ${mode.delay}`}>
              <Card3D className="h-full">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full flex flex-col hover:border-indigo-300 transition-colors duration-300 shadow-sm hover:shadow-xl">
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${mode.from}, ${mode.to})` }}
                  >
                    {mode.icon}
                  </div>

                  <div className="text-xs font-semibold uppercase tracking-widest mb-1"
                    style={{ color: mode.from }}>
                    {mode.subtitle}
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 mb-2">{mode.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed flex-1">{mode.description}</p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                      {mode.badge}
                    </span>
                    <span className="text-sm font-semibold flex items-center gap-1 transition-transform duration-200 group-hover:translate-x-1"
                      style={{ color: mode.from }}>
                      Empezar
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Card3D>
            </Link>
          ))}
        </div>

        {/* ── Historial link ── */}
        <div className="mt-4 stagger-4">
          <Link to="/resultados">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 group shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-2xl shadow-md flex-shrink-0">
                📊
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Seguimiento</div>
                <div className="font-bold text-slate-800">Mi historial de simulacros</div>
                <div className="text-sm text-slate-400 truncate">
                  {history.length > 0
                    ? `${history.length} simulacro${history.length !== 1 ? 's' : ''} · Mejor: ${Math.max(...history.map(h => h.globalIcfes))}/500`
                    : 'Evolución de puntajes, análisis de áreas y coach de mejora'}
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* ── Areas grid ── */}
        <div className="mt-10 stagger-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Practica por asignatura</h2>
            <span className="text-xs text-slate-400">{totalQ} preguntas en total</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {areaList.map((a, i) => (
              <Link
                key={a.id}
                to={`/seleccion?mode=area&area=${a.id}`}
                className={`stagger-${Math.min(i + 1, 5)}`}
              >
                <Card3D>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center hover:border-indigo-200 hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <div className="text-3xl mb-2">{a.icon}</div>
                    <div className="text-xs font-bold text-slate-700 leading-tight mb-1">{a.nombre}</div>
                    <div className="text-xs text-slate-400">{a.count} preguntas</div>
                    <div className={`mt-2 h-1 rounded-full bg-gradient-to-r`}
                      style={{
                        background: {
                          lectura_critica: 'linear-gradient(90deg,#10b981,#34d399)',
                          matematicas: 'linear-gradient(90deg,#3b82f6,#60a5fa)',
                          ciencias_naturales: 'linear-gradient(90deg,#8b5cf6,#a78bfa)',
                          sociales_ciudadanas: 'linear-gradient(90deg,#f59e0b,#fcd34d)',
                          ingles: 'linear-gradient(90deg,#ef4444,#f87171)',
                        }[a.id]
                      }} />
                  </div>
                </Card3D>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Tips section ── */}
        <div className="mt-10 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
          <h2 className="text-base font-bold text-slate-800 mb-3">¿Cómo sacarle el máximo?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['🎯', 'Haz el simulacro completo para ver tu puntaje global.'],
              ['📘', 'Usa el test por área para profundizar donde más fallas.'],
              ['⚡', 'El test rápido es perfecto como repaso diario de 15 min.'],
              ['📊', 'Revisa los errores al final — ahí está el verdadero aprendizaje.'],
            ].map(([icon, tip]) => (
              <div key={tip} className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className="text-lg flex-shrink-0">{icon}</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
