// src/pages/Game.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import HUD from '../components/HUD'
import Hoop from '../components/Hoop'
import Ball from '../components/Ball'
import FlyingBall from '../components/FlyingBall'
import ScorePop from '../components/ScorePop'
import { useInterval } from '../hooks/useGameLoop'
import { saveScore } from '../firebase/db'

const GAME_DURATION = 30

export default function Game({ playerName, onEnd }) {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [hoopLeft, setHoopLeft] = useState(50)
  const [hoopShaking, setHoopShaking] = useState(false)
  const [hoopSwishing, setHoopSwishing] = useState(false)
  const [combo, setCombo] = useState(0)
  const [streakText, setStreakText] = useState('')
  const [comboText, setComboText] = useState('')
  const [shots, setShots] = useState([])
  const [pops, setPops] = useState([])
  const [gameOver, setGameOver] = useState(false)
  const [shooting, setShooting] = useState(false)

  const gameAreaRef = useRef(null)
  const hoopRef = useRef(null)
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const maxComboRef = useRef(0)
  const shotsMadeRef = useRef(0)
  const shotsTakenRef = useRef(0)
  const hoopLeftRef = useRef(50)
  const hoopDirRef = useRef(1)
  const timeLeftRef = useRef(GAME_DURATION)
  const gameOverRef = useRef(false)

  // Sync refs
  useEffect(() => { hoopLeftRef.current = hoopLeft }, [hoopLeft])

  // Timer
  useInterval(() => {
    if (gameOverRef.current) return
    const next = timeLeftRef.current - 1
    timeLeftRef.current = next
    setTimeLeft(next)
    if (next <= 0) endGame()
  }, gameOver ? null : 1000)

  // Hoop movement
// Hoop movement
useInterval(() => {
  if (gameOverRef.current) return
  const elapsed = GAME_DURATION - timeLeftRef.current

  // Stay still for first 5 seconds
  if (elapsed < 5) return

  // Gradually increase speed after 5 seconds
  const speed = (elapsed - 5) * 0.09
  let pos = hoopLeftRef.current + hoopDirRef.current * speed
  if (pos >= 85) { pos = 85; hoopDirRef.current = -1 }
  if (pos <= 15) { pos = 15; hoopDirRef.current = 1 }
  hoopLeftRef.current = pos
  setHoopLeft(pos)
}, gameOver ? null : 100)

  async function endGame() {
    if (gameOverRef.current) return
    gameOverRef.current = true
    setGameOver(true)

    let rank = null
    try {
      rank = await saveScore(playerName, scoreRef.current, shotsMadeRef.current, shotsTakenRef.current)
    } catch (e) {
      console.warn('Firebase error:', e)
    }

    onEnd({
      score: scoreRef.current,
      rank,
      shotsMade: shotsMadeRef.current,
      shotsTaken: shotsTakenRef.current,
      maxCombo: maxComboRef.current,
    })
  }

  function handleShoot(dx, dy, power) {
    if (gameOverRef.current || shooting) return
    setShooting(true)
    shotsTakenRef.current++

    const gameArea = gameAreaRef.current
    const hoopEl = hoopRef.current
    if (!gameArea || !hoopEl) return

    const gameRect = gameArea.getBoundingClientRect()
    const hoopRect = hoopEl.getBoundingClientRect()

    const startX = gameRect.width / 2
    const startY = gameRect.height * 0.86
    const targetX = hoopRect.left + hoopRect.width / 2 - gameRect.left
    const targetY = hoopRect.top + hoopRect.height / 2 - gameRect.top

    // Accuracy
    const flickAngle = Math.atan2(-dy, dx)
    const idealAngle = Math.atan2(-(startY - targetY), targetX - startX)
    const diff = Math.abs(flickAngle - idealAngle)
    const normDiff = Math.min(diff, Math.PI * 2 - diff)
    const normPower = Math.min(power, 200) / 200
    const powerScore = 1 - Math.abs(normPower - 0.55)
    const accuracy = Math.max(0, (1 - normDiff / 1.2) * 0.7 + powerScore * 0.3)
    const isBasket = accuracy > 0.6

    const shotId = Date.now()
    setShots(prev => [...prev, { id: shotId, startX, startY, targetX, targetY, isBasket }])

    // resolve after ball animation
    setTimeout(() => {
      setShooting(false)
      setShots(prev => prev.filter(s => s.id !== shotId))
      resolveShot(isBasket, targetX, targetY - 40, gameRect)
    }, 500)
  }

  function resolveShot(isBasket, x, y) {
    const popId = Date.now() + Math.random()
    if (isBasket) {
      shotsMadeRef.current++
      comboRef.current++
      if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current
      setCombo(comboRef.current)

      const bonus = comboRef.current >= 5 ? 3 : comboRef.current >= 3 ? 2 : 1
      const pts = 2 * bonus
      scoreRef.current += pts
      setScore(scoreRef.current)

      setPops(prev => [...prev, { id: popId, x, y, text: `+${pts}`, miss: false }])
      setTimeout(() => setPops(prev => prev.filter(p => p.id !== popId)), 850)

      // Swish
      setHoopSwishing(true)
      setTimeout(() => setHoopSwishing(false), 320)

      // Streak
      if (comboRef.current >= 3) {
        const labels = ['🔥 ON FIRE', '💥 UNSTOPPABLE', '⚡ LIGHTNING', '🌪️ INSANE']
        setStreakText(
          comboRef.current >= 7 ? labels[3] :
          comboRef.current >= 5 ? labels[2] :
          comboRef.current >= 4 ? labels[1] : labels[0]
        )
        setComboText(comboRef.current >= 5 ? `${comboRef.current}x 🔥 COMBO` : `${comboRef.current}x COMBO`)
      }
    } else {
      comboRef.current = 0
      setCombo(0)
      setStreakText('')
      setComboText('')
      setPops(prev => [...prev, { id: popId, x, y, text: 'MISS', miss: true }])
      setTimeout(() => setPops(prev => prev.filter(p => p.id !== popId)), 850)
      setHoopShaking(true)
      setTimeout(() => setHoopShaking(false), 280)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: '#0f0d08',
    }}>
      <HUD playerName={playerName} score={score} timeLeft={timeLeft} maxTime={GAME_DURATION} />

      {/* Streak bar */}
      <div style={{
        width: '100%', padding: '0 20px 6px',
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '0.8rem', color: '#00ff87',
        letterSpacing: '0.1em', minHeight: 22,
        textAlign: 'center',
        textShadow: '0 0 10px #00ff87',
      }}>
        {streakText}
      </div>

      {/* Game area */}
      <div ref={gameAreaRef} style={{
        flex: 1, width: '100%', position: 'relative',
        background: `radial-gradient(ellipse 100% 40% at 50% 0%, rgba(26,18,8,0.15), transparent), #0f0d08`,
        overflow: 'hidden',
      }}>
        {/* Court arc */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: 200, height: 100,
          border: '2px solid rgba(255,107,0,0.08)',
          borderBottom: 'none',
          borderRadius: '100px 100px 0 0',
          pointerEvents: 'none',
        }} />

        {/* Hoop */}
        <div ref={hoopRef} style={{
          position: 'absolute',
          top: '10%',
          left: `${hoopLeft}%`,
          transform: 'translateX(-50%)',
          transition: 'left 0.15s linear',
          animation: hoopShaking ? 'hoopShake 0.25s ease' : 'none',
        }}>
          <Hoop leftPercent={0} shaking={false} swishing={hoopSwishing} />
        </div>

        {/* Flying balls */}
        {shots.map(shot => (
          <FlyingBall key={shot.id} shot={shot} onComplete={() => {}} />
        ))}

        {/* Score pops */}
        <ScorePop pops={pops} />

        {/* Combo display */}
        {comboText && (
          <div style={{
            position: 'absolute', bottom: '28%', width: '100%',
            textAlign: 'center',
            fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem',
            color: '#00ff87', textShadow: '0 0 20px #00ff87',
            pointerEvents: 'none', letterSpacing: '0.05em',
          }}>
            {comboText}
          </div>
        )}

        {/* Ball */}
        <Ball onShoot={handleShoot} disabled={shooting || gameOver} />
      </div>
    </div>
  )
}
