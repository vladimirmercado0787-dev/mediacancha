import { useState, useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'
import fondoCancha from '../assets/fondo-cancha.png'
import plAroAtardecer from '../assets/plantillas/plantilla_aro_atardecer.png'
import plBalonDorado from '../assets/plantillas/plantilla_balon_dorado.png'
import plCanchaBarrioNoche from '../assets/plantillas/plantilla_cancha_barrio_noche.png'
import plCanchaMadera from '../assets/plantillas/plantilla_cancha_madera.png'
import plMonumentoSantiago from '../assets/plantillas/plantilla_monumento_santiago.png'

// Mapa de plantillas de fondo (el identificador guardado → la imagen)
const FONDOS_PUB = {
  balon_dorado: plBalonDorado,
  aro_atardecer: plAroAtardecer,
  cancha_barrio_noche: plCanchaBarrioNoche,
  cancha_madera: plCanchaMadera,
  monumento_santiago: plMonumentoSantiago,
}

// Resalta @menciones y #hashtags dentro de un texto. Devuelve un arreglo de
// fragmentos (texto normal + spans dorados tocables). onTag recibe ('@'|'#', valor).
function resaltarTexto(texto, colorAcento, onTag) {
  if (!texto) return null
  const partes = []
  const regex = /([@#][\wáéíóúñ]+)/gi
  let ultimo = 0
  let m
  let k = 0
  while ((m = regex.exec(texto)) !== null) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index))
    const token = m[0]
    const tipo = token[0]
    const valor = token.slice(1)
    partes.push(
      <span
        key={`t${k++}`}
        onClick={onTag ? (e) => { e.stopPropagation(); onTag(tipo, valor) } : undefined}
        style={{ color: colorAcento, fontWeight: 700, cursor: onTag ? 'pointer' : 'default' }}
      >{token}</span>
    )
    ultimo = m.index + token.length
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo))
  return partes
}
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
import TarjetaResultado from './TarjetaResultado'
import { supabase } from '../supabaseClient'
import { alternarSeguir, idsQueSigo, statsSociales } from '../social'
import { contarNoLeidos } from '../mensajes'
import BottomSheet from './BottomSheet'

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
  navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)',
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
    navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)',
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
    navDorada: 'linear-gradient(180deg,#6ac0d8,#2a8fb8 55%,#1a6a8a)',
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

// Juegos en vivo (ejemplo; luego se conecta a datos reales)
const JUEGOS_VIVO = [
  { torneo: 'Copa Jícome', a: 'Águilas', b: 'Leones', sa: 48, sb: 43, ca: '#c4823a', cb: '#39abdc', q: '3er', t: '06:21' },
  { torneo: 'Liga Superior Mao', a: 'Tigres', b: 'Huracán', sa: 31, sb: 38, ca: '#2c7a4f', cb: '#9e3a3a', q: '2do', t: '02:10' },
  { torneo: 'Fogueo', a: 'Real C.', b: 'San José', sa: 22, sb: 19, ca: '#8a5cc4', cb: '#3a8a9e', q: '1er', t: '04:55' },
]

