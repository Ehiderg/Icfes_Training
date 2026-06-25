import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(initialSeconds = 0, countDown = false) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef(null)

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback((val = initialSeconds) => {
    setIsRunning(false)
    setSeconds(val)
  }, [initialSeconds])

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (countDown && s <= 1) {
          clearInterval(intervalRef.current)
          setIsRunning(false)
          return 0
        }
        return countDown ? s - 1 : s + 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [isRunning, countDown])

  const formatted = formatTime(seconds)

  return { seconds, formatted, isRunning, start, pause, reset }
}

function formatTime(total) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = n => String(n).padStart(2, '0')
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}
