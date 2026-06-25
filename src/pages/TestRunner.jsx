import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTest } from '../context/TestContext'
import { useTimer } from '../hooks/useTimer'
import QuestionCard from '../components/QuestionCard'
import ProgressBar from '../components/ProgressBar'
import Timer from '../components/Timer'
import { AREAS, getAreaColor } from '../data/questions'
import { calculateScore } from '../utils/scoring'

export default function TestRunner() {
  const navigate = useNavigate()
  const test = useTest()
  const timer = useTimer()
  const [showMap, setShowMap] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!test.questions.length) {
      navigate('/seleccion')
      return
    }
    timer.start()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const q = test.currentQuestion
      if (!q) return
      const map = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', 'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D' }
      if (map[e.key]) { test.answerQuestion(q.id, map[e.key]); return }
      if (e.key === 'ArrowRight' || e.key === 'Enter') { test.nextQuestion(); return }
      if (e.key === 'ArrowLeft') { test.prevQuestion(); return }
      if (e.key === 'f' || e.key === 'F') { test.toggleFlag(q.id); return }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [test])

  if (!test.questions.length) return null

  const q = test.currentQuestion
  const isLast = test.currentIndex === test.questions.length - 1
  const answeredPct = Math.round((test.answeredCount / test.questions.length) * 100)

  const handleSubmit = () => {
    const unanswered = test.questions.length - test.answeredCount
    if (unanswered > 0) setShowConfirm(true)
    else doSubmit()
  }

  const doSubmit = () => {
    timer.pause()
    test.submitTest()
    const result = calculateScore(test.questions, test.answers)
    sessionStorage.setItem('icfes_result', JSON.stringify({
      ...result,
      mode: test.mode,
      area: test.selectedArea,
      duration: timer.seconds,
      questions: test.questions,
      answers: test.answers,
    }))
    navigate('/resultados')
  }

  const modeLabel = {
    completo: '🎯 Simulacro Completo',
    area: `📘 ${test.selectedArea ? AREAS[test.selectedArea]?.nombre : ''}`,
    rapido: '⚡ Test Rápido',
  }[test.mode]

  // Group questions by area for the map
  const areaGroups = {}
  test.questions.forEach((q, i) => {
    if (!areaGroups[q.area]) areaGroups[q.area] = []
    areaGroups[q.area].push({ q, i })
  })

  return (
    <div className="min-h-screen bg-slate-50 animate-page">
      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Mode badge */}
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg flex-shrink-0">
            {modeLabel}
          </span>

          {/* Progress */}
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1">
              <ProgressBar value={test.answeredCount} total={test.questions.length} />
            </div>
            <span className="text-xs font-mono text-slate-500 flex-shrink-0">{answeredPct}%</span>
          </div>

          {/* Timer */}
          <Timer formatted={timer.formatted} isRunning={timer.isRunning} />

          {/* Map toggle */}
          <button
            onClick={() => setShowMap(!showMap)}
            className={`p-2 rounded-lg transition-all duration-200 ${showMap ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
            title="Mapa de preguntas"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border-2 border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-all duration-200 hover:border-red-300"
          >
            Finalizar
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 flex gap-4">
        {/* ── Question ── */}
        <div className="flex-1 min-w-0">
          {q && (
            <QuestionCard
              key={q.id}
              question={q}
              selectedAnswer={test.answers[q.id]}
              showFeedback={test.showFeedback}
              onAnswer={test.answerQuestion}
              onNext={test.nextQuestion}
              onPrev={test.prevQuestion}
              canPrev={test.currentIndex > 0}
              isLast={isLast}
              onSubmit={handleSubmit}
              questionNumber={test.currentIndex + 1}
              totalQuestions={test.questions.length}
              isFlagged={test.flagged.includes(q.id)}
              onToggleFlag={test.toggleFlag}
            />
          )}
        </div>

        {/* ── Side map ── */}
        {showMap && (
          <div className="w-60 flex-shrink-0 hidden lg:block animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sticky top-36 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Mapa del test</div>

              <div className="space-y-4">
                {Object.entries(areaGroups).map(([areaId, items]) => {
                  const colors = getAreaColor(areaId)
                  const areaAnswered = items.filter(({ q: qn }) => !!test.answers[qn.id]).length
                  return (
                    <div key={areaId}>
                      <div className={`flex items-center justify-between text-xs font-semibold mb-1.5 ${colors.text}`}>
                        <span>{AREAS[areaId]?.icon} {AREAS[areaId]?.nombre}</span>
                        <span className="text-slate-400 font-normal">{areaAnswered}/{items.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {items.map(({ q: question, i }) => {
                          const answered = !!test.answers[question.id]
                          const flagged = test.flagged.includes(question.id)
                          const isCurrent = i === test.currentIndex
                          return (
                            <button
                              key={question.id}
                              onClick={() => test.goToQuestion(i)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all duration-150 active:scale-90 ${
                                isCurrent ? 'ring-2 ring-indigo-400 ring-offset-1 shadow-md ' : ''
                              }${
                                flagged   ? 'bg-amber-200 text-amber-800' :
                                answered  ? 'bg-emerald-200 text-emerald-800' :
                                'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {i + 1}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                {[
                  ['bg-emerald-200', 'Respondida'],
                  ['bg-amber-200', 'Marcada'],
                  ['bg-slate-100 border border-slate-200', 'Sin responder'],
                ].map(([bg, label]) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className={`w-4 h-4 rounded ${bg} flex-shrink-0`}></span>
                    {label}
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Finalizar test
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm dialog ── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-bounce-in">
            <div className="text-4xl text-center mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">¿Finalizar ahora?</h3>
            <p className="text-slate-500 text-sm text-center mb-5">
              Tienes <strong className="text-slate-800">{test.questions.length - test.answeredCount} preguntas sin responder</strong>.
              Se contarán como incorrectas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors active:scale-95"
              >
                Seguir respondiendo
              </button>
              <button
                onClick={doSubmit}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl transition-all hover:shadow-lg active:scale-95"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
