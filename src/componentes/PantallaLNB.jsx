import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { cacheGet, cacheSet } from '../cache'
import { publicarJuego } from '../techado'
import CompartirAlChat from './CompartirAlChat'

// ===== Base de las imágenes oficiales de la LNB (escudos y fotos) =====
const IMG_BASE = 'https://lnb-media.sfo3.cdn.digitaloceanspaces.com/'
const urlImg = (u) => (u ? (String(u).startsWith('http') ? u : IMG_BASE + u) : null)

// ===== utilidades de fecha (sin líos de zona horaria) =====
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
function fechaHora(s) {
  if (!s) return ''
  const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  if (!m) return String(s)
  let hh = parseInt(m[4], 10)
  const ap = hh >= 12 ? 'PM' : 'AM'
  let h12 = hh % 12; if (h12 === 0) h12 = 12
  return `${parseInt(m[3], 10)} ${MESES[parseInt(m[2], 10) - 1]} · ${h12}:${m[5]} ${ap}`
}
function soloDia(s) {
  if (!s) return ''
  const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return ''
  return `${parseInt(m[3], 10)} ${MESES[parseInt(m[2], 10) - 1]}`
}
// Agrupación de juegos por día con encabezado de fecha legible.
const DIAS_SEM = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
function claveDia(s) {
  const m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : ''
}
function fechaLarga(s) {
  const m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return 'Sin fecha'
  const y = +m[1], mo = +m[2], d = +m[3]
  const dia = DIAS_SEM[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()]
  return `${dia} ${d} de ${MESES_LARGO[mo - 1]} de ${y}`
}
// Toma una lista de juegos (ya ordenada) y la parte en bloques por día.
function agruparPorDia(arr) {
  const grupos = []; const idx = {}
  arr.forEach((j) => {
    const k = claveDia(j.date) || 'sin-fecha'
    if (idx[k] == null) { idx[k] = grupos.length; grupos.push({ k, fecha: j.date, juegos: [] }) }
    grupos[idx[k]].juegos.push(j)
  })
  return grupos
}

// ===== estado de un juego =====
const tieneMarcador = (j) => j.local && j.local.total_score != null && (j.status === 'finished' || Number(j.local.total_score) > 0)
const esFinal = (j) => j.status === 'finished'
const esVivo = (j) => j.status !== 'finished' && tieneMarcador(j)
const esProximo = (j) => !esFinal(j) && !esVivo(j)
const ORD = { 1: '1er', 2: '2do', 3: '3er', 4: '4to' }
const cuarto = (p) => (ORD[p] ? `${ORD[p]} cuarto` : `${p}º`)
const abrev = (eq) => String(eq?.nombre || '—').split(' ')[0]

// Colores de cada franquicia de la LNB para vestir la plantilla del ganador.
// Son tonos vivos que se leen bien sobre oscuro y claro. Fáciles de ajustar:
// si un color no te cuadra, cámbialo aquí y listo.
const COLOR_EQUIPO = [
  { k: 'metros', c: '#2f6fd0' },
  { k: 'gigantes', c: '#e23b48' },
  { k: 'caneros', c: '#f0851f' }, { k: 'cañeros', c: '#f0851f' },
  { k: 'titanes', c: '#29b0e8' },
  { k: 'reales', c: '#8a5cd6' },
  { k: 'heroes', c: '#2bb673' }, { k: 'héroes', c: '#2bb673' }, { k: 'moca', c: '#2bb673' },
  { k: 'marineros', c: '#3a86d4' },
  { k: 'leones', c: '#d2a23a' },
  { k: 'soles', c: '#f0b81f' },
  { k: 'indios', c: '#d2553f' },
]
const colorEquipoLNB = (nombre, fallback) => {
  const n = String(nombre || '').toLowerCase()
  const hit = COLOR_EQUIPO.find((x) => n.includes(x.k))
  return hit ? hit.c : fallback
}
const valorLider = (l) => (l.average != null ? Number(l.average) : Number(l.total || 0))

// hex -> rgba con alfa
function hexA(hex, a) {
  const h = String(hex).replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}
// racha últimos 5 (acepta "WLWWL"/"GPGGP" o arreglo) -> ['W','L',...]
function parseForm(v) {
  if (!v) return null
  if (Array.isArray(v)) return v.map((x) => (String(x).toUpperCase()[0] === 'W' || String(x).toUpperCase()[0] === 'G' ? 'W' : 'L'))
  const m = String(v).toUpperCase().match(/[WLGP]/g)
  if (m) return m.map((c) => (c === 'W' || c === 'G' ? 'W' : 'L'))
  return null
}

// ===== TEMAS — por defecto "Dominicana" (bandera) + los 4 de la app =====
const TEMAS = {
  dominicana: {
    nombre: 'Dominicana', esClaro: false,
    fondo: '#070F26', glow1: 'rgba(40,80,200,0.20)', glow2: 'rgba(206,17,38,0.12)',
    panel: 'rgba(255,255,255,0.045)', panelAlt: 'rgba(255,255,255,0.07)',
    borde: 'rgba(130,160,230,0.16)', linea: 'rgba(130,160,230,0.10)',
    texto: '#EEF3FC', texto2: '#D5E0F4', tenue: '#8B9FC8',
    accion: '#E4263C', accion2: '#3E6BD6', chip: 'rgba(255,255,255,0.06)',
    headerBg: 'rgba(7,15,38,0.92)',
  },
  dorado: {
    nombre: 'Dorado', esClaro: false,
    fondo: '#08090c', glow1: 'rgba(190,135,55,0.16)', glow2: 'rgba(190,135,55,0.06)',
    panel: 'rgba(255,255,255,0.04)', panelAlt: 'rgba(255,255,255,0.07)',
    borde: 'rgba(255,255,255,0.08)', linea: 'rgba(255,255,255,0.06)',
    texto: '#f4f7f9', texto2: '#dfe5ea', tenue: '#9aa7b2',
    accion: '#e8b65a', accion2: '#c8842e', chip: 'rgba(255,255,255,0.05)',
    headerBg: 'rgba(8,9,12,0.92)',
  },
  azul: {
    nombre: 'Azul', esClaro: false,
    fondo: '#070b12', glow1: 'rgba(55,120,190,0.18)', glow2: 'rgba(55,120,190,0.06)',
    panel: 'rgba(255,255,255,0.04)', panelAlt: 'rgba(255,255,255,0.07)',
    borde: 'rgba(255,255,255,0.08)', linea: 'rgba(255,255,255,0.06)',
    texto: '#eef3f6', texto2: '#d8e3ee', tenue: '#93a6bd',
    accion: '#6fb0ec', accion2: '#2f6fc8', chip: 'rgba(255,255,255,0.05)',
    headerBg: 'rgba(7,11,18,0.92)',
  },
  claro: {
    nombre: 'Claro', esClaro: true,
    fondo: '#eae3d4', glow1: 'rgba(190,135,55,0.10)', glow2: 'rgba(190,135,55,0.05)',
    panel: '#ffffff', panelAlt: '#f6f1e6',
    borde: '#e0ddd2', linea: '#ece8dd',
    texto: '#2a2014', texto2: '#3a2f20', tenue: '#7a6e58',
    accion: '#b07a26', accion2: '#9a6420', chip: 'rgba(176,122,38,0.10)',
    headerBg: 'rgba(248,243,233,0.92)',
  },
  larimar: {
    nombre: 'Larimar', esClaro: true,
    fondo: '#d3e6e7', glow1: 'rgba(60,150,170,0.12)', glow2: 'rgba(60,150,170,0.06)',
    panel: '#ffffff', panelAlt: '#eef6f6',
    borde: '#cfe0e2', linea: '#e2edee',
    texto: '#1c2624', texto2: '#2c3a3a', tenue: '#5f7375',
    accion: '#2a8fb8', accion2: '#1a6a8a', chip: 'rgba(42,143,184,0.10)',
    headerBg: 'rgba(232,244,245,0.92)',
  },
}
const ORDEN_TEMAS = ['dominicana', 'dorado', 'azul', 'claro', 'larimar']

const CATS = [
  { id: 'mcrating', txt: 'MC Rating' },
  { id: 'points', txt: 'Puntos' },
  { id: 'rebounds', txt: 'Rebotes' },
  { id: 'assists', txt: 'Asistencias' },
  { id: 'steals', txt: 'Robos' },
  { id: 'blocks', txt: 'Tapones' },
  { id: 'threes', txt: 'Triples' },
  { id: 'efficiency', txt: 'Eficiencia' },
]
const TABS = [
  { id: 'juegos', txt: 'Juegos' },
  { id: 'tabla', txt: 'Tabla' },
  { id: 'equipos', txt: 'Equipos' },
  { id: 'lideres', txt: 'Líderes' },
  { id: 'noticias', txt: 'Noticias' },
]

