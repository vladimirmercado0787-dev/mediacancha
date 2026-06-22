import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { subirFotoPerfil } from '../fotos'
import { statsSociales } from '../social'
import RecortadorFoto from './RecortadorFoto'
import TarjetaResultado from './TarjetaResultado'
import { haceCuanto } from '../techado'
import fondoCancha from '../assets/fondo-cancha.png'
import fondoTarjetaMiembro from '../assets/fondo-tarjeta-miembro.png'
import texturaCuero from '../assets/textura-cuero.png'
import barraMiembroClara from '../assets/barra-miembro-clara.png'
import barraMiembroLarimar from '../assets/barra-miembro-larimar.png'
import texturaCueroClara from '../assets/textura-cuero-clara.png'
import texturaCueroLarimar from '../assets/textura-cuero-larimar.png'

const SUP_OSCURA = {
  esClaro: false, fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', subTexto: '#c3ccd4',
  vidrio: 'linear-gradient(150deg, rgba(24,26,30,0.82), rgba(12,14,18,0.86))',
  scrimCarnet: 'linear-gradient(90deg, rgba(6,7,9,0.92) 0%, rgba(6,7,9,0.7) 45%, rgba(6,7,9,0.15) 75%, transparent 100%)',
  headerBg: 'rgba(8,9,12,0.92)',
  veloGrad: 'linear-gradient(90deg, rgba(8,9,12,0.92) 0%, rgba(8,9,12,0.66) 45%, rgba(8,9,12,0.55) 100%)',
  navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)',
  tarjetaBg: 'rgba(20,22,26,.72)', tarjetaBorde: 'rgba(255,255,255,.08)', tarjetaSombra: 'none', lineaSuave: 'rgba(255,255,255,.07)',
  texturaImg: texturaCuero, barraImg: fondoTarjetaMiembro,
}
const TEMAS = {
  dorado: {
    ...SUP_OSCURA, nombre: 'Dorado', acento: '#e8b65a',
    borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)',
    texto: 'linear-gradient(120deg,#fbe08a,#c8842e)', balon: ['#fbe08a', '#d18f33', '#9a6420'],
    avatar: 'linear-gradient(150deg, #e0b057, #9a6420)', avatarTexto: '#241a07',
    boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', glow: 'rgba(190,135,55,0.20)',
    navActivoBg: 'rgba(232,169,75,.15)', navActivoBorde: 'rgba(232,169,75,.35)',
  },
  azul: {
    ...SUP_OSCURA, nombre: 'Azul', acento: '#6fb0ec',
    borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)',
    texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)', balon: ['#9fd4fb', '#4f8fd0', '#1d4a80'],
    avatar: 'linear-gradient(150deg, #5aa0e0, #1d4a80)', avatarTexto: '#08151f',
    boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', glow: 'rgba(55,120,190,0.22)',
    navActivoBg: 'rgba(111,176,236,.15)', navActivoBorde: 'rgba(111,176,236,.35)',
  },
  claro: {
    esClaro: true, nombre: 'Claro', acento: '#b07a26',
    borde: 'linear-gradient(140deg,#f0d79a,#c79a45 40%,#9a7530 70%,#e3c578)',
    texto: 'linear-gradient(120deg,#c8902f,#9a6420)', balon: ['#e7c069', '#c8842e', '#9a6420'],
    avatar: 'linear-gradient(150deg, #e7c069, #a9741f)', avatarTexto: '#3a2806',
    boton: 'linear-gradient(150deg, #e7c069, #b07a26)', glow: 'rgba(190,135,55,0.10)',
    navActivoBg: 'rgba(176,122,38,.16)', navActivoBorde: 'rgba(176,122,38,.35)',
    fondo: '#e6dcc8', textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58', subTexto: '#5b5040',
    vidrio: 'linear-gradient(150deg, rgba(255,255,255,0.60), rgba(255,255,255,0.46))',
    scrimCarnet: 'linear-gradient(100deg, rgba(250,245,235,0.86) 0%, rgba(250,245,235,0.52) 45%, rgba(250,245,235,0.12) 75%, transparent 100%)',
    headerBg: 'rgba(248,243,233,0.92)',
    veloGrad: 'linear-gradient(90deg, rgba(248,243,233,0.86) 0%, rgba(248,243,233,0.66) 45%, rgba(248,243,233,0.55) 100%)',
    navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)',
    tarjetaBg: '#fff', tarjetaBorde: '#e0e3e8', tarjetaSombra: '0 8px 24px rgba(20,24,30,.06)', lineaSuave: '#eceef1',
    texturaImg: texturaCueroClara, barraImg: barraMiembroClara,
  },
  larimar: {
    esClaro: true, nombre: 'Larimar', acento: '#b07a26',
    borde: 'linear-gradient(140deg,#f0d79a,#c79a45 40%,#9a7530 70%,#e3c578)',
    texto: 'linear-gradient(120deg,#c8902f,#9a6420)', balon: ['#e7c069', '#c8842e', '#9a6420'],
    avatar: 'linear-gradient(150deg, #e7c069, #a9741f)', avatarTexto: '#3a2806',
    boton: 'linear-gradient(150deg, #e7c069, #b07a26)', glow: 'rgba(60,150,170,0.12)',
    navActivoBg: 'rgba(176,122,38,.16)', navActivoBorde: 'rgba(176,122,38,.35)',
    fondo: '#d6e7e8', textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375', subTexto: '#48595a',
    vidrio: 'linear-gradient(150deg, rgba(255,255,255,0.58), rgba(255,255,255,0.44))',
    scrimCarnet: 'linear-gradient(100deg, rgba(236,246,247,0.86) 0%, rgba(236,246,247,0.52) 45%, rgba(236,246,247,0.12) 75%, transparent 100%)',
    headerBg: 'rgba(232,244,245,0.92)',
    veloGrad: 'linear-gradient(90deg, rgba(232,244,245,0.86) 0%, rgba(232,244,245,0.66) 45%, rgba(232,244,245,0.55) 100%)',
    navDorada: 'linear-gradient(180deg,#6ac0d8,#2a8fb8 55%,#1a6a8a)',
    tarjetaBg: '#fff', tarjetaBorde: '#cfe0e2', tarjetaSombra: '0 8px 24px rgba(20,30,32,.06)', lineaSuave: '#e2edee',
    texturaImg: texturaCueroLarimar, barraImg: barraMiembroLarimar,
  },
}

function IconoTechado({ size = 22, cols }) {
  const gid = 'gtp' + size
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
      <defs><linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="50" y1="15" x2="50" y2="85"><stop offset="0%" stopColor={cols[0]} /><stop offset="100%" stopColor={cols[2]} /></linearGradient></defs>
      <g fill="none" stroke={`url(#${gid})`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 47 L50 23 L84 47" /><path d="M26 45 V78 M74 45 V78" /><line x1="20" y1="78" x2="80" y2="78" /></g>
    </svg>
  )
}

function edadDe(fecha) {
  if (!fecha) return null
  const hoy = new Date(); const n = new Date(fecha)
  let e = hoy.getFullYear() - n.getFullYear()
  const m = hoy.getMonth() - n.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) e--
  return e
}

const NAV_PRINCIPAL = [
  { id: 'inicio', txt: 'Inicio', icono: '⌂' },
  { id: 'perfil', txt: 'Mi Perfil', icono: '◉' },
  { id: 'techado', txt: 'El Techado', icono: 'techado' },
  { id: 'torneos', txt: 'Torneos', icono: '🏆' },
  { id: 'rankings', txt: 'Rankings', icono: '★' },
  { id: 'mapa', txt: 'Mapa', icono: '🗺️' },
]

export default function PantallaPerfil({ onSalir, onVolver, onAccion }) {
  const [tema, setTema] = useState(() => {
    const validos = ['dorado', 'azul', 'claro', 'larimar']
    if (typeof window !== 'undefined') {
      const g = localStorage.getItem('mc_tema')
      return validos.includes(g) ? g : 'dorado'
    }
    return 'dorado'
  })
  const T = TEMAS[tema] || TEMAS.dorado
  const ORO = { background: T.texto, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }
  const C = { texto: T.textoBody, tenue: T.tenue, font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }

  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [fotoARecortar, setFotoARecortar] = useState(null)
  const [visorAbierto, setVisorAbierto] = useState(false)
  const [menuFotoAbierto, setMenuFotoAbierto] = useState(false)
  const [pestanaPerfil, setPestanaPerfil] = useState('publicaciones')
  const [statsSoc, setStatsSoc] = useState({ seguidores: 0, siguiendo: 0 })
  const [publicaciones, setPublicaciones] = useState([])
  const [cargandoPubs, setCargandoPubs] = useState(true)
  const inputFotoRef = useRef(null)

  // Sube la foto elegida, la guarda en el perfil y refresca la pantalla
  const alElegirFoto = (e) => {
    const archivo = e.target.files && e.target.files[0]
    if (inputFotoRef.current) inputFotoRef.current.value = ''
    if (!archivo) return
    setFotoARecortar(archivo)
  }

  // Editar la foto actual: la baja como blob y abre el recortador
  const editarFotoActual = async () => {
    setMenuFotoAbierto(false)
    setVisorAbierto(false)
    if (!perfil.foto_url) return
    try {
      const resp = await fetch(perfil.foto_url)
      const blob = await resp.blob()
      setFotoARecortar(blob)
    } catch (e) {
      alert('No se pudo cargar la foto para editar.')
    }
  }

  const alRecortarFoto = async (blob) => {
    setFotoARecortar(null)
    setSubiendoFoto(true)
    try {
      const { url, error: errFoto } = await subirFotoPerfil(blob)
      if (errFoto || !url) {
        alert('No se pudo subir la foto: ' + (errFoto || 'intenta de nuevo'))
      } else {
        const { data: sesion } = await supabase.auth.getUser()
        const uid = sesion?.user?.id
        const { error: errGuardar } = await supabase.from('perfiles').update({ foto_url: url }).eq('id', uid)
        if (errGuardar) {
          alert('La foto subió pero no se pudo guardar: ' + errGuardar.message)
        } else {
          setPerfil((p) => ({ ...p, foto_url: url }))
        }
      }
    } catch (err) {
      alert('Error: ' + (err.message || err))
    }
    setSubiendoFoto(false)
  }
  const [esEscritorio, setEsEscritorio] = useState(typeof window !== 'undefined' ? window.innerWidth >= 900 : false)
  const [esTablet, setEsTablet] = useState(typeof window !== 'undefined' ? window.innerWidth >= 900 && window.innerWidth < 1180 : false)

  useEffect(() => {
    const onResize = () => {
      setEsEscritorio(window.innerWidth >= 900)
      setEsTablet(window.innerWidth >= 900 && window.innerWidth < 1180)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const cambiarTema = () => {
    const orden = ['dorado', 'azul', 'claro', 'larimar']
    const i = orden.indexOf(tema)
    const nuevo = orden[(i + 1) % orden.length]
    setTema(nuevo)
    try { localStorage.setItem('mc_tema', nuevo) } catch (e) {}
  }

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data: sesion } = await supabase.auth.getUser()
        const user = sesion?.user
        if (!user) { setError('No hay sesión activa.'); setCargando(false); return }
        const { data, error: err } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
        if (err) throw err
        setPerfil({ ...data, correo: user.email })
        // Cargar números sociales (seguidores / siguiendo)
        try {
          const s = await statsSociales(user.id)
          setStatsSoc({ seguidores: s.seguidores || 0, siguiendo: s.siguiendo || 0 })
        } catch (e) {}
        // Cargar mis publicaciones
        try {
          const { data: pubs } = await supabase
            .from('publicaciones_completas')
            .select('*')
            .eq('autor_id', user.id)
            .order('creado_en', { ascending: false })
          setPublicaciones(pubs || [])
        } catch (e) {}
        setCargandoPubs(false)
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

  const irA = (id) => {
    if (id === 'perfil') return
    if (id === 'cerrarSesion') { salir(); return }
    if (id === 'inicio') { onVolver && onVolver(); return }
    onAccion ? onAccion(id) : (onVolver && onVolver())
  }

  const Velo = () => (<>
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: T.veloGrad }} />
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 60% 40% at 50% 20%, ${T.glow}, transparent 70%)` }} />
  </>)

  // Tarjeta blanca/oscura con cabecera + regla dorada
  const Tarjeta = ({ titulo, children, pad = 16 }) => (
    <div style={{ background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 16, boxShadow: T.tarjetaSombra, overflow: 'hidden' }}>
      {titulo && (
        <div style={{ padding: '13px 16px 0', display: 'flex', alignItems: 'center', gap: 9 }}>
          <h3 style={{ fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 800, margin: 0, color: T.acento }}>{titulo}</h3>
          <span style={{ width: 22, height: 3, borderRadius: 3, background: T.boton }} />
        </div>
      )}
      <div style={{ padding: pad }}>{children}</div>
    </div>
  )

  const BotonTema = () => (
    <button onClick={cambiarTema} title={`Tema: ${T.nombre}`} style={{ display: 'flex', alignItems: 'center', gap: 7, background: T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(20,18,16,.7)', border: `1px solid ${T.navActivoBorde}`, color: T.acento, fontSize: 11.5, fontWeight: 700, padding: '7px 11px', borderRadius: 10, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: T.boton, display: 'inline-block' }} />{T.nombre}
    </button>
  )

  const wrap = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: C.font, background: T.fondo, color: C.texto }
  const scrollArea = { flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', zIndex: 1 }

  if (cargando) {
    return (<div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Velo /><div style={{ position: 'relative', zIndex: 1, color: C.tenue }}>Cargando tu perfil...</div></div>)
  }

  if (error || !perfil) {
    return (
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Velo />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 16, color: T.textoFuerte, marginBottom: 8 }}>No pudimos abrir tu perfil</div>
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
  const posicion = posiciones[0] || null

  // CARNET credencial — rediseñado con jerarquía limpia
  const Carnet = () => (
    <div style={{ position: 'relative', borderRadius: 18, border: T.esClaro ? '1px solid #34291a' : `1px solid ${T.navActivoBorde}`, backgroundImage: `url(${T.barraImg})`, backgroundSize: 'cover', backgroundPosition: 'center right', boxShadow: T.esClaro ? '0 12px 34px rgba(18,14,8,.22)' : '0 12px 34px rgba(0,0,0,.4)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: T.scrimCarnet }} />

      {/* Barra superior: volver (izq) + tema (der esquina) */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 0' }}>
        <button onClick={() => irA('inicio')} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(0,0,0,.3)', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>‹</button>
        <BotonTema />
      </div>

      {/* Identidad: foto grande arriba, nombre y datos centrados debajo */}
      <div style={{ position: 'relative', zIndex: 2, padding: '8px 18px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div onClick={() => perfil.foto_url ? setVisorAbierto(true) : (inputFotoRef.current && inputFotoRef.current.click())} style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: perfil.foto_url ? `url(${perfil.foto_url}) center/cover` : T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: T.avatarTexto, boxShadow: `0 0 0 2px ${T.esClaro ? '#15110b' : '#0c0e12'}, 0 0 0 4px ${T.acento}`, opacity: subiendoFoto ? 0.5 : 1 }}>{!perfil.foto_url && iniciales}</div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: T.boton, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, boxShadow: `0 0 0 2px ${T.esClaro ? '#2a2014' : '#0c0e12'}` }}>{subiendoFoto ? '…' : '📷'}</div>
          <input ref={inputFotoRef} type="file" accept="image/*" onChange={alElegirFoto} style={{ display: 'none' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 21, fontWeight: 800, color: '#fff', lineHeight: 1.05, textShadow: '0 1px 6px rgba(0,0,0,.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreCompleto}</span>
            <span style={{ flexShrink: 0, fontSize: 8.5, letterSpacing: 1, color: '#1c160d', background: T.boton, padding: '2px 8px', borderRadius: 10, fontWeight: 800, textTransform: 'uppercase' }}>{esJugador ? 'Jugador' : 'Fan'}</span>
          </div>
          <div style={{ fontSize: 12, color: '#d3c4a0', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 8 }}>
            {posicion && <span>{posicion}</span>}
            {posicion && ubicacion && <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#7d6b49' }} />}
            {ubicacion && <span>{ubicacion}</span>}
            {edad != null && <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#7d6b49' }} />}
            {edad != null && <span>{edad} años</span>}
          </div>
          <span onClick={copiarMC} style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#1c160d', background: T.boton, padding: '4px 12px', borderRadius: 8, fontFamily: 'monospace', letterSpacing: 1.5, cursor: 'pointer' }}>{copiado ? '✓ copiado' : (perfil.codigo_unico || 'MC------')}</span>
        </div>
      </div>
      {esJugador && (
        <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'rgba(234,182,79,.16)', borderTop: '1px solid rgba(234,182,79,.18)' }}>
          {[['—', 'PTS'], ['—', 'REB'], ['—', 'AST'], ['—', 'ROB']].map(([v, l]) => (
            <div key={l} style={{ background: T.esClaro ? 'rgba(21,17,11,.9)' : 'rgba(12,14,18,.85)', padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 1, color: T.acento, marginTop: 3, textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Números sociales: Juegos · Siguiendo · Seguidores */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', background: T.esClaro ? 'rgba(21,17,11,.92)' : 'rgba(12,14,18,.9)', borderTop: '1px solid rgba(234,182,79,.18)', borderRadius: '0 0 16px 16px' }}>
        {[
          { v: perfil.juegos_jugados != null ? perfil.juegos_jugados : 0, l: 'Juegos' },
          { v: statsSoc.siguiendo, l: 'Siguiendo' },
          { v: statsSoc.seguidores, l: 'Seguidores' },
        ].map((s, i) => (
          <div key={s.l} style={{ flex: 1, textAlign: 'center', padding: '10px 6px', borderLeft: i > 0 ? '1px solid rgba(234,182,79,.14)' : 'none' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.6, color: T.acento, marginTop: 4, textTransform: 'uppercase' }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const TarjetaPerfil = () => (
    <div style={{ background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 20, boxShadow: T.tarjetaSombra, overflow: 'hidden' }}>
      <div style={{ position: 'relative', height: 78, background: T.boton }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 130% at 82% -25%, rgba(255,255,255,.28), transparent 60%)' }} />
        <span style={{ position: 'absolute', right: 14, bottom: 10, fontSize: 9.5, fontWeight: 800, letterSpacing: 1, color: 'rgba(0,0,0,.34)', textTransform: 'uppercase' }}>{esJugador ? 'Jugador' : 'Fan'}</span>
      </div>
      <div style={{ padding: '0 18px 18px', marginTop: -42 }}>
        <div onClick={() => perfil.foto_url ? setVisorAbierto(true) : (inputFotoRef.current && inputFotoRef.current.click())} style={{ position: 'relative', width: 84, height: 84, cursor: 'pointer' }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: perfil.foto_url ? `url(${perfil.foto_url}) center/cover` : T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: T.avatarTexto, boxShadow: `0 0 0 4px ${T.tarjetaBg}`, opacity: subiendoFoto ? 0.5 : 1 }}>{!perfil.foto_url && iniciales}</div>
          <div style={{ position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: '50%', background: T.boton, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, boxShadow: `0 0 0 2px ${T.tarjetaBg}` }}>{subiendoFoto ? '…' : '📷'}</div>
          <input ref={inputFotoRef} type="file" accept="image/*" onChange={alElegirFoto} style={{ display: 'none' }} />
        </div>
        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: T.textoFuerte, lineHeight: 1.1 }}>{nombreCompleto || 'Sin nombre'}</div>
        <div style={{ fontSize: 12.5, color: C.tenue, display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center', marginTop: 5 }}>
          {posicion && <span>{posicion}</span>}
          {posicion && ubicacion && <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.tenue }} />}
          {ubicacion && <span>{ubicacion}</span>}
          {edad != null && <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.tenue }} />}
          {edad != null && <span>{edad} años</span>}
        </div>
        <span onClick={copiarMC} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 11, fontSize: 11.5, fontWeight: 700, color: T.acento, background: T.esClaro ? 'rgba(0,0,0,.04)' : 'rgba(255,255,255,.05)', border: `1px solid ${T.navActivoBorde}`, padding: '5px 12px', borderRadius: 9, fontFamily: 'monospace', letterSpacing: 1.5, cursor: 'pointer' }}>{copiado ? '✓ copiado' : (perfil.codigo_unico || 'MC------')}</span>

        <div style={{ display: 'flex', marginTop: 16, background: cajaStat, borderRadius: 14, overflow: 'hidden' }}>
          {[
            { v: statsSoc.seguidores, l: 'Seguidores' },
            { v: statsSoc.siguiendo, l: 'Siguiendo' },
            { v: perfil.juegos_jugados != null ? perfil.juegos_jugados : 0, l: 'Juegos' },
          ].map((s, i) => (
            <div key={s.l} style={{ flex: 1, textAlign: 'center', padding: '12px 6px', borderLeft: i > 0 ? `1px solid ${T.lineaSuave}` : 'none' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.textoFuerte, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, color: C.tenue, marginTop: 5, textTransform: 'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {esJugador && (
          <>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: T.acento, margin: '14px 2px 8px' }}>Promedios</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[['—', 'PTS'], ['—', 'REB'], ['—', 'AST'], ['—', 'ROB']].map(([v, l]) => (
                <div key={l} style={{ textAlign: 'center', background: cajaStat, borderRadius: 12, padding: '11px 4px' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.textoFuerte, lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 0.6, color: C.tenue, marginTop: 5, textTransform: 'uppercase' }}>{l}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )

  const Stat = ({ valor, etiqueta }) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '6px 0' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: T.textoFuerte }}>{valor}</div>
      <div style={{ fontSize: 10.5, color: C.tenue, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{etiqueta}</div>
    </div>
  )
  const cajaStat = T.esClaro ? 'rgba(0,0,0,.03)' : 'rgba(255,255,255,.04)'

  const bAtleta = esJugador && (
    <Tarjeta titulo="Datos de atleta">
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, textAlign: 'center', background: cajaStat, borderRadius: 12, padding: '12px 6px' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.textoFuerte }}>{perfil.estatura_pies ? `${perfil.estatura_pies}'${perfil.estatura_pulgadas || 0}"` : '—'}</div>
          <div style={{ fontSize: 10, color: C.tenue, textTransform: 'uppercase', marginTop: 3 }}>Estatura</div>
        </div>
        <div style={{ flex: 2, textAlign: 'center', background: cajaStat, borderRadius: 12, padding: '12px 6px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.textoFuerte, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            {posiciones.length ? posiciones.map((p, i) => (
              <span key={p} style={{ color: i === 0 ? T.acento : T.textoFuerte }}>{p}{i === 0 && <span style={{ fontSize: 9, color: C.tenue }}> (nat.)</span>}</span>
            )) : '—'}
          </div>
          <div style={{ fontSize: 10, color: C.tenue, textTransform: 'uppercase', marginTop: 3 }}>Posiciones</div>
        </div>
      </div>
    </Tarjeta>
  )

  const bRating = esJugador && (
    <Tarjeta titulo="Rating y rankings">
      <div style={{ display: 'flex' }}><Stat valor="—" etiqueta="Rating" /><Stat valor="—" etiqueta="Rank nacional" /><Stat valor="—" etiqueta="Nivel" /></div>
      <div style={{ fontSize: 12, color: C.tenue, textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>Tu rating aparecerá cuando juegues tu primer torneo. Mientras más juegues, más sólido tu número.</div>
    </Tarjeta>
  )

  const bPromedios = esJugador && (
    <Tarjeta titulo="Promedios de carrera">
      <div style={{ display: 'flex' }}><Stat valor="0.0" etiqueta="PTS" /><Stat valor="0.0" etiqueta="REB" /><Stat valor="0.0" etiqueta="AST" /><Stat valor="0.0" etiqueta="ROB" /></div>
      <div style={{ fontSize: 12, color: C.tenue, textAlign: 'center', marginTop: 12 }}>0 torneos · 0 partidos jugados</div>
    </Tarjeta>
  )

  const bTrofeos = esJugador && (
    <Tarjeta titulo="Vitrina de trofeos">
      <div style={{ fontSize: 13, color: C.tenue, textAlign: 'center', padding: '14px 0' }}>🏆 Aquí irán tus campeonatos, MVPs y liderazgos.</div>
    </Tarjeta>
  )

  const bTorneos = (
    <Tarjeta titulo={esJugador ? 'Mis torneos y ligas' : 'Lo que sigo'}>
      <div style={{ fontSize: 13, color: C.tenue, textAlign: 'center', padding: '14px 0', lineHeight: 1.5 }}>
        {esJugador ? 'Todavía no estás en ningún torneo o liga. Cuando te inscriban con tu MC-ID, aparecerán aquí.' : 'Sigue torneos, equipos y jugadores para verlos aquí.'}
      </div>
    </Tarjeta>
  )

  const bMcid = (
    <Tarjeta titulo="Tu MC-ID">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 3, fontFamily: 'monospace', ...ORO }}>{perfil.codigo_unico || '--------'}</div>
          <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 4 }}>Tu identificación en Media Cancha. Compártela para que te agreguen a ligas y torneos.</div>
        </div>
        <button onClick={copiarMC} style={{ flexShrink: 0, border: 'none', borderRadius: 11, padding: '11px 16px', background: copiado ? 'rgba(47,191,113,.18)' : T.boton, color: copiado ? '#7bd6a3' : '#1a1205', fontWeight: 800, fontSize: 13, cursor: 'pointer', minWidth: 86 }}>{copiado ? '✓ Copiado' : 'Copiar'}</button>
      </div>
    </Tarjeta>
  )

  const bCuenta = (
    <Tarjeta titulo="Cuenta">
      <div style={{ fontSize: 13, color: C.tenue, display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>Correo</span><span style={{ color: T.textoFuerte }}>{perfil.correo}</span></div>
      <div style={{ fontSize: 13, color: C.tenue, display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span>Plan</span><span style={{ color: T.acento, fontWeight: 700 }}>Gratis</span></div>
      <button onClick={salir} style={{ width: '100%', border: '1px solid rgba(224,86,63,.3)', borderRadius: 11, padding: 12, background: T.esClaro ? 'rgba(224,86,63,.08)' : 'rgba(224,86,63,.12)', color: '#e0563f', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>↩ Cerrar sesión</button>
    </Tarjeta>
  )

  // ===== ESCRITORIO: carnet arriba + 3 columnas =====
  const recortadorUI = fotoARecortar ? (
    <RecortadorFoto archivo={fotoARecortar} forma="circulo" tema={{ acento: T.acento, boton: T.boton, botonTexto: '#1a1205', panel: 'rgba(12,14,18,.98)', texto: '#f4f7f9', tenue: '#9aa7b2' }} onListo={alRecortarFoto} onCancelar={() => setFotoARecortar(null)} />
  ) : null

  // Visor: foto grande + botón Editar pequeño + menú chiquito (Mover / Cambiar)
  const visorUI = visorAbierto && perfil.foto_url ? (
    <div onClick={() => { setVisorAbierto(false); setMenuFotoAbierto(false) }} style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(4,5,7,.92)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(78vw, 320px)', height: 'min(78vw, 320px)', borderRadius: '50%', background: `url(${perfil.foto_url}) center/cover`, boxShadow: `0 0 0 4px ${T.acento}, 0 20px 50px rgba(0,0,0,.5)` }} />
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', marginTop: 26 }}>
        <button onClick={() => setMenuFotoAbierto((v) => !v)} style={{ border: `1px solid rgba(255,255,255,.2)`, borderRadius: 12, padding: '10px 22px', background: 'rgba(255,255,255,.08)', color: '#f4f7f9', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>✎ Editar</button>
        {menuFotoAbierto && (
          <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', minWidth: 180, background: 'rgba(18,20,24,.99)', border: '1px solid rgba(232,182,79,.25)', borderRadius: 13, padding: 6, boxShadow: '0 10px 30px rgba(0,0,0,.5)' }}>
            <button onClick={editarFotoActual} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#f4f7f9', fontSize: 13.5, fontWeight: 600, padding: '11px 12px', borderRadius: 9, cursor: 'pointer' }}><span>↔️</span> Mover / ajustar</button>
            <button onClick={() => { setMenuFotoAbierto(false); setVisorAbierto(false); inputFotoRef.current && inputFotoRef.current.click() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#f4f7f9', fontSize: 13.5, fontWeight: 600, padding: '11px 12px', borderRadius: 9, cursor: 'pointer' }}><span>🖼️</span> Cambiar foto</button>
          </div>
        )}
      </div>
      <button onClick={() => { setVisorAbierto(false); setMenuFotoAbierto(false) }} style={{ marginTop: 16, border: 'none', background: 'transparent', color: '#9aa7b2', fontSize: 13, cursor: 'pointer' }}>Cerrar</button>
    </div>
  ) : null

  const topBar = (
    <div style={{ position: 'sticky', top: 0, zIndex: 15, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(env(safe-area-inset-top) + 10px) 16px 10px', background: T.headerBg, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: `1px solid ${T.lineaSuave}` }}>
      <button onClick={() => irA('inicio')} style={{ width: 38, height: 38, borderRadius: 11, border: `1px solid ${T.tarjetaBorde}`, background: T.esClaro ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.05)', color: T.textoFuerte, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>‹</button>
      <span style={{ fontSize: 14, fontWeight: 800, color: T.textoFuerte }}>Mi Perfil</span>
      <BotonTema />
    </div>
  )

  const contenidoPubs = (
    cargandoPubs ? (
      <div style={{ textAlign: 'center', padding: '30px', color: C.tenue, fontSize: 13 }}>Cargando publicaciones…</div>
    ) : publicaciones.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '38px 20px', color: C.tenue, background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 16 }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>🏀</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.textoFuerte, marginBottom: 5 }}>Todavía no has publicado nada</div>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>Tus resultados y publicaciones van a aparecer aquí.</div>
      </div>
    ) : (
      publicaciones.map((p) => {
        let datos = p.datos || {}
        if (typeof datos === 'string') { try { datos = JSON.parse(datos) } catch (e) { datos = {} } }
        const esJuego = datos && datos.nombreA && datos.nombreB && (datos.totalA != null || (datos.jugadores && datos.jugadores.length))
        if (esJuego) {
          const fuenteJuego = datos.fuente || (p.tipo === 'torneo' ? 'torneo' : p.tipo === 'liga' ? 'liga' : 'rapido')
          return <TarjetaResultado key={p.id} datos={datos} fuente={fuenteJuego} tiempo={haceCuanto(p.creado_en)} comentario={p.texto && !p.texto.startsWith('Ganaron') && !p.texto.startsWith('Quedaron') ? p.texto.split('\n')[0] : null} temaForzado={tema} />
        }
        return (
          <div key={p.id} style={{ background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 16, padding: 16 }}>
            {p.titulo && <div style={{ fontSize: 16, fontWeight: 800, color: T.textoFuerte, marginBottom: 6 }}>{p.titulo}</div>}
            {p.texto && <div style={{ fontSize: 14, color: T.textoBody, lineHeight: 1.55 }}>{p.texto}</div>}
            <div style={{ fontSize: 11, color: T.tenue, marginTop: 8 }}>{haceCuanto(p.creado_en)}</div>
          </div>
        )
      })
    )
  )

  return (
    <div style={wrap}>
      <Velo />
      <div style={scrollArea}>
        {topBar}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto', width: '100%', padding: '16px 16px calc(env(safe-area-inset-bottom) + 60px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TarjetaPerfil />
          <div style={{ display: 'flex', background: T.esClaro ? 'rgba(0,0,0,.04)' : 'rgba(255,255,255,.04)', borderRadius: 12, padding: 4, gap: 4 }}>
            {[{ id: 'publicaciones', txt: 'Publicaciones' }, { id: 'datos', txt: 'Datos' }].map((p) => {
              const activa = p.id === pestanaPerfil
              return (
                <button key={p.id} onClick={() => setPestanaPerfil(p.id)} style={{ flex: 1, border: 'none', borderRadius: 9, padding: '11px 0', background: activa ? T.boton : 'transparent', color: activa ? '#1a1205' : C.tenue, fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>{p.txt}</button>
              )
            })}
          </div>
          {pestanaPerfil === 'datos'
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{bMcid}{bAtleta}{bRating}{bPromedios}{bTrofeos}{bTorneos}{bCuenta}</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{contenidoPubs}</div>}
        </div>
      </div>
      {recortadorUI}{visorUI}
    </div>
  )
}