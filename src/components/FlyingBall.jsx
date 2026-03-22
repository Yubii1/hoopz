// src/components/FlyingBall.jsx
import { useEffect, useRef } from 'react'

export default function FlyingBall({ shot, onComplete }) {
  const { startX, startY, targetX, targetY, isBasket } = shot
  const ref = useRef(null)

  useEffect(() => {
    const duration = 450
    const start = performance.now()

    const midX = (startX + targetX) / 2 + (Math.random() - 0.5) * 40
    const midY = Math.min(startY, targetY) - 80 - Math.random() * 60
    const landX = isBasket
      ? targetX + (Math.random() - 0.5) * 14
      : targetX + (Math.random() > 0.5 ? 65 : -65) + Math.random() * 30
    const landY = isBasket ? targetY : targetY + 35 + Math.random() * 35

    let raf
    function animate(now) {
      const t = Math.min((now - start) / duration, 1)
      const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * landX
      const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * landY
      const spin = t * 720
      const scale = 1 - t * 0.3

      if (ref.current) {
        ref.current.style.left = x + 'px'
        ref.current.style.top = y + 'px'
        ref.current.style.transform = `translate(-50%,-50%) rotate(${spin}deg) scale(${scale})`
      }

      if (t < 1) {
        raf = requestAnimationFrame(animate)
      } else {
        onComplete()
      }
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div ref={ref} style={{
      position: 'absolute',
      fontSize: 52,
      pointerEvents: 'none',
      zIndex: 5,
      filter: 'drop-shadow(0 4px 12px rgba(255,107,0,0.5))',
      left: startX, top: startY,
      transform: 'translate(-50%,-50%)',
    }}>
      🏀
    </div>
  )
}