export default function PantallaLNB({ onVolver, onAccion }) {
  // ----- tema propio de la LNB (default dominicana; no pisa el tema global) -----
  const [tema, setTema] = useState(() => {
    if (typeof window !== 'undefined') {
      const g = localStorage.getItem('mc_tema_lnb')
      return ORDEN_TEMAS.includes(g) ? g : 'dominicana'
    }
    return 'dominicana'
  })
  const T = TEMAS[tema] || TEMAS.dominicana
  const fDisp = '"Arial Narrow", "Helvetica Neue", Impact, system-ui, sans-serif'
  const f = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  // Letras LNB: L azul, N dorada, B roja (como el mockup). En temas claros se ajusta para que se lean.
  const coloresLNB = T.esClaro ? ['#1B3A8C', '#9a6420', '#CE1126'] : ['#3E6BD6', '#E8B65A', '#E4263C']
  const pressRef = useRef(null)
  const cambiarTema = () => {
    const i = ORDEN_TEMAS.indexOf(tema)
    const nuevo = ORDEN_TEMAS[(i + 1) % ORDEN_TEMAS.length]
    setTema(nuevo)
    try { localStorage.setItem('mc_tema_lnb', nuevo) } catch (e) {}
  }

  const [esEscritorio, setEsEscritorio] = useState(typeof window !== 'undefined' ? window.innerWidth >= 900 : true)
  useEffect(() => {
    const r = () => setEsEscritorio(window.innerWidth >= 900)
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  const [tab, setTab] = useState('juegos')
  const [catSel, setCatSel] = useState('mcrating')
  const [juegoSel, setJuegoSel] = useState(null)
  const [jugadorSel, setJugadorSel] = useState(null)
  const [noticiaSel, setNoticiaSel] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [temporada, setTemporada] = useState(null)
  const [temporadas, setTemporadas] = useState([])
  const [temporadaSel, setTemporadaSel] = useState(null)
  const [equipos, setEquipos] = useState({})
  const [standing, setStanding] = useState([])
  const [juegos, setJuegos] = useState([])
  const [lideres, setLideres] = useState([])
  const [noticias, setNoticias] = useState([])
  const [jugadorSemana, setJugadorSemana] = useState(null)
  const [jugadores, setJugadores] = useState({})
  const [tempStats, setTempStats] = useState([])
  const [equipoSel, setEquipoSel] = useState(null)
  const [juegoJugadores, setJuegoJugadores] = useState({})
  const [aviso, setAviso] = useState('')
  const [compartiendo, setCompartiendo] = useState(null)
  const [compartirChat, setCompartirChat] = useState(null)

  useEffect(() => {
    let vivo = true
    const clave = 'lnb'
    // PASO 2: mostrar al instante lo último guardado (es una sola, llave única).
    const g = cacheGet(clave)
    if (g) {
      setTemporada(g.temporada); setTemporadas(g.temporadas || []); setTemporadaSel(g.temporadaSel)
      setEquipos(g.equipos || {}); setStanding(g.standing || [])
      setJuegos(g.juegos || []); setLideres(g.lideres || []); setNoticias(g.noticias || [])
      setJugadorSemana(g.jugadorSemana || null); setJugadores(g.jugadores || {}); setTempStats(g.tempStats || [])
      setCargando(false)
    }
    async function cargar() {
      if (!g) setCargando(true)
      setError(null)
      try {
        const { data: temps, error: e1 } = await supabase
          .from('lnb_temporadas').select('*').order('year', { ascending: false })
        if (e1) throw e1
        const lista = temps || []
        const actual = lista.find((t) => t.current) || lista[0] || null

        const { data: eqs } = await supabase.from('lnb_equipos').select('*')
        const eMap = {}; (eqs || []).forEach((e) => { eMap[e.id] = e })

        // TODAS las temporadas (para el selector de año)
        const r2 = await supabase.from('lnb_standing').select('*').order('position', { ascending: true })
        const st = r2.data || []
        const r3 = await supabase.from('lnb_juegos').select('*').order('date', { ascending: false })
        const jg = r3.data || []
        const r4 = await supabase.from('lnb_juego_equipos').select('*')
        const je = r4.data || []
        const r5 = await supabase.from('lnb_lideres').select('*').order('rank', { ascending: true })
        const ld = r5.data || []
        const r6 = await supabase.from('lnb_noticias').select('*')
          .order('created_at', { ascending: false }).limit(20)
        const nt = r6.data || []
        const r7 = await supabase.from('lnb_jugador_semana').select('*').limit(1)
        const js = (r7.data || [])[0] || null
        const r8 = await supabase.from('lnb_jugadores').select('*')
        const jMap = {}; (r8.data || []).forEach((p) => { jMap[p.id] = p })
        // promedios por año (si la tabla aún no existe → [])
        const r9 = await supabase.from('lnb_jugador_temporada').select('*')
        const ts = r9.data || []

        const jeMap = {}; je.forEach((x) => { (jeMap[x.juego_id] = jeMap[x.juego_id] || []).push(x) })
        const jueLista = jg.map((j) => {
          const ee = jeMap[j.id] || []
          const visitante = ee.find((x) => x.es_visitante) || ee[1] || null
          const local = ee.find((x) => !x.es_visitante) || ee[0] || null
          return { ...j, local, visitante }
        })

        if (!vivo) return
        setTemporada(actual); setTemporadas(lista); setTemporadaSel(actual ? actual.id : (lista[0] && lista[0].id))
        setEquipos(eMap); setStanding(st)
        setJuegos(jueLista); setLideres(ld); setNoticias(nt); setJugadorSemana(js); setJugadores(jMap)
        setTempStats(ts)
        setCargando(false)
        // PASO 3: guardar lo nuevo para la próxima.
        cacheSet(clave, {
          temporada: actual, temporadas: lista, temporadaSel: actual ? actual.id : (lista[0] && lista[0].id),
          equipos: eMap, standing: st, juegos: jueLista, lideres: ld, noticias: nt,
          jugadorSemana: js, jugadores: jMap, tempStats: ts,
        })
      } catch (err) {
        if (!vivo) return
        setError(err.message || 'Error cargando datos')
        setCargando(false)
      }
    }
    cargar()
    return () => { vivo = false }
  }, [])

  // Carga perezosa del box score: cuando se abre un juego, si no está en caché,
  // se busca solo el de ese partido (sirve para cualquier temporada).
  useEffect(() => {
    if (!juegoSel || juegoJugadores[juegoSel.id] !== undefined) return
    let vivo = true
    supabase.from('lnb_juego_jugadores').select('*').eq('juego_id', juegoSel.id).then((r) => {
      if (!vivo) return
      setJuegoJugadores((m) => ({ ...m, [juegoSel.id]: (r.data || []) }))
    })
    return () => { vivo = false }
  }, [juegoSel])

  // ===== piezas =====
  const Escudo = ({ id, nombre, size = 36 }) => {
    const eq = equipos[id]
    const url = urlImg(eq?.image_url)
    const ini = String(nombre || eq?.name || '?').trim().charAt(0).toUpperCase()
    if (url) return <img src={url} alt="" width={size} height={size} style={{ width: size, height: size, objectFit: 'contain', borderRadius: 8, flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
    return <div style={{ width: size, height: size, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.42, color: '#fff', background: `linear-gradient(135deg, ${T.accion2}, ${T.accion})` }}>{ini}</div>
  }
  const Foto = ({ url, nombre, size = 38 }) => {
    const u = urlImg(url)
    const ini = String(nombre || '?').trim().charAt(0).toUpperCase()
    if (u) return <img src={u} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
    return <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.42, color: '#fff', background: `linear-gradient(135deg, ${T.accion2}, ${T.accion})` }}>{ini}</div>
  }
  const Eyebrow = ({ txt }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 2px 12px' }}>
      <span style={{ width: 4, height: 15, borderRadius: 2, background: T.accion }} />
      <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: T.texto }}>{txt}</span>
    </div>
  )
  const Vacio = ({ txt }) => <div style={{ textAlign: 'center', padding: '46px 20px', color: T.tenue, fontSize: 13.5, lineHeight: 1.5 }}>{txt}</div>

  // ----- tarjeta de juego (lista) -----
  const FilaEquipo = ({ eq, marc, col }) => {
    const gana = eq?.es_ganador
    const nombre = eq?.nombre || equipos[eq?.equipo_id]?.name || '—'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Escudo id={eq?.equipo_id} nombre={eq?.nombre} size={36} />
        <span style={{ flex: 1, fontSize: 15, fontWeight: gana ? 800 : 600, color: gana ? (col || T.texto) : T.texto2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: 0.2 }}>{nombre}</span>
        {marc && <span style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right', color: gana ? T.texto : T.tenue }}>{eq?.total_score ?? '-'}</span>}
        {marc && gana && <span style={{ width: 5, height: 5, borderRadius: '50%', background: col || T.accion, marginLeft: 2, flexShrink: 0 }} />}
      </div>
    )
  }
  // Convierte un juego de la LNB al formato que entienden el techado y el chat
  // (la misma TarjetaResultado de la app). Trae el box score si hace falta.
  const juegoADatos = async (j) => {
    let box = juegoJugadores[j.id]
    if (box === undefined) {
      const r = await supabase.from('lnb_juego_jugadores').select('*').eq('juego_id', j.id)
      box = r.data || []
      setJuegoJugadores((m) => ({ ...m, [j.id]: box }))
    }
    const L = j.local, V = j.visitante
    const nomL = L?.nombre || equipos[L?.equipo_id]?.name || 'Local'
    const nomV = V?.nombre || equipos[V?.equipo_id]?.name || 'Visitante'
    const num = (o, ...ks) => { for (const k of ks) { if (o && o[k] != null) return Number(o[k]) || 0 } return 0 }
    let jug = (box || []).map((bx) => {
      const p = jugadores[bx.jugador_id] || {}
      const fgM = num(bx, 'fg_made'), fgA = num(bx, 'fg_att', 'fg_attempted')
      const tpM = num(bx, 'three_made'), tpA = num(bx, 'three_att', 'three_attempted')
      const ftM = num(bx, 'ft_made'), ftA = num(bx, 'ft_att', 'ft_attempted')
      const fa3 = Math.max(0, tpA - tpM)
      return {
        nombre: [p.nombre, p.apellido].filter(Boolean).join(' ') || ('#' + (p.shirt_number || '')),
        numero: p.shirt_number || '', equipo: bx.equipo_id === L?.equipo_id ? 0 : 1,
        foto_url: urlImg(p.image_url) || null,
        pts: num(bx, 'points'), reb: num(bx, 'rebounds'), ast: num(bx, 'assists'),
        rob: num(bx, 'steals'), tap: num(bx, 'blocks'), fal: num(bx, 'personal_fouls', 'fouls'),
        per: num(bx, 'turnovers'), min: Math.round(num(bx, 'minutes')),
        m3: tpM, m2: Math.max(0, fgM - tpM), fa3, fa2: Math.max(0, (fgA - fgM) - fa3),
        tlm: ftM, tlf: Math.max(0, ftA - ftM),
      }
    })
    const tL = L?.total_score != null ? Number(L.total_score) : 0
    const tV = V?.total_score != null ? Number(V.total_score) : 0
    // Solo si NO hay box score real caemos a dos filas con el marcador oficial.
    // (Antes lo borrábamos por cualquier descuadre de un punto; ya no.)
    if (!jug.length) {
      jug = [{ nombre: nomL, equipo: 0, pts: tL }, { nombre: nomV, equipo: 1, pts: tV }]
    }
    const urlL = urlImg(equipos[L?.equipo_id]?.image_url)
    const urlV = urlImg(equipos[V?.equipo_id]?.image_url)
    return {
      nombreA: nomL, nombreB: nomV, totalA: tL, totalB: tV,
      logoA: urlL, logoB: urlV, logoUrlA: urlL, logoUrlB: urlV,
      jugadores: jug, statsActivas: ['pts', 'reb', 'ast'], tipo: 'LNB', tipoJuego: 'LNB',
    }
  }
  const compartirJuego = (j) => setCompartiendo(j)
  const compartirAfuera = async (j) => {
    const nom = (e) => e?.nombre || equipos[e?.equipo_id]?.name || '—'
    const anyo = (temporadas.find((t) => t.id === j.temporada_id) || {}).year || ''
    const L = j.local, V = j.visitante
    const texto = `${nom(L)} ${L?.total_score ?? ''} - ${V?.total_score ?? ''} ${nom(V)} · LNB ${anyo}`.trim()
    setCompartiendo(null)
    try {
      if (navigator.share) { await navigator.share({ title: 'Media Cancha · LNB', text: texto }) }
      else { await navigator.clipboard.writeText(texto); setAviso('Resultado copiado'); setTimeout(() => setAviso(''), 2200) }
    } catch (_) { /* cancelado */ }
  }
  const compartirAlTechado = async (j) => {
    setCompartiendo(null); setAviso('Publicando…')
    try {
      const datos = await juegoADatos(j)
      const res = await publicarJuego(datos)
      setAviso(res?.error ? res.error : 'Publicado en tu techado ✓')
    } catch (_) { setAviso('No se pudo publicar') }
    setTimeout(() => setAviso(''), 2600)
  }
  const compartirAlChatAbrir = async (j) => {
    setCompartiendo(null)
    try { setCompartirChat(await juegoADatos(j)) }
    catch (_) { setAviso('No se pudo preparar'); setTimeout(() => setAviso(''), 2200) }
  }
  const TarjetaJuego = ({ j }) => {
    const vivo = esVivo(j), fin = esFinal(j), marc = vivo || fin
    const gan = j.local?.es_ganador ? j.local : (j.visitante?.es_ganador ? j.visitante : null)
    const col = fin && gan ? colorEquipoLNB(gan.nombre || equipos[gan.equipo_id]?.name, T.accion2) : null
    return (
      <div onClick={marc ? () => setJuegoSel(j) : undefined} style={{ position: 'relative', background: col ? `linear-gradient(100deg, ${hexA(col, T.esClaro ? 0.1 : 0.15)}, ${T.panel} 60%)` : T.panel, border: `1px solid ${col ? hexA(col, 0.32) : T.borde}`, borderRadius: 16, padding: '14px 15px 14px 17px', marginBottom: 11, overflow: 'hidden', cursor: marc ? 'pointer' : 'default' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: vivo ? T.accion : (col || (fin ? T.accion2 : T.tenue)), opacity: vivo ? 1 : (col ? 1 : 0.55) }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          {vivo ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: 0.5, color: T.accion, textTransform: 'uppercase' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.accion, boxShadow: `0 0 0 3px ${hexA(T.accion, 0.25)}` }} />
              En vivo{j.period ? ` · ${cuarto(j.period)}` : ''}
            </span>
          ) : fin ? (
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: col || T.tenue, background: col ? hexA(col, 0.16) : 'transparent', border: col ? `1px solid ${hexA(col, 0.4)}` : 'none', padding: col ? '2px 9px' : 0, borderRadius: 7 }}>Final</span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, color: T.accion2, textTransform: 'uppercase' }}>Próximo</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{marc ? (j.home_location_name || soloDia(j.date)) : fechaHora(j.date)}</span>
            {marc && (
              <button onClick={(e) => { e.stopPropagation(); compartirJuego(j) }} aria-label="Compartir resultado" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 9, border: `1px solid ${col ? hexA(col, 0.42) : T.borde}`, background: 'transparent', color: col || T.tenue, cursor: 'pointer', padding: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>
              </button>
            )}
          </div>
        </div>
        <FilaEquipo eq={j.local} marc={marc} col={j.local?.es_ganador ? col : null} />
        <div style={{ height: 10 }} />
        <FilaEquipo eq={j.visitante} marc={marc} col={j.visitante?.es_ganador ? col : null} />
        {marc && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.linea}`, display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.3, color: col || T.accion, textTransform: 'uppercase' }}>Detalles ›</span>
          </div>
        )}
      </div>
    )
  }

  // ----- tarjeta mini (tira de marcadores) -----
  const FilaMini = ({ eq, marc, col }) => {
    const gana = eq?.es_ganador
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Escudo id={eq?.equipo_id} nombre={eq?.nombre} size={20} />
        <span style={{ flex: 1, fontSize: 12, fontWeight: gana ? 800 : 600, color: gana ? (col || T.texto) : T.texto2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{abrev(eq)}</span>
        {marc && <span style={{ fontSize: 13.5, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: gana ? T.texto : T.tenue }}>{eq?.total_score ?? '-'}</span>}
      </div>
    )
  }
  const TickerCard = ({ j }) => {
    const vivo = esVivo(j), fin = esFinal(j), marc = vivo || fin
    const gan = j.local?.es_ganador ? j.local : (j.visitante?.es_ganador ? j.visitante : null)
    const col = fin && gan ? colorEquipoLNB(gan.nombre || equipos[gan.equipo_id]?.name, T.accion2) : null
    return (
      <div onClick={marc ? () => setJuegoSel(j) : undefined} style={{ position: 'relative', flexShrink: 0, width: 152, background: col ? `linear-gradient(135deg, ${hexA(col, T.esClaro ? 0.12 : 0.16)}, ${T.panel} 65%)` : T.panel, border: `1px solid ${col ? hexA(col, 0.34) : T.borde}`, borderRadius: 13, padding: '10px 12px 10px 14px', cursor: marc ? 'pointer' : 'default', overflow: 'hidden' }}>
        {col && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: col }} />}
        <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: vivo ? T.accion : (col || (fin ? T.tenue : T.accion2)), marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          {vivo && <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accion }} />}
          {vivo ? 'En vivo' : (fin ? 'Final' : soloDia(j.date))}
        </div>
        <FilaMini eq={j.local} marc={marc} col={j.local?.es_ganador ? col : null} />
        <div style={{ height: 7 }} />
        <FilaMini eq={j.visitante} marc={marc} col={j.visitante?.es_ganador ? col : null} />
      </div>
    )
  }

  // ----- jugador de la semana (hero) -----
  const HeroSemana = () => {
    if (!jugadorSemana) return null
    const j = jugadorSemana
    const sub = [j.equipo_nombre, j.posicion_nombre].filter(Boolean).join(' · ')
    return (
      <div onClick={() => abrirJugador({ id: j.id, nombre: j.nombre, apellido: j.apellido, image_url: j.image_url, equipo_id: j.equipo_id, posicion_nombre: j.posicion_nombre, shirt_number: j.shirt_number })} style={{ display: 'flex', alignItems: 'center', gap: 14, background: `linear-gradient(120deg, ${hexA(T.accion2, 0.18)}, ${hexA(T.accion, 0.10)})`, border: `1px solid ${T.borde}`, borderRadius: 18, padding: 14, marginBottom: 20, overflow: 'hidden', cursor: 'pointer' }}>
        <div style={{ borderRadius: '50%', padding: 2.5, background: `linear-gradient(135deg, ${T.accion2}, ${T.accion})`, flexShrink: 0 }}>
          <Foto url={j.image_url} nombre={j.nombre} size={58} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: T.accion, marginBottom: 3 }}>{j.label || 'Jugador de la semana'}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[j.nombre, j.apellido].filter(Boolean).join(' ')}</div>
          <div style={{ fontSize: 12, color: T.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}{j.shirt_number != null ? ` · #${j.shirt_number}` : ''}</div>
        </div>
        <span style={{ fontSize: 22, color: T.tenue, flexShrink: 0 }}>›</span>
      </div>
    )
  }

  // ===== vistas =====
  const VistaJuegos = () => {
    const esActual = temporada && temporadaSel === temporada.id
    const dela = juegos.filter((j) => j.temporada_id === temporadaSel)
    const vivos = dela.filter(esVivo)
    const finales = dela.filter(esFinal)
    const proximos = dela.filter(esProximo).slice().reverse()
    const ticker = [...vivos, ...finales].slice(0, 14)
    return (
      <>
        {esActual && <HeroSemana />}
        {ticker.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Eyebrow txt="Marcadores" />
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '2px 2px 6px', margin: '0 -2px', WebkitOverflowScrolling: 'touch' }}>
              {ticker.map((j) => <TickerCard key={`t${j.id}`} j={j} />)}
            </div>
          </div>
        )}
        {vivos.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Eyebrow txt="En vivo ahora" />
            {vivos.map((j) => <TarjetaJuego key={j.id} j={j} />)}
          </div>
        )}
        {proximos.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Eyebrow txt="Próximos juegos" />
            {agruparPorDia(proximos.slice(0, 12)).map((g) => (
              <div key={`p${g.k}`} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 2px 10px' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: T.texto, letterSpacing: 0.2 }}>{fechaLarga(g.fecha)}</span>
                  <span style={{ flex: 1, height: 1, background: T.linea }} />
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: T.tenue }}>{g.juegos.length} {g.juegos.length === 1 ? 'juego' : 'juegos'}</span>
                </div>
                {g.juegos.map((j) => <TarjetaJuego key={j.id} j={j} />)}
              </div>
            ))}
          </div>
        )}
        <div>
          <Eyebrow txt="Resultados" />
          {finales.length === 0 ? <Vacio txt="Todavía no hay resultados." /> : (
            <>
              {agruparPorDia(finales.slice(0, 60)).map((g) => (
                <div key={`f${g.k}`} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 2px 10px' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: T.texto, letterSpacing: 0.2 }}>{fechaLarga(g.fecha)}</span>
                    <span style={{ flex: 1, height: 1, background: T.linea }} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: T.tenue }}>{g.juegos.length} {g.juegos.length === 1 ? 'juego' : 'juegos'}</span>
                  </div>
                  {g.juegos.map((j) => <TarjetaJuego key={j.id} j={j} />)}
                </div>
              ))}
              {finales.length > 60 && <div style={{ textAlign: 'center', fontSize: 11, color: T.tenue, marginTop: 10 }}>Mostrando los 60 resultados más recientes de la temporada.</div>}
            </>
          )}
        </div>
      </>
    )
  }

  const VistaTabla = () => {
    const tabla = standing.filter((s) => s.temporada_id === temporadaSel)
    if (!tabla.length) return <Vacio txt="La tabla de posiciones aparecerá aquí." />
    const corte = 4
    return (
      <div style={{ background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', borderBottom: `1px solid ${T.linea}`, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: T.tenue }}>
          <span style={{ width: 22, textAlign: 'center' }}>#</span>
          <span style={{ flex: 1, marginLeft: 10 }}>Equipo</span>
          <span style={{ width: 30, textAlign: 'center' }}>G</span>
          <span style={{ width: 30, textAlign: 'center' }}>P</span>
          <span style={{ width: 70, textAlign: 'right' }}>Últimos 5</span>
        </div>
        {tabla.map((s, i) => {
          const eq = equipos[s.equipo_id]
          const form = parseForm(s.last5_games)
          const top = i < corte
          const ultimo = i === tabla.length - 1
          return (
            <div key={s.equipo_id}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', background: top ? hexA(T.accion2, 0.07) : 'transparent' }}>
                <span style={{ width: 22, textAlign: 'center', fontSize: 14, fontWeight: 900, color: top ? T.accion2 : T.tenue, fontVariantNumeric: 'tabular-nums' }}>{s.position}</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, marginLeft: 10 }}>
                  <Escudo id={s.equipo_id} nombre={eq?.name} size={26} />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: T.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eq?.name || '—'}</span>
                </div>
                <span style={{ width: 30, textAlign: 'center', fontSize: 13.5, fontWeight: 800, color: T.texto, fontVariantNumeric: 'tabular-nums' }}>{s.won}</span>
                <span style={{ width: 30, textAlign: 'center', fontSize: 13, color: T.tenue, fontVariantNumeric: 'tabular-nums' }}>{s.lost}</span>
                <span style={{ width: 70, display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
                  {form ? form.slice(-5).map((rdo, k) => <span key={k} style={{ width: 7, height: 7, borderRadius: '50%', background: rdo === 'W' ? '#34c77b' : '#e24b5a' }} />) : <span style={{ fontSize: 11, color: T.tenue }}>—</span>}
                </span>
              </div>
              {i === corte - 1 && !ultimo
                ? <div style={{ borderBottom: `1px dashed ${hexA(T.accion2, 0.45)}`, margin: '0 14px' }} />
                : (!ultimo ? <div style={{ height: 1, background: T.linea, margin: '0 14px' }} /> : null)}
            </div>
          )
        })}
        <div style={{ padding: '10px 14px', fontSize: 10.5, color: T.tenue, display: 'flex', alignItems: 'center', gap: 8, borderTop: `1px solid ${T.linea}` }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: hexA(T.accion2, 0.6) }} /> Zona de clasificación (top {corte})
        </div>
      </div>
    )
  }

  // ===== Estadísticas de la temporada seleccionada =====
  // Vienen de lnb_jugador_temporada (un registro por jugador por año). Si esa
  // tabla aún no tiene datos para la temporada actual, se usa de respaldo lo que
  // ya hay en lnb_jugadores (promedios de la temporada en curso).
  let statsSeason = tempStats.filter((t) => t.temporada_id === temporadaSel)
  if (!statsSeason.length && temporada && temporadaSel === temporada.id) {
    statsSeason = Object.values(jugadores).map((p) => ({ ...p, jugador_id: p.id, temporada_id: temporada.id }))
  }
  const statsPorJugador = {}; statsSeason.forEach((s) => { statsPorJugador[s.jugador_id] = s })
  // Historial completo de un jugador (todos sus años), más reciente primero.
  const historialDe = (jid) => tempStats.filter((t) => t.jugador_id === jid)
    .slice().sort((a, b) => (b.year || 0) - (a.year || 0))

  // ===== MC Rating con techo FIJO (0–100), comparable entre temporadas =====
  // Se divide la eficiencia de cada jugador entre la MÁS ALTA de toda la historia
  // cargada (no la del año). Así el 100 lo toca solo la mejor campaña de siempre,
  // el líder de cada año saca su número real, y un año flojo no empata con uno duro.
  // Auto-actualizable: se recalibra solo cuando el robot mete temporadas nuevas.
  // Es un rating PROPIO de la liga; a futuro podrá emparejarse al perfil del
  // jugador si ese jugador se registra en la app (eso es otro módulo aparte).
  const effDe = (s) => {
    if (!s) return 0
    const e = Number(s.efficiency)
    if (s.efficiency != null && !Number.isNaN(e) && e > 0) return e
    return (Number(s.points) || 0) + (Number(s.rebounds) || 0) + (Number(s.assists) || 0) + (Number(s.steals) || 0) + (Number(s.blocks) || 0) - (Number(s.turnovers) || 0)
  }
  const maxEffHist = Math.max(1, ...(tempStats.length ? tempStats : statsSeason).map(effDe))
  const mcRatingDe = (s) => Math.round(100 * Math.pow(Math.max(0, effDe(s)) / maxEffHist, 0.85))
  const ratingJugador = (jid) => mcRatingDe(statsPorJugador[jid])
  // El techo es GLOBAL (la mejor campaña de todas las temporadas), así que el
  // cálculo es el mismo en cualquier año y los años quedan comparables.
  const ratingEnAnno = (s) => mcRatingDe(s)

  // Roster de un equipo EN la temporada seleccionada (devuelve filas de stats;
  // la identidad del jugador se toma de `jugadores` por su jugador_id).
  const rosterDe = (eqId) => statsSeason.filter((s) => s.equipo_id === eqId)

  const VistaEquipos = () => {
    const stSeason = standing.filter((s) => s.temporada_id === temporadaSel)
    let ids = stSeason.length
      ? stSeason.map((s) => s.equipo_id).filter((id) => equipos[id])
      : [...new Set(statsSeason.map((s) => s.equipo_id).filter((id) => equipos[id]))]
    if (!ids.length) ids = Object.keys(equipos)
    ids = [...new Set(ids)]
    if (!ids.length) return <Vacio txt="Los equipos aparecerán aquí." />
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 12 }}>
        {ids.map((id) => {
          const eq = equipos[id]
          const n = rosterDe(id).length
          return (
            <div key={id} onClick={() => setEquipoSel(id)} style={{ background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 16, padding: '18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, cursor: 'pointer', textAlign: 'center' }}>
              <Escudo id={id} nombre={eq?.name} size={56} />
              <div style={{ fontSize: 13.5, fontWeight: 800, color: T.texto, lineHeight: 1.2 }}>{eq?.name || '—'}</div>
              <div style={{ fontSize: 11, color: T.tenue }}>{n} {n === 1 ? 'jugador' : 'jugadores'}</div>
            </div>
          )
        })}
      </div>
    )
  }

  const DetalleEquipo = ({ id, cerrar }) => {
    const eq = equipos[id]
    const roster = rosterDe(id).slice().sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0))
    const st = standing.find((s) => s.equipo_id === id && s.temporada_id === temporadaSel)
    const n1 = (v) => (v == null ? '—' : Math.round(v * 10) / 10)
    return (
      <div onClick={cerrar} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 65, background: 'rgba(0,0,0,0.62)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: T.fondo, borderTopLeftRadius: 22, borderTopRightRadius: 22, border: `1px solid ${T.borde}`, maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', height: 3 }}>
            <span style={{ flex: 1, background: '#1B3A8C' }} />
            <span style={{ flex: 1, background: '#ffffff' }} />
            <span style={{ flex: 1, background: '#CE1126' }} />
          </div>
          <div style={{ padding: '14px 18px calc(env(safe-area-inset-bottom) + 22px)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><span onClick={cerrar} style={{ fontSize: 24, color: T.tenue, cursor: 'pointer', lineHeight: 1 }}>×</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: -6, marginBottom: 16 }}>
              <Escudo id={id} nombre={eq?.name} size={72} />
              <div style={{ fontSize: 19, fontWeight: 900, color: T.texto, marginTop: 10 }}>{eq?.name || '—'}</div>
              {st && <div style={{ fontSize: 12.5, color: T.tenue, marginTop: 3 }}>{st.won}-{st.lost} · {st.position}º lugar</div>}
              <div style={{ fontSize: 11.5, color: T.tenue, marginTop: 3 }}>{roster.length} {roster.length === 1 ? 'jugador' : 'jugadores'}</div>
            </div>
            {!roster.length ? <Vacio txt="Sin jugadores cargados para este equipo." /> : (
              <div style={{ background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 16, overflow: 'hidden' }}>
                {roster.map((s, i) => {
                  const p = jugadores[s.jugador_id] || {}
                  return (
                  <div key={s.jugador_id} onClick={() => abrirJugador({ id: s.jugador_id, nombre: p.nombre, apellido: p.apellido, image_url: p.image_url, equipo_id: s.equipo_id, posicion_nombre: p.posicion_nombre, shirt_number: p.shirt_number })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: i < roster.length - 1 ? `1px solid ${T.linea}` : 'none', cursor: 'pointer' }}>
                    <Foto url={p.image_url} nombre={p.nombre} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: T.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre || 'Jugador'} {p.apellido || ''}</div>
                      <div style={{ fontSize: 11, color: T.tenue }}>{p.posicion_nombre || ''}{p.shirt_number != null ? ` · #${p.shirt_number}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: T.texto, fontVariantNumeric: 'tabular-nums' }}>{n1(s.points)}</div><div style={{ fontSize: 9, fontWeight: 700, color: T.tenue }}>PTS</div></div>
                      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 800, color: T.texto2, fontVariantNumeric: 'tabular-nums' }}>{n1(s.rebounds)}</div><div style={{ fontSize: 9, fontWeight: 700, color: T.tenue }}>REB</div></div>
                      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 800, color: T.texto2, fontVariantNumeric: 'tabular-nums' }}>{n1(s.assists)}</div><div style={{ fontSize: 9, fontWeight: 700, color: T.tenue }}>AST</div></div>
                      <div style={{ textAlign: 'center', minWidth: 30 }}><div style={{ fontSize: 14, fontWeight: 900, color: '#E8B23A', fontVariantNumeric: 'tabular-nums' }}>{mcRatingDe(s)}</div><div style={{ fontSize: 9, fontWeight: 700, color: T.tenue }}>RAT</div></div>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
            <div style={{ marginTop: 12, fontSize: 10.5, color: T.tenue, textAlign: 'center' }}>Promedios de temporada · toca un jugador para ver su perfil</div>
          </div>
        </div>
      </div>
    )
  }

  const VistaLideres = () => {
    const esRating = catSel === 'mcrating'
    let lista
    if (esRating) {
      lista = statsSeason
        .map((s) => {
          const info = jugadores[s.jugador_id] || {}
          return { jugador_id: s.jugador_id, nombre: info.nombre, apellido: info.apellido, image_url: info.image_url, equipo_id: s.equipo_id, _rating: mcRatingDe(s) }
        })
        .filter((x) => x._rating > 0)
        .sort((a, b) => b._rating - a._rating)
        .map((x, i) => ({ ...x, rank: i + 1 }))
        .slice(0, 25)
    } else {
      lista = lideres.filter((l) => l.temporada_id === temporadaSel && l.categoria === catSel).sort((a, b) => a.rank - b.rank)
    }
    const cat = CATS.find((c) => c.id === catSel)
    const lider = lista[0]
    const resto = lista.slice(1)
    const valDe = (l) => (esRating ? l._rating : valorLider(l).toFixed(1))
    const subLabel = esRating ? 'MC Rating' : 'por juego'
    return (
      <>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 16, WebkitOverflowScrolling: 'touch' }}>
          {CATS.map((c) => {
            const on = catSel === c.id
            return <button key={c.id} onClick={() => setCatSel(c.id)} style={{ padding: '8px 15px', borderRadius: 22, fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer', border: `1px solid ${on ? T.accion : T.borde}`, background: on ? T.accion : T.chip, color: on ? '#fff' : T.texto2 }}>{c.txt}</button>
          })}
        </div>
        {!lider ? <Vacio txt="No hay datos de esta categoría todavía." /> : (
          <>
            <div onClick={() => abrirJugador(playerDeLider(lider))} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 15, background: `linear-gradient(135deg, ${hexA(T.accion2, 0.18)}, ${hexA(T.accion, 0.10)})`, border: `1px solid ${T.borde}`, borderRadius: 18, padding: 16, marginBottom: 14, overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ position: 'absolute', top: -34, right: -14, fontSize: 130, fontWeight: 900, color: hexA(T.texto, 0.05), lineHeight: 1, fontFamily: fDisp }}>1</div>
              <div style={{ position: 'relative', borderRadius: '50%', padding: 3, background: `linear-gradient(135deg, ${T.accion2}, ${T.accion})`, flexShrink: 0 }}>
                <Foto url={lider.image_url} nombre={lider.nombre} size={66} />
              </div>
              <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: T.accion, marginBottom: 4 }}>Líder · {cat?.txt}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[lider.nombre, lider.apellido].filter(Boolean).join(' ')}</div>
                <div style={{ fontSize: 12.5, color: T.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{equipos[lider.equipo_id]?.name || ''}</div>
              </div>
              <div style={{ position: 'relative', textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: T.texto, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{valDe(lider)}</div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: T.tenue, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{subLabel}</div>
              </div>
            </div>
            {resto.length > 0 && (
              <div style={{ background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 16, overflow: 'hidden' }}>
                {resto.map((l, i) => {
                  const eq = equipos[l.equipo_id]
                  return (
                    <div key={`${l.jugador_id}-${l.rank}`} onClick={() => abrirJugador(playerDeLider(l))} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: i < resto.length - 1 ? `1px solid ${T.linea}` : 'none', cursor: 'pointer' }}>
                      <span style={{ width: 20, fontSize: 13.5, fontWeight: 800, color: T.tenue, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{l.rank}</span>
                      <Foto url={l.image_url} nombre={l.nombre} size={34} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[l.nombre, l.apellido].filter(Boolean).join(' ')}</div>
                        <div style={{ fontSize: 11.5, color: T.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eq?.name || ''}</div>
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 900, color: T.texto, fontVariantNumeric: 'tabular-nums' }}>{valDe(l)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </>
    )
  }

  const VistaNoticias = () => {
    if (!noticias.length) return <Vacio txt="No hay noticias todavía." />
    const primera = noticias[0]
    const resto = noticias.slice(1)
    const url0 = urlImg(primera.image_url)
    return (
      <>
        <div onClick={() => setNoticiaSel(primera)} style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${T.borde}`, marginBottom: 16, background: T.panel, cursor: 'pointer' }}>
          {url0 && (
            <div style={{ position: 'relative', width: '100%', height: 200 }}>
              <img src={url0} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { const p = e.currentTarget.parentElement; if (p) p.style.display = 'none' }} />
              <span style={{ position: 'absolute', left: 12, top: 12, fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#fff', background: T.accion, padding: '4px 10px', borderRadius: 20 }}>Destacada</span>
            </div>
          )}
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.texto, lineHeight: 1.3, marginBottom: 7 }}>{primera.title}</div>
            {primera.excerpt && <div style={{ fontSize: 13.5, color: T.texto2, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{primera.excerpt}</div>}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.accion, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.3 }}>Leer noticia ›</div>
          </div>
        </div>
        {resto.map((n) => {
          const u = urlImg(n.image_url)
          return (
            <div key={n.id} onClick={() => setNoticiaSel(n)} style={{ display: 'flex', gap: 12, background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 14, overflow: 'hidden', marginBottom: 10, cursor: 'pointer' }}>
              {u && <img src={u} alt="" style={{ width: 96, height: 96, objectFit: 'cover', flexShrink: 0, display: 'block' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />}
              <div style={{ flex: 1, minWidth: 0, padding: u ? '11px 12px 11px 0' : '11px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.texto, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.title}</div>
                <div style={{ fontSize: 10.5, color: T.tenue, marginTop: 6 }}>{soloDia(n.created_at)}</div>
              </div>
            </div>
          )
        })}
      </>
    )
  }

  // ----- detalle de un juego (por cuartos) -----
  const DetalleJuego = ({ j, cerrar }) => {
    if (!j) return null
    const A = j.local, B = j.visitante
    const vivo = esVivo(j), fin = esFinal(j)
    const n1 = (v) => (v == null ? '—' : Math.round(v * 10) / 10)
    const stOf = (eq) => standing.find((s) => s.equipo_id === eq?.equipo_id) || null
    const topJug = (eq, n = 3) => Object.values(jugadores).filter((p) => p.equipo_id === eq?.equipo_id).sort((a, b) => (b.efficiency ?? b.points ?? 0) - (a.efficiency ?? a.points ?? 0)).slice(0, n)
    const maxQ = Math.max(1, ...[1, 2, 3, 4].flatMap((q) => [Number(A?.['period_' + q]) || 0, Number(B?.['period_' + q]) || 0]))
    const colA = T.accion2, colB = T.accion
    const box = juegoJugadores[j.id] || []
    const n1b = (v) => (v == null ? '—' : v)
    // Ganador del partido → su escudo va de marca de agua detrás del marcador,
    // y su color de equipo viste la cabecera (igual que la tarjeta de la lista).
    const ganador = A?.es_ganador ? A : (B?.es_ganador ? B : null)
    const urlGan = urlImg(equipos[ganador?.equipo_id]?.image_url)
    const colGan = ganador ? colorEquipoLNB(ganador.nombre || equipos[ganador.equipo_id]?.name, T.accion2) : null
    const LadoRes = ({ eq }) => {
      const gana = eq?.es_ganador
      return (
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <div style={{ borderRadius: 13, padding: gana ? 3 : 0, background: gana ? `linear-gradient(135deg, ${T.accion2}, ${T.accion})` : 'transparent', boxShadow: gana ? '0 4px 14px rgba(0,0,0,0.18)' : 'none' }}>
              <Escudo id={eq?.equipo_id} nombre={eq?.nombre} size={gana ? 56 : 48} />
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: gana ? 800 : 700, color: gana ? T.texto : T.texto2, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{abrev(eq)}</div>
          <div style={{ fontSize: 40, fontWeight: 900, color: gana ? T.texto : T.tenue, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{eq?.total_score ?? '-'}</div>
          {fin && gana && <div style={{ marginTop: 7, display: 'inline-block', fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: '#fff', background: `linear-gradient(135deg, ${T.accion2}, ${T.accion})`, padding: '2px 9px', borderRadius: 10 }}>Ganó</div>}
        </div>
      )
    }
    const filaQ = (eq) => (
      <div style={{ display: 'flex', alignItems: 'center', padding: '11px 0' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Escudo id={eq?.equipo_id} nombre={eq?.nombre} size={28} />
          <span style={{ fontSize: 13.5, fontWeight: eq?.es_ganador ? 800 : 600, color: eq?.es_ganador ? T.texto : T.texto2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eq?.nombre || equipos[eq?.equipo_id]?.name || '—'}</span>
        </div>
        {[1, 2, 3, 4].map((q) => <span key={q} style={{ width: 34, textAlign: 'center', fontSize: 13, color: T.tenue, fontVariantNumeric: 'tabular-nums' }}>{eq && eq['period_' + q] != null ? eq['period_' + q] : '-'}</span>)}
        <span style={{ width: 42, textAlign: 'center', fontSize: 16, fontWeight: 900, color: T.texto, fontVariantNumeric: 'tabular-nums' }}>{eq?.total_score ?? '-'}</span>
      </div>
    )
    return (
      <div onClick={cerrar} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60, background: 'rgba(0,0,0,0.62)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: T.fondo, borderTopLeftRadius: 22, borderTopRightRadius: 22, border: `1px solid ${T.borde}`, maxHeight: '88vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', height: 3 }}>
            <span style={{ flex: 1, background: '#1B3A8C' }} />
            <span style={{ flex: 1, background: '#ffffff' }} />
            <span style={{ flex: 1, background: '#CE1126' }} />
          </div>
          <div style={{ padding: '16px 18px calc(env(safe-area-inset-bottom) + 22px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: vivo ? T.accion : T.tenue }}>{vivo ? `En vivo${j.period ? ` · ${cuarto(j.period)}` : ''}` : (fin ? 'Final' : 'Próximo')}</span>
              <span onClick={cerrar} style={{ fontSize: 24, color: T.tenue, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</span>
            </div>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, border: `1px solid ${colGan ? hexA(colGan, 0.35) : T.borde}`, background: colGan ? `linear-gradient(135deg, ${hexA(colGan, T.esClaro ? 0.16 : 0.2)}, ${hexA(colGan, 0.05)} 70%)` : `linear-gradient(135deg, ${hexA(T.accion2, 0.13)}, ${hexA(T.accion, 0.06)})`, padding: '18px 14px 16px', marginBottom: 20 }}>
              {urlGan && <img src={urlGan} alt="" aria-hidden="true" style={{ position: 'absolute', right: '-4%', top: '50%', transform: 'translateY(-50%)', width: 230, height: 230, objectFit: 'contain', opacity: T.esClaro ? 0.14 : 0.2, pointerEvents: 'none' }} />}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <LadoRes eq={A} />
                <span style={{ fontSize: 11, fontWeight: 800, color: T.tenue, letterSpacing: 1, flexShrink: 0 }}>VS</span>
                <LadoRes eq={B} />
              </div>
            </div>
            <div style={{ background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 14, padding: '2px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${T.linea}` }}>
                <span style={{ flex: 1, fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: T.tenue }}>Equipo</span>
                {[1, 2, 3, 4].map((q) => <span key={q} style={{ width: 34, textAlign: 'center', fontSize: 10.5, fontWeight: 800, color: T.tenue }}>{`Q${q}`}</span>)}
                <span style={{ width: 42, textAlign: 'center', fontSize: 10.5, fontWeight: 800, color: T.texto }}>T</span>
              </div>
              {filaQ(A)}
              <div style={{ height: 1, background: T.linea }} />
              {filaQ(B)}
            </div>
            {(fin || vivo) && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: T.tenue, marginBottom: 12 }}>Puntos por cuarto</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', padding: '0 6px' }}>
                  {[1, 2, 3, 4].map((q) => {
                    const va = Number(A?.['period_' + q]) || 0, vb = Number(B?.['period_' + q]) || 0
                    return (
                      <div key={q} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 5, height: 72 }}>
                          <div style={{ width: 14, borderRadius: '4px 4px 0 0', background: colA, height: `${Math.max(5, (va / maxQ) * 72)}px` }} />
                          <div style={{ width: 14, borderRadius: '4px 4px 0 0', background: colB, height: `${Math.max(5, (vb / maxQ) * 72)}px` }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: T.tenue }}>Q{q}</span>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.texto2 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: colA }} />{abrev(A)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.texto2 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: colB }} />{abrev(B)}</span>
                </div>
              </div>
            )}

            {(stOf(A) || stOf(B)) && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: T.tenue, marginBottom: 11 }}>En la temporada</div>
                <div style={{ display: 'flex', gap: 11 }}>
                  {[A, B].map((eq, i) => {
                    const s = stOf(eq)
                    return (
                      <div key={i} style={{ flex: 1, background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 12, padding: '11px 13px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Escudo id={eq?.equipo_id} nombre={eq?.nombre} size={22} />
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: T.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{abrev(eq)}</span>
                        </div>
                        {s ? (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                            <span style={{ fontSize: 17, fontWeight: 900, color: T.texto, fontVariantNumeric: 'tabular-nums' }}>{s.won}-{s.lost}</span>
                            <span style={{ fontSize: 11, color: T.tenue }}>{s.position}º lugar</span>
                          </div>
                        ) : <span style={{ fontSize: 11, color: T.tenue }}>Sin datos</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {box.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: T.tenue, marginBottom: 12 }}>Box score del partido</div>
                {[A, B].map((eq, i) => {
                  const filas = box.filter((x) => x.equipo_id === eq?.equipo_id).sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0))
                  if (!filas.length) return null
                  return (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Escudo id={eq?.equipo_id} nombre={eq?.nombre} size={18} />
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: T.texto2, textTransform: 'uppercase', letterSpacing: 0.3 }}>{abrev(eq)}</span>
                      </div>
                      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -2px' }}>
                        <div style={{ minWidth: 372 }}>
                          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 2px', borderBottom: `1px solid ${T.linea}` }}>
                            <span style={{ flex: 1, minWidth: 116, fontSize: 9.5, fontWeight: 800, color: T.tenue, textTransform: 'uppercase', letterSpacing: 0.3 }}>Jugador</span>
                            {['MIN', 'PTS', 'REB', 'AST', 'FG', '3P'].map((h) => <span key={h} style={{ width: 42, textAlign: 'center', fontSize: 9.5, fontWeight: 800, color: h === 'PTS' ? T.texto : T.tenue }}>{h}</span>)}
                          </div>
                          {filas.map((x) => {
                            const pj = jugadores[x.jugador_id] || {}
                            const fg = (x.fg_att != null && Number(x.fg_att) > 0) ? `${x.fg_made ?? 0}-${x.fg_att}` : '—'
                            const tp = (x.three_att != null && Number(x.three_att) > 0) ? `${x.three_made ?? 0}-${x.three_att}` : '—'
                            return (
                              <div key={x.jugador_id} onClick={() => abrirJugador({ id: x.jugador_id, nombre: pj.nombre, apellido: pj.apellido, image_url: pj.image_url, equipo_id: x.equipo_id, posicion_nombre: pj.posicion_nombre, shirt_number: pj.shirt_number })} style={{ display: 'flex', alignItems: 'center', padding: '8px 2px', cursor: 'pointer', borderBottom: `1px solid ${T.linea}` }}>
                                <div style={{ flex: 1, minWidth: 116, display: 'flex', alignItems: 'center', gap: 9 }}>
                                  <Foto url={pj.image_url} nombre={pj.nombre} size={30} />
                                  <span style={{ fontSize: 12.5, fontWeight: 700, color: T.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${pj.nombre || ''} ${pj.apellido || ''}`.trim() || '—'}</span>
                                </div>
                                <span style={{ width: 42, textAlign: 'center', fontSize: 12.5, color: T.texto2, fontVariantNumeric: 'tabular-nums' }}>{n1b(x.minutes)}</span>
                                <span style={{ width: 42, textAlign: 'center', fontSize: 13.5, fontWeight: 900, color: T.texto, fontVariantNumeric: 'tabular-nums' }}>{n1b(x.points)}</span>
                                <span style={{ width: 42, textAlign: 'center', fontSize: 12.5, color: T.texto2, fontVariantNumeric: 'tabular-nums' }}>{n1b(x.rebounds)}</span>
                                <span style={{ width: 42, textAlign: 'center', fontSize: 12.5, color: T.texto2, fontVariantNumeric: 'tabular-nums' }}>{n1b(x.assists)}</span>
                                <span style={{ width: 42, textAlign: 'center', fontSize: 11.5, color: T.tenue, fontVariantNumeric: 'tabular-nums' }}>{fg}</span>
                                <span style={{ width: 42, textAlign: 'center', fontSize: 11.5, color: T.tenue, fontVariantNumeric: 'tabular-nums' }}>{tp}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {box.length === 0 && (topJug(A).length > 0 || topJug(B).length > 0) && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: T.tenue }}>Jugadores a seguir</div>
                <div style={{ fontSize: 10.5, color: T.tenue, marginTop: 2, marginBottom: 13 }}>Promedios de temporada</div>
                {[A, B].map((eq, i) => {
                  const lst = topJug(eq, 3)
                  if (!lst.length) return null
                  return (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Escudo id={eq?.equipo_id} nombre={eq?.nombre} size={18} />
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: T.texto2, textTransform: 'uppercase', letterSpacing: 0.3 }}>{abrev(eq)}</span>
                      </div>
                      {lst.map((p) => (
                        <div key={p.id} onClick={() => abrirJugador({ id: p.id, nombre: p.nombre, apellido: p.apellido, image_url: p.image_url, equipo_id: p.equipo_id, posicion_nombre: p.posicion_nombre, shirt_number: p.shirt_number })} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 2px', cursor: 'pointer', borderBottom: `1px solid ${T.linea}` }}>
                          <Foto url={p.image_url} nombre={p.nombre} size={36} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre} {p.apellido || ''}</div>
                            <div style={{ fontSize: 10.5, color: T.tenue }}>{p.posicion_nombre || ''}{p.shirt_number != null ? ` · #${p.shirt_number}` : ''}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 13 }}>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: T.texto, fontVariantNumeric: 'tabular-nums' }}>{n1(p.points)}</div><div style={{ fontSize: 9, fontWeight: 700, color: T.tenue }}>PTS</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 800, color: T.texto2, fontVariantNumeric: 'tabular-nums' }}>{n1(p.rebounds)}</div><div style={{ fontSize: 9, fontWeight: 700, color: T.tenue }}>REB</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 800, color: T.texto2, fontVariantNumeric: 'tabular-nums' }}>{n1(p.assists)}</div><div style={{ fontSize: 9, fontWeight: 700, color: T.tenue }}>AST</div></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}

            {(j.home_location_name || j.date) && <div style={{ marginTop: 16, fontSize: 12, color: T.tenue, textAlign: 'center' }}>{[j.home_location_name, fechaHora(j.date)].filter(Boolean).join(' · ')}</div>}
            <div style={{ marginTop: 12, fontSize: 10.5, color: T.tenue, textAlign: 'center', lineHeight: 1.5 }}>{box.length > 0 ? 'Box score oficial del partido.' : 'Promedios de temporada. El box score por jugador de cada partido llegará cuando el robot cargue las líneas individuales.'}</div>
          </div>
        </div>
      </div>
    )
  }

  // ----- perfil de un jugador (hoy: su lugar entre los líderes) -----
  const playerDeLider = (l) => ({ id: l.jugador_id, nombre: l.nombre, apellido: l.apellido, image_url: l.image_url, equipo_id: l.equipo_id })
  const abrirJugador = (p) => setJugadorSel(p)
  const PerfilJugador = ({ p, cerrar }) => {
    if (!p) return null
    const full = jugadores[p.id] || {}
    const sea = statsPorJugador[p.id] || null
    const annoSel = (temporadas.find((t) => t.id === temporadaSel) || {}).year
    const eq = equipos[(sea && sea.equipo_id) || full.equipo_id || p.equipo_id]
    const nombre = [full.nombre || p.nombre, full.apellido || p.apellido].filter(Boolean).join(' ')
    const f1 = (v) => (v == null || v === '' ? '-' : Number(v).toFixed(1))
    const pct = (v) => (v == null || v === '' ? '-' : Math.round(Number(v) * 100) + '%')
    const tieneStats = sea && (sea.points != null || sea.rebounds != null || sea.assists != null)
    const filas = CATS.filter((c) => c.id !== 'mcrating').map((c) => {
      const e = lideres.find((l) => l.jugador_id === p.id && l.categoria === c.id && l.temporada_id === temporadaSel)
      return e ? { cat: c.txt, rank: e.rank, average: e.average, total: e.total } : null
    }).filter(Boolean)
    const hist = historialDe(p.id)
    const pos = full.posicion_nombre || p.posicion_nombre
    const num = full.shirt_number != null ? full.shirt_number : p.shirt_number
    const sub = [eq?.name, pos, num != null ? `#${num}` : null].filter(Boolean).join(' · ')
    const grid = sea ? [
      ['Min', f1(sea.minutes)], ['Robos', f1(sea.steals)], ['Tapones', f1(sea.blocks)],
      ['Faltas', f1(sea.personal_fouls)], ['Pérdidas', f1(sea.turnovers)], ['Eficiencia', f1(sea.efficiency)],
    ] : []
    const pcts = sea ? [['% Campo', pct(sea.fg_pct)], ['% Triples', pct(sea.three_pct)], ['% Libres', pct(sea.ft_pct)]] : []
    const Caja = ({ lbl, val }) => (
      <div style={{ background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 12, padding: '11px 6px', textAlign: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 900, color: T.texto, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{val}</div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: T.tenue, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 5 }}>{lbl}</div>
      </div>
    )
    return (
      <div onClick={cerrar} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 80, background: 'rgba(0,0,0,0.62)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: T.fondo, borderTopLeftRadius: 22, borderTopRightRadius: 22, border: `1px solid ${T.borde}`, maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', height: 3 }}>
            <span style={{ flex: 1, background: '#1B3A8C' }} />
            <span style={{ flex: 1, background: '#ffffff' }} />
            <span style={{ flex: 1, background: '#CE1126' }} />
          </div>
          <div style={{ padding: '12px 18px calc(env(safe-area-inset-bottom) + 22px)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
              {tieneStats && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: `linear-gradient(135deg, ${T.accion2}, ${T.accion})`, borderRadius: 12, padding: '5px 13px', boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}>
                  <div style={{ fontSize: 21, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{ratingJugador(p.id)}</div>
                  <div style={{ fontSize: 8.5, fontWeight: 800, color: 'rgba(255,255,255,0.92)', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 }}>Rating</div>
                </div>
              )}
              <span onClick={cerrar} style={{ fontSize: 24, color: T.tenue, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: -2, marginBottom: 18 }}>
              <div style={{ borderRadius: '50%', padding: 3, background: `linear-gradient(135deg, ${T.accion2}, ${T.accion})`, marginBottom: 12 }}>
                <Foto url={full.image_url || p.image_url} nombre={full.nombre || p.nombre} size={92} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: T.texto, lineHeight: 1.15 }}>{nombre || '—'}</div>
              {sub && <div style={{ fontSize: 13, color: T.tenue, marginTop: 5 }}>{sub}</div>}
              {sea && sea.count_matches != null && <div style={{ fontSize: 11.5, color: T.tenue, marginTop: 3 }}>{sea.count_matches} juegos en {annoSel || 'la temporada'}</div>}
            </div>
            {tieneStats ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: T.accion, margin: '0 2px 10px' }}>Promedios {annoSel || 'de la temporada'}</div>
                <div style={{ display: 'flex', gap: 9, marginBottom: 10 }}>
                  {[['Puntos', sea.points], ['Rebotes', sea.rebounds], ['Asistencias', sea.assists]].map(([lbl, val]) => (
                    <div key={lbl} style={{ flex: 1, background: `linear-gradient(160deg, ${hexA(T.accion2, 0.16)}, ${hexA(T.accion, 0.08)})`, border: `1px solid ${T.borde}`, borderRadius: 14, padding: '15px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 27, fontWeight: 900, color: T.texto, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{f1(val)}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.tenue, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 7 }}>{lbl}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {grid.map(([lbl, val]) => <Caja key={lbl} lbl={lbl} val={val} />)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {pcts.map(([lbl, val]) => <Caja key={lbl} lbl={lbl} val={val} />)}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: T.tenue, fontSize: 13.5, lineHeight: 1.5 }}>Sin estadísticas registradas en {annoSel || 'esta temporada'}.</div>
            )}
            {filas.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: T.accion, margin: '18px 2px 10px' }}>Entre los líderes de la liga</div>
                <div style={{ background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 16, overflow: 'hidden' }}>
                  {filas.map((fr, i) => (
                    <div key={fr.cat} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < filas.length - 1 ? `1px solid ${T.linea}` : 'none' }}>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: T.texto }}>{fr.cat}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: T.accion, padding: '2px 9px', borderRadius: 12 }}>{`#${fr.rank}`}</span>
                      <span style={{ width: 64, textAlign: 'right', fontSize: 16, fontWeight: 900, color: T.texto, fontVariantNumeric: 'tabular-nums' }}>{fr.average != null ? Number(fr.average).toFixed(1) : (fr.total ?? '-')}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {hist.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: T.accion, margin: '18px 2px 10px' }}>Trayectoria por temporada</div>
                <div style={{ background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: `1px solid ${T.linea}`, fontSize: 10, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: T.tenue }}>
                    <span style={{ width: 46 }}>Año</span>
                    <span style={{ flex: 1 }}>Equipo</span>
                    <span style={{ width: 34, textAlign: 'center' }}>PTS</span>
                    <span style={{ width: 34, textAlign: 'center' }}>REB</span>
                    <span style={{ width: 34, textAlign: 'center' }}>AST</span>
                    <span style={{ width: 38, textAlign: 'center' }}>RAT</span>
                  </div>
                  {hist.map((h, i) => {
                    const he = equipos[h.equipo_id]
                    const on = h.temporada_id === temporadaSel
                    return (
                      <div key={h.temporada_id} onClick={() => setTemporadaSel(h.temporada_id)} style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', borderBottom: i < hist.length - 1 ? `1px solid ${T.linea}` : 'none', cursor: 'pointer', background: on ? hexA(T.accion2, 0.1) : 'transparent' }}>
                        <span style={{ width: 46, fontSize: 13.5, fontWeight: 900, color: on ? T.accion2 : T.texto, fontVariantNumeric: 'tabular-nums' }}>{h.year}</span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: T.texto2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{he?.name || '—'}</span>
                        <span style={{ width: 34, textAlign: 'center', fontSize: 13, fontWeight: 800, color: T.texto, fontVariantNumeric: 'tabular-nums' }}>{f1(h.points)}</span>
                        <span style={{ width: 34, textAlign: 'center', fontSize: 13, color: T.texto2, fontVariantNumeric: 'tabular-nums' }}>{f1(h.rebounds)}</span>
                        <span style={{ width: 34, textAlign: 'center', fontSize: 13, color: T.texto2, fontVariantNumeric: 'tabular-nums' }}>{f1(h.assists)}</span>
                        <span style={{ width: 38, textAlign: 'center', fontSize: 13.5, fontWeight: 900, color: '#E8B23A', fontVariantNumeric: 'tabular-nums' }}>{ratingEnAnno(h, h.year)}</span>
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: 10.5, color: T.tenue, textAlign: 'center' }}>Toca una temporada para verla en toda la pantalla</div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ----- noticia (lee lo que tenemos + enlace a la nota completa en lnb.do) -----
  const slug = (s) => (String(s || 'noticia').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'noticia')
  const NoticiaModal = ({ n, cerrar }) => {
    if (!n) return null
    const u = urlImg(n.image_url)
    const url = `https://lnb.do/blog/${slug(n.title)}/${n.id}`
    return (
      <div onClick={cerrar} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60, background: 'rgba(0,0,0,0.62)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: T.fondo, borderTopLeftRadius: 22, borderTopRightRadius: 22, border: `1px solid ${T.borde}`, maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', height: 3 }}>
            <span style={{ flex: 1, background: '#1B3A8C' }} />
            <span style={{ flex: 1, background: '#ffffff' }} />
            <span style={{ flex: 1, background: '#CE1126' }} />
          </div>
          {u && (
            <div style={{ position: 'relative' }}>
              <img src={u} alt="" style={{ width: '100%', height: 210, objectFit: 'cover', display: 'block' }} onError={(e) => { const p = e.currentTarget.parentElement; if (p) p.style.display = 'none' }} />
              <span onClick={cerrar} style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer' }}>×</span>
            </div>
          )}
          <div style={{ padding: '16px 18px calc(env(safe-area-inset-bottom) + 22px)' }}>
            {!u && <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}><span onClick={cerrar} style={{ fontSize: 24, color: T.tenue, cursor: 'pointer', padding: '0 4px' }}>×</span></div>}
            <div style={{ fontSize: 11, color: T.tenue, marginBottom: 8 }}>{soloDia(n.created_at)}</div>
            <div style={{ fontSize: 21, fontWeight: 900, color: T.texto, lineHeight: 1.25, marginBottom: 12 }}>{n.title}</div>
            {n.excerpt && <div style={{ fontSize: 14.5, color: T.texto2, lineHeight: 1.7 }}>{n.excerpt}</div>}
            <button onClick={() => { try { window.open(url, '_blank') } catch (e) {} }} style={{ marginTop: 18, width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: T.accion, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Leer la noticia completa en lnb.do</button>
          </div>
        </div>
      </div>
    )
  }

  // ===== plantilla: fijo, 100dvh, columna =====
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', minHeight: '-webkit-fill-available', fontFamily: f, color: T.texto2, background: T.fondo, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* fondo: base + dos glows */}
      <div style={{ position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, zIndex: 0, background: T.fondo, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, zIndex: 0, background: `radial-gradient(ellipse 70% 50% at 12% 0%, ${T.glow1}, transparent 60%), radial-gradient(ellipse 60% 42% at 100% 8%, ${T.glow2}, transparent 55%)`, pointerEvents: 'none' }} />

      {/* header fijo */}
      <div style={{ position: 'relative', zIndex: 30, flexShrink: 0, background: T.headerBg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.borde}`, paddingTop: esEscritorio ? 0 : 'env(safe-area-inset-top)' }}>
        <div style={{ maxWidth: esEscritorio ? 980 : 820, margin: '0 auto', padding: esEscritorio ? '16px 30px 0' : '10px 14px 0' }}>
          {/* fila superior: izquierda (volver + año) · centro (LNB) · derecha (buscar + perfil) */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span onClick={() => onVolver && onVolver()} style={{ fontSize: esEscritorio ? 30 : 27, lineHeight: 1, color: T.texto, cursor: 'pointer', flexShrink: 0 }}>‹</span>
              {temporada && <span style={{ fontSize: esEscritorio ? 13 : 12, fontWeight: 800, color: T.texto, background: T.chip, border: `1px solid ${T.borde}`, padding: '4px 11px', borderRadius: 20, fontVariantNumeric: 'tabular-nums' }}>{temporada.year}</span>}
            </div>
            <div
              onContextMenu={(e) => { e.preventDefault(); cambiarTema() }}
              onTouchStart={() => { pressRef.current = setTimeout(cambiarTema, 550) }}
              onTouchEnd={() => clearTimeout(pressRef.current)}
              onTouchMove={() => clearTimeout(pressRef.current)}
              style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontFamily: fDisp, fontSize: esEscritorio ? 38 : 30, fontWeight: 900, letterSpacing: 1.5, lineHeight: 1, display: 'inline-flex', cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <span style={{ color: coloresLNB[0] }}>L</span>
              <span style={{ color: coloresLNB[1] }}>N</span>
              <span style={{ color: coloresLNB[2] }}>B</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <span onClick={() => onAccion && onAccion('buscar')} style={{ display: 'inline-flex', cursor: 'pointer', padding: 2 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.texto} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
              </span>
              <div onClick={() => onAccion && onAccion('perfil')} style={{ width: 36, height: 36, borderRadius: '50%', background: T.panel, border: `1.5px solid ${T.borde}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill={T.tenue}><path d="M12 12a4.2 4.2 0 100-8.4 4.2 4.2 0 000 8.4zm0 2.1c-4.2 0-7.6 2.2-7.6 5v1.3h15.2v-1.3c0-2.8-3.4-5-7.6-5z" /></svg>
              </div>
            </div>
          </div>
          <div style={{ fontSize: esEscritorio ? 12 : 10.5, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.esClaro ? T.texto : '#ffffff', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Liga Nacional de Baloncesto</div>
          <div style={{ display: 'flex', gap: esEscritorio ? 10 : 4, marginTop: esEscritorio ? 14 : 12, overflowX: 'auto' }}>
            {TABS.map((t) => {
              const on = tab === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ position: 'relative', padding: esEscritorio ? '12px 18px' : '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: esEscritorio ? 15 : 13.5, fontWeight: 800, letterSpacing: 0.3, color: on ? T.texto : T.tenue, whiteSpace: 'nowrap' }}>
                  {t.txt}
                  <span style={{ position: 'absolute', left: esEscritorio ? 18 : 14, right: esEscritorio ? 18 : 14, bottom: 0, height: 3, borderRadius: 3, background: on ? T.accion : 'transparent' }} />
                </button>
              )
            })}
          </div>
        </div>
        {/* franja tricolor dominicana: identidad de la liga (fija en todos los temas) */}
        <div style={{ display: 'flex', height: 3 }}>
          <span style={{ flex: 1, background: '#1B3A8C' }} />
          <span style={{ flex: 1, background: '#ffffff' }} />
          <span style={{ flex: 1, background: '#CE1126' }} />
        </div>
      </div>

      {/* área que hace scroll */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: esEscritorio ? 980 : 820, margin: '0 auto', padding: esEscritorio ? '24px 30px 60px' : '18px 15px calc(env(safe-area-inset-bottom) + 44px)' }}>
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '70px 20px', color: T.tenue, fontSize: 13, fontWeight: 600 }}>Cargando la LNB…</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: T.tenue }}>
              <div style={{ fontSize: 14, marginBottom: 8, color: T.texto }}>No se pudieron cargar los datos.</div>
              <div style={{ fontSize: 12 }}>{error}</div>
            </div>
          ) : (
            <>
              {tab !== 'noticias' && temporadas.length > 0 && (
                <div style={{ position: 'sticky', top: 0, zIndex: 5, margin: esEscritorio ? '-24px -30px 18px' : '-18px -15px 16px', padding: esEscritorio ? '13px 30px' : '11px 15px', background: hexA(T.fondo, 0.92), backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderBottom: `1px solid ${T.linea}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: esEscritorio ? 980 : 820, margin: '0 auto' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: T.tenue, flexShrink: 0 }}>Temporada</span>
                    <div style={{ display: 'flex', gap: 7, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
                      {temporadas.map((t) => {
                        const on = t.id === temporadaSel
                        const actual = temporada && t.id === temporada.id
                        return (
                          <button key={t.id} onClick={() => setTemporadaSel(t.id)} style={{ position: 'relative', flexShrink: 0, padding: '7px 15px', borderRadius: 20, fontSize: 13.5, fontWeight: 900, cursor: 'pointer', fontVariantNumeric: 'tabular-nums', border: `1px solid ${on ? 'transparent' : T.borde}`, background: on ? `linear-gradient(135deg, ${T.accion2}, ${T.accion})` : T.chip, color: on ? '#fff' : T.texto2, boxShadow: on ? '0 3px 10px rgba(0,0,0,0.18)' : 'none' }}>
                            {t.year}
                            {actual && <span style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%', background: '#34c77b', border: `1.5px solid ${T.fondo}` }} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
              {tab === 'juegos' && <VistaJuegos />}
              {tab === 'tabla' && <VistaTabla />}
              {tab === 'equipos' && <VistaEquipos />}
              {tab === 'lideres' && <VistaLideres />}
              {tab === 'noticias' && <VistaNoticias />}
              <div style={{ textAlign: 'center', fontSize: 10, color: T.tenue, marginTop: 24, letterSpacing: 0.3 }}>Datos oficiales de la Liga Nacional de Baloncesto · se actualizan solos</div>
            </>
          )}
        </div>
      </div>

      {juegoSel && <DetalleJuego j={juegoSel} cerrar={() => setJuegoSel(null)} />}
      {equipoSel && <DetalleEquipo id={equipoSel} cerrar={() => setEquipoSel(null)} />}
      {jugadorSel && <PerfilJugador p={jugadorSel} cerrar={() => setJugadorSel(null)} />}
      {noticiaSel && <NoticiaModal n={noticiaSel} cerrar={() => setNoticiaSel(null)} />}
      {compartiendo && (
        <div onClick={() => setCompartiendo(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 150, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: T.fondo, borderTopLeftRadius: 22, borderTopRightRadius: 22, border: `1px solid ${T.borde}`, padding: '8px 16px calc(env(safe-area-inset-bottom) + 18px)' }}>
            <div style={{ width: 38, height: 4, borderRadius: 3, background: T.borde, margin: '8px auto 14px' }} />
            <div style={{ fontSize: 13, fontWeight: 800, color: T.texto, textAlign: 'center', marginBottom: 14 }}>Compartir resultado</div>
            {[
              { t: 'Al chat', d: 'Mándalo a una conversación', fn: () => compartirAlChatAbrir(compartiendo), ic: <><circle cx="12" cy="12" r="0" /><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" /></> },
              { t: 'Al techado', d: 'Publícalo en tu muro (24 h)', fn: () => compartirAlTechado(compartiendo), ic: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></> },
              { t: 'Compartir afuera', d: 'Otras apps de tu teléfono', fn: () => compartirAfuera(compartiendo), ic: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></> },
            ].map((o) => (
              <button key={o.t} onClick={o.fn} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '13px 14px', marginBottom: 9, background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 14, cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: hexA(T.accion, 0.14), color: T.accion, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{o.ic}</svg>
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: T.texto }}>{o.t}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: T.tenue, marginTop: 1 }}>{o.d}</span>
                </span>
                <span style={{ fontSize: 18, color: T.tenue }}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {compartirChat && (
        <CompartirAlChat
          datos={compartirChat}
          tema={{ acento: T.accion, boton: `linear-gradient(135deg, ${T.accion2}, ${T.accion})` }}
          onCerrar={() => setCompartirChat(null)}
          onEnviado={() => { setCompartirChat(null); setAviso('Enviado al chat ✓'); setTimeout(() => setAviso(''), 2200) }}
        />
      )}
      {aviso && (
        <div style={{ position: 'fixed', left: '50%', bottom: 'calc(env(safe-area-inset-bottom) + 28px)', transform: 'translateX(-50%)', zIndex: 200, background: T.texto, color: T.fondo, fontSize: 13, fontWeight: 700, padding: '10px 18px', borderRadius: 22, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>{aviso}</div>
      )}
    </div>
  )
}