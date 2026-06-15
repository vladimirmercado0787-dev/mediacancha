import { useState, useEffect } from 'react'
import fondoCancha from '../assets/fondo-cancha.png'
import fondoTarjetaMiembro from '../assets/fondo-tarjeta-miembro.png'
import texturaCuero from '../assets/textura-cuero.png'
import bannerBienvenida from '../assets/banner-bienvenida.png'
import barraMiembroClara from '../assets/barra-miembro-clara.png'
import barraMiembroLarimar from '../assets/barra-miembro-larimar.png'
import texturaCueroClara from '../assets/textura-cuero-clara.png'
import texturaCueroLarimar from '../assets/textura-cuero-larimar.png'
import { leerHistorialDia, haceCuanto as haceCuantoLocal, publicarEnTechado, quitarDelTechado } from '../historialDia'
import { leerTechado, misReacciones, reaccionar, leerComentarios, comentar, borrarComentario, haceCuanto, borrarPublicacion, miUsuarioId, miPerfilCompleto } from '../techado'
import { plantillaPorId, PLANTILLA_DEFAULT, PLANTILLAS, puedeUsar } from '../plantillas'

// Tokens de superficie OSCURA (compartidos por los temas dorado y azul).
const SUP_OSCURA = {
  esClaro: false,
  fondo: '#08090c',
  textoFuerte: '#f4f7f9',
  textoBody: '#eef3f6',
  tenue: '#9aa7b2',
  subTexto: '#c3ccd4',
  vidrio: 'linear-gradient(150deg, rgba(24,26,30,0.82), rgba(12,14,18,0.86))',
  panelWash: 'linear-gradient(180deg, rgba(8,9,12,0.72), rgba(8,9,12,0.8))',
  scrimCarnet: 'linear-gradient(90deg, rgba(6,7,9,0.92) 0%, rgba(6,7,9,0.7) 45%, rgba(6,7,9,0.15) 75%, transparent 100%)',
  headerBg: 'rgba(8,9,12,0.92)',
  veloGrad: 'linear-gradient(90deg, rgba(8,9,12,0.92) 0%, rgba(8,9,12,0.66) 45%, rgba(8,9,12,0.55) 100%)',
  barraInteriorBg: 'rgba(20,22,26,0.55)',
  texturaImg: texturaCuero,
  barraImg: fondoTarjetaMiembro,
}

const TEMAS = {
  dorado: {
    ...SUP_OSCURA,
    nombre: 'Dorado',
    acento: '#e8b65a',
    borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)',
    texto: 'linear-gradient(120deg,#fbe08a,#c8842e)',
    balon: ['#fbe08a', '#d18f33', '#9a6420'],
    avatar: 'linear-gradient(150deg, #e0b057, #9a6420)',
    avatarTexto: '#241a07',
    boton: 'linear-gradient(150deg, #f3cf63, #c8842e)',
    glow: 'rgba(190,135,55,0.20)',
    navActivoBg: 'rgba(232,169,75,.15)',
    navActivoBorde: 'rgba(232,169,75,.35)',
  },
  azul: {
    ...SUP_OSCURA,
    nombre: 'Azul',
    acento: '#6fb0ec',
    borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)',
    texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)',
    balon: ['#9fd4fb', '#4f8fd0', '#1d4a80'],
    avatar: 'linear-gradient(150deg, #5aa0e0, #1d4a80)',
    avatarTexto: '#08151f',
    boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)',
    glow: 'rgba(55,120,190,0.22)',
    navActivoBg: 'rgba(111,176,236,.15)',
    navActivoBorde: 'rgba(111,176,236,.35)',
  },
  claro: {
    esClaro: true,
    nombre: 'Claro',
    acento: '#b07a26',
    borde: 'linear-gradient(140deg,#f0d79a,#c79a45 40%,#9a7530 70%,#e3c578)',
    texto: 'linear-gradient(120deg,#c8902f,#9a6420)',
    balon: ['#e7c069', '#c8842e', '#9a6420'],
    avatar: 'linear-gradient(150deg, #e7c069, #a9741f)',
    avatarTexto: '#3a2806',
    boton: 'linear-gradient(150deg, #e7c069, #b07a26)',
    glow: 'rgba(190,135,55,0.10)',
    navActivoBg: 'rgba(176,122,38,.16)',
    navActivoBorde: 'rgba(176,122,38,.35)',
    fondo: '#e6dcc8',
    textoFuerte: '#2a2014',
    textoBody: '#3a2f20',
    tenue: '#7a6e58',
    subTexto: '#5b5040',
    vidrio: 'linear-gradient(150deg, rgba(255,255,255,0.60), rgba(255,255,255,0.46))',
    panelWash: 'linear-gradient(180deg, rgba(250,245,235,0.66), rgba(248,242,231,0.80))',
    scrimCarnet: 'linear-gradient(100deg, rgba(250,245,235,0.86) 0%, rgba(250,245,235,0.52) 45%, rgba(250,245,235,0.12) 75%, transparent 100%)',
    headerBg: 'rgba(248,243,233,0.92)',
    veloGrad: 'linear-gradient(90deg, rgba(248,243,233,0.86) 0%, rgba(248,243,233,0.66) 45%, rgba(248,243,233,0.55) 100%)',
    barraInteriorBg: 'rgba(255,255,255,0.5)',
    texturaImg: texturaCueroClara,
    barraImg: barraMiembroClara,
  },
  larimar: {
    esClaro: true,
    nombre: 'Larimar',
    acento: '#b07a26',
    borde: 'linear-gradient(140deg,#f0d79a,#c79a45 40%,#9a7530 70%,#e3c578)',
    texto: 'linear-gradient(120deg,#c8902f,#9a6420)',
    balon: ['#e7c069', '#c8842e', '#9a6420'],
    avatar: 'linear-gradient(150deg, #e7c069, #a9741f)',
    avatarTexto: '#3a2806',
    boton: 'linear-gradient(150deg, #e7c069, #b07a26)',
    glow: 'rgba(60,150,170,0.12)',
    navActivoBg: 'rgba(176,122,38,.16)',
    navActivoBorde: 'rgba(176,122,38,.35)',
    fondo: '#d6e7e8',
    textoFuerte: '#1c2624',
    textoBody: '#2c3a3a',
    tenue: '#5f7375',
    subTexto: '#48595a',
    vidrio: 'linear-gradient(150deg, rgba(255,255,255,0.58), rgba(255,255,255,0.44))',
    panelWash: 'linear-gradient(180deg, rgba(236,246,247,0.64), rgba(228,242,244,0.78))',
    scrimCarnet: 'linear-gradient(100deg, rgba(236,246,247,0.86) 0%, rgba(236,246,247,0.52) 45%, rgba(236,246,247,0.12) 75%, transparent 100%)',
    headerBg: 'rgba(232,244,245,0.92)',
    veloGrad: 'linear-gradient(90deg, rgba(232,244,245,0.86) 0%, rgba(232,244,245,0.66) 45%, rgba(232,244,245,0.55) 100%)',
    barraInteriorBg: 'rgba(255,255,255,0.5)',
    texturaImg: texturaCueroLarimar,
    barraImg: barraMiembroLarimar,
  },
}

function Balon({ size = 200, sw = 5.5, gid = 'gbal', cols }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="100" y1="22" x2="100" y2="178">
          <stop offset="0%" stopColor={cols[0]} /><stop offset="50%" stopColor={cols[1]} /><stop offset="100%" stopColor={cols[2]} />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${gid})`} strokeLinecap="round">
        <circle cx="100" cy="100" r="78" strokeWidth={sw} />
        <line x1="0" y1="100" x2="200" y2="100" strokeWidth={sw} />
        <path d="M58 50 Q90 100 58 150" strokeWidth={sw} />
        <path d="M142 50 Q110 100 142 150" strokeWidth={sw} />
        <line x1="100" y1="40" x2="100" y2="160" strokeWidth={sw + 1} />
      </g>
    </svg>
  )
}
function IconoTechado({ size = 22, cols }) {
  const gid = 'gtech' + size
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
      <defs><linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="50" y1="15" x2="50" y2="85">
        <stop offset="0%" stopColor={cols[0]} /><stop offset="100%" stopColor={cols[2]} /></linearGradient></defs>
      <g fill="none" stroke={`url(#${gid})`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 47 L50 23 L84 47" /><path d="M26 45 V78 M74 45 V78" /><line x1="20" y1="78" x2="80" y2="78" />
      </g>
    </svg>
  )
}

const TORNEOS = [
  { nombre: 'Copa Jícome 2026', meta: 'Jícome, Valverde · 8 equipos', nivel: 'Campo', color: '#2fbf71', likes: 1240 },
  { nombre: 'Liga Superior del Cibao', meta: 'Santiago · 12 equipos', nivel: 'Superior', color: '#e0a64b', likes: 980 },
  { nombre: 'Torneo Mao Centro', meta: 'Mao, Valverde · 10 equipos', nivel: 'Intermedio', color: '#d88f3a', likes: 612 },
]
const RANKING = [
  { rk: 1, ini: 'BT', nombre: 'Brayan Tavárez', equipo: 'Águilas Esperanza', val: '24.5' },
  { rk: 2, ini: 'SP', nombre: 'Starlin Polanco', equipo: 'Los Tígres', val: '22.1' },
  { rk: 3, ini: 'RB', nombre: 'Ramón Bautista', equipo: 'Leones Mao', val: '13.2' },
  { rk: 4, ini: 'JM', nombre: 'Julio Martínez', equipo: 'Caciques Sur', val: '12.8' },
  { rk: 5, ini: 'ED', nombre: 'Elvin De León', equipo: 'Metro Santiago', val: '11.9' },
]

// Menú principal: visibles en la fila horizontal (computadora)
const NAV_PRINCIPAL = [
  { id: 'inicio', txt: 'Inicio', icono: '⌂' },
  { id: 'perfil', txt: 'Mi Perfil', icono: '◉' },
  { id: 'techado', txt: 'El Techado', icono: 'techado' },
  { id: 'torneos', txt: 'Torneos', icono: '🏆' },
  { id: 'rankings', txt: 'Rankings', icono: '★' },
  { id: 'mapa', txt: 'Mapa', icono: '🗺️' },
  { id: 'historialDia', txt: 'Historial', icono: '🗓️' },
]
// Lo que queda en "Más ▾"
const NAV_MAS = [
  { id: 'misTorneos', txt: 'Mis torneos', icono: '🏆' },
  { id: 'misLigas', txt: 'Mis ligas', icono: '🤝' },
]
// Menú completo para el móvil (barra inferior + menú ☰)
const NAV = [
  { id: 'inicio', txt: 'Inicio', icono: '⌂' },
  { id: 'perfil', txt: 'Mi Perfil', icono: '◉' },
  { id: 'techado', txt: 'El Techado', icono: 'techado' },
  { id: 'torneos', txt: 'Torneos', icono: '🏆' },
  { id: 'rankings', txt: 'Rankings', icono: '★' },
  { id: 'mapa', txt: 'Mapa del baloncesto', icono: '🗺️' },
  { id: 'historialDia', txt: 'Historial de hoy', icono: '🗓️' },
  { id: 'configuracion', txt: 'Configuración', icono: '⚙️' },
]
const ACCIONES_CREAR = [
  { id: 'juego', txt: '⚡ Armar juego rápido' },
  { id: 'crearTorneo', txt: '🏆 Crear torneo' },
  { id: 'crearLiga', txt: '🤝 Crear liga' },
]
const ACCIONES_MIAS = [
  { id: 'misTorneos', txt: '🏆 Mis torneos' },
  { id: 'misLigas', txt: '🤝 Mis ligas' },
]
// Solo crear torneo/liga (para el botón "Crear ▾" de la fila; "Armar juego" va aparte)
const CREAR_DROPDOWN = [
  { id: 'crearTorneo', txt: '🏆 Crear torneo' },
  { id: 'crearLiga', txt: '🤝 Crear liga' },
]

export default function PantallaPublica({ onAccion, haySesion }) {
  const [esEscritorio, setEsEscritorio] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : false)
  const [esTablet, setEsTablet] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1100 : false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [masAbierto, setMasAbierto] = useState(false)
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [likes, setLikes] = useState({})
  const [tema, setTema] = useState(() => {
    const validos = ['dorado', 'azul', 'claro', 'larimar']
    if (typeof window !== 'undefined') {
      const g = localStorage.getItem('mc_tema')
      return validos.includes(g) ? g : 'dorado'
    }
    return 'dorado'
  })
  const [juegosDia, setJuegosDia] = useState([])
  const [publicaciones, setPublicaciones] = useState([])
  const [misReacc, setMisReacc] = useState({})
  const [cargandoTechado, setCargandoTechado] = useState(true)
  const [comentariosAbiertos, setComentariosAbiertos] = useState(null)
  const [verHistorialDia, setVerHistorialDia] = useState(false)
  const [miId, setMiId] = useState(null)
  const [miPerfil, setMiPerfil] = useState(null)
  const [copiadoMC, setCopiadoMC] = useState(false)
  const [navHover, setNavHover] = useState(null)
  const [pubAbierta, setPubAbierta] = useState(null)
  const [juegoAPublicar, setJuegoAPublicar] = useState(null)

  const recargarTechado = async () => {
    const res = await leerTechado()
    const pubs = res.data || []
    setPublicaciones(pubs)
    if (haySesion && pubs.length) {
      const mapa = await misReacciones(pubs.map((p) => p.id))
      setMisReacc(mapa)
    }
    setPubAbierta((abierta) => {
      if (!abierta) return abierta
      const actualizada = pubs.find((p) => p.id === abierta.id)
      return actualizada || abierta
    })
    setCargandoTechado(false)
  }

  useEffect(() => {
    setJuegosDia(leerHistorialDia())
    recargarTechado()
    miUsuarioId().then((id) => setMiId(id))
    if (haySesion) miPerfilCompleto().then((p) => setMiPerfil(p))
  }, [])

  // Cerrar los menús desplegables al hacer clic fuera
  useEffect(() => {
    if (!masAbierto && !crearAbierto) return
    const cerrar = () => { setMasAbierto(false); setCrearAbierto(false) }
    window.addEventListener('click', cerrar)
    return () => window.removeEventListener('click', cerrar)
  }, [masAbierto, crearAbierto])

  useEffect(() => {
    const hayModal = pubAbierta || verHistorialDia || juegoAPublicar
    if (hayModal) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.width = '100%'
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [pubAbierta, verHistorialDia, juegoAPublicar])

  const onBorrarPublicacion = async (pubId) => {
    if (!window.confirm('¿Eliminar esta publicación del Techado?')) return
    const res = await borrarPublicacion(pubId)
    if (res.error) alert(res.error)
    else recargarTechado()
  }

  const onReaccionar = async (pubId, tipo) => {
    if (!haySesion) { click('entrar'); return }
    await reaccionar(pubId, tipo)
    recargarTechado()
  }

  const [publicandoId, setPublicandoId] = useState(null)

  const abrirSelectorParaJuego = (juego) => {
    if (!haySesion) { click('entrar'); return }
    if (juego.publicado || publicandoId) return
    setJuegoAPublicar(juego)
  }

  const confirmarPublicarJuego = async (plantillaId, textoExtra) => {
    const juego = juegoAPublicar
    if (!juego) return
    setJuegoAPublicar(null)
    setPublicandoId(juego.id)
    publicarEnTechado(juego.id)
    setJuegosDia(leerHistorialDia())
    const { publicarJuego } = await import('../techado')
    const res = await publicarJuego({
      nombreA: juego.nombreA, nombreB: juego.nombreB,
      jugadores: juego.jugadores || [],
      nombreJuego: juego.nombreJuego,
      plantilla: plantillaId,
      textoExtra: textoExtra || null,
    })
    if (res.error) {
      quitarDelTechado(juego.id)
      setJuegosDia(leerHistorialDia())
      alert(res.error)
    } else {
      await recargarTechado()
    }
    setPublicandoId(null)
  }

  const T = TEMAS[tema] || TEMAS.dorado
  const ORO_TEXTO = { background: T.texto, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }

  useEffect(() => {
    const onResize = () => {
      setEsEscritorio(window.innerWidth >= 768)
      setEsTablet(window.innerWidth >= 768 && window.innerWidth < 1100)
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

  const click = (id) => {
    setMenuAbierto(false)
    setMasAbierto(false)
    setCrearAbierto(false)
    if (id === 'historialDia') { setVerHistorialDia(true); return }
    onAccion && onAccion(id)
  }

  const copiarMiMC = () => {
    if (!miPerfil?.codigo_unico) return
    navigator.clipboard?.writeText(miPerfil.codigo_unico)
    setCopiadoMC(true)
    setTimeout(() => setCopiadoMC(false), 1600)
  }

  const edadDe = (fecha) => {
    if (!fecha) return null
    const n = new Date(fecha), h = new Date()
    let e = h.getFullYear() - n.getFullYear()
    const m = h.getMonth() - n.getMonth()
    if (m < 0 || (m === 0 && h.getDate() < n.getDate())) e--
    return e >= 0 && e < 120 ? e : null
  }

  const C = { texto: T.textoBody, tenue: T.tenue, font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }

  // Barra de miembro (carnet) — más compacta, el jugador protagonista
  const BarraMiembro = () => {
    if (!haySesion || !miPerfil) return null
    const p = miPerfil
    const esJugador = p.modo === 'jugador'
    const nombre = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Miembro'
    const iniciales = `${(p.nombre || '?')[0] || ''}${(p.apellido || '')[0] || ''}`.toUpperCase()
    const ubicacion = [p.municipio, p.provincia].filter(Boolean).join(', ')
    const posicion = (p.posiciones && p.posiciones[0]) || null
    return (
      <div style={{ position: 'relative', borderRadius: 16, cursor: 'pointer', border: `1px solid ${T.navActivoBorde}`, backgroundImage: `url(${T.barraImg})`, backgroundSize: 'cover', backgroundPosition: 'center right' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: T.scrimCarnet }} />
        <div onClick={() => click('perfil')} style={{ position: 'relative', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* foto protagonista */}
          <div style={{ width: 60, height: 60, borderRadius: 13, background: p.foto_url ? `url(${p.foto_url}) center/cover` : T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: T.avatarTexto, flexShrink: 0, border: '1.5px solid rgba(255,255,255,.2)' }}>
            {!p.foto_url && iniciales}
          </div>
          {/* nombre + datos */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 1 }}>
              <span style={{ fontSize: 9, color: T.tenue, letterSpacing: 0.5 }}>MEDIA <span style={{ color: T.acento }}>CANCHA</span></span>
              <span style={{ fontSize: 8, fontWeight: 800, color: T.acento, border: `1px solid ${T.acento}`, padding: '1px 7px', borderRadius: 12, textTransform: 'uppercase' }}>{esJugador ? 'Jugador' : 'Fanático'}</span>
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, color: T.textoFuerte, lineHeight: 1.1, textShadow: T.esClaro ? 'none' : '0 1px 6px rgba(0,0,0,.8)' }}>{nombre}</div>
            {(posicion || ubicacion) && <div style={{ fontSize: 11.5, color: T.subTexto, marginTop: 1, textShadow: T.esClaro ? 'none' : '0 1px 4px rgba(0,0,0,.8)' }}>{[posicion, ubicacion].filter(Boolean).join(' · ')}</div>}
          </div>
          {/* stats (solo jugador, en pantallas anchas) */}
          {esJugador && esEscritorio && !esTablet && (
            <div style={{ display: 'flex', gap: 18, flexShrink: 0 }}>
              {[['—', 'PTS'], ['—', 'REB'], ['—', 'AST'], ['—', 'ROB']].map(([v, l]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: l === 'PTS' ? T.acento : T.textoFuerte, lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 8.5, color: T.tenue, marginTop: 3, letterSpacing: 0.5 }}>{l}</div>
                </div>
              ))}
            </div>
          )}
          {/* MC ID */}
          <div onClick={(e) => { e.stopPropagation(); copiarMiMC() }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: copiadoMC ? 'rgba(47,191,113,.18)' : 'rgba(232,182,90,0.14)', border: `0.5px solid ${copiadoMC ? 'rgba(47,191,113,.5)' : 'rgba(232,182,90,0.4)'}`, borderRadius: 7, padding: '5px 10px', cursor: 'pointer', flexShrink: 0 }}>
            <span style={{ fontSize: 8.5, color: T.tenue, letterSpacing: 0.5 }}>MC ID</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1.5, color: T.acento }}>{p.codigo_unico || '--------'}</span>
            <span style={{ fontSize: 12, color: copiadoMC ? '#7bd6a3' : T.acento }}>{copiadoMC ? '✓' : '⧉'}</span>
          </div>
          {/* selector de tema */}
          <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}><BotonTema /></div>
        </div>
        {/* fila del menú horizontal */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2, padding: '7px 10px', background: T.barraInteriorBg, borderTop: T.esClaro ? '1px solid rgba(0,0,0,.1)' : '1px solid rgba(255,255,255,.08)', borderRadius: '0 0 16px 16px', flexWrap: 'wrap' }}>
          {NAV_PRINCIPAL.map((n) => {
            const resaltado = navHover === n.id
            return (
              <button key={n.id} onClick={() => click(n.id)} onMouseEnter={() => setNavHover(n.id)} onMouseLeave={() => setNavHover(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: resaltado ? T.navActivoBg : 'transparent', border: resaltado ? `1px solid ${T.navActivoBorde}` : '1px solid transparent', color: resaltado ? T.acento : C.texto, fontSize: 12.5, fontWeight: 600, padding: '7px 11px', borderRadius: 8, cursor: 'pointer', transition: 'all .15s ease', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 14, display: 'inline-flex', color: T.acento }}>{n.icono === 'techado' ? <IconoTechado size={14} cols={T.balon} /> : n.icono}</span>{n.txt}
              </button>
            )
          })}
          {/* separador */}
          <div style={{ width: 1, height: 22, background: T.esClaro ? 'rgba(0,0,0,.1)' : 'rgba(255,255,255,.1)', margin: '0 6px' }} />
          {/* Armar juego (acción estrella, resaltada) */}
          <button onClick={() => click('juego')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.boton, border: 'none', color: T.avatarTexto, fontSize: 12.5, fontWeight: 800, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ⚡ Armar juego
          </button>
          {/* Crear ▾ (torneo / liga) */}
          <div style={{ position: 'relative' }}>
            <button onClick={(e) => { e.stopPropagation(); setCrearAbierto((v) => !v); setMasAbierto(false) }} style={{ display: 'flex', alignItems: 'center', gap: 5, background: crearAbierto ? T.navActivoBg : 'transparent', border: `1px solid ${T.navActivoBorde}`, color: T.acento, fontSize: 12.5, fontWeight: 600, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + Crear <span style={{ fontSize: 10 }}>{crearAbierto ? '▴' : '▾'}</span>
            </button>
            {crearAbierto && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: 180, background: T.esClaro ? 'rgba(252,250,245,.99)' : 'rgba(18,20,24,.98)', border: `1px solid ${T.navActivoBorde}`, borderRadius: 12, padding: 7, zIndex: 200, backdropFilter: 'blur(12px)', boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>
                {CREAR_DROPDOWN.map((a) => (
                  <button key={a.id} onClick={() => click(a.id)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: C.texto, fontSize: 13, fontWeight: 600, padding: '9px 11px', borderRadius: 8, cursor: 'pointer' }}>{a.txt}</button>
                ))}
              </div>
            )}
          </div>
          {/* tuerca de configuración (solo icono) */}
          <button onClick={() => click('configuracion')} title="Configuración" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${T.navActivoBorde}`, color: T.acento, fontSize: 15, padding: '7px 10px', borderRadius: 8, cursor: 'pointer' }}>
            ⚙️
          </button>
          {/* Más ▾ (lo que sobra) */}
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <button onClick={(e) => { e.stopPropagation(); setMasAbierto((v) => !v); setCrearAbierto(false) }} style={{ display: 'flex', alignItems: 'center', gap: 5, background: masAbierto ? T.navActivoBg : 'transparent', border: `1px solid ${T.navActivoBorde}`, color: T.acento, fontSize: 12.5, fontWeight: 600, padding: '7px 12px', borderRadius: 8, cursor: 'pointer' }}>
              Más <span style={{ fontSize: 10 }}>{masAbierto ? '▴' : '▾'}</span>
            </button>
            {masAbierto && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 190, background: T.esClaro ? 'rgba(252,250,245,.99)' : 'rgba(18,20,24,.98)', border: `1px solid ${T.navActivoBorde}`, borderRadius: 12, padding: 7, zIndex: 200, backdropFilter: 'blur(12px)', boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: T.tenue, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 11px 6px' }}>Lo mío</div>
                {ACCIONES_MIAS.map((a) => (
                  <button key={a.id} onClick={() => click(a.id)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: C.texto, fontSize: 13, fontWeight: 600, padding: '8px 11px', borderRadius: 8, cursor: 'pointer' }}>{a.txt}</button>
                ))}
                {haySesion && (
                  <>
                    <div style={{ height: 1, background: T.esClaro ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.08)', margin: '6px 4px' }} />
                    <button onClick={() => click('cerrarSesion')} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: C.tenue, fontSize: 13, fontWeight: 600, padding: '8px 11px', borderRadius: 8, cursor: 'pointer' }}>↩ Cerrar sesión</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  const toggleLike = (key, base) => setLikes((p) => ({ ...p, [key]: p[key] ? undefined : base + 1 }))
  const verLikes = (key, base) => (likes[key] != null ? likes[key] : base)

  const Placa = ({ children, radio = 18, pad = 17 }) => (
    <div style={{ position: 'relative', borderRadius: radio, padding: 1.5, background: T.borde }}>
      <div style={{ borderRadius: radio - 1, padding: pad, background: T.vidrio, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', height: '100%' }}>{children}</div>
    </div>
  )

  const BotonTema = ({ flotante }) => (
    <button onClick={cambiarTema} title={`Tema: ${T.nombre}`} style={{
      display: 'flex', alignItems: 'center', gap: 7, background: T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(20,18,16,.7)', border: `1px solid ${T.navActivoBorde}`,
      color: T.acento, fontSize: 11.5, fontWeight: 700, padding: '7px 11px', borderRadius: 10, cursor: 'pointer',
      backdropFilter: 'blur(8px)', ...(flotante ? { position: 'fixed', top: 18, right: 18, zIndex: 50 } : {}),
    }}>
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: T.boton, display: 'inline-block' }} />
      {T.nombre}
    </button>
  )

  const Logo = ({ chico }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Balon size={chico ? 34 : 38} sw={5.5} gid="gico" cols={T.balon} />
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontSize: chico ? 15 : 17, fontWeight: 800, letterSpacing: 1, color: C.texto }}><span>MEDIA </span><span style={ORO_TEXTO}>CANCHA</span></div>
        <div style={{ fontSize: 8, letterSpacing: 2, color: C.tenue, marginTop: 3, textTransform: 'uppercase' }}>Estadísticas de baloncesto</div>
      </div>
    </div>
  )

  const TituloAcento = ({ children, icono }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
      {icono === 'techado' && <IconoTechado size={18} cols={T.balon} />}
      <h3 style={{ fontSize: 12, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: 800, margin: 0, ...ORO_TEXTO }}>{children}</h3>
    </div>
  )

  const SecHead = ({ titulo, icono, accion }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 2px 11px' }}>
      <TituloAcento icono={icono}>{titulo}</TituloAcento>
      {accion && <button onClick={accion.fn} style={{ fontSize: 12, color: C.tenue, background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer' }}>{accion.txt}</button>}
    </div>
  )

  const EnVivo = () => (
    <Placa>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 800, ...ORO_TEXTO }}>En vivo ahora</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 800, letterSpacing: 1, color: '#2fbf71', background: 'rgba(47,191,113,.14)', padding: '4px 9px', borderRadius: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2fbf71' }} />EN VIVO
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: C.texto }}>Los Tígres</div><div style={{ fontSize: 36, fontWeight: 800, color: T.textoFuerte }}>48</div></div>
        <div style={{ padding: '0 16px', textAlign: 'center' }}><div style={{ fontSize: 10, color: C.tenue, textTransform: 'uppercase' }}>3er Cuarto</div><div style={{ fontSize: 15, fontWeight: 700, color: T.acento }}>06:21</div></div>
        <div style={{ flex: 1, textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 700, color: T.acento }}>Leones Mao</div><div style={{ fontSize: 36, fontWeight: 800, color: T.textoFuerte }}>43</div></div>
      </div>
    </Placa>
  )

  const ListaTorneos = () => (
    <>{TORNEOS.map((t, i) => (
      <div key={i} style={{ marginBottom: 10 }}>
        <Placa radio={15} pad={13}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0, background: T.esClaro ? 'rgba(176,122,38,.12)' : 'linear-gradient(150deg, rgba(50,46,40,.6), rgba(18,18,20,.6))', border: `1px solid ${T.navActivoBorde}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Balon size={28} sw={4} gid={`gtb${i}`} cols={T.balon} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: C.texto }}>{t.nombre}</div>
              <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>📍 {t.meta}
                <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 7, textTransform: 'uppercase', color: t.color, background: `${t.color}26` }}>{t.nivel}</span>
              </div>
            </div>
            <div onClick={() => toggleLike(`t${i}`, t.likes)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: likes[`t${i}`] ? T.acento : C.tenue }}>
              <div style={{ fontSize: 16 }}>♥</div><div style={{ fontSize: 11, fontWeight: 700 }}>{verLikes(`t${i}`, t.likes).toLocaleString('en-US')}</div>
            </div>
          </div>
        </Placa>
      </div>
    ))}</>
  )

  const ListaTechado = () => {
    if (cargandoTechado) {
      return <Placa radio={15} pad={20}><div style={{ textAlign: 'center', color: C.tenue, fontSize: 13 }}>Cargando el Techado…</div></Placa>
    }
    if (publicaciones.length === 0) {
      return (
        <Placa radio={15} pad={20}>
          <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, lineHeight: 1.5 }}>
            Todavía no hay nada en el Techado.<br />
            Cuando juegues, puedes publicar tus juegos aquí (duran 24 horas).
          </div>
        </Placa>
      )
    }
    return (
      <>{publicaciones.map((p) => {
        let datos = p.datos || {}
        if (typeof datos === 'string') { try { datos = JSON.parse(datos) } catch (e) { datos = {} } }
        const plant = plantillaPorId(datos.plantilla || PLANTILLA_DEFAULT)
        const tieneImg = plant && plant.img
        return (
        <div key={p.id} style={{ marginBottom: 10 }}>
          <Placa radio={15} pad={0}>
            <div onClick={() => setPubAbierta(p)} style={{ position: 'relative', cursor: 'pointer', borderRadius: '14px 14px 0 0', overflow: 'hidden', padding: 14, minHeight: tieneImg ? 150 : 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: tieneImg ? `linear-gradient(180deg, rgba(8,9,12,.2) 0%, rgba(8,9,12,.55) 55%, rgba(8,9,12,.92) 100%), url(${plant.img}) center/cover` : 'transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9, position: tieneImg ? 'absolute' : 'static', top: 12, left: 12, right: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: p.autor_foto ? `url(${p.autor_foto}) center/cover` : T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: T.avatarTexto, flexShrink: 0, border: tieneImg ? '1.5px solid rgba(255,255,255,.35)' : 'none' }}>
                  {!p.autor_foto && ((p.autor_nombre || '?').slice(0, 1).toUpperCase())}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: tieneImg ? '#fff' : C.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: tieneImg ? '0 1px 4px rgba(0,0,0,.8)' : 'none' }}>{p.autor_nombre || 'Usuario'}{p.autor_apellido ? ` ${p.autor_apellido}` : ''}</div>
                  <div style={{ fontSize: 11, color: tieneImg ? 'rgba(255,255,255,.8)' : C.tenue, textShadow: tieneImg ? '0 1px 4px rgba(0,0,0,.8)' : 'none' }}>{haceCuanto(p.creado_en)}</div>
                </div>
                {p.tag && <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 0.5, padding: '3px 8px', borderRadius: 8, textTransform: 'uppercase', color: tieneImg ? '#fff' : (p.tag_color || T.acento), background: tieneImg ? (p.tag_color || T.acento) : `${p.tag_color || T.acento}26`, boxShadow: tieneImg ? '0 1px 6px rgba(0,0,0,.5)' : 'none' }}>{p.tag}</span>}
                {miId && p.autor_id === miId && (
                  <span onClick={(e) => { e.stopPropagation(); onBorrarPublicacion(p.id) }} title="Eliminar" style={{ fontSize: 16, color: tieneImg ? '#fff' : C.tenue, cursor: 'pointer', padding: '2px 4px', marginLeft: 2 }}>🗑️</span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.25, color: tieneImg ? '#f4f7f9' : C.texto, textShadow: tieneImg ? '0 1px 6px rgba(0,0,0,.9)' : 'none' }}>{p.titulo}</div>
                {p.texto && <div style={{ fontSize: 13, color: tieneImg ? '#e6ebef' : C.texto, marginTop: 5, lineHeight: 1.5, textShadow: tieneImg ? '0 1px 5px rgba(0,0,0,.9)' : 'none' }}>{p.texto}</div>}
                <div style={{ fontSize: 11.5, color: tieneImg ? 'rgba(255,255,255,.7)' : C.tenue, marginTop: 7, fontWeight: 600 }}>Toca para ver los detalles ›</div>
              </div>
            </div>
            <div style={{ padding: '0 14px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 12, paddingTop: 10, borderTop: T.esClaro ? '1px solid rgba(0,0,0,.07)' : '1px solid rgba(255,255,255,.06)' }}>
                <div onClick={() => onReaccionar(p.id, 'like')} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: misReacc[p.id] === 'like' ? T.acento : C.tenue, fontSize: 13, fontWeight: 700 }}>
                  <span style={{ fontSize: 15 }}>♥</span> {p.likes || 0}
                </div>
                <div onClick={() => onReaccionar(p.id, 'dislike')} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: misReacc[p.id] === 'dislike' ? '#e0563f' : C.tenue, fontSize: 13, fontWeight: 700 }}>
                  <span style={{ fontSize: 15 }}>👎</span> {p.dislikes || 0}
                </div>
                <div onClick={() => setPubAbierta(p)} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: C.tenue, fontSize: 13, fontWeight: 700 }}>
                  <span style={{ fontSize: 15 }}>💬</span> {p.num_comentarios || 0}
                </div>
              </div>
            </div>
          </Placa>
        </div>
        )
      })}</>
    )
  }

  const ListaRanking = ({ n }) => (
    <Placa radio={15} pad={6}>
      {RANKING.slice(0, n).map((l, idx) => (
        <div key={l.rk} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 8px', borderBottom: idx < n - 1 ? (T.esClaro ? '1px solid rgba(0,0,0,.07)' : '1px solid rgba(255,255,255,.06)') : 'none' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: l.rk <= 3 ? T.acento : C.tenue, width: 16, textAlign: 'center' }}>{l.rk}</div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: T.avatarTexto, flexShrink: 0 }}>{l.ini}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.texto }}>{l.nombre}</div><div style={{ fontSize: 10.5, color: C.tenue }}>{l.equipo}</div></div>
          <div style={{ textAlign: 'right' }}><b style={{ fontSize: 15, fontWeight: 800, color: T.acento }}>{l.val}</b><span style={{ fontSize: 9, color: C.tenue, display: 'block' }}>PTS/J</span></div>
        </div>
      ))}
    </Placa>
  )

  const ListaHistorialDia = () => (
    <>
      {juegosDia.map((j) => {
        const ganoA = !j.hayEmpate && j.nombreGanador === j.nombreA
        const ganoB = !j.hayEmpate && j.nombreGanador === j.nombreB
        return (
          <div key={j.id} style={{ marginBottom: 10 }}>
            <Placa radio={15} pad={13}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                <span style={{ fontSize: 11, color: C.tenue }}>{j.nombreJuego}</span>
                <span style={{ fontSize: 10.5, color: C.tenue }}>{haceCuantoLocal(j.ts)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: ganoA ? T.acento : C.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombreA}{ganoA ? ' 🏆' : ''}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: ganoA ? T.textoFuerte : C.tenue, lineHeight: 1.1 }}>{j.totalA}</div>
                </div>
                <div style={{ fontSize: 12, color: C.tenue, padding: '0 8px' }}>—</div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: ganoB ? T.acento : C.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombreB}{ganoB ? ' 🏆' : ''}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: ganoB ? T.textoFuerte : C.tenue, lineHeight: 1.1 }}>{j.totalB}</div>
                </div>
              </div>
              {j.destacadoNombre && (
                <div style={{ marginTop: 9, paddingTop: 9, borderTop: T.esClaro ? '1px solid rgba(0,0,0,.07)' : '1px solid rgba(255,255,255,.06)', fontSize: 11.5, color: C.tenue, textAlign: 'center' }}>
                  ⭐ <b style={{ color: C.texto }}>{j.destacadoNombre}</b> · {j.destacadoPts} pts{j.destacadoReb ? ` · ${j.destacadoReb} reb` : ''}{j.destacadoAst ? ` · ${j.destacadoAst} ast` : ''}
                </div>
              )}
              <button onClick={() => { if (!j.publicado) abrirSelectorParaJuego(j) }} disabled={j.publicado || publicandoId === j.id} style={{ width: '100%', marginTop: 10, padding: '9px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: j.publicado ? 'default' : 'pointer', border: j.publicado ? `1px solid ${T.acento}` : (T.esClaro ? '1px solid rgba(0,0,0,.14)' : '1px solid rgba(255,255,255,.14)'), background: j.publicado ? `${T.acento}1a` : 'transparent', color: j.publicado ? T.acento : C.tenue }}>
                {j.publicado ? '✓ Publicado en el Techado' : (publicandoId === j.id ? 'Publicando…' : '↗ Publicar en el Techado')}
              </button>
            </Placa>
          </div>
        )
      })}
    </>
  )

  const Bienvenida = ({ grande }) => (
    <div style={{ marginBottom: grande ? 20 : 8, position: 'relative', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(200,132,46,0.3)', backgroundImage: `url(${bannerBienvenida})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,9,12,0.55) 0%, rgba(8,9,12,0.35) 40%, rgba(8,9,12,0.45) 100%)' }} />
      <div style={{ position: 'relative', padding: grande ? '34px 38px' : '24px 22px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
          <span style={{ width: 26, height: 2, background: T.boton, display: 'block' }} />
          <span style={{ fontSize: 10.5, letterSpacing: 3, color: T.acento, fontWeight: 700, textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,.8)' }}>Del barrio a la Superior</span>
          <span style={{ width: 26, height: 2, background: T.boton, display: 'block' }} />
        </div>
        <div style={{ fontSize: grande ? 42 : 28, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.5px', color: '#f7f9fb', textShadow: '0 2px 16px rgba(0,0,0,.9)' }}>Todo el baloncesto.</div>
        <div style={{ fontSize: grande ? 42 : 28, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.5px', ...ORO_TEXTO, textShadow: '0 2px 16px rgba(0,0,0,.7)' }}>Un solo lugar.</div>
        <div style={{ fontSize: grande ? 15 : 13.5, color: '#e3e7ea', marginTop: 14, lineHeight: 1.5, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto', textShadow: '0 2px 10px rgba(0,0,0,.9)' }}>Sigue torneos en vivo, mira las estadísticas y descubre los mejores jugadores de cada zona.</div>
      </div>
    </div>
  )

  const CtaRegistro = () => (
    <div style={{ marginTop: 22, textAlign: 'center' }}>
      <button onClick={() => click('registro')} style={{ width: '100%', border: 'none', borderRadius: 14, padding: 15, background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Crea tu cuenta gratis</button>
      <div style={{ fontSize: 12, color: C.tenue, marginTop: 10 }}>Registrarte es gratis. ¿Quieres más beneficios? <span onClick={() => click('planes')} style={{ color: T.acento, fontWeight: 600, cursor: 'pointer' }}>Mira los planes</span></div>
    </div>
  )

  const Velo = () => (<>
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: T.veloGrad }} />
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 55% 40% at 42% 55%, ${T.glow}, transparent 70%)` }} />
  </>)

  const Modales = () => (
    <>
      {juegoAPublicar && (
        <SelectorPlantilla
          T={T} C={C}
          esEscritorio={esEscritorio}
          usuarioPago={false}
          onCancelar={() => setJuegoAPublicar(null)}
          onConfirmar={confirmarPublicarJuego}
        />
      )}
      {pubAbierta && (
        <DetallePublicacion
          pub={pubAbierta}
          T={T} C={C} ORO_TEXTO={ORO_TEXTO}
          haySesion={haySesion}
          esMia={miId && pubAbierta.autor_id === miId}
          onCerrar={() => setPubAbierta(null)}
          onPedirLogin={() => { setPubAbierta(null); click('entrar') }}
          onReaccionar={onReaccionar}
          miReaccion={misReacc[pubAbierta.id]}
          onBorrar={() => { onBorrarPublicacion(pubAbierta.id); setPubAbierta(null) }}
          onCambioComentarios={recargarTechado}
        />
      )}
      {verHistorialDia && (
        <div onClick={() => setVerHistorialDia(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(4,5,7,0.8)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: esEscritorio ? 'center' : 'flex-end', justifyContent: 'center', padding: esEscritorio ? 20 : 0 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', display: 'flex', flexDirection: 'column', borderRadius: esEscritorio ? 20 : '20px 20px 0 0', padding: 1.5, background: T.borde }}>
            <div style={{ borderRadius: esEscritorio ? 19 : '19px 19px 0 0', background: 'linear-gradient(180deg, #14161a, #0c0e12)', padding: '18px 16px 24px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#eef3f6' }}>🗓️ Historial de hoy</span>
                <span onClick={() => setVerHistorialDia(false)} style={{ fontSize: 24, color: '#9aa7b2', cursor: 'pointer', lineHeight: 1 }}>×</span>
              </div>
              <div style={{ fontSize: 12, color: '#9aa7b2', marginBottom: 16 }}>Los juegos que jugaste hoy. Se borran cada 24 horas.</div>
              {ListaHistorialDia()}
            </div>
          </div>
        </div>
      )}
    </>
  )

  // ===== VISTA ESCRITORIO / TABLET =====
  if (esEscritorio) {
    return (
      <div style={{ minHeight: '100vh', color: C.texto, fontFamily: C.font, position: 'relative', display: 'flex', flexDirection: 'column', background: T.fondo }}>
        <Velo />
        {/* barra superior fija del visitante */}
        {!haySesion && (
          <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: T.headerBg, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(200,132,46,0.18)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <svg viewBox="0 0 100 100" style={{ width: 30, height: 30 }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke={T.acento} strokeWidth="4" />
                <line x1="50" y1="6" x2="50" y2="94" stroke={T.acento} strokeWidth="4" />
                <line x1="6" y1="50" x2="94" y2="50" stroke={T.acento} strokeWidth="4" />
                <path d="M18 24 Q50 50 18 76" fill="none" stroke={T.acento} strokeWidth="4" />
                <path d="M82 24 Q50 50 82 76" fill="none" stroke={T.acento} strokeWidth="4" />
              </svg>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: T.textoFuerte, letterSpacing: 0.5 }}>MEDIA</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: T.acento, letterSpacing: 0.5 }}>CANCHA</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <BotonTema />
              <button onClick={() => click('entrar')} style={{ background: 'transparent', border: `1px solid ${T.esClaro ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.18)'}`, borderRadius: 11, padding: '9px 18px', color: C.texto, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Iniciar sesión</button>
              <button onClick={() => click('registro')} style={{ border: 'none', borderRadius: 11, padding: '9px 20px', background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>Crear cuenta gratis</button>
            </div>
          </div>
        )}
        {/* barra de miembro CON menú horizontal (fija arriba) */}
        {haySesion && miPerfil && (
          <div style={{ position: 'sticky', top: 0, zIndex: 15, padding: '14px 24px 0', background: T.headerBg, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
            <BarraMiembro />
          </div>
        )}
        {/* contenido: SOLO 2 columnas (Techado ancho + paneles) */}
        <main style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', padding: esTablet ? '16px 16px' : '18px 24px', gap: esTablet ? 16 : 22, alignItems: 'flex-start' }}>
          {/* TECHADO protagonista */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: haySesion ? 'calc(100vh - 150px)' : 'calc(100vh - 90px)', borderRadius: 16, padding: '16px 16px 6px', backgroundImage: `${T.panelWash}, url(${T.texturaImg})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid rgba(200,132,46,0.2)' }}>
            {!haySesion && <div style={{ flexShrink: 0 }}><Bienvenida grande /></div>}
            <div style={{ flexShrink: 0 }}>
              <div style={{ marginBottom: 12 }}><EnVivo /></div>
              <div style={{ marginBottom: 4 }}>
                <SecHead titulo="El Techado" icono="techado" accion={{ txt: 'Ver todo →', fn: () => click('techado') }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
              <ListaTechado />
            </div>
          </div>
          {/* paneles derecha */}
          <div style={{ width: esTablet ? 290 : 360, flexShrink: 0, position: 'sticky', top: haySesion ? 150 : 20, alignSelf: 'flex-start', borderRadius: 16, padding: esTablet ? '14px 12px' : '16px 14px', backgroundImage: `${T.panelWash}, url(${T.texturaImg})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid rgba(200,132,46,0.2)', maxHeight: haySesion ? 'calc(100vh - 170px)' : 'calc(100vh - 40px)', overflowY: 'auto' }}>
            <div style={{ marginBottom: 18 }}><SecHead titulo="Torneos populares" accion={{ txt: 'Ver todos →', fn: () => click('torneos') }} /><ListaTorneos /></div>
            <SecHead titulo="Ranking nacional" accion={{ txt: 'Ver todo →', fn: () => click('rankings') }} />
            <ListaRanking n={5} />
            <button onClick={() => click('rankings')} style={{ width: '100%', marginTop: 10, background: T.navActivoBg, border: `1px solid ${T.navActivoBorde}`, borderRadius: 12, padding: 11, color: T.acento, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Ver ranking completo →</button>
          </div>
        </main>
        {Modales()}
      </div>
    )
  }

  // ===== VISTA MÓVIL =====
  return (
    <div style={{ minHeight: '100vh', color: C.texto, fontFamily: C.font, position: 'relative', overflowX: 'hidden', background: T.fondo }}>
      <Velo />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '0 16px 90px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 2px 14px', position: 'relative' }}>
          <Logo chico />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BotonTema />
            <button onClick={() => setMenuAbierto(!menuAbierto)} style={{ background: T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(30,26,20,.7)', border: `1px solid ${T.navActivoBorde}`, color: T.acento, fontSize: 20, width: 40, height: 40, borderRadius: 11, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>☰</button>
          </div>
          {menuAbierto && (
            <div style={{ position: 'absolute', top: 60, right: 2, zIndex: 30, width: 230, background: T.esClaro ? 'rgba(248,243,233,.97)' : 'rgba(20,18,16,.95)', border: `1px solid ${T.navActivoBorde}`, borderRadius: 14, padding: 8, boxShadow: '0 10px 30px rgba(0,0,0,.6)', backdropFilter: 'blur(12px)' }}>
              {[...ACCIONES_CREAR, ...ACCIONES_MIAS, ...(haySesion ? [{ id: 'cerrarSesion', txt: '↩ Cerrar sesión' }] : [{ id: 'registro', txt: '✦ Crear mi cuenta gratis' }, { id: 'entrar', txt: '→ Iniciar sesión' }])].map((a) => (
                <button key={a.id} onClick={() => click(a.id)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: C.texto, fontSize: 14, fontWeight: 600, padding: '12px', borderRadius: 9, cursor: 'pointer' }}>{a.txt}</button>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginTop: 14 }}><BarraMiembro />{!haySesion && <Bienvenida />}</div>
        <div style={{ marginTop: 22 }}><EnVivo /></div>
        <div style={{ marginTop: 22 }}><SecHead titulo="Torneos populares" /><ListaTorneos /></div>
        <div style={{ marginTop: 22 }}><SecHead titulo="El Techado" icono="techado" accion={{ txt: 'Ver todo →', fn: () => click('techado') }} /><ListaTechado /></div>
        <div style={{ marginTop: 22 }}><SecHead titulo="Ranking nacional" accion={{ txt: 'Ver todo →', fn: () => click('rankings') }} /><ListaRanking n={5} /></div>
        {!haySesion && <CtaRegistro />}
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, display: 'flex', background: T.headerBg, backdropFilter: 'blur(12px)', borderTop: `1px solid ${T.navActivoBorde}`, padding: '9px 0 calc(9px + env(safe-area-inset-bottom))', zIndex: 40 }}>
        {NAV_PRINCIPAL.map((n) => (
          <button key={n.id} onClick={() => click(n.id)} style={{ flex: 1, background: 'transparent', border: 'none', textAlign: 'center', color: n.id === 'inicio' ? T.acento : C.tenue, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
            <div style={{ fontSize: 17, marginBottom: 3, display: 'flex', justifyContent: 'center' }}>{n.icono === 'techado' ? <IconoTechado size={17} cols={T.balon} /> : n.icono}</div>{n.txt}
          </button>
        ))}
      </div>
      {Modales()}
    </div>
  )
}

// ---- Componente de comentarios ----
function Comentarios({ pubId, haySesion, T, C, onPedirLogin, onCambio }) {
  const [lista, setLista] = useState([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)

  const cargar = async () => {
    const res = await leerComentarios(pubId)
    setLista(res.data || [])
    setCargando(false)
  }
  useEffect(() => { cargar() }, [pubId])

  const enviar = async () => {
    if (!haySesion) { onPedirLogin && onPedirLogin(); return }
    const limpio = texto.trim()
    if (!limpio) return
    setEnviando(true)
    const res = await comentar(pubId, limpio)
    if (!res.error) {
      setTexto('')
      await cargar()
      onCambio && onCambio()
    } else {
      alert(res.error)
    }
    setEnviando(false)
  }

  const inputStyle = { flex: 1, minWidth: 0, background: 'rgba(12,14,18,0.7)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '10px 12px', color: '#eef3f6', fontSize: 13.5, outline: 'none' }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)' }}>
      {cargando ? (
        <div style={{ fontSize: 12.5, color: C.tenue, textAlign: 'center', padding: '6px 0' }}>Cargando comentarios…</div>
      ) : (
        <>
          {lista.length === 0 && <div style={{ fontSize: 12.5, color: C.tenue, textAlign: 'center', padding: '4px 0 10px' }}>Sé el primero en comentar.</div>}
          {lista.map((c) => {
            const perf = c.perfiles || {}
            const nombre = perf.nombre ? `${perf.nombre}${perf.apellido ? ' ' + perf.apellido : ''}` : 'Usuario'
            return (
              <div key={c.id} style={{ display: 'flex', gap: 9, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: perf.foto_url ? `url(${perf.foto_url}) center/cover` : T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: T.avatarTexto, flexShrink: 0 }}>
                  {!perf.foto_url && nombre.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.texto }}>{nombre} <span style={{ fontSize: 10.5, fontWeight: 400, color: C.tenue }}>· {haceCuanto(c.creado_en)}</span></div>
                  <div style={{ fontSize: 13, color: '#c3ccd4', marginTop: 2, lineHeight: 1.4, wordBreak: 'break-word' }}>{c.texto}</div>
                </div>
              </div>
            )
          })}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') enviar() }} placeholder={haySesion ? 'Escribe un comentario…' : 'Inicia sesión para comentar'} maxLength={500} style={inputStyle} />
            <button onClick={enviar} disabled={enviando} style={{ border: 'none', borderRadius: 10, padding: '0 16px', background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>{enviando ? '…' : 'Enviar'}</button>
          </div>
        </>
      )}
    </div>
  )
}

// ---- Ventana de DETALLE ----
function DetallePublicacion({ pub, T, C, ORO_TEXTO, haySesion, esMia, onCerrar, onPedirLogin, onReaccionar, miReaccion, onBorrar, onCambioComentarios }) {
  const esEscritorio = typeof window !== 'undefined' && window.innerWidth >= 900
  let datos = pub.datos || {}
  if (typeof datos === 'string') { try { datos = JSON.parse(datos) } catch (e) { datos = {} } }
  const esJuego = pub.tipo === 'juego_rapido' && datos.jugadores
  const plantDetalle = plantillaPorId(datos.plantilla || PLANTILLA_DEFAULT)
  const imgFondo = plantDetalle && plantDetalle.img
  const jugA = (datos.jugadores || []).filter((j) => j.equipo === 0).sort((a, b) => (b.pts || 0) - (a.pts || 0))
  const jugB = (datos.jugadores || []).filter((j) => j.equipo === 1).sort((a, b) => (b.pts || 0) - (a.pts || 0))
  const ganoA = !datos.hayEmpate && (datos.totalA || 0) > (datos.totalB || 0)
  const ganoB = !datos.hayEmpate && (datos.totalB || 0) > (datos.totalA || 0)

  const TablaEquipo = ({ nombre, total, jugadores, gano }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: gano ? T.acento : C.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}{gano ? ' 🏆' : ''}</span>
        <span style={{ fontSize: 18, fontWeight: 800, color: gano ? '#fff' : C.tenue }}>{total}</span>
      </div>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)' }}>
        {jugadores.map((j, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 9px', background: i % 2 ? 'rgba(255,255,255,.02)' : 'transparent', borderBottom: i < jugadores.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
            <span style={{ fontSize: 12.5, color: C.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>{j.nombre}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.acento }}>{j.pts || 0}</span>
          </div>
        ))}
        {jugadores.length === 0 && <div style={{ fontSize: 11, color: C.tenue, padding: '7px 9px' }}>—</div>}
      </div>
    </div>
  )

  return (
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(4,5,7,0.82)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: esEscritorio ? 'center' : 'flex-end', justifyContent: 'center', padding: esEscritorio ? 20 : 0 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: esEscritorio ? '88vh' : '92vh', display: 'flex', flexDirection: 'column', borderRadius: esEscritorio ? 20 : '20px 20px 0 0', padding: 1.5, background: T.borde }}>
        <div style={{ borderRadius: esEscritorio ? 19 : '19px 19px 0 0', background: 'linear-gradient(180deg, #14161a, #0c0e12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ position: 'relative', minHeight: imgFondo ? 175 : 'auto', padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: imgFondo ? `linear-gradient(180deg, rgba(8,9,12,.35) 0%, rgba(8,9,12,.6) 55%, rgba(20,22,26,.96) 100%), url(${imgFondo}) center/cover` : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, position: imgFondo ? 'absolute' : 'static', top: 14, left: 16, right: 16, marginBottom: imgFondo ? 0 : 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: pub.autor_foto ? `url(${pub.autor_foto}) center/cover` : T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: T.avatarTexto, flexShrink: 0, border: imgFondo ? '1.5px solid rgba(255,255,255,.35)' : 'none' }}>
                {!pub.autor_foto && ((pub.autor_nombre || '?').slice(0, 1).toUpperCase())}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: imgFondo ? '#fff' : C.texto, textShadow: imgFondo ? '0 1px 4px rgba(0,0,0,.8)' : 'none' }}>{pub.autor_nombre || 'Usuario'}{pub.autor_apellido ? ` ${pub.autor_apellido}` : ''}</div>
                <div style={{ fontSize: 11, color: imgFondo ? 'rgba(255,255,255,.8)' : C.tenue, textShadow: imgFondo ? '0 1px 4px rgba(0,0,0,.8)' : 'none' }}>{haceCuanto(pub.creado_en)}</div>
              </div>
              {esMia && <span onClick={onBorrar} title="Eliminar" style={{ fontSize: 17, color: imgFondo ? '#fff' : C.tenue, cursor: 'pointer', padding: '2px 6px' }}>🗑️</span>}
              <span onClick={onCerrar} style={{ fontSize: 24, color: imgFondo ? '#fff' : C.tenue, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>×</span>
            </div>
            <div style={{ position: 'relative', fontSize: 19, fontWeight: 800, color: '#f4f7f9', lineHeight: 1.2, textShadow: imgFondo ? '0 1px 6px rgba(0,0,0,.9)' : 'none' }}>{pub.titulo}</div>
          </div>

          <div style={{ overflowY: 'auto', padding: '14px 16px 20px' }}>
            {esJuego ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '14px 0', marginBottom: 8 }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: ganoA ? T.acento : C.tenue, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{datos.nombreA}{ganoA ? ' 🏆' : ''}</div>
                    <div style={{ fontSize: 44, fontWeight: 800, color: ganoA ? '#fff' : C.tenue, lineHeight: 1 }}>{datos.totalA}</div>
                  </div>
                  <div style={{ fontSize: 16, color: C.tenue }}>—</div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: ganoB ? T.acento : C.tenue, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{datos.nombreB}{ganoB ? ' 🏆' : ''}</div>
                    <div style={{ fontSize: 44, fontWeight: 800, color: ganoB ? '#fff' : C.tenue, lineHeight: 1 }}>{datos.totalB}</div>
                  </div>
                </div>
                {datos.narracion && (
                  <div style={{ fontSize: 13.5, color: '#d4dbe1', lineHeight: 1.6, padding: '12px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 12, borderLeft: `3px solid ${T.acento}`, marginBottom: 16 }}>
                    {datos.narracion}
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, color: C.tenue, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Jugadores · puntos</div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                  <TablaEquipo nombre={datos.nombreA} total={datos.totalA} jugadores={jugA} gano={ganoA} />
                  <TablaEquipo nombre={datos.nombreB} total={datos.totalB} jugadores={jugB} gano={ganoB} />
                </div>
              </>
            ) : (
              pub.texto && <div style={{ fontSize: 14.5, color: '#d4dbe1', lineHeight: 1.6, marginBottom: 16 }}>{pub.texto}</div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 14 }}>
              <div onClick={() => onReaccionar(pub.id, 'like')} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: miReaccion === 'like' ? T.acento : C.tenue, fontSize: 14, fontWeight: 700 }}>
                <span style={{ fontSize: 17 }}>♥</span> {pub.likes || 0}
              </div>
              <div onClick={() => onReaccionar(pub.id, 'dislike')} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: miReaccion === 'dislike' ? '#e0563f' : C.tenue, fontSize: 14, fontWeight: 700 }}>
                <span style={{ fontSize: 17 }}>👎</span> {pub.dislikes || 0}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.tenue, fontSize: 14, fontWeight: 700 }}>
                <span style={{ fontSize: 17 }}>💬</span> {pub.num_comentarios || 0}
              </div>
            </div>

            <Comentarios pubId={pub.id} haySesion={haySesion} T={T} C={C} onPedirLogin={onPedirLogin} onCambio={onCambioComentarios} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Selector de plantilla ----
function SelectorPlantilla({ T, C, esEscritorio, usuarioPago, onCancelar, onConfirmar }) {
  const [elegida, setElegida] = useState(PLANTILLA_DEFAULT)
  const [texto, setTexto] = useState('')
  const plantSel = PLANTILLAS.find((p) => p.id === elegida)

  const elegir = (p) => {
    if (puedeUsar(p, usuarioPago)) setElegida(p.id)
    else alert('Esta plantilla es premium. Desbloquéala con cualquier forma de pago para usar las 15.')
  }

  return (
    <div onClick={onCancelar} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(4,5,7,0.85)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: esEscritorio ? 'center' : 'flex-end', justifyContent: 'center', padding: esEscritorio ? 20 : 0 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: esEscritorio ? 20 : '20px 20px 0 0', padding: 1.5, background: T.borde }}>
        <div style={{ borderRadius: esEscritorio ? 19 : '19px 19px 0 0', background: 'linear-gradient(180deg, #14161a, #0c0e12)', padding: '18px 16px 20px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#eef3f6' }}>Elige el fondo</span>
            <span onClick={onCancelar} style={{ fontSize: 24, color: C.tenue, cursor: 'pointer', lineHeight: 1 }}>×</span>
          </div>
          <div style={{ fontSize: 12, color: C.tenue, marginBottom: 14 }}>Toca una plantilla para tu publicación.</div>

          {plantSel && plantSel.img && (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 14, height: 120, background: `linear-gradient(180deg, rgba(8,9,12,.25) 0%, rgba(8,9,12,.85) 100%), url(${plantSel.img}) center/cover`, display: 'flex', alignItems: 'flex-end', padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textShadow: '0 1px 5px rgba(0,0,0,.9)' }}>{texto.trim() ? texto : 'Vista previa del fondo'}</div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {PLANTILLAS.map((p) => {
              const disponible = puedeUsar(p, usuarioPago)
              const seleccionada = elegida === p.id
              return (
                <div key={p.id} onClick={() => elegir(p)} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '3/4', cursor: 'pointer', border: seleccionada ? `2px solid ${T.acento}` : '2px solid transparent', background: p.img ? `url(${p.img}) center/cover` : 'linear-gradient(150deg,#23262c,#15171b)', opacity: disponible ? 1 : 0.85 }}>
                  {!p.img && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: C.tenue, textAlign: 'center', padding: 4 }}>{p.nombre}</div>}
                  {!disponible && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,5,7,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔒</div>
                  )}
                  {seleccionada && (
                    <div style={{ position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: T.acento, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#1a1205', fontWeight: 800 }}>✓</div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ fontSize: 11, color: C.tenue, textAlign: 'center', marginBottom: 14 }}>🔒 Las premium se desbloquean todas con cualquier forma de pago.</div>

          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.tenue, marginBottom: 6 }}>Agrega un comentario (opcional)</div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, 200))}
            placeholder="Escribe algo sobre el juego…"
            rows={2}
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(12,14,18,0.7)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '10px 12px', color: '#eef3f6', fontSize: 13.5, outline: 'none', resize: 'none', marginBottom: 16, fontFamily: 'inherit' }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancelar} style={{ flex: 1, borderRadius: 12, padding: 13, background: 'transparent', border: '1px solid rgba(255,255,255,.14)', color: C.tenue, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={() => onConfirmar(elegida, texto.trim())} style={{ flex: 2, borderRadius: 12, padding: 13, background: T.boton, border: 'none', color: '#1a1205', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>↗ Publicar</button>
          </div>
        </div>
      </div>
    </div>
  )
}