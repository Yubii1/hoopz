// src/hooks/useGameLoop.js
import { useEffect, useRef, useCallback } from 'react'

export function useInterval(callback, delay) {
  const savedCallback = useRef(callback)
  useEffect(() => { savedCallback.current = callback }, [callback])
  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

export function useAnimFrame(callback, active) {
  const rafRef = useRef(null)
  const savedCallback = useRef(callback)
  useEffect(() => { savedCallback.current = callback }, [callback])

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    function loop(time) {
      savedCallback.current(time)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])
}