// Menú principal: visibles en la fila horizontal (computadora)
const NAV_PRINCIPAL = [
  { id: 'inicio', txt: 'Inicio', icono: '⌂' },
  { id: 'perfil', txt: 'Mi Perfil', icono: '◉' },
  { id: 'techado', txt: 'El Techado', icono: 'techado' },
  { id: 'buscar', txt: 'Buscar', icono: '🔍' },
  { id: 'torneos', txt: 'Torneos', icono: '🏆' },
  { id: 'rankings', txt: 'Rankings', icono: '★' },
  { id: 'mapa', txt: 'Mapa', icono: '🗺️' },
  { id: 'misTorneos', txt: 'Mis torneos', icono: '🏆' },
  { id: 'misLigas', txt: 'Mis ligas', icono: '🤝' },
]
// Lo que queda en "Más ▾" (vacío: ya todo está en la barra)
const NAV_MAS = []
// Menú completo para el móvil (barra inferior + menú ☰)
const NAV = [
  { id: 'inicio', txt: 'Inicio', icono: '⌂' },
  { id: 'perfil', txt: 'Mi Perfil', icono: '◉' },
  { id: 'techado', txt: 'El Techado', icono: 'techado' },
  { id: 'buscar', txt: 'Buscar personas', icono: '🔍' },
  { id: 'torneos', txt: 'Torneos', icono: '🏆' },
  { id: 'rankings', txt: 'Rankings', icono: '★' },
  { id: 'mapa', txt: 'Mapa del baloncesto', icono: '🗺️' },
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
  const [bq, setBq] = useState('')
  const [bResultados, setBResultados] = useState([])
  const [bCargando, setBCargando] = useState(false)
  const [bSiguiendo, setBSiguiendo] = useState([])
  const [bProcesando, setBProcesando] = useState(null)
  const [noLeidos, setNoLeidos] = useState(0)
  const [anotarAbierto, setAnotarAbierto] = useState(false)
  const [statsSoc, setStatsSoc] = useState({ seguidores: 0, siguiendo: 0 })
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [torneosAbierto, setTorneosAbierto] = useState(false)
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
  const [comentariosDe, setComentariosDe] = useState(null)
  const [juegoAPublicar, setJuegoAPublicar] = useState(null)
  const [textoComposer, setTextoComposer] = useState('')
  const [fondoComposer, setFondoComposer] = useState(0)
  const [publicandoTexto, setPublicandoTexto] = useState(false)
  const [composerAbierto, setComposerAbierto] = useState(false)

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

  // Tocar una @mención o #hashtag en una publicación.
  // Por ahora: pone el término en el buscador del Techado (la navegación
  // dedicada a perfil/hashtag llega en la próxima capa).
  const onTagPub = (tipo, valor) => {
    setPubAbierta(null)
    setComentariosDe(null)
    setBq(valor)
    try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch (e) { window.scrollTo(0, 0) }
  }

  useEffect(() => {
    setJuegosDia(leerHistorialDia())
    recargarTechado()
    miUsuarioId().then((id) => setMiId(id))
    if (haySesion) miPerfilCompleto().then((p) => setMiPerfil(p))
  }, [])

  // Cerrar los menús desplegables al hacer clic fuera
  useEffect(() => {
    if (!masAbierto && !crearAbierto && !torneosAbierto) return
    const cerrar = () => { setMasAbierto(false); setCrearAbierto(false); setTorneosAbierto(false) }
    window.addEventListener('click', cerrar)
    return () => window.removeEventListener('click', cerrar)
  }, [masAbierto, crearAbierto, torneosAbierto])

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

  const enviarPublicacionTexto = async () => {
    const txt = textoComposer.trim()
    if (!txt || publicandoTexto) return
    setPublicandoTexto(true)
    try {
      const { publicarTexto } = await import('../techado')
      // Mapeo del índice de plantilla al identificador que se guarda
      const NOMBRES_FONDO = [null, 'balon_dorado', 'aro_atardecer', 'cancha_barrio_noche', 'cancha_madera', 'monumento_santiago']
      const fondoElegido = fondoComposer > 0 ? NOMBRES_FONDO[fondoComposer] : null
      const res = await publicarTexto({ texto: txt, fondo: fondoElegido })
      if (res.error) {
        alert('No se pudo publicar: ' + res.error)
      } else {
        setTextoComposer('')
        setFondoComposer(0)
        setComposerAbierto(false)
        await recargarTechado()
      }
    } catch (e) {
      alert('Error al publicar: ' + (e.message || e))
    }
    setPublicandoTexto(false)
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

  // ===== Buscador inline (en el Techado) =====
  useEffect(() => {
    if (bq.trim().length < 2) { setBResultados([]); return }
    const t = setTimeout(async () => {
      setBCargando(true)
      const termino = bq.trim()
      const { data, error } = await supabase
        .from('perfiles')
        .select('id, nombre, apellido, codigo_unico, foto_url, municipio')
        .or(`nombre.ilike.%${termino}%,apellido.ilike.%${termino}%,codigo_unico.ilike.%${termino}%`)
        .limit(8)
      if (!error && data) setBResultados(data.filter((p) => p.id !== miId))
      setBCargando(false)
    }, 300)
    return () => clearTimeout(t)
  }, [bq, miId])

  useEffect(() => { (async () => { if (haySesion) setBSiguiendo(await idsQueSigo()) })() }, [haySesion])

  // contadores sociales reales para el MiniPerfil
  useEffect(() => {
    if (!haySesion || !miId) return
    statsSociales(miId).then((s) => setStatsSoc({ seguidores: s.seguidores, siguiendo: s.siguiendo }))
  }, [haySesion, miId])

  // conteo de mensajes no leídos (badge) + realtime
  useEffect(() => {
    if (!haySesion || !miId) return
    const refrescar = async () => setNoLeidos(await contarNoLeidos())
    refrescar()
    const canal = supabase
      .channel('inbox-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes', filter: `para_id=eq.${miId}` }, refrescar)
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [haySesion, miId])

  const bSeguir = async (persona) => {
    if (!haySesion) { click('entrar'); return }
    setBProcesando(persona.id)
    const r = await alternarSeguir(persona.id)
    if (!r.error) setBSiguiendo((prev) => r.siguiendo ? [...prev, persona.id] : prev.filter((x) => x !== persona.id))
    setBProcesando(null)
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
    const posicion = (p.posiciones && p.posiciones[0]) || null
    return (
      <div style={{ position: 'relative', borderRadius: 16, cursor: 'default', border: T.esClaro ? '1px solid #34291a' : `1px solid ${T.navActivoBorde}`, backgroundImage: `url(${T.barraImg})`, backgroundSize: 'cover', backgroundPosition: 'center right', boxShadow: T.esClaro ? '0 12px 34px rgba(18,14,8,.22)' : '0 12px 34px rgba(0,0,0,.4)' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: T.scrimCarnet }} />
        {/* costura dorada punteada (efecto credencial) */}
        <div style={{ position: 'absolute', inset: 9, borderRadius: 9, border: `1.5px dashed ${T.esClaro ? 'rgba(234,182,79,.45)' : 'rgba(234,182,79,.32)'}`, pointerEvents: 'none', zIndex: 1 }} />
        <div onClick={() => click('perfil')} style={{ position: 'relative', zIndex: 2, padding: '15px 18px 13px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
          {/* foto protagonista con aro dorado */}
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: p.foto_url ? `url(${p.foto_url}) center/cover` : T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: T.avatarTexto, flexShrink: 0, boxShadow: `0 0 0 2px ${T.esClaro ? '#15110b' : '#0c0e12'}, 0 0 0 4px ${T.acento}` }}>
            {!p.foto_url && iniciales}
          </div>
          {/* nombre + datos */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', lineHeight: 1.05, textShadow: '0 1px 6px rgba(0,0,0,.7)', letterSpacing: 0.3, textTransform: 'uppercase' }}>{nombre}</div>
            <div style={{ fontSize: 11.5, color: '#cdb98e', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {posicion && <span>{posicion}</span>}
              <span onClick={(e) => { e.stopPropagation(); copiarMiMC() }} style={{ fontSize: 10, fontWeight: 700, color: '#1c160d', background: T.boton, padding: '2px 8px', borderRadius: 6, fontFamily: 'monospace', letterSpacing: 1, cursor: 'pointer' }}>{copiadoMC ? '✓ copiado' : (p.codigo_unico || 'MC------')}</span>
            </div>
          </div>
          {/* marca MEDIA CANCHA */}
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 0.95, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              <span style={{ color: '#dfe2e6' }}>MEDIA</span><br />
              <span style={ORO_TEXTO}>CANCHA</span>
            </div>
            <span style={{ display: 'inline-block', marginTop: 5, fontSize: 8.5, letterSpacing: 1.5, color: '#1c160d', background: T.boton, padding: '2px 8px', borderRadius: 12, fontWeight: 800, textTransform: 'uppercase' }}>{esJugador ? 'Jugador' : 'Fanático'}</span>
          </div>
          {/* selector de tema */}
          <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}><BotonTema /></div>
        </div>
        {/* fila de stats oficiales (solo jugador) */}
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
        {/* NAV DORADA integrada (estilo credencial) */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 2, padding: '5px 8px', background: T.navDorada, borderRadius: '0 0 16px 16px', flexWrap: 'wrap', boxShadow: '0 8px 22px rgba(156,101,24,.18)' }}>
          {NAV_PRINCIPAL.map((n) => {
            const activo = n.id === 'inicio'
            if (n.id === 'torneos') {
              return (
                <div key={n.id} style={{ position: 'relative' }}>
                  <button onClick={(e) => { e.stopPropagation(); setTorneosAbierto((v) => !v); setMasAbierto(false); setCrearAbierto(false) }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: torneosAbierto ? 'linear-gradient(180deg,#1f1810,#120d07)' : 'transparent', color: torneosAbierto ? T.acento : '#3a2a10', fontSize: 12, fontWeight: 700, padding: '8px 13px', borderRadius: 9, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap', border: 'none', transition: 'all .15s ease' }}>
                    <span style={{ fontSize: 14 }}>{n.icono}</span>{n.txt} <span style={{ fontSize: 10 }}>{torneosAbierto ? '▴' : '▾'}</span>
                  </button>
                  {torneosAbierto && (
                    <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: 230, background: T.esClaro ? 'rgba(252,250,245,.99)' : 'rgba(18,20,24,.98)', border: `1px solid ${T.navActivoBorde}`, borderRadius: 12, padding: 7, zIndex: 200, backdropFilter: 'blur(12px)', boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>
                      {[
                        { id: 'crearTorneo', icono: '＋', txt: 'Crear torneo', desc: 'Arma uno nuevo' },
                        { id: 'misTorneos', icono: '🏆', txt: 'Mis torneos', desc: 'Los que organizas' },
                        { id: 'dondeJuego', icono: '👥', txt: 'Donde juego', desc: 'Como jugador' },
                        { id: 'torneos', icono: '🌐', txt: 'Explorar torneos', desc: 'Todos los públicos' },
                      ].map((o) => (
                        <button key={o.id} onClick={() => { setTorneosAbierto(false); click(o.id) }} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: C.texto, fontSize: 13, fontWeight: 600, padding: '10px 11px', borderRadius: 8, cursor: 'pointer' }}>
                          <span style={{ fontSize: 16, color: T.acento, width: 20, textAlign: 'center' }}>{o.icono}</span>
                          <span style={{ flex: 1 }}>{o.txt}<div style={{ fontSize: 11, color: T.tenue, fontWeight: 400 }}>{o.desc}</div></span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            return (
              <button key={n.id} onClick={() => click(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: activo ? 'linear-gradient(180deg,#1f1810,#120d07)' : 'transparent', color: activo ? T.acento : '#3a2a10', fontSize: 12, fontWeight: 700, padding: '8px 13px', borderRadius: 9, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap', border: 'none', transition: 'all .15s ease' }}>
                <span style={{ fontSize: 14, display: 'inline-flex' }}>{n.icono === 'techado' ? <IconoTechado size={14} cols={activo ? T.balon : ['#3a2a10', '#3a2a10', '#3a2a10']} /> : n.icono}</span>{n.txt}
              </button>
            )
          })}
          {/* Armar juego (acción estrella) */}
          <button onClick={() => setAnotarAbierto(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'linear-gradient(180deg,#1f1810,#120d07)', border: 'none', color: T.acento, fontSize: 12, fontWeight: 800, padding: '8px 13px', borderRadius: 9, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap', marginLeft: 4 }}>
            ⚡ Armar juego
          </button>
          {/* mensajes con badge — ícono globo + balón */}
          <button onClick={() => click('mensajes')} title="Mensajes" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#3a2a10', fontSize: 15, padding: '8px 9px', borderRadius: 9, cursor: 'pointer' }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
              <path d="M4 5.5C4 4.7 4.7 4 5.5 4h13C19.3 4 20 4.7 20 5.5v8c0 .8-.7 1.5-1.5 1.5H9l-4 3.5v-3.5H5.5C4.7 15 4 14.3 4 13.5v-8Z" stroke="#3a2a10" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
              <circle cx="12" cy="9.3" r="3" stroke="#3a2a10" strokeWidth="1.4" />
              <path d="M9 9.3h6M12 6.3v6M9.9 7.2c.9.9 1.3 2.8.6 4.2M14.1 7.2c-.9.9-1.3 2.8-.6 4.2" stroke="#3a2a10" strokeWidth="1" strokeLinecap="round" />
            </svg>
            {noLeidos > 0 && <span style={{ position: 'absolute', top: 1, right: 1, minWidth: 16, height: 16, borderRadius: 8, background: '#e0563f', color: '#fff', fontSize: 9.5, fontWeight: 800, display: 'grid', placeItems: 'center', padding: '0 4px', border: '1.5px solid #c8842e' }}>{noLeidos > 9 ? '9+' : noLeidos}</span>}
          </button>
          {/* tuerca config */}
          <button onClick={() => click('configuracion')} title="Configuración" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#3a2a10', fontSize: 15, padding: '8px 9px', borderRadius: 9, cursor: 'pointer' }}>
            ⚙️
          </button>
          {/* Más ▾ */}
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <button onClick={(e) => { e.stopPropagation(); setMasAbierto((v) => !v); setCrearAbierto(false) }} style={{ display: 'flex', alignItems: 'center', gap: 5, background: masAbierto ? 'linear-gradient(180deg,#1f1810,#120d07)' : 'transparent', border: 'none', color: masAbierto ? T.acento : '#3a2a10', fontSize: 12, fontWeight: 700, padding: '8px 13px', borderRadius: 9, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Más <span style={{ fontSize: 10 }}>{masAbierto ? '▴' : '▾'}</span>
            </button>
            {masAbierto && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 200, background: T.esClaro ? 'rgba(252,250,245,.99)' : 'rgba(18,20,24,.98)', border: `1px solid ${T.navActivoBorde}`, borderRadius: 12, padding: 7, zIndex: 200, backdropFilter: 'blur(12px)', boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>
                {NAV_MAS.map((n) => (
                  <button key={n.id} onClick={() => click(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: C.texto, fontSize: 13, fontWeight: 600, padding: '9px 11px', borderRadius: 8, cursor: 'pointer' }}>
                    <span style={{ fontSize: 15, color: T.acento }}>{n.icono}</span>{n.txt}
                  </button>
                ))}
                <div style={{ height: 1, background: T.esClaro ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.08)', margin: '6px 4px' }} />
                <div style={{ fontSize: 9.5, fontWeight: 800, color: T.tenue, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 11px 6px' }}>Crear</div>
                {CREAR_DROPDOWN.map((a) => (
                  <button key={a.id} onClick={() => click(a.id)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: C.texto, fontSize: 13, fontWeight: 600, padding: '8px 11px', borderRadius: 8, cursor: 'pointer' }}>{a.txt}</button>
                ))}
                <div style={{ fontSize: 9.5, fontWeight: 800, color: T.tenue, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 11px 6px' }}>Lo mío</div>
                {ACCIONES_MIAS.map((a) => (
                  <button key={a.id} onClick={() => click(a.id)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: C.texto, fontSize: 13, fontWeight: 600, padding: '8px 11px', borderRadius: 8, cursor: 'pointer' }}>{a.txt}</button>
                ))}
                {haySesion && (
                  <>
                    <div style={{ height: 1, background: T.esClaro ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.08)', margin: '6px 4px' }} />
                    <button onClick={() => click('cerrarSesion')} style={{ display: 'block', width: '100%', textAlign: 'left', background: T.esClaro ? 'rgba(224,86,63,.08)' : 'rgba(224,86,63,.12)', border: '1px solid rgba(224,86,63,.3)', color: '#e0563f', fontSize: 13, fontWeight: 700, padding: '10px 11px', borderRadius: 9, cursor: 'pointer' }}>↩ Cerrar sesión</button>
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
      display: 'flex', alignItems: 'center', gap: 7, background: T.esClaro ? '#ffffff' : 'rgba(20,18,16,.7)', border: `1px solid ${T.navActivoBorde}`,
      color: T.acento, fontSize: 11.5, fontWeight: 700, padding: '7px 11px', borderRadius: 10, cursor: 'pointer',
      boxShadow: T.esClaro ? '0 2px 10px rgba(60,40,8,.16)' : 'none',
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

  const tarjetaVivo = (g, i, ancho) => (
    <div key={i} onClick={() => click('resultados')} style={{ flexShrink: 0, width: ancho, borderRadius: 15, padding: '11px 12px', cursor: 'pointer', position: 'relative', background: T.esClaro ? 'rgba(255,253,248,.92)' : 'linear-gradient(160deg, rgba(46,36,22,.9), rgba(16,12,7,.94))', border: `1px solid ${T.navActivoBorde}`, boxShadow: T.esClaro ? '0 4px 14px rgba(120,90,30,.1)' : '0 6px 18px rgba(0,0,0,.3)' }}>
      <span style={{ position: 'absolute', top: 9, right: 10, fontSize: 7.5, fontWeight: 900, color: '#ff5640' }}>● EN VIVO</span>
      <div style={{ fontSize: 8.5, color: C.tenue, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{g.torneo}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5, gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.texto, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}><span style={{ width: 18, height: 18, borderRadius: 5, background: g.ca, fontSize: 8, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{g.a.slice(0, 2).toUpperCase()}</span><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.a}</span></span>
        <span style={{ fontSize: 18, fontWeight: 900, color: g.sa >= g.sb ? T.acento : T.textoFuerte }}>{g.sa}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.texto, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}><span style={{ width: 18, height: 18, borderRadius: 5, background: g.cb, fontSize: 8, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{g.b.slice(0, 2).toUpperCase()}</span><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.b}</span></span>
        <span style={{ fontSize: 18, fontWeight: 900, color: g.sb > g.sa ? T.acento : T.textoFuerte }}>{g.sb}</span>
      </div>
      <div style={{ marginTop: 7, fontSize: 10, color: T.acento, fontWeight: 700 }}>{g.q} · {g.t} ›</div>
    </div>
  )

  const EnVivo = () => (
    <div>
      <style>{`@keyframes mcpulse{50%{opacity:.35;transform:scale(.8)}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 2px 11px' }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5640', animation: 'mcpulse 1.1s infinite' }} />
        <span style={{ fontSize: 12.5, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: T.textoFuerte }}><span style={{ color: '#ff5640' }}>EN VIVO</span> · {JUEGOS_VIVO.length} juegos ahora</span>
        <span onClick={() => click('resultados')} style={{ marginLeft: 'auto', fontSize: 11, color: C.tenue, fontWeight: 700, cursor: 'pointer' }}>Ver todos →</span>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {JUEGOS_VIVO.map((g, i) => tarjetaVivo(g, i, 200))}
      </div>
    </div>
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

  // color de avatar consistente según el nombre (como el mockup)
  const avatarColor = (semilla) => {
    const paleta = [
      'linear-gradient(150deg,#3a6ea5,#23415f)', 'linear-gradient(150deg,#9e3a3a,#5f2323)',
      'linear-gradient(150deg,#3a9e6e,#235f43)', 'linear-gradient(150deg,#8a5cc4,#4f3275)',
      'linear-gradient(150deg,#c4823a,#754d1f)', 'linear-gradient(150deg,#3a8a9e,#23545f)',
    ]
    let h = 0
    const s = String(semilla)
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % paleta.length
    return paleta[Math.abs(h)]
  }
  // estilo de cada botón de la barra de acciones (me gusta, no me gusta, comentar, compartir)
  const accionBtn = (color) => ({
    flex: 1, border: 'none', background: 'transparent', borderRadius: 9, padding: esEscritorio ? '11px 8px' : '9px 6px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: esEscritorio ? 14 : 12.5, fontWeight: 700, color,
  })

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
      <>
      <style>{`
        @keyframes mcPostGlow {
          0%, 100% { box-shadow: 0 1px 2px rgba(20,24,30,.04), 0 8px 24px rgba(20,24,30,.06); }
          50% { box-shadow: 0 1px 2px rgba(20,24,30,.04), 0 8px 26px rgba(20,24,30,.08), 0 0 18px var(--mc-glow); }
        }
        .mc-post-card { animation: mcPostGlow 3.4s ease-in-out infinite; transition: transform .2s ease; }
        .mc-post-card:hover { transform: translateY(-2px); }
        @keyframes mcShineMove {
          0% { opacity: 0; transform: translateX(-25%); }
          35% { opacity: .9; }
          65% { opacity: .9; }
          100% { opacity: 0; transform: translateX(25%); }
        }
        .mc-post-shine { animation: mcShineMove 4.5s ease-in-out infinite; }
      `}</style>
      {publicaciones.map((p) => {
        let datos = p.datos || {}
        if (typeof datos === 'string') { try { datos = JSON.parse(datos) } catch (e) { datos = {} } }
        // ¿Es una publicación de RESULTADO de juego? → tarjeta profesional compartida
        const esJuego = datos && datos.nombreA && datos.nombreB && (datos.totalA != null || (datos.jugadores && datos.jugadores.length))
        if (esJuego) {
          const fuenteJuego = datos.fuente || (p.tipo === 'torneo' ? 'torneo' : p.tipo === 'liga' ? 'liga' : 'rapido')
          const esMio = miId && p.autor_id === miId
          const barraReacciones = (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 8px', borderTop: `1px solid ${T.esClaro ? '#eceef1' : 'rgba(255,255,255,.07)'}` }}>
              <button onClick={() => onReaccionar(p.id, 'like')} style={accionBtn(misReacc[p.id] === 'like' ? T.acento : (T.esClaro ? '#565c66' : '#aeb6c0'))}><span style={{ fontSize: 16 }}>{misReacc[p.id] === 'like' ? '❤️' : '🤍'}</span> {p.likes || 0}</button>
              <button onClick={() => onReaccionar(p.id, 'dislike')} style={accionBtn(misReacc[p.id] === 'dislike' ? '#e0563f' : (T.esClaro ? '#565c66' : '#aeb6c0'))}><span style={{ fontSize: 15 }}>👎</span> {p.dislikes || 0}</button>
              <button onClick={() => setComentariosDe(p)} style={accionBtn(T.esClaro ? '#565c66' : '#aeb6c0')}><span style={{ fontSize: 15 }}>💬</span> {p.num_comentarios || 0}</button>
              <button onClick={() => setPubAbierta(p)} style={accionBtn(T.esClaro ? '#565c66' : '#aeb6c0')}><span style={{ fontSize: 14 }}>↗</span> Compartir</button>
              {esMio && <button onClick={() => onBorrarPublicacion(p.id)} title="Eliminar de la pantalla principal" style={accionBtn('#e0563f')}><span style={{ fontSize: 15 }}>🗑️</span></button>}
            </div>
          )
          return (
            <div key={p.id} style={{ marginBottom: 12 }}>
              <TarjetaResultado
                datos={datos}
                fuente={fuenteJuego}
                tiempo={haceCuanto(p.creado_en)}
                autorNombre={`${p.autor_nombre || 'Usuario'}${p.autor_apellido ? ' ' + p.autor_apellido : ''}`}
                autorFoto={p.autor_foto}
                comentario={p.texto && !p.texto.startsWith('Ganaron') && !p.texto.startsWith('Quedaron') ? p.texto.split('\n')[0] : null}
                temaForzado={tema}
                pie={barraReacciones}
              />
            </div>
          )
        }
        const plant = plantillaPorId(datos.plantilla || PLANTILLA_DEFAULT)
        const tieneImg = plant && plant.img
        const esCuero = plant && plant.esCuero
        const acentoTag = p.tag_color || '#2f9e6e'
        const fotoPub = datos.imagen || p.imagen_url || null
        // colores tipo mockup (tarjeta blanca)
        const cardBg = esCuero ? T.barraImg : (T.esClaro ? '#ffffff' : 'rgba(20,22,26,.96)')
        const inkName = T.esClaro ? '#16181c' : '#f4f7f9'
        const inkSoft = T.esClaro ? '#565c66' : '#aeb6c0'
        const inkFaint = T.esClaro ? '#949aa3' : '#7f8893'
        const lineSoft = T.esClaro ? '#eceef1' : 'rgba(255,255,255,.07)'
        const avBg = avatarColor(p.autor_nombre || p.autor_id || 'x')
        return (
        <div key={p.id} style={{ marginBottom: 12 }}>
          <div className="mc-post-card" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: esCuero ? `url(${T.barraImg}) center/cover` : cardBg, border: `1.5px solid ${T.acento}55`, '--mc-glow': `${T.acento}3a` }}>
            {/* orillita dorada animada (brillo que recorre el borde) */}
            <div className="mc-post-shine" style={{ position: 'absolute', inset: 0, borderRadius: 16, padding: 1.5, background: `linear-gradient(120deg, transparent 20%, ${T.acento}aa 50%, transparent 80%)`, WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', pointerEvents: 'none', zIndex: 3 }} />
            {esCuero && <div style={{ position: 'absolute', inset: 0, background: T.scrimCarnet }} />}
            <div style={{ position: 'relative' }}>
              {/* CABECERA: avatar + nombre/meta + tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px 10px' }}>
                <div onClick={() => p.autor_id && onAccion && onAccion('verPerfil:' + p.autor_id)} style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: p.autor_foto ? `url(${p.autor_foto}) center/cover` : avBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  {!p.autor_foto && ((p.autor_nombre || '?').slice(0, 1).toUpperCase())}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: esCuero ? '#fff' : inkName, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.autor_nombre || 'Usuario'}{p.autor_apellido ? ` ${p.autor_apellido}` : ''}</div>
                  <div style={{ fontSize: 11.5, color: esCuero ? '#cdb98e' : inkFaint, marginTop: 1 }}>{p.autor_meta ? `${p.autor_meta} · ` : ''}{haceCuanto(p.creado_en)}</div>
                </div>
                {p.tag && <span style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 800, padding: '3px 9px', borderRadius: 20, color: acentoTag, background: T.esClaro ? `${acentoTag}1a` : `${acentoTag}26` }}>{p.tag}</span>}
                {miId && p.autor_id === miId && (
                  <span onClick={(e) => { e.stopPropagation(); onBorrarPublicacion(p.id) }} title="Eliminar" style={{ fontSize: 15, color: esCuero ? '#fff' : inkFaint, cursor: 'pointer', padding: '2px 4px' }}>🗑️</span>
                )}
              </div>

              {/* CUERPO: texto (con o sin plantilla de fondo) */}
              {datos.fondo && FONDOS_PUB[datos.fondo] ? (
                <div onClick={() => setPubAbierta(p)} style={{ position: 'relative', minHeight: 200, margin: '0 0 4px', cursor: 'pointer', background: `url(${FONDOS_PUB[datos.fondo]}) center/cover`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,9,12,.35), rgba(8,9,12,.62))' }} />
                  <div style={{ position: 'relative', padding: 24, textAlign: 'center', color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: 1.3, textShadow: '0 2px 12px rgba(0,0,0,.6)', wordBreak: 'break-word' }}>{resaltarTexto(p.texto, '#ffd76a', onTagPub)}</div>
                </div>
              ) : (
                <div onClick={() => setPubAbierta(p)} style={{ padding: '0 16px 12px', cursor: 'pointer' }}>
                  {p.titulo && <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3, color: esCuero ? '#fff' : inkName, marginBottom: p.texto ? 4 : 0 }}>{p.titulo}</div>}
                  {p.texto && <div style={{ fontSize: 14, lineHeight: 1.5, color: esCuero ? '#e9e1cf' : (T.esClaro ? '#2a2e34' : '#c3ccd4') }}>{resaltarTexto(p.texto, T.acento, onTagPub)}</div>}
                </div>
              )}

              {/* FOTO de la publicación (si hay) */}
              {fotoPub && (
                <div onClick={() => setPubAbierta(p)} style={{ margin: '0 0 4px', cursor: 'pointer', background: '#000' }}>
                  <img src={fotoPub} alt="" style={{ width: '100%', maxHeight: 460, objectFit: 'cover', display: 'block' }} />
                </div>
              )}

              {/* BARRA DE ACCIONES: me gusta · no me gusta · comentar · compartir */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 8px', borderTop: `1px solid ${esCuero ? 'rgba(255,255,255,.12)' : lineSoft}` }}>
                <button onClick={() => onReaccionar(p.id, 'like')} style={accionBtn(misReacc[p.id] === 'like' ? T.acento : (esCuero ? '#e9e1cf' : inkSoft))}>
                  <span style={{ fontSize: 16 }}>{misReacc[p.id] === 'like' ? '❤️' : '🤍'}</span> {p.likes || 0}
                </button>
                <button onClick={() => onReaccionar(p.id, 'dislike')} style={accionBtn(misReacc[p.id] === 'dislike' ? '#e0563f' : (esCuero ? '#e9e1cf' : inkSoft))}>
                  <span style={{ fontSize: 15 }}>👎</span> {p.dislikes || 0}
                </button>
                <button onClick={() => setComentariosDe(p)} style={accionBtn(esCuero ? '#e9e1cf' : inkSoft)}>
                  <span style={{ fontSize: 15 }}>💬</span> {p.num_comentarios || 0}
                </button>
                <button onClick={() => setPubAbierta(p)} style={accionBtn(esCuero ? '#e9e1cf' : inkSoft)}>
                  <span style={{ fontSize: 14 }}>↗</span> Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
        )
      })}</>
    )
  }

  const ListaRanking = ({ n }) => (
    <Placa radio={15} pad={6}>
      {RANKING.slice(0, n).map((l, idx) => (
        <div key={l.rk} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 8px', borderBottom: idx < n - 1 ? (T.esClaro ? '1px solid rgba(0,0,0,.07)' : '1px solid rgba(255,255,255,.06)') : 'none' }}>
          <div style={{ fontFamily: '"Arial Narrow", Impact, system-ui, sans-serif', fontSize: 18, fontWeight: 900, color: l.rk <= 3 ? T.acento : C.tenue, width: 18, textAlign: 'center' }}>{l.rk}</div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: T.avatarTexto, flexShrink: 0 }}>{l.ini}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.texto }}>{l.nombre}</div><div style={{ fontSize: 10.5, color: C.tenue }}>{l.equipo}</div></div>
          <div style={{ textAlign: 'right' }}><b style={{ fontFamily: '"Arial Narrow", Impact, system-ui, sans-serif', fontSize: 18, fontWeight: 900, color: T.acento }}>{l.val}</b><span style={{ fontSize: 9, color: C.tenue, display: 'block' }}>PTS/J</span></div>
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
        <div style={{ fontFamily: '"Arial Narrow", Impact, system-ui, sans-serif', fontSize: grande ? 52 : 34, fontWeight: 900, lineHeight: 0.92, textTransform: 'uppercase', color: '#f7f9fb', textShadow: '0 2px 16px rgba(0,0,0,.9)' }}>Todo el baloncesto.</div>
        <div style={{ fontFamily: '"Arial Narrow", Impact, system-ui, sans-serif', fontSize: grande ? 52 : 34, fontWeight: 900, lineHeight: 0.92, textTransform: 'uppercase', ...ORO_TEXTO, textShadow: '0 2px 16px rgba(0,0,0,.7)' }}>Un solo lugar.</div>
        <div style={{ fontSize: grande ? 15 : 13.5, color: '#e3e7ea', marginTop: 14, lineHeight: 1.5, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto', textShadow: '0 2px 10px rgba(0,0,0,.9)' }}>Sigue torneos en vivo, mira las estadísticas y descubre los mejores jugadores de cada zona.</div>
        <div style={{ marginTop: 14, fontSize: grande ? 13 : 11.5, fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', ...ORO_TEXTO, textShadow: '0 2px 10px rgba(0,0,0,.9)' }}>Tu cancha · Tu liga · Tu leyenda</div>
      </div>
    </div>
  )

  const CtaRegistro = () => (
    <div style={{ marginTop: 22, textAlign: 'center', padding: '22px 16px', borderRadius: 16, border: `1px solid ${T.navActivoBorde}`, background: T.esClaro ? 'rgba(176,122,38,.06)' : 'rgba(232,182,79,.05)' }}>
      <div style={{ fontFamily: '"Arial Narrow", Impact, system-ui, sans-serif', fontSize: 27, fontWeight: 900, textTransform: 'uppercase', color: T.textoFuerte, lineHeight: 1 }}>Hazte <span style={{ ...ORO_TEXTO }}>leyenda</span></div>
      <div style={{ fontSize: 13.5, color: C.tenue, marginTop: 8, lineHeight: 1.5, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>Crea tu perfil, sigue a tus jugadores y anota tus juegos. Gratis, para siempre.</div>
      <button onClick={() => click('registro')} style={{ width: '100%', maxWidth: 360, border: 'none', borderRadius: 14, padding: 16, marginTop: 16, background: T.boton, color: '#1a1205', fontWeight: 900, fontSize: 15.5, cursor: 'pointer', boxShadow: T.esClaro ? '0 8px 22px rgba(176,122,38,.3)' : '0 8px 22px rgba(232,182,79,.3)' }}>Únete gratis · Tu cancha te espera</button>
      <div style={{ fontSize: 12, color: C.tenue, marginTop: 12 }}>¿Quieres más beneficios? <span onClick={() => click('planes')} style={{ color: T.acento, fontWeight: 700, cursor: 'pointer' }}>Mira los planes</span></div>
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
          T={T} C={C} ORO_TEXTO={ORO_TEXTO}
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
      {comentariosDe && (
        <HojaComentarios
          pub={comentariosDe}
          T={T} C={C}
          haySesion={haySesion}
          onCerrar={() => setComentariosDe(null)}
          onPedirLogin={() => { setComentariosDe(null); click('entrar') }}
          onCambio={recargarTechado}
        />
      )}
      {verHistorialDia && (
        <div onClick={() => setVerHistorialDia(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(4,5,7,0.8)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: esEscritorio ? 'center' : 'flex-end', justifyContent: 'center', padding: esEscritorio ? 20 : 0 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '88dvh', display: 'flex', flexDirection: 'column', borderRadius: esEscritorio ? 20 : '20px 20px 0 0', padding: 1.5, background: T.borde }}>
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

  // ===== COMPONENTES NUEVOS (estructura red social, datos de ejemplo por ahora) =====

  const Tarjeta = ({ titulo, children, accion }) => (
    <div style={{ background: T.esClaro ? '#fff' : 'rgba(20,22,26,.72)', border: `1px solid ${T.esClaro ? '#e0e3e8' : 'rgba(255,255,255,.08)'}`, borderRadius: 16, boxShadow: T.esClaro ? '0 8px 24px rgba(20,24,30,.06)' : 'none', overflow: 'hidden' }}>
      {titulo && (
        <div style={{ padding: '13px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <h3 style={{ fontSize: 12.5, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 800, margin: 0, color: T.textoFuerte }}>{titulo}</h3>
            <span style={{ width: 22, height: 3, borderRadius: 3, background: T.boton }} />
          </div>
          {accion && <button onClick={accion.fn} style={{ fontSize: 11.5, color: T.tenue, background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer' }}>{accion.txt}</button>}
        </div>
      )}
      {children}
    </div>
  )

  const MiniPerfil = () => {
    if (!miPerfil) return null
    const p = miPerfil
    const nombre = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Miembro'
    const iniciales = `${(p.nombre || '?')[0] || ''}${(p.apellido || '')[0] || ''}`.toUpperCase()
    return (
      <Tarjeta>
        <div style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.foto_url ? `url(${p.foto_url}) center/cover` : T.avatar, color: T.avatarTexto, fontWeight: 800, fontSize: 22, boxShadow: `0 0 0 3px ${T.acento}` }}>{!p.foto_url && iniciales}</div>
          <div style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', color: T.textoFuerte }}>{nombre}</div>
          <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: T.esClaro ? '#9c6518' : T.acento, background: T.navActivoBg, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>Nivel Intermedio</span>
          <div style={{ display: 'flex', borderTop: `1px solid ${T.esClaro ? '#eceef1' : 'rgba(255,255,255,.07)'}`, marginTop: 14 }}>
            <div onClick={() => click('perfil')} style={{ flex: 1, padding: '11px 6px', textAlign: 'center', cursor: 'pointer' }}>
              <b style={{ fontFamily: '"Arial Narrow", Impact, system-ui, sans-serif', fontSize: 22, fontWeight: 900, display: 'block', color: T.acento }}>{statsSoc.seguidores}</b>
              <small style={{ fontSize: 9.5, color: T.tenue, letterSpacing: 0.4, textTransform: 'uppercase' }}>Seguidores</small>
            </div>
            <div onClick={() => click('perfil')} style={{ flex: 1, padding: '11px 6px', textAlign: 'center', borderLeft: `1px solid ${T.esClaro ? '#eceef1' : 'rgba(255,255,255,.07)'}`, cursor: 'pointer' }}>
              <b style={{ fontFamily: '"Arial Narrow", Impact, system-ui, sans-serif', fontSize: 22, fontWeight: 900, display: 'block', color: T.acento }}>{statsSoc.siguiendo}</b>
              <small style={{ fontSize: 9.5, color: T.tenue, letterSpacing: 0.4, textTransform: 'uppercase' }}>Siguiendo</small>
            </div>
          </div>
        </div>
      </Tarjeta>
    )
  }

  const CATEGORIAS = [
    { txt: 'Superior', cnt: '128' },
    { txt: 'Intermedio', cnt: '340' },
    { txt: 'Aficionado', cnt: '512' },
    { txt: 'Juvenil (U-17)', cnt: '96' },
  ]
  const CategoriasCard = () => (
    <Tarjeta titulo="Categorías">
      <div style={{ padding: '6px 8px 10px' }}>
        {CATEGORIAS.map((c) => (
          <div key={c.txt} onClick={() => click('rankings')} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 8px', borderRadius: 11, cursor: 'pointer' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.navActivoBg, color: T.acento, fontSize: 15 }}>🏀</div>
            <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 13.5, fontWeight: 700, color: T.textoFuerte }}>{c.txt}</b></div>
            <span style={{ fontSize: 12, color: T.tenue, fontWeight: 700 }}>{c.cnt}</span>
          </div>
        ))}
      </div>
    </Tarjeta>
  )

  const MENSAJES = [
    { ini: 'SR', col: 'linear-gradient(150deg,#3a6ea5,#23415f)', nombre: 'Starling Reyes', txt: "¿Vas pa'l torneo del sábado?" },
    { ini: 'LJ', col: 'linear-gradient(150deg,#9e3a3a,#5f2323)', nombre: 'Liga de Jícome', txt: 'Confirmado: tu equipo en grupo B' },
    { ini: 'EM', col: 'linear-gradient(150deg,#3a9e6e,#235f43)', nombre: 'El Mello', txt: 'Buena esa jugada anoche' },
  ]
  const MensajesCard = () => (
    <Tarjeta titulo="Mensajes">
      <div style={{ padding: '6px 8px 10px' }}>
        {MENSAJES.map((m) => (
          <div key={m.ini} onClick={() => click('mensajes')} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 8px', borderRadius: 11, cursor: 'pointer' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: m.col, color: '#fff', fontWeight: 700, fontSize: 13 }}>{m.ini}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: 13, fontWeight: 700, color: T.textoFuerte, display: 'block' }}>{m.nombre}</b>
              <small style={{ fontSize: 11.5, color: T.tenue, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.txt}</small>
            </div>
          </div>
        ))}
      </div>
    </Tarjeta>
  )

  const avatarMini = (p) => {
    const nom = `${p.nombre || ''}${p.apellido ? ' ' + p.apellido : ''}`.trim() || '?'
    return p.foto_url ? `url(${p.foto_url}) center/cover` : null
  }

  const BuscadorBar = () => (
    <div style={{ position: 'relative', zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.esClaro ? '#fff' : 'rgba(20,22,26,.72)', border: `1px solid ${bq ? T.acento + '88' : (T.esClaro ? '#e0e3e8' : 'rgba(255,255,255,.08)')}`, borderRadius: 24, padding: '11px 15px', boxShadow: T.esClaro ? '0 8px 24px rgba(20,24,30,.06)' : 'none' }}>
        <span style={{ fontSize: 15, color: T.tenue }}>🔍</span>
        <input
          type="text"
          value={bq}
          onChange={(e) => setBq(e.target.value)}
          placeholder="Buscar jugador o equipo"
          autoComplete="off"
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: T.textoFuerte, fontSize: 16 }}
        />
        {bq && <span onClick={() => setBq('')} style={{ fontSize: 16, color: T.tenue, cursor: 'pointer', padding: '0 2px' }}>×</span>}
      </div>

      {/* sugerencias inline */}
      {bq.trim().length >= 2 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: T.esClaro ? '#fff' : '#14161a', border: `1px solid ${T.esClaro ? '#e0e3e8' : 'rgba(255,255,255,.1)'}`, borderRadius: 16, boxShadow: '0 12px 32px rgba(0,0,0,.35)', overflow: 'hidden', maxHeight: 340, overflowY: 'auto' }}>
          {bCargando ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: T.tenue }}>Buscando…</div>
          ) : bResultados.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: T.tenue }}>No se encontró a nadie con "{bq.trim()}".</div>
          ) : bResultados.map((p) => {
            const nom = `${p.nombre || ''}${p.apellido ? ' ' + p.apellido : ''}`.trim() || 'Jugador'
            const sigo = bSiguiendo.includes(p.id)
            const fondoAv = avatarMini(p)
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px', borderBottom: `1px solid ${T.esClaro ? '#f0f1f3' : 'rgba(255,255,255,.05)'}` }}>
                <div onClick={() => { setBq(''); onAccion && onAccion('verPerfil:' + p.id) }} style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: fondoAv || T.avatar, display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 800, color: T.avatarTexto, cursor: 'pointer' }}>{!fondoAv && nom.slice(0, 1).toUpperCase()}</div>
                <div onClick={() => { setBq(''); onAccion && onAccion('verPerfil:' + p.id) }} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nom}</div>
                  <div style={{ fontSize: 11.5, color: T.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.municipio ? p.municipio : 'Jugador'}</div>
                </div>
                <button onClick={() => bSeguir(p)} disabled={bProcesando === p.id} style={{ flexShrink: 0, border: sigo ? `1px solid ${T.esClaro ? '#e0e3e8' : 'rgba(255,255,255,.16)'}` : 'none', borderRadius: 18, padding: '7px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', background: sigo ? 'transparent' : T.boton, color: sigo ? T.tenue : '#1a1205', opacity: bProcesando === p.id ? 0.6 : 1 }}>{sigo ? 'Siguiendo' : '+ Seguir'}</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const SOLICITUDES = [
    { ini: 'EM', col: 'linear-gradient(150deg,#3a9e6e,#235f43)', nombre: 'El Mello Tavárez', meta: 'Alero · Mao' },
    { ini: 'YP', col: 'linear-gradient(150deg,#8a5cc4,#4f3275)', nombre: 'Yariel Peña', meta: 'Center · Esperanza' },
  ]
  const SolicitudesCard = () => (
    <Tarjeta titulo="Solicitudes">
      <div style={{ padding: '6px 8px 10px' }}>
        {SOLICITUDES.map((s) => (
          <div key={s.ini} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.col, color: '#fff', fontWeight: 700, fontSize: 14 }}>{s.ini}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: 13, fontWeight: 700, color: T.textoFuerte, display: 'block' }}>{s.nombre}</b>
              <small style={{ fontSize: 11, color: T.tenue }}>{s.meta}</small>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ border: 'none', cursor: 'pointer', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.boton, color: T.avatarTexto, fontSize: 14, fontWeight: 800 }}>✓</button>
              <button style={{ cursor: 'pointer', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.esClaro ? '#f5f6f8' : 'rgba(255,255,255,.06)', color: T.tenue, border: `1px solid ${T.esClaro ? '#e0e3e8' : 'rgba(255,255,255,.1)'}`, fontSize: 13 }}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </Tarjeta>
  )

  const TENDENCIAS = [
    { e: 'TORNEO · CIBAO', t: '#LigaDeJícome', c: '312 publicaciones hoy' },
    { e: 'MERCADO', t: '#RefuerzoBuscado', c: '48 jugadores disponibles' },
    { e: 'RANKING', t: '#TopDelCibao', c: 'Starling Reyes sube al #1' },
  ]
  const TendenciasCard = () => (
    <Tarjeta titulo="Tendencias">
      <div style={{ padding: '8px 12px 14px' }}>
        {TENDENCIAS.map((t) => (
          <div key={t.t} onClick={() => click('tendencias')} style={{ padding: '7px 2px', cursor: 'pointer' }}>
            <span style={{ display: 'inline-block', fontSize: 12.5, fontWeight: 800, color: T.acento, background: T.esClaro ? 'rgba(176,122,38,.1)' : 'rgba(232,182,79,.1)', border: `1px solid ${T.navActivoBorde}`, padding: '5px 11px', borderRadius: 20 }}>{t.t}</span>
            <div style={{ fontSize: 11, color: T.subTexto, marginTop: 6 }}>{t.c}</div>
          </div>
        ))}
      </div>
    </Tarjeta>
  )

  const EnVivoFino = () => (
    <div>
      <style>{`@keyframes mcpulse{50%{opacity:.35;transform:scale(.8)}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 2px 11px' }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5640', animation: 'mcpulse 1.1s infinite' }} />
        <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: T.textoFuerte }}><span style={{ color: '#ff5640' }}>EN VIVO</span> · {JUEGOS_VIVO.length} juegos ahora</span>
        <span onClick={() => click('resultados')} style={{ marginLeft: 'auto', fontSize: 11.5, color: C.tenue, fontWeight: 700, cursor: 'pointer' }}>Ver todos →</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 11 }}>
        {JUEGOS_VIVO.map((g, i) => tarjetaVivo(g, i, '100%'))}
      </div>
    </div>
  )

  const Composer = () => (
    <ComposerTechado
      T={T}
      miPerfil={miPerfil}
      abierto={composerAbierto}
      setAbierto={setComposerAbierto}
      texto={textoComposer}
      setTexto={setTextoComposer}
      fondoSel={fondoComposer}
      setFondoSel={setFondoComposer}
      publicando={publicandoTexto}
      onPublicar={enviarPublicacionTexto}
      onResultado={() => click('resultados')}
      onAbrir={() => click('publicar')}
    />
  )

  // Hoja de tipos de juego (se abre con el botón Anotar) — las funciones "por fuera"
  const HojaAnotar = () => {
    if (!anotarAbierto) return null
    const tipos = [
      { id: 'juego', tipo: 'rapido', emoji: '⚡', t: 'Juego rápido', d: 'Anota un partido al momento, sin complicación.' },
      { id: 'juego', tipo: 'fogueo', emoji: '🔥', t: 'Fogueo', d: 'Práctica con tu roster, banca y cambios.' },
      { id: 'crearTorneo', emoji: '🏆', t: 'Torneo', d: 'Crea o administra un torneo completo.' },
      { id: 'crearLiga', emoji: '🤝', t: 'Liga', d: 'Crea o administra una liga por jornadas.' },
    ]
    return (
      <div onClick={() => setAnotarAbierto(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: T.esClaro ? '#fff' : 'linear-gradient(180deg,#16130d,#0d0b07)', borderRadius: '20px 20px 0 0', border: `1px solid ${T.navActivoBorde}`, borderBottom: 'none', padding: '10px 16px calc(20px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px rgba(0,0,0,.5)', animation: 'mcHojaSube .28s cubic-bezier(.2,.8,.3,1)' }}>
          <style>{`@keyframes mcHojaSube{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
          <div style={{ width: 40, height: 4, borderRadius: 4, background: T.tenue, opacity: 0.4, margin: '4px auto 14px' }} />
          <div style={{ fontFamily: '"Arial Narrow", Impact, system-ui, sans-serif', fontSize: 23, fontWeight: 900, textTransform: 'uppercase', color: T.textoFuerte }}>¿Qué quieres <span style={{ ...ORO_TEXTO }}>anotar</span>?</div>
          <div style={{ fontSize: 12.5, color: T.tenue, margin: '4px 0 14px' }}>Escoge el tipo de juego o competencia.</div>
          {tipos.map((x, i) => (
            <button key={i} onClick={() => { setAnotarAbierto(false); if (x.tipo) { try { localStorage.setItem('mc_tipo_juego', x.tipo) } catch (e) {} } click(x.id) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', border: `1px solid ${T.navActivoBorde}`, background: T.esClaro ? 'rgba(176,122,38,.05)' : 'rgba(255,255,255,.03)', borderRadius: 14, padding: '13px 14px', marginBottom: 10, cursor: 'pointer' }}>
              <span style={{ fontSize: 24, width: 44, height: 44, borderRadius: 12, background: T.esClaro ? 'rgba(176,122,38,.1)' : 'rgba(232,182,79,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{x.emoji}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15.5, fontWeight: 800, color: T.textoFuerte }}>{x.t}</span>
                <span style={{ display: 'block', fontSize: 12, color: T.tenue, marginTop: 2 }}>{x.d}</span>
              </span>
              <span style={{ color: T.acento, fontSize: 18, flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

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
        {/* barra fina superior (computadora) — la credencial vive en el Perfil */}
        {haySesion && miPerfil && (
          <header style={{ position: 'sticky', top: 0, zIndex: 20, background: T.headerBg, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: `1px solid ${T.esClaro ? 'rgba(200,132,46,.22)' : 'rgba(234,182,79,.18)'}` }}>
            <div style={{ maxWidth: 1700, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, padding: '11px 30px' }}>
              <div style={{ fontFamily: '"Arial Narrow", Impact, system-ui, sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: 0.5, lineHeight: 1, whiteSpace: 'nowrap', display: 'flex', gap: 7 }}>
                <span style={{ color: T.esClaro ? '#7a6e58' : '#dfe2e6' }}>MEDIA</span><span style={{ ...ORO_TEXTO }}>CANCHA</span>
              </div>
              <nav style={{ display: 'flex', gap: 4 }}>
                {[{ id: 'inicio', txt: 'Inicio' }, { id: 'techado', txt: 'El Techado' }, { id: 'torneos', txt: 'Torneos' }, { id: 'rankings', txt: 'Rankings' }, { id: 'mapa', txt: 'Mapa' }].map((n) => {
                  const on = n.id === 'inicio'
                  if (n.id === 'torneos') {
                    return (
                      <div key={n.id} style={{ position: 'relative' }}>
                        <button onClick={(e) => { e.stopPropagation(); setTorneosAbierto((v) => !v) }} style={{ fontSize: 13.5, fontWeight: 800, color: torneosAbierto ? T.acento : T.tenue, padding: '9px 15px', borderRadius: 11, cursor: 'pointer', border: torneosAbierto ? `1px solid ${T.navActivoBorde}` : '1px solid transparent', background: torneosAbierto ? T.navActivoBg : 'transparent', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>{n.txt} <span style={{ fontSize: 10 }}>{torneosAbierto ? '▴' : '▾'}</span></button>
                        {torneosAbierto && (
                          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: 235, background: T.esClaro ? 'rgba(252,250,245,.99)' : 'rgba(18,20,24,.98)', border: `1px solid ${T.navActivoBorde}`, borderRadius: 12, padding: 7, zIndex: 200, backdropFilter: 'blur(12px)', boxShadow: '0 12px 32px rgba(0,0,0,.35)' }}>
                            {[
                              { id: 'crearTorneo', icono: '＋', txt: 'Crear torneo', desc: 'Arma uno nuevo' },
                              { id: 'misTorneos', icono: '🏆', txt: 'Mis torneos', desc: 'Los que organizas' },
                              { id: 'dondeJuego', icono: '👥', txt: 'Donde juego', desc: 'Como jugador' },
                              { id: 'torneos', icono: '🌐', txt: 'Explorar torneos', desc: 'Todos los públicos' },
                            ].map((o) => (
                              <button key={o.id} onClick={() => { setTorneosAbierto(false); click(o.id) }} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: C.texto, fontSize: 13, fontWeight: 600, padding: '10px 11px', borderRadius: 8, cursor: 'pointer' }}>
                                <span style={{ fontSize: 16, color: T.acento, width: 20, textAlign: 'center' }}>{o.icono}</span>
                                <span style={{ flex: 1 }}>{o.txt}<div style={{ fontSize: 11, color: T.tenue, fontWeight: 400 }}>{o.desc}</div></span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }
                  return (
                    <button key={n.id} onClick={() => click(n.id)} style={{ fontSize: 13.5, fontWeight: 800, color: on ? T.acento : T.tenue, padding: '9px 15px', borderRadius: 11, cursor: 'pointer', border: on ? `1px solid ${T.navActivoBorde}` : '1px solid transparent', background: on ? T.navActivoBg : 'transparent', whiteSpace: 'nowrap' }}>{n.txt}</button>
                  )
                })}
              </nav>
              <span style={{ marginLeft: 'auto' }} />
              <button onClick={() => setAnotarAbierto(true)} style={{ border: 'none', cursor: 'pointer', background: T.boton, color: '#1a1205', fontWeight: 900, fontSize: 13.5, padding: '10px 18px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 6px 18px rgba(232,182,79,.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>＋ Anotar juego</button>
              <BotonTema />
              <div onClick={() => click('mensajes')} title="Mensajes" style={{ width: 40, height: 40, borderRadius: 11, background: T.esClaro ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)', border: `1px solid ${T.navActivoBorde}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.acento, fontSize: 16, position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
                  <path d="M4 5.5C4 4.7 4.7 4 5.5 4h13C19.3 4 20 4.7 20 5.5v8c0 .8-.7 1.5-1.5 1.5H9l-4 3.5v-3.5H5.5C4.7 15 4 14.3 4 13.5v-8Z" stroke={T.acento} strokeWidth="1.7" fill="none" strokeLinejoin="round" />
                  <circle cx="12" cy="9.3" r="3" stroke={T.acento} strokeWidth="1.4" />
                  <path d="M9 9.3h6M12 6.3v6M9.9 7.2c.9.9 1.3 2.8.6 4.2M14.1 7.2c-.9.9-1.3 2.8-.6 4.2" stroke={T.acento} strokeWidth="1" strokeLinecap="round" />
                </svg>
                {noLeidos > 0 && <span style={{ position: 'absolute', top: -3, right: -3, background: '#ff5640', color: '#fff', fontSize: 9, fontWeight: 800, minWidth: 15, height: 15, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${T.fondo}` }}>{noLeidos > 9 ? '9+' : noLeidos}</span>}
              </div>
              <div onClick={() => click('perfil')} title="Mi perfil" style={{ width: 40, height: 40, borderRadius: '50%', background: miPerfil.foto_url ? `url(${miPerfil.foto_url}) center/cover` : T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.avatarTexto, fontWeight: 800, fontSize: 14, cursor: 'pointer', border: `2px solid ${T.acento}`, flexShrink: 0 }}>{!miPerfil.foto_url && `${(miPerfil.nombre || '?')[0] || ''}${(miPerfil.apellido || '')[0] || ''}`.toUpperCase()}</div>
            </div>
          </header>
        )}
        {/* contenido: SOLO 2 columnas (Techado ancho + paneles) */}
        <main style={{ flex: 1, position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: esTablet ? '1fr 320px' : '290px 1fr 380px', gap: esTablet ? 18 : 22, alignItems: 'start', padding: esTablet ? '16px 18px 40px' : '20px 30px 50px', maxWidth: 1700, margin: '0 auto', width: '100%' }}>
          {/* COLUMNA IZQUIERDA (se oculta en tablet) */}
          {!esTablet && (
            <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: haySesion ? 80 : 20, alignSelf: 'start' }}>
              {haySesion && <MiniPerfil />}
              <div onClick={() => setAnotarAbierto(true)} style={{ cursor: 'pointer', borderRadius: 16, padding: 1.5, background: T.boton, boxShadow: T.esClaro ? '0 8px 22px rgba(176,122,38,.28)' : '0 8px 22px rgba(232,182,79,.3)' }}>
                <div style={{ borderRadius: 14.5, background: T.esClaro ? 'rgba(255,252,245,.96)' : 'linear-gradient(135deg,rgba(40,30,16,.92),rgba(14,10,6,.95))', padding: '16px 15px' }}>
                  <div style={{ fontSize: 19, fontWeight: 900, color: T.textoFuerte, textTransform: 'uppercase', lineHeight: 1, display: 'flex', alignItems: 'center', gap: 8 }}>＋ <span style={{ color: T.acento }}>Anotar un juego</span></div>
                  <div style={{ fontSize: 11.5, color: T.tenue, marginTop: 6, lineHeight: 1.4 }}>Lleva la estadística en vivo y publica el resultado al Techado.</div>
                </div>
              </div>
              <CategoriasCard />
              {haySesion && <MensajesCard />}
            </aside>
          )}
          {/* COLUMNA CENTRO: EL TECHADO (protagonista) */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!haySesion && <Bienvenida grande />}
            <EnVivoFino />
            {Composer()}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '2px 2px 12px' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0, color: T.textoFuerte }}>El <span style={{ color: T.acento }}>Techado</span></h2>
                <span style={{ fontSize: 12, color: T.tenue }}>Tu zona, primero</span>
              </div>
              <ListaTechado />
            </div>
          </div>
          {/* COLUMNA DERECHA */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: haySesion ? 80 : 20, alignSelf: 'start' }}>
            {BuscadorBar()}
            {haySesion && <SolicitudesCard />}
            <Tarjeta titulo="Torneos populares" accion={{ txt: 'Ver todos →', fn: () => click('torneos') }}>
              <div style={{ padding: '4px 10px 12px' }}><ListaTorneos /></div>
            </Tarjeta>
            <Tarjeta titulo="Ranking nacional" accion={{ txt: 'Ver todo →', fn: () => click('rankings') }}>
              <div style={{ padding: '4px 10px 12px' }}><ListaRanking n={5} /></div>
            </Tarjeta>
            <TendenciasCard />
          </aside>
        </main>
        {Modales()}{HojaAnotar()}
      </div>
    )
  }

  // ===== VISTA MÓVIL =====
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', color: C.texto, fontFamily: C.font, background: T.fondo, display: 'flex', flexDirection: 'column' }}>
      <Velo />
      {/* BARRA FIJA inmóvil: cubre desde el reloj/isla y no se mueve nunca */}
      <div style={{ position: 'relative', zIndex: 40, flexShrink: 0, background: T.fondo, paddingTop: 'calc(env(safe-area-inset-top) - 4px)' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '6px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Logo chico />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BotonTema />
            <div onClick={() => click('mensajes')} title="Mensajes" style={{ position: 'relative', width: 40, height: 40, borderRadius: 11, background: T.esClaro ? '#ffffff' : 'rgba(255,255,255,.06)', border: `1px solid ${T.navActivoBorde}`, boxShadow: T.esClaro ? '0 2px 10px rgba(60,40,8,.16)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
                <path d="M4 5.5C4 4.7 4.7 4 5.5 4h13C19.3 4 20 4.7 20 5.5v8c0 .8-.7 1.5-1.5 1.5H9l-4 3.5v-3.5H5.5C4.7 15 4 14.3 4 13.5v-8Z" stroke={T.acento} strokeWidth="1.7" fill="none" strokeLinejoin="round" />
                <circle cx="12" cy="9.3" r="3" stroke={T.acento} strokeWidth="1.4" />
                <path d="M9 9.3h6M12 6.3v6M9.9 7.2c.9.9 1.3 2.8.6 4.2M14.1 7.2c-.9.9-1.3 2.8-.6 4.2" stroke={T.acento} strokeWidth="1" strokeLinecap="round" />
              </svg>
              {noLeidos > 0 && <span style={{ position: 'absolute', top: -3, right: -3, background: '#ff5640', color: '#fff', fontSize: 9, fontWeight: 800, minWidth: 15, height: 15, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${T.fondo}` }}>{noLeidos > 9 ? '9+' : noLeidos}</span>}
            </div>
            <button onClick={() => setMenuAbierto(!menuAbierto)} style={{ background: T.esClaro ? '#ffffff' : 'rgba(30,26,20,.7)', border: `1px solid ${T.navActivoBorde}`, boxShadow: T.esClaro ? '0 2px 10px rgba(60,40,8,.16)' : 'none', color: T.acento, fontSize: 20, width: 40, height: 40, borderRadius: 11, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>☰</button>
          </div>
          {menuAbierto && (
            <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 56px)', right: 2, zIndex: 30, width: 230, background: T.esClaro ? 'rgba(248,243,233,.97)' : 'rgba(20,18,16,.95)', border: `1px solid ${T.navActivoBorde}`, borderRadius: 14, padding: 8, boxShadow: '0 10px 30px rgba(0,0,0,.6)', backdropFilter: 'blur(12px)' }}>
              {[{ id: 'buscar', txt: '🔍 Buscar personas' }, { id: 'perfil', txt: '◉ Mi perfil' }, ...ACCIONES_CREAR, ...ACCIONES_MIAS, ...(haySesion ? [{ id: 'cerrarSesion', txt: '↩ Cerrar sesión' }] : [{ id: 'registro', txt: '✦ Crear mi cuenta gratis' }, { id: 'entrar', txt: '→ Iniciar sesión' }])].map((a) => (
                <button key={a.id} onClick={() => click(a.id)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: C.texto, fontSize: 14, fontWeight: 600, padding: '12px', borderRadius: 9, cursor: 'pointer' }}>{a.txt}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SOLO esta área hace scroll, por debajo de la barra fija */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '4px 16px 130px' }}>
        {!haySesion && <div style={{ marginTop: 14 }}><Bienvenida /></div>}
        <div style={{ marginTop: 22 }}><EnVivo /></div>
        {haySesion && <div style={{ marginTop: 16 }}>{Composer()}</div>}
        <div style={{ marginTop: 22 }}><SecHead titulo="El Techado" icono="techado" accion={{ txt: 'Ver todo →', fn: () => click('techado') }} /><span style={{ display: 'block', fontSize: 11.5, color: T.tenue, margin: '-6px 2px 10px' }}>Tu zona, primero</span><ListaTechado /></div>
        <div style={{ marginTop: 22 }}><SecHead titulo="Torneos populares" accion={{ txt: 'Ver todos →', fn: () => click('torneos') }} /><ListaTorneos /></div>
        <div style={{ marginTop: 22 }}><SecHead titulo="Ranking nacional" accion={{ txt: 'Ver todo →', fn: () => click('rankings') }} /><ListaRanking n={5} /></div>
        {!haySesion && <CtaRegistro />}
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, background: T.headerBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: `1px solid ${T.navActivoBorde}`, boxShadow: '0 -5px 25px rgba(0,0,0,.1)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
        <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        {[{ id: 'inicio', txt: 'Inicio', icono: '⌂' }, { id: 'torneos', txt: 'Torneos', icono: '🏆' }].map((n) => (
          <button key={n.id} onClick={() => click(n.id)} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', textAlign: 'center', color: n.id === 'inicio' ? T.acento : C.tenue, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
            <div style={{ fontSize: 18, marginBottom: 3, display: 'flex', justifyContent: 'center' }}>{n.icono}</div>{n.txt}
          </button>
        ))}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => setAnotarAbierto(true)} style={{ width: 52, height: 52, borderRadius: '50%', background: T.boton, border: 'none', cursor: 'pointer', boxShadow: `0 4px 14px ${T.esClaro ? 'rgba(176,122,38,.4)' : 'rgba(232,182,79,.45)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#1a1205' }}>
            <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 0.8 }}>＋</span>
            <span style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 1 }}>Anotar</span>
          </button>
        </div>
        <button onClick={() => click('buscar')} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', textAlign: 'center', color: C.tenue, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
          <div style={{ fontSize: 18, marginBottom: 3, display: 'flex', justifyContent: 'center' }}>🔍</div>Buscar
        </button>
        <button onClick={() => click('perfil')} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', textAlign: 'center', color: C.tenue, fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', marginBottom: 3, background: miPerfil?.foto_url ? `url(${miPerfil.foto_url}) center/cover` : T.boton, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#1a1205', boxShadow: `0 0 0 1.5px ${T.acento}` }}>{!miPerfil?.foto_url && ((miPerfil?.nombre || '?')[0] || '').toUpperCase()}</div>Perfil
        </button>
        </div>
        </div>
      </div>
      {Modales()}{HojaAnotar()}
    </div>
  )
}

// ---- Componente de comentarios ----
const EMOJIS_MC = {
  'Básquet': ['🏀', '🔥', '💪', '🏆', '🥇', '🥈', '🥉', '⛹️', '🤾', '🏅', '📊', '⏱️', '🎯', '💥', '⚡', '🌟', '👑', '🚀', '💯', '🙌'],
  'Caritas': ['😀', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😎', '🤩', '😏', '😮', '😱', '🤔', '😤', '😭', '😢', '😡', '🥵', '🤯', '😴'],
  'Gestos': ['👍', '👎', '👏', '🙌', '🤝', '✊', '👊', '🤜', '🤛', '✌️', '🤞', '🫡', '🙏', '💪', '👈', '👉', '👆', '👇', '☝️', '🤙'],
  'Símbolos': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '❤️‍🔥', '⭐', '🌟', '✨', '💫', '🎉', '🎊', '🔔', '📢', '💬', '👀', '✅'],
  'Banderas': ['🇩🇴', '🇺🇸', '🇵🇷', '🇲🇽', '🇨🇴', '🇻🇪', '🇪🇸', '🇨🇺', '🇦🇷', '🇧🇷', '🇨🇱', '🇵🇪', '🇪🇨', '🇬🇹', '🇭🇳', '🇳🇮', '🇨🇷', '🇵🇦', '🏳️', '🏁'],
}

function ComposerTechado({ T, miPerfil, abierto, setAbierto, texto, setTexto, fondoSel, setFondoSel, publicando, onPublicar, onResultado, onAbrir }) {
  const p = miPerfil
  const [panelEmoji, setPanelEmoji] = useState(false)
  const [catEmoji, setCatEmoji] = useState('Básquet')
  const areaRef = useRef(null)
  // Menú de menciones (@): cuando escribes @ sale la lista de gente para etiquetar
  const [menciones, setMenciones] = useState([])
  const [buscandoMencion, setBuscandoMencion] = useState(false)
  const [idsSeguidos, setIdsSeguidos] = useState([])

  // Cargar a quién sigo (para mostrarlos primero al etiquetar)
  useEffect(() => {
    if (!abierto) return
    ;(async () => {
      try { setIdsSeguidos(await idsQueSigo()) } catch (e) { setIdsSeguidos([]) }
    })()
  }, [abierto])

  const esNativo =
    typeof Capacitor !== 'undefined' &&
    typeof Capacitor.isNativePlatform === 'function' &&
    Capacitor.isNativePlatform()

  // ----- Teclado fluido (misma técnica oficial del chat/comentarios) -----
  const [kbAlto, setKbAlto] = useState(0)
  const ajusteTeclado = 30
  useEffect(() => {
    if (!abierto || !esNativo) return
    let lShow = null, lHide = null
    Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {})
    ;(async () => {
      try {
        lShow = await Keyboard.addListener('keyboardWillShow', (info) => setKbAlto((info && info.keyboardHeight) || 0))
        lHide = await Keyboard.addListener('keyboardWillHide', () => setKbAlto(0))
      } catch (e) {}
    })()
    return () => {
      if (lShow && lShow.remove) lShow.remove()
      if (lHide && lHide.remove) lHide.remove()
      setKbAlto(0)
      Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {})
    }
  }, [abierto, esNativo])

  // Congela el feed que queda atrás: mientras el compositor está abierto,
  // bloqueamos el scroll del fondo para que no se mueva ni se asome.
  useEffect(() => {
    if (!abierto) return
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
  }, [abierto])

  if (!p) return null
  const iniciales = `${(p.nombre || '?')[0] || ''}${(p.apellido || '')[0] || ''}`.toUpperCase()
  const hayTexto = texto.trim().length > 0
  const nombreCompleto = `${p.nombre || 'Usuario'}${p.apellido ? ' ' + p.apellido : ''}`

  // Plantillas de imagen para publicaciones de texto corto (estilo Facebook/IG).
  // El 0 es "sin plantilla" (publicación normal). El resto son imágenes de assets.
  const PLANTILLAS_FONDO = [
    null,
    { img: plBalonDorado, nombre: 'Balón dorado' },
    { img: plAroAtardecer, nombre: 'Aro atardecer' },
    { img: plCanchaBarrioNoche, nombre: 'Cancha de barrio' },
    { img: plCanchaMadera, nombre: 'Cancha de madera' },
    { img: plMonumentoSantiago, nombre: 'Monumento Santiago' },
  ]
  const conFondo = fondoSel > 0
  const fondoActivo = PLANTILLAS_FONDO[fondoSel]
  // Con plantilla solo permitimos texto corto (como Facebook)
  const limiteTexto = conFondo ? 140 : 500

  // ----- Menciones (@): detectar la palabra que se está escribiendo tras un @ -----
  // Devuelve el término después del último @ si el cursor está dentro de él, o null.
  const terminoMencion = (valor, cursor) => {
    const antes = valor.slice(0, cursor)
    const m = antes.match(/(?:^|\s)@([\wáéíóúñ]*)$/i)
    return m ? m[1] : null
  }

  const alCambiarTexto = (e) => {
    const valor = e.target.value.slice(0, limiteTexto)
    setTexto(valor)
    const cursor = e.target.selectionStart || valor.length
    const term = terminoMencion(valor, cursor)
    if (term === null) { setMenciones([]); return }
    setBuscandoMencion(true)
    // búsqueda con pequeño retraso
    clearTimeout(window.__mcMencionT)
    window.__mcMencionT = setTimeout(async () => {
      let q = supabase.from('perfiles').select('id, nombre, apellido, codigo_unico, foto_url').limit(6)
      if (term.length >= 1) {
        q = q.or(`nombre.ilike.%${term}%,apellido.ilike.%${term}%,codigo_unico.ilike.%${term}%`)
      }
      const { data } = await q
      const lista = (data || []).filter((u) => u.id !== (p && p.id))
      // Los que sigo van primero
      const sigo = new Set(idsSeguidos)
      lista.sort((a, b) => (sigo.has(b.id) ? 1 : 0) - (sigo.has(a.id) ? 1 : 0))
      setMenciones(lista)
      setBuscandoMencion(false)
    }, 200)
  }

  // Inserta la mención elegida reemplazando el @término por @Nombre
  const elegirMencion = (u) => {
    const el = areaRef.current
    const cursor = el ? (el.selectionStart || texto.length) : texto.length
    const antes = texto.slice(0, cursor)
    const despues = texto.slice(cursor)
    const nuevoAntes = antes.replace(/(^|\s)@([\wáéíóúñ]*)$/i, `$1@${u.nombre} `)
    const nuevo = (nuevoAntes + despues).slice(0, limiteTexto)
    setTexto(nuevo)
    setMenciones([])
    setTimeout(() => { if (el) { el.focus(); const pos = nuevoAntes.length; el.setSelectionRange(pos, pos) } }, 0)
  }

  const meterEmoji = (emo) => {
    const el = areaRef.current
    if (!el) { setTexto((texto + emo).slice(0, limiteTexto)); return }
    const ini = el.selectionStart || 0
    const fin = el.selectionEnd || 0
    const nuevo = (texto.slice(0, ini) + emo + texto.slice(fin)).slice(0, limiteTexto)
    setTexto(nuevo)
    setTimeout(() => {
      el.focus()
      const pos = ini + emo.length
      el.setSelectionRange(pos, pos)
    }, 0)
  }

  const cerrar = () => { setAbierto(false); setPanelEmoji(false); setFondoSel(0) }

  // Módulos de arriba (etiquetas a la publicación). Funcionalidad: pronto.
  const modulos = [
    { id: 'torneo', icono: '🏆', txt: 'Torneo' },
    { id: 'ubicacion', icono: '📍', txt: 'Ubicación' },
    { id: 'sentimiento', icono: '😊', txt: 'Sentimiento' },
  ]
  // Adjuntos de abajo. Foto/Resultado conectan; el resto pronto.
  const adjuntos = [
    { id: 'foto', icono: '📷', txt: 'Foto', activo: false },
    { id: 'video', icono: '🎥', txt: 'Video', activo: false },
    { id: 'resultado', icono: '📊', txt: 'Resultado', activo: true },
    { id: 'encuesta', icono: '🗳️', txt: 'Encuesta', activo: false },
    { id: 'gif', icono: 'GIF', txt: 'GIF', activo: false },
  ]

  const avisarPronto = () => { try { if (navigator && navigator.vibrate) navigator.vibrate(8) } catch (e) {} }

  const pillBtn = (m, onClk) => (
    <button key={m.id} onClick={onClk} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0,
      border: `1px solid ${T.esClaro ? '#e0e3e8' : 'rgba(232,182,79,.28)'}`,
      background: T.esClaro ? '#fff' : 'rgba(255,255,255,.04)',
      color: T.textoFuerte, borderRadius: 999, padding: '8px 14px',
      fontSize: 12.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 14 }}>{m.icono}</span>{m.txt}
    </button>
  )

  // ---- Barrita disparadora (siempre visible en el feed) ----
  if (!abierto) {
    return (
      <div style={{ background: T.esClaro ? '#fff' : 'rgba(20,22,26,.72)', border: `1px solid ${T.esClaro ? '#e0e3e8' : 'rgba(255,255,255,.08)'}`, borderRadius: 16, boxShadow: T.esClaro ? '0 8px 24px rgba(20,24,30,.06)' : 'none', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.foto_url ? `url(${p.foto_url}) center/cover` : T.avatar, color: T.avatarTexto, fontWeight: 700, boxShadow: `0 0 0 2px ${T.acento}` }}>{!p.foto_url && iniciales}</div>
            <div onClick={() => onAbrir && onAbrir()} style={{ flex: 1, background: T.esClaro ? '#f5f6f8' : 'rgba(255,255,255,.05)', border: `1px solid ${T.esClaro ? '#e0e3e8' : 'rgba(255,255,255,.08)'}`, borderRadius: 22, padding: '11px 16px', color: T.tenue, fontSize: 14, cursor: 'text' }}>¿Qué está pasando en la cancha?</div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.esClaro ? '#eceef1' : 'rgba(255,255,255,.06)'}` }}>
            <button onClick={() => onAbrir && onAbrir()} style={{ flex: 1, border: 'none', background: 'transparent', borderRadius: 10, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: T.subTexto, cursor: 'pointer' }}>
              <span style={{ fontSize: 15 }}>📷</span>Foto
            </button>
            <button onClick={onResultado} style={{ flex: 1, border: 'none', background: 'transparent', borderRadius: 10, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: T.subTexto, cursor: 'pointer' }}>
              <span style={{ fontSize: 15 }}>📊</span>Resultado
            </button>
            <button onClick={() => onAbrir && onAbrir()} style={{ flex: 1, border: 'none', background: 'transparent', borderRadius: 10, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: T.subTexto, cursor: 'pointer' }}>
              <span style={{ fontSize: 15 }}>🗳️</span>Encuesta
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Técnica "base sólida" (igual que el BottomSheet de comentarios): subimos la
  // pantalla un poco MENOS que el teclado y rellenamos ese tramo con el mismo
  // color de la barra, para que NO quede brecha que muestre el fondo de atrás.
  const baseSolida = 120
  const alturaPantalla = (kbAlto > 0)
    ? `calc(100dvh - ${Math.max(0, kbAlto - baseSolida)}px)`
    : '100dvh'

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
      background: T.fondo || (T.esClaro ? '#f3eee3' : '#0a0b0e'),
      display: 'flex', flexDirection: 'column',
      height: alturaPantalla,
      animation: 'composerSube .28s cubic-bezier(.2,.8,.3,1)',
    }}>
      <style>{`@keyframes composerSube{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
        padding: 'calc(env(safe-area-inset-top) + 16px) 14px 12px',
        borderBottom: `1px solid ${T.esClaro ? '#e8e3d8' : 'rgba(232,182,79,.18)'}`,
      }}>
        <span onClick={cerrar} style={{ fontSize: 26, lineHeight: 1, color: T.textoFuerte, cursor: 'pointer', padding: '0 4px', fontWeight: 300 }}>✕</span>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 800, color: T.textoFuerte }}>Publicación nueva</span>
        <button onClick={onPublicar} disabled={!hayTexto || publicando} style={{
          border: 'none', borderRadius: 20, padding: '8px 18px',
          background: hayTexto ? T.boton : (T.esClaro ? '#e0e3e8' : 'rgba(255,255,255,.1)'),
          color: hayTexto ? '#1a1205' : T.tenue, fontWeight: 800, fontSize: 13.5,
          cursor: hayTexto ? 'pointer' : 'default', opacity: publicando ? 0.6 : 1,
        }}>{publicando ? 'Publicando…' : 'Publicar'}</button>
      </div>

      {/* Identidad */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px 8px' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.foto_url ? `url(${p.foto_url}) center/cover` : T.avatar, color: T.avatarTexto, fontWeight: 700, boxShadow: `0 0 0 2px ${T.acento}` }}>{!p.foto_url && iniciales}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreCompleto}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 3, fontSize: 11, fontWeight: 700, color: T.tenue, border: `1px solid ${T.esClaro ? '#e0e3e8' : 'rgba(255,255,255,.12)'}`, borderRadius: 8, padding: '2px 8px' }}>🌐 Público</div>
        </div>
      </div>

      {/* Módulos (etiquetas) */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 16px 10px', WebkitOverflowScrolling: 'touch' }}>
        {modulos.map((m) => pillBtn(m, avisarPronto))}
      </div>

      {/* Área de texto (con o sin fondo) */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {conFondo ? (
          <div style={{ flex: 1, minHeight: 240, margin: '4px 16px 12px', borderRadius: 18, position: 'relative', overflow: 'hidden', background: `url(${fondoActivo.img}) center/cover` }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,9,12,.35), rgba(8,9,12,.62))' }} />
            <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
              <textarea
                ref={areaRef}
                value={texto}
                onChange={alCambiarTexto}
                placeholder="Escribe algo…"
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', color: '#fff', fontSize: 26, fontWeight: 800, textAlign: 'center', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.3, textShadow: '0 2px 12px rgba(0,0,0,.6)' }}
              />
            </div>
          </div>
        ) : (
          <textarea
            ref={areaRef}
            value={texto}
            onChange={alCambiarTexto}
            placeholder="¿Qué está pasando en la cancha?"
            style={{ flex: 1, width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', color: T.textoFuerte, fontSize: 18, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, padding: '6px 18px 18px' }}
          />
        )}

        {/* Selector de PLANTILLAS (miniaturas reales) */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 9, overflowX: 'auto', padding: '4px 16px 12px', WebkitOverflowScrolling: 'touch' }}>
          <span style={{ flexShrink: 0, fontSize: 18 }}>🎨</span>
          {PLANTILLAS_FONDO.map((f, i) => (
            <button key={i} onClick={() => { setFondoSel(i); if (i > 0) setTexto((t) => t.slice(0, 140)) }} title={f ? f.nombre : 'Sin plantilla'} style={{
              flexShrink: 0, width: 44, height: 44, borderRadius: 11, cursor: 'pointer', overflow: 'hidden',
              border: fondoSel === i ? `2.5px solid ${T.acento}` : `1px solid ${T.esClaro ? '#d8dce2' : 'rgba(255,255,255,.16)'}`,
              background: f ? `url(${f.img}) center/cover` : (T.esClaro ? '#fff' : 'rgba(255,255,255,.06)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: T.tenue, fontWeight: 800, padding: 0,
            }}>{!f && 'Aa'}</button>
          ))}
        </div>
      </div>

      {/* Menú de menciones (@) */}
      {menciones.length > 0 && (
        <div style={{ flexShrink: 0, maxHeight: 200, overflowY: 'auto', borderTop: `1px solid ${T.esClaro ? '#eceef1' : 'rgba(255,255,255,.08)'}`, background: T.esClaro ? '#fff' : 'rgba(12,14,18,.98)' }}>
          {menciones.map((u) => {
            const ini = `${(u.nombre || '?')[0] || ''}${(u.apellido || '')[0] || ''}`.toUpperCase()
            const loSigo = idsSeguidos.includes(u.id)
            return (
              <button key={u.id} onClick={() => elegirMencion(u)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '9px 16px', cursor: 'pointer' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: u.foto_url ? `url(${u.foto_url}) center/cover` : T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: T.avatarTexto }}>{!u.foto_url && ini}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nombre}{u.apellido ? ` ${u.apellido}` : ''}</div>
                </div>
                {loSigo && <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, color: T.acento, border: `1px solid ${T.acento}66`, borderRadius: 7, padding: '2px 7px' }}>Sigues</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* Panel emoji (opcional) */}
      {panelEmoji && (
        <div style={{ flexShrink: 0, borderTop: `1px solid ${T.esClaro ? '#eceef1' : 'rgba(255,255,255,.08)'}`, background: T.esClaro ? '#fff' : 'rgba(12,14,18,.98)' }}>
          <div style={{ display: 'flex', gap: 2, padding: 6, overflowX: 'auto' }}>
            {Object.keys(EMOJIS_MC).map((cat) => (
              <button key={cat} onClick={() => setCatEmoji(cat)} style={{ border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', background: catEmoji === cat ? T.acento : 'transparent', color: catEmoji === cat ? '#1a1205' : T.tenue }}>{cat}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, padding: 8, maxHeight: 150, overflowY: 'auto' }}>
            {EMOJIS_MC[catEmoji].map((emo, i) => (
              <button key={i} onClick={() => meterEmoji(emo)} style={{ border: 'none', background: 'transparent', borderRadius: 8, padding: 6, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>{emo}</button>
            ))}
          </div>
        </div>
      )}

      {/* Barra de adjuntos (abajo, pegada al teclado) */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
        overflowX: 'auto', padding: '10px 14px',
        paddingBottom: kbAlto > 0 ? baseSolida : 'calc(env(safe-area-inset-bottom) + 10px)',
        borderTop: `1px solid ${T.esClaro ? '#e8e3d8' : 'rgba(232,182,79,.18)'}`,
        background: T.fondo || (T.esClaro ? '#f3eee3' : '#0a0b0e'),
        WebkitOverflowScrolling: 'touch',
      }}>
        <button onClick={() => setPanelEmoji((v) => !v)} style={{ flexShrink: 0, border: 'none', background: panelEmoji ? (T.esClaro ? '#f0e6cf' : 'rgba(234,182,79,.15)') : 'transparent', borderRadius: 10, padding: '6px 10px', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>😊</button>
        {adjuntos.map((a) => (
          <button key={a.id} onClick={a.id === 'resultado' && a.activo ? () => { cerrar(); onResultado && onResultado() } : avisarPronto} style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
            border: `1px solid ${T.esClaro ? '#e0e3e8' : 'rgba(255,255,255,.1)'}`,
            background: T.esClaro ? '#fff' : 'rgba(255,255,255,.04)',
            color: a.activo ? T.textoFuerte : T.tenue, borderRadius: 12, padding: '8px 12px',
            fontSize: 12.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', position: 'relative',
          }}>
            <span style={{ fontSize: a.icono === 'GIF' ? 10 : 15, fontWeight: 900 }}>{a.icono}</span>{a.txt}
            {!a.activo && <span style={{ fontSize: 8, fontWeight: 800, color: T.acento, marginLeft: 2 }}>•</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---- Lista de comentarios (solo la lista; la caja de escribir va anclada en DetallePublicacion) ----
function Comentarios({ lista, cargando, T, C }) {
  return (
    <div style={{ marginTop: 4, paddingTop: 12, borderTop: `1px solid ${T.esClaro ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.06)'}` }}>
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
                  <div style={{ fontSize: 13, color: T.subTexto || C.texto, marginTop: 2, lineHeight: 1.4, wordBreak: 'break-word' }}>{c.texto}</div>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

// ---- Hoja de comentarios (estilo Instagram: solo comentarios) ----
function HojaComentarios({ pub, T, C, haySesion, onCerrar, onPedirLogin, onCambio }) {
  const esEscritorio = typeof window !== 'undefined' && window.innerWidth >= 900
  const [comentarios, setComentarios] = useState([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)

  const cargar = async () => {
    const res = await leerComentarios(pub.id)
    setComentarios(res.data || [])
    setCargando(false)
  }
  useEffect(() => { cargar() }, [pub.id])

  const enviar = async () => {
    if (!haySesion) { onPedirLogin && onPedirLogin(); return }
    const limpio = texto.trim()
    if (!limpio) return
    setEnviando(true)
    const res = await comentar(pub.id, limpio)
    if (!res.error) {
      setTexto('')
      await cargar()
      onCambio && onCambio()
    } else {
      alert(res.error)
    }
    setEnviando(false)
  }

  const agregarEmoji = (em) => {
    setTexto((t) => (t + em).slice(0, 500))
  }

  // La hoja de comentarios va SIEMPRE oscura (coherente con el teclado, estilo
  // Instagram), sin importar el tema de la app. Solo el botón de enviar y los
  // avatares quedan dorados (la marca).
  const D = {
    esClaro: false,
    fondo: '#0c0d10',
    textoBody: '#ededed',
    textoFuerte: '#ffffff',
    subTexto: '#d8d8d8',
    tenue: '#8e8e93',
    borde: '#0c0d10',
    boton: 'linear-gradient(120deg, #fbe08a, #c8842e)',
    avatar: 'linear-gradient(135deg, #c8842e, #8a5a1e)',
    avatarTexto: '#1a1205',
  }

  const inputBg = 'rgba(255,255,255,0.06)'
  const inputBorde = 'rgba(255,255,255,0.16)'

  const pie = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, padding: '7px 14px 3px' }}>
        {['🏀', '🔥', '❤️', '👏', '😂', '😮', '💪', '🙌'].map((em) => (
          <button
            key={em}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => agregarEmoji(em)}
            style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', fontSize: 26, lineHeight: 1, padding: '4px 0', cursor: 'pointer' }}
          >
            {em}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '3px 14px 9px' }}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') enviar() }}
          placeholder={haySesion ? 'Escribe un comentario…' : 'Inicia sesión para comentar'}
          maxLength={500}
          style={{ flex: 1, minWidth: 0, background: inputBg, border: `1px solid ${inputBorde}`, borderRadius: 22, padding: '11px 15px', color: D.textoBody, fontSize: 16, outline: 'none' }}
        />
        <button onClick={enviar} disabled={enviando} style={{ flexShrink: 0, border: 'none', borderRadius: '50%', width: 44, height: 44, background: D.boton, color: '#1a1205', fontWeight: 800, fontSize: 17, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>{enviando ? '…' : '➤'}</button>
      </div>
    </div>
  )

  return (
    <BottomSheet T={D} esEscritorio={esEscritorio} titulo="Comentarios" onCerrar={onCerrar} pie={pie} expandido={true}>
      <div style={{ padding: '8px 16px 14px' }}>
        {cargando ? (
          <div style={{ textAlign: 'center', color: D.tenue, fontSize: 13, padding: '28px 0' }}>Cargando comentarios…</div>
        ) : comentarios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '46px 20px 36px' }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>💬</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: D.textoFuerte }}>Aún no hay comentarios</div>
            <div style={{ fontSize: 13, color: D.tenue, marginTop: 6 }}>Sé el primero en comentar. 🏀</div>
          </div>
        ) : (
          comentarios.map((c) => {
            const perf = c.perfiles || {}
            const nombre = perf.nombre ? `${perf.nombre}${perf.apellido ? ' ' + perf.apellido : ''}` : 'Usuario'
            return (
              <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: perf.foto_url ? `url(${perf.foto_url}) center/cover` : D.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: D.avatarTexto, flexShrink: 0 }}>
                  {!perf.foto_url && nombre.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: D.textoBody }}>{nombre} <span style={{ fontSize: 11, fontWeight: 400, color: D.tenue }}>· {haceCuanto(c.creado_en)}</span></div>
                  <div style={{ fontSize: 14, color: D.subTexto, marginTop: 2, lineHeight: 1.45, wordBreak: 'break-word' }}>{c.texto}</div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </BottomSheet>
  )
}

// ---- Ventana de DETALLE ----
function DetallePublicacion({ pub, T, C, ORO_TEXTO, haySesion, esMia, onCerrar, onPedirLogin, onReaccionar, miReaccion, onBorrar, onCambioComentarios }) {
  const esEscritorio = typeof window !== 'undefined' && window.innerWidth >= 900
  const tema = typeof window !== 'undefined' ? (localStorage.getItem('mc_tema') || 'dorado') : 'dorado'
  let datos = pub.datos || {}
  if (typeof datos === 'string') { try { datos = JSON.parse(datos) } catch (e) { datos = {} } }
  const esJuego = datos && datos.nombreA && datos.nombreB && (datos.totalA != null || (datos.jugadores && datos.jugadores.length))
  const fuenteJuego = datos.fuente || (pub.tipo === 'torneo' ? 'torneo' : pub.tipo === 'liga' ? 'liga' : 'rapido')

  // Colores del modal coherentes con el tema actual
  const modalFondo = T.esClaro ? '#f3eee3' : 'linear-gradient(180deg, #14161a, #0c0e12)'
  const modalTexto = T.textoBody
  const modalTenue = T.tenue
  const lineaModal = T.esClaro ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.07)'

  // ===== Comentarios: estado elevado para poder anclar la caja abajo =====
  const [comentarios, setComentarios] = useState([])
  const [textoComentario, setTextoComentario] = useState('')
  const [cargandoComentarios, setCargandoComentarios] = useState(true)
  const [enviandoComentario, setEnviandoComentario] = useState(false)

  const cargarComentarios = async () => {
    const res = await leerComentarios(pub.id)
    setComentarios(res.data || [])
    setCargandoComentarios(false)
  }
  useEffect(() => { cargarComentarios() }, [pub.id])

  const enviarComentario = async () => {
    if (!haySesion) { onPedirLogin && onPedirLogin(); return }
    const limpio = textoComentario.trim()
    if (!limpio) return
    setEnviandoComentario(true)
    const res = await comentar(pub.id, limpio)
    if (!res.error) {
      setTextoComentario('')
      await cargarComentarios()
      onCambioComentarios && onCambioComentarios()
    } else {
      alert(res.error)
    }
    setEnviandoComentario(false)
  }

  // ¿Compartir disponible en este dispositivo?
  const compartir = async () => {
    const titulo = pub.titulo || `${datos.nombreA || ''} vs ${datos.nombreB || ''}`.trim() || 'Media Cancha'
    const texto = esJuego ? `${datos.nombreA} ${datos.totalA} - ${datos.totalB} ${datos.nombreB} · vía Media Cancha 🏀` : (pub.texto || 'Mira esto en Media Cancha 🏀')
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo, text: texto })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(texto)
        alert('Copiado para compartir 📋')
      }
    } catch (e) { /* el usuario canceló */ }
  }

  const inputComentBg = T.esClaro ? '#fff' : 'rgba(12,14,18,0.7)'
  const inputComentBorde = T.esClaro ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.12)'

  return (
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, zIndex: 70, background: T.esClaro ? 'rgba(30,26,18,0.5)' : 'rgba(4,5,7,0.82)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: esEscritorio ? 'center' : 'flex-end', justifyContent: 'center', padding: esEscritorio ? 20 : 0 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: esEscritorio ? '88dvh' : '92dvh', display: 'flex', flexDirection: 'column', borderRadius: esEscritorio ? 20 : '20px 20px 0 0', padding: 1.5, background: T.borde, overflow: 'hidden' }}>
        <div style={{ borderRadius: esEscritorio ? 19 : '19px 19px 0 0', background: modalFondo, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>

          {/* cabecera del modal (FIJA arriba) */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${lineaModal}` }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: modalTexto, flex: 1 }}>Publicación</span>
            {esMia && <span onClick={onBorrar} title="Eliminar" style={{ fontSize: 17, color: '#e0563f', cursor: 'pointer', padding: '2px 6px' }}>🗑️</span>}
            <span onClick={onCerrar} style={{ fontSize: 24, color: modalTenue, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>×</span>
          </div>

          {/* ZONA QUE CORRE: tarjeta + reacciones + lista de comentarios */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '14px 16px 14px' }}>
            {esJuego ? (
              <div style={{ marginBottom: 16 }}>
                <TarjetaResultado
                  datos={datos}
                  fuente={fuenteJuego}
                  tiempo={haceCuanto(pub.creado_en)}
                  autorNombre={`${pub.autor_nombre || 'Usuario'}${pub.autor_apellido ? ' ' + pub.autor_apellido : ''}`}
                  autorFoto={pub.autor_foto}
                  comentario={pub.texto && !pub.texto.startsWith('Ganaron') && !pub.texto.startsWith('Quedaron') ? pub.texto.split('\n')[0] : null}
                  temaForzado={tema}
                />
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: pub.autor_foto ? `url(${pub.autor_foto}) center/cover` : T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: T.avatarTexto, flexShrink: 0 }}>
                    {!pub.autor_foto && ((pub.autor_nombre || '?').slice(0, 1).toUpperCase())}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: modalTexto }}>{pub.autor_nombre || 'Usuario'}{pub.autor_apellido ? ` ${pub.autor_apellido}` : ''}</div>
                    <div style={{ fontSize: 11, color: modalTenue }}>{haceCuanto(pub.creado_en)}</div>
                  </div>
                </div>
                {pub.titulo && <div style={{ fontSize: 18, fontWeight: 800, color: modalTexto, lineHeight: 1.2, marginBottom: 8 }}>{pub.titulo}</div>}
                {datos.fondo && FONDOS_PUB[datos.fondo] ? (
                  <div style={{ position: 'relative', minHeight: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 16, background: `url(${FONDOS_PUB[datos.fondo]}) center/cover`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,9,12,.35), rgba(8,9,12,.62))' }} />
                    <div style={{ position: 'relative', padding: 24, textAlign: 'center', color: '#fff', fontSize: 24, fontWeight: 800, lineHeight: 1.3, textShadow: '0 2px 12px rgba(0,0,0,.6)', wordBreak: 'break-word' }}>{pub.texto}</div>
                  </div>
                ) : (
                  pub.texto && <div style={{ fontSize: 14.5, color: modalTexto, lineHeight: 1.6, marginBottom: 16 }}>{resaltarTexto(pub.texto, T.acento, null)}</div>
                )}
              </>
            )}

            {/* barra de reacciones + compartir */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '12px 0', borderTop: `1px solid ${lineaModal}`, borderBottom: `1px solid ${lineaModal}`, marginBottom: 14, flexWrap: 'wrap' }}>
              <div onClick={() => onReaccionar(pub.id, 'like')} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: miReaccion === 'like' ? T.acento : modalTenue, fontSize: 14, fontWeight: 700 }}>
                <span style={{ fontSize: 17 }}>{miReaccion === 'like' ? '❤️' : '🤍'}</span> {pub.likes || 0}
              </div>
              <div onClick={() => onReaccionar(pub.id, 'dislike')} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: miReaccion === 'dislike' ? '#e0563f' : modalTenue, fontSize: 14, fontWeight: 700 }}>
                <span style={{ fontSize: 17 }}>👎</span> {pub.dislikes || 0}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: modalTenue, fontSize: 14, fontWeight: 700 }}>
                <span style={{ fontSize: 17 }}>💬</span> {comentarios.length || pub.num_comentarios || 0}
              </div>
              <button onClick={compartir} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, border: 'none', borderRadius: 10, padding: '9px 16px', background: T.boton, color: '#1a1205', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                <span style={{ fontSize: 15 }}>↗</span> Compartir
              </button>
            </div>

            {/* lista de comentarios (la caja de escribir va anclada abajo, fuera del scroll) */}
            <Comentarios lista={comentarios} cargando={cargandoComentarios} T={T} C={C} />
          </div>

          {/* CAJA DE COMENTAR (ANCLADA abajo; sube con el teclado) */}
          <div style={{ flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', borderTop: `1px solid ${lineaModal}`, background: T.esClaro ? 'rgba(255,255,255,.55)' : 'rgba(8,9,12,.55)' }}>
            <input
              value={textoComentario}
              onChange={(e) => setTextoComentario(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') enviarComentario() }}
              placeholder={haySesion ? 'Escribe un comentario…' : 'Inicia sesión para comentar'}
              maxLength={500}
              style={{ flex: 1, minWidth: 0, background: inputComentBg, border: `1px solid ${inputComentBorde}`, borderRadius: 22, padding: '11px 15px', color: T.textoBody, fontSize: 16, outline: 'none' }}
            />
            <button onClick={enviarComentario} disabled={enviandoComentario} style={{ flexShrink: 0, border: 'none', borderRadius: '50%', width: 44, height: 44, background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 17, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>{enviandoComentario ? '…' : '➤'}</button>
          </div>

        </div>
      </div>
    </div>
  )
}

// ---- Selector de plantilla ----
function SelectorPlantilla({ T, C, ORO_TEXTO, esEscritorio, usuarioPago, onCancelar, onConfirmar }) {
  const [elegida, setElegida] = useState(PLANTILLA_DEFAULT)
  const [texto, setTexto] = useState('')
  const [verPlantillas, setVerPlantillas] = useState(false)
  const plantSel = PLANTILLAS.find((p) => p.id === elegida)
  const usandoTema = elegida === PLANTILLA_DEFAULT

  const elegir = (p) => {
    if (puedeUsar(p, usuarioPago)) setElegida(p.id)
    else alert('Esta plantilla es premium. Desbloquéala con cualquier forma de pago para usar todas.')
  }

  const fondoModal = T.esClaro ? 'rgba(30,26,18,0.55)' : 'rgba(4,5,7,0.85)'
  const cajaInterior = T.esClaro ? '#fff' : 'linear-gradient(180deg, #14161a, #0c0e12)'
  const inputBg = T.esClaro ? 'rgba(0,0,0,.03)' : 'rgba(12,14,18,0.7)'
  const inputBorde = T.esClaro ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.12)'

  return (
    <div onClick={onCancelar} style={{ position: 'fixed', inset: 0, zIndex: 80, background: fondoModal, backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: esEscritorio ? 'center' : 'flex-end', justifyContent: 'center', padding: esEscritorio ? 20 : 0 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '90dvh', display: 'flex', flexDirection: 'column', borderRadius: esEscritorio ? 20 : '20px 20px 0 0', padding: 1.5, background: T.borde }}>
        <div style={{ borderRadius: esEscritorio ? 19 : '19px 19px 0 0', background: cajaInterior, padding: '18px 16px 20px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: T.textoFuerte }}>Publicar en el Techado</span>
            <span onClick={onCancelar} style={{ fontSize: 24, color: C.tenue, cursor: 'pointer', lineHeight: 1 }}>×</span>
          </div>
          <div style={{ fontSize: 12, color: C.tenue, marginBottom: 16 }}>Así se verá tu publicación.</div>

          {/* VISTA PREVIA estilo tarjeta del tema (default) */}
          {usandoTema ? (
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 16, border: `1px solid ${T.esClaro ? '#34291a' : T.navActivoBorde}`, backgroundImage: `url(${T.barraImg})`, backgroundSize: 'cover', backgroundPosition: 'center right', boxShadow: T.esClaro ? '0 12px 30px rgba(18,14,8,.2)' : '0 12px 30px rgba(0,0,0,.4)' }}>
              <div style={{ position: 'absolute', inset: 0, background: T.scrimCarnet }} />
              <div style={{ position: 'absolute', inset: 9, borderRadius: 9, border: `1.5px dashed ${T.esClaro ? 'rgba(234,182,79,.4)' : 'rgba(234,182,79,.3)'}`, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1, color: '#7adfa6', background: 'rgba(47,191,113,.16)', border: '1px solid rgba(47,191,113,.4)', borderRadius: 20, padding: '3px 10px', textTransform: 'uppercase' }}>🏀 Resultado de juego</span>
                  <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}><span style={{ color: '#dfe2e6' }}>MEDIA</span><span style={ORO_TEXTO}>CANCHA</span></span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,.7)', lineHeight: 1.35 }}>{texto.trim() ? texto : 'El resultado del juego aparecerá aquí, con el marcador y el jugador destacado.'}</div>
                <div style={{ marginTop: 12, height: 3, width: 54, borderRadius: 3, background: T.navDorada }} />
              </div>
            </div>
          ) : (
            plantSel && plantSel.img && (
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 16, height: 130, background: `linear-gradient(180deg, rgba(8,9,12,.25) 0%, rgba(8,9,12,.85) 100%), url(${plantSel.img}) center/cover`, display: 'flex', alignItems: 'flex-end', padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textShadow: '0 1px 5px rgba(0,0,0,.9)' }}>{texto.trim() ? texto : 'Vista previa del fondo'}</div>
              </div>
            )
          )}

          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.tenue, marginBottom: 6 }}>Agrega un comentario (opcional)</div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, 200))}
            placeholder="Escribe algo sobre el juego…"
            rows={2}
            style={{ width: '100%', boxSizing: 'border-box', background: inputBg, border: `1px solid ${inputBorde}`, borderRadius: 10, padding: '10px 12px', color: T.textoFuerte, fontSize: 13.5, outline: 'none', resize: 'none', marginBottom: 14, fontFamily: 'inherit' }}
          />

          {/* botón discreto para personalizar fondo */}
          {!verPlantillas ? (
            <button onClick={() => setVerPlantillas(true)} style={{ width: '100%', marginBottom: 16, borderRadius: 11, padding: '11px', background: 'transparent', border: `1px dashed ${T.esClaro ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.18)'}`, color: C.tenue, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>
              🎨 Personalizar fondo {!usandoTema && '· (1 elegido)'}
            </button>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.tenue }}>Elige un fondo</span>
                <span onClick={() => { setElegida(PLANTILLA_DEFAULT); setVerPlantillas(false) }} style={{ fontSize: 11.5, color: T.acento, cursor: 'pointer', fontWeight: 700 }}>← Volver al estilo del tema</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {/* opción tema (default) dentro de la cuadrícula */}
                <div onClick={() => setElegida(PLANTILLA_DEFAULT)} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '3/4', cursor: 'pointer', border: usandoTema ? `2px solid ${T.acento}` : '2px solid transparent', backgroundImage: `url(${T.barraImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div style={{ position: 'absolute', inset: 0, background: T.scrimCarnet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: T.acento, textAlign: 'center', padding: 4 }}>ESTILO<br />DEL TEMA</div>
                  {usandoTema && <div style={{ position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: T.acento, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#1a1205', fontWeight: 800 }}>✓</div>}
                </div>
                {PLANTILLAS.filter((p) => p.id !== PLANTILLA_DEFAULT).map((p) => {
                  const disponible = puedeUsar(p, usuarioPago)
                  const seleccionada = elegida === p.id
                  return (
                    <div key={p.id} onClick={() => elegir(p)} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '3/4', cursor: 'pointer', border: seleccionada ? `2px solid ${T.acento}` : '2px solid transparent', background: p.img ? `url(${p.img}) center/cover` : 'linear-gradient(150deg,#23262c,#15171b)', opacity: disponible ? 1 : 0.85 }}>
                      {!p.img && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#9aa7b2', textAlign: 'center', padding: 4 }}>{p.nombre}</div>}
                      {!disponible && <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,5,7,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔒</div>}
                      {seleccionada && <div style={{ position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: T.acento, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#1a1205', fontWeight: 800 }}>✓</div>}
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize: 11, color: C.tenue, textAlign: 'center', marginTop: 12 }}>🔒 Las premium se desbloquean con cualquier forma de pago.</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancelar} style={{ flex: 1, borderRadius: 12, padding: 13, background: 'transparent', border: `1px solid ${inputBorde}`, color: C.tenue, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={() => onConfirmar(elegida, texto.trim())} style={{ flex: 2, borderRadius: 12, padding: 13, background: T.boton, border: 'none', color: '#1a1205', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>↗ Publicar</button>
          </div>
        </div>
      </div>
    </div>
  )
}