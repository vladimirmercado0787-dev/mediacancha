import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { cargarTorneoPublico, generarCalendario } from '../torneoData'
import { invitar, buscarPersonas, agregarJugador, agregarDirectiva, leerDirectiva, cambiarPermiso, registrarBitacora, leerBitacora, leerCaja, agregarMovimiento, eliminarMovimiento } from '../torneos'

// Etiquetas y orden de los roles de la directiva
const ROL_DIR = { presidente: 'Presidente', vicepresidente: 'Vicepresidente', tesorero: 'Tesorero', secretario: 'Secretario', vocal: 'Vocal' }
const RANK_DIR = { presidente: 0, vicepresidente: 1, tesorero: 2, secretario: 3, vocal: 4 }
const ROLES_AGREGABLES = ['vicepresidente', 'tesorero', 'secretario', 'vocal']
// Iconos del historial por tipo de acción [emoji, color]
const ICONO_BITACORA = {
  permiso_otorgado: ['🔓', '#34c759'], permiso_quitado: ['🔒', '#e8a93a'],
  miembro_agregado: ['➕', '#6fb0ec'], juego_creado: ['🏀', '#e8b65a'],
  marcador_cambiado: ['✏️', '#e8b65a'], invitacion_enviada: ['✉️', '#9b8cff'],
  jugador_confirmado: ['✅', '#34c759'], calendario_generado: ['📅', '#6fb0ec'],
  jugador_eliminado: ['➖', '#d24f4f'],
  ingreso_registrado: ['💰', '#5dcaa5'], gasto_registrado: ['💸', '#f09595'], movimiento_borrado: ['🗑️', '#d24f4f'],
}
function tiempoRelativo(iso) {
  if (!iso) return ''
  const d = new Date(iso); const seg = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seg < 60) return 'hace un momento'
  const min = Math.floor(seg / 60); if (min < 60) return `hace ${min} min`
  const hr = Math.floor(min / 60); if (hr < 24) return `hace ${hr} h`
  const dias = Math.floor(hr / 24); if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${meses[d.getMonth()]}`
}

// Categorías de la caja del torneo
const CAT_INGRESO = [
  { id: 'inscripcion', t: 'Inscripción', emoji: '🧾' },
  { id: 'patrocinador', t: 'Patrocinador', emoji: '🤝' },
  { id: 'taquilla', t: 'Taquilla', emoji: '🎟️' },
  { id: 'donacion', t: 'Donación', emoji: '🎁' },
  { id: 'otro', t: 'Otro ingreso', emoji: '💵' },
]
const CAT_GASTO = [
  { id: 'arbitros', t: 'Árbitros', emoji: '🟨' },
  { id: 'premiacion', t: 'Premiación', emoji: '🏆' },
  { id: 'logistica', t: 'Logística', emoji: '📦' },
  { id: 'balones', t: 'Balones y equipo', emoji: '🏀' },
  { id: 'comida', t: 'Comida', emoji: '🍽️' },
  { id: 'transporte', t: 'Transporte', emoji: '🚐' },
  { id: 'otro', t: 'Otro gasto', emoji: '🧾' },
]
function catInfo(tipo, id) {
  const lista = tipo === 'ingreso' ? CAT_INGRESO : CAT_GASTO
  return lista.find((c) => c.id === id) || { id: 'otro', t: tipo === 'ingreso' ? 'Otro ingreso' : 'Otro gasto', emoji: tipo === 'ingreso' ? '💵' : '🧾' }
}
function fmtRD(n) {
  const num = Math.round((Number(n) || 0) * 100) / 100
  const [ent, dec] = num.toFixed(2).split('.')
  const conComas = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `RD$ ${conComas}${dec === '00' ? '' : '.' + dec}`
}
function fmtCorto(n) {
  const num = Math.abs(Number(n) || 0)
  if (num >= 1000000) return (Math.round(num / 100000) / 10).toString().replace(/\.0$/, '') + 'M'
  if (num >= 1000) return Math.round(num / 1000) + 'K'
  return String(Math.round(num))
}

// ============================================================================
//  PANTALLA DE TORNEOS — Media Cancha
//  Maneja DOS vistas: pública (esAdmin=false) y administrador (esAdmin=true).
//  Construida con la fórmula oficial: pantalla clavada (position fixed,
//  100dvh, flex column), header fijo arriba, solo el centro hace scroll.
//  Diseño deportivo con la identidad de Media Cancha (charcoal + dorado).
// ============================================================================

const TEMAS = {
  dorado: { esClaro: false, acento: '#e8b65a', fondo: '#08090c', panel: 'rgba(18,20,25,.92)', tarjeta: 'rgba(20,22,26,.72)', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', muyTenue: '#6b7682', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', botonTexto: '#1a1205', avatar: 'linear-gradient(150deg, #e0b057, #9a6420)', avatarTexto: '#241a07', glow: 'rgba(190,135,55,0.2)', borde: 'rgba(232,182,79,.2)', bordeSuave: 'rgba(255,255,255,.08)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)' },
  azul: { esClaro: false, acento: '#6fb0ec', fondo: '#08090c', panel: 'rgba(18,20,25,.92)', tarjeta: 'rgba(20,22,26,.72)', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', muyTenue: '#6b7682', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', botonTexto: '#08151f', avatar: 'linear-gradient(150deg, #5aa0e0, #1d4a80)', avatarTexto: '#08151f', glow: 'rgba(55,120,190,0.22)', borde: 'rgba(111,176,236,.22)', bordeSuave: 'rgba(255,255,255,.08)', navDorada: 'linear-gradient(180deg,#6fb0ec,#2f6fc8 55%,#1d4a80)' },
  claro: { esClaro: true, acento: '#b07a26', fondo: '#ece4d4', panel: 'rgba(250,246,238,.96)', tarjeta: '#fff', textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#8a7c64', muyTenue: '#a89a82', boton: 'linear-gradient(150deg, #e7c069, #b07a26)', botonTexto: '#2a1d06', avatar: 'linear-gradient(150deg, #e7c069, #a9741f)', avatarTexto: '#3a2806', glow: 'rgba(176,122,38,0.16)', borde: 'rgba(176,122,38,.22)', bordeSuave: '#e0e3e8', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)' },
  larimar: { esClaro: true, acento: '#2a8fb8', fondo: '#dcebec', panel: 'rgba(238,247,248,.96)', tarjeta: '#fff', textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375', muyTenue: '#8aa0a2', boton: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', botonTexto: '#04121f', avatar: 'linear-gradient(150deg, #4aafc8, #1a6a8a)', avatarTexto: '#04121f', glow: 'rgba(42,143,184,0.18)', borde: 'rgba(42,143,184,.22)', bordeSuave: '#cfe0e2', navDorada: 'linear-gradient(180deg,#6ac0d8,#2a8fb8 55%,#1a6a8a)' },
}

// --- Datos de ejemplo (luego vienen de Supabase) ---
const TORNEO_DEMO = {
  nombre: 'Copa Jícome 2026', subtitulo: '16 equipos · Eliminación', lugar: 'Valverde, RD',
  emoji: '🏆', equipos: 16, jugadores: 182, juegosJugados: 24, juegosTotal: 30, fase: 'Semifinales', enVivo: 2,
}

const CLASIFICACION_DEMO = [
  { pos: 1, cod: 'TIG', nombre: 'Tigres', pj: 5, g: 5, pts: 10, color: 'linear-gradient(150deg,#e0b057,#9a6420)', colorTexto: '#241a07' },
  { pos: 2, cod: 'LOB', nombre: 'Lobos', pj: 5, g: 4, pts: 8, color: 'linear-gradient(150deg,#5aa0e0,#1d4a80)', colorTexto: '#fff' },
  { pos: 3, cod: 'HAL', nombre: 'Halcones', pj: 5, g: 3, pts: 6, color: 'linear-gradient(150deg,#d4537e,#992f56)', colorTexto: '#fff' },
  { pos: 4, cod: 'AGU', nombre: 'Águilas', pj: 5, g: 2, pts: 4, color: 'linear-gradient(150deg,#5dcaa5,#0f6e56)', colorTexto: '#04342c' },
]

const LIDERES_DEMO = [
  { stat: 'Puntos', emoji: '🏀', jugador: 'E. Mercado', equipo: 'Tigres', valor: '28.4', color: '#e8b65a' },
  { stat: 'Asistencias', emoji: '🤝', jugador: 'J. Brito', equipo: 'Lobos', valor: '9.1', color: '#6fb0ec' },
  { stat: 'Rebotes', emoji: '💪', jugador: 'H. Tavárez', equipo: 'Halcones', valor: '12.7', color: '#5dcaa5' },
  { stat: 'Robos', emoji: '✋', jugador: 'P. Julio', equipo: 'Águilas', valor: '3.2', color: '#d4537e' },
  { stat: 'Tapones', emoji: '🚫', jugador: 'R. Ramírez', equipo: 'Lobos', valor: '2.8', color: '#ef9f27' },
]

const TOP10_DEMO = [
  { pos: 1, nombre: 'Elvin Mercado', equipo: 'Tigres', cod: 'TIG', val: 28.4, mvp: true },
  { pos: 2, nombre: 'Joel Brito', equipo: 'Lobos', cod: 'LOB', val: 24.1, mvp: true },
  { pos: 3, nombre: 'Héctor Tavárez', equipo: 'Halcones', cod: 'HAL', val: 22.8, mvp: true },
  { pos: 4, nombre: 'Pedro Julio', equipo: 'Águilas', cod: 'AGU', val: 21.3 },
  { pos: 5, nombre: 'Kratos Ramírez', equipo: 'Lobos', cod: 'LOB', val: 19.9 },
  { pos: 6, nombre: 'Luis Santana', equipo: 'Tigres', cod: 'TIG', val: 18.5 },
  { pos: 7, nombre: 'Miguel Reyes', equipo: 'Halcones', cod: 'HAL', val: 17.2 },
  { pos: 8, nombre: 'Carlos Núñez', equipo: 'Águilas', cod: 'AGU', val: 16.8 },
  { pos: 9, nombre: 'Juan Pérez', equipo: 'Lobos', cod: 'LOB', val: 15.4 },
  { pos: 10, nombre: 'David Cruz', equipo: 'Tigres', cod: 'TIG', val: 14.9 },
]

const PROXIMOS_DEMO = [
  { local: 'Tigres', visita: 'Águilas', fase: 'Semifinal', lugar: 'Cancha Jícome', cuando: 'Hoy 8:00 PM', destacado: true },
  { local: 'Lobos', visita: 'Halcones', fase: 'Semifinal', lugar: 'Cancha Jícome', cuando: 'Mañana 7:00 PM' },
  { local: 'Final', visita: '', fase: 'Por definir', lugar: '', cuando: 'Dom 6:00 PM' },
]

// Equipos con su plantilla (roster). Luego viene de Supabase.
const EQUIPOS_DEMO = [
  {
    cod: 'TIG', nombre: 'Tigres', color: 'linear-gradient(150deg,#e0b057,#9a6420)', colorTexto: '#241a07',
    dt: 'Manuel Fermín', zona: 'Jícome', pj: 5, g: 5, p: 0,
    plantilla: [
      { num: 7, nombre: 'Elvin Mercado', pos: 'Base', cap: true },
      { num: 23, nombre: 'Luis Santana', pos: 'Escolta' },
      { num: 11, nombre: 'David Cruz', pos: 'Alero' },
      { num: 33, nombre: 'José Polanco', pos: 'Ala-pívot' },
      { num: 50, nombre: 'Rafael Gómez', pos: 'Pívot' },
      { num: 4, nombre: 'Andy Reyes', pos: 'Base' },
      { num: 15, nombre: 'Wilkin Díaz', pos: 'Alero' },
    ],
  },
  {
    cod: 'LOB', nombre: 'Lobos', color: 'linear-gradient(150deg,#5aa0e0,#1d4a80)', colorTexto: '#fff',
    dt: 'Pedro Castillo', zona: 'Esperanza', pj: 5, g: 4, p: 1,
    plantilla: [
      { num: 10, nombre: 'Joel Brito', pos: 'Base', cap: true },
      { num: 8, nombre: 'Kratos Ramírez', pos: 'Pívot' },
      { num: 21, nombre: 'Juan Pérez', pos: 'Escolta' },
      { num: 5, nombre: 'Carlos Mota', pos: 'Alero' },
      { num: 32, nombre: 'Luis Frías', pos: 'Ala-pívot' },
      { num: 14, nombre: 'Ramón Núñez', pos: 'Base' },
    ],
  },
  {
    cod: 'HAL', nombre: 'Halcones', color: 'linear-gradient(150deg,#d4537e,#992f56)', colorTexto: '#fff',
    dt: 'Freddy Martínez', zona: 'Mao', pj: 5, g: 3, p: 2,
    plantilla: [
      { num: 12, nombre: 'Héctor Tavárez', pos: 'Pívot', cap: true },
      { num: 9, nombre: 'Miguel Reyes', pos: 'Base' },
      { num: 24, nombre: 'Ángel Peña', pos: 'Escolta' },
      { num: 6, nombre: 'Starlin Gil', pos: 'Alero' },
      { num: 41, nombre: 'Yefri Cruz', pos: 'Ala-pívot' },
    ],
  },
  {
    cod: 'AGU', nombre: 'Águilas', color: 'linear-gradient(150deg,#5dcaa5,#0f6e56)', colorTexto: '#04342c',
    dt: 'Ramón Almonte', zona: 'Laguna Salada', pj: 5, g: 2, p: 3,
    plantilla: [
      { num: 3, nombre: 'Pedro Julio', pos: 'Escolta', cap: true },
      { num: 17, nombre: 'Carlos Núñez', pos: 'Alero' },
      { num: 22, nombre: 'Félix Abreu', pos: 'Base' },
      { num: 45, nombre: 'Manuel Tejada', pos: 'Pívot' },
      { num: 19, nombre: 'Edward Liriano', pos: 'Ala-pívot' },
    ],
  },
]

export default function PantallaTorneos({ esAdmin = false, torneoId = null, onVolver, onAccion, onVerPerfil, onAnotarJuego, onConfigurar }) {
  const [tema] = useState(() => {
    const validos = ['dorado', 'azul', 'claro', 'larimar']
    if (typeof window !== 'undefined') {
      const g = localStorage.getItem('mc_tema')
      return validos.includes(g) ? g : 'dorado'
    }
    return 'dorado'
  })
  // Identidad "transmisión" (azul-marino + dorado + tricolor), igual que la
  // pantalla pública del torneo. Tema fijo: las dos pantallas del torneo son familia.
  const BROADCAST = {
    esClaro: false,
    fondo: '#070d1d', panel: 'rgba(9,14,28,.97)', tarjeta: '#111a30',
    acento: '#f5b82e', textoFuerte: '#f3f6fc', textoBody: '#e7edf6',
    tenue: '#9aa6bd', muyTenue: '#6b7791',
    boton: 'linear-gradient(180deg, #ffd66b, #f5b82e)', botonTexto: '#1a1205',
    avatar: 'linear-gradient(150deg, #f5b82e, #c8842e)', avatarTexto: '#fff',
    glow: 'rgba(245,184,46,.16)', borde: 'rgba(245,184,46,.22)', bordeSuave: 'rgba(255,255,255,.07)',
  }
  const T = BROADCAST
  const card2 = '#0e1628'
  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const fDisp = "'Anton', 'Arial Narrow', Impact, sans-serif"
  const fCond = "'Oswald', 'Arial Narrow', 'Helvetica Neue', sans-serif"

  // Cargar tipografía deportiva (Anton/Oswald) sin tocar otros archivos.
  useEffect(() => {
    const id = 'mc-fuentes-deportivas'
    if (typeof document === 'undefined' || document.getElementById(id)) return
    const l = document.createElement('link')
    l.id = id; l.rel = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600;700&display=swap'
    document.head.appendChild(l)
  }, [])

  const PESTANAS_PUBLICAS = [
    { id: 'resumen', txt: 'Resumen', icono: '📊' },
    { id: 'clasificacion', txt: 'Tabla', icono: '🏆' },
    { id: 'bracket', txt: 'Llaves', icono: '🎯' },
    { id: 'calendario', txt: 'Juegos', icono: '📅' },
    { id: 'lideres', txt: 'Líderes', icono: '🥇' },
    { id: 'top10', txt: 'Top 10', icono: '⭐' },
    { id: 'mvp', txt: 'MVP', icono: '👑' },
  ]
  const PESTANAS_ADMIN = [
    { id: 'equipos', txt: 'Equipos', icono: '🛡️' },
    { id: 'jugadores', txt: 'Jugadores', icono: '👥' },
    { id: 'directiva', txt: 'Directiva', icono: '💼' },
    { id: 'contabilidad', txt: 'Caja', icono: '💰' },
    { id: 'arbitros', txt: 'Árbitros', icono: '🧑‍⚖️' },
    { id: 'reglas', txt: 'Reglas', icono: '⚙️' },
  ]
  const PESTANAS = esAdmin ? [...PESTANAS_PUBLICAS, ...PESTANAS_ADMIN] : PESTANAS_PUBLICAS

  const [pestana, setPestana] = useState('resumen')
  const [equipoAbierto, setEquipoAbierto] = useState(null)
  const [ancho, setAncho] = useState(typeof window !== 'undefined' ? window.innerWidth : 390)
  const esAncho = ancho >= 820  // iPad y computadora
  const esEscritorio = ancho >= 1180  // computadora: usa casi toda la pantalla
  const maxAncho = esEscritorio ? 1600 : (esAncho ? 1100 : 560)
  const anchoColumna = esEscritorio ? 420 : (esAncho ? 470 : 'auto')

  useEffect(() => {
    const alCambiar = () => setAncho(window.innerWidth)
    window.addEventListener('resize', alCambiar)
    return () => window.removeEventListener('resize', alCambiar)
  }, [])

  // Candado oficial: congela el fondo
  useEffect(() => {
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
  }, [])

  // ---------- CARGA DEL TORNEO REAL (desde Supabase) ----------
  const [datos, setDatos] = useState(null)
  const [torneoRow, setTorneoRow] = useState(null)
  const [jugCount, setJugCount] = useState(0)
  const [recarga, setRecarga] = useState(0)
  const [generando, setGenerando] = useState(false)
  const [vueltas, setVueltas] = useState(1)
  const [errorGen, setErrorGen] = useState(null)
  // --- Invitar jugador (T-004) ---
  const [invitarEquipo, setInvitarEquipo] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const [rolInvitar, setRolInvitar] = useState('jugador')
  const [mensajeInvitar, setMensajeInvitar] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [toastInvitar, setToastInvitar] = useState(null)
  const [eliminarJug, setEliminarJug] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [confirmarJug, setConfirmarJug] = useState(null)
  const [pinCodigo, setPinCodigo] = useState('')
  const [confirmandoPin, setConfirmandoPin] = useState(false)
  const [errorPin, setErrorPin] = useState('')
  const [jugadorVer, setJugadorVer] = useState(null)
  const refBusca = useRef(null)
  // --- Directiva + historial ---
  const [miId, setMiId] = useState(null)
  const [directiva, setDirectiva] = useState([])
  const [bitacora, setBitacora] = useState([])
  const [togglingId, setTogglingId] = useState(null)
  const [agregarDir, setAgregarDir] = useState(false)
  const [dirBusqueda, setDirBusqueda] = useState('')
  const [dirResultados, setDirResultados] = useState([])
  const [dirBuscando, setDirBuscando] = useState(false)
  const [dirSel, setDirSel] = useState(null)
  const [dirRol, setDirRol] = useState('vocal')
  const [dirEnviando, setDirEnviando] = useState(false)
  const [dirToast, setDirToast] = useState(null)
  const refDirBusca = useRef(null)
  // --- Caja (ingresos/gastos) ---
  const [caja, setCaja] = useState([])
  const [cajaModal, setCajaModal] = useState(false)
  const [cajaTipo, setCajaTipo] = useState('ingreso')
  const [cajaCategoria, setCajaCategoria] = useState('inscripcion')
  const [cajaConcepto, setCajaConcepto] = useState('')
  const [cajaMonto, setCajaMonto] = useState('')
  const [cajaGuardando, setCajaGuardando] = useState(false)
  const [cajaToast, setCajaToast] = useState(null)
  const [cajaEliminar, setCajaEliminar] = useState(null)
  const [cajaEliminando, setCajaEliminando] = useState(false)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        // Carga el torneo ELEGIDO (por id desde el selector "Mis Torneos").
        // Si no viene id, cae al más reciente como respaldo.
        let t = null
        if (torneoId) {
          const { data } = await supabase.from('torneos').select('*').eq('id', torneoId).single()
          t = data
        } else {
          const { data: ts } = await supabase.from('torneos').select('*').order('creado_en', { ascending: false }).limit(1)
          t = (ts || [])[0]
        }
        if (!t || !vivo) return
        setTorneoRow(t)
        const pub = await cargarTorneoPublico(t.id)
        const { count } = await supabase.from('torneo_jugadores').select('id', { count: 'exact', head: true }).eq('torneo_id', t.id)
        if (!vivo) return
        setDatos(pub)
        setJugCount(count || 0)
        const { data: u } = await supabase.auth.getUser()
        const [{ directiva: dir }, { bitacora: bit }, { caja: cj }] = await Promise.all([leerDirectiva(t.id), leerBitacora(t.id, 20), leerCaja(t.id)])
        if (!vivo) return
        setMiId(u?.user?.id || null)
        setDirectiva(dir)
        setBitacora(bit)
        setCaja(cj)
      } catch (e) {
        /* si algo falla, la pantalla se queda con la data de ejemplo */
      }
    })()
    return () => { vivo = false }
  }, [recarga, torneoId])

  // mapa equipo_id -> equipo (para sacar código y color)
  const eqPorId = {}
  ;(datos?.equipos || []).forEach((e) => { eqPorId[e.id] = e })

  // ---------- DIRECTIVA: derivados + acciones ----------
  const miRolDir = directiva.find((d) => d.perfil_id === miId)?.rol || (torneoRow && miId && miId === torneoRow.creador_id ? 'presidente' : null)
  const miNombre = directiva.find((d) => d.perfil_id === miId)?.nombre || 'Alguien'
  const puedeGestionar = miRolDir === 'presidente' || miRolDir === 'vicepresidente'

  // ---------- CAJA: derivados + acciones ----------
  const miFilaDir = directiva.find((d) => d.perfil_id === miId)
  const puedeAdministrar = (miFilaDir && (miFilaDir.rol === 'presidente' || miFilaDir.rol === 'vicepresidente' || miFilaDir.puede_administrar)) || (torneoRow && miId && miId === torneoRow.creador_id)
  const cajaIngresos = caja.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto || 0), 0)
  const cajaGastos = caja.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + Number(m.monto || 0), 0)
  const cajaBalance = cajaIngresos - cajaGastos

  const recargarCaja = async () => {
    if (!torneoRow) return
    const [{ caja: cj }, { bitacora: bit }] = await Promise.all([leerCaja(torneoRow.id), leerBitacora(torneoRow.id, 20)])
    setCaja(cj); setBitacora(bit)
  }

  const abrirCajaModal = (tipo) => {
    setCajaTipo(tipo)
    setCajaCategoria(tipo === 'ingreso' ? 'inscripcion' : 'arbitros')
    setCajaConcepto(''); setCajaMonto('')
    setCajaModal(true)
  }

  const guardarMovimiento = async () => {
    if (cajaGuardando || !torneoRow) return
    const monto = parseFloat(String(cajaMonto).replace(/,/g, ''))
    if (!cajaConcepto.trim()) { setCajaToast('Escribe el concepto.'); return }
    if (!monto || monto <= 0) { setCajaToast('Escribe un monto válido.'); return }
    setCajaGuardando(true)
    await agregarMovimiento(torneoRow.id, { tipo: cajaTipo, categoria: cajaCategoria, concepto: cajaConcepto.trim(), monto, registrado_nombre: miNombre })
    await registrarBitacora(torneoRow.id, {
      accion: cajaTipo === 'ingreso' ? 'ingreso_registrado' : 'gasto_registrado',
      detalle: `Registró un ${cajaTipo} de ${fmtRD(monto)} · ${cajaConcepto.trim()}`,
      objeto_tipo: 'caja', actor_nombre: miNombre,
    })
    await recargarCaja()
    setCajaGuardando(false)
    setCajaModal(false)
    setCajaToast(cajaTipo === 'ingreso' ? 'Ingreso registrado.' : 'Gasto registrado.')
  }

  const borrarMovimiento = async () => {
    if (!cajaEliminar || cajaEliminando || !torneoRow) return
    setCajaEliminando(true)
    const m = cajaEliminar
    await eliminarMovimiento(m.id)
    await registrarBitacora(torneoRow.id, {
      accion: 'movimiento_borrado',
      detalle: `Borró un ${m.tipo} de ${fmtRD(m.monto)} · ${m.concepto}`,
      objeto_tipo: 'caja', actor_nombre: miNombre,
    })
    await recargarCaja()
    setCajaEliminando(false)
    setCajaEliminar(null)
    setCajaToast('Movimiento borrado.')
  }

  const modalCaja = () => {
    if (!cajaModal) return null
    const inputBg = T.esClaro ? 'rgba(0,0,0,.04)' : 'rgba(255,255,255,.05)'
    const cats = cajaTipo === 'ingreso' ? CAT_INGRESO : CAT_GASTO
    const esIng = cajaTipo === 'ingreso'
    return (
      <div onClick={() => setCajaModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '90dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: T.fondo, borderRadius: '20px 20px 0 0', border: `1px solid ${T.bordeSuave}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `0.5px solid ${T.bordeSuave}`, position: 'sticky', top: 0, background: T.fondo, zIndex: 2 }}>
            <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 17, textTransform: 'uppercase', letterSpacing: 0.3, color: T.textoFuerte }}>Registrar movimiento</div>
            <button onClick={() => setCajaModal(false)} style={{ width: 32, height: 32, borderRadius: 9, border: `0.5px solid ${T.bordeSuave}`, background: T.tarjeta, color: T.textoFuerte, fontSize: 15, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ padding: '14px 16px calc(env(safe-area-inset-bottom) + 18px)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[['ingreso', 'Ingreso', '#5dcaa5'], ['gasto', 'Gasto', '#f09595']].map(([id, txt, col]) => {
                const on = cajaTipo === id
                return <button key={id} onClick={() => { setCajaTipo(id); setCajaCategoria(id === 'ingreso' ? 'inscripcion' : 'arbitros') }} style={{ flex: 1, border: on ? 'none' : `1px solid ${T.bordeSuave}`, borderRadius: 12, padding: 12, fontFamily: fCond, fontWeight: 700, fontSize: 14, letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer', background: on ? col : 'transparent', color: on ? '#08130f' : T.tenue }}>{txt}</button>
              })}
            </div>

            <div style={{ fontFamily: fCond, fontWeight: 600, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: T.tenue, marginBottom: 8 }}>Categoría</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
              {cats.map((c) => {
                const on = cajaCategoria === c.id
                return <button key={c.id} onClick={() => setCajaCategoria(c.id)} style={{ border: on ? 'none' : `1px solid ${T.bordeSuave}`, borderRadius: 10, padding: '8px 12px', fontFamily: fCond, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.2, cursor: 'pointer', background: on ? T.boton : 'transparent', color: on ? T.botonTexto : T.tenue }}>{c.emoji} {c.t}</button>
              })}
            </div>

            <div style={{ fontFamily: fCond, fontWeight: 600, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: T.tenue, marginBottom: 8 }}>Monto (RD$)</div>
            <input value={cajaMonto} onChange={(e) => setCajaMonto(e.target.value.replace(/[^\d.]/g, ''))} type="tel" inputMode="decimal" placeholder="0" style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.bordeSuave}`, borderRadius: 12, padding: '13px 14px', background: inputBg, color: esIng ? '#5dcaa5' : '#f09595', fontSize: 22, fontWeight: 800, fontFamily: fCond, outline: 'none', marginBottom: 16 }} />

            <div style={{ fontFamily: fCond, fontWeight: 600, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: T.tenue, marginBottom: 8 }}>Concepto</div>
            <input value={cajaConcepto} onChange={(e) => setCajaConcepto(e.target.value)} placeholder={esIng ? 'Ej: Inscripción equipo Tígueres' : 'Ej: Pago de árbitros jornada uno'} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.bordeSuave}`, borderRadius: 12, padding: '12px 14px', background: inputBg, color: T.textoFuerte, fontSize: 15, outline: 'none' }} />

            <button disabled={cajaGuardando} onClick={guardarMovimiento} style={{ width: '100%', marginTop: 18, border: 'none', borderRadius: 13, padding: 14, fontFamily: fCond, fontWeight: 700, fontSize: 15, letterSpacing: 0.6, textTransform: 'uppercase', cursor: cajaGuardando ? 'default' : 'pointer', background: cajaGuardando ? 'rgba(255,255,255,.08)' : T.boton, color: cajaGuardando ? T.muyTenue : T.botonTexto }}>{cajaGuardando ? 'Guardando…' : 'Guardar movimiento'}</button>
          </div>
        </div>
      </div>
    )
  }

  const modalEliminarCaja = () => {
    if (!cajaEliminar) return null
    const m = cajaEliminar
    return (
      <div onClick={() => !cajaEliminando && setCajaEliminar(null)} style={{ position: 'fixed', inset: 0, zIndex: 85, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: T.fondo, border: `1px solid ${T.borde}`, borderRadius: 18, width: '100%', maxWidth: 380, padding: 22, textAlign: 'center' }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>🗑️</div>
          <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 19, textTransform: 'uppercase', letterSpacing: 0.4, color: T.textoFuerte, marginBottom: 8 }}>¿Borrar movimiento?</div>
          <div style={{ color: T.tenue, fontSize: 13.5, lineHeight: 1.5, marginBottom: 20 }}>Vas a borrar <b style={{ color: T.textoFuerte }}>{m.concepto}</b> ({m.tipo === 'ingreso' ? 'ingreso' : 'gasto'} de <b style={{ color: T.textoFuerte }}>{fmtRD(m.monto)}</b>). Queda en el historial que lo borraste.</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button disabled={cajaEliminando} onClick={() => setCajaEliminar(null)} style={{ flex: 1, border: `1px solid ${T.bordeSuave}`, borderRadius: 12, padding: 13, fontFamily: fCond, fontWeight: 600, fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', background: 'transparent', color: T.tenue }}>Cancelar</button>
            <button disabled={cajaEliminando} onClick={borrarMovimiento} style={{ flex: 1, border: 'none', borderRadius: 12, padding: 13, fontFamily: fCond, fontWeight: 700, fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', background: cajaEliminando ? 'rgba(210,79,79,.5)' : '#d24f4f', color: '#fff' }}>{cajaEliminando ? '…' : 'Borrar'}</button>
          </div>
        </div>
      </div>
    )
  }

  const recargarDir = async () => {
    if (!torneoRow) return
    const [{ directiva: dir }, { bitacora: bit }] = await Promise.all([leerDirectiva(torneoRow.id), leerBitacora(torneoRow.id, 20)])
    setDirectiva(dir); setBitacora(bit)
  }

  const togglePermiso = async (m, valor) => {
    if (!puedeGestionar || togglingId || !torneoRow) return
    setTogglingId(m.id)
    await cambiarPermiso(m.id, valor)
    await registrarBitacora(torneoRow.id, {
      accion: valor ? 'permiso_otorgado' : 'permiso_quitado',
      detalle: `${valor ? 'Le dio' : 'Le quitó'} acceso de administración a ${m.nombre}`,
      objeto_tipo: 'permiso', objeto_id: m.id, actor_nombre: miNombre,
    })
    await recargarDir()
    setTogglingId(null)
  }

  const buscarDir = (texto) => {
    setDirBusqueda(texto)
    if (refDirBusca.current) clearTimeout(refDirBusca.current)
    if (texto.trim().length < 2) { setDirResultados([]); return }
    refDirBusca.current = setTimeout(async () => {
      setDirBuscando(true)
      const { personas } = await buscarPersonas(texto.trim())
      setDirResultados(personas || [])
      setDirBuscando(false)
    }, 300)
  }

  const confirmarAgregarDir = async () => {
    if (!dirSel || dirEnviando || !torneoRow) return
    if (directiva.some((d) => d.perfil_id === dirSel.id)) { setDirToast('Esa persona ya está en la directiva.'); return }
    setDirEnviando(true)
    const nombre = `${dirSel.nombre || ''} ${dirSel.apellido || ''}`.trim() || 'Miembro'
    await agregarDirectiva(torneoRow.id, { perfil_id: dirSel.id, nombre, rol: dirRol, estado: 'pendiente' })
    await invitar(torneoRow.id, { invitado_id: dirSel.id, tipo: 'directiva', rol: dirRol })
    await registrarBitacora(torneoRow.id, {
      accion: 'miembro_agregado',
      detalle: `Agregó a ${nombre} a la directiva como ${ROL_DIR[dirRol] || dirRol}`,
      objeto_tipo: 'miembro', actor_nombre: miNombre,
    })
    await recargarDir()
    setDirEnviando(false)
    setAgregarDir(false); setDirSel(null); setDirBusqueda(''); setDirResultados([])
    setDirToast('Listo. Le llegó la invitación para confirmar.')
  }

  const modalAgregarDir = () => {
    if (!agregarDir) return null
    const inputBg = T.esClaro ? 'rgba(0,0,0,.04)' : 'rgba(255,255,255,.05)'
    return (
      <div onClick={() => setAgregarDir(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '90dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: T.fondo, borderRadius: '20px 20px 0 0', border: `1px solid ${T.bordeSuave}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `0.5px solid ${T.bordeSuave}`, position: 'sticky', top: 0, background: T.fondo, zIndex: 2 }}>
            <div>
              <div style={{ fontFamily: fCond, fontWeight: 600, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: T.muyTenue }}>Agregar a la directiva</div>
              <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 17, textTransform: 'uppercase', letterSpacing: 0.3, color: T.textoFuerte }}>Buscar persona</div>
            </div>
            <button onClick={() => setAgregarDir(false)} style={{ width: 32, height: 32, borderRadius: 9, border: `0.5px solid ${T.bordeSuave}`, background: T.tarjeta, color: T.textoFuerte, fontSize: 15, cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ padding: '14px 16px calc(env(safe-area-inset-bottom) + 18px)' }}>
            <div style={{ fontFamily: fCond, fontWeight: 600, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: T.tenue, marginBottom: 8 }}>¿Qué rol tendrá?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
              {ROLES_AGREGABLES.map((id) => {
                const on = dirRol === id
                return <button key={id} onClick={() => setDirRol(id)} style={{ border: on ? 'none' : `1px solid ${T.bordeSuave}`, borderRadius: 10, padding: '8px 13px', fontFamily: fCond, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3, textTransform: 'uppercase', cursor: 'pointer', background: on ? T.boton : 'transparent', color: on ? T.botonTexto : T.tenue }}>{ROL_DIR[id]}</button>
              })}
            </div>

            {dirSel ? (
              <div style={{ ...tarjeta, padding: 12, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                {fotoOiniciales(dirSel, 42)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.textoFuerte, fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${dirSel.nombre || ''} ${dirSel.apellido || ''}`.trim()}</div>
                  <div style={{ color: T.tenue, fontSize: 12 }}>{dirSel.codigo_unico ? `Código ${dirSel.codigo_unico}` : ''}{dirSel.municipio ? ` · ${dirSel.municipio}` : ''}</div>
                </div>
                <button onClick={() => { setDirSel(null); setDirBusqueda(''); setDirResultados([]) }} style={{ border: 'none', background: 'transparent', color: T.acento, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Cambiar</button>
              </div>
            ) : (
              <>
                <input value={dirBusqueda} onChange={(e) => buscarDir(e.target.value)} placeholder="Nombre o código único…" autoFocus style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.bordeSuave}`, borderRadius: 12, padding: '12px 14px', background: inputBg, color: T.textoFuerte, fontSize: 15, outline: 'none' }} />
                {dirBuscando && <div style={{ color: T.tenue, fontSize: 12.5, padding: '10px 4px' }}>Buscando…</div>}
                {dirResultados.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {dirResultados.map((p) => {
                      const ya = directiva.some((d) => d.perfil_id === p.id)
                      return (
                        <div key={p.id} onClick={() => { if (ya) return; setDirSel(p); setDirResultados([]) }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 6px', borderBottom: `0.5px solid ${T.bordeSuave}`, cursor: ya ? 'default' : 'pointer', opacity: ya ? 0.5 : 1 }}>
                          {fotoOiniciales(p, 38)}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: T.textoFuerte, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${p.nombre || ''} ${p.apellido || ''}`.trim()}</div>
                            <div style={{ color: T.muyTenue, fontSize: 11.5 }}>{p.codigo_unico ? `Código ${p.codigo_unico}` : ''}{ya ? ' · ya está' : ''}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            <button disabled={!dirSel || dirEnviando} onClick={confirmarAgregarDir} style={{ width: '100%', marginTop: 18, border: 'none', borderRadius: 13, padding: 14, fontFamily: fCond, fontWeight: 700, fontSize: 15, letterSpacing: 0.6, textTransform: 'uppercase', cursor: (!dirSel || dirEnviando) ? 'default' : 'pointer', background: (!dirSel || dirEnviando) ? 'rgba(255,255,255,.08)' : T.boton, color: (!dirSel || dirEnviando) ? T.muyTenue : T.botonTexto }}>{dirEnviando ? 'Agregando…' : '＋ Agregar y avisar'}</button>
          </div>
        </div>
      </div>
    )
  }

  const fechaCorta = (iso) => {
    if (!iso) return ''
    const d = new Date(iso), hoy = new Date()
    const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    const etq = d.toDateString() === hoy.toDateString() ? 'Hoy' : `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`
    let h = d.getHours(); const m = d.getMinutes(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12
    return `${etq} ${h}:${String(m).padStart(2, '0')} ${ap}`
  }

  // nombre legible del formato (antes venía de torneoFormato.js)
  const nombreFormato = (f) => ({ liga: 'Liga (todos contra todos)', copa: 'Copa (eliminación directa)', mixto: 'Mixto (grupos + llave)' }[f] || 'Liga (todos contra todos)')

  // ---------- TRANSFORMACIONES: datos reales si cargaron, si no, la data de ejemplo ----------
  const tj = datos ? {
    nombre: torneoRow?.nombre || 'Torneo',
    subtitulo: `${datos.equipos.length} equipos · ${nombreFormato(torneoRow?.formato)}`,
    lugar: torneoRow?.lugar || 'República Dominicana',
    emoji: torneoRow?.emoji || '🏆',
    equipos: datos.equipos.length,
    jugadores: jugCount,
    juegosJugados: datos.juegos.filter((j) => j.estado === 'final').length,
    juegosTotal: datos.juegos.length,
    fase: torneoRow?.fase || '—',
    enVivo: datos.juegos.filter((j) => j.estado === 'vivo').length,
  } : torneoRow ? {
    nombre: torneoRow.nombre || 'Torneo',
    subtitulo: nombreFormato(torneoRow.formato),
    lugar: torneoRow.lugar || 'República Dominicana',
    emoji: torneoRow.emoji || '🏆',
    equipos: 0, jugadores: 0, juegosJugados: 0, juegosTotal: 0,
    fase: torneoRow.fase || '—', enVivo: 0,
  } : TORNEO_DEMO

  const clasificacion = datos ? datos.tabla.map((t) => ({
    pos: t.posicion,
    cod: eqPorId[t.equipo_id]?.codigo || '??',
    nombre: t.nombre,
    pj: t.jugados, g: t.ganados, pts: t.puntos,
    color: eqPorId[t.equipo_id]?.color || T.avatar,
    colorTexto: '#fff',
  })) : torneoRow ? [] : CLASIFICACION_DEMO

  const EMO = { puntos: ['🏀', '#e8b65a'], rebotes: ['💪', '#5dcaa5'], asistencias: ['🤝', '#6fb0ec'], robos: ['✋', '#d4537e'], tapones: ['🚫', '#ef9f27'] }
  const lideres = datos ? datos.lideres.filter((c) => c.filas.length).map((c) => {
    const top = c.filas[0]
    const par = EMO[c.id] || ['🏀', '#e8b65a']
    return { stat: c.titulo, emoji: par[0], jugador: top.nombre, equipo: eqPorId[top.equipo_id]?.nombre || '', valor: top.valor, color: par[1] }
  }) : torneoRow ? [] : LIDERES_DEMO

  const top10 = datos ? datos.top10.map((j) => ({
    pos: j.posicion, nombre: j.nombre, equipo: eqPorId[j.equipo_id]?.nombre || '',
    cod: eqPorId[j.equipo_id]?.codigo || '??', val: j.mcRating, mvp: j.posicion <= 3,
  })) : torneoRow ? [] : TOP10_DEMO

  const proximos = datos ? datos.juegos.filter((j) => j.estado === 'proximo').slice(0, 6).map((j, i) => ({
    local: eqPorId[j.equipoA_id]?.nombre || 'Equipo', visita: eqPorId[j.equipoB_id]?.nombre || 'Equipo',
    fase: j.jornada ? `Jornada ${j.jornada}` : '', lugar: '', cuando: fechaCorta(j.fecha), destacado: i === 0,
  })) : torneoRow ? [] : PROXIMOS_DEMO

  const tarjeta = { background: `linear-gradient(160deg, ${T.tarjeta}, ${card2})`, border: `0.5px solid ${T.bordeSuave}`, borderRadius: 16, overflow: 'hidden' }
  const tituloModulo = (txt, color) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12, marginTop: 2 }}>
      <span style={{ width: 4, height: 18, background: color || T.acento, borderRadius: 2, display: 'inline-block' }} />
      <span style={{ fontFamily: fCond, color: T.textoFuerte, fontSize: 16, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{txt}</span>
    </div>
  )
  const avatarEquipo = (cod, color, colorTexto, size) => {
    const s = size || 22; const r = Math.round(s * 0.26)
    return <span style={{ width: s, height: s, borderRadius: r, background: `linear-gradient(155deg, ${color}, rgba(0,0,0,.5))`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: fCond, fontSize: s * 0.42, color: '#fff', fontWeight: 700, letterSpacing: 0.3, flexShrink: 0, border: '1.5px solid rgba(255,255,255,.14)', boxShadow: '0 4px 12px rgba(0,0,0,.4)' }}>{cod}</span>
  }
  const fotoOiniciales = (p, size) => {
    const s = size || 38
    const ini = `${(p.nombre || '?')[0] || ''}${(p.apellido || '')[0] || ''}`.toUpperCase()
    if (p.foto_url) return <img src={p.foto_url} alt="" style={{ width: s, height: s, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    return <span style={{ width: s, height: s, borderRadius: '50%', background: T.avatar, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: fCond, fontWeight: 700, fontSize: s * 0.4, flexShrink: 0 }}>{ini || '?'}</span>
  }
  const colorDe = (cod) => clasificacion.find((e) => e.cod === cod)?.color || T.avatar
  const colorTxtDe = (cod) => clasificacion.find((e) => e.cod === cod)?.colorTexto || '#fff'

  const alGenerar = async (reemplazar = false) => {
    if (!torneoRow || generando) return
    setGenerando(true); setErrorGen(null)
    try {
      const { error } = await generarCalendario(torneoRow.id, datos?.equipos || [], torneoRow.formato || 'liga', { vueltas, reemplazar })
      if (error) { setErrorGen(error); setGenerando(false); return }
      await registrarBitacora(torneoRow.id, { accion: 'calendario_generado', detalle: `Generó el calendario del torneo${reemplazar ? ' (lo reemplazó)' : ''}`, objeto_tipo: 'juego', actor_nombre: miNombre })
      setRecarga((r) => r + 1) // recarga el torneo ya con su calendario
    } catch (e) {
      setErrorGen('No se pudo generar el calendario.')
    } finally {
      setGenerando(false)
    }
  }

  const cerrarModalInvitar = () => { setInvitarEquipo(null); setBusqueda(''); setResultados([]); setSeleccionado(null); setRolInvitar('jugador'); setMensajeInvitar('') }

  const alBuscar = (texto) => {
    setBusqueda(texto); setSeleccionado(null)
    if (refBusca.current) clearTimeout(refBusca.current)
    if (texto.trim().length < 2) { setResultados([]); return }
    refBusca.current = setTimeout(async () => {
      setBuscando(true)
      const { personas } = await buscarPersonas(texto.trim())
      setResultados(personas || [])
      setBuscando(false)
    }, 320)
  }

  const enviarInvitacion = async () => {
    if (!seleccionado || !invitarEquipo || !torneoRow || enviando) return
    const yaEsta = (datos?.roster || []).some((r) => r.equipo_id === invitarEquipo.id && r.perfilId === seleccionado.id)
    if (yaEsta) { setToastInvitar('Esa persona ya está en este equipo'); setTimeout(() => setToastInvitar(null), 3000); return }
    setEnviando(true)
    const nombreP = `${seleccionado.nombre || ''} ${seleccionado.apellido || ''}`.trim() || 'Jugador'
    // 1) enviar la invitación PRIMERO. Si falla, no tocamos la plantilla (así no quedan repetidos).
    const { error } = await invitar(torneoRow.id, { invitado_id: seleccionado.id, tipo: rolInvitar, equipo_id: invitarEquipo.id, mensaje: mensajeInvitar.trim() || null })
    if (error) { setEnviando(false); setToastInvitar('No se pudo enviar: ' + error); setTimeout(() => setToastInvitar(null), 3500); return }
    // 2) solo si la invitación salió, crear la fila pendiente en el roster (al aceptar pasa a confirmado)
    await agregarJugador(torneoRow.id, invitarEquipo.id, { perfil_id: seleccionado.id, nombre: nombreP, es_capitan: rolInvitar === 'capitan', estado: 'pendiente' })
    setEnviando(false)
    await registrarBitacora(torneoRow.id, { accion: 'invitacion_enviada', detalle: `Invitó a ${nombreP} a ${invitarEquipo.nombre} como ${rolInvitar === 'capitan' ? 'capitán' : 'jugador'}`, objeto_tipo: 'invitacion', actor_nombre: miNombre })
    setToastInvitar(`Invitación enviada a ${nombreP} 🏀`); setTimeout(() => setToastInvitar(null), 3500)
    cerrarModalInvitar()
    setRecarga((r) => r + 1)
  }

  const modalInvitar = () => {
    if (!invitarEquipo) return null
    const eq = invitarEquipo
    const idsEnEquipo = new Set((datos?.roster || []).filter((r) => r.equipo_id === eq.id).map((r) => r.perfilId).filter(Boolean))
    const inputBg = T.esClaro ? '#fff' : 'rgba(255,255,255,.05)'
    const etiqueta = { fontFamily: fCond, fontWeight: 600, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: T.tenue, marginBottom: 8 }
    return (
      <div onClick={cerrarModalInvitar} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: esAncho ? 'center' : 'flex-end', justifyContent: 'center', padding: esAncho ? 20 : 0 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: T.fondo, border: `1px solid ${T.borde}`, borderRadius: esAncho ? 20 : '20px 20px 0 0', width: '100%', maxWidth: 540, maxHeight: '90dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px', borderBottom: `0.5px solid ${T.bordeSuave}`, position: 'sticky', top: 0, background: T.fondo, zIndex: 2 }}>
            {avatarEquipo(eq.codigo || '??', eq.color || T.avatar, '#fff', 38)}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: fCond, fontWeight: 600, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: T.muyTenue }}>Invitar a</div>
              <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 17, textTransform: 'uppercase', letterSpacing: 0.3, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eq.nombre}</div>
            </div>
            <button onClick={cerrarModalInvitar} style={{ width: 32, height: 32, borderRadius: 9, border: `0.5px solid ${T.bordeSuave}`, background: T.tarjeta, color: T.textoFuerte, fontSize: 15, cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ padding: 16 }}>
            <div style={etiqueta}>¿Cómo lo invitas?</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {[['jugador', '🏀 Jugador'], ['capitan', '© Capitán']].map(([id, txt]) => {
                const on = rolInvitar === id
                return <button key={id} onClick={() => setRolInvitar(id)} style={{ flex: 1, border: on ? 'none' : `1px solid ${T.bordeSuave}`, borderRadius: 11, padding: 11, fontFamily: fCond, fontWeight: 700, fontSize: 13.5, letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer', background: on ? T.boton : 'transparent', color: on ? T.botonTexto : T.tenue }}>{txt}</button>
              })}
            </div>

            <div style={etiqueta}>Busca a la persona</div>
            <input value={busqueda} onChange={(e) => alBuscar(e.target.value)} placeholder="Nombre o código único…" autoFocus style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.bordeSuave}`, borderRadius: 12, padding: '12px 14px', background: inputBg, color: T.textoFuerte, fontSize: 15, outline: 'none' }} />

            {seleccionado ? (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 13, background: 'rgba(245,184,46,.13)', border: `1px solid ${T.borde}` }}>
                {fotoOiniciales(seleccionado, 42)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.textoFuerte, fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${seleccionado.nombre || ''} ${seleccionado.apellido || ''}`.trim()}</div>
                  <div style={{ color: T.muyTenue, fontSize: 11.5 }}>{seleccionado.codigo_unico ? '#' + seleccionado.codigo_unico : ''}{seleccionado.municipio ? ` · ${seleccionado.municipio}` : ''}</div>
                </div>
                <button onClick={() => setSeleccionado(null)} style={{ border: 'none', background: 'transparent', color: T.tenue, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cambiar</button>
              </div>
            ) : (
              <div style={{ marginTop: 10 }}>
                {buscando && <div style={{ color: T.muyTenue, fontSize: 12.5, padding: '8px 2px' }}>Buscando…</div>}
                {!buscando && busqueda.trim().length >= 2 && resultados.length === 0 && <div style={{ color: T.muyTenue, fontSize: 12.5, padding: '8px 2px', lineHeight: 1.5 }}>Nadie con ese nombre o código. La persona debe tener cuenta en Media Cancha.</div>}
                {resultados.map((p) => {
                  const ya = idsEnEquipo.has(p.id)
                  return (
                    <div key={p.id} onClick={() => { if (ya) return; setSeleccionado(p); setResultados([]) }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 6px', borderBottom: `0.5px solid ${T.bordeSuave}`, cursor: ya ? 'default' : 'pointer', opacity: ya ? 0.55 : 1 }}>
                      {fotoOiniciales(p, 38)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: T.textoFuerte, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${p.nombre || ''} ${p.apellido || ''}`.trim()}</div>
                        <div style={{ color: T.muyTenue, fontSize: 11.5 }}>{p.codigo_unico ? '#' + p.codigo_unico : ''}{p.municipio ? ` · ${p.municipio}` : ''}</div>
                      </div>
                      <span style={{ color: ya ? T.muyTenue : T.acento, fontSize: 12.5, fontWeight: 700 }}>{ya ? 'Ya en el equipo' : 'Elegir'}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ ...etiqueta, margin: '18px 0 8px' }}>Mensaje (opcional)</div>
            <textarea value={mensajeInvitar} onChange={(e) => setMensajeInvitar(e.target.value)} placeholder="Ej: Te queremos en el equipo para la Copa." rows={2} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.bordeSuave}`, borderRadius: 12, padding: '11px 14px', background: inputBg, color: T.textoFuerte, fontSize: 14, outline: 'none', resize: 'none', fontFamily: font }} />

            <button disabled={!seleccionado || enviando} onClick={enviarInvitacion} style={{ width: '100%', marginTop: 16, border: 'none', borderRadius: 13, padding: 14, fontFamily: fCond, fontWeight: 700, fontSize: 15, letterSpacing: 0.6, textTransform: 'uppercase', cursor: (!seleccionado || enviando) ? 'default' : 'pointer', background: (!seleccionado || enviando) ? 'rgba(255,255,255,.08)' : T.boton, color: (!seleccionado || enviando) ? T.muyTenue : T.botonTexto, boxShadow: (!seleccionado || enviando) ? 'none' : '0 8px 22px rgba(245,184,46,.26)' }}>{enviando ? 'Enviando…' : '✉️ Enviar invitación'}</button>
            <div style={{ color: T.muyTenue, fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 1.5, paddingBottom: 'calc(env(safe-area-inset-bottom) + 6px)' }}>La persona la verá en "Mis invitaciones" y al aceptar entra al equipo.</div>
          </div>
        </div>
      </div>
    )
  }

  const eliminarJugador = async () => {
    if (!eliminarJug || eliminando) return
    const nombreEl = eliminarJug.nombre; const equipoEl = eliminarJug.equipoNombre
    setEliminando(true)
    const { error } = await supabase.from('torneo_jugadores').delete().eq('id', eliminarJug.jugador_id)
    setEliminando(false)
    if (error) { setEliminarJug(null); setToastInvitar('No se pudo eliminar: ' + error); setTimeout(() => setToastInvitar(null), 3500); return }
    setEliminarJug(null); setToastInvitar('Jugador eliminado'); setTimeout(() => setToastInvitar(null), 3000)
    if (torneoRow) await registrarBitacora(torneoRow.id, { accion: 'jugador_eliminado', detalle: `Sacó a ${nombreEl}${equipoEl ? ' de ' + equipoEl : ''}`, objeto_tipo: 'jugador', actor_nombre: miNombre })
    setRecarga((r) => r + 1)
  }

  const modalEliminar = () => {
    if (!eliminarJug) return null
    const j = eliminarJug
    return (
      <div onClick={() => !eliminando && setEliminarJug(null)} style={{ position: 'fixed', inset: 0, zIndex: 85, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: T.fondo, border: `1px solid ${T.borde}`, borderRadius: 18, width: '100%', maxWidth: 380, padding: 22, textAlign: 'center' }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>🗑️</div>
          <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 19, textTransform: 'uppercase', letterSpacing: 0.4, color: T.textoFuerte, marginBottom: 8 }}>¿Eliminar jugador?</div>
          <div style={{ color: T.tenue, fontSize: 13.5, lineHeight: 1.5, marginBottom: 20 }}>Vas a sacar a <b style={{ color: T.textoFuerte }}>{j.nombre}</b>{j.equipoNombre ? <> de <b style={{ color: T.textoFuerte }}>{j.equipoNombre}</b></> : null}. Lo puedes volver a invitar después.</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button disabled={eliminando} onClick={() => setEliminarJug(null)} style={{ flex: 1, border: `1px solid ${T.bordeSuave}`, borderRadius: 12, padding: 13, fontFamily: fCond, fontWeight: 600, fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', background: 'transparent', color: T.tenue }}>Cancelar</button>
            <button disabled={eliminando} onClick={eliminarJugador} style={{ flex: 1, border: 'none', borderRadius: 12, padding: 13, fontFamily: fCond, fontWeight: 700, fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', background: eliminando ? 'rgba(210,79,79,.5)' : '#d24f4f', color: '#fff' }}>{eliminando ? '…' : 'Eliminar'}</button>
          </div>
        </div>
      </div>
    )
  }

  const cerrarConfirmar = () => { setConfirmarJug(null); setPinCodigo(''); setErrorPin('') }

  const confirmarConCodigo = async () => {
    if (!confirmarJug || confirmandoPin) return
    if (!/^[0-9]{4}$/.test(pinCodigo)) { setErrorPin('Escribe los cuatro dígitos.'); return }
    setConfirmandoPin(true); setErrorPin('')
    const { data, error } = await supabase.rpc('confirmar_jugador_con_codigo', { p_jugador_id: confirmarJug.jugador_id, p_pin: pinCodigo })
    setConfirmandoPin(false)
    if (error) { setErrorPin(error.message || 'No se pudo confirmar.'); return }
    if (data === true) {
      const nom = confirmarJug.nombre
      cerrarConfirmar()
      setToastInvitar('✓ ' + nom + ' confirmado'); setTimeout(() => setToastInvitar(null), 3000)
      if (torneoRow) await registrarBitacora(torneoRow.id, { accion: 'jugador_confirmado', detalle: `Confirmó a ${nom} con su código`, objeto_tipo: 'jugador', actor_nombre: miNombre })
      setRecarga((r) => r + 1)
    } else {
      setErrorPin('Código incorrecto. Inténtalo de nuevo.')
    }
  }

  const modalConfirmar = () => {
    if (!confirmarJug) return null
    const j = confirmarJug
    return (
      <div onClick={() => !confirmandoPin && cerrarConfirmar()} style={{ position: 'fixed', inset: 0, zIndex: 85, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: T.fondo, border: `1px solid ${T.borde}`, borderRadius: 18, width: '100%', maxWidth: 380, padding: 22, textAlign: 'center' }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>🔒</div>
          <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 19, textTransform: 'uppercase', letterSpacing: 0.4, color: T.textoFuerte, marginBottom: 8 }}>Confirmar a {j.nombre}</div>
          <div style={{ color: T.tenue, fontSize: 13.5, lineHeight: 1.5, marginBottom: 18 }}>Que <b style={{ color: T.textoFuerte }}>{j.nombre}</b> escriba aquí su código de jugador de cuatro dígitos para confirmar al instante.</div>
          <input value={pinCodigo} onChange={(e) => { setPinCodigo(e.target.value.replace(/\D/g, '').slice(0, 4)); setErrorPin('') }} type="tel" inputMode="numeric" autoFocus maxLength={4} placeholder="••••" style={{ width: '100%', textAlign: 'center', fontFamily: fDisp, fontSize: 34, letterSpacing: 14, padding: '12px 0', borderRadius: 13, border: `1px solid ${errorPin ? 'rgba(226,75,74,.6)' : T.borde}`, background: T.esClaro ? 'rgba(0,0,0,.04)' : 'rgba(255,255,255,.05)', color: T.textoFuerte, outline: 'none', boxSizing: 'border-box' }} />
          {errorPin && <div style={{ fontSize: 12.5, color: '#e0563f', marginTop: 9 }}>{errorPin}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button disabled={confirmandoPin} onClick={cerrarConfirmar} style={{ flex: 1, border: `1px solid ${T.bordeSuave}`, borderRadius: 12, padding: 13, fontFamily: fCond, fontWeight: 600, fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', background: 'transparent', color: T.tenue }}>Cancelar</button>
            <button disabled={confirmandoPin || pinCodigo.length !== 4} onClick={confirmarConCodigo} style={{ flex: 1, border: 'none', borderRadius: 12, padding: 13, fontFamily: fCond, fontWeight: 700, fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase', cursor: (confirmandoPin || pinCodigo.length !== 4) ? 'default' : 'pointer', background: (confirmandoPin || pinCodigo.length !== 4) ? 'rgba(52,199,89,.4)' : '#2bb14e', color: '#fff' }}>{confirmandoPin ? '…' : 'Confirmar'}</button>
          </div>
        </div>
      </div>
    )
  }

  const modalJugador = () => {
    if (!jugadorVer) return null
    const j = jugadorVer
    const tiles = [{ l: 'Puntos', s: '—' }, { l: 'Rebotes', s: '—' }, { l: 'Asistencias', s: '—' }]
    return (
      <div onClick={() => setJugadorVer(null)} style={{ position: 'fixed', inset: 0, zIndex: 85, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: T.fondo, border: `1px solid ${T.borde}`, borderRadius: 18, width: '100%', maxWidth: 400, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 18 }}>
            {j.foto ? (
              <img src={j.foto} alt="" style={{ width: 52, height: 52, borderRadius: 13, objectFit: 'cover', flexShrink: 0, border: `1px solid ${T.bordeSuave}` }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 13, background: T.esClaro ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)', color: T.acento, fontFamily: fDisp, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{j.numero != null ? j.numero : (j.nombre || '?').trim().charAt(0).toUpperCase()}</div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: fDisp, fontSize: 22, color: T.textoFuerte, lineHeight: 1.05, textTransform: 'uppercase' }}>{j.nombre}</div>
              <div style={{ color: T.tenue, fontSize: 12.5, marginTop: 3 }}>{[j.posicion, j.equipoNombre].filter(Boolean).join(' · ') || '—'}{j.esCapitan ? ' · Capitán' : ''}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {tiles.map((t, i) => (
              <div key={i} style={{ flex: 1, background: T.tarjeta, border: `0.5px solid ${T.bordeSuave}`, borderRadius: 13, padding: '12px 6px', textAlign: 'center' }}>
                <div style={{ fontFamily: fDisp, fontSize: 26, color: T.textoFuerte, lineHeight: 1 }}>{t.s}</div>
                <div style={{ fontFamily: fCond, fontSize: 10, color: T.muyTenue, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 6 }}>{t.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: 'rgba(245,184,46,.08)', border: '1px solid rgba(245,184,46,.22)', borderRadius: 12, padding: '11px 13px', marginBottom: 18 }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>📊</span>
            <div style={{ color: T.tenue, fontSize: 12.5, lineHeight: 1.45 }}>Todavía no ha jugado. Sus estadísticas se van a ir llenando solas según juegue en el torneo.</div>
          </div>
          {j.perfilId ? (
            <button onClick={() => { const id = j.perfilId; setJugadorVer(null); onVerPerfil && onVerPerfil(id) }} style={{ width: '100%', border: 'none', borderRadius: 13, padding: 14, fontFamily: fCond, fontWeight: 700, fontSize: 14.5, letterSpacing: 0.6, textTransform: 'uppercase', cursor: 'pointer', background: T.boton, color: T.botonTexto, boxShadow: '0 8px 22px rgba(245,184,46,.26)' }}>Ver perfil y seguir</button>
          ) : (
            <div style={{ textAlign: 'center', color: T.muyTenue, fontSize: 12, padding: '4px 0 2px' }}>Este jugador todavía no tiene cuenta en Media Cancha.</div>
          )}
        </div>
      </div>
    )
  }

  const Contenido = () => {
    if (pestana === 'resumen') {
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 9, marginBottom: 16 }}>
            {[{ l: 'Equipos', v: tj.equipos }, { l: 'Jugadores', v: tj.jugadores }, { l: 'Juegos', v: `${tj.juegosJugados}/${tj.juegosTotal}` }, { l: 'Fase', v: tj.fase, chico: true }].map((m, i) => (
              <div key={i} style={{ background: T.tarjeta, border: `0.5px solid ${T.bordeSuave}`, borderRadius: 13, padding: '12px 14px' }}>
                <div style={{ color: T.tenue, fontSize: 11, marginBottom: 5 }}>{m.l}</div>
                <div style={{ fontFamily: fDisp, color: T.textoFuerte, fontSize: m.chico ? 17 : 26, lineHeight: 1.05 }}>{m.v}</div>
              </div>
            ))}
          </div>

          {tj.enVivo > 0 && (
            <>
              {tituloModulo('En vivo ahora', '#e24b4a')}
              <div style={{ ...tarjeta, border: `0.5px solid ${T.borde}`, padding: 14, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: T.acento, fontSize: 12, fontWeight: 800 }}>🏆 Semifinal</span>
                  <span style={{ color: '#f09595', fontSize: 11, fontWeight: 700 }}>● EN VIVO</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                    {avatarEquipo('LOB', colorDe('LOB'), colorTxtDe('LOB'), 40)}
                    <span style={{ color: T.textoBody, fontSize: 11 }}>Lobos</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontFamily: fDisp, color: T.textoFuerte, fontSize: 30, lineHeight: 1 }}>58 — 52</span>
                    <span style={{ color: T.tenue, fontSize: 11 }}>3er cuarto</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                    {avatarEquipo('TIG', colorDe('TIG'), colorTxtDe('TIG'), 40)}
                    <span style={{ color: T.textoBody, fontSize: 11 }}>Tigres</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {tituloModulo('Clasificación')}
          <div style={{ ...tarjeta, marginBottom: 18 }}>
            <div style={{ padding: '4px 14px 10px' }}>
              {clasificacion.map((e) => (
                <div key={e.pos} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', fontSize: 13, borderBottom: e.pos < 4 ? `0.5px solid ${T.bordeSuave}` : 'none' }}>
                  <span style={{ width: 22, color: e.pos === 1 ? T.acento : T.tenue, fontWeight: 700 }}>{e.pos}</span>
                  <span style={{ flex: 1, color: T.textoFuerte, display: 'flex', alignItems: 'center', gap: 7 }}>{avatarEquipo(e.cod, e.color, e.colorTexto, 22)}{e.nombre}</span>
                  <span style={{ width: 28, textAlign: 'center', color: T.tenue }}>{e.pj}</span>
                  <span style={{ width: 28, textAlign: 'center', color: T.textoBody }}>{e.g}</span>
                  <span style={{ width: 30, textAlign: 'center', color: T.acento, fontWeight: 700 }}>{e.pts}</span>
                </div>
              ))}
            </div>
          </div>

          {tituloModulo('Próximos juegos', '#6fb0ec')}
          <div style={{ ...tarjeta, marginBottom: 8 }}>
            <div style={{ padding: '8px 14px 10px' }}>
              {proximos.map((j, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < proximos.length - 1 ? `0.5px solid ${T.bordeSuave}` : 'none' }}>
                  <div>
                    <div style={{ color: T.textoBody, fontSize: 13 }}>{j.visita ? `${j.local} vs ${j.visita}` : j.local}</div>
                    <div style={{ color: T.muyTenue, fontSize: 11 }}>{j.fase}{j.lugar ? ` · ${j.lugar}` : ''}</div>
                  </div>
                  <div style={{ color: j.destacado ? T.acento : T.tenue, fontSize: 12, fontWeight: j.destacado ? 700 : 400 }}>{j.cuando}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Módulo pequeño de contabilidad — SOLO el admin lo ve */}
          {esAdmin && (
            <div style={{ marginTop: 18 }}>
              {tituloModulo('Caja del torneo', '#5dcaa5')}
              <div onClick={() => setPestana('contabilidad')} style={{ ...tarjeta, padding: 14, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ color: T.tenue, fontSize: 11 }}>Balance del fondo</div>
                    <div style={{ fontFamily: fDisp, color: cajaBalance >= 0 ? T.acento : '#f09595', fontSize: 26, lineHeight: 1 }}>{fmtRD(cajaBalance)}</div>
                  </div>
                  <span style={{ color: T.tenue, fontSize: 16 }}>›</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, background: T.esClaro ? 'rgba(93,202,165,.08)' : 'rgba(93,202,165,.1)', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ color: T.muyTenue, fontSize: 10 }}>Ingresos</div>
                    <div style={{ color: '#5dcaa5', fontSize: 14, fontWeight: 800 }}>+{fmtCorto(cajaIngresos)}</div>
                  </div>
                  <div style={{ flex: 1, background: T.esClaro ? 'rgba(240,149,149,.08)' : 'rgba(240,149,149,.1)', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ color: T.muyTenue, fontSize: 10 }}>Gastos</div>
                    <div style={{ color: '#f09595', fontSize: 14, fontWeight: 800 }}>−{fmtCorto(cajaGastos)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )
    }

    if (pestana === 'clasificacion') {
      return (
        <>
          {tituloModulo('Tabla de posiciones')}
          <div style={tarjeta}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', fontSize: 10.5, color: T.tenue, borderBottom: `0.5px solid ${T.bordeSuave}`, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              <span style={{ width: 22 }}>#</span><span style={{ flex: 1 }}>Equipo</span>
              <span style={{ width: 30, textAlign: 'center' }}>PJ</span><span style={{ width: 30, textAlign: 'center' }}>G</span>
              <span style={{ width: 30, textAlign: 'center' }}>P</span><span style={{ width: 34, textAlign: 'center', color: T.acento }}>Pts</span>
            </div>
            {clasificacion.map((e) => (
              <div key={e.pos} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', fontSize: 13.5, borderBottom: `0.5px solid ${T.bordeSuave}` }}>
                <span style={{ width: 22, color: e.pos <= 2 ? T.acento : T.tenue, fontWeight: 700 }}>{e.pos}</span>
                <span style={{ flex: 1, color: T.textoFuerte, display: 'flex', alignItems: 'center', gap: 8 }}>{avatarEquipo(e.cod, e.color, e.colorTexto, 26)}{e.nombre}</span>
                <span style={{ width: 30, textAlign: 'center', color: T.tenue }}>{e.pj}</span>
                <span style={{ width: 30, textAlign: 'center', color: T.textoBody }}>{e.g}</span>
                <span style={{ width: 30, textAlign: 'center', color: T.tenue }}>{e.pj - e.g}</span>
                <span style={{ width: 34, textAlign: 'center', color: T.acento, fontWeight: 800 }}>{e.pts}</span>
              </div>
            ))}
          </div>
          <div style={{ color: T.muyTenue, fontSize: 11.5, textAlign: 'center', marginTop: 12 }}>Los 2 primeros clasifican a la final 🏆</div>
        </>
      )
    }

    if (pestana === 'lideres') {
      return (
        <>
          {tituloModulo('Líderes por estadística')}
          <div style={{ color: T.muyTenue, fontSize: 11.5, marginBottom: 14, marginTop: -4 }}>Solo aparecen las estadísticas que este torneo lleva.</div>
          {lideres.map((l, i) => (
            <div key={i} style={{ ...tarjeta, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: `${l.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23, flexShrink: 0 }}>{l.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: T.tenue, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{l.stat}</div>
                <div style={{ color: T.textoFuerte, fontSize: 15, fontWeight: 700 }}>{l.jugador}</div>
                <div style={{ color: T.muyTenue, fontSize: 12 }}>{l.equipo}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: l.color, fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{l.valor}</div>
                <div style={{ color: T.muyTenue, fontSize: 10.5, marginTop: 2 }}>por juego</div>
              </div>
            </div>
          ))}
        </>
      )
    }

    if (pestana === 'top10') {
      return (
        <>
          {tituloModulo('Top 10 del torneo')}
          <div style={{ color: T.muyTenue, fontSize: 11.5, marginBottom: 14, marginTop: -4 }}>Ranking general por valoración. Los 3 primeros entran a votación de MVP 👑</div>
          <div style={tarjeta}>
            {top10.map((j, i) => (
              <div key={j.pos} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderBottom: i < top10.length - 1 ? `0.5px solid ${T.bordeSuave}` : 'none', background: j.mvp ? `${T.acento}0d` : 'transparent' }}>
                <span style={{ width: 24, textAlign: 'center', color: j.pos <= 3 ? T.acento : T.tenue, fontSize: 15, fontWeight: 800 }}>{j.pos}</span>
                {avatarEquipo(j.cod, colorDe(j.cod), colorTxtDe(j.cod), 30)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.textoFuerte, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombre}</div>
                  <div style={{ color: T.muyTenue, fontSize: 11.5 }}>{j.equipo}</div>
                </div>
                {j.mvp && <span style={{ fontSize: 13 }}>👑</span>}
                <span style={{ color: T.acento, fontSize: 16, fontWeight: 800 }}>{j.val}</span>
              </div>
            ))}
          </div>
        </>
      )
    }

    if (pestana === 'mvp') {
      const finalistas = top10.filter((j) => j.mvp)
      return (
        <>
          {tituloModulo('Votación MVP', '#e8b65a')}
          <div style={{ ...tarjeta, padding: 16, marginBottom: 16, background: `${T.acento}10`, border: `0.5px solid ${T.borde}` }}>
            <div style={{ color: T.textoFuerte, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>¿Cómo se decide el MVP? 👑</div>
            {[{ l: 'Algoritmo de la app (estadísticas)', pct: 50, color: '#e8b65a' }, { l: 'Voto de los fanáticos', pct: 25, color: '#6fb0ec' }, { l: 'Jugadores + directiva', pct: 25, color: '#5dcaa5' }].map((f, i) => (
              <div key={i} style={{ marginBottom: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ color: T.textoBody, fontSize: 12.5 }}>{f.l}</span>
                  <span style={{ color: f.color, fontSize: 12.5, fontWeight: 800 }}>{f.pct}%</span>
                </div>
                <div style={{ height: 6, background: T.bordeSuave, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${f.pct}%`, height: '100%', background: f.color }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ color: T.tenue, fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>Vota por tu MVP (fanáticos · 25%)</div>
          {finalistas.map((j) => (
            <div key={j.pos} style={{ ...tarjeta, padding: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              {avatarEquipo(j.cod, colorDe(j.cod), colorTxtDe(j.cod), 42)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: T.textoFuerte, fontSize: 14.5, fontWeight: 700 }}>{j.nombre}</div>
                <div style={{ color: T.muyTenue, fontSize: 12 }}>{j.equipo} · {j.val} val</div>
              </div>
              <button onClick={() => alert('Voto registrado (demo) 🏀')} style={{ border: 'none', borderRadius: 20, padding: '9px 18px', background: T.boton, color: T.botonTexto, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Votar</button>
            </div>
          ))}
        </>
      )
    }

    // ---------- EQUIPOS (con plantilla / roster) ----------
    if (pestana === 'equipos') {
      const equiposReales = datos?.equipos || []
      return (
        <>
          {tituloModulo('Equipos del torneo')}
          <div style={{ color: T.muyTenue, fontSize: 11.5, marginBottom: 14, marginTop: -4 }}>
            {equiposReales.length > 0 ? 'Toca un equipo para ver su plantilla completa.' : 'Todavía no hay equipos inscritos en este torneo.'}
          </div>
          {equiposReales.map((eq) => {
            const abierto = equipoAbierto === eq.id
            const jugs = (datos?.roster || []).filter((r) => r.equipo_id === eq.id)
            const ft = (datos?.tabla || []).find((t) => t.equipo_id === eq.id)
            return (
              <div key={eq.id} style={{ ...tarjeta, marginBottom: 10 }}>
                <div onClick={() => setEquipoAbierto(abierto ? null : eq.id)} style={{ padding: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  {avatarEquipo(eq.codigo || '??', eq.color || T.avatar, '#fff', 46)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.textoFuerte, fontSize: 15.5, fontWeight: 800 }}>{eq.nombre}</div>
                    <div style={{ color: T.muyTenue, fontSize: 12 }}>{eq.dt_nombre ? `DT: ${eq.dt_nombre}` : 'Sin DT'}{eq.zona ? ` · ${eq.zona}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 4 }}>
                    <div style={{ color: T.acento, fontSize: 13, fontWeight: 800 }}>{ft ? `${ft.ganados}-${ft.perdidos}` : '0-0'}</div>
                    <div style={{ color: T.muyTenue, fontSize: 10.5 }}>{jugs.length} jug.</div>
                  </div>
                  <span style={{ color: T.tenue, fontSize: 16, transform: abierto ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>›</span>
                </div>

                {abierto && (
                  <div style={{ borderTop: `0.5px solid ${T.bordeSuave}`, padding: '6px 13px 12px' }}>
                    {jugs.length === 0 && <div style={{ color: T.muyTenue, fontSize: 12, padding: '8px 2px' }}>Este equipo no tiene jugadores todavía.</div>}
                    {esAdmin && (
                      <button onClick={() => { cerrarModalInvitar(); setInvitarEquipo(eq) }} style={{ width: '100%', marginTop: 6, marginBottom: jugs.length ? 6 : 2, border: `1px dashed ${T.borde}`, borderRadius: 11, padding: 11, fontFamily: fCond, fontWeight: 700, fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', background: 'rgba(245,184,46,.1)', color: T.acento }}>＋ Invitar jugador</button>
                    )}
                    {jugs.map((j) => (
                      <div key={j.jugador_id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: `0.5px solid ${T.bordeSuave}` }}>
                        {j.foto ? (
                          <img src={j.foto} alt="" style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover', flexShrink: 0, border: `1px solid ${T.bordeSuave}` }} />
                        ) : (
                          <span style={{ width: 34, height: 34, borderRadius: 9, background: T.esClaro ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)', color: T.acento, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{j.numero ?? '–'}</span>
                        )}
                        <div onClick={() => setJugadorVer({ ...j, equipoNombre: eq.nombre })} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                          <div style={{ color: T.textoFuerte, fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>{j.nombre}{j.esCapitan && <span style={{ fontSize: 9, fontWeight: 800, color: T.botonTexto, background: T.boton, padding: '1px 6px', borderRadius: 8 }}>CAP</span>}{j.esRefuerzo && <span style={{ fontSize: 9, fontWeight: 800, color: T.tenue, border: `1px solid ${T.bordeSuave}`, padding: '1px 6px', borderRadius: 8 }}>R</span>}{j.estado === 'pendiente' && <span style={{ fontSize: 9, fontWeight: 800, color: '#e8a33a', background: 'rgba(232,163,58,.15)', border: '1px solid rgba(232,163,58,.4)', padding: '1px 6px', borderRadius: 8, letterSpacing: 0.3 }}>POR CONFIRMAR</span>}{j.estado === 'confirmado' && <span style={{ fontSize: 9, fontWeight: 800, color: '#34c759', background: 'rgba(52,199,89,.13)', border: '1px solid rgba(52,199,89,.4)', padding: '1px 6px', borderRadius: 8, letterSpacing: 0.3 }}>CONFIRMADO</span>}</div>
                          <div style={{ color: T.muyTenue, fontSize: 11.5 }}>{j.numero != null ? `#${j.numero} · ` : ''}{j.posicion || 'Jugador'}</div>
                        </div>
                        {esAdmin && j.estado === 'pendiente' && <button onClick={() => { setPinCodigo(''); setErrorPin(''); setConfirmarJug({ ...j, equipoNombre: eq.nombre }) }} style={{ flexShrink: 0, height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(52,199,89,.45)', background: 'rgba(52,199,89,.12)', color: '#34c759', fontFamily: fCond, fontWeight: 700, fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }} title="Confirmar con código">Confirmar</button>}
                        {esAdmin && <button onClick={() => setEliminarJug({ ...j, equipoNombre: eq.nombre })} style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.bordeSuave}`, background: 'transparent', color: T.tenue, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Eliminar jugador">🗑️</button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )
    }

    // ---------- JUGADORES (todos los inscritos) ----------
    if (pestana === 'jugadores') {
      const eqMap = {}
      ;(datos?.equipos || []).forEach((e) => { eqMap[e.id] = e })
      const todos = (datos?.roster || []).map((j) => {
        const eq = eqMap[j.equipo_id] || {}
        return { ...j, equipoNombre: eq.nombre || '—', cod: eq.codigo || '??', color: eq.color || T.avatar }
      })
      return (
        <>
          {tituloModulo('Jugadores inscritos')}
          <div style={{ color: T.muyTenue, fontSize: 11.5, marginBottom: 14, marginTop: -4 }}>{todos.length} jugadores en {(datos?.equipos || []).length} equipos. Vinculados por su MC ID.</div>
          {todos.length === 0 ? (
            <div style={{ ...tarjeta, padding: 20, textAlign: 'center', color: T.muyTenue, fontSize: 13 }}>Todavía no hay jugadores inscritos.</div>
          ) : (
            <div style={tarjeta}>
              {todos.map((j) => (
                <div key={j.jugador_id} onClick={() => setJugadorVer(j)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderBottom: `0.5px solid ${T.bordeSuave}`, cursor: 'pointer' }}>
                  {j.foto ? (
                    <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
                      <img src={j.foto} alt="" style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover', border: `1px solid ${T.bordeSuave}`, display: 'block' }} />
                      <span style={{ position: 'absolute', right: -5, bottom: -5, minWidth: 18, height: 15, padding: '0 3px', borderRadius: 5, background: j.color || T.avatar, color: '#fff', fontFamily: fCond, fontSize: 8.5, fontWeight: 800, letterSpacing: 0.2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${T.tarjeta}`, boxSizing: 'border-box', lineHeight: 1 }}>{j.cod}</span>
                    </div>
                  ) : (
                    avatarEquipo(j.cod, j.color, '#fff', 32)
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.textoFuerte, fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{j.numero ?? '–'} {j.nombre}</div>
                    <div style={{ color: T.muyTenue, fontSize: 11.5 }}>{j.posicion ? `${j.posicion} · ` : ''}{j.equipoNombre}</div>
                  </div>
                  {j.esCapitan && <span style={{ fontSize: 9, fontWeight: 800, color: T.botonTexto, background: T.boton, padding: '2px 7px', borderRadius: 8 }}>CAP</span>}
                  <span style={{ color: T.tenue, fontSize: 16, flexShrink: 0 }}>›</span>
                </div>
              ))}
            </div>
          )}
        </>
      )
    }

    if (pestana === 'contabilidad') {
      return (
        <>
          {tituloModulo('Caja del torneo', '#5dcaa5')}
          <div style={{ ...tarjeta, padding: 18, marginBottom: 12, textAlign: 'center', background: `linear-gradient(160deg, ${cajaBalance >= 0 ? 'rgba(93,202,165,.12)' : 'rgba(240,149,149,.12)'}, ${T.tarjeta})`, border: `0.5px solid ${T.borde}` }}>
            <div style={{ color: T.tenue, fontSize: 11, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: fCond, fontWeight: 600 }}>Balance del fondo</div>
            <div style={{ color: cajaBalance >= 0 ? '#5dcaa5' : '#f09595', fontSize: 32, fontWeight: 800, fontFamily: fCond, letterSpacing: 0.3 }}>{fmtRD(cajaBalance)}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, ...tarjeta, padding: 13, textAlign: 'center' }}>
              <div style={{ color: T.muyTenue, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: fCond, fontWeight: 600 }}>Ingresos</div>
              <div style={{ color: '#5dcaa5', fontSize: 17, fontWeight: 800, fontFamily: fCond, marginTop: 3 }}>{fmtRD(cajaIngresos)}</div>
            </div>
            <div style={{ flex: 1, ...tarjeta, padding: 13, textAlign: 'center' }}>
              <div style={{ color: T.muyTenue, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: fCond, fontWeight: 600 }}>Gastos</div>
              <div style={{ color: '#f09595', fontSize: 17, fontWeight: 800, fontFamily: fCond, marginTop: 3 }}>{fmtRD(cajaGastos)}</div>
            </div>
          </div>

          {puedeAdministrar && (
            <button onClick={() => abrirCajaModal('ingreso')} style={{ width: '100%', marginBottom: 16, border: 'none', borderRadius: 13, padding: 13, fontFamily: fCond, fontWeight: 700, fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', background: T.boton, color: T.botonTexto }}>＋ Registrar movimiento</button>
          )}

          {caja.length === 0 ? (
            <div style={{ ...tarjeta, padding: 18, textAlign: 'center', color: T.tenue, fontSize: 13 }}>Todavía no hay movimientos.{puedeAdministrar ? ' Registra el primero arriba.' : ''}</div>
          ) : (
            <div style={tarjeta}>
              {caja.map((m, i) => {
                const ci = catInfo(m.tipo, m.categoria)
                const esIng = m.tipo === 'ingreso'
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderTop: i > 0 ? `0.5px solid ${T.bordeSuave}` : 'none' }}>
                    <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, background: esIng ? 'rgba(93,202,165,.16)' : 'rgba(240,149,149,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{ci.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: T.textoFuerte, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.concepto}</div>
                      <div style={{ color: T.muyTenue, fontSize: 11, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ci.t}{m.registrado_nombre ? ' · ' + m.registrado_nombre : ''} · {tiempoRelativo(m.creado_en)}</div>
                    </div>
                    <span style={{ flexShrink: 0, color: esIng ? '#5dcaa5' : '#f09595', fontWeight: 700, fontFamily: fCond, fontSize: 14 }}>{esIng ? '+ ' : '− '}{fmtRD(m.monto)}</span>
                    {puedeAdministrar && <button onClick={() => setCajaEliminar(m)} style={{ flexShrink: 0, border: 'none', background: 'transparent', color: T.muyTenue, fontSize: 15, cursor: 'pointer', padding: '2px 2px' }}>🗑️</button>}
                  </div>
                )
              })}
            </div>
          )}

          {cajaToast && (
            <div onClick={() => setCajaToast(null)} style={{ position: 'fixed', left: 16, right: 16, bottom: 'calc(env(safe-area-inset-bottom) + 18px)', zIndex: 90, background: T.textoFuerte, color: T.fondo, padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>{cajaToast}</div>
          )}
        </>
      )
    }

    if (pestana === 'directiva') {
      const miembros = [...directiva].sort((a, b) => (RANK_DIR[a.rol] ?? 9) - (RANK_DIR[b.rol] ?? 9))
      const esOficial = (rol) => rol === 'presidente' || rol === 'vicepresidente'
      return (
        <>
          {tituloModulo('Directiva del torneo', '#6fb0ec')}
          <div style={{ color: T.tenue, fontSize: 12, marginTop: -4, marginBottom: 14, lineHeight: 1.5 }}>
            El presidente y el vicepresidente administran todo. A los demás miembros, el presidente o el vice les pueden dar acceso con el switch.
          </div>

          {miembros.length === 0 ? (
            <div style={{ ...tarjeta, padding: 18, textAlign: 'center', color: T.tenue, fontSize: 13 }}>Todavía no hay directiva.</div>
          ) : miembros.map((m) => {
            const oficial = esOficial(m.rol)
            const tieneAcceso = oficial || m.puede_administrar
            const yo = m.perfil_id && m.perfil_id === miId
            return (
              <div key={m.id} style={{ ...tarjeta, padding: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                {m.foto ? (
                  <img src={m.foto} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `1px solid ${T.bordeSuave}` }} />
                ) : (
                  <span style={{ width: 44, height: 44, borderRadius: '50%', background: T.avatar, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: fCond, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{(m.nombre || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?'}</span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.textoFuerte, fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.nombre}{yo ? <span style={{ color: T.tenue, fontWeight: 600 }}> · tú</span> : null}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ color: T.acento, fontSize: 12, fontWeight: 600 }}>{ROL_DIR[m.rol] || m.rol}</span>
                    {!oficial && (m.estado === 'pendiente'
                      ? <span style={{ fontSize: 9, fontWeight: 800, color: '#e8a93a', background: 'rgba(232,169,58,.14)', padding: '2px 7px', borderRadius: 6, letterSpacing: 0.3 }}>POR CONFIRMAR</span>
                      : <span style={{ fontSize: 9, fontWeight: 800, color: '#34c759', background: 'rgba(52,199,89,.14)', padding: '2px 7px', borderRadius: 6, letterSpacing: 0.3 }}>EN LA DIRECTIVA</span>)}
                  </div>
                </div>
                {oficial ? (
                  <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, color: T.acento, background: 'rgba(245,184,46,.12)', border: `1px solid ${T.borde}`, padding: '5px 9px', borderRadius: 8, letterSpacing: 0.3 }}>ACCESO TOTAL</span>
                ) : (
                  <button
                    onClick={() => togglePermiso(m, !m.puede_administrar)}
                    disabled={!puedeGestionar || togglingId === m.id}
                    title={tieneAcceso ? 'Puede administrar' : 'Sin acceso'}
                    style={{ flexShrink: 0, position: 'relative', width: 46, height: 27, borderRadius: 999, border: 'none', cursor: puedeGestionar ? 'pointer' : 'default', background: tieneAcceso ? '#34c759' : T.bordeSuave, opacity: togglingId === m.id ? 0.5 : 1, transition: 'background .2s', padding: 0 }}>
                    <span style={{ position: 'absolute', top: 3, left: tieneAcceso ? 22 : 3, width: 21, height: 21, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.4)' }} />
                  </button>
                )}
              </div>
            )
          })}

          {puedeGestionar && (
            <button onClick={() => { setAgregarDir(true); setDirSel(null); setDirBusqueda(''); setDirResultados([]); setDirRol('vocal') }} style={{ width: '100%', marginTop: 4, border: `1px solid ${T.borde}`, borderRadius: 13, padding: 13, background: 'transparent', color: T.acento, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>＋ Agregar a la directiva</button>
          )}

          <div style={{ marginTop: 26 }}>
            {tituloModulo('Historial', '#9b8cff')}
            <div style={{ color: T.tenue, fontSize: 12, marginTop: -4, marginBottom: 12 }}>Quién hizo qué, y cuándo. No se puede borrar.</div>
            {bitacora.length === 0 ? (
              <div style={{ ...tarjeta, padding: 16, textAlign: 'center', color: T.tenue, fontSize: 12.5 }}>Todavía no hay movimientos registrados.</div>
            ) : (
              <div style={tarjeta}>
                {bitacora.map((b, i) => {
                  const ico = ICONO_BITACORA[b.accion] || ['•', '#8a93a6']
                  return (
                    <div key={b.id} style={{ display: 'flex', gap: 11, padding: '11px 14px', borderTop: i > 0 ? `0.5px solid ${T.bordeSuave}` : 'none' }}>
                      <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 9, background: ico[1] + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{ico[0]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: T.textoBody, fontSize: 13, lineHeight: 1.4 }}>{b.detalle || b.accion}</div>
                        <div style={{ color: T.muyTenue, fontSize: 11, marginTop: 2 }}>{b.actor_nombre ? b.actor_nombre + ' · ' : ''}{tiempoRelativo(b.creado_en)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {dirToast && (
            <div onClick={() => setDirToast(null)} style={{ position: 'fixed', left: 16, right: 16, bottom: 'calc(env(safe-area-inset-bottom) + 18px)', zIndex: 90, background: T.textoFuerte, color: T.fondo, padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>{dirToast}</div>
          )}
        </>
      )
    }

    if (pestana === 'calendario') {
      const juegos = datos?.juegos || []
      const equiposN = (datos?.equipos || []).length
      const hayEquipos = equiposN >= 2
      const nombreEq = (id) => eqPorId[id]?.nombre || 'Equipo'
      const codEq = (id) => eqPorId[id]?.codigo || '??'
      const colorEq = (id) => eqPorId[id]?.color || T.avatar
      const esCopa = torneoRow?.formato === 'copa'
      const nombreRondaLocal = (n) => n <= 2 ? 'Final' : n <= 4 ? 'Semifinal' : n <= 8 ? 'Cuartos de final' : n <= 16 ? 'Octavos de final' : `Ronda de ${n}`
      const etiquetaJornada = (jn) => esCopa ? (jn === 1 ? nombreRondaLocal(equiposN) : `Ronda ${jn}`) : `Jornada ${jn}`
      const porJornada = {}
      juegos.forEach((j) => { const k = j.jornada || 1; (porJornada[k] = porJornada[k] || []).push(j) })
      const jornadas = Object.keys(porJornada).map(Number).sort((a, b) => a - b)

      // Vista previa de cuántos juegos genera la configuración elegida (solo liga).
      const totalPrev = vueltas * equiposN * (equiposN - 1) / 2
      const porEquipoPrev = vueltas * (equiposN - 1)
      const opcionesVueltas = [{ v: 1, txt: 'Sencilla', sub: '1 vez' }, { v: 2, txt: 'Ida y vuelta', sub: '2 veces' }, { v: 3, txt: 'Triple', sub: '3 veces' }]
      const selectorVueltas = !esCopa ? (
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: T.textoBody, fontSize: 12.5, fontWeight: 700, marginBottom: 8, textAlign: 'left' }}>¿Cuántas veces se enfrenta cada par?</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {opcionesVueltas.map((o) => {
              const activo = vueltas === o.v
              return (
                <button key={o.v} onClick={() => setVueltas(o.v)} style={{ flex: 1, border: `1.5px solid ${activo ? T.acento : T.borde}`, background: activo ? `${T.acento}18` : 'transparent', borderRadius: 11, padding: '9px 4px', cursor: 'pointer', color: activo ? T.acento : T.textoBody }}>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{o.v}</div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{o.txt}</div>
                  <div style={{ fontSize: 9.5, color: T.muyTenue }}>{o.sub}</div>
                </button>
              )
            })}
          </div>
          <div style={{ background: T.esClaro ? 'rgba(0,0,0,.04)' : 'rgba(255,255,255,.05)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: T.textoBody, textAlign: 'center' }}>
            Genera <b style={{ color: T.acento }}>{totalPrev} partidos</b> · <b style={{ color: T.acento }}>{porEquipoPrev} por equipo</b>
          </div>
        </div>
      ) : null

      return (
        <>
          {tituloModulo('Calendario del torneo', '#6fb0ec')}
          {juegos.length === 0 ? (
            <div style={{ ...tarjeta, padding: 22, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
              <div style={{ color: T.textoFuerte, fontSize: 15.5, fontWeight: 700, marginBottom: 6 }}>Todavía no hay calendario</div>
              <div style={{ color: T.tenue, fontSize: 13, lineHeight: 1.5, marginBottom: hayEquipos ? 16 : 4 }}>
                {hayEquipos
                  ? `Genera todos los partidos automáticamente. Formato: ${nombreFormato(torneoRow?.formato)}.`
                  : 'Necesitas al menos dos equipos inscritos para generar el calendario.'}
              </div>
              {esAdmin && hayEquipos && (
                <>
                  {selectorVueltas}
                  <button onClick={() => alGenerar(false)} disabled={generando} style={{ width: '100%', border: 'none', borderRadius: 13, padding: 14, background: T.boton, color: T.botonTexto, fontSize: 14.5, fontWeight: 800, cursor: generando ? 'default' : 'pointer', opacity: generando ? 0.6 : 1 }}>
                    {generando ? 'Generando…' : '⚡ Generar calendario'}
                  </button>
                  {errorGen && <div style={{ color: '#f09595', fontSize: 12.5, marginTop: 10 }}>{errorGen}</div>}
                  {esCopa && <div style={{ color: T.muyTenue, fontSize: 11, marginTop: 12, lineHeight: 1.5 }}>Se genera la primera ronda de la llave. Las rondas siguientes se arman cuando terminen esos partidos.</div>}
                </>
              )}
            </div>
          ) : (
            <>
              <div style={{ color: T.muyTenue, fontSize: 11.5, marginBottom: 14, marginTop: -4 }}>
                {juegos.length} partidos · {juegos.filter((j) => j.estado === 'final').length} jugados
              </div>
              {jornadas.map((jn) => (
                <div key={jn} style={{ marginBottom: 16 }}>
                  <div style={{ color: T.acento, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
                    {etiquetaJornada(jn)}
                  </div>
                  <div style={tarjeta}>
                    {porJornada[jn].map((j, i) => {
                      const fin = j.estado === 'final'
                      const vivo = j.estado === 'vivo'
                      const ganoA = fin && j.puntosA > j.puntosB
                      const ganoB = fin && j.puntosB > j.puntosA
                      const ultimo = i === porJornada[jn].length - 1
                      const puedeAnotar = !fin && esAdmin && onAnotarJuego
                      return (
                        <div key={j.id || i} style={{ borderBottom: !ultimo ? `0.5px solid ${T.bordeSuave}` : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', padding: puedeAnotar ? '11px 14px 7px' : '11px 14px', gap: 10 }}>
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                              {avatarEquipo(codEq(j.equipoA_id), colorEq(j.equipoA_id), '#fff', 26)}
                              <span style={{ color: ganoA ? T.textoFuerte : T.textoBody, fontSize: 13, fontWeight: ganoA ? 800 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreEq(j.equipoA_id)}</span>
                            </div>
                            <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 54 }}>
                              {fin ? (
                                <span style={{ color: T.textoFuerte, fontSize: 15, fontWeight: 800 }}>{j.puntosA}-{j.puntosB}</span>
                              ) : vivo ? (
                                <span style={{ color: '#f09595', fontSize: 10, fontWeight: 800 }}>● VIVO</span>
                              ) : (
                                <span style={{ color: T.muyTenue, fontSize: 11 }}>vs</span>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                              <span style={{ color: ganoB ? T.textoFuerte : T.textoBody, fontSize: 13, fontWeight: ganoB ? 800 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{nombreEq(j.equipoB_id)}</span>
                              {avatarEquipo(codEq(j.equipoB_id), colorEq(j.equipoB_id), '#fff', 26)}
                            </div>
                          </div>
                          {puedeAnotar && (
                            <div style={{ padding: '0 14px 10px' }}>
                              <button onClick={() => onAnotarJuego({ juegoId: j.id, torneoId: torneoRow.id, jornada: j.jornada, equipoA_id: j.equipoA_id, equipoB_id: j.equipoB_id, nombreA: nombreEq(j.equipoA_id), nombreB: nombreEq(j.equipoB_id) })} style={{ width: '100%', border: `1px solid ${vivo ? '#f09595' : T.borde}`, borderRadius: 10, padding: '8px', background: vivo ? 'rgba(240,149,149,.10)' : 'transparent', color: vivo ? '#f09595' : T.acento, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                                {vivo ? '● Continuar anotando' : '✎ Anotar este juego'}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              {esAdmin && (
                <div style={{ ...tarjeta, padding: 16, marginTop: 18, border: `0.5px solid ${T.borde}` }}>
                  <div style={{ color: T.textoFuerte, fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>Regenerar calendario</div>
                  <div style={{ color: T.muyTenue, fontSize: 11.5, lineHeight: 1.5, marginBottom: 12 }}>Borra los partidos que aún no se han jugado y crea unos nuevos. Los partidos ya jugados no se tocan.</div>
                  {selectorVueltas}
                  <button onClick={() => { if (window.confirm('¿Regenerar el calendario? Se borran los partidos no jugados y se crean nuevos con la configuración elegida.')) alGenerar(true) }} disabled={generando} style={{ width: '100%', border: `1.5px solid ${T.borde}`, borderRadius: 12, padding: 12, background: 'transparent', color: T.acento, fontSize: 13.5, fontWeight: 800, cursor: generando ? 'default' : 'pointer', opacity: generando ? 0.6 : 1 }}>
                    {generando ? 'Regenerando…' : '🔄 Regenerar calendario'}
                  </button>
                  {errorGen && <div style={{ color: '#f09595', fontSize: 12.5, marginTop: 10 }}>{errorGen}</div>}
                </div>
              )}
            </>
          )}
        </>
      )
    }

    const nombres = {
      bracket: 'Bracket / Llaves', calendario: 'Calendario completo', equipos: 'Equipos',
      jugadores: 'Jugadores', arbitros: 'Árbitros', reglas: 'Reglas del torneo',
    }
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
        <div style={{ color: T.textoFuerte, fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{nombres[pestana] || 'Módulo'}</div>
        <div style={{ color: T.tenue, fontSize: 13.5, lineHeight: 1.5 }}>Este módulo lo construimos en el siguiente paso, hermano. 🏀</div>
      </div>
    )
  }

  // ===== ESTRUCTURA (fórmula oficial: pantalla clavada) =====
  return (
    <div style={{ fontFamily: font, color: T.textoBody, background: T.fondo, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 70% 36% at 50% 0%, ${T.glow}, transparent 72%)` }} />

      {/* HEADER FIJO */}
      <div style={{ position: 'relative', zIndex: 3, flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: T.panel, borderBottom: `0.5px solid ${T.borde}`, backdropFilter: 'blur(14px)' }}>
        <div style={{ height: 4, display: 'flex', maxWidth: maxAncho, margin: '0 auto' }}><i style={{ flex: 1, background: '#1b3a8c' }} /><i style={{ flex: 1, background: '#fff' }} /><i style={{ flex: 1, background: '#ce1126' }} /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 12px', maxWidth: maxAncho, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <button onClick={() => onVolver && onVolver()} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: 'none', background: T.esClaro ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)', color: T.textoFuerte, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: T.boton, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0, overflow: 'hidden' }}>{torneoRow?.logo_url ? <img src={torneoRow.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : tj.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: fCond, color: T.textoFuerte, fontSize: 18, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tj.nombre}</div>
            <div style={{ color: T.tenue, fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tj.subtitulo} · {tj.lugar}</div>
          </div>
          {esAdmin && (
            <button onClick={() => onAccion && onAccion('verPublico:' + (torneoRow ? torneoRow.id : ''))} style={{ flexShrink: 0, border: `1px solid ${T.borde}`, background: 'transparent', color: T.acento, fontSize: 12, fontWeight: 700, padding: esAncho ? '7px 12px' : '7px 10px', borderRadius: 16, cursor: 'pointer', whiteSpace: 'nowrap' }}>{esAncho ? '👁️ Vista pública' : '👁️'}</button>
          )}
          {esAdmin && onConfigurar && torneoRow && (
            <button onClick={() => onConfigurar(torneoRow.id)} title="Configuración del torneo" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 12, border: `1px solid ${T.borde}`, background: 'transparent', color: T.acento, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚙️</button>
          )}
          {esAdmin ? (
            <span style={{ flexShrink: 0, background: T.boton, color: T.botonTexto, fontSize: 11, fontWeight: 800, padding: '6px 12px', borderRadius: 16 }}>ADMIN</span>
          ) : (
            tj.enVivo > 0 && <span style={{ flexShrink: 0, background: 'rgba(226,75,74,.15)', color: '#f09595', fontSize: 11, fontWeight: 700, padding: '6px 11px', borderRadius: 16 }}>● {tj.enVivo} vivo</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 12px 10px', WebkitOverflowScrolling: 'touch', maxWidth: maxAncho, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {PESTANAS.map((p) => {
            const activa = p.id === pestana
            const esModAdmin = PESTANAS_ADMIN.some((x) => x.id === p.id)
            return (
              <button key={p.id} onClick={() => setPestana(p.id)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 20, border: activa ? 'none' : `0.5px solid ${esModAdmin ? T.borde : T.bordeSuave}`, background: activa ? T.boton : (esModAdmin ? `${T.acento}10` : (T.esClaro ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.04)')), color: activa ? T.botonTexto : (esModAdmin ? T.acento : T.tenue), fontFamily: fCond, fontSize: 13, fontWeight: activa ? 700 : 600, letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 13 }}>{p.icono}</span>{p.txt}
              </button>
            )
          })}
        </div>
      </div>

      {/* CONTENIDO SCROLL */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <style>{`.mc-torneo-cols > * { break-inside: avoid; -webkit-column-break-inside: avoid; page-break-inside: avoid; }`}</style>
        <div className={esAncho ? 'mc-torneo-cols' : ''} style={{ maxWidth: maxAncho, margin: '0 auto', padding: esAncho ? '22px 28px calc(env(safe-area-inset-bottom) + 40px)' : '16px 14px calc(env(safe-area-inset-bottom) + 30px)', columnWidth: anchoColumna, columnGap: esAncho ? 24 : 0 }}>
          {Contenido()}
        </div>
      </div>

      {modalInvitar()}
      {modalEliminar()}
      {modalConfirmar()}
      {modalJugador()}
      {modalAgregarDir()}
      {modalCaja()}
      {modalEliminarCaja()}
      {toastInvitar && (
        <div style={{ position: 'fixed', left: '50%', bottom: 'calc(env(safe-area-inset-bottom) + 22px)', transform: 'translateX(-50%)', zIndex: 90, background: T.tarjeta, border: `1px solid ${T.borde}`, borderRadius: 14, padding: '12px 20px', color: T.textoFuerte, fontSize: 13.5, fontWeight: 600, boxShadow: '0 12px 30px rgba(0,0,0,.5)', maxWidth: '88%', textAlign: 'center' }}>{toastInvitar}</div>
      )}
    </div>
  )
}