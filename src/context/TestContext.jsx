import { createContext, useContext, useState, useCallback } from 'react'
import { QUESTIONS, getQuestionsByArea, shuffleArray, getQuickTestQuestions, getFullTestQuestions } from '../data/questions'

const TestContext = createContext(null)

// Real ICFES Saber 11 question distribution per session
export const ICFES_SESSIONS = [
  {
    id: 1,
    label: 'Jornada 1',
    areas: ['lectura_critica', 'matematicas'],
    minutes: 160,
    description: 'Mañana: Lectura Crítica + Matemáticas',
  },
  {
    id: 2,
    label: 'Jornada 2',
    areas: ['ciencias_naturales', 'sociales_ciudadanas', 'ingles'],
    minutes: 220,
    description: 'Tarde: Ciencias, Sociales e Inglés',
  },
]

const INIT_STATE = {
  mode: null,
  selectedArea: null,
  showFeedback: true,
  questions: [],
  answers: {},
  flagged: [],
  currentIndex: 0,
  currentSession: 1,
  startTime: null,
  endTime: null,
  isComplete: false,
}

export function TestProvider({ children }) {
  const [state, setState] = useState(INIT_STATE)

  const startTest = useCallback((mode, area = null, count = 10, showFeedback = true) => {
    let questions = []

    if (mode === 'completo') {
      // Use official ICFES counts: 41 LC + 50 MAT + 58 CN + 50 SC + 55 ING = 254
      questions = getFullTestQuestions()
    } else if (mode === 'area' && area) {
      questions = shuffleArray(getQuestionsByArea(area))
    } else if (mode === 'rapido') {
      questions = getQuickTestQuestions(area ? [area] : null, count)
    }

    setState({
      ...INIT_STATE,
      mode,
      selectedArea: area,
      showFeedback,
      questions,
      startTime: Date.now(),
    })
  }, [])

  const answerQuestion = useCallback((questionId, option) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: option },
    }))
  }, [])

  const toggleFlag = useCallback((questionId) => {
    setState(prev => {
      const flagged = prev.flagged.includes(questionId)
        ? prev.flagged.filter(id => id !== questionId)
        : [...prev.flagged, questionId]
      return { ...prev, flagged }
    })
  }, [])

  const goToQuestion = useCallback((index) => {
    setState(prev => ({ ...prev, currentIndex: index }))
  }, [])

  const nextQuestion = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, prev.questions.length - 1),
    }))
  }, [])

  const prevQuestion = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: Math.max(prev.currentIndex - 1, 0),
    }))
  }, [])

  const submitTest = useCallback(() => {
    setState(prev => ({ ...prev, isComplete: true, endTime: Date.now() }))
  }, [])

  const resetTest = useCallback(() => {
    setState(INIT_STATE)
  }, [])

  const currentQuestion = state.questions[state.currentIndex] || null
  const answeredCount = Object.keys(state.answers).length
  const progress = state.questions.length ? (answeredCount / state.questions.length) * 100 : 0

  // Determine which session a question belongs to (for full simulation)
  const getCurrentSession = (idx) => {
    if (state.mode !== 'completo') return null
    const q = state.questions[idx]
    if (!q) return null
    const session1Areas = ICFES_SESSIONS[0].areas
    return session1Areas.includes(q.area) ? 1 : 2
  }

  return (
    <TestContext.Provider value={{
      ...state,
      currentQuestion,
      answeredCount,
      progress,
      getCurrentSession,
      startTest,
      answerQuestion,
      toggleFlag,
      goToQuestion,
      nextQuestion,
      prevQuestion,
      submitTest,
      resetTest,
    }}>
      {children}
    </TestContext.Provider>
  )
}

export function useTest() {
  const ctx = useContext(TestContext)
  if (!ctx) throw new Error('useTest must be used within TestProvider')
  return ctx
}
