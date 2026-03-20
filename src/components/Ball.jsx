// src/components/Ball.jsx
import { useRef, useEffect, useState } from 'react'

export default function Ball({ onShoot, disabled }) {
  const [pressed, setPressed] = useState(false)
  const [aimAngle, setAimAngle] = useState(0)
  const [aimLength, setAimLength] = useState(0)
  const [aiming, setAiming] = useState(false)
  const dragStart = useRef(null)
  const ballRef = useRef(null)

  function getXY(e) {
    if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    return { x: e.clientX, y: e.clientY }
  }

  function onStart(e) {
    if (disabled) return
    e.preventDefault()
    dragStart.current = getXY(e)
    setPressed(true)
    setAiming(true)
  }

  function onMove(e) {
    if (!dragStart.current) return
    e.preventDefault()
    const cur = getXY(e)
    const dx = cur.x - dragStart.current.x
    const dy = cur.y - dragStart.current.y
    const angle = Math.atan2(-dx, dy) * (180 / Math.PI)
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 130)
    setAimAngle(angle)
    setAimLength(dist)
  }

  function onEnd(e) {
    if (!dragStart.current) return
    setPressed(false)
    setAiming(false)
    setAimLength(0)

    const cur = e.changedTouches
      ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
      : { x: e.clientX, y: e.clientY }

    const dx = dragStart.current.x - cur.x
    const dy = dragStart.current.y - cur.y
    const power = Math.sqrt(dx * dx + dy * dy)
    dragStart.current = null

    if (power < 20) return
    onShoot(dx, dy, power)
  }

  useEffect(() => {
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchend', onEnd)
    window.addEventListener('mouseup', onEnd)
    return () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('mouseup', onEnd)
    }
  }, [disabled])

  return (
    <div style={{
      position: 'absolute',
      bottom: '14%', left: '50%',
      transform: 'translateX(-50%)',
      width: 100, height: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Aim guide */}
      {aiming && aimLength > 10 && (
        <div style={{
          position: 'absolute',
          bottom: '50%', left: '50%',
          width: 2,
          height: aimLength,
          background: 'linear-gradient(to top, rgba(255,107,0,0.7), transparent)',
          transformOrigin: 'bottom center',
          transform: `translateX(-50%) rotate(${aimAngle}deg)`,
          pointerEvents: 'none',
          borderRadius: 1,
        }} />
      )}

      {/* Ball */}
      <div
        ref={ballRef}
        onTouchStart={onStart}
        onMouseDown={onStart}
        style={{
          fontSize: 72,
          transform: pressed ? 'scale(0.88)' : 'scale(1)',
          transition: 'transform 0.1s',
          filter: 'drop-shadow(0 6px 16px rgba(255,107,0,0.5))',
          cursor: 'pointer',
          position: 'relative', zIndex: 2,
          touchAction: 'none',
        }}
      >
        🏀
      </div>
    </div>
  )
}
