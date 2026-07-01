import { useState, useEffect } from 'react'
import { misLigas } from '../ligas'
import { supabase } from '../supabaseClient'

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
    teal: '#27d3c2',
    tealBorde: 'rgba(39,211,194,0.34)',
  }
  const TEAL_BTN = 'linear-gradient(150deg, #36e3d2, #0e9c90)'

  // Etiquetas de días para mostrar bonito
  const DIA_LBL = { lun: 'Lun', mar: 'Mar', mie: 'Mié', jue: 'Jue', vie: 'Vie', sab: 'Sáb', dom: 'Dom' }
  const diasTexto = (arr) => {
    if (!arr || arr.length === 0) return 'Días por definir'
    if (arr.length === 7) return 'Todos los días'
    return arr.map((d) => DIA_LBL[d] || d).join(' · ')
  }

  // Ligas DE LA COMUNIDAD — se cargan de verdad (las que tú creaste).
  const [ligasComunidad, setLigasComunidad] = useState([])
  const [cargandoLigas, setCargandoLigas] = useState(true)

  useEffect(() => {
    let vivo = true
    misLigas()
      .then(({ ligas }) => { if (vivo) setLigasComunidad(ligas || []) })
      .catch(() => { if (vivo) setLigasComunidad([]) })
      .finally(() => { if (vivo) setCargandoLigas(false) })
    return () => { vivo = false }
  }, [])

  // Definición de las ligas. activa=true abre su pantalla; activa=false muestra "próximamente".
  const ligas = [
    {
      id: 'nba',
      sigla: 'NBA',
      nombre: 'National Basketball Association',
      pais: 'Estados Unidos',
      activa: true,
      destacada: true,
      siglaColores: [
        { t: 'N', c: '#D31B3C' },
        { t: 'B', c: '#F9A01B' },
        { t: 'A', c: '#ffffff' },
      ],
      acentoA: '#98002E',
      acentoB: '#F9A01B',
      nota: 'Será la liga principal de Media Cancha. La estamos preparando con su pantalla completa.',
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
    {
      id: 'bsn',
      sigla: 'BSN',
      nombre: 'Baloncesto Superior Nacional',
      pais: 'Puerto Rico',
      activa: false,
      destacada: false,
      siglaColores: [
        { t: 'B', c: '#ED1C24' },
        { t: 'S', c: '#ffffff' },
        { t: 'N', c: '#0050A4' },
      ],
      acentoA: '#0050A4',
      acentoB: '#ED1C24',
      nota: 'La liga profesional de Puerto Rico. La sumaremos a Media Cancha más adelante.',
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

  // ---- Portada: noticias de la LNB corriendo solas ----
  const [noticiasHero, setNoticiasHero] = useState([])
  const [heroIdx, setHeroIdx] = useState(0)

  useEffect(() => {
    supabase.from('lnb_noticias').select('id, title, image_url, excerpt').not('image_url', 'is', null).order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => setNoticiasHero((data || []).filter((n) => n.image_url)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (noticiasHero.length < 2) return
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % noticiasHero.length), 5000)
    return () => clearInterval(t)
  }, [noticiasHero])

  const Portada = () => {
    if (!noticiasHero.length) {
      return (
        <button onClick={() => onAccion && onAccion('lnb')} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', position: 'relative', overflow: 'hidden', borderRadius: 22, height: 190, marginBottom: 22, border: `1px solid ${C.borde}`, background: 'linear-gradient(135deg, #16233f 0%, #0c1428 60%, #1b3a8c 100%)', boxShadow: '0 14px 34px rgba(8,16,40,0.5)', padding: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', background: 'rgba(27,58,140,0.92)', borderRadius: 8, padding: '4px 10px', letterSpacing: 0.5 }}>LNB</span>
          <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.15 }}>Liga Nacional de Baloncesto</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 5 }}>La liga profesional dominicana, en vivo →</div>
          </div>
        </button>
      )
    }
    const n = noticiasHero[heroIdx] || noticiasHero[0]
    return (
      <div onClick={() => onAccion && onAccion('lnb')} style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', height: 210, marginBottom: 22, cursor: 'pointer', boxShadow: '0 14px 34px rgba(8,16,40,0.5)', border: `1px solid ${C.borde}` }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${n.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(3,8,20,0.96) 0%, rgba(3,8,20,0.5) 45%, rgba(3,8,20,0.2) 100%)' }} />
        <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', background: 'rgba(27,58,140,0.92)', borderRadius: 8, padding: '4px 10px', letterSpacing: 0.5 }}>LNB</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#7adfa6', textTransform: 'uppercase', letterSpacing: 0.7 }}>● Noticias</span>
        </div>
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.25, textShadow: '0 2px 8px rgba(0,0,0,.7)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.title}</div>
        </div>
        <div style={{ position: 'absolute', bottom: 12, left: 16, display: 'flex', gap: 5 }}>
          {noticiasHero.map((_, i) => (
            <span key={i} style={{ width: i === heroIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === heroIdx ? '#F5B82E' : 'rgba(255,255,255,0.45)', transition: 'width .3s' }} />
          ))}
        </div>
      </div>
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
            <div style={{ fontSize: 18, fontWeight: 900, color: C.texto, letterSpacing: 0.2 }}>Ligas</div>
            <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 1 }}>Las profesionales y las tuyas</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: C.panel, border: `1px solid ${C.borde}`, fontSize: 18 }}>🏀</div>
        </div>
      </div>

      {/* CUERPO */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: esEscritorio ? 720 : '100%', margin: '0 auto', padding: '20px 16px calc(env(safe-area-inset-bottom) + 40px)' }}>
                    {/* PORTADA — noticias profesionales corriendo solas */}
          {Portada()}

          {/* ===================== APARTADO 2: LIGAS PROFESIONALES ===================== */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F5B82E', boxShadow: '0 0 10px #F5B82E' }} />
            <span style={{ fontSize: 15, fontWeight: 900, color: C.texto, letterSpacing: 0.2 }}>Ligas profesionales</span>
          </div>
          <div style={{ fontSize: 12.5, color: C.texto2, lineHeight: 1.55, marginBottom: 16 }}>
            Hoy: la <strong style={{ color: C.texto }}>LNB</strong> de República Dominicana, en vivo. Pronto: la <strong style={{ color: C.texto }}>NBA</strong> y más ligas del mundo dentro de Media Cancha.
          </div>

          {ligas.map((lg) => TarjetaLiga(lg))}

          {/* CENTRO DE COMANDO — asistente de Fantasy NBA */}
          <button
            onClick={() => onAccion && onAccion('comando')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer',
              position: 'relative', overflow: 'hidden', borderRadius: 22, marginBottom: 16,
              border: '1px solid rgba(245,184,46,0.4)',
              background: 'linear-gradient(135deg, rgba(245,184,46,0.18) 0%, rgba(255,255,255,0.06) 55%, rgba(245,184,46,0.10) 100%)',
              padding: '18px 18px', boxShadow: '0 10px 28px rgba(8,16,40,0.40)',
            }}
          >
            <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 9, fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase', color: '#F5B82E', background: 'rgba(245,184,46,0.14)', border: '1px solid rgba(245,184,46,0.4)', borderRadius: 20, padding: '4px 9px' }}>Esperando temporada</span>
            <div style={{ width: 60, height: 60, borderRadius: 16, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 28 }}>🎯</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.texto, letterSpacing: 0.2 }}>Centro de Comando</div>
              <div style={{ fontSize: 12.5, color: C.texto2, marginTop: 3, fontWeight: 600 }}>Tu asistente de Fantasy NBA</div>
              <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 4 }}>Radar de noticias en vivo · estrategia en octubre</div>
            </div>
          </button>

          {/* NOTICIAS RÁPIDAS — feed en vivo de la NBA */}
          <button
            onClick={() => onAccion && onAccion('noticias')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer',
              position: 'relative', overflow: 'hidden', borderRadius: 22, marginBottom: 16,
              border: '1px solid rgba(47,191,113,0.35)',
              background: 'linear-gradient(135deg, rgba(47,191,113,0.16) 0%, rgba(255,255,255,0.06) 50%, rgba(90,169,255,0.12) 100%)',
              padding: '18px 18px', boxShadow: '0 10px 28px rgba(8,16,40,0.40)',
            }}
          >
            <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 9.5, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: '#7adfa6', background: 'rgba(47,191,113,0.16)', border: '1px solid rgba(47,191,113,0.4)', borderRadius: 20, padding: '4px 11px' }}>● En vivo</span>
            <div style={{ width: 60, height: 60, borderRadius: 16, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 28 }}>⚡</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.texto, letterSpacing: 0.2 }}>Noticias Rápidas</div>
              <div style={{ fontSize: 12.5, color: C.texto2, marginTop: 3, fontWeight: 600 }}>Lesiones, quintetos y traspasos de la NBA</div>
              <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 4 }}>Al instante, todos los días</div>
            </div>
            <span style={{ fontSize: 26, color: C.tenue, flexShrink: 0 }}>›</span>
          </button>

          {/* PLANTILLAS NBA — rosters de los equipos */}
          <button
            onClick={() => onAccion && onAccion('rosters')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer',
              position: 'relative', overflow: 'hidden', borderRadius: 22, marginBottom: 16,
              border: '1px solid rgba(90,169,255,0.35)',
              background: 'linear-gradient(135deg, rgba(90,169,255,0.16) 0%, rgba(255,255,255,0.06) 55%, rgba(62,107,214,0.12) 100%)',
              padding: '18px 18px', boxShadow: '0 10px 28px rgba(8,16,40,0.40)',
            }}
          >
            <div style={{ width: 60, height: 60, borderRadius: 16, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 28 }}>📋</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.texto, letterSpacing: 0.2 }}>Plantillas NBA</div>
              <div style={{ fontSize: 12.5, color: C.texto2, marginTop: 3, fontWeight: 600 }}>Rosters de los 30 equipos</div>
              <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 4 }}>Quién juega y quién no, en temporada</div>
            </div>
            <span style={{ fontSize: 26, color: C.tenue, flexShrink: 0 }}>›</span>
          </button>


          <div style={{ textAlign: 'center', fontSize: 11, color: C.tenue, marginTop: 14, lineHeight: 1.5 }}>
            Más ligas en camino.
          </div>

          {/* separador entre los dos mundos */}
          <div style={{ height: 1, background: C.borde, margin: '26px 0 22px' }} />

          {/* ===================== APARTADO 1: LIGAS DE LA COMUNIDAD ===================== */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.teal, boxShadow: `0 0 10px ${C.teal}` }} />
            <span style={{ fontSize: 15, fontWeight: 900, color: C.texto, letterSpacing: 0.2 }}>Ligas de la comunidad</span>
          </div>
          <div style={{ fontSize: 12, color: C.tenue, lineHeight: 1.5, marginBottom: 14 }}>
            Donde tú juegas u organizas. Una persona puede estar en varias, y cada liga tiene sus propios días.
          </div>

          {cargandoLigas ? (
            <div style={{ color: C.tenue, fontSize: 13, padding: '14px 4px' }}>Cargando tus ligas…</div>
          ) : ligasComunidad.length === 0 ? (
            <div style={{ border: `1px dashed ${C.tealBorde}`, background: 'rgba(39,211,194,0.05)', borderRadius: 16, padding: '20px 16px', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>🤝</div>
              <div style={{ color: C.texto, fontSize: 14.5, fontWeight: 800, marginBottom: 4 }}>Aún no tienes ligas</div>
              <div style={{ color: C.tenue, fontSize: 12.5, lineHeight: 1.5 }}>Crea la primera y aparecerá aquí. Puedes pertenecer a varias a la vez.</div>
            </div>
          ) : (
            ligasComunidad.map((lg) => (
              <button
                key={lg.id}
                onClick={() => onAccion && onAccion('abrirLiga:' + lg.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer',
                  position: 'relative', overflow: 'hidden', borderRadius: 20, marginBottom: 12,
                  border: `1px solid ${C.tealBorde}`,
                  background: 'linear-gradient(135deg, rgba(39,211,194,0.12) 0%, rgba(255,255,255,0.05) 55%, rgba(39,211,194,0.07) 100%)',
                  padding: '16px 16px', boxShadow: '0 10px 26px rgba(8,16,40,0.34)',
                }}
              >
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: C.teal }} />
                <div style={{ width: 56, height: 56, borderRadius: 15, flexShrink: 0, display: 'grid', placeItems: 'center', background: lg.logo_url ? `url(${lg.logo_url}) center/cover` : 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 26 }}>{!lg.logo_url && (lg.emoji || '🤝')}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16.5, fontWeight: 900, color: C.texto, letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lg.nombre}</div>
                  <div style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 800, color: '#0a2b28', background: C.teal, borderRadius: 20, padding: '3px 10px', marginTop: 5 }}>{diasTexto(lg.dias)}</div>
                  <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 5 }}>{lg.lugar || 'Sin lugar'}{lg.estado && lg.estado !== 'activa' ? ` · ${lg.estado}` : ''}</div>
                </div>
                <span style={{ fontSize: 24, color: C.teal, flexShrink: 0 }}>›</span>
              </button>
            ))
          )}

          {/* + Crear liga */}
          <button
            onClick={() => onAccion && onAccion('crearLiga')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              cursor: 'pointer', borderRadius: 16, marginBottom: 8,
              border: `1px dashed ${C.tealBorde}`, background: 'rgba(39,211,194,0.07)',
              padding: '15px', color: C.teal, fontSize: 14.5, fontWeight: 800,
            }}
          >
            <span style={{ fontSize: 19 }}>＋</span> Crear una liga
          </button>

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