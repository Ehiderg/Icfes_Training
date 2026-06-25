import { useState, useRef, useCallback } from 'react'
import { PASSAGES, getAreaColor } from '../data/questions'
import { useParticles, ParticleLayer } from './Particles'

const OPTIONS = ['A', 'B', 'C', 'D']

export default function QuestionCard({
  question,
  selectedAnswer,
  showFeedback = false,
  onAnswer,
  onNext,
  onPrev,
  canPrev = true,
  isLast = false,
  onSubmit,
  questionNumber,
  totalQuestions,
  isFlagged,
  onToggleFlag,
}) {
  const passage = question.passageId ? PASSAGES[question.passageId] : null
  const colors = getAreaColor(question.area)
  const { particles, burst } = useParticles()
  const [animating, setAnimating] = useState(null) // 'correct' | 'wrong' | null
  const cardRef = useRef(null)
  const explanationRef = useRef(null)

  // ── Ripple effect ──
  const addRipple = (e, btn) => {
    const rect = btn.getBoundingClientRect()
    const ripple = document.createElement('span')
    const size = Math.max(rect.width, rect.height)
    ripple.className = 'ripple-effect'
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 700)
  }

  // ── Answer selection ──
  const handleSelect = useCallback((opt, e) => {
    if (showFeedback && selectedAnswer) return
    if (e?.currentTarget) addRipple(e, e.currentTarget)
    onAnswer(question.id, opt)
    if (showFeedback) {
      const isCorrect = opt === question.correct
      setAnimating(isCorrect ? 'correct' : 'wrong')
      if (isCorrect) {
        const rect = e?.currentTarget?.getBoundingClientRect()
        if (rect) burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 8)
      }
      setTimeout(() => {
        setAnimating(null)
        if (explanationRef.current) {
          explanationRef.current.classList.add('flip-reveal')
          explanationRef.current.addEventListener('animationend', () => {
            explanationRef.current?.classList.remove('flip-reveal')
          }, { once: true })
        }
      }, 500)
    }
  }, [showFeedback, selectedAnswer, question, onAnswer, burst])

  // ── Option styling ──
  const getOptionStyle = (opt) => {
    const base = 'option-btn ripple-container w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium flex items-start gap-3 cursor-pointer relative overflow-hidden'
    if (!selectedAnswer || !showFeedback) {
      return `${base} ${
        selectedAnswer === opt
          ? 'border-indigo-400 bg-indigo-50 text-indigo-800 shadow-md'
          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700'
      }`
    }
    if (opt === question.correct)
      return `${base} border-emerald-400 bg-emerald-50 text-emerald-800 shadow-emerald-100 shadow-lg ${
        animating === 'correct' && opt === selectedAnswer ? 'option-correct-anim' : ''
      }`
    if (opt === selectedAnswer)
      return `${base} border-red-400 bg-red-50 text-red-800 ${
        animating === 'wrong' ? 'option-wrong-anim' : ''
      }`
    return `${base} border-slate-200 bg-slate-50 text-slate-400 opacity-60`
  }

  const getOptBadge = (opt) => {
    const baseClass = 'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200'
    if (!selectedAnswer || !showFeedback)
      return `${baseClass} ${selectedAnswer === opt ? 'border-indigo-500 bg-indigo-500 text-white scale-110' : 'border-slate-300 text-slate-500'}`
    if (opt === question.correct) return `${baseClass} border-emerald-500 bg-emerald-500 text-white`
    if (opt === selectedAnswer)   return `${baseClass} border-red-500 bg-red-500 text-white`
    return `${baseClass} border-slate-200 text-slate-300`
  }

  const getBadgeLabel = (opt) => {
    if (!selectedAnswer || !showFeedback) return opt
    if (opt === question.correct) return '✓'
    if (opt === selectedAnswer && opt !== question.correct) return '✗'
    return opt
  }

  const diffMap = {
    fácil: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    medio: 'bg-amber-100 text-amber-700 border border-amber-200',
    difícil: 'bg-red-100 text-red-700 border border-red-200',
  }

  return (
    <div className="animate-slide-up">
      <ParticleLayer particles={particles} />
      <div className="flex flex-col lg:flex-row gap-4">

        {/* ── Passage panel ── */}
        {passage && (
          <div className="lg:w-2/5 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-5 overflow-y-auto max-h-[72vh] shadow-inner">
            <div className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${colors.text}`}>
              <span className="w-1.5 h-4 rounded-full bg-current opacity-70"></span>
              {passage.titulo}
            </div>
            <div className="passage-text whitespace-pre-line">{passage.texto}</div>
          </div>
        )}

        {/* ── Question panel ── */}
        <div
          ref={cardRef}
          className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 flex flex-wrap gap-1.5 items-center">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                {question.area.replace(/_/g, ' ').toUpperCase()}
              </span>
              {question.subarea && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{question.subarea}</span>
              )}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diffMap[question.difficulty] || 'bg-slate-100 text-slate-600'}`}>
                {question.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                {questionNumber}/{totalQuestions}
              </span>
              <button
                onClick={() => onToggleFlag(question.id)}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  isFlagged
                    ? 'bg-amber-100 text-amber-600 scale-110'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 hover:scale-110'
                }`}
                title={isFlagged ? 'Quitar marca' : 'Marcar para revisar'}
              >
                <svg className="w-4 h-4" fill={isFlagged ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V5a2 2 0 012-2h14l-4 4 4 4H5v10" />
                </svg>
              </button>
            </div>
          </div>

          {/* Competencia chip */}
          <div className="text-xs text-slate-400 italic">{question.competencia} — {question.componente}</div>

          {/* Question text */}
          <div className="text-slate-800 font-semibold text-[0.97rem] leading-relaxed whitespace-pre-line py-1 border-l-4 border-indigo-300 pl-4 bg-indigo-50/30 rounded-r-lg">
            {question.question}
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={(e) => handleSelect(opt, e)}
                className={getOptionStyle(opt)}
                disabled={showFeedback && !!selectedAnswer}
              >
                <span className={getBadgeLabel(opt) === opt
                  ? getOptBadge(opt)
                  : `${getOptBadge(opt)} text-base`}>
                  {getBadgeLabel(opt)}
                </span>
                <span className="leading-snug flex-1">{question.options[opt]}</span>
              </button>
            ))}
          </div>

          {/* Feedback panel */}
          {showFeedback && selectedAnswer && (
            <div
              ref={explanationRef}
              className={`rounded-2xl p-4 border-2 text-sm animate-slide-up ${
                selectedAnswer === question.correct
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}
            >
              <div className="font-bold mb-1.5 flex items-center gap-2">
                <span className="text-lg">{selectedAnswer === question.correct ? '🎉' : '💡'}</span>
                {selectedAnswer === question.correct
                  ? '¡Correcto! Muy bien.'
                  : `Incorrecto — La respuesta correcta es ${question.correct}`}
              </div>
              <div className="opacity-90 leading-relaxed">{question.explanation}</div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-100">
            <button
              onClick={onPrev}
              disabled={!canPrev}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>

            {isLast ? (
              <button
                onClick={onSubmit}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-105 active:scale-95 pulse-glow"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Finalizar test
              </button>
            ) : (
              <button
                onClick={onNext}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              >
                Siguiente
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
