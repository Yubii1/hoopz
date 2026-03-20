// src/components/ScorePop.jsx
import { useEffect, useState } from 'react'

export default function ScorePop({ pops }) {
  return (
    <>
      {pops.map(pop => (
        <div key={pop.id} style={{
          position: 'absolute',
          left: pop.x, top: pop.y,
          transform: 'translateX(-50%)',
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: pop.miss ? '1.4rem' : '2rem',
          color: pop.miss ? '#ff4040' : '#00ff87',
          textShadow: pop.miss ? '0 0 12px #ff4040' : '0 0 16px #00ff87',
          pointerEvents: 'none',
          zIndex: 20,
          animation: 'scorePop 0.8s ease forwards',
        }}>
          {pop.text}
        </div>
      ))}
    </>
  )
}
