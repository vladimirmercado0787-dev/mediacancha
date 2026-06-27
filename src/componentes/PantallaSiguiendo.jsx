import { useState, useEffect } from 'react'
import { aQuienesSigo } from '../social'
import { torneosQueSigo } from '../torneos'

// ============================================================
//  SIGUIENDO — a quién y qué sigo
//  Se abre desde el perfil al tocar "Siguiendo N".
//  Muestra Personas y Torneos que sigo; todo cliqueable.
//  (Las ligas aparecerán aquí cuando exista el seguir de ligas.)
// ============================================================

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const fCond = "'Oswald', 'Arial Narrow', 'Helvetica Neue', sans-serif"
const C = {
  bg: '#070d1d', panel: 'rgba(9,14,28,.97)', card: '#111a30',
  oro: '#f5b82e', oroClaro: '#ffd66b', txt: '#f3f6fc', tenue: '#9aa6bd', muyTenue: '#6b7791',
  borde: 'rgba(245,184,46,.22)', bordeSuave: 'rgba(255,255,255,.07)', teal: '#27d3c2',
}
const TABS = [
  { id: 'personas', txt: 'Personas' },
  { id: 'torneos', txt: 'Torneos' },
]

export default function PantallaSiguiendo({ onVolver, onVerPerfil, onVerTorneo }) {
  const [tab, setTab] = useState('personas')
  const [personas, setPersonas] = useState([])
  const [torneos, setTorneos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    setCargando(true)
    Promise.all([aQuienesSigo(), torneosQueSigo()])
      .then(([p, t]) => { if (!vivo) return; setPersonas(p.personas || []); setTorneos(t.torneos || []) })
      .catch(() => {})
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [])

  const nombre = (p) => `${(p && p.nombre) || ''} ${(p && p.apellido) || ''}`.trim() || 'Jugador'
  const Avatar = ({ url, txt, ring }) => (
    <span style={{ width: 46, height: 46, borderRadius: ring ? 13 : '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: url ? `url(${url}) center/cover` : `linear-gradient(150deg, ${C.oroClaro}, ${C.oro})`, color: '#1a1205', fontWeight: 800, fontSize: 17, border: `1px solid ${C.bordeSuave}` }}>{!url && txt}</span>
  )

  let lista = null
  if (cargando) {
    lista = <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, padding: '40px 0' }}>Cargando…</div>
  } else if (tab === 'personas') {
    lista = personas.length === 0 ? (
      <Vacio icono="👥" titulo="No sigues a nadie todavía" texto="Cuando sigas a un jugador, aparecerá aquí." />
    ) : personas.map((p) => (
      <button key={p.id} onClick={() => onVerPerfil && onVerPerfil(p.id)} style={fila}>
        <Avatar url={p.foto_url} txt={nombre(p).slice(0, 1).toUpperCase()} />
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre(p)}</div>
          <div style={{ fontSize: 11.5, color: C.tenue }}>{p.codigo_unico || ''}{p.municipio ? ` · ${p.municipio}` : ''}</div>
        </div>
        <span style={{ color: C.muyTenue, fontSize: 20, flexShrink: 0 }}>›</span>
      </button>
    ))
  } else {
    lista = torneos.length === 0 ? (
      <Vacio icono="🏆" titulo="No sigues ningún torneo" texto="Sigue un torneo desde su pantalla pública y aparecerá aquí." />
    ) : torneos.map((t) => (
      <button key={t.id} onClick={() => onVerTorneo && onVerTorneo(t.id)} style={fila}>
        <Avatar url={t.logo_url} txt={t.emoji || '🏆'} ring />
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre || 'Torneo'}</div>
          <div style={{ fontSize: 11.5, color: C.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.lugar || (t.estado === 'finalizado' ? 'Finalizado' : 'En juego')}</div>
        </div>
        <span style={{ color: C.muyTenue, fontSize: 20, flexShrink: 0 }}>›</span>
      </button>
    ))
  }

  return (
    <div style={{ fontFamily: FONT, color: C.txt, background: C.bg, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 32% at 50% 0%, rgba(245,184,46,.12), transparent 72%)' }} />

      {/* HEADER */}
      <div style={{ flexShrink: 0, position: 'relative', zIndex: 3, background: C.panel, borderBottom: `0.5px solid ${C.bordeSuave}`, paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ height: 4, display: 'flex', maxWidth: 560, margin: '0 auto' }}><i style={{ flex: 1, background: '#1b3a8c' }} /><i style={{ flex: 1, background: '#fff' }} /><i style={{ flex: 1, background: '#ce1126' }} /></div>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px' }}>
          <button onClick={onVolver} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,.06)', color: C.txt, fontSize: 22, cursor: 'pointer' }}>‹</button>
          <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 19, letterSpacing: 0.4, textTransform: 'uppercase', color: C.txt }}>Siguiendo</div>
        </div>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', gap: 8, padding: '0 14px 10px' }}>
          {TABS.map((p) => {
            const activa = p.id === tab
            const n = p.id === 'personas' ? personas.length : torneos.length
            return (
              <button key={p.id} onClick={() => setTab(p.id)} style={{ flex: 1, padding: '9px 0', borderRadius: 11, border: activa ? 'none' : `0.5px solid ${C.bordeSuave}`, background: activa ? `linear-gradient(180deg, ${C.oroClaro}, ${C.oro})` : 'rgba(255,255,255,.04)', color: activa ? '#1a1205' : C.tenue, fontFamily: fCond, fontWeight: 700, fontSize: 13.5, letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer' }}>{p.txt}{!cargando ? ` ${n}` : ''}</button>
            )
          })}
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 14px calc(env(safe-area-inset-bottom) + 34px)' }}>
          {lista}
          {!cargando && (
            <div style={{ fontSize: 11.5, color: C.muyTenue, textAlign: 'center', lineHeight: 1.6, padding: '18px 10px 0' }}>Las ligas que sigas aparecerán aquí también, cuando armemos su pantalla pública.</div>
          )}
        </div>
      </div>
    </div>
  )
}

const fila = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'rgba(255,255,255,.04)', border: '0.5px solid rgba(255,255,255,.07)', borderRadius: 13, padding: 11, marginBottom: 9, cursor: 'pointer' }

function Vacio({ icono, titulo, texto }) {
  return (
    <div style={{ textAlign: 'center', padding: '44px 24px' }}>
      <div style={{ fontSize: 50, marginBottom: 12, opacity: 0.9 }}>{icono}</div>
      <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 18, textTransform: 'uppercase', letterSpacing: 0.4, color: '#f3f6fc', marginBottom: 8 }}>{titulo}</div>
      <div style={{ color: '#9aa6bd', fontSize: 13, lineHeight: 1.55, maxWidth: 300, margin: '0 auto' }}>{texto}</div>
    </div>
  )
}