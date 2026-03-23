import { useEffect, useState } from 'react'
import { fetchLeaderboard } from '../firebase/db'

const PODIUM = [
  { order: 1, rank: 2, icon: '🥈', color: '#c0c0c0', height: 60 },
  { order: 0, rank: 1, icon: '🥇', color: '#ffd700', height: 80 },
  { order: 2, rank: 3, icon: '🥉', color: '#cd7f32', height: 44 },
]

export default function Leaderboard({ playerName, onBack, onPlay }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchLeaderboard()
      .then(data => { setPlayers(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const currentId = playerName?.toLowerCase().replace(/\s+/g, '_')

  const podiumSlots = PODIUM.map(p => ({
    ...p,
    player: players[p.rank - 1] || null,
  })).sort((a, b) => a.order - b.order)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0a0a0f',
      overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '16px 20px 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingTop: 8 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', color: '#ff6b00',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: '1rem', fontWeight: 600,
              cursor: 'pointer', letterSpacing: '0.05em', padding: '8px 0',
            }}
          >
            ← BACK
          </button>
          <h1 style={{
            fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem',
            color: '#f0e6d3', letterSpacing: '0.1em',
          }}>
            HALL OF FAME
          </h1>
        </div>

        {/* Podium */}
        {!loading && !error && players.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            gap: 8, marginBottom: 28, minHeight: 160,
          }}>
            {podiumSlots.map(({ rank, icon, color, height, player }) => (
              <div key={rank} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6, flex: 1,
              }}>
                {player && (
                  <>
                    <div style={{ fontSize: '1.8rem' }}>{icon}</div>
                    <div style={{
                      fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
                      fontSize: '0.85rem', color: '#f0e6d3',
                      textAlign: 'center', maxWidth: 80,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {player.name}
                    </div>
                    <div style={{
                      fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: '#f0e6d3',
                    }}>
                      {player.bestScore}
                    </div>
                  </>
                )}
                <div style={{
                  width: '100%', height,
                  background: `linear-gradient(to bottom, ${color}, ${color}88)`,
                  borderRadius: '6px 6px 0 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: '#0a0a0f',
                  boxShadow: `0 0 20px ${color}44`,
                }}>
                  #{rank}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading && (
            <div style={{
              textAlign: 'center', color: '#6b5c4a',
              fontFamily: 'Share Tech Mono, monospace',
              padding: '40px', fontSize: '0.9rem', letterSpacing: '0.1em',
            }}>
              SYNCING DATA...
            </div>
          )}
          {error && (
            <div style={{
              textAlign: 'center', color: '#ff4040',
              fontFamily: 'Share Tech Mono, monospace',
              padding: '40px', fontSize: '0.85rem',
            }}>
              ⚠️ COULD NOT LOAD — CHECK FIREBASE CONFIG
            </div>
          )}
          {!loading && !error && players.length === 0 && (
            <div style={{
              textAlign: 'center', color: '#6b5c4a',
              fontFamily: 'Share Tech Mono, monospace',
              padding: '40px', fontSize: '0.9rem',
            }}>
              NO PLAYERS YET. BE FIRST!
            </div>
          )}
          {players.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center',
              background: p.id === currentId ? 'rgba(255,107,0,0.07)' : '#16130e',
              border: `1px solid ${p.id === currentId ? '#ff6b00' : 'rgba(255,107,0,0.1)'}`,
              borderRadius: 8, padding: '12px 16px', gap: 12,
              animation: 'fadeUp 0.3s ease both',
            }}>
              <div style={{
                fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem',
                color: '#6b5c4a', minWidth: 28,
              }}>
                #{i + 1}
              </div>
              <div style={{ flex: 1, fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em' }}>
                {p.name}{p.id === currentId ? ' 👈' : ''}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: '#ff6b00' }}>
                  {p.bestScore}
                </div>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.7rem', color: '#6b5c4a' }}>
                  {p.gamesPlayed || 1} GAMES
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Play CTA */}
        <div style={{ paddingTop: 24 }}>
          <button
            onClick={onPlay}
            style={{
              width: '100%', background: '#ff6b00', border: 'none', borderRadius: 6,
              padding: '16px', fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.5rem', letterSpacing: '0.1em', color: '#0a0a0f', cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(255,107,0,0.5)',
            }}
          >
            PLAY NOW
          </button>
        </div>
      </div>
    </div>
  )
}
