// src/pages/Game.jsx
import { useState, useEffect, useRef } from 'react'
import HUD from '../components/HUD'
import Hoop from '../components/Hoop'
import Ball from '../components/Ball'
import FlyingBall from '../components/FlyingBall'
import ScorePop from '../components/ScorePop'
import LoadingScreen from '../components/LoadingScreen'
import { useInterval } from '../hooks/useGameLoop'
import { saveScore } from '../firebase/db'
import { updateScore, markDone, markDisconnected } from '../firebase/battle'
import {
  playSwish, playClank, playCombo,
  playCountdownBeep, playBuzzer, playShootWhoosh,
} from '../hooks/useSound'

const GAME_DURATION = 30
const COUNTDOWN_FROM = 3
const DISCONNECT_TIMEOUT = 45000 // 45s no score change = disconnected

export default function Game({
  playerName, onEnd,
  battleCode, battleRole,
  opponentName, opponentScore: opponentScoreProp,
}) {
  const [phase, setPhase] = useState('loading')
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [hoopLeft, setHoopLeft] = useState(50)
  const [hoopShaking, setHoopShaking] = useState(false)
  const [hoopSwishing, setHoopSwishing] = useState(false)
  const [streakText, setStreakText] = useState('')
  const [comboText, setComboText] = useState('')
  const [shots, setShots] = useState([])
  const [pops, setPops] = useState([])
  const [gameOver, setGameOver] = useState(false)
  const [shooting, setShooting] = useState(false)
  const [opponentScore, setOpponentScore] = useState(opponentScoreProp ?? 0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [disconnectMsg, setDisconnectMsg] = useState('')

  useEffect(() => {
    if (opponentScoreProp !== undefined) setOpponentScore(opponentScoreProp)
  }, [opponentScoreProp])

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
  const beepedRef = useRef(new Set())

  // Disconnect detection refs
  const lastOppScoreRef = useRef(opponentScoreProp ?? 0)
  const lastOppScoreTimeRef = useRef(Date.now())
  const disconnectTimerRef = useRef(null)

  useEffect(() => { hoopLeftRef.current = hoopLeft }, [hoopLeft])

  // Track opponent score changes for disconnect detection
  useEffect(() => {
    if (!battleCode || gameOverRef.current || phase !== 'playing') return
    if (opponentScoreProp !== lastOppScoreRef.current) {
      lastOppScoreRef.current = opponentScoreProp ?? 0
      lastOppScoreTimeRef.current = Date.now()
      // Reset disconnect timer on any score update
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current)
      disconnectTimerRef.current = setTimeout(() => {
        if (!gameOverRef.current) handleOpponentDisconnect()
      }, DISCONNECT_TIMEOUT)
    }
  }, [opponentScoreProp, battleCode, phase])

  // Start disconnect timer when game begins
  useEffect(() => {
    if (phase !== 'playing' || !battleCode) return
    disconnectTimerRef.current = setTimeout(() => {
      if (!gameOverRef.current) handleOpponentDisconnect()
    }, DISCONNECT_TIMEOUT)
    return () => { if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current) }
  }, [phase, battleCode])

  async function handleOpponentDisconnect() {
    if (gameOverRef.current) return
    setDisconnectMsg(`${opponentName ?? 'OPPONENT'} DISCONNECTED — YOU WIN!`)
    try {
      await markDisconnected(battleCode, battleRole === 'host' ? 'guest' : 'host')
    } catch (e) { }
    setTimeout(() => endGame(true), 2500)
  }

  // Loading → countdown → playing
  useEffect(() => {
    const t = setTimeout(() => setPhase('countdown'), 1200)
    return () => clearTimeout(t)
  }, [])

  // Countdown 3..2..1..GO
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) { setPhase('playing'); return }
    playCountdownBeep(countdown === 1)
    const t = setTimeout(() => setCountdown(c => c - 1), 900)
    return () => clearTimeout(t)
  }, [phase, countdown])

  const isPlaying = phase === 'playing'

  // Timer
  useInterval(() => {
    if (gameOverRef.current) return
    const next = timeLeftRef.current - 1
    timeLeftRef.current = next
    setTimeLeft(next)
    if (next > 0 && next <= 5 && !beepedRef.current.has(next)) {
      beepedRef.current.add(next)
      playCountdownBeep(next === 1)
    }
    if (next <= 0) endGame()
  }, isPlaying && !gameOver ? 1000 : null)

  // Hoop movement
  useInterval(() => {
    if (gameOverRef.current) return
    const elapsed = GAME_DURATION - timeLeftRef.current
    if (elapsed < 2) return
    const speed = (elapsed * 0.12) + 1.0
    let pos = hoopLeftRef.current + hoopDirRef.current * speed
    if (pos >= 85) { pos = 85; hoopDirRef.current = -1 }
    if (pos <= 15) { pos = 15; hoopDirRef.current = 1 }
    hoopLeftRef.current = pos
    setHoopLeft(pos)
  }, isPlaying && !gameOver ? 50 : null)

  async function endGame(fromDisconnect = false) {
    if (gameOverRef.current) return
    gameOverRef.current = true
    setGameOver(true)
    if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current)
    if (!fromDisconnect) playBuzzer()

    let rank = null
    try {
      if (battleCode && battleRole) {
        await markDone(battleCode, battleRole, scoreRef.current)
      } else {
        rank = await saveScore(playerName, scoreRef.current, shotsMadeRef.current, shotsTakenRef.current)
      }
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

  // Solo exit — just end with current score
  function handleSoloExit() {
    setShowExitConfirm(false)
    endGame()
  }

  // Battle forfeit — mark opponent as winner
  async function handleForfeit() {
    if (gameOverRef.current) return
    gameOverRef.current = true
    setGameOver(true)
    setShowExitConfirm(false)
    if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current)
    playBuzzer()
    try {
      // Mark self as done with 0 override so opponent wins clearly
      await markDone(battleCode, battleRole, scoreRef.current)
    } catch (e) { }
    onEnd({
      score: scoreRef.current,
      rank: null,
      shotsMade: shotsMadeRef.current,
      shotsTaken: shotsTakenRef.current,
      maxCombo: maxComboRef.current,
      forfeited: true,
    })
  }

  function handleShoot(dx, dy, power) {
  if (gameOverRef.current || shooting || !isPlaying) return
  setShooting(true)
  shotsTakenRef.current++
  playShootWhoosh()

  const gameArea = gameAreaRef.current
  const hoopEl = hoopRef.current
  if (!gameArea || !hoopEl) return

  const gameRect = gameArea.getBoundingClientRect()
  const hoopRect = hoopEl.getBoundingClientRect()

  // 1. Starting position (The Ball at bottom center)
  const startX = gameRect.width / 2
  const startY = gameRect.height * 0.86

  // 2. Target position (The Hoop)
  const hoopX = hoopRect.left + hoopRect.width / 2 - gameRect.left
  const hoopY = hoopRect.top + hoopRect.height / 2 - gameRect.top

  // 3. Calculate "Actual" trajectory based on the swipe direction
  const magnitude = Math.sqrt(dx * dx + dy * dy)
  const dirX = dx / magnitude
  const dirY = dy / magnitude
  
  // Project the ball far enough to pass the hoop if it misses
  const travelDist = 30 + (power * 3) // Base distance + power scaling
  const projectedX = startX + (dirX * travelDist)
  const projectedY = startY + (dirY * travelDist)

  // 4. FIX: Aim Logic (Using consistent screen coordinates)
  // idealAngle: vector from ball to hoop
  const idealAngle = Math.atan2(hoopY - startY, hoopX - startX)
  // swipeAngle: vector of the user's flick
  const swipeAngle = Math.atan2(dy, dx)

  let angleDiff = Math.abs(swipeAngle - idealAngle)
  if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff

  // TUNE THESE VALUES:
  // 0.15 is tight (pro), 0.25 is medium, 0.40 is very easy.
  const aimOk = angleDiff < 0.12
  
  // dy must be negative (swiping UP) and power must be at least 50
  const isBasket = aimOk && dy < -50

  // 5. Resolution
  const finalTargetX = isBasket ? hoopX : projectedX
  const finalTargetY = isBasket ? hoopY : projectedY

  const shotId = Date.now()
  setShots(prev => [...prev, { 
    id: shotId, 
    startX, 
    startY, 
    targetX: finalTargetX, 
    targetY: finalTargetY, 
    isBasket 
  }])

  // We wait for the ball animation to "reach" the hoop before scoring
  setTimeout(() => {
    setShooting(false)
    setShots(prev => prev.filter(s => s.id !== shotId))
    resolveShot(isBasket, hoopX, hoopY - 40)
  }, 450) // Matches animation duration
}
  function resolveShot(isBasket, x, y) {
    const popId = Date.now() + Math.random()
    if (isBasket) {
      shotsMadeRef.current++
      comboRef.current++
      if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current
      const combo = comboRef.current
      const bonus =
        combo >= 8 ? 8 :
          combo >= 7 ? 7 :
            combo >= 6 ? 6 :
              combo >= 5 ? 5 :
                combo >= 4 ? 4 :
                  combo >= 3 ? 3 :
                    combo >= 2 ? 2 : 1
      const pts = 50 * bonus
      scoreRef.current += pts
      setScore(scoreRef.current)
      if (battleCode && battleRole) updateScore(battleCode, battleRole, scoreRef.current).catch(() => { })
      playSwish()
      if (comboRef.current >= 3) playCombo(comboRef.current)
      setPops(prev => [...prev, { id: popId, x, y, text: `+${pts}`, miss: false }])
      setTimeout(() => setPops(prev => prev.filter(p => p.id !== popId)), 850)
      setHoopSwishing(true)
      setTimeout(() => setHoopSwishing(false), 320)
      if (comboRef.current >= 3) {
        const labels = ['🔥 ON FIRE', '💥 UNSTOPPABLE', '⚡ LIGHTNING', '🌪️ INSANE']
        setStreakText(comboRef.current >= 7 ? labels[3] : comboRef.current >= 5 ? labels[2] : comboRef.current >= 4 ? labels[1] : labels[0])
        setComboText(comboRef.current >= 5 ? `${comboRef.current}x 🔥 COMBO` : `${comboRef.current}x COMBO`)
      }
    } else {
      comboRef.current = 0
      setStreakText('')
      setComboText('')
      playClank()
      setPops(prev => [...prev, { id: popId, x, y, text: 'MISS', miss: true }])
      setTimeout(() => setPops(prev => prev.filter(p => p.id !== popId)), 850)
      setHoopShaking(true)
      setTimeout(() => setHoopShaking(false), 280)
    }
  }

  const isBattle = !!battleCode

  if (phase === 'loading') return <LoadingScreen message="GET READY..." />

  if (phase === 'countdown') {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.04) 1px, transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {isBattle && (
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.8rem', color: '#6b5c4a', letterSpacing: '0.25em', marginBottom: 16 }}>
              VS {opponentName ?? 'OPPONENT'}
            </div>
          )}
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(100px, 32vw, 160px)', color: countdown === 0 ? '#00ff87' : '#ff6b00', textShadow: countdown === 0 ? '0 0 60px rgba(0,255,135,0.6)' : '0 0 60px rgba(255,107,0,0.6)', lineHeight: 1, animation: 'countPop 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {countdown === 0 ? 'GO!' : countdown}
          </div>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.78rem', color: '#6b5c4a', letterSpacing: '0.3em', marginTop: 12 }}>
            {countdown > 0 ? 'GET READY' : 'SHOOT!'}
          </div>
        </div>
        <style>{`@keyframes countPop { 0% { transform: scale(1.4); opacity: 0.4; } 100% { transform: scale(1); opacity: 1; } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#0f0d08' }}>
      <HUD playerName={playerName} score={score} timeLeft={timeLeft} maxTime={GAME_DURATION} />

      {/* Streak bar */}
      <div style={{ width: '100%', padding: '0 20px 6px', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.8rem', color: '#00ff87', letterSpacing: '0.1em', minHeight: 22, textAlign: 'center', textShadow: '0 0 10px #00ff87' }}>
        {streakText}
      </div>

      <div ref={gameAreaRef} style={{ flex: 1, width: '100%', position: 'relative', background: `radial-gradient(ellipse 100% 40% at 50% 0%, rgba(26,18,8,0.15), transparent), #0f0d08`, overflow: 'hidden' }}>

        {/* Court arc */}
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 200, height: 100, border: '2px solid rgba(255,107,0,0.08)', borderBottom: 'none', borderRadius: '100px 100px 0 0', pointerEvents: 'none' }} />

        {/* Hoop */}
        <div ref={hoopRef} style={{ position: 'absolute', top: '10%', left: `${hoopLeft}%`, transform: 'translateX(-50%)', transition: 'left 0.15s linear', animation: hoopShaking ? 'hoopShake 0.25s ease' : 'none' }}>
          <Hoop leftPercent={0} shaking={false} swishing={hoopSwishing} />
        </div>

        {/* Tip banner */}
        <div style={{
          position: 'absolute', bottom: '30%', width: '100%',
          textAlign: 'center', pointerEvents: 'none',
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '0.62rem', color: 'rgba(107,92,74,0.7)',
          letterSpacing: '0.15em',
        }}>
          AIM FOR THE HOOP
          WELL NOT TOO HARD, JUST A LITTLE BIT 😜
        </div>

        {shots.map(shot => <FlyingBall key={shot.id} shot={shot} onComplete={() => { }} />)}
        <ScorePop pops={pops} />

        {/* Combo text */}
        {comboText && (
          <div style={{ position: 'absolute', bottom: '28%', width: '100%', textAlign: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', color: '#00ff87', textShadow: '0 0 20px #00ff87', pointerEvents: 'none', letterSpacing: '0.05em' }}>
            {comboText}
          </div>
        )}

        {/* Disconnect banner */}
        {disconnectMsg && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            background: 'rgba(0,255,135,0.12)',
            border: '1px solid rgba(0,255,135,0.4)',
            padding: '12px 16px', textAlign: 'center',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '0.75rem', color: '#00ff87',
            letterSpacing: '0.15em',
            animation: 'fadeDown 0.4s ease',
          }}>
            {disconnectMsg}
          </div>
        )}

        {/* Battle opponent score */}
        {isBattle && (
          <div style={{ position: 'absolute', top: 10, right: 14, background: 'rgba(10,10,15,0.82)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: 8, padding: '6px 12px', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', pointerEvents: 'none' }}>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.62rem', color: '#6b5c4a', letterSpacing: '0.12em', marginBottom: 2 }}>VS</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.85rem', color: '#ff6b00', letterSpacing: '0.08em', lineHeight: 1 }}>{opponentName ?? 'OPPONENT'}</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: opponentScore > score ? '#ff4040' : '#00ff87', lineHeight: 1, textShadow: opponentScore > score ? '0 0 12px #ff4040' : '0 0 12px #00ff87' }}>
              {opponentScore}
            </div>
          </div>
        )}

        {/* Exit / Forfeit button — top left */}
        {!gameOver && (
          <button
            onClick={() => setShowExitConfirm(true)}
            style={{
              position: 'absolute', top: 10, left: 14,
              background: 'rgba(10,10,15,0.82)',
              border: `1px solid ${isBattle ? 'rgba(255,64,64,0.3)' : 'rgba(255,107,0,0.2)'}`,
              borderRadius: 8, padding: '6px 12px',
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: '0.62rem',
              color: isBattle ? '#ff4040' : '#6b5c4a',
              letterSpacing: '0.12em', cursor: 'pointer',
              backdropFilter: 'blur(6px)',
            }}
          >
            {isBattle ? '🏳️ FORFEIT' : '✕ EXIT'}
          </button>
        )}

        <Ball onShoot={handleShoot} disabled={shooting || gameOver || showExitConfirm} />
      </div>

      {/* ── Confirm dialog ── */}
      {showExitConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(10,10,15,0.92)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            width: '100%', maxWidth: 320,
            background: '#16130e',
            border: `2px solid ${isBattle ? 'rgba(255,64,64,0.4)' : 'rgba(255,107,0,0.3)'}`,
            borderRadius: 12, padding: '28px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: isBattle ? '#ff4040' : '#ff6b00', letterSpacing: '0.06em', textAlign: 'center' }}>
              {isBattle ? '🏳️ FORFEIT MATCH?' : '✕ EXIT GAME?'}
            </div>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.72rem', color: '#6b5c4a', letterSpacing: '0.1em', textAlign: 'center', lineHeight: 1.5 }}>
              {isBattle
                ? `YOUR SCORE OF ${scoreRef.current} WILL BE SUBMITTED.\nOPPONENT WINS THE MATCH.`
                : `YOUR SCORE OF ${scoreRef.current} WILL BE SAVED.`}
            </div>
            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 8 }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{ flex: 1, background: 'transparent', border: '2px solid rgba(255,107,0,0.3)', borderRadius: 6, padding: '12px', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: '#ff6b00', cursor: 'pointer', letterSpacing: '0.08em' }}
              >
                KEEP PLAYING
              </button>
              <button
                onClick={isBattle ? handleForfeit : handleSoloExit}
                style={{ flex: 1, background: isBattle ? 'rgba(255,64,64,0.15)' : '#ff6b00', border: `2px solid ${isBattle ? 'rgba(255,64,64,0.5)' : 'none'}`, borderRadius: 6, padding: '12px', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: isBattle ? '#ff4040' : '#0a0a0f', cursor: 'pointer', letterSpacing: '0.08em' }}
              >
                {isBattle ? 'FORFEIT' : 'EXIT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
