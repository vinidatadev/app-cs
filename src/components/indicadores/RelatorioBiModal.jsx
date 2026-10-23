import { useEffect } from 'react'

const BI_URL = 'https://app.powerbi.com/reportEmbed?reportId=79d8d241-c1ea-4ce3-b858-d805c202b466&autoAuth=true&ctid=9c9c8341-d469-42a5-a3b1-68e24680f993&actionBarEnabled=true'

export default function RelatorioBiModal({ onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const overflowAntes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflowAntes
    }
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 5000, padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
        width: 'min(1200px, 96vw)', height: 'min(90vh, 760px)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg3)', flexWrap: 'wrap',
        }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text2)' }}>
            Carteira OTIF - GAC - 4Hana
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a
              href={BI_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg2)', color: 'var(--text3)', fontSize: 11,
                fontWeight: 600, textDecoration: 'none', fontFamily: 'Inter, sans-serif',
              }}
            >Abrir em nova aba</a>
            <button
              onClick={onClose}
              title="Fechar"
              style={{
                background: 'none', border: 'none', color: 'var(--text4)',
                fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '0 4px',
              }}
            >x</button>
          </div>
        </div>
        <iframe
          title="Carteira OTIF - GAC - 4Hana"
          src={BI_URL}
          allowFullScreen
          style={{ width: '100%', flex: 1, border: 'none', background: '#fff' }}
        />
      </div>
    </div>
  )
}
