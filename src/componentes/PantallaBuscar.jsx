import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { miUsuarioId, alternarSeguir, idsQueSigo } from '../social'
import fondoCancha from '../assets/fondo-cancha.png'

const TEMAS = {
  dorado: { esClaro: false, acento: '#e8b65a', fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', subTexto: '#c3ccd4', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', avatar: 'linear-gradient(150deg, #e0b057, #9a6420)', avatarTexto: '#241a07', tarjetaBg: 'rgba(20,22,26,.72)', tarjetaBorde: 'rgba(255,255,255,.08)', inputBg: 'rgba(12,14,18,0.7)', glow: 'rgba(190,135,55,0.18)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.84), rgba(8,9,12,0.92))' },
  azul: { esClaro: false, acento: '#6fb0ec', fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', subTexto: '#c3ccd4', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', avatar: 'linear-gradient(150deg, #5aa0e0, #1d4a80)', avatarTexto: '#08151f', tarjetaBg: 'rgba(20,22,26,.72)', tarjetaBorde: 'rgba(255,255,255,.08)', inputBg: 'rgba(12,14,18,0.7)', glow: 'rgba(55,120,190,0.2)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.84), rgba(8,9,12,0.92))' },
  claro: { esClaro: true, acento: '#b07a26', fondo: '#e6dcc8', textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58', subTexto: '#5b5040', boton: 'linear-gradient(150deg, #e7c069, #b07a26)', avatar: 'linear-gradient(150deg, #e7c069, #a9741f)', avatarTexto: '#3a2806', tarjetaBg: '#fff', tarjetaBorde: '#e0e3e8', inputBg: '#fff', glow: 'rgba(190,135,55,0.10)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(235,228,212,0.86), rgba(228,220,200,0.92))' },
  larimar: { esClaro: true, acento: '#2a8fb8', fondo: '#d6e7e8', textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375', subTexto: '#48595a', boton: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', avatar: 'linear-gradient(150deg, #4aafc8, #1a6a8a)', avatarTexto: '#04121f', tarjetaBg: '#fff', tarjetaBorde: '#cfe0e2', inputBg: '#fff', glow: 'rgba(42,143,184,0.12)', navDorada: 'linear-gradient(180deg,#6ac0d8,#2a8fb8 55%,#1a6a8a)', veloGrad: 'linear-gradient(180deg, rgba(214,231,232,0.86), rgba(214,231,232,0.92))' },
}

export default function PantallaBuscar({ onVolver, onVerPerfil }) {
  const [tema, setTema] = useState(() => {
    const validos = ['dorado', 'azul', 'claro', 'larimar']
    if (typeof window !== 'undefined') {
      const g = localStorage.getItem('mc_tema')
      return validos.includes(g) ? g : 'dorado'
    }
    return 'dorado'
  })
  const T = TEMAS[tema] || TEMAS.dorado
  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

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
    // busca por nombre, apellido o código único (MC ID)
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 14, marginBottom: 10 }}>
        <div onClick={() => onVerPerfil && onVerPerfil(p.id)} style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, background: p.foto_url ? `url(${p.foto_url}) center/cover` : T.avatar, display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 800, color: T.avatarTexto, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          {!p.foto_url && nombreCompleto.slice(0, 1).toUpperCase()}
        </div>
        <div onClick={() => onVerPerfil && onVerPerfil(p.id)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreCompleto}</div>
          <div style={{ fontSize: 12, color: T.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.municipio ? p.municipio : 'Jugador'}{p.provincia && p.municipio !== p.provincia ? `, ${p.provincia}` : ''}
          </div>
        </div>
        <button onClick={() => onSeguir(p)} disabled={procesando === p.id} style={{ flexShrink: 0, border: sigo ? `1px solid ${T.tarjetaBorde}` : 'none', borderRadius: 20, padding: '8px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', background: sigo ? 'transparent' : T.boton, color: sigo ? T.tenue : '#1a1205', opacity: procesando === p.id ? 0.6 : 1 }}>
          {sigo ? 'Siguiendo' : '+ Seguir'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: font, color: T.textoBody, position: 'relative', background: T.fondo }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: T.veloGrad }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 55% 40% at 50% 15%, ${T.glow}, transparent 70%)` }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 620, margin: '0 auto', padding: '16px 16px 50px' }}>
        {/* nav */}
        <div style={{ background: T.navDorada, borderRadius: 14, padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, boxShadow: '0 6px 18px rgba(156,101,24,.3)' }}>
          <span onClick={() => onVolver && onVolver()} style={{ color: '#2a1c08', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Volver</span>
          <span style={{ color: '#2a1c08', fontWeight: 800, fontSize: 14 }}>🔍 Buscar personas</span>
          <span style={{ width: 30 }} />
        </div>

        {/* buscador */}
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre, apellido o MC ID…"
          autoComplete="off"
          autoCorrect="off"
          style={{ position: 'relative', zIndex: 2, width: '100%', boxSizing: 'border-box', background: T.inputBg, border: `1px solid ${T.acento}55`, borderRadius: 12, padding: '13px 15px', color: T.textoFuerte, fontSize: 16, outline: 'none', marginBottom: 18, WebkitAppearance: 'none' }}
        />

        {q.trim().length < 2 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: T.tenue }}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>Escribe el nombre de un jugador o su MC ID para encontrarlo y seguirlo.</div>
          </div>
        ) : cargando ? (
          <div style={{ textAlign: 'center', padding: '30px', color: T.tenue, fontSize: 14 }}>Buscando…</div>
        ) : resultados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: T.tenue, fontSize: 14 }}>No se encontró a nadie con "{q.trim()}".</div>
        ) : (
          resultados.map((p) => <TarjetaPersona key={p.id} p={p} />)
        )}
      </div>
    </div>
  )
}