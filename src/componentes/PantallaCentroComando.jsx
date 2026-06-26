import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

// ============================================================
//  CENTRO DE COMANDO — Pantalla principal (hub personal de Fantasy)
//  Personal de Vladimir. A futuro se amarra a su cuenta (como Cocina PAE)
//  y vive en Mis Ligas. Hoy entra temporal desde Ligas para probar.
//  Estructura aprobada: barra de atencion · tus ligas · modulos · radar.
// ============================================================

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const C = {
  fondo: '#070d1d',
  glow1: 'rgba(245,184,46,0.13)',
  glow2: 'rgba(62,107,214,0.15)',
  panel: 'rgba(255,255,255,0.05)',
  panel2: 'rgba(255,255,255,0.035)',
  borde: 'rgba(150,172,228,0.18)',
  texto: '#eef3fc',
  texto2: '#c2cce0',
  tenue: '#8a9bc0',
  tenue2: '#5d6c8c',
  oro: '#F5B82E',
  verde: '#2FBF71',
  azul: '#5AA9FF',
}

const CAT = { LESION: '#FF5A5F', QUINTETO: '#2FBF71', TRASPASO: '#5AA9FF', RUMOR: '#F5B82E' }
const catColor = (k) => CAT[k] || '#8a9bc0'

function hace(iso) {
  if (!iso) return ''
  const d = new Date(iso); if (isNaN(+d)) return ''
  const seg = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seg < 60) return 'ahora'
  const min = Math.floor(seg / 60); if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60); if (h < 24) return `hace ${h} h`
  const dias = Math.floor(h / 24); if (dias === 1) return 'ayer'
  return `hace ${dias} dias`
}

const LIGAS = [
  { nombre: 'Liga 1', nota: 'Esperando temporada' },
  { nombre: 'Liga 2', nota: 'Esperando temporada' },
]

const MODULOS = [
  { icon: '🎯', t: 'Plan de la semana', d: 'pronostico y estrategia' },
  { icon: '👥', t: 'Mi roster', d: 'tu equipo y alineacion' },
  { icon: '🔁', t: 'Movimientos', d: 'a quien recoger' },
  { icon: '📅', t: 'Calendario', d: 'quien juega mas' },
]

export default function PantallaCentroComando({ onVolver, onAbrirDraft, onAbrirNoticias }) {
  const [noticias, setNoticias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [esEscritorio, setEsEscritorio] = useState(false)
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    const ver = () => setEsEscritorio(window.innerWidth >= 900)
    ver(); window.addEventListener('resize', ver)
    return () => window.removeEventListener('resize', ver)
  }, [])

  useEffect(() => {
    let vivo = true
    supabase.from('micro_news').select('*').eq('is_active', true)
      .order('published_at', { ascending: false }).limit(4)
      .then(({ data }) => { if (vivo) { setNoticias(data || []); setCargando(false) } })
    return () => { vivo = false }
  }, [])

  const tocarPendiente = (nombre) => {
    setAviso(`${nombre} se activa en octubre, cuando arranque la temporada.`)
    setTimeout(() => setAviso(null), 2600)
  }

  const ANCHO = esEscritorio ? 640 : '100%'

  const Tag = ({ children }) => (
    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: C.oro, background: 'rgba(245,184,46,0.12)', border: `1px solid ${C.oro}44`, borderRadius: 20, padding: '3px 8px', whiteSpace: 'nowrap' }}>{children}</span>
  )

  const Label = ({ children, extra }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 2px 10px' }}>
      <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: C.tenue }}>{children}</span>
      {extra}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.fondo, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: FONT }}>
      <div style={{ position: 'absolute', top: -120, left: -80, width: 360, height: 360, borderRadius: '50%', background: C.glow1, filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -150, right: -110, width: 420, height: 420, borderRadius: '50%', background: C.glow2, filter: 'blur(95px)', pointerEvents: 'none' }} />

      {/* HEADER */}
      <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: 'rgba(7,13,29,0.86)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.borde}` }}>
        <div style={{ maxWidth: ANCHO, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px' }}>
          <button onClick={onVolver} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 11, border: `1px solid ${C.borde}`, background: C.panel, color: C.texto, fontSize: 19, cursor: 'pointer', flexShrink: 0 }}>‹</button>
          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'rgba(245,184,46,0.14)', border: `1px solid ${C.oro}55`, fontSize: 20 }}>🎯</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.texto, letterSpacing: 0.2 }}>Centro de Comando</div>
            <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 1 }}>Fantasy NBA · personal</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 20, padding: '5px 10px', color: C.texto2, fontSize: 11.5 }}>
            <span style={{ fontSize: 12 }}>🔒</span> Vladimir
          </div>
        </div>
      </div>

      {/* CUERPO */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: ANCHO, margin: '0 auto', padding: '16px 16px calc(env(safe-area-inset-bottom) + 40px)' }}>

          {/* BARRA DE ATENCION */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(245,184,46,0.10)', border: `1px solid ${C.oro}55`, borderRadius: 15, padding: '13px 14px' }}>
            <span style={{ fontSize: 22 }}>📅</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.texto }}>Pretemporada</div>
              <div style={{ fontSize: 11.5, color: C.texto2, marginTop: 1 }}>La temporada arranca en octubre. Todo quedara listo para ese dia.</div>
            </div>
          </div>

          {/* SALA DE DRAFT — destacada, activa hoy */}
          <button onClick={onAbrirDraft} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer', marginTop: 16, borderRadius: 18, border: `1px solid ${C.oro}66`, background: 'linear-gradient(135deg, rgba(245,184,46,0.16) 0%, rgba(255,255,255,0.05) 55%, rgba(245,184,46,0.10) 100%)', padding: '16px 16px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 15, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 26 }}>📋</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: C.texto, letterSpacing: 0.2 }}>Sala de Draft</div>
              <div style={{ fontSize: 12, color: C.texto2, marginTop: 3, fontWeight: 600 }}>Tu sala de guerra para el día del draft</div>
              <div style={{ fontSize: 11, color: C.tenue, marginTop: 3 }}>Motor de valor · recomendación en vivo</div>
            </div>
            <span style={{ fontSize: 20, color: C.oro, flexShrink: 0 }}>›</span>
          </button>

          {/* TUS LIGAS */}
          <Label extra={<Tag>octubre</Tag>}>Tus ligas</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {LIGAS.map((lg) => (
              <div key={lg.nombre} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 14, padding: '13px 14px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.25)', border: `1px solid ${C.borde}`, fontSize: 18 }}>🏀</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: C.texto }}>{lg.nombre}</div>
                  <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 2 }}>{lg.nota}</div>
                </div>
                <span style={{ fontSize: 18, color: C.tenue2 }}>›</span>
              </div>
            ))}
          </div>

          {/* MODULOS */}
          <Label>Modulos</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            {MODULOS.map((m) => (
              <button key={m.t} onClick={() => tocarPendiente(m.t)} style={{ textAlign: 'left', cursor: 'pointer', background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 14, padding: '14px 12px', position: 'relative' }}>
                <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: C.tenue2 }}>octubre</span>
                <div style={{ fontSize: 23 }}>{m.icon}</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.texto, marginTop: 7 }}>{m.t}</div>
                <div style={{ fontSize: 11, color: C.tenue, marginTop: 2 }}>{m.d}</div>
              </button>
            ))}
          </div>

          {/* RADAR DE NOTICIAS (vivo) */}
          <Label extra={<span style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto', fontSize: 10.5, fontWeight: 800, color: C.verde }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: C.verde }} /> EN VIVO</span>}>📡 Radar de noticias</Label>
          <div style={{ background: C.panel2, border: `1px solid ${C.borde}`, borderRadius: 14, padding: '6px 4px' }}>
            {cargando && <div style={{ textAlign: 'center', color: C.tenue, fontSize: 12, padding: '16px 0' }}>Cargando…</div>}
            {!cargando && noticias.length === 0 && <div style={{ textAlign: 'center', color: C.tenue, fontSize: 12, padding: '16px 12px' }}>Sin noticias por ahora. El robot las trae solo.</div>}
            {!cargando && noticias.map((n, i) => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 11px', borderTop: i === 0 ? 'none' : `1px solid ${C.borde}` }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: catColor(n.category), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.headline}</div>
                  <div style={{ fontSize: 10.5, color: C.tenue, marginTop: 1 }}>{n.player_name} · {hace(n.published_at)}</div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={onAbrirNoticias} style={{ width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 13, padding: '13px', color: C.oro, fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>
            📰 Ver noticias completas (con foto) →
          </button>

          <div style={{ textAlign: 'center', fontSize: 11, color: C.tenue2, marginTop: 16 }}>Solo tu ves esto · entras con tu cuenta</div>
        </div>
      </div>

      {/* AVISO al tocar un modulo pendiente */}
      {aviso && (
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 'calc(env(safe-area-inset-bottom) + 18px)', zIndex: 5, maxWidth: ANCHO, margin: '0 auto', background: 'rgba(20,28,52,0.96)', border: `1px solid ${C.oro}55`, borderRadius: 13, padding: '12px 14px', color: C.texto2, fontSize: 12.5, textAlign: 'center', backdropFilter: 'blur(10px)' }}>
          {aviso}
        </div>
      )}
    </div>
  )
}