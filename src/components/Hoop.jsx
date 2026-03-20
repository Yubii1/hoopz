// src/components/Hoop.jsx
export default function Hoop({ swishing }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Backboard — bigger */}
      <div style={{
        width: 110, height: 70,
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid rgba(255,255,255,0.13)',
        borderRadius: 4,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          bottom: 8, left: '50%', transform: 'translateX(-50%)',
          width: 50, height: 32,
          border: '2px solid rgba(255,107,0,0.4)',
          borderRadius: 2,
        }} />
      </div>

      {/* Rim — bigger */}
      <div style={{
        width: 96, height: 14,
        background: '#ff6b00',
        borderRadius: 2,
        marginTop: -2,
        boxShadow: '0 0 16px rgba(255,107,0,0.5), 0 0 32px rgba(255,107,0,0.3)',
        position: 'relative',
      }}>
        {/* Net */}
        <div style={{
          position: 'absolute',
          top: '100%', left: '50%', transform: 'translateX(-50%)',
          width: 74, height: 48,
          backgroundImage: `
            repeating-linear-gradient(180deg, transparent 0px, transparent 5px, rgba(255,255,255,0.18) 5px, rgba(255,255,255,0.18) 6px),
            repeating-linear-gradient(90deg, transparent 0px, transparent 10px, rgba(255,255,255,0.18) 10px, rgba(255,255,255,0.18) 11px)
          `,
          clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
          animation: swishing ? 'netSwish 0.3s ease' : 'none',
        }} />
      </div>
    </div>
  )
}