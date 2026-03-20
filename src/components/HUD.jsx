// src/components/HUD.jsx
const CIRCUMFERENCE = 163.4

export default function HUD({ playerName, score, timeLeft, maxTime }) {
  const progress = timeLeft / maxTime
  const offset = CIRCUMFERENCE * (1 - progress)
  const timerColor = progress > 0.5 ? '#ff6b00' : progress > 0.25 ? '#ffe600' : '#ff4040'

  return (
    <div style={{
      position: 'relative', zIndex: 10,
      width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px 8px',
      background: 'linear-gradient(to bottom, rgba(10,10,15,0.9), transparent)',
    }}>
      {/* Player */}
      <div>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: '#6b5c4a', fontWeight: 600 }}>
          PLAYER
        </div>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: '#f0e6d3', lineHeight: 1 }}>
          {playerName}
        </div>
      </div>

      {/* Timer ring */}
      <div style={{ position: 'relative', width: 60, height: 60 }}>
        <svg viewBox="0 0 60 60" style={{ width: '100%', height: '100%' }}>
          <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <circle
            cx="30" cy="30" r="26"
            fill="none"
            stroke={timerColor}
            strokeWidth="4"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 30 30)"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
          />
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '1.4rem', color: timerColor,
          lineHeight: 1,
        }}>
          {timeLeft}
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: '#6b5c4a', fontWeight: 600 }}>
          SCORE
        </div>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: '#f0e6d3', lineHeight: 1 }}>
          {score}
        </div>
      </div>
    </div>
  )
}
