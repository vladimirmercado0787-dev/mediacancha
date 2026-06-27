import { useState, useEffect } from 'react'
import { misTorneos } from '../torneos'

// ============================================================
//  MIS TORNEOS — selector
//  Lista los torneos que el usuario organiza para que elija en
//  cuál entrar. Una persona puede administrar varios torneos
//  (distintas fechas, o hasta a la vez), así que aquí se escoge.
// ============================================================

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const DISP = '"Arial Narrow", Impact, "Haettenschweiler", system-ui, sans-serif'

const C = {
  fondo: '#0a0e1a',
  panel: 'rgba(255,255,255,0.045)',
  card: 'rgba(255,255,255,0.05)',
  borde: 'rgba(150,172,228,0.16)',
  borde2: 'rgba(150,172,228,0.30)',
  txt: '#eef3fc',
  tenue: '#8a9bc0',
  tenue2: '#5d6c8c',
  oro: '#F5B82E',
  verde: '#3fbf7f',
}
const ORO_BTN = 'linear-gradient(150deg, #f3cf63, #c8842e)'

const ESTADO_INFO = {
  activo: { txt: 'Activo', color: '#3fbf7f' },
  finalizado: { txt: 'Finalizado', color: '#8a9bc0' },
  borrador: { txt: 'Borrador', color: '#d88f3a' },
}

export default function PantallaMisTorneos({ onElegir, onCrear, onVolver }) {
  const [cargando, setCargando] = useState(true)
  const [torneos, setTorneos] = useState([])

  useEffect(() => {
    let vivo = true
    ;(async () => {
      const { torneos: lista } = await misTorneos()
      if (!vivo) return
      setTorneos(lista || [])
      setCargando(false)
    })()
    return () => { vivo = false }
  }, [])

  return (
    <div style={{ minHeight: '100dvh', background: C.fondo, color: C.txt, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      {/* cabecera */}
      <div style={{ flexShrink: 0, background: C.panel, borderBottom: `0.5px solid ${C.borde}`, paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ height: 4, display: 'flex' }}>
          <i style={{ flex: 1, background: '#1a4ed8' }} /><i style={{ flex: 1, background: '#fff' }} /><i style={{ flex: 1, background: '#d8281a' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
          <button onClick={onVolver} style={{ border: 'none', background: 'transparent', color: C.tenue, fontSize: 14, fontWeight: 600, cursor: 'pointer', minWidth: 64, textAlign: 'left' }}>‹ Volver</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: DISP, fontSize: 20, fontWeight: 900, letterSpacing: 0.5, color: C.txt }}>MIS TORNEOS</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: C.tenue }}>Los que organizas</div>
          </div>
          <button onClick={onCrear} title="Crear torneo" style={{ width: 36, height: 36, borderRadius: 12, border: 'none', background: ORO_BTN, color: '#1a1205', fontSize: 20, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
        </div>
      </div>

      {/* contenido */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '18px 16px 40px', maxWidth: 560, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {cargando ? (
          <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, padding: '40px 0' }}>Cargando…</div>
        ) : torneos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 20px' }}>
            <div style={{ fontSize: 46, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.txt, marginBottom: 8 }}>Aún no organizas ningún torneo</div>
            <div style={{ fontSize: 13.5, color: C.tenue, lineHeight: 1.5, marginBottom: 22 }}>Crea tu primer torneo y aparecerá aquí para administrarlo.</div>
            <button onClick={onCrear} style={{ border: 'none', borderRadius: 12, padding: '13px 26px', background: ORO_BTN, color: '#1a1205', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>+ Crear torneo</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: C.tenue, marginBottom: 14 }}>Elige un torneo para administrarlo.</div>
            {torneos.map((t) => {
              const est = ESTADO_INFO[t.estado] || ESTADO_INFO.activo
              return (
                <div key={t.id} onClick={() => onElegir && onElegir(t.id)} style={{ marginBottom: 12, cursor: 'pointer', background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: t.logo_url ? `url(${t.logo_url}) center/cover` : 'linear-gradient(150deg, rgba(60,54,44,.7), rgba(20,20,24,.7))', border: `1px solid ${C.borde2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23 }}>{!t.logo_url && (t.emoji || '🏆')}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre}</div>
                      <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span>📍 {t.lugar || 'Sin sede'}</span>
                        <span>· {t.cantidad_equipos || 0} equipos</span>
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 7, textTransform: 'uppercase', color: est.color, background: `${est.color}22` }}>{est.txt}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 24, color: C.oro, flexShrink: 0, lineHeight: 1 }}>›</div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}