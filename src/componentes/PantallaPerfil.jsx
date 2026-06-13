import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import fondoCancha from '../assets/fondo-cancha.png'

const TEMAS = {
  dorado: {
    acento: '#e8b65a', borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)',
    texto: 'linear-gradient(120deg,#fbe08a,#c8842e)', balon: ['#fbe08a', '#d18f33', '#9a6420'],
    boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', glow: 'rgba(190,135,55,0.20)',
    avatar: 'linear-gradient(150deg, #e0b057, #9a6420)', avatarTexto: '#241a07', borde2: 'rgba(232,169,75,.35)',
  },
  azul: {
    acento: '#6fb0ec', borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)',
    texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)', balon: ['#9fd4fb', '#4f8fd0', '#1d4a80'],
    boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', glow: 'rgba(55,120,190,0.22)',
    avatar: 'linear-gradient(150deg, #5aa0e0, #1d4a80)', avatarTexto: '#08151f', borde2: 'rgba(111,176,236,.35)',
  },
}

const POS_NOMBRE = { PG: 'Base', SG: 'Escolta', SF: 'Alero', PF: 'Ala-pívot', C: 'Pívot' }

function edadDe(fecha) {
  if (!fecha) return null
  const hoy = new Date()
  const n = new Date(fecha)
  let e = hoy.getFullYear() - n.getFullYear()
  const m = hoy.getMonth() - n.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) e--
  return e
}

export default function PantallaPerfil({ onSalir, onVolver }) {
  const tema = (typeof window !== 'undefined' && localStorage.getItem('mc_tema')) || 'dorado'
  const T = TEMAS[tema] || TEMAS.dorado
  const ORO = { background: T.texto, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }

  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [esEscritorio, setEsEscritorio] = useState(typeof window !== 'undefined' ? window.innerWidth >= 900 : false)

  useEffect(() => {
    const onResize = () => setEsEscritorio(window.innerWidth >= 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const C = { texto: '#eef3f6', tenue: '#9aa7b2', font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data: sesion } = await supabase.auth.getUser()
        const user = sesion?.user
        if (!user) { setError('No hay sesión activa.'); setCargando(false); return }
        const { data, error: err } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
        if (err) throw err
        setPerfil({ ...data, correo: user.email })
      } catch (e) {
        setError(e.message || 'No se pudo cargar el perfil.')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const copiarMC = () => {
    if (!perfil?.codigo_unico) return
    navigator.clipboard?.writeText(perfil.codigo_unico)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1600)
  }

  const salir = async () => {
    await supabase.auth.signOut()
    onSalir && onSalir()
  }

  const fondo = () => (<>
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(8,9,12,0.86) 0%, rgba(8,9,12,0.93) 100%)' }} />
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 60% 40% at 50% 25%, ${T.glow}, transparent 70%)` }} />
  </>)

  const placa = (children, pad = 18) => (
    <div style={{ position: 'relative', borderRadius: 18, padding: 1.5, background: T.borde, marginBottom: 14 }}>
      <div style={{ borderRadius: 17, padding: pad, background: 'linear-gradient(150deg, rgba(24,26,30,0.85), rgba(12,14,18,0.9))', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>{children}</div>
    </div>
  )

  const wrap = { minHeight: '100vh', position: 'relative', fontFamily: C.font, background: '#08090c', color: C.texto }

  if (cargando) {
    return (<div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fondo()}<div style={{ position: 'relative', zIndex: 1, color: C.tenue }}>Cargando tu perfil...</div></div>)
  }

  if (error || !perfil) {
    return (
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        {fondo()}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 16, color: C.texto, marginBottom: 8 }}>No pudimos abrir tu perfil</div>
          <div style={{ fontSize: 13, color: C.tenue, marginBottom: 18 }}>{error || 'Inicia sesión para ver tu perfil.'}</div>
          <button onClick={() => onVolver && onVolver()} style={{ border: 'none', borderRadius: 12, padding: '12px 22px', background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Volver al inicio</button>
        </div>
      </div>
    )
  }

  const esJugador = perfil.modo === 'jugador'
  const edad = edadDe(perfil.fecha_nacimiento)
  const nombreCompleto = `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim()
  const iniciales = `${(perfil.nombre || '?')[0] || ''}${(perfil.apellido || '')[0] || ''}`.toUpperCase()
  const posiciones = perfil.posiciones || []
  const ubicacion = [perfil.municipio, perfil.provincia].filter(Boolean).join(', ')

  const Stat = ({ valor, etiqueta }) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '6px 0' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.texto }}>{valor}</div>
      <div style={{ fontSize: 10.5, color: C.tenue, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{etiqueta}</div>
    </div>
  )

  const bCabecera = placa(
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 88, height: 88, borderRadius: '50%', background: T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: T.avatarTexto, margin: '0 auto 14px' }}>{iniciales}</div>
      <div style={{ fontSize: 23, fontWeight: 800, color: C.texto }}>{nombreCompleto}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, padding: '4px 11px', borderRadius: 9, textTransform: 'uppercase', color: T.avatarTexto, background: T.boton }}>{esJugador ? '🏀 Jugador' : '📣 Fanático'}</span>
        {ubicacion && <span style={{ fontSize: 12.5, color: C.tenue }}>📍 {ubicacion}</span>}
        {edad != null && <span style={{ fontSize: 12.5, color: C.tenue }}>· {edad} años</span>}
      </div>
    </div>
  )

  const bMcid = placa(
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, color: C.tenue, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Tu MC-ID</div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 3, fontFamily: 'monospace', ...ORO }}>{perfil.codigo_unico || '--------'}</div>
        <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 4 }}>Tu identificación en Media Cancha. Compártela para que te agreguen a ligas y torneos.</div>
      </div>
      <button onClick={copiarMC} style={{ flexShrink: 0, border: 'none', borderRadius: 11, padding: '11px 16px', background: copiado ? 'rgba(47,191,113,.18)' : T.boton, color: copiado ? '#7bd6a3' : '#1a1205', fontWeight: 800, fontSize: 13, cursor: 'pointer', minWidth: 86 }}>{copiado ? '✓ Copiado' : 'Copiar'}</button>
    </div>
  )

  const bAtleta = esJugador && placa(
    <>
      <div style={{ fontSize: 11, color: T.acento, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Datos de atleta</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '12px 6px' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.texto }}>{perfil.estatura_pies ? `${perfil.estatura_pies}'${perfil.estatura_pulgadas || 0}"` : '—'}</div>
          <div style={{ fontSize: 10, color: C.tenue, textTransform: 'uppercase', marginTop: 3 }}>Estatura</div>
        </div>
        <div style={{ flex: 2, textAlign: 'center', background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '12px 6px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.texto, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            {posiciones.length ? posiciones.map((p, i) => (
              <span key={p} style={{ color: i === 0 ? T.acento : C.texto }}>{p}{i === 0 && <span style={{ fontSize: 9, color: C.tenue }}> (nat.)</span>}</span>
            )) : '—'}
          </div>
          <div style={{ fontSize: 10, color: C.tenue, textTransform: 'uppercase', marginTop: 3 }}>Posiciones</div>
        </div>
      </div>
    </>
  )

  const bRating = esJugador && placa(
    <>
      <div style={{ fontSize: 11, color: T.acento, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Rating y rankings</div>
      <div style={{ display: 'flex' }}>
        <Stat valor="—" etiqueta="Rating" /><Stat valor="—" etiqueta="Rank nacional" /><Stat valor="—" etiqueta="Nivel" />
      </div>
      <div style={{ fontSize: 12, color: C.tenue, textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>Tu rating aparecerá cuando juegues tu primer torneo. Mientras más juegues, más sólido tu número.</div>
    </>
  )

  const bPromedios = esJugador && placa(
    <>
      <div style={{ fontSize: 11, color: T.acento, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Promedios de carrera</div>
      <div style={{ display: 'flex' }}>
        <Stat valor="0.0" etiqueta="PTS" /><Stat valor="0.0" etiqueta="REB" /><Stat valor="0.0" etiqueta="AST" /><Stat valor="0.0" etiqueta="ROB" />
      </div>
      <div style={{ fontSize: 12, color: C.tenue, textAlign: 'center', marginTop: 12 }}>0 torneos · 0 partidos jugados</div>
    </>
  )

  const bTrofeos = esJugador && placa(
    <>
      <div style={{ fontSize: 11, color: T.acento, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Vitrina de trofeos</div>
      <div style={{ fontSize: 13, color: C.tenue, textAlign: 'center', padding: '14px 0' }}>🏆 Aquí irán tus campeonatos, MVPs y liderazgos.</div>
    </>
  )

  const bTorneos = placa(
    <>
      <div style={{ fontSize: 11, color: T.acento, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{esJugador ? 'Mis torneos y ligas' : 'Lo que sigo'}</div>
      <div style={{ fontSize: 13, color: C.tenue, textAlign: 'center', padding: '14px 0', lineHeight: 1.5 }}>
        {esJugador ? 'Todavía no estás en ningún torneo o liga. Cuando te inscriban con tu MC-ID, aparecerán aquí.' : 'Sigue torneos, equipos y jugadores para verlos aquí.'}
      </div>
    </>
  )

  const bCuenta = placa(
    <>
      <div style={{ fontSize: 11, color: T.acento, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Cuenta</div>
      <div style={{ fontSize: 13, color: C.tenue, display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>Correo</span><span style={{ color: C.texto }}>{perfil.correo}</span></div>
      <div style={{ fontSize: 13, color: C.tenue, display: 'flex', justifyContent: 'space-between' }}><span>Plan</span><span style={{ color: T.acento, fontWeight: 700 }}>Gratis</span></div>
    </>
  , 16)

  const barra = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <span onClick={() => onVolver && onVolver()} style={{ color: C.tenue, fontSize: 14, cursor: 'pointer' }}>← Inicio</span>
      <button onClick={salir} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10, padding: '7px 14px', color: C.tenue, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Cerrar sesión</button>
    </div>
  )

  if (esEscritorio) {
    return (
      <div style={wrap}>
        {fondo()}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '22px 24px 60px' }}>
          {barra}
          {bCabecera}
          {bMcid}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>{bAtleta}{bPromedios}{bTorneos}</div>
            <div style={{ flex: 1, minWidth: 0 }}>{bRating}{bTrofeos}{bCuenta}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={wrap}>
      {fondo()}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '20px 16px 60px' }}>
        {barra}{bCabecera}{bMcid}{bAtleta}{bRating}{bPromedios}{bTrofeos}{bTorneos}{bCuenta}
      </div>
    </div>
  )
}