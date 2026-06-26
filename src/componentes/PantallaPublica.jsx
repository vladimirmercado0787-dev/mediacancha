import { useState, useEffect, useLayoutEffect, useRef, Component } from 'react'
import { Capacitor } from '@capacitor/core'
import { getNoticias as getNoticiasNBA } from './nbaApi'
import { createPortal } from 'react-dom'
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
import RecortadorFoto from './RecortadorFoto'
import CompartirAlChat from './CompartirAlChat'
import { supabase } from '../supabaseClient'
import { alternarSeguir, idsQueSigo, statsSociales } from '../social'
import { contarNoLeidos, listaConversaciones, perfilesDe } from '../mensajes'
import { leerTorneos } from '../torneos'
import BottomSheet from './BottomSheet'

const TEMAS = {
  noche: {
    esClaro: false,
    nombre: 'Cancha de noche',
    fondo: '#070f26',
    textoFuerte: '#eef3fc',
    textoBody: '#eef3fc',
    tenue: '#8a9bc0',
    subTexto: '#c2cce0',
    vidrio: 'linear-gradient(120deg, rgba(22,40,92,0.72), rgba(14,28,68,0.78))',
    scrimCarnet: 'linear-gradient(90deg, rgba(7,13,29,0.92) 0%, rgba(7,13,29,0.62) 45%, rgba(7,13,29,0.15) 75%, transparent 100%)',
    headerBg: 'rgba(7,13,29,0.82)',
    veloGrad: 'linear-gradient(180deg, rgba(7,15,38,0.74) 0%, rgba(6,12,31,0.92) 100%)',
    navDorada: 'linear-gradient(180deg,#5a86e0,#3e6bd6 55%,#274a9a)',
    barraImg: fondoTarjetaMiembro,
    acento: '#3e6bd6',
    borde: 'linear-gradient(140deg,#9fb5ea,#3e6bd6 40%,#274a9a 70%,#9fb5ea)',
    texto: 'linear-gradient(120deg,#9fb9f2,#3e6bd6)',
    balon: ['#9fb9f2', '#3e6bd6', '#274a9a'],
    avatar: 'linear-gradient(150deg, #5a86e0, #274a9a)',
    avatarTexto: '#ffffff',
    boton: 'linear-gradient(150deg, #5a86e0, #3e6bd6)',
    glow: 'rgba(62,107,214,0.20)',
    navActivoBg: 'rgba(62,107,214,.15)',
    navActivoBorde: 'rgba(62,107,214,.4)',
  },
  dia: {
    esClaro: true,
    nombre: 'Cancha de día',
    fondo: '#eef2fa',
    textoFuerte: '#13224a',
    textoBody: '#1f2e54',
    tenue: '#8b97b2',
    subTexto: '#46557a',
    vidrio: 'linear-gradient(135deg, #ffffff, #f3f6ff 60%, #eaf0fc)',
    scrimCarnet: 'linear-gradient(100deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0.12) 75%, transparent 100%)',
    headerBg: 'rgba(255,255,255,0.9)',
    veloGrad: 'linear-gradient(90deg, rgba(248,250,254,0.9) 0%, rgba(248,250,254,0.7) 45%, rgba(248,250,254,0.6) 100%)',
    navDorada: 'linear-gradient(180deg,#3a63c8,#1b3a8c 55%,#12285f)',
    barraImg: barraMiembroClara,
    acento: '#1b3a8c',
    borde: 'linear-gradient(140deg,#cfdcf6,#1b3a8c 55%,#cfdcf6)',
    texto: 'linear-gradient(120deg,#2a52a8,#1b3a8c)',
    balon: ['#3a63c8', '#1b3a8c', '#12285f'],
    avatar: 'linear-gradient(150deg, #3a63c8, #12285f)',
    avatarTexto: '#ffffff',
    boton: 'linear-gradient(150deg, #3a63c8, #1b3a8c)',
    glow: 'rgba(27,58,140,0.08)',
    navActivoBg: 'rgba(27,58,140,.10)',
    navActivoBorde: 'rgba(27,58,140,.22)',
  },
  dorado: {
    esClaro: false,
    nombre: 'Dorado',
    fondo: '#0e0b06',
    textoFuerte: '#f6efe1',
    textoBody: '#f6efe1',
    tenue: '#a08e6f',
    subTexto: '#dccdb0',
    vidrio: 'linear-gradient(120deg,#2a2110,#1c1509 50%,#120d05)',
    scrimCarnet: 'linear-gradient(90deg, rgba(14,11,6,0.92) 0%, rgba(14,11,6,0.62) 45%, rgba(14,11,6,0.15) 75%, transparent 100%)',
    headerBg: 'rgba(20,16,9,0.84)',
    veloGrad: 'linear-gradient(180deg, rgba(20,16,9,0.74) 0%, rgba(14,11,6,0.92) 100%)',
    navDorada: 'linear-gradient(180deg,#f0c674,#e8b65a 55%,#caa24a)',
    barraImg: fondoTarjetaMiembro,
    acento: '#e8b65a',
    borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)',
    texto: 'linear-gradient(120deg,#f0c674,#caa24a)',
    balon: ['#f0c674', '#caa24a', '#8a6a22'],
    avatar: 'linear-gradient(150deg, #e0b057, #9a6420)',
    avatarTexto: '#211705',
    boton: 'linear-gradient(150deg, #f3cf63, #caa24a)',
    glow: 'rgba(232,182,79,0.16)',
    navActivoBg: 'rgba(232,182,79,.14)',
    navActivoBorde: 'rgba(232,182,79,.4)',
  },
  larimar: {
    esClaro: false,
    nombre: 'Larimar',
    fondo: '#03121a',
    textoFuerte: '#e8fbff',
    textoBody: '#e8fbff',
    tenue: '#79b4bd',
    subTexto: '#b9e6ec',
    vidrio: 'linear-gradient(120deg,#0c3a44,#082a32 50%,#04181f)',
    scrimCarnet: 'linear-gradient(90deg, rgba(4,24,31,0.92) 0%, rgba(4,24,31,0.62) 45%, rgba(4,24,31,0.15) 75%, transparent 100%)',
    headerBg: 'rgba(4,24,31,0.84)',
    veloGrad: 'linear-gradient(180deg, rgba(7,36,43,0.74) 0%, rgba(3,18,26,0.92) 100%)',
    navDorada: 'linear-gradient(180deg,#56d6dd,#3fc1c9 55%,#2ba6ae)',
    barraImg: barraMiembroLarimar,
    acento: '#3fc1c9',
    borde: 'linear-gradient(140deg,#7fe0e6,#3fc1c9 40%,#1a6a8a 70%,#7fe0e6)',
    texto: 'linear-gradient(120deg,#7fe0e6,#3fc1c9)',
    balon: ['#7fe0e6', '#3fc1c9', '#1a6a8a'],
    avatar: 'linear-gradient(150deg, #56d6dd, #1a6a8a)',
    avatarTexto: '#04222a',
    boton: 'linear-gradient(150deg, #56d6dd, #2ba6ae)',
    glow: 'rgba(63,193,201,0.18)',
    navActivoBg: 'rgba(63,193,201,.16)',
    navActivoBorde: 'rgba(63,193,201,.42)',
  },
  negro: {
    esClaro: false,
    nombre: 'Negro puro',
    fondo: '#000000',
    textoFuerte: '#ffffff',
    textoBody: '#ffffff',
    tenue: '#7d818c',
    subTexto: '#cfd2db',
    vidrio: 'linear-gradient(120deg,#141622,#0c0d14 50%,#050507)',
    scrimCarnet: 'linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.62) 45%, rgba(0,0,0,0.15) 75%, transparent 100%)',
    headerBg: 'rgba(0,0,0,0.86)',
    veloGrad: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.94) 100%)',
    navDorada: 'linear-gradient(180deg,#6f95f3,#4d7cf0 55%,#3a5fc0)',
    barraImg: fondoTarjetaMiembro,
    acento: '#4d7cf0',
    borde: 'linear-gradient(140deg, rgba(255,255,255,0.3),#4d7cf0 50%, rgba(255,255,255,0.2))',
    texto: 'linear-gradient(120deg,#7f9ff5,#4d7cf0)',
    balon: ['#7f9ff5', '#4d7cf0', '#3a5fc0'],
    avatar: 'linear-gradient(150deg, #6f95f3, #3a5fc0)',
    avatarTexto: '#ffffff',
    boton: 'linear-gradient(150deg, #6f95f3, #4d7cf0)',
    glow: 'rgba(77,124,240,0.16)',
    navActivoBg: 'rgba(77,124,240,.16)',
    navActivoBorde: 'rgba(77,124,240,.45)',
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
  { id: 'invitaciones', txt: '✉️ Mis invitaciones' },
  { id: 'misLigas', txt: '🤝 Mis ligas' },
]
// Solo crear torneo/liga (para el botón "Crear ▾" de la fila; "Armar juego" va aparte)
const CREAR_DROPDOWN = [
  { id: 'crearTorneo', txt: '🏆 Crear torneo' },
  { id: 'crearLiga', txt: '🤝 Crear liga' },
]

// Modal de estadística de un jugador (hoja inferior, se dibuja sobre todo vía portal).
// Reusado por el carrusel de destacados y por el carrusel de rankings.
function ModalJugadorMC({ jug, onClose, T, escritorio }) {
  if (!jug) return null
  const ini = (jug.nombre || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return createPortal((
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(4,5,7,.95)', display: 'flex', alignItems: escritorio ? 'center' : 'flex-end', justifyContent: 'center', padding: escritorio ? 20 : 0 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: T.esClaro ? '#f4f6f8' : '#14161a', borderRadius: escritorio ? 20 : '20px 20px 0 0', border: `1px solid ${T.navActivoBorde}`, padding: escritorio ? '18px 20px 22px' : '14px 18px calc(env(safe-area-inset-bottom) + 22px)', maxHeight: '88dvh', overflowY: 'auto' }}>
        {!escritorio && <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 8px' }} />}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><span onClick={onClose} style={{ fontSize: 24, color: T.tenue, cursor: 'pointer', lineHeight: 1 }}>×</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 66, height: 66, borderRadius: '50%', flexShrink: 0, boxShadow: `0 0 0 2px ${T.acento}`, background: jug.foto ? `url(${jug.foto}) center/cover` : (T.esClaro ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.06)'), display: 'grid', placeItems: 'center', fontFamily: '"Arial Narrow", Impact, sans-serif', fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: T.acento }}>{!jug.foto && ini}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: '"Arial Narrow", Impact, sans-serif', fontStyle: 'italic', fontWeight: 700, fontSize: 26, lineHeight: 1, textTransform: 'uppercase', color: T.textoFuerte }}>{jug.nombre}</div>
            <div style={{ fontSize: 12, color: T.subTexto, marginTop: 4, fontWeight: 600 }}>{[jug.liga, jug.equipo, jug.pos].filter(Boolean).join(' · ')}{jug.num != null ? ` · #${jug.num}` : ''}</div>
          </div>
          {jug.rating != null && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: '"Arial Narrow", Impact, sans-serif', fontStyle: 'italic', fontWeight: 700, fontSize: 34, lineHeight: 0.85, color: T.acento }}>{jug.rating}</div>
              <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: 1.2, color: '#ce1126', marginTop: 2 }}>MC RATING</div>
            </div>
          )}
        </div>
        {jug.stats && jug.stats.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {jug.stats.map((s, k) => (
              <div key={k} style={{ flex: 1, background: T.esClaro ? 'rgba(0,0,0,.03)' : 'rgba(255,255,255,.05)', border: `1px solid ${T.navActivoBorde}`, borderRadius: 12, padding: '11px 6px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Arial Narrow", Impact, sans-serif', fontWeight: 700, fontSize: 22, color: T.acento, fontStyle: 'italic' }}>{s[0]}</div>
                <div style={{ fontSize: 8.5, color: T.tenue, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 3 }}>{s[1]}</div>
              </div>
            ))}
          </div>
        )}
        {jug.label && <div style={{ textAlign: 'center', fontSize: 10.5, color: T.tenue, marginTop: 16, fontWeight: 600 }}>★ {jug.label}</div>}
      </div>
    </div>
  ), document.body)
}

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
  // móvil: barra de arriba que se esconde al leer (con transform, sin reflow) + Inicio que sube al tope
  const refScrollMovil = useRef(null)
  const refBarraTop = useRef(null)
  const refNavBottom = useRef(null)
  const ultimoScrollMovil = useRef(0)
  const tickBarra = useRef(false)        // throttle por frame
  const barraVisibleRef = useRef(true)   // espejo del estado
  const [altoBarraTop, setAltoBarraTop] = useState(0)
  const [altoNav, setAltoNav] = useState(0)
  const [barraTopVisible, setBarraTopVisible] = useState(true)
  const mostrarBarra = (v) => {
    if (barraVisibleRef.current === v) return
    barraVisibleRef.current = v
    setBarraTopVisible(v)
  }
  const alScrollMovil = () => {
    if (tickBarra.current) return
    tickBarra.current = true
    requestAnimationFrame(() => {
      tickBarra.current = false
      const el = refScrollMovil.current
      if (!el) return
      const y = el.scrollTop
      if (y <= 0) { ultimoScrollMovil.current = 0; mostrarBarra(true); return }  // rebote/tope iOS: siempre mostrar
      const dy = y - ultimoScrollMovil.current
      if (Math.abs(dy) < 10) return                                              // histéresis: ignora micro-movimientos
      ultimoScrollMovil.current = y
      if (dy > 0) mostrarBarra(false)                                            // bajando (leyendo): esconder
      else mostrarBarra(true)                                                    // subiendo: mostrar
    })
  }
  const irAlTopeMovil = () => {
    mostrarBarra(true)
    const el = refScrollMovil.current
    if (!el) return
    const desde = el.scrollTop
    if (desde <= 0) { ultimoScrollMovil.current = 0; return }
    const t0 = performance.now()
    const dur = 300
    const paso = (t) => {
      const p = Math.min(1, (t - t0) / dur)
      const e = 1 - Math.pow(1 - p, 3)   // easeOutCubic
      if (refScrollMovil.current) refScrollMovil.current.scrollTop = desde * (1 - e)
      if (p < 1) requestAnimationFrame(paso)
      else if (refScrollMovil.current) { refScrollMovil.current.scrollTop = 0; ultimoScrollMovil.current = 0 }
    }
    requestAnimationFrame(paso)
  }
  const [statsSoc, setStatsSoc] = useState({ seguidores: 0, siguiendo: 0 })
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [torneosAbierto, setTorneosAbierto] = useState(false)
  const [likes, setLikes] = useState({})
  const [tema, setTema] = useState(() => {
    const validos = ['noche', 'dia', 'dorado', 'larimar', 'negro']
    if (typeof window !== 'undefined') {
      const g = localStorage.getItem('mc_tema')
      return validos.includes(g) ? g : 'noche'
    }
    return 'noche'
  })
  const [juegosDia, setJuegosDia] = useState([])
  const [torneosReales, setTorneosReales] = useState([])
  const [seccion, setSeccion] = useState('feed')   // 'feed' | 'rankings'
  const [tabRank, setTabRank] = useState('nba')     // 'nba' | 'lnb' | 'general'
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
  const [visorFotos, setVisorFotos] = useState(null)  // { fotos: [...], inicio: 0 }
  const [compartirResultado, setCompartirResultado] = useState(null)  // datos del juego a compartir al chat
  const [comentariosDe, setComentariosDe] = useState(null)
  const [juegoAPublicar, setJuegoAPublicar] = useState(null)
  const [textoComposer, setTextoComposer] = useState('')
  const [fondoComposer, setFondoComposer] = useState(0)
  const [publicandoTexto, setPublicandoTexto] = useState(false)
  const [composerAbierto, setComposerAbierto] = useState(false)
  const [fotosComposer, setFotosComposer] = useState([])  // [{ blob, previa }] fotos elegidas para publicar

  // Destacados de la semana para el carrusel de arriba. Hoy se nutre de la LNB
  // (jugador de la semana, líderes y portada de noticias). Mañana se le enchufan
  // más ligas y torneos: solo es agregar fuentes a esta misma lista.
  const [destacados, setDestacados] = useState([])
  useEffect(() => {
    let vivo = true
    const lnbImg = (u) => (u ? (String(u).startsWith('http') ? u : 'https://lnb-media.sfo3.cdn.digitaloceanspaces.com/' + u) : null)
    ;(async () => {
      try {
        const { data: temps } = await supabase.from('lnb_temporadas').select('*').order('year', { ascending: false })
        const actual = (temps || []).find((t) => t.current) || (temps || [])[0]
        if (!actual) return
        const [eqR, jsR, ldR, jtR, jgR, ntR] = await Promise.all([
          supabase.from('lnb_equipos').select('*'),
          supabase.from('lnb_jugador_semana').select('*').limit(1),
          supabase.from('lnb_lideres').select('*').eq('temporada_id', actual.id).eq('rank', 1),
          supabase.from('lnb_jugador_temporada').select('*').eq('temporada_id', actual.id),
          supabase.from('lnb_jugadores').select('*'),
          supabase.from('lnb_noticias').select('*').order('created_at', { ascending: false }).limit(3),
        ])
        const eMap = {}; (eqR.data || []).forEach((e) => { eMap[e.id] = e })
        const nomEq = (id) => eMap[id]?.name || ''
        const jMap = {}; (jgR.data || []).forEach((p) => { jMap[p.id] = p })
        const sMap = {}; (jtR.data || []).forEach((s) => { sMap[s.jugador_id] = s })
        const effDe = (s) => {
          if (!s) return 0
          const e = Number(s.efficiency)
          if (s.efficiency != null && !Number.isNaN(e) && e > 0) return e
          return (Number(s.points) || 0) + (Number(s.rebounds) || 0) + (Number(s.assists) || 0) + (Number(s.steals) || 0) + (Number(s.blocks) || 0) - (Number(s.turnovers) || 0)
        }
        const maxEff = Math.max(1, ...(jtR.data || []).map(effDe))
        const ratingDe = (jid) => { const s = sMap[jid]; return s ? Math.round(100 * Math.pow(Math.max(0, effDe(s)) / maxEff, 0.85)) : null }
        const f1 = (v) => (v == null || v === '' ? null : Number(v).toFixed(1).replace(/\.0$/, ''))
        const cartaBase = (jid, extra) => {
          const p = jMap[jid] || extra || {}
          const s = sMap[jid] || {}
          const stats = [[f1(s.points), 'Puntos'], [f1(s.rebounds), 'Rebotes'], [f1(s.assists), 'Asist.'], [f1(s.efficiency), 'Efic.']].filter((x) => x[0] != null)
          return {
            nombre: [p.nombre, p.apellido].filter(Boolean).join(' ') || 'Jugador',
            foto: lnbImg(p.image_url),
            equipo: nomEq(p.equipo_id || s.equipo_id),
            pos: p.posicion_nombre || null, num: p.shirt_number != null ? p.shirt_number : null,
            rating: ratingDe(jid), stats,
          }
        }
        const cards = []
        const js = (jsR.data || [])[0]
        if (js) {
          const jid = js.jugador_id || js.id
          const base = cartaBase(jid, js)
          // respaldo a los campos del propio registro si no hay stats por temporada
          if (!base.stats.length) {
            base.stats = [[f1(js.points), 'Puntos'], [f1(js.rebounds), 'Rebotes'], [f1(js.assists), 'Asist.'], [f1(js.efficiency), 'Efic.']].filter((x) => x[0] != null)
          }
          if (base.rating == null && js.rating != null) base.rating = js.rating
          if (!base.foto) base.foto = lnbImg(js.image_url)
          cards.push({ tipo: 'semana', label: js.label || 'Jugador de la semana', ...base })
        }
        ;(ntR.data || []).slice(0, 2).forEach((n) => cards.push({
          tipo: 'noticia', titulo: n.title, resumen: n.excerpt, foto: lnbImg(n.image_url),
        }))
        // ---- inyectar noticias de la NBA (lo más importante) ----
        try {
          const nbaNews = await getNoticiasNBA()
          ;(nbaNews || []).slice(0, 3).forEach((n) => cards.push({
            tipo: 'noticia', liga: 'NBA',
            titulo: n.titulo, resumen: n.resumen || (n.cuerpo ? String(n.cuerpo).slice(0, 130) : ''),
            foto: n.imagen || n.foto || null, enlace: n.enlace || null,
          }))
        } catch (e) { /* si la NBA no carga, seguimos con la LNB */ }

        // barajar para que salga aleatorio cada vez
        for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = cards[i]; cards[i] = cards[j]; cards[j] = t }

        if (vivo) setDestacados(cards)
      } catch (e) { /* si la LNB aún no tiene datos, el carrusel simplemente no sale */ }
    })()
    return () => { vivo = false }
  }, [])

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

  useLayoutEffect(() => {
    const medir = () => {
      setAltoBarraTop(refBarraTop.current ? refBarraTop.current.offsetHeight : 0)
      setAltoNav(refNavBottom.current ? refNavBottom.current.offsetHeight : 0)
    }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [esEscritorio, haySesion])

  // iOS: el #root tiene su propio scroll con inercia (para pantallas viejas).  // En móvil eso choca con el scroll interno de esta pantalla y rompe el rebote
  // inferior. Lo apagamos mientras esta pantalla está montada; se restaura al salir.
  useEffect(() => {
    if (esEscritorio) return
    const root = document.getElementById('root')
    if (!root) return
    root.style.overflowY = 'hidden'
    root.style.setProperty('-webkit-overflow-scrolling', 'auto')
    return () => {
      root.style.overflowY = ''
      root.style.setProperty('-webkit-overflow-scrolling', 'touch')
    }
  }, [esEscritorio])

  useEffect(() => {
    setJuegosDia(leerHistorialDia())
    recargarTechado()
    miUsuarioId().then((id) => setMiId(id))
    if (haySesion) miPerfilCompleto().then((p) => setMiPerfil(p))
    leerTorneos().then(({ torneos }) => setTorneosReales(torneos || [])).catch(() => {})
  }, [])

  // Cerrar los menús desplegables (de escritorio) al hacer clic fuera.
  // OJO: el menú móvil (menuAbierto) NO va aquí; en iOS este "oído" agarra
  // el mismo toque con que se abre y lo cierra de una. Ese se cierra con una
  // capa invisible detrás (más abajo en la vista móvil).
  useEffect(() => {
    if (!masAbierto && !crearAbierto && !torneosAbierto) return
    const cerrar = () => { setMasAbierto(false); setCrearAbierto(false); setTorneosAbierto(false) }
    window.addEventListener('click', cerrar)
    return () => window.removeEventListener('click', cerrar)
  }, [masAbierto, crearAbierto, torneosAbierto])

  useEffect(() => {
    const hayModal = pubAbierta || verHistorialDia || juegoAPublicar
    if (!hayModal) return
    // Bloqueo de scroll SEGURO para iOS (el mismo que usa el visor de fotos).
    // NO usar body position:fixed: en el WebView de iOS deja la pantalla negra
    // y sin poder cerrar el modal.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
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
    const hayFotos = fotosComposer.length > 0
    if ((!txt && !hayFotos) || publicandoTexto) return
    setPublicandoTexto(true)
    try {
      const { publicarTexto } = await import('../techado')
      const { subirFotoPublicacion } = await import('../fotos')
      // Mapeo del índice de plantilla al identificador que se guarda
      const NOMBRES_FONDO = [null, 'balon_dorado', 'aro_atardecer', 'cancha_barrio_noche', 'cancha_madera', 'monumento_santiago']
      const fondoElegido = fondoComposer > 0 ? NOMBRES_FONDO[fondoComposer] : null

      // Subir las fotos elegidas (si hay)
      let urls = []
      if (hayFotos) {
        for (const f of fotosComposer) {
          const r = await subirFotoPublicacion(f.blob)
          if (r && r.url) urls.push(r.url)
        }
      }

      const res = await publicarTexto({ texto: txt, imagenes: urls.length ? urls : null, fondo: urls.length ? null : fondoElegido })
      if (res.error) {
        alert('No se pudo publicar: ' + res.error)
      } else {
        setTextoComposer('')
        setFondoComposer(0)
        // liberar las previas y limpiar
        fotosComposer.forEach((f) => { try { URL.revokeObjectURL(f.previa) } catch (e) {} })
        setFotosComposer([])
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
    const orden = ['noche', 'dia', 'dorado', 'larimar', 'negro']
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

  const ListaTorneos = () => {
    if (!torneosReales.length) {
      return <Placa radio={15} pad={18}><div style={{ textAlign: 'center', color: C.tenue, fontSize: 13 }}>Todavía no hay torneos creados.</div></Placa>
    }
    const colorNivel = (n) => {
      const m = { superior: '#e0a64b', intermedio: '#d88f3a', libre: '#2fbf71', campo: '#2fbf71', femenino: '#c4823a' }
      return m[String(n || '').toLowerCase()] || T.acento
    }
    return (<>{torneosReales.map((t, i) => {
      const col = colorNivel(t.nivel)
      return (
        <div key={t.id || i} onClick={() => click('torneos')} style={{ marginBottom: 10, cursor: 'pointer' }}>
          <Placa radio={15} pad={13}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0, background: T.esClaro ? 'rgba(176,122,38,.12)' : 'linear-gradient(150deg, rgba(50,46,40,.6), rgba(18,18,20,.6))', border: `1px solid ${T.navActivoBorde}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{t.emoji || <Balon size={28} sw={4} gid={`gtb${i}`} cols={T.balon} />}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: C.texto }}>{t.nombre}</div>
                <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>📍 {t.lugar || 'Sin sede'} · {t.cantidad_equipos || 0} equipos
                  {t.nivel && <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 7, textTransform: 'uppercase', color: col, background: `${col}26` }}>{t.nivel}</span>}
                </div>
              </div>
              <div style={{ fontSize: 24, color: T.acento, flexShrink: 0, lineHeight: 1 }}>›</div>
            </div>
          </Placa>
        </div>
      )
    })}</>)
  }

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
              <button onClick={() => setCompartirResultado(datos)} style={accionBtn(T.esClaro ? '#565c66' : '#aeb6c0')}><span style={{ fontSize: 14 }}>↗</span> Compartir</button>
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
                autorId={p.autor_id}
                onIrPerfil={(id) => onAccion && onAccion('verPerfil:' + id)}
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
        const fotosPub = (Array.isArray(datos.imagenes) && datos.imagenes.length) ? datos.imagenes : (fotoPub ? [fotoPub] : [])
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

              {/* FOTO(S) de la publicación (si hay) */}
              {fotosPub.length > 0 && (
                <CarruselFotos fotos={fotosPub} onAbrir={(i) => setVisorFotos({ fotos: fotosPub, inicio: i || 0 })} />
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
        <LimiteDetalle onCerrar={() => setPubAbierta(null)}>
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
            onAccion={onAccion}
          />
        </LimiteDetalle>
      )}
      {visorFotos && (
        <VisorFotos fotos={visorFotos.fotos} inicio={visorFotos.inicio} onCerrar={() => setVisorFotos(null)} />
      )}
      {compartirResultado && (
        <CompartirAlChat
          datos={compartirResultado}
          tema={{ acento: T.acento, boton: T.boton }}
          onCerrar={() => setCompartirResultado(null)}
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
          onAccion={onAccion}
        />
      )}
      {verHistorialDia && (
        <div onClick={() => setVerHistorialDia(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(4,5,7,0.95)', display: 'flex', alignItems: esEscritorio ? 'center' : 'flex-end', justifyContent: 'center', padding: esEscritorio ? 20 : 0 }}>
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

  const MensajesCard = () => {
    const [convs, setConvs] = useState(null)
    const [perfs, setPerfs] = useState({})
    useEffect(() => {
      let vivo = true
      ;(async () => {
        try {
          const lista = await listaConversaciones()
          const top3 = (lista || []).slice(0, 3)
          if (!vivo) return
          setConvs(top3)
          const ids = top3.map((c) => c.otroId).filter(Boolean)
          if (ids.length) { const m = await perfilesDe(ids); if (vivo) setPerfs(m) }
        } catch (e) { if (vivo) setConvs([]) }
      })()
      return () => { vivo = false }
    }, [haySesion])
    const nombreP = (p) => [p?.nombre, p?.apellido].filter(Boolean).join(' ') || 'Jugador'
    const iniP = (p) => (nombreP(p) || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    const resumen = (m) => {
      if (!m) return ''
      if (m.borrado_todos) return 'Mensaje eliminado'
      if (m.tipo === 'foto') return '📷 Foto'
      if (m.tipo === 'audio' || m.tipo === 'voz') return '🎤 Nota de voz'
      if (m.tipo === 'resultado') return '📊 Resultado'
      return m.texto || ''
    }
    return (
      <Tarjeta titulo="Mensajes" accion={{ txt: 'Ver todo →', fn: () => click('mensajes') }}>
        <div style={{ padding: '6px 8px 10px' }}>
          {convs === null ? (
            <div style={{ padding: '12px 8px', fontSize: 12.5, color: T.tenue }}>Cargando…</div>
          ) : convs.length === 0 ? (
            <div onClick={() => click('mensajes')} style={{ padding: '12px 8px', fontSize: 12.5, color: T.tenue, cursor: 'pointer', lineHeight: 1.5 }}>
              {haySesion ? 'Aún no tienes conversaciones. Busca un jugador y escríbele.' : 'Inicia sesión para ver tus mensajes.'}
            </div>
          ) : convs.map((c) => {
            const p = perfs[c.otroId]
            const mio = c.ultimo && miId && c.ultimo.de_id === miId
            const sinLeer = c.noLeidos > 0
            return (
              <div key={c.otroId} onClick={() => onAccion && onAccion('chatCon:' + c.otroId)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 8px', borderRadius: 11, cursor: 'pointer' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p?.foto_url ? `url(${p.foto_url}) center/cover` : T.avatar, color: T.avatarTexto, fontWeight: 700, fontSize: 13 }}>{!p?.foto_url && iniP(p)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13, fontWeight: 700, color: T.textoFuerte, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreP(p)}</b>
                  <small style={{ fontSize: 11.5, color: sinLeer ? T.acento : T.tenue, fontWeight: sinLeer ? 700 : 400, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mio ? 'Tú: ' : ''}{resumen(c.ultimo)}</small>
                </div>
                {sinLeer && <span style={{ flexShrink: 0, minWidth: 18, height: 18, borderRadius: 9, background: T.acento, color: '#1a1205', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center', padding: '0 5px' }}>{c.noLeidos}</span>}
              </div>
            )
          })}
        </div>
      </Tarjeta>
    )
  }

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

  // Barra "abridora": NO se escribe aquí. Al tocarla, abre la pantalla
  // independiente PantallaPublicar (vista 'publicar'), que es la buena: fija,
  // pantalla completa, con su botón Publicar. Se acabó el compositor inline.
  const Composer = () => (
    <div onClick={() => click('publicar')} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 2px', padding: '13px 16px', borderRadius: 16, cursor: 'pointer', background: T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.04)', border: `1px solid ${T.navActivoBorde}`, boxShadow: T.esClaro ? '0 2px 10px rgba(60,40,8,.08)' : 'none' }}>
      <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: miPerfil?.foto_url ? `url(${miPerfil.foto_url}) center/cover` : T.boton, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: T.avatarTexto, boxShadow: `0 0 0 2px ${T.acento}` }}>{!miPerfil?.foto_url && ((miPerfil?.nombre || '?')[0] || '').toUpperCase()}</div>
      <span style={{ flex: 1, fontSize: 15, color: T.tenue, fontWeight: 600 }}>¿Qué está pasando en la cancha?</span>
      <span style={{ flexShrink: 0, fontSize: 19 }}>📷</span>
    </div>
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
      <div onClick={() => setAnotarAbierto(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.86)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
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

  // Fila de historias "En la cancha" (estilo del mockup; datos de muestra por ahora)
  const Historias = () => {
    const items = [
      { tipo: 'add', nm: 'Tu jugada' },
      { tipo: 'live', sig: 'JÍC', nm: 'En vivo', g: 'linear-gradient(135deg,#d23048,#8a1020)' },
      { sig: 'MET', nm: 'Metros', g: 'linear-gradient(135deg,#2a4fa8,#16224a)' },
      { sig: 'LEO', nm: 'Leones', g: 'linear-gradient(135deg,#1f9d63,#127041)' },
      { sig: 'VAL', nm: 'Copa Val.', g: 'linear-gradient(135deg,#caa24a,#8a6a22)' },
      { sig: 'TIT', nm: 'Titanes', g: 'linear-gradient(135deg,#d23048,#8a1020)' },
    ]
    return (
      <div style={{ marginTop: 16 }}>
        <style>{`@keyframes mcPulseHl{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.32);opacity:0}} .mc-hl-scroll::-webkit-scrollbar{display:none}`}</style>
        <SecHead titulo="En la cancha" accion={{ txt: 'Ver todo →', fn: () => click('techado') }} />
        <div className="mc-hl-scroll" style={{ display: 'flex', gap: 13, overflowX: 'auto', padding: '2px 2px 4px', scrollbarWidth: 'none' }}>
          {items.map((it, i) => (
            <div key={i} style={{ flexShrink: 0, width: 60, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', padding: 2.5, display: 'grid', placeItems: 'center', position: 'relative', background: it.tipo === 'add' ? T.vidrio : it.tipo === 'live' ? 'linear-gradient(135deg,#e4263c,#ce1126)' : `conic-gradient(from 220deg, #e4263c, ${T.acento}, ${T.acento}, #e4263c)`, border: it.tipo === 'add' ? `1px dashed ${T.navActivoBorde}` : 'none' }}>
                {it.tipo === 'live' && <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '2px solid #e4263c', animation: 'mcPulseHl 1.8s ease-out infinite' }} />}
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: it.tipo === 'add' ? 24 : 15, color: it.tipo === 'add' ? T.tenue : '#fff', border: it.tipo === 'add' ? 'none' : `2.5px solid ${T.fondo}`, background: it.tipo === 'add' ? 'transparent' : (it.g || T.avatar), fontStyle: it.tipo === 'add' ? 'normal' : 'italic' }}>
                  {it.tipo === 'add' ? '+' : it.sig}
                </div>
              </div>
              {it.tipo === 'live'
                ? <div style={{ marginTop: 4, display: 'inline-block', fontSize: 8.5, fontWeight: 800, letterSpacing: 0.5, color: '#fff', background: '#e4263c', padding: '1px 6px', borderRadius: 20, textTransform: 'uppercase' }}>{it.nm}</div>
                : <div style={{ marginTop: 5, fontSize: 10, color: T.subTexto, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.nm}</div>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Tarjeta "Jugador de la semana" (estilo del mockup; datos de muestra hasta tener el rating)
  const CarruselDestacados = () => {
    const [activo, setActivo] = useState(0)
    const [jugSel, setJugSel] = useState(null) // jugador con su estadística abierta
    const [notSel, setNotSel] = useState(null) // noticia abierta
    const refCar = useRef(null)
    if (!destacados.length) return null
    const total = destacados.length
    const alScroll = (e) => {
      const el = e.currentTarget; if (!el.firstChild) return
      const w = el.firstChild.offsetWidth + 12
      setActivo(Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / w))))
    }
    const mover = (dir) => { const el = refCar.current; if (!el || !el.firstChild) return; el.scrollBy({ left: dir * (el.firstChild.offsetWidth + 12), behavior: 'smooth' }) }
    const chrome = (key, children, onClick) => (
      <div key={key} onClick={onClick} style={{ scrollSnapAlign: 'start', flex: esEscritorio ? '0 0 calc(50% - 6px)' : '0 0 88%', maxWidth: esEscritorio ? 'none' : 460, cursor: 'pointer' }}>
        <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', border: `1px solid ${T.navActivoBorde}`, background: T.vidrio, minHeight: 196, boxShadow: T.esClaro ? '0 12px 30px rgba(20,24,30,.1)' : '0 14px 34px rgba(0,0,0,.4)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, display: 'flex', zIndex: 3 }}><i style={{ flex: 1, background: '#1b3a8c' }} /><i style={{ flex: 1, background: '#fff' }} /><i style={{ flex: 1, background: '#ce1126' }} /></div>
          {children}
        </div>
      </div>
    )
    const cardJugador = (c, i) => chrome(i, <>
      {c.rating != null && (
        <div style={{ position: 'absolute', top: 12, right: 14, textAlign: 'center', zIndex: 3, background: T.navActivoBg, border: `1px solid ${T.navActivoBorde}`, borderRadius: 15, padding: '5px 12px 6px' }}>
          <div style={{ fontFamily: '"Arial Narrow", Impact, sans-serif', fontStyle: 'italic', fontWeight: 700, fontSize: 38, lineHeight: 0.82, color: T.acento }}>{c.rating}</div>
          <div style={{ fontFamily: '"Arial Narrow", Impact, sans-serif', fontWeight: 700, fontSize: 8, letterSpacing: 1.5, color: '#ce1126', marginTop: 2 }}>MC RATING</div>
        </div>
      )}
      <div style={{ position: 'relative', zIndex: 2, padding: '15px 16px 16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start', fontFamily: '"Arial Narrow", Impact, sans-serif', fontStyle: 'italic', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10, color: T.acento, background: T.navActivoBg, border: `1px solid ${T.navActivoBorde}`, padding: '4px 10px', borderRadius: 30 }}>★ {c.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 13 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', display: 'grid', placeItems: 'center', boxShadow: `0 0 0 2px ${T.acento}`, background: c.foto ? `url(${c.foto}) center/cover` : (T.esClaro ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.06)') }}>
            {!c.foto && <svg width="36" height="36" viewBox="0 0 24 24" fill={T.tenue}><path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 1.6c-3.4 0-6.4 1.8-6.4 4.6V20h12.8v-1.8c0-2.8-3-4.6-6.4-4.6z" /></svg>}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: '"Arial Narrow", Impact, sans-serif', fontStyle: 'italic', fontWeight: 700, fontSize: 26, lineHeight: 0.95, textTransform: 'uppercase', color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nombre || 'Jugador'}</div>
            <div style={{ fontSize: 11.5, color: T.subTexto, marginTop: 4, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[c.equipo, c.pos].filter(Boolean).join(' · ')}{c.num != null && <> · <b style={{ color: T.acento }}>#{c.num}</b></>}</div>
          </div>
        </div>
        {c.stats && c.stats.length > 0 && (
          <div style={{ display: 'flex', gap: 7, marginTop: 'auto', paddingTop: 14 }}>
            {c.stats.map((s, k) => (
              <div key={k} style={{ flex: 1, background: T.esClaro ? 'rgba(0,0,0,.03)' : 'rgba(255,255,255,.05)', border: `1px solid ${T.navActivoBorde}`, borderRadius: 10, padding: '7px 5px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Arial Narrow", Impact, sans-serif', fontWeight: 700, fontSize: 18, color: T.acento, fontStyle: 'italic' }}>{s[0]}</div>
                <div style={{ fontSize: 8, color: T.tenue, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>{s[1]}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>, () => setJugSel(c))
    const cardNoticia = (c, i) => chrome(i, <>
      {c.foto && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${c.foto})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 1, opacity: 0.55 }} />}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: T.esClaro ? 'linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,.92))' : 'linear-gradient(180deg, rgba(8,10,14,.35), rgba(8,10,14,.92))', zIndex: 2 }} />
      <div style={{ position: 'relative', zIndex: 3, padding: '15px 16px 16px', minHeight: 196, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <span style={{ alignSelf: 'flex-start', fontFamily: '"Arial Narrow", Impact, sans-serif', fontStyle: 'italic', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10, color: '#fff', background: c.liga === 'NBA' ? '#98002E' : '#ce1126', padding: '4px 10px', borderRadius: 30, marginBottom: 'auto' }}>{c.liga ? c.liga : 'Noticia'}</span>
        <div style={{ fontFamily: '"Arial Narrow", Impact, sans-serif', fontStyle: 'italic', fontWeight: 700, fontSize: 24, lineHeight: 1, textTransform: 'uppercase', color: T.textoFuerte }}>{c.titulo || 'Noticia'}</div>
        {c.resumen && <div style={{ fontSize: 12, color: T.subTexto, marginTop: 6, fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.resumen}</div>}
      </div>
    </>, () => setNotSel(c))
    return (
      <>
      <div style={{ marginTop: 18 }}>
        <div style={{ position: 'relative' }}>
          <div ref={refCar} onScroll={alScroll} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', margin: '0 -2px', padding: '0 2px' }}>
            {destacados.map((c, i) => c.tipo === 'noticia' ? cardNoticia(c, i) : cardJugador(c, i))}
          </div>
          {esEscritorio && total > 1 && (
            <>
              <button onClick={() => mover(-1)} aria-label="Anterior" style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: 40, height: 40, borderRadius: '50%', border: `1px solid ${T.navActivoBorde}`, background: T.esClaro ? 'rgba(255,255,255,.92)' : 'rgba(14,14,18,.86)', color: T.textoFuerte, fontSize: 24, lineHeight: 1, cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.3)', backdropFilter: 'blur(6px)' }}>‹</button>
              <button onClick={() => mover(1)} aria-label="Siguiente" style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: 40, height: 40, borderRadius: '50%', border: `1px solid ${T.navActivoBorde}`, background: T.esClaro ? 'rgba(255,255,255,.92)' : 'rgba(14,14,18,.86)', color: T.textoFuerte, fontSize: 24, lineHeight: 1, cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.3)', backdropFilter: 'blur(6px)' }}>›</button>
            </>
          )}
        </div>
        {total > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            {destacados.map((_, i) => <span key={i} style={{ width: i === activo ? 18 : 6, height: 6, borderRadius: 3, background: i === activo ? T.acento : T.navActivoBorde, transition: 'width .2s' }} />)}
          </div>
        )}
      </div>

      <ModalJugadorMC jug={jugSel} onClose={() => setJugSel(null)} T={T} escritorio={esEscritorio} />

      {notSel && createPortal((
        <div onClick={() => setNotSel(null)} style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(4,5,7,.95)', display: 'flex', alignItems: esEscritorio ? 'center' : 'flex-end', justifyContent: 'center', padding: esEscritorio ? 20 : 0 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: T.esClaro ? '#f4f6f8' : '#14161a', borderRadius: esEscritorio ? 20 : '20px 20px 0 0', border: `1px solid ${T.navActivoBorde}`, maxHeight: '88dvh', overflowY: 'auto' }}>
            {notSel.foto && <div style={{ width: '100%', height: 180, background: `#000 url(${notSel.foto}) center/cover` }} />}
            <div style={{ padding: esEscritorio ? '15px 18px 20px' : '15px 18px calc(env(safe-area-inset-bottom) + 22px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: '"Arial Narrow", Impact, sans-serif', fontStyle: 'italic', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10, color: '#fff', background: notSel.liga === 'NBA' ? '#98002E' : '#ce1126', padding: '4px 10px', borderRadius: 30 }}>{notSel.liga ? notSel.liga : 'Noticia'}</span>
                <span onClick={() => setNotSel(null)} style={{ fontSize: 24, color: T.tenue, cursor: 'pointer', lineHeight: 1 }}>×</span>
              </div>
              <div style={{ fontFamily: '"Arial Narrow", Impact, sans-serif', fontStyle: 'italic', fontWeight: 700, fontSize: 26, lineHeight: 1.05, textTransform: 'uppercase', color: T.textoFuerte }}>{notSel.titulo}</div>
              {notSel.resumen && <div style={{ fontSize: 14, color: T.subTexto, marginTop: 10, fontWeight: 500, lineHeight: 1.6 }}>{notSel.resumen}</div>}
              {notSel.enlace && (
                <a href={notSel.enlace} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 16, fontFamily: '"Arial Narrow", Impact, sans-serif', fontStyle: 'italic', fontWeight: 700, fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase', color: '#fff', background: notSel.liga === 'NBA' ? 'linear-gradient(135deg, #98002E, #D31B3C)' : '#ce1126', padding: '11px 20px', borderRadius: 12, textDecoration: 'none' }}>Leer la noticia ›</a>
              )}
            </div>
          </div>
        </div>
      ), document.body)}
      </>
    )
  }

  // Carrusel de rankings de la NBA: desliza entre categorías; cada jugador es cliqueable.
  const RankingsNBA = () => {
    const [cats, setCats] = useState(null)
    const [sel, setSel] = useState(null)
    const [activo, setActivo] = useState(0)
    useEffect(() => {
      let vivo = true
      ;(async () => {
        try {
          const [rS, rMax] = await Promise.all([
            supabase.from('nba_stats_temporada').select('*').eq('temporada', 2026),
            supabase.rpc('nba_max_eff'),
          ])
          const st = rS.data || []
          if (!st.length) return
          let maxEff = Number(rMax.data); if (!maxEff || Number.isNaN(maxEff)) maxEff = 50
          const eff = (s) => (Number(s.puntos) || 0) + (Number(s.rebotes) || 0) + (Number(s.asistencias) || 0) + (Number(s.robos) || 0) + (Number(s.tapones) || 0) - (Number(s.perdidas) || 0)
          const rat = (s) => Math.round(100 * Math.pow(Math.max(0, eff(s)) / Math.max(1, maxEff), 0.85))
          const ids = [...new Set(st.map((s) => s.jugador_id))]
          const jmap = {}
          for (let i = 0; i < ids.length; i += 300) { const rJ = await supabase.from('nba_jugadores').select('id,nombre,equipo_abv,posicion').in('id', ids.slice(i, i + 300)); (rJ.data || []).forEach((j) => { jmap[j.id] = j }) }
          const f1 = (v) => (v == null ? '-' : Number(v).toFixed(1).replace(/\.0$/, ''))
          const fichaDe = (s) => { const p = jmap[s.jugador_id] || {}; return { nombre: p.nombre || 'Jugador', equipo: p.equipo_abv || '', pos: p.posicion || null, liga: 'NBA', rating: rat(s), stats: [[f1(s.puntos), 'Puntos'], [f1(s.rebotes), 'Rebotes'], [f1(s.asistencias), 'Asist.'], [String(Math.round(eff(s))), 'Efic.']] } }
          const fila = (s, val) => { const p = jmap[s.jugador_id] || {}; return { nombre: p.nombre || 'Jugador', equipo: p.equipo_abv || '', val, ficha: fichaDe(s) } }
          const top = (k, fmt) => [...st].filter((x) => (k === 'rating' ? true : Number(x[k]) > 0)).sort((a, b) => (k === 'rating' ? rat(b) - rat(a) : (Number(b[k]) || 0) - (Number(a[k]) || 0))).slice(0, 5).map((s) => fila(s, k === 'rating' ? rat(s) : fmt(s)))
          const lista = [
            { titulo: 'ADN MC', unidad: 'RATING', filas: top('rating') },
            { titulo: 'Puntos', unidad: 'PTS', filas: top('puntos', (s) => f1(s.puntos)) },
            { titulo: 'Rebotes', unidad: 'REB', filas: top('rebotes', (s) => f1(s.rebotes)) },
            { titulo: 'Asistencias', unidad: 'AST', filas: top('asistencias', (s) => f1(s.asistencias)) },
            { titulo: 'Robos', unidad: 'ROB', filas: top('robos', (s) => f1(s.robos)) },
            { titulo: 'Tapones', unidad: 'TAP', filas: top('tapones', (s) => f1(s.tapones)) },
          ].filter((c) => c.filas.length > 0)
          if (vivo) setCats(lista)
        } catch (e) { /* si la NBA no carga, no sale */ }
      })()
      return () => { vivo = false }
    }, [])
    const refRk = useRef(null)
    if (!cats || !cats.length) return null
    const total = cats.length
    const alScroll = (e) => { const el = e.currentTarget; if (!el.firstChild) return; const w = el.firstChild.offsetWidth + 12; setActivo(Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / w)))) }
    const ini = (nom) => (nom || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    const moverRk = (dir) => { const el = refRk.current; if (!el || !el.firstChild) return; el.scrollBy({ left: dir * (el.firstChild.offsetWidth + 12), behavior: 'smooth' }) }
    return (
      <>
      <div style={{ position: 'relative' }}>
      <div ref={refRk} onScroll={alScroll} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', margin: '0 -2px', padding: '0 2px' }}>
        {cats.map((cat, ci) => (
          <div key={ci} style={{ scrollSnapAlign: 'start', flex: esEscritorio ? '0 0 100%' : '0 0 88%', maxWidth: esEscritorio ? 'none' : 460 }}>
            <div style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${T.navActivoBorde}`, background: T.vidrio }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', borderBottom: `1px solid ${T.navActivoBorde}`, background: 'linear-gradient(135deg, rgba(152,0,46,.18), rgba(211,27,60,.05))' }}>
                <span style={{ fontFamily: '"Arial Narrow", Impact, sans-serif', fontStyle: 'italic', fontWeight: 700, fontSize: 17, textTransform: 'uppercase', color: T.textoFuerte, letterSpacing: 0.4 }}>🏀 {cat.titulo}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: T.acento, textTransform: 'uppercase' }}>NBA · {cat.unidad}</span>
              </div>
              <div style={{ padding: 6 }}>
                {cat.filas.map((f, idx) => (
                  <div key={idx} onClick={() => setSel(f.ficha)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 8px', cursor: 'pointer', borderBottom: idx < cat.filas.length - 1 ? (T.esClaro ? '1px solid rgba(0,0,0,.07)' : '1px solid rgba(255,255,255,.06)') : 'none' }}>
                    <div style={{ width: 20, textAlign: 'center', fontFamily: '"Arial Narrow", Impact, sans-serif', fontWeight: 900, fontSize: 17, color: idx < 3 ? T.acento : T.tenue }}>{idx + 1}</div>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: T.avatar, color: T.avatarTexto, fontSize: 11, fontWeight: 800 }}>{ini(f.nombre)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.nombre}</div>
                      <div style={{ fontSize: 10.5, color: T.subTexto }}>{f.equipo}</div>
                    </div>
                    <div style={{ fontFamily: '"Arial Narrow", Impact, sans-serif', fontWeight: 900, fontSize: 19, fontStyle: 'italic', color: T.acento }}>{f.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      {esEscritorio && total > 1 && (
        <>
          <button onClick={() => moverRk(-1)} aria-label="Anterior" style={{ position: 'absolute', left: 2, top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.navActivoBorde}`, background: T.esClaro ? 'rgba(255,255,255,.94)' : 'rgba(14,14,18,.9)', color: T.textoFuerte, fontSize: 22, lineHeight: 1, cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 3px 12px rgba(0,0,0,.3)' }}>‹</button>
          <button onClick={() => moverRk(1)} aria-label="Siguiente" style={{ position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.navActivoBorde}`, background: T.esClaro ? 'rgba(255,255,255,.94)' : 'rgba(14,14,18,.9)', color: T.textoFuerte, fontSize: 22, lineHeight: 1, cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 3px 12px rgba(0,0,0,.3)' }}>›</button>
        </>
      )}
      </div>
      {total > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {cats.map((_, i) => <span key={i} style={{ width: i === activo ? 18 : 6, height: 6, borderRadius: 3, background: i === activo ? T.acento : T.navActivoBorde, transition: 'width .2s' }} />)}
        </div>
      )}
      <ModalJugadorMC jug={sel} onClose={() => setSel(null)} T={T} escritorio={esEscritorio} />
      </>
    )
  }

  // ===== Rankings LNB (data real de lnb_lideres) =====
  const RankingsLNB = () => {
    const [cats, setCats] = useState(null)
    const [activo, setActivo] = useState(0)
    useEffect(() => {
      let vivo = true
      ;(async () => {
        try {
          const [rl, re, rt] = await Promise.all([
            supabase.from('lnb_lideres').select('*').order('rank', { ascending: true }),
            supabase.from('lnb_equipos').select('*'),
            supabase.from('lnb_temporadas').select('id,year').order('year', { ascending: false }),
          ])
          const lideres = rl.data || []
          const eqMap = {}
          ;(re.data || []).forEach((e) => { eqMap[e.id] = e.nombre || e.name || '' })
          const temps = rt.data || []
          let tempId = temps.length ? temps[0].id : null
          const conData = temps.find((t) => lideres.some((l) => l.temporada_id === t.id))
          if (conData) tempId = conData.id
          const DEF = [
            { id: 'points', titulo: 'Puntos', unidad: 'PTS' },
            { id: 'rebounds', titulo: 'Rebotes', unidad: 'REB' },
            { id: 'assists', titulo: 'Asistencias', unidad: 'AST' },
            { id: 'steals', titulo: 'Robos', unidad: 'ROB' },
            { id: 'blocks', titulo: 'Tapones', unidad: 'TAP' },
          ]
          const armadas = DEF.map((c) => {
            const filas = lideres
              .filter((l) => l.categoria === c.id && (tempId == null || l.temporada_id === tempId))
              .sort((a, b) => (a.rank || 999) - (b.rank || 999))
              .slice(0, 5)
              .map((l) => ({
                nombre: [l.nombre, l.apellido].filter(Boolean).join(' ') || l.nombre || '—',
                equipo: eqMap[l.equipo_id] || '',
                val: l.average != null ? Number(l.average).toFixed(1) : (l.total != null ? l.total : '—'),
              }))
            return filas.length ? { ...c, filas } : null
          }).filter(Boolean)
          if (vivo) setCats(armadas)
        } catch (e) { if (vivo) setCats([]) }
      })()
      return () => { vivo = false }
    }, [])
    const refLnb = useRef(null)
    if (!cats || !cats.length) return null
    const total = cats.length
    const alScroll = (e) => { const el = e.currentTarget; if (!el.firstChild) return; const w = el.firstChild.offsetWidth + 12; setActivo(Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / w)))) }
    const ini = (nom) => (nom || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    const moverLnb = (dir) => { const el = refLnb.current; if (!el || !el.firstChild) return; el.scrollBy({ left: dir * (el.firstChild.offsetWidth + 12), behavior: 'smooth' }) }
    return (
      <>
      <div style={{ position: 'relative' }}>
      <div ref={refLnb} onScroll={alScroll} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', margin: '0 -2px', padding: '0 2px' }}>
        {cats.map((cat, ci) => (
          <div key={ci} style={{ scrollSnapAlign: 'start', flex: esEscritorio ? '0 0 100%' : '0 0 88%', maxWidth: esEscritorio ? 'none' : 460 }}>
            <div style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${T.navActivoBorde}`, background: T.vidrio }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', borderBottom: `1px solid ${T.navActivoBorde}`, background: 'linear-gradient(135deg, rgba(27,58,140,.18), rgba(27,58,140,.04))' }}>
                <span style={{ fontFamily: '"Arial Narrow", Impact, sans-serif', fontStyle: 'italic', fontWeight: 700, fontSize: 17, textTransform: 'uppercase', color: T.textoFuerte, letterSpacing: 0.4 }}>🇩🇴 {cat.titulo}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#2d5bd1', textTransform: 'uppercase' }}>LNB · {cat.unidad}</span>
              </div>
              <div style={{ padding: 6 }}>
                {cat.filas.map((f, idx) => (
                  <div key={idx} onClick={() => click('lnb')} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 8px', cursor: 'pointer', borderBottom: idx < cat.filas.length - 1 ? (T.esClaro ? '1px solid rgba(0,0,0,.07)' : '1px solid rgba(255,255,255,.06)') : 'none' }}>
                    <div style={{ width: 20, textAlign: 'center', fontFamily: '"Arial Narrow", Impact, sans-serif', fontWeight: 900, fontSize: 17, color: idx < 3 ? '#2d5bd1' : T.tenue }}>{idx + 1}</div>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: T.avatar, color: T.avatarTexto, fontSize: 11, fontWeight: 800 }}>{ini(f.nombre)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.nombre}</div>
                      <div style={{ fontSize: 10.5, color: T.subTexto }}>{f.equipo}</div>
                    </div>
                    <div style={{ fontFamily: '"Arial Narrow", Impact, sans-serif', fontWeight: 900, fontSize: 19, fontStyle: 'italic', color: '#2d5bd1' }}>{f.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      {esEscritorio && total > 1 && (
        <>
          <button onClick={() => moverLnb(-1)} aria-label="Anterior" style={{ position: 'absolute', left: 2, top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.navActivoBorde}`, background: T.esClaro ? 'rgba(255,255,255,.94)' : 'rgba(14,14,18,.9)', color: T.textoFuerte, fontSize: 22, lineHeight: 1, cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 3px 12px rgba(0,0,0,.3)' }}>‹</button>
          <button onClick={() => moverLnb(1)} aria-label="Siguiente" style={{ position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.navActivoBorde}`, background: T.esClaro ? 'rgba(255,255,255,.94)' : 'rgba(14,14,18,.9)', color: T.textoFuerte, fontSize: 22, lineHeight: 1, cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 3px 12px rgba(0,0,0,.3)' }}>›</button>
        </>
      )}
      </div>
      {total > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {cats.map((_, i) => <span key={i} style={{ width: i === activo ? 18 : 6, height: 6, borderRadius: 3, background: i === activo ? '#2d5bd1' : T.navActivoBorde, transition: 'width .2s' }} />)}
        </div>
      )}
      </>
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
                {[{ id: 'inicio', txt: 'Inicio' }, { id: 'ligas', txt: 'Ligas' }, { id: 'techado', txt: 'El Techado' }, { id: 'torneos', txt: 'Torneos' }, { id: 'rankings', txt: 'Rankings' }, { id: 'mapa', txt: 'Mapa' }].map((n) => {
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
              <MensajesCard />
            </aside>
          )}
          {/* COLUMNA CENTRO: EL TECHADO (protagonista) */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!haySesion && <Bienvenida grande />}
            <CarruselDestacados />
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
            <Tarjeta titulo="Rankings NBA" accion={{ txt: 'Ver todo →', fn: () => click('nba') }}>
              <div style={{ padding: '4px 8px 12px' }}><RankingsNBA /></div>
            </Tarjeta>
            <Tarjeta titulo="Rankings LNB" accion={{ txt: 'Ver todo →', fn: () => click('lnb') }}>
              <div style={{ padding: '4px 8px 12px' }}><RankingsLNB /></div>
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh', color: C.texto, fontFamily: C.font, background: T.fondo, overflow: 'hidden' }}>
      <Velo />
      {/* BARRA FIJA inmóvil: cubre desde el reloj/isla y no se mueve nunca */}
      <div ref={refBarraTop} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, background: T.fondo, paddingTop: 'calc(env(safe-area-inset-top) - 4px)', transform: barraTopVisible ? 'translateY(0)' : `translateY(-${altoBarraTop}px)`, transition: 'transform .25s cubic-bezier(.4,0,.2,1)', willChange: 'transform' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '6px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Logo chico />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div onClick={() => click('buscar')} title="Buscar" style={{ width: 40, height: 40, borderRadius: 11, background: T.esClaro ? '#ffffff' : 'rgba(255,255,255,.06)', border: `1px solid ${T.navActivoBorde}`, boxShadow: T.esClaro ? '0 2px 10px rgba(60,40,8,.16)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={T.acento} strokeWidth="2"/><path d="m20 20-3.2-3.2" stroke={T.acento} strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
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
              {/* Tema (movido aquí desde la barra superior para despejarla) */}
              <button onClick={cambiarTema} title="Toca para cambiar de tema" style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: C.texto, fontSize: 14, fontWeight: 700, padding: '12px', borderRadius: 9, cursor: 'pointer' }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: T.boton, display: 'inline-block', flexShrink: 0, boxShadow: `0 0 0 1.5px ${T.navActivoBorde}` }} />
                Tema: {T.nombre}
              </button>
              <div style={{ height: 1, background: T.navActivoBorde, opacity: 0.55, margin: '4px 8px 6px' }} />
              {[{ id: 'buscar', txt: '🔍 Buscar personas' }, { id: 'perfil', txt: '◉ Mi perfil' }, ...ACCIONES_CREAR, ...ACCIONES_MIAS, ...(haySesion ? [{ id: 'cerrarSesion', txt: '↩ Cerrar sesión' }] : [{ id: 'registro', txt: '✦ Crear mi cuenta gratis' }, { id: 'entrar', txt: '→ Iniciar sesión' }])].map((a) => (
                <button key={a.id} onClick={() => click(a.id)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: C.texto, fontSize: 14, fontWeight: 600, padding: '12px', borderRadius: 9, cursor: 'pointer' }}>{a.txt}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Capa invisible: cierra el menú móvil al tocar afuera. A prueba de iOS
          porque es un elemento real (no un 'oído' global), a nivel de pantalla
          y fuera de la barra transformada. */}
      {menuAbierto && (
        <div onClick={() => setMenuAbierto(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 35, background: 'transparent' }} />
      )}

      {/* SOLO esta área hace scroll, por debajo de la barra fija */}
      <div ref={refScrollMovil} onScroll={alScrollMovil} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: altoNav, zIndex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none', contain: 'content', transform: 'translateZ(0)', willChange: 'scroll-position' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '4px 16px 90px', position: 'relative', zIndex: 1, transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', willChange: 'transform' }}>
        <div style={{ height: altoBarraTop }} />
        {seccion === 'rankings' ? (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.texto, margin: '4px 2px 12px' }}>Rankings</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[{ id: 'nba', txt: 'NBA' }, { id: 'lnb', txt: 'LNB' }, { id: 'general', txt: 'General' }].map((tb) => (
                <button key={tb.id} onClick={() => setTabRank(tb.id)} style={{ flex: 1, padding: '9px 6px', borderRadius: 11, border: `1px solid ${tabRank === tb.id ? T.acento : T.navActivoBorde}`, background: tabRank === tb.id ? `${T.acento}22` : 'transparent', color: tabRank === tb.id ? T.acento : C.tenue, fontSize: 13, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.4 }}>{tb.txt}</button>
              ))}
            </div>
            {tabRank === 'nba' && <RankingsNBA />}
            {tabRank === 'lnb' && <RankingsLNB />}
            {tabRank === 'general' && (
              <Placa radio={16} pad={26}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 34, marginBottom: 8 }}>🏆</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.texto, marginBottom: 6 }}>Ranking General — Próximamente</div>
                  <div style={{ fontSize: 12.5, color: C.tenue, lineHeight: 1.5 }}>Aquí va a vivir el ranking de Media Cancha juntando todos los torneos y las ligas.</div>
                </div>
              </Placa>
            )}
          </div>
        ) : (
          <>
          {!haySesion && <div style={{ marginTop: 14 }}><Bienvenida /></div>}
          <Historias />
          <CarruselDestacados />
          <div style={{ marginTop: 22 }}><SecHead titulo="El Techado" icono="techado" accion={{ txt: 'Ver todo →', fn: () => click('techado') }} /><span style={{ display: 'block', fontSize: 11.5, color: T.tenue, margin: '-6px 2px 10px' }}>Tu zona, primero</span><ListaTechado /></div>
          <div style={{ marginTop: 22 }}><SecHead titulo="Torneos populares" accion={{ txt: 'Ver todos →', fn: () => click('torneos') }} /><ListaTorneos /></div>
          {!haySesion && <CtaRegistro />}
          </>
        )}
        </div>
      </div>
      <div ref={refNavBottom} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40, background: T.headerBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: `1px solid ${T.navActivoBorde}`, boxShadow: '0 -5px 25px rgba(0,0,0,.1)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
        <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        {[{ id: 'inicio', txt: 'Inicio', icono: '⌂' }, { id: 'ligas', txt: 'Ligas', icono: '🏀' }].map((n) => (
          <button key={n.id} onClick={() => { if (n.id === 'inicio') { setMenuAbierto(false); setMasAbierto(false); setCrearAbierto(false); setSeccion('feed'); irAlTopeMovil() } else { click(n.id) } }} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', textAlign: 'center', color: n.id === 'inicio' ? (seccion === 'feed' ? T.acento : C.tenue) : C.tenue, fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {n.id === 'inicio'
              ? <svg width="32" height="32" viewBox="0 0 24 24" fill={T.acento} style={{ display: 'block' }}><path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3L12 3z"/></svg>
              : <><div style={{ fontSize: 18, marginBottom: 3, display: 'flex', justifyContent: 'center' }}>{n.icono}</div>{n.txt}</>}
          </button>
        ))}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => setAnotarAbierto(true)} style={{ width: 52, height: 52, borderRadius: '50%', background: T.boton, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: T.avatarTexto }}>
            <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 0.8 }}>＋</span>
            <span style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 1 }}>Anotar</span>
          </button>
        </div>
        <button onClick={() => { setSeccion('rankings'); irAlTopeMovil() }} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', textAlign: 'center', color: seccion === 'rankings' ? T.acento : C.tenue, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
          <div style={{ fontSize: 18, marginBottom: 3, display: 'flex', justifyContent: 'center' }}>★</div>Ranking
        </button>
        <button onClick={() => click('perfil')} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', textAlign: 'center', color: C.tenue, fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', marginBottom: 3, background: miPerfil?.foto_url ? `url(${miPerfil.foto_url}) center/cover` : T.boton, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: T.avatarTexto, boxShadow: `0 0 0 1.5px ${T.acento}` }}>{!miPerfil?.foto_url && ((miPerfil?.nombre || '?')[0] || '').toUpperCase()}</div>Perfil
        </button>
        </div>
        </div>
      </div>
      {haySesion && (
        <button onClick={() => click('publicar')} aria-label="Publicar" style={{ position: 'fixed', right: 18, bottom: 'calc(env(safe-area-inset-bottom) + 84px)', zIndex: 45, width: 54, height: 54, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'linear-gradient(140deg,#e4263c,#ce1126)', color: '#fff', boxShadow: '0 8px 22px rgba(206,17,38,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/></svg>
        </button>
      )}
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

// ---- Visor de fotos a pantalla completa (profesional, estilo Instagram/WhatsApp) ----
function VisorFotos({ fotos, inicio = 0, onCerrar }) {
  const [idx, setIdx] = useState(inicio)
  const refScroll = useRef(null)

  // Posicionar en la foto inicial al abrir
  useEffect(() => {
    const el = refScroll.current
    if (el) el.scrollLeft = inicio * el.clientWidth
  }, [inicio])

  // Bloquear el scroll del fondo mientras el visor está abierto
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const alScroll = () => {
    const el = refScroll.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== idx) setIdx(i)
  }

  const unaSola = fotos.length === 1

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,.96)', display: 'flex', flexDirection: 'column', animation: 'visorFade .2s ease' }}>
      <style>{`@keyframes visorFade{from{opacity:0}to{opacity:1}}`}</style>

      {/* Barra superior */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(env(safe-area-inset-top) + 12px) 16px 12px', position: 'relative', zIndex: 2 }}>
        <span onClick={onCerrar} style={{ color: '#fff', fontSize: 30, lineHeight: 1, cursor: 'pointer', fontWeight: 300, padding: '0 4px' }}>✕</span>
        {!unaSola && <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{idx + 1} / {fotos.length}</span>}
        <span style={{ width: 30 }} />
      </div>

      {/* Fotos (deslizables si son varias), centradas, tamaño real */}
      <div ref={refScroll} onScroll={alScroll} style={{ flex: 1, minHeight: 0, display: 'flex', overflowX: unaSola ? 'hidden' : 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
        {fotos.map((src, i) => (
          <div key={i} onClick={onCerrar} style={{ flex: '0 0 100%', width: '100%', height: '100%', scrollSnapAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0 40px' }}>
            <img src={src} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
        ))}
      </div>

      {/* Puntitos abajo */}
      {!unaSola && (
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', gap: 6, padding: 'calc(env(safe-area-inset-bottom) + 14px) 0' }}>
          {fotos.map((_, i) => (
            <div key={i} style={{ width: i === idx ? 8 : 6, height: i === idx ? 8 : 6, borderRadius: '50%', background: i === idx ? '#fff' : 'rgba(255,255,255,.45)', transition: 'all .2s' }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Carrusel de fotos de una publicación (1 = cuadrada estilo IG, varias = deslizable) ----
function CarruselFotos({ fotos, onAbrir }) {
  const [idx, setIdx] = useState(0)
  const refScroll = useRef(null)
  const unaSola = fotos.length === 1

  const alScroll = () => {
    const el = refScroll.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== idx) setIdx(i)
  }

  if (unaSola) {
    // Una sola: completa, sin cortar (respeta su forma), con límite de alto
    return (
      <div onClick={() => onAbrir && onAbrir(0)} style={{ width: '100%', maxHeight: 560, cursor: 'pointer', background: '#000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={fotos[0]} alt="" style={{ width: '100%', maxHeight: 560, objectFit: 'contain', display: 'block' }} />
      </div>
    )
  }

  // Varias: carrusel deslizable, cada foto completa sin cortar
  return (
    <div style={{ position: 'relative' }}>
      <div ref={refScroll} onScroll={alScroll} style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', background: '#000' }}>
        {fotos.map((src, i) => (
          <div key={i} onClick={() => onAbrir && onAbrir(i)} style={{ flex: '0 0 100%', width: '100%', height: 460, scrollSnapAlign: 'center', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={src} alt="" style={{ maxWidth: '100%', maxHeight: 460, objectFit: 'contain', display: 'block' }} />
          </div>
        ))}
      </div>
      {/* Contador 1/3 */}
      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11.5, fontWeight: 800, borderRadius: 11, padding: '3px 9px' }}>{idx + 1}/{fotos.length}</div>
      {/* Puntitos */}
      <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
        {fotos.map((_, i) => (
          <div key={i} style={{ width: i === idx ? 7 : 5, height: i === idx ? 7 : 5, borderRadius: '50%', background: i === idx ? '#fff' : 'rgba(255,255,255,.5)', transition: 'all .2s' }} />
        ))}
      </div>
    </div>
  )
}

function ComposerTechado({ T, escritorio, miPerfil, abierto, setAbierto, texto, setTexto, fondoSel, setFondoSel, publicando, onPublicar, onResultado, onAbrir, fotos = [], setFotos, maxFotos = 2 }) {
  const p = miPerfil
  const [panelEmoji, setPanelEmoji] = useState(false)
  const [catEmoji, setCatEmoji] = useState('Básquet')
  const areaRef = useRef(null)
  const inputFotosRef = useRef(null)
  const [fotoARecortar, setFotoARecortar] = useState(null)   // foto pendiente de recortar
  const [editandoIdx, setEditandoIdx] = useState(-1)          // índice de la foto que se está editando
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

  // ----- Manejo de fotos de la publicación -----
  const alElegirFotos = (e) => {
    const archivos = Array.from(e.target.files || [])
    if (inputFotosRef.current) inputFotosRef.current.value = ''
    if (!archivos.length) return
    const espacio = maxFotos - fotos.length
    if (espacio <= 0) { alert(`Puedes subir hasta ${maxFotos} fotos por publicación.`); return }
    const aUsar = archivos.slice(0, espacio)

    // Si es UNA sola foto en total → pasa por el recortador
    if (aUsar.length === 1 && fotos.length === 0 && maxFotos >= 1) {
      setEditandoIdx(-1)
      setFotoARecortar(aUsar[0])
      return
    }
    // Varias → entran directo (con opción de editar luego)
    const nuevas = aUsar.map((a) => ({ blob: a, previa: URL.createObjectURL(a) }))
    setFotos((prev) => [...prev, ...nuevas])
  }

  const alRecortarComposer = (blob) => {
    const previa = URL.createObjectURL(blob)
    if (editandoIdx >= 0) {
      setFotos((prev) => prev.map((f, i) => i === editandoIdx ? { blob, previa } : f))
    } else {
      setFotos((prev) => [...prev, { blob, previa }])
    }
    setFotoARecortar(null)
    setEditandoIdx(-1)
  }

  const editarFotoComposer = async (idx) => {
    const f = fotos[idx]
    if (!f) return
    setEditandoIdx(idx)
    setFotoARecortar(f.blob)
  }

  const quitarFoto = (idx) => {
    setFotos((prev) => {
      const f = prev[idx]
      if (f) { try { URL.revokeObjectURL(f.previa) } catch (e) {} }
      return prev.filter((_, i) => i !== idx)
    })
  }

  if (!p) return null
  const iniciales = `${(p.nombre || '?')[0] || ''}${(p.apellido || '')[0] || ''}`.toUpperCase()
  const hayTexto = texto.trim().length > 0
  const puedePublicar = hayTexto || fotos.length > 0
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
    { id: 'foto', icono: '📷', txt: 'Foto', activo: true },
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

  // ---- Barrita disparadora (solo en escritorio; en celular se publica con el botón +) ----
  if (!abierto) {
    if (!escritorio) return null
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
        <button onClick={onPublicar} disabled={!puedePublicar || publicando} style={{
          border: 'none', borderRadius: 20, padding: '8px 18px',
          background: puedePublicar ? T.boton : (T.esClaro ? '#e0e3e8' : 'rgba(255,255,255,.1)'),
          color: puedePublicar ? '#1a1205' : T.tenue, fontWeight: 800, fontSize: 13.5,
          cursor: puedePublicar ? 'pointer' : 'default', opacity: publicando ? 0.6 : 1,
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

        {/* Fotos elegidas para la publicación */}
        {fotos.length > 0 && (
          <div style={{ flexShrink: 0, display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 16px 12px', WebkitOverflowScrolling: 'touch' }}>
            {fotos.map((f, i) => (
              <div key={i} style={{ position: 'relative', flexShrink: 0, width: 96, height: 96, borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${T.acento}55` }}>
                <img src={f.previa} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button onClick={() => quitarFoto(i)} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'grid', placeItems: 'center', lineHeight: 1 }}>✕</button>
                <button onClick={() => editarFotoComposer(i)} style={{ position: 'absolute', bottom: 4, right: 4, border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 10.5, fontWeight: 800, cursor: 'pointer', borderRadius: 7, padding: '3px 7px' }}>✎ Editar</button>
              </div>
            ))}
            {fotos.length < maxFotos && (
              <button onClick={() => inputFotosRef.current && inputFotosRef.current.click()} style={{ flexShrink: 0, width: 96, height: 96, borderRadius: 12, border: `1.5px dashed ${T.acento}77`, background: 'transparent', color: T.acento, fontSize: 28, cursor: 'pointer' }}>＋</button>
            )}
          </div>
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
          <button key={a.id} onClick={
            a.id === 'resultado' && a.activo ? () => { cerrar(); onResultado && onResultado() }
            : a.id === 'foto' && a.activo ? () => { if (fotos.length >= maxFotos) { alert(`Puedes subir hasta ${maxFotos} fotos por publicación.`) } else { inputFotosRef.current && inputFotosRef.current.click() } }
            : avisarPronto
          } style={{
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

      {/* Input oculto para elegir fotos */}
      <input ref={inputFotosRef} type="file" accept="image/*" multiple={maxFotos > 1} onChange={alElegirFotos} style={{ display: 'none' }} />

      {/* Recortador (para 1 foto, o al editar una) */}
      {fotoARecortar && (
        <RecortadorFoto
          archivo={fotoARecortar}
          forma="cuadrado"
          elegirForma={true}
          tema={{ acento: T.acento, boton: T.boton, botonTexto: '#1a1205', panel: 'rgba(12,14,18,.98)', texto: '#f4f7f9', tenue: '#9aa7b2' }}
          onListo={alRecortarComposer}
          onCancelar={() => { setFotoARecortar(null); setEditandoIdx(-1) }}
        />
      )}
    </div>
  )
}

// ---- Lista de comentarios (solo la lista; la caja de escribir va anclada en DetallePublicacion) ----
function Comentarios({ lista, cargando, T, C, onAccion }) {
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
            const irPerfil = () => c.autor_id && onAccion && onAccion('verPerfil:' + c.autor_id)
            return (
              <div key={c.id} style={{ display: 'flex', gap: 9, marginBottom: 10 }}>
                <div onClick={irPerfil} style={{ width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', background: perf.foto_url ? `url(${perf.foto_url}) center/cover` : T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: T.avatarTexto, flexShrink: 0 }}>
                  {!perf.foto_url && nombre.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.texto }}><span onClick={irPerfil} style={{ cursor: 'pointer' }}>{nombre}</span> <span style={{ fontSize: 10.5, fontWeight: 400, color: C.tenue }}>· {haceCuanto(c.creado_en)}</span></div>
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
function HojaComentarios({ pub, T, C, haySesion, onCerrar, onPedirLogin, onCambio, onAccion }) {
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
            const irPerfil = () => { if (c.autor_id && onAccion) { onCerrar && onCerrar(); onAccion('verPerfil:' + c.autor_id) } }
            return (
              <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div onClick={irPerfil} style={{ width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', background: perf.foto_url ? `url(${perf.foto_url}) center/cover` : D.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: D.avatarTexto, flexShrink: 0 }}>
                  {!perf.foto_url && nombre.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: D.textoBody }}><span onClick={irPerfil} style={{ cursor: 'pointer' }}>{nombre}</span> <span style={{ fontSize: 11, fontWeight: 400, color: D.tenue }}>· {haceCuanto(c.creado_en)}</span></div>
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
// Atrapa-errores: si el detalle revienta al dibujarse, en vez de dejar la
// pantalla negra sin salida, muestra el mensaje del error y un botón para cerrar.
class LimiteDetalle extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { try { console.error('Detalle reventó:', error, info) } catch (e) {} }
  render() {
    if (this.state.error) {
      const msg = String((this.state.error && this.state.error.message) || this.state.error || 'error desconocido')
      return (
        <div onClick={this.props.onCerrar} style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(4,5,7,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, width: '100%', background: '#16181d', border: '1px solid #2a2d34', borderRadius: 16, padding: 22, color: '#ededed' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>⚠️ Algo falló al abrir</div>
            <div style={{ fontSize: 12.5, color: '#b9c0c8', lineHeight: 1.5, marginBottom: 18, wordBreak: 'break-word', maxHeight: 260, overflowY: 'auto' }}>{msg}</div>
            <button onClick={this.props.onCerrar} style={{ border: 'none', borderRadius: 10, padding: '11px 18px', background: 'linear-gradient(120deg,#fbe08a,#c8842e)', color: '#1a1205', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function DetallePublicacion({ pub, T, C, ORO_TEXTO, haySesion, esMia, onCerrar, onPedirLogin, onReaccionar, miReaccion, onBorrar, onCambioComentarios, onAccion }) {
  const esEscritorio = typeof window !== 'undefined' && window.innerWidth >= 900
  const tema = typeof window !== 'undefined' ? (localStorage.getItem('mc_tema') || 'dorado') : 'dorado'
  let datos = pub.datos || {}
  if (typeof datos === 'string') { try { datos = JSON.parse(datos) } catch (e) { datos = {} } }
  const esJuego = datos && datos.nombreA && datos.nombreB && (datos.totalA != null || (datos.jugadores && datos.jugadores.length))
  const fuenteJuego = datos.fuente || (pub.tipo === 'torneo' ? 'torneo' : pub.tipo === 'liga' ? 'liga' : 'rapido')

  // Tema oscuro propio para la ventana, IGUAL que la hoja de comentarios que sí
  // funciona en iOS. Reusamos el componente BottomSheet (ya probado) en vez de
  // armar la ventana a mano, que era lo que se ponía negro.
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
  const acento = '#f5b82e'
  const lineaModal = 'rgba(255,255,255,.07)'
  const cComent = { texto: D.textoBody, tenue: D.tenue }

  // ===== Comentarios =====
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
    }
    setEnviandoComentario(false)
  }

  const compartir = async () => {
    const t = pub.titulo || `${datos.nombreA || ''} vs ${datos.nombreB || ''}`.trim() || 'Media Cancha'
    const tx = esJuego ? `${datos.nombreA} ${datos.totalA} - ${datos.totalB} ${datos.nombreB} · vía Media Cancha 🏀` : (pub.texto || 'Mira esto en Media Cancha 🏀')
    try {
      if (navigator.share) await navigator.share({ title: t, text: tx })
      else if (navigator.clipboard) await navigator.clipboard.writeText(tx)
    } catch (e) { /* el usuario canceló */ }
  }

  const inputBg = 'rgba(255,255,255,0.06)'
  const inputBorde = 'rgba(255,255,255,0.16)'

  // Caja de comentar (va anclada abajo por el 'pie' de BottomSheet; sube con el teclado)
  const pie = (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 14px 10px' }}>
      <input
        value={textoComentario}
        onChange={(e) => setTextoComentario(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') enviarComentario() }}
        placeholder={haySesion ? 'Escribe un comentario…' : 'Inicia sesión para comentar'}
        maxLength={500}
        style={{ flex: 1, minWidth: 0, background: inputBg, border: `1px solid ${inputBorde}`, borderRadius: 22, padding: '11px 15px', color: D.textoBody, fontSize: 16, outline: 'none' }}
      />
      <button onClick={enviarComentario} disabled={enviandoComentario} style={{ flexShrink: 0, border: 'none', borderRadius: '50%', width: 44, height: 44, background: D.boton, color: '#1a1205', fontWeight: 800, fontSize: 17, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>{enviandoComentario ? '…' : '➤'}</button>
    </div>
  )

  const accionDerecha = esMia ? (
    <span onClick={onBorrar} title="Eliminar" style={{ fontSize: 17, color: '#e0563f', cursor: 'pointer', padding: '2px 6px' }}>🗑️</span>
  ) : null

  return (
    <BottomSheet T={D} esEscritorio={esEscritorio} titulo="Publicación" accionDerecha={accionDerecha} pie={pie} expandido={true} onCerrar={onCerrar}>
      <div style={{ padding: '14px 16px 18px' }}>
        {esJuego ? (
          <div style={{ marginBottom: 16 }}>
            <TarjetaResultado
              datos={datos}
              fuente={fuenteJuego}
              tiempo={haceCuanto(pub.creado_en)}
              autorNombre={`${pub.autor_nombre || 'Usuario'}${pub.autor_apellido ? ' ' + pub.autor_apellido : ''}`}
              autorFoto={pub.autor_foto}
              autorId={pub.autor_id}
              onIrPerfil={(id) => onAccion && onAccion('verPerfil:' + id)}
              comentario={pub.texto && !pub.texto.startsWith('Ganaron') && !pub.texto.startsWith('Quedaron') ? pub.texto.split('\n')[0] : null}
              temaForzado={tema}
            />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <div onClick={() => pub.autor_id && onAccion && onAccion('verPerfil:' + pub.autor_id)} style={{ width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', background: pub.autor_foto ? `url(${pub.autor_foto}) center/cover` : D.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: D.avatarTexto, flexShrink: 0 }}>
                {!pub.autor_foto && ((pub.autor_nombre || '?').slice(0, 1).toUpperCase())}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div onClick={() => pub.autor_id && onAccion && onAccion('verPerfil:' + pub.autor_id)} style={{ fontSize: 13.5, fontWeight: 700, color: D.textoBody, cursor: 'pointer' }}>{pub.autor_nombre || 'Usuario'}{pub.autor_apellido ? ` ${pub.autor_apellido}` : ''}</div>
                <div style={{ fontSize: 11, color: D.tenue }}>{haceCuanto(pub.creado_en)}</div>
              </div>
            </div>
            {pub.titulo && <div style={{ fontSize: 18, fontWeight: 800, color: D.textoBody, lineHeight: 1.2, marginBottom: 8 }}>{pub.titulo}</div>}
            {datos.fondo && FONDOS_PUB[datos.fondo] ? (
              <div style={{ position: 'relative', minHeight: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 16, background: `url(${FONDOS_PUB[datos.fondo]}) center/cover`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,9,12,.35), rgba(8,9,12,.62))' }} />
                <div style={{ position: 'relative', padding: 24, textAlign: 'center', color: '#fff', fontSize: 24, fontWeight: 800, lineHeight: 1.3, textShadow: '0 2px 12px rgba(0,0,0,.6)', wordBreak: 'break-word' }}>{pub.texto}</div>
              </div>
            ) : (
              pub.texto && <div style={{ fontSize: 14.5, color: D.textoBody, lineHeight: 1.6, marginBottom: 16 }}>{resaltarTexto(pub.texto, acento, null)}</div>
            )}
          </>
        )}

        {/* barra de reacciones + compartir */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '12px 0', borderTop: `1px solid ${lineaModal}`, borderBottom: `1px solid ${lineaModal}`, marginBottom: 14, flexWrap: 'wrap' }}>
          <div onClick={() => onReaccionar(pub.id, 'like')} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: miReaccion === 'like' ? acento : D.tenue, fontSize: 14, fontWeight: 700 }}>
            <span style={{ fontSize: 17 }}>{miReaccion === 'like' ? '❤️' : '🤍'}</span> {pub.likes || 0}
          </div>
          <div onClick={() => onReaccionar(pub.id, 'dislike')} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: miReaccion === 'dislike' ? '#e0563f' : D.tenue, fontSize: 14, fontWeight: 700 }}>
            <span style={{ fontSize: 17 }}>👎</span> {pub.dislikes || 0}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: D.tenue, fontSize: 14, fontWeight: 700 }}>
            <span style={{ fontSize: 17 }}>💬</span> {comentarios.length || pub.num_comentarios || 0}
          </div>
          <button onClick={compartir} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, border: 'none', borderRadius: 10, padding: '9px 16px', background: D.boton, color: '#1a1205', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
            <span style={{ fontSize: 15 }}>↗</span> Compartir
          </button>
        </div>

        {/* lista de comentarios */}
        <Comentarios lista={comentarios} cargando={cargandoComentarios} T={D} C={cComent} onAccion={onAccion} />
      </div>
    </BottomSheet>
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
    <div onClick={onCancelar} style={{ position: 'fixed', inset: 0, zIndex: 80, background: fondoModal, display: 'flex', alignItems: esEscritorio ? 'center' : 'flex-end', justifyContent: 'center', padding: esEscritorio ? 20 : 0 }}>
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