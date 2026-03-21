// src/components/LoadingScreen.jsx
import { useState, useEffect } from 'react'

const TIPS = [
  // How to play
  "AIM THE ARROW AT THE HOOP BEFORE YOU RELEASE",
  "SWIPE UP — DON'T TAP. POWER MATTERS.",
  "THE HOOP MOVES FASTER AS TIME RUNS OUT",
  "LEAD YOUR SHOT — AIM AHEAD OF THE MOVING HOOP",
  "SHORT SWIPES GO WEAK. LONG SWIPES GO WILD.",
  "HIT 3 IN A ROW FOR A 2X COMBO BONUS",
  "5 IN A ROW = 3X POINTS. STAY HOT.",
  "THE ARROW SHOWS YOUR SHOT DIRECTION — USE IT",
  "COMBOS RESET ON EVERY MISS. DON'T MISS.",
  "WATCH THE TIMER — LAST 5 SECONDS MATTER MOST",
  "THE HOOP STAYS STILL FOR THE FIRST 5 SECONDS. WARM UP.",
  "SWIPE SPEED COUNTS — TOO FAST AND YOU'LL BRICK IT",
  "AIM FOR THE CENTER OF THE HOOP, NOT THE RIM",
  "ONE HAND, ONE FOCUS. DON'T RUSH YOUR SHOT.",
  "PERFECT TIMING BEATS PERFECT AIM EVERY TIME",
  // Hype
  "SOMEBODY ON THIS LEADERBOARD PRACTICED. BE THAT SOMEBODY.",
  "THE TOP SPOT HAS A NAME ON IT. MAKE IT YOURS.",
  "EVERY GOAT STARTED WITH A ZERO.",
  "STREAKS WIN GAMES. BUILD YOURS.",
  "YOUR PERSONAL BEST IS JUST YOUR LAST WARM UP.",
  "THE LEADERBOARD DOESN'T LIE. CAN YOU?",
  "ONE MORE GAME. ONE MORE CHANCE.",
  "LEGENDS DON'T WAIT FOR PERFECT CONDITIONS.",
  "YOUR COMBO MULTIPLIER IS FREE POINTS. DON'T WASTE IT.",
  "SOMEBODY SCORED HIGHER. THAT'S YOUR PROBLEM NOW.",
  "30 SECONDS. THAT'S ALL IT TAKES TO CHANGE EVERYTHING.",
  "REAL BALLERS DON'T CHECK THE SCORE. THEY SET IT.",
  "THE HOOP DOESN'T CARE ABOUT YOUR EXCUSES.",
  "STAY LOCKED IN. ONE MISS WON'T KILL YOUR RUN.",
  "YOU'RE ONE SESSION AWAY FROM THE TOP 3.",
]

export default function LoadingScreen({ message = 'LOADING...' }) {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Cycle tips every 2.5s with a fade transition
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setTipIndex(i => (i + 1) % TIPS.length)
        setVisible(true)
      }, 400)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0f',
      zIndex: 999,
    }}>
      {/* Grid bg */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,107,0,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 0,
        width: '100%', maxWidth: 340, padding: '0 24px',
      }}>
        {/* Bouncing ball + shadow */}
        <div style={{ position: 'relative', width: 80, height: 100, marginBottom: 16 }}>
          <div style={{
            position: 'absolute',
            left: '50%', transform: 'translateX(-50%)',
            fontSize: 56,
            animation: 'ballBounce 0.6s cubic-bezier(0.33, 0, 0.66, 0) infinite alternate',
            filter: 'drop-shadow(0 8px 20px rgba(255,107,0,0.5))',
          }}>
            🏀
          </div>
          <div style={{
            position: 'absolute',
            bottom: 0, left: '50%',
            transform: 'translateX(-50%)',
            width: 40, height: 8,
            background: 'radial-gradient(ellipse, rgba(255,107,0,0.35) 0%, transparent 70%)',
            animation: 'shadowPulse 0.6s cubic-bezier(0.33, 0, 0.66, 0) infinite alternate',
            borderRadius: '50%',
          }} />
        </div>

        {/* Loading message */}
        <div style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '0.78rem',
          color: '#6b5c4a',
          letterSpacing: '0.25em',
          animation: 'textPulse 1.2s ease-in-out infinite',
          marginBottom: 28,
        }}>
          {message}
        </div>

        {/* Divider */}
        <div style={{
          width: 40, height: 1,
          background: 'rgba(255,107,0,0.2)',
          marginBottom: 20,
        }} />

        {/* Tip label */}
        <div style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '0.6rem',
          color: 'rgba(255,107,0,0.4)',
          letterSpacing: '0.3em',
          marginBottom: 10,
        }}>
          💡 TIP
        </div>

        {/* Cycling tip */}
        <div style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 600,
          fontSize: '0.95rem',
          color: '#f0e6d3',
          letterSpacing: '0.06em',
          textAlign: 'center',
          lineHeight: 1.4,
          minHeight: 48,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}>
          {TIPS[tipIndex]}
        </div>

        {/* Tip dots indicator */}
        <div style={{
          display: 'flex', gap: 5, marginTop: 16,
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 4, height: 4, borderRadius: '50%',
              background: i === (tipIndex % 3) ? '#ff6b00' : 'rgba(255,107,0,0.2)',
              transition: 'background 0.4s',
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ballBounce {
          0%   { top: 0px; transform: translateX(-50%) scaleY(1); }
          85%  { transform: translateX(-50%) scaleY(1); }
          100% { top: 44px; transform: translateX(-50%) scaleY(0.82); }
        }
        @keyframes shadowPulse {
          0%   { opacity: 0.2; transform: translateX(-50%) scale(0.5); }
          100% { opacity: 1;   transform: translateX(-50%) scale(1); }
        }
        @keyframes textPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
