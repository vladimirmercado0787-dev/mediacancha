import { useState, useEffect } from 'react'

// ============================================================
//  LIGAS PROFESIONALES — el hub de ligas de Media Cancha
//  Arriba: NBA (próximamente, será la liga principal).
//  Debajo: LNB (activa, abre la pantalla de la liga dominicana).
//  Pensado como lista para sumar más ligas en el futuro
//  (ABASACA, ligas de otros países, etc.) sin reescribir nada.
// ============================================================

export default function PantallaLigas({ onVolver, onAccion }) {
  const [proxima, setProxima] = useState(null) // liga "próximamente" tocada → modal
  const [esEscritorio, setEsEscritorio] = useState(false)

  useEffect(() => {
    const ver = () => setEsEscritorio(window.innerWidth >= 900)
    ver()
    window.addEventListener('resize', ver)
    return () => window.removeEventListener('resize', ver)
  }, [])

  // Paleta fija premium (neutra, sirve para todas las ligas)
  const C = {
    fondo: '#070d1d',
    glow1: 'rgba(62,107,214,0.16)',
    glow2: 'rgba(228,38,60,0.12)',
    panel: 'rgba(255,255,255,0.045)',
    panelAlt: 'rgba(255,255,255,0.07)',
    borde: 'rgba(150,172,228,0.18)',
    texto: '#eef3fc',
    texto2: '#c2cce0',
    tenue: '#8a9bc0',
  }

  // Definición de las ligas. activa=true abre su pantalla; activa=false muestra "próximamente".
  const ligas = [
    {
      id: 'nba',
      sigla: 'NBA',
      nombre: 'National Basketball Association',
      pais: 'Estados Unidos',
      activa: false,
      destacada: true,
      siglaColores: [
        { t: 'N', c: '#C8102E' },
        { t: 'B', c: '#ffffff' },
        { t: 'A', c: '#1D428A' },
      ],
      acentoA: '#1D428A',
      acentoB: '#C8102E',
      nota: 'Será la liga principal de Media Cancha. La estamos preparando.',
    },
    {
      id: 'lnb',
      sigla: 'LNB',
      nombre: 'Liga Nacional de Baloncesto',
      pais: 'República Dominicana',
      activa: true,
      destacada: false,
      siglaColores: [
        { t: 'L', c: '#1B3A8C' },
        { t: 'N', c: '#E8B65A' },
        { t: 'B', c: '#CE1126' },
      ],
      acentoA: '#1B3A8C',
      acentoB: '#CE1126',
    },
  ]

  const abrirLiga = (lg) => {
    if (lg.activa) {
      onAccion && onAccion(lg.id)
    } else {
      setProxima(lg)
    }
  }

  const Sigla = ({ partes, size }) => (
    <span style={{ fontWeight: 900, fontStyle: 'italic', letterSpacing: -1, fontSize: size, lineHeight: 1, fontFamily: '"Arial Narrow", "Helvetica Neue", Impact, system-ui, sans-serif' }}>
      {partes.map((p, i) => (
        <span key={i} style={{ color: p.c, textShadow: p.c === '#ffffff' ? '0 1px 3px rgba(0,0,0,.4)' : 'none' }}>{p.t}</span>
      ))}
    </span>
  )

  // --------- una tarjeta de liga ---------
  const TarjetaLiga = (lg) => {
    const destacada = lg.destacada
    return (
      <button
        key={lg.id}
        onClick={() => abrirLiga(lg)}
        style={{
          width: '100%',
          display: 'block',
          textAlign: 'left',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 22,
          border: `1px solid ${destacada ? 'rgba(150,172,228,0.30)' : C.borde}`,
          background: destacada
            ? `linear-gradient(135deg, ${lg.acentoA}22 0%, ${C.panelAlt} 45%, ${lg.acentoB}1f 100%)`
            : C.panel,
          padding: destacada ? '22px 20px' : '18px 18px',
          marginBottom: 16,
          boxShadow: destacada ? '0 16px 40px rgba(8,16,40,0.45)' : '0 8px 22px rgba(8,16,40,0.30)',
        }}
      >
        {/* franja tricolor / acento arriba */}
        <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, display: 'flex' }}>
          <span style={{ flex: 1, background: lg.siglaColores[0].c }} />
          <span style={{ flex: 1, background: lg.siglaColores[1].c }} />
          <span style={{ flex: 1, background: lg.siglaColores[2].c }} />
        </span>

        {lg.activa
          ? <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 9.5, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: '#7adfa6', background: 'rgba(47,191,113,0.16)', border: '1px solid rgba(47,191,113,0.4)', borderRadius: 20, padding: '4px 11px' }}>● En vivo</span>
          : <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 9.5, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: '#f0c674', background: 'rgba(232,182,79,0.14)', border: '1px solid rgba(232,182,79,0.4)', borderRadius: 20, padding: '4px 11px' }}>Próximamente</span>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6 }}>
          {/* "escudo" de texto */}
          <div style={{ width: destacada ? 84 : 66, height: destacada ? 84 : 66, borderRadius: 18, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <Sigla partes={lg.siglaColores} size={destacada ? 30 : 24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: destacada ? 22 : 18, fontWeight: 900, color: C.texto, letterSpacing: 0.2 }}>{lg.sigla}</div>
            <div style={{ fontSize: destacada ? 13.5 : 12.5, color: C.texto2, marginTop: 3, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lg.nombre}</div>
            <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 4 }}>{lg.pais}</div>
          </div>
          {lg.activa && <span style={{ fontSize: 26, color: C.tenue, flexShrink: 0 }}>›</span>}
        </div>

        {destacada && (
          <div style={{ marginTop: 16, fontSize: 12.5, color: C.texto2, lineHeight: 1.5, background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 13px' }}>
            {lg.nota}
          </div>
        )}
      </button>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.fondo, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* glows de fondo */}
      <div style={{ position: 'absolute', top: -120, left: -80, width: 360, height: 360, borderRadius: '50%', background: C.glow1, filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -140, right: -100, width: 400, height: 400, borderRadius: '50%', background: C.glow2, filter: 'blur(90px)', pointerEvents: 'none' }} />

      {/* HEADER */}
      <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: 'rgba(7,13,29,0.86)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.borde}` }}>
        <div style={{ maxWidth: esEscritorio ? 720 : '100%', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
          <button onClick={onVolver} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 11, border: `1px solid ${C.borde}`, background: C.panel, color: C.texto, fontSize: 19, cursor: 'pointer', flexShrink: 0 }}>‹</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.texto, letterSpacing: 0.2 }}>Ligas Profesionales</div>
            <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 1 }}>El baloncesto profesional, en un solo lugar</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: C.panel, border: `1px solid ${C.borde}`, fontSize: 18 }}>🏀</div>
        </div>
      </div>

      {/* CUERPO */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: esEscritorio ? 720 : '100%', margin: '0 auto', padding: '20px 16px calc(env(safe-area-inset-bottom) + 40px)' }}>
          <div style={{ fontSize: 12.5, color: C.texto2, lineHeight: 1.55, marginBottom: 20 }}>
            Hoy: la <strong style={{ color: C.texto }}>LNB</strong> de República Dominicana, en vivo. Pronto: la <strong style={{ color: C.texto }}>NBA</strong> y más ligas del mundo dentro de Media Cancha.
          </div>

          {ligas.map((lg) => TarjetaLiga(lg))}

          <div style={{ textAlign: 'center', fontSize: 11, color: C.tenue, marginTop: 14, lineHeight: 1.5 }}>
            Más ligas en camino.
          </div>
        </div>
      </div>

      {/* MODAL "PRÓXIMAMENTE" */}
      {proxima && (
        <div onClick={() => setProxima(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.66)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: C.fondo, borderTopLeftRadius: 24, borderTopRightRadius: 24, border: `1px solid ${C.borde}`, padding: '0 0 calc(env(safe-area-inset-bottom) + 26px)' }}>
            <div style={{ display: 'flex', height: 4 }}>
              <span style={{ flex: 1, background: proxima.siglaColores[0].c }} />
              <span style={{ flex: 1, background: proxima.siglaColores[1].c }} />
              <span style={{ flex: 1, background: proxima.siglaColores[2].c }} />
            </div>
            <div style={{ padding: '24px 22px 0', textAlign: 'center' }}>
              <div style={{ width: 92, height: 92, borderRadius: 22, margin: '0 auto 16px', display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Sigla partes={proxima.siglaColores} size={34} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase', color: '#f0c674', marginBottom: 8 }}>Próximamente</div>
              <div style={{ fontSize: 21, fontWeight: 900, color: C.texto }}>{proxima.sigla}</div>
              <div style={{ fontSize: 13, color: C.texto2, marginTop: 4 }}>{proxima.nombre}</div>
              <div style={{ fontSize: 13.5, color: C.texto2, lineHeight: 1.6, marginTop: 16 }}>
                {proxima.nota}
              </div>
              <button onClick={() => setProxima(null)} style={{ width: '100%', marginTop: 22, padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(180deg, #2a3a6b, #1a2748)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
