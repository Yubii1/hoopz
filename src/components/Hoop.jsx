// src/components/Hoop.jsx
export default function Hoop({ leftPercent, shaking, swishing }) {
  return (
    <div style={{
      position: 'absolute',
      top: '10%',
      left: `${leftPercent}%`,
      transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      transition: 'left 0.15s linear',
      animation: shaking ? 'hoopShake 0.25s ease' : 'none',
    }}>
      {/* Backboard */}
      <div style={{
        width: 80, height: 50,
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid rgba(255,255,255,0.13)',
        borderRadius: 4,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          bottom: 8, left: '50%', transform: 'translateX(-50%)',
          width: 36, height: 24,
          border: '2px solid rgba(255,107,0,0.4)',
          borderRadius: 2,
        }} />
      </div>

      {/* Rim */}
      <div style={{
        width: 70, height: 12,
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
          width: 54, height: 40,
          backgroundImage: `
            repeating-linear-gradient(180deg, transparent 0px, transparent 5px, rgba(255,255,255,0.18) 5px, rgba(255,255,255,0.18) 6px),
            repeating-linear-gradient(90deg, transparent 0px, transparent 8px, rgba(255,255,255,0.18) 8px, rgba(255,255,255,0.18) 9px)
          `,
          clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
          animation: swishing ? 'netSwish 0.3s ease' : 'none',
        }} />
      </div>
    </div>
  )
}
