// src/pages/Results.jsx
const PRIZES = [
  { rank: 1, icon: '🥇', label: 'GOLD BALLER', desc: 'Imaginary Yeezys + bragging rights forever', color: '#ffd700' },
  { rank: 2, icon: '🥈', label: 'SILVER SHOOTER', desc: 'Imaginary Jordans + a virtual high-five', color: '#c0c0c0' },
  { rank: 3, icon: '🥉', label: 'BRONZE HOOPER', desc: 'Imaginary Nike Dunks + respect from the streets', color: '#cd7f32' },
]

export default function Results({ result, playerName, onPlayAgain, onLeaderboard }) {
  if (!result) return null
  const { score, rank, shotsMade, shotsTaken, maxCombo } = result
  const pct = shotsTaken > 0 ? Math.round((shotsMade / shotsTaken) * 100) : 0
  const prize = rank && rank <= 3 ? PRIZES[rank - 1] : null

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 100%, rgba(26,15,0,0.3), transparent 70%), #0a0a0f',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 20,
        padding: '40px 24px',
        width: '100%', maxWidth: 360,
        animation: 'fadeUp 0.5s ease',
      }}>
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '3rem', letterSpacing: '0.1em',
          color: '#ff6b00',
          textShadow: '0 0 30px rgba(255,107,0,0.5)',
        }}>
          {prize ? `RANK #${rank}!` : 'GAME OVER'}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.3em', color: '#6b5c4a', marginBottom: 4 }}>
            FINAL SCORE
          </div>
          <div style={{
            fontFamily: 'Bebas Neue, sans-serif', fontSize: '6rem',
            color: '#f0e6d3', lineHeight: 1,
            textShadow: '0 0 40px rgba(255,255,255,0.15)',
          }}>
            {score}
          </div>
        </div>

        <div style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '0.85rem', color: '#6b5c4a',
          textAlign: 'center', lineHeight: 1.9,
        }}>
          {shotsMade} / {shotsTaken} shots made · {pct}% accuracy<br />
          Max combo: {maxCombo}x
        </div>

        {prize && (
          <div style={{
            background: 'linear-gradient(135deg, #1a1200, #2a2000)',
            border: `2px solid ${prize.color}`,
            borderRadius: 12, padding: '16px 28px',
            textAlign: 'center',
            animation: 'prizePulse 2s ease infinite',
            width: '100%',
          }}>
            <div style={{ fontSize: '2.5rem' }}>{prize.icon}</div>
            <div style={{
              fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem',
              color: prize.color, letterSpacing: '0.1em',
            }}>
              {prize.label}
            </div>
            <div style={{ fontSize: '0.8rem', color: `${prize.color}99`, marginTop: 4, letterSpacing: '0.04em' }}>
              {prize.desc}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <button
            onClick={onPlayAgain}
            style={{
              width: '100%', background: '#ff6b00', border: 'none', borderRadius: 6,
              padding: '16px', fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.5rem', letterSpacing: '0.1em', color: '#0a0a0f', cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(255,107,0,0.5)',
            }}
          >
            PLAY AGAIN
          </button>
          <button
            onClick={onLeaderboard}
            style={{
              width: '100%', background: 'transparent',
              border: '2px solid rgba(255,107,0,0.3)', borderRadius: 6,
              padding: '14px', fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.3rem', letterSpacing: '0.1em', color: '#ff6b00', cursor: 'pointer',
            }}
          >
            🏆 RANKINGS
          </button>
        </div>
      </div>
    </div>
  )
}
