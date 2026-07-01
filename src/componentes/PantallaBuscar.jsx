import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { miUsuarioId, alternarSeguir, idsQueSigo } from '../social'
import fondoCancha from '../assets/fondo-cancha.webp'

// ============================================================
//  IDENTIDAD MEDIA CANCHA (rediseño) — usa la misma clave 'mc_tema'
//  y los mismos nombres de tema de la app (dorado/azul/claro/larimar)
//  para no chocar con las pantallas que todavía no se han migrado.
//  Aquí "azul" = el navy premium "Cancha de noche".
// ============================================================
const FUENTE = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const DISP = '"Arial Narrow","Roboto Condensed","Helvetica Neue",Impact,sans-serif'
const TRI_AZUL = '#1b3a8c', TRI_ROJO = '#ce1126'

const TEMAS = {
  azul: { esClaro: false, bg: '#070f26', glow1: 'rgba(62,107,214,.22)', glow2: 'rgba(228,38,60,.14)', veil: 'linear-gradient(180deg, rgba(7,13,29,.82), rgba(5,10,24,.95))', surf: 'rgba(255,255,255,.06)', surf2: 'rgba(255,255,255,.09)', bd: 'rgba(150,172,228,.18)', bd2: 'rgba(150,172,228,.32)', tx: '#eef3fc', tx2: '#c2cce0', tn: '#8a9bc0', accent: '#3e6bd6', hot: '#e8b65a', live: '#e4263c', boton: 'linear-gradient(135deg,#3e6bd6,#2748a0)', onBoton: '#fff', inputBg: 'rgba(255,255,255,.05)', inputBd: 'rgba(150,172,228,.25)', balon: ['#9fd4fb', '#4f8fd0', '#1d4a80'], nombre: 'Cancha de noche' },
  dorado: { esClaro: false, bg: '#141009', glow1: 'rgba(232,182,79,.20)', glow2: 'rgba(180,30,47,.12)', veil: 'linear-gradient(180deg, rgba(20,16,9,.84), rgba(14,11,6,.95))', surf: 'rgba(255,240,210,.06)', surf2: 'rgba(255,240,210,.10)', bd: 'rgba(232,182,79,.22)', bd2: 'rgba(232,182,79,.40)', tx: '#f6efe1', tx2: '#dccdb0', tn: '#a08e6f', accent: '#e8b65a', hot: '#f0c674', live: '#e4263c', boton: 'linear-gradient(135deg,#f0c674,#caa24a)', onBoton: '#211705', inputBg: 'rgba(255,240,210,.05)', inputBd: 'rgba(232,182,79,.30)', balon: ['#fbe08a', '#d18f33', '#9a6420'], nombre: 'Dorado' },
  claro: { esClaro: true, bg: '#eef2fa', glow1: 'rgba(27,58,140,.10)', glow2: 'rgba(206,17,38,.07)', veil: 'linear-gradient(180deg, rgba(238,242,250,.84), rgba(233,238,248,.96))', surf: '#ffffff', surf2: '#f5f8fd', bd: '#e5eaf4', bd2: '#d3dcec', tx: '#13224a', tx2: '#46557a', tn: '#8b97b2', accent: '#1b3a8c', hot: '#1b3a8c', live: '#ce1126', boton: 'linear-gradient(135deg,#1b3a8c,#2a4fa8)', onBoton: '#fff', inputBg: '#ffffff', inputBd: '#d3dcec', balon: ['#2a4fa8', '#1b3a8c', '#16224a'], nombre: 'Cancha de día' },
  larimar: { esClaro: false, bg: '#04181f', glow1: 'rgba(63,193,201,.22)', glow2: 'rgba(86,214,221,.12)', veil: 'linear-gradient(180deg, rgba(4,24,31,.84), rgba(3,18,26,.95))', surf: 'rgba(200,250,255,.06)', surf2: 'rgba(200,250,255,.10)', bd: 'rgba(63,193,201,.22)', bd2: 'rgba(63,193,201,.42)', tx: '#e8fbff', tx2: '#b9e6ec', tn: '#79b4bd', accent: '#3fc1c9', hot: '#56d6dd', live: '#ff5a6e', boton: 'linear-gradient(135deg,#56d6dd,#2ba6ae)', onBoton: '#04222a', inputBg: 'rgba(200,250,255,.05)', inputBd: 'rgba(63,193,201,.30)', balon: ['#8fd4e8', '#3fc1c9', '#1a6a8a'], nombre: 'Larimar' },
}
const ORDEN_TEMAS = ['azul', 'dorado', 'claro', 'larimar']
function leerTema() {
  try { const v = localStorage.getItem('mc_tema'); if (TEMAS[v]) return v } catch (e) {}
  return 'azul'
}

