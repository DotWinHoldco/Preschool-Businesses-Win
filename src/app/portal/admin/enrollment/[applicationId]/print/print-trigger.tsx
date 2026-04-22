'use client'

import { useEffect } from 'react'

export function PrintTrigger() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="no-print" style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      background: '#1e293b', color: 'white',
      padding: '10px 20px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      zIndex: 9999, fontSize: '13px',
    }}>
      <span>Enrollment Application — Print or Save as PDF</span>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => window.print()}
          style={{
            background: '#3b82f6', color: 'white', border: 'none',
            padding: '6px 16px', borderRadius: '4px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
          }}
        >
          Print / Save PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{
            background: 'transparent', color: '#94a3b8', border: '1px solid #475569',
            padding: '6px 16px', borderRadius: '4px', cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
