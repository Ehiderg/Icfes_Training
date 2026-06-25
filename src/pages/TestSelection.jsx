import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { AREAS, QUESTIONS, getQuestionsByArea, getAreaColor, FULL_TEST_COUNTS } from '../data/questions'
import { useTest } from '../context/TestContext'

const AREA_LIST = Object.values(AREAS)

export default function TestSelection() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { startTest } = useTest()

  const defaultMode = searchParams.get('mode') || 'completo'
  const defaultArea = searchParams.get('area') || null

  const [mode, setMode] = useState(defaultMode)
  const [selectedArea, setSelectedArea] = useState(defaultArea)
  const [quickCount, setQuickCount] = useState(10)
  const [showFeedback, setShowFeedback] = useState(true)

  const COMPLETO_COUNT = Object.values(FULL_TEST_COUNTS).reduce((a, b) => a + b, 0) // 254
  const areaCount = selectedArea ? getQuestionsByArea(selectedArea).length : 0
  const totalCount = mode === 'completo' ? COMPLETO_COUNT : mode === 'area' ? areaCount : quickCount
  const estimatedMin = mode === 'rapido' ? `~${Math.ceil(quickCount * 1.5)} min` : mode === 'area' ? '~40 min' : '~270 min'

  const handleStart = () => {
    if (mode === 'area' && !selectedArea) return
    startTest(mode, selectedArea, quickCount, showFeedback)
    navigate('/test')
  }

  const modeOptions = [
    { id: 'completo', label: 'Simulacro\nCompleto', icon: '🎯', count: COMPLETO_COUNT, from: '#4f46e5', to: '#7c3aed' },
    { id: 'area',    label: 'Test por\nÁrea',      icon: '📘', count: selectedArea ? areaCount : '—', from: '#059669', to: '#0d9488' },
    { id: 'rapido',  label: 'Test\nRápido',        icon: '⚡', count: quickCount, from: '#d97706', to: '#dc2626' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-10 px-4 animate-page">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 stagger-1">
          <Link_Back />
          <h1 className="text-2xl font-extrabold text-slate-800 mb-1 mt-3">Configura tu práctica</h1>
          <p className="text-slate-400 text-sm">Elige el modo y empieza a practicar</p>
        </div>

        {/* Mode selector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm stagger-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tipo de test</div>
          <div className="grid grid-cols-3 gap-3">
            {modeOptions.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 active:scale-95 ${
                  mode === m.id ? 'border-indigo-400 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md transition-transform duration-200 ${mode === m.id ? 'scale-110' : ''}`}
                  style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to})` }}
                >
                  {m.icon}
                </div>
                <span className={`text-xs font-bold text-center whitespace-pre-line leading-tight ${mode === m.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                  {m.label}
                </span>
                <span className={`text-xs font-mono font-semibold ${mode === m.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {m.count} preg.
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Area selector */}
        {(mode === 'area' || mode === 'rapido') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm animate-slide-up">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              {mode === 'area' ? 'Área de estudio *' : 'Área (opcional)'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {mode === 'rapido' && (
                <AreaBtn
                  label="Todas las áreas"
                  emoji="🌐"
                  count={QUESTIONS.length}
                  selected={!selectedArea}
                  onClick={() => setSelectedArea(null)}
                  color="bg-slate-100 text-slate-600"
                />
              )}
              {AREA_LIST.map(area => {
                const count = getQuestionsByArea(area.id).length
                const colors = getAreaColor(area.id)
                return (
                  <AreaBtn
                    key={area.id}
                    label={area.nombre}
                    emoji={area.icon}
                    count={count}
                    selected={selectedArea === area.id}
                    onClick={() => setSelectedArea(area.id)}
                    selectedColor={colors.badge}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Quick count */}
        {mode === 'rapido' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm animate-slide-up">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Número de preguntas</div>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map(n => (
                <button
                  key={n}
                  onClick={() => setQuickCount(n)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all duration-200 active:scale-95 ${
                    quickCount === n ? 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Options */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm stagger-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Opciones</div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setShowFeedback(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${showFeedback ? 'bg-indigo-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200 ${showFeedback ? 'left-6' : 'left-1'}`} />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-700">Retroalimentación inmediata</div>
              <div className="text-xs text-slate-400">Ve si acertaste después de cada pregunta</div>
            </div>
          </label>
        </div>

        {/* Summary card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm stagger-4">
          <div className="grid grid-cols-3 gap-4 mb-5 text-center">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-0.5">Preguntas</div>
              <div className="text-xl font-extrabold text-slate-800">{totalCount}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-0.5">Tiempo est.</div>
              <div className="text-xl font-extrabold text-slate-800">{estimatedMin}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-0.5">Feedback</div>
              <div className="text-xl font-extrabold text-slate-800">{showFeedback ? 'Sí ✅' : 'No'}</div>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={mode === 'area' && !selectedArea}
            className="w-full py-4 text-base font-extrabold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
              bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700
              text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02]"
          >
            {mode === 'area' && !selectedArea ? 'Selecciona un área para continuar' : '¡Comenzar test!'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Link_Back() {
  return (
    <a href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Inicio
    </a>
  )
}

function AreaBtn({ label, emoji, count, selected, onClick, selectedColor, color }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left text-sm transition-all duration-200 active:scale-95 ${
        selected
          ? `border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm scale-105`
          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <span className="text-xl flex-shrink-0">{emoji}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-bold truncate">{label}</span>
        <span className="block text-xs text-slate-400">{count} preg.</span>
      </span>
    </button>
  )
}