export default function PantallaBuscar({ onVolver, onVerPerfil }) {
  const [tema] = useState(leerTema)
  const T = TEMAS[tema] || TEMAS.azul
  const [esEscritorio, setEsEscritorio] = useState(typeof window !== 'undefined' ? window.innerWidth >= 900 : false)
  useEffect(() => {
    const onResize = () => setEsEscritorio(window.innerWidth >= 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState([])
  const [cargando, setCargando] = useState(false)
  const [yo, setYo] = useState(null)
  const [siguiendoIds, setSiguiendoIds] = useState([])
  const [procesando, setProcesando] = useState(null)
  const debounce = useRef(null)

  useEffect(() => {
    (async () => {
      setYo(await miUsuarioId())
      setSiguiendoIds(await idsQueSigo())
    })()
  }, [])

  useEffect(() => {
    clearTimeout(debounce.current)
    if (q.trim().length < 2) { setResultados([]); return }
    debounce.current = setTimeout(buscar, 350)
    return () => clearTimeout(debounce.current)
  }, [q])

  const buscar = async () => {
    const termino = q.trim()
    if (termino.length < 2) return
    setCargando(true)
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, nombre, apellido, codigo_unico, foto_url, municipio, provincia, posiciones')
      .or(`nombre.ilike.%${termino}%,apellido.ilike.%${termino}%,codigo_unico.ilike.%${termino}%`)
      .limit(20)
    if (!error && data) {
      setResultados(data.filter((p) => p.id !== yo))
    }
    setCargando(false)
  }

  const onSeguir = async (persona) => {
    if (!yo) { alert('Inicia sesión para seguir'); return }
    setProcesando(persona.id)
    const r = await alternarSeguir(persona.id)
    if (r.error) { alert(r.error) }
    else {
      setSiguiendoIds((prev) => r.siguiendo ? [...prev, persona.id] : prev.filter((x) => x !== persona.id))
    }
    setProcesando(null)
  }

  const TarjetaPersona = ({ p }) => {
    const sigo = siguiendoIds.includes(p.id)
    const nombreCompleto = `${p.nombre || ''}${p.apellido ? ' ' + p.apellido : ''}`.trim() || 'Jugador'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: T.surf, border: `1px solid ${T.bd}`, borderRadius: 16 }}>
        <div onClick={() => onVerPerfil && onVerPerfil(p.id)} style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, background: p.foto_url ? `url(${p.foto_url}) center/cover` : T.boton, display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 800, color: T.onBoton, cursor: 'pointer', position: 'relative', overflow: 'hidden', border: `2px solid ${T.bd2}` }}>
          {!p.foto_url && nombreCompleto.slice(0, 1).toUpperCase()}
        </div>
        <div onClick={() => onVerPerfil && onVerPerfil(p.id)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: T.tx, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreCompleto}</div>
          <div style={{ fontSize: 12, color: T.tn, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.municipio ? p.municipio : 'Jugador'}{p.provincia && p.municipio !== p.provincia ? `, ${p.provincia}` : ''}
          </div>
        </div>
        <button onClick={() => onSeguir(p)} disabled={procesando === p.id} style={{ flexShrink: 0, border: sigo ? `1px solid ${T.bd2}` : 'none', borderRadius: 20, padding: '8px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', background: sigo ? 'transparent' : T.boton, color: sigo ? T.tn : T.onBoton, opacity: procesando === p.id ? 0.6 : 1 }}>
          {sigo ? 'Siguiendo' : '+ Seguir'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: FUENTE, color: T.tx2, position: 'relative', background: T.bg }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: T.esClaro ? 0.18 : 0.4 }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: T.veil }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: `radial-gradient(360px 280px at 50% 6%, ${T.glow1}, transparent 65%)` }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: esEscritorio ? 980 : 620, margin: '0 auto', padding: esEscritorio ? '22px 26px 50px' : 'calc(env(safe-area-inset-top) + 14px) 16px calc(env(safe-area-inset-bottom) + 50px)' }}>
        {/* nav */}
        <div style={{ background: T.surf, border: `1px solid ${T.bd}`, borderRadius: 16, padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative', overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
          <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, display: 'flex' }}><span style={{ flex: 1, background: TRI_AZUL }} /><span style={{ flex: 1, background: '#fff' }} /><span style={{ flex: 1, background: TRI_ROJO }} /></span>
          <span onClick={() => onVolver && onVolver()} style={{ color: T.tx, fontWeight: 800, fontSize: 19, cursor: 'pointer', lineHeight: 1 }}>‹</span>
          <span style={{ color: T.tx, fontWeight: 800, fontSize: 14, fontFamily: DISP, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 0.5 }}>Buscar personas</span>
          <span style={{ width: 16 }} />
        </div>

        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre, apellido o MC ID…"
          autoComplete="off"
          autoCorrect="off"
          style={{ position: 'relative', zIndex: 2, width: '100%', boxSizing: 'border-box', background: T.inputBg, border: `1px solid ${T.inputBd}`, borderRadius: 12, padding: '13px 15px', color: T.tx, fontSize: 16, outline: 'none', marginBottom: 18, WebkitAppearance: 'none' }}
        />

        {q.trim().length < 2 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: T.tn }}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>Escribe el nombre de un jugador o su MC ID para encontrarlo y seguirlo.</div>
          </div>
        ) : cargando ? (
          <div style={{ textAlign: 'center', padding: '30px', color: T.tn, fontSize: 14 }}>Buscando…</div>
        ) : resultados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: T.tn, fontSize: 14 }}>No se encontró a nadie con "{q.trim()}".</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {resultados.map((p) => <TarjetaPersona key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}