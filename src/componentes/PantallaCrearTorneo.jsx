import { useState, useEffect, useRef } from 'react'
import { aviso } from './Avisos'
import { Capacitor } from '@capacitor/core'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'
import { crearTorneo, crearEquipo, agregarJugador, buscarPersonas } from '../torneos'
import { subirFotoTorneo } from '../fotos'
import RecortadorFoto from './RecortadorFoto'
import { MUNICIPIOS_RD } from '../data/municipiosRD'
import { ESTADOS_USA } from '../data/estadosUSA'

const TEMAS = {
  dorado: { esClaro: false, acento: '#e8b65a', fondo: '#08090c', panel: 'rgba(18,20,25,.92)', tarjeta: 'rgba(20,22,26,.72)', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', muyTenue: '#6b7682', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', botonTexto: '#1a1205', glow: 'rgba(190,135,55,0.2)', borde: 'rgba(232,182,79,.2)', bordeSuave: 'rgba(255,255,255,.08)', input: 'rgba(255,255,255,.05)' },
  azul: { esClaro: false, acento: '#6fb0ec', fondo: '#08090c', panel: 'rgba(18,20,25,.92)', tarjeta: 'rgba(20,22,26,.72)', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', muyTenue: '#6b7682', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', botonTexto: '#08151f', glow: 'rgba(55,120,190,0.22)', borde: 'rgba(111,176,236,.22)', bordeSuave: 'rgba(255,255,255,.08)', input: 'rgba(255,255,255,.05)' },
  claro: { esClaro: true, acento: '#b07a26', fondo: '#ece4d4', panel: 'rgba(250,246,238,.96)', tarjeta: '#fff', textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#8a7c64', muyTenue: '#a89a82', boton: 'linear-gradient(150deg, #e7c069, #b07a26)', botonTexto: '#2a1d06', glow: 'rgba(176,122,38,0.16)', borde: 'rgba(176,122,38,.22)', bordeSuave: '#e0e3e8', input: '#f5f6f8' },
  larimar: { esClaro: true, acento: '#2a8fb8', fondo: '#dcebec', panel: 'rgba(238,247,248,.96)', tarjeta: '#fff', textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375', muyTenue: '#8aa0a2', boton: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', botonTexto: '#04121f', glow: 'rgba(42,143,184,0.18)', borde: 'rgba(42,143,184,.22)', bordeSuave: '#cfe0e2', input: '#eef5f6' },
}

const EMOJIS_TORNEO = ['🏆', '🥇', '🏀', '🔥', '⭐', '👑', '⚡', '🎯', '🏅', '💪']

const FORMATOS = [
  { id: 'copa', emoji: '🏆', nombre: 'Copa (eliminación)', desc: 'Llaves directas, gana o quedas fuera' },
  { id: 'liga', emoji: '🔄', nombre: 'Liga (todos contra todos)', desc: 'Tabla de posiciones por jornadas' },
  { id: 'mixto', emoji: '⚡', nombre: 'Mixto (grupos + llaves)', desc: 'Fase de grupos y luego eliminación' },
]

const ESTADISTICAS = [
  { id: 'pts', emoji: '🏀', nombre: 'Puntos' },
  { id: 'reb', emoji: '💪', nombre: 'Rebotes' },
  { id: 'ast', emoji: '🤝', nombre: 'Asistencias' },
  { id: 'rob', emoji: '✋', nombre: 'Robos' },
  { id: 'tap', emoji: '🚫', nombre: 'Tapones' },
  { id: 'tri', emoji: '🎯', nombre: 'Triples' },
  { id: 'per', emoji: '🔁', nombre: 'Pérdidas' },
  { id: 'pct_tc', emoji: '📈', nombre: '% Tiros de campo' },
  { id: 'pct_tp', emoji: '🏹', nombre: '% Triples' },
  { id: 'pct_tl', emoji: '💯', nombre: '% Tiros libres' },
  { id: 'ef', emoji: '⚡', nombre: 'Eficiencia' },
]

const NIVELES = [
  { id: 'interbarrial', nombre: 'Interbarrial', desc: 'Entre barrios' },
  { id: 'intermedio', nombre: 'Intermedio', desc: 'Nivel medio' },
  { id: 'superior', nombre: 'Superior', desc: 'El más alto' },
  { id: 'empresarial', nombre: 'Empresarial', desc: 'Entre empresas / interbancario' },
  { id: 'libre', nombre: 'Libre', desc: 'Abierto, sin restricción' },
]
const CATEGORIAS = [
  { id: 'mini', nombre: 'Mini' },
  { id: 'u15', nombre: 'U15' },
  { id: 'u17', nombre: 'U17' },
  { id: 'u21', nombre: 'U21' },
  { id: 'superior', nombre: 'Superior' },
]
const RAMAS = [
  { id: 'masculino', nombre: 'Masculino' },
  { id: 'femenino', nombre: 'Femenino' },
]
const COLORES_EQUIPO = ['#c8842e', '#3a6ea5', '#9e3a3a', '#3a9e6e', '#7a5cc4', '#d4537e', '#2fa3a3', '#e0922e', '#5a6b7a', '#c43a5c', '#4a8f3a', '#b05a9e']

// Catálogo de divisiones por país (igual que el registro): RD = provincias/municipios, USA = estados/ciudades
const PAISES = {
  rd: { nombre: 'República Dominicana', datos: MUNICIPIOS_RD, etiquetaRegion: 'Provincia', etiquetaCiudad: 'Municipio' },
  usa: { nombre: 'Estados Unidos', datos: ESTADOS_USA, etiquetaRegion: 'Estado', etiquetaCiudad: 'Ciudad' },
}
function regionesDe(paisLlave) {
  const pais = PAISES[paisLlave]
  if (!pais) return []
  return Object.keys(pais.datos)
    .map((k) => ({ llave: k, nombre: pais.datos[k].provincia }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
}
function ciudadesDe(paisLlave, llaveRegion) {
  const pais = PAISES[paisLlave]
  if (!pais || !llaveRegion || !pais.datos[llaveRegion]) return []
  return [...pais.datos[llaveRegion].municipios].sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export default function PantallaCrearTorneo({ onVolver, onCreado }) {
  const [tema] = useState(() => {
    const validos = ['dorado', 'azul', 'claro', 'larimar']
    if (typeof window !== 'undefined') {
      const g = localStorage.getItem('mc_tema')
      return validos.includes(g) ? g : 'dorado'
    }
    return 'dorado'
  })
  const T = TEMAS[tema] || TEMAS.dorado
  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

  const [paso, setPaso] = useState(1)
  const TOTAL_PASOS = 6

  // Datos del torneo
  const [nombre, setNombre] = useState('')
  const [emoji, setEmoji] = useState('🏆')
  const [logoUrl, setLogoUrl] = useState(null)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [fotoARecortar, setFotoARecortar] = useState(null)
  const inputLogoRef = useRef(null)
  const [pais, setPais] = useState('rd')
  const [provincia, setProvincia] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [paraje, setParaje] = useState('')
  const [nivel, setNivel] = useState('libre')
  const [categoria, setCategoria] = useState('superior')
  const [rama, setRama] = useState('masculino')
  const [formato, setFormato] = useState('copa')
  const [cantEquipos, setCantEquipos] = useState(8)
  const [stats, setStats] = useState({ pts: true, reb: true, ast: true, rob: true, tap: true, tri: false, per: false, pct_tc: false, pct_tp: false, pct_tl: false, ef: false })
  const [guardando, setGuardando] = useState(false)

  // Paso 5: equipos (se guardan en memoria y se crean todos al finalizar)
  const [equipos, setEquipos] = useState([])
  const [nuevoEquipo, setNuevoEquipo] = useState('')
  const [colorEquipo, setColorEquipo] = useState(COLORES_EQUIPO[0])

  // Plantilla (jugadores por equipo) — modal de roster
  const [equipoEditando, setEquipoEditando] = useState(null) // índice del equipo cuyo roster está abierto
  const [jNombre, setJNombre] = useState('')
  const [jNumero, setJNumero] = useState('')
  const [jPosicion, setJPosicion] = useState('')
  const [jVinculo, setJVinculo] = useState(null) // cuenta de Media Cancha vinculada {id, nombre, ...}
  const [mostrarBuscar, setMostrarBuscar] = useState(false)
  const [jBuscar, setJBuscar] = useState('')
  const [jResultados, setJResultados] = useState([])

  // Teclado (candado)
  const esNativo = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform?.()
  const [kbAlto, setKbAlto] = useState(0)
  const ajusteTeclado = 30

  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'; document.body.style.right = '0'; document.body.style.width = '100%'
    return () => {
      document.body.style.position = ''; document.body.style.top = ''
      document.body.style.left = ''; document.body.style.right = ''; document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  useEffect(() => {
    if (!esNativo) return
    let lShow, lHide
    Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {})
    Keyboard.addListener('keyboardWillShow', (i) => setKbAlto(i?.keyboardHeight || 0)).then((s) => { lShow = s }).catch(() => {})
    Keyboard.addListener('keyboardWillHide', () => setKbAlto(0)).then((s) => { lHide = s }).catch(() => {})
    return () => {
      lShow?.remove?.(); lHide?.remove?.(); setKbAlto(0)
      Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {})
    }
  }, [esNativo])

  // Buscar cuentas de Media Cancha para vincular (por nombre o código único)
  useEffect(() => {
    if (!mostrarBuscar) return
    const t = jBuscar.trim()
    if (t.length < 2) { setJResultados([]); return }
    let activo = true
    const timer = setTimeout(async () => {
      try {
        const { personas } = await buscarPersonas(t)
        if (activo) setJResultados(personas || [])
      } catch (e) { if (activo) setJResultados([]) }
    }, 320)
    return () => { activo = false; clearTimeout(timer) }
  }, [jBuscar, mostrarBuscar])

  // ----- ubicación (derivados del país/provincia/municipio/paraje) -----
  const paisActual = PAISES[pais] || PAISES.rd
  const regionLista = regionesDe(pais)
  const muniLista = ciudadesDe(pais, provincia)
  const nombreProvincia = paisActual.datos[provincia]?.provincia || ''
  const optionBg = T.esClaro ? '#ffffff' : '#15171c'
  const lugar = [paraje.trim(), municipio, nombreProvincia].filter(Boolean).join(', ')

  const toggleStat = (id) => {
    if (id === 'pts') return // puntos siempre activo
    setStats((s) => ({ ...s, [id]: !s[id] }))
  }

  const puedeAvanzar = () => {
    if (paso === 1) return nombre.trim().length >= 3
    return true
  }

  const avanzar = () => { if (paso < TOTAL_PASOS) setPaso(paso + 1) }
  const retroceder = () => { if (paso > 1) setPaso(paso - 1); else onVolver && onVolver() }

  // ----- equipos (paso 5) -----
  const codigoEquipo = (n) => (n || '').replace(/[^a-zA-ZáéíóúñÑ0-9]/g, '').slice(0, 3).toUpperCase() || 'EQ'
  const agregarEquipoLocal = () => {
    const n = nuevoEquipo.trim()
    if (n.length < 2) return
    setEquipos([...equipos, { nombre: n, codigo: codigoEquipo(n), color: colorEquipo, jugadores: [] }])
    setNuevoEquipo('')
    const idx = COLORES_EQUIPO.indexOf(colorEquipo)
    setColorEquipo(COLORES_EQUIPO[(idx + 1) % COLORES_EQUIPO.length]) // rota al siguiente color
  }
  const quitarEquipo = (i) => setEquipos(equipos.filter((_, k) => k !== i))

  // ----- plantilla / jugadores -----
  const POSICIONES = ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot']
  const limpiarFormJugador = () => { setJNombre(''); setJNumero(''); setJPosicion(''); setJVinculo(null); setJBuscar(''); setJResultados([]); setMostrarBuscar(false) }
  const abrirRoster = (idx) => { setEquipoEditando(idx); limpiarFormJugador() }
  const cerrarRoster = () => { setEquipoEditando(null); limpiarFormJugador() }
  const seleccionarVinculo = (p) => {
    setJVinculo(p); setJBuscar(''); setJResultados([]); setMostrarBuscar(false)
    if (!jNombre.trim()) setJNombre(`${p.nombre || ''} ${p.apellido || ''}`.trim())
  }
  const agregarJugadorLocal = () => {
    const n = jNombre.trim()
    if (n.length < 2 || equipoEditando == null) return
    const nuevo = { nombre: n, numero: jNumero.trim() || null, posicion: jPosicion || null, perfilId: jVinculo?.id || null, perfilNombre: jVinculo ? `${jVinculo.nombre || ''} ${jVinculo.apellido || ''}`.trim() : null }
    setEquipos((prev) => prev.map((eq, i) => i === equipoEditando ? { ...eq, jugadores: [...(eq.jugadores || []), nuevo] } : eq))
    limpiarFormJugador()
  }
  const quitarJugadorLocal = (jIdx) => {
    setEquipos((prev) => prev.map((eq, i) => i === equipoEditando ? { ...eq, jugadores: (eq.jugadores || []).filter((_, k) => k !== jIdx) } : eq))
  }

  const alElegirLogo = (e) => {
    const archivo = e.target.files && e.target.files[0]
    if (inputLogoRef.current) inputLogoRef.current.value = ''
    if (!archivo) return
    setFotoARecortar(archivo)  // abre el recortador
  }

  // El recortador devuelve el recorte ya listo (blob). Eso se sube.
  const alRecortar = async (blob) => {
    setFotoARecortar(null)
    setSubiendoLogo(true)
    try {
      const { url, error } = await subirFotoTorneo(blob)
      if (error || !url) aviso('No se pudo subir el logo: ' + (error || 'intenta de nuevo'))
      else setLogoUrl(url)
    } catch (err) {
      aviso('Error: ' + (err.message || err))
    }
    setSubiendoLogo(false)
  }

  const finalizar = async () => {
    if (guardando) return
    setGuardando(true)
    try {
      const { torneo, error } = await crearTorneo({
        nombre: nombre.trim(), emoji, logo_url: logoUrl, lugar: lugar.trim() || null,
        nivel, categoria, rama,
        formato, cantidad_equipos: equipos.length || cantEquipos, estadisticas: stats,
      })
      if (error) {
        aviso('No se pudo crear: ' + error)
        setGuardando(false)
        return
      }
      // crear los equipos agregados (uno por uno), con su plantilla
      for (const eq of equipos) {
        try {
          const { equipo } = await crearEquipo(torneo.id, { nombre: eq.nombre, codigo: eq.codigo, color: eq.color })
          if (equipo && (eq.jugadores || []).length) {
            for (const jug of eq.jugadores) {
              try { await agregarJugador(torneo.id, equipo.id, { nombre: jug.nombre, numero: jug.numero, posicion: jug.posicion, perfil_id: jug.perfilId, estado: 'confirmado' }) }
              catch (e) { /* si un jugador falla, seguimos con los demás */ }
            }
          }
        } catch (e) { /* si un equipo falla, seguimos con los demás */ }
      }
      onCreado && onCreado(torneo)
    } catch (e) {
      aviso('Error: ' + (e.message || e))
    }
    setGuardando(false)
  }

  const alturaRaiz = kbAlto > 0 ? `calc(100dvh - ${Math.max(0, kbAlto - ajusteTeclado)}px)` : '100dvh'

  const inputStyle = { width: '100%', boxSizing: 'border-box', background: T.input, border: `1px solid ${T.bordeSuave}`, borderRadius: 12, padding: '13px 14px', color: T.textoFuerte, fontSize: 15, outline: 'none', fontFamily: 'inherit' }
  const label = { color: T.tenue, fontSize: 12.5, fontWeight: 700, marginBottom: 8, display: 'block' }

  const Contenido = () => {
    // PASO 1: IDENTIDAD
    if (paso === 1) {
      return (
        <>
          <div style={{ color: T.textoFuerte, fontSize: 20, fontWeight: 800, marginBottom: 6 }}>¿Cómo se llama tu torneo?</div>
          <div style={{ color: T.tenue, fontSize: 13, marginBottom: 22, lineHeight: 1.5 }}>Dale un nombre que la gente reconozca.</div>

          <label style={label}>Nombre del torneo</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Copa Jícome 2026" style={{ ...inputStyle, marginBottom: 20 }} />

          <label style={label}>Logo oficial del torneo</label>
          {logoUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ width: 150, height: 150, borderRadius: 20, background: `url(${logoUrl}) center/cover`, border: `2px solid ${T.acento}`, boxShadow: `0 8px 24px rgba(0,0,0,.3)`, opacity: subiendoLogo ? 0.5 : 1 }} />
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button onClick={() => inputLogoRef.current && inputLogoRef.current.click()} style={{ border: `1px solid ${T.borde}`, borderRadius: 11, padding: '9px 18px', background: 'transparent', color: T.acento, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cambiar logo</button>
                <button onClick={() => setLogoUrl(null)} style={{ border: 'none', borderRadius: 11, padding: '9px 14px', background: 'transparent', color: T.muyTenue, fontSize: 13, cursor: 'pointer' }}>Quitar</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
              <div onClick={() => inputLogoRef.current && inputLogoRef.current.click()} style={{ width: 72, height: 72, borderRadius: 16, flexShrink: 0, cursor: 'pointer', background: T.input, border: `1.5px dashed ${T.borde}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: T.tenue, opacity: subiendoLogo ? 0.5 : 1 }}>
                {subiendoLogo ? '…' : '📷'}
              </div>
              <div style={{ flex: 1 }}>
                <button onClick={() => inputLogoRef.current && inputLogoRef.current.click()} style={{ border: `1px solid ${T.borde}`, borderRadius: 11, padding: '10px 16px', background: 'transparent', color: T.acento, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Subir logo</button>
                <div style={{ color: T.muyTenue, fontSize: 11.5, marginTop: 6 }}>Sube tu logo o elige un emoji abajo.</div>
              </div>
            </div>
          )}
          <input ref={inputLogoRef} type="file" accept="image/*" onChange={alElegirLogo} style={{ display: 'none' }} />

          <label style={label}>{logoUrl ? 'O usa un emoji' : 'Elige un emoji'}</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, opacity: logoUrl ? 0.5 : 1 }}>
            {EMOJIS_TORNEO.map((e) => (
              <button key={e} onClick={() => { setEmoji(e); setLogoUrl(null) }} style={{ width: 46, height: 46, borderRadius: 12, border: (emoji === e && !logoUrl) ? `2px solid ${T.acento}` : `1px solid ${T.bordeSuave}`, background: (emoji === e && !logoUrl) ? `${T.acento}18` : T.input, fontSize: 22, cursor: 'pointer' }}>{e}</button>
            ))}
          </div>

          <label style={label}>Ubicación del torneo (opcional)</label>
          <select value={pais} onChange={(e) => { setPais(e.target.value); setProvincia(''); setMunicipio('') }} style={{ ...inputStyle, marginBottom: 10 }}>
            <option value="rd" style={{ background: optionBg }}>🇩🇴 República Dominicana</option>
            <option value="usa" style={{ background: optionBg }}>🇺🇸 Estados Unidos</option>
          </select>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <select value={provincia} onChange={(e) => { setProvincia(e.target.value); setMunicipio('') }} style={{ ...inputStyle, flex: 1, minWidth: 0 }}>
              <option value="" style={{ background: optionBg }}>{paisActual.etiquetaRegion}…</option>
              {regionLista.map((r) => (
                <option key={r.llave} value={r.llave} style={{ background: optionBg }}>{r.nombre}</option>
              ))}
            </select>
            <select value={municipio} onChange={(e) => setMunicipio(e.target.value)} disabled={!provincia} style={{ ...inputStyle, flex: 1, minWidth: 0, opacity: provincia ? 1 : 0.5 }}>
              <option value="" style={{ background: optionBg }}>{provincia ? `${paisActual.etiquetaCiudad}…` : `Elige ${paisActual.etiquetaRegion.toLowerCase()}`}</option>
              {muniLista.map((m) => (
                <option key={m.nombre} value={m.nombre} style={{ background: optionBg }}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <input value={paraje} onChange={(e) => setParaje(e.target.value)} placeholder={pais === 'rd' ? 'Paraje, sector o distrito (opcional)' : 'Neighborhood or area (optional)'} style={inputStyle} />
          {lugar && <div style={{ color: T.acento, fontSize: 12, fontWeight: 600, marginTop: 9 }}>📍 {lugar}</div>}
        </>
      )
    }

    // PASO 2: FORMATO
    if (paso === 2) {
      return (
        <>
          <div style={{ color: T.textoFuerte, fontSize: 20, fontWeight: 800, marginBottom: 6 }}>¿Qué tipo de torneo?</div>
          <div style={{ color: T.tenue, fontSize: 13, marginBottom: 22, lineHeight: 1.5 }}>Elige el formato de competición.</div>

          {FORMATOS.map((f) => {
            const activa = formato === f.id
            return (
              <button key={f.id} onClick={() => setFormato(f.id)} style={{ width: '100%', textAlign: 'left', border: activa ? `2px solid ${T.acento}` : `1px solid ${T.bordeSuave}`, background: activa ? `${T.acento}12` : T.tarjeta, borderRadius: 14, padding: 14, marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 26 }}>{f.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: T.textoFuerte, fontSize: 15, fontWeight: 700 }}>{f.nombre}</div>
                  <div style={{ color: T.muyTenue, fontSize: 12, marginTop: 2 }}>{f.desc}</div>
                </div>
                {activa && <span style={{ width: 22, height: 22, borderRadius: '50%', background: T.boton, color: T.botonTexto, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</span>}
              </button>
            )
          })}

          <label style={{ ...label, marginTop: 16 }}>Cantidad de equipos</label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.input, border: `1px solid ${T.bordeSuave}`, borderRadius: 14, padding: '10px 18px' }}>
            <button onClick={() => setCantEquipos(Math.max(2, cantEquipos - 1))} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: T.esClaro ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)', color: T.acento, fontSize: 22, cursor: 'pointer' }}>−</button>
            <span style={{ color: T.textoFuerte, fontSize: 26, fontWeight: 800 }}>{cantEquipos}</span>
            <button onClick={() => setCantEquipos(Math.min(64, cantEquipos + 1))} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: T.esClaro ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)', color: T.acento, fontSize: 22, cursor: 'pointer' }}>+</button>
          </div>
        </>
      )
    }

    // PASO 3: NIVEL, CATEGORÍA Y RAMA
    if (paso === 3) {
      return (
        <>
          <div style={{ color: T.textoFuerte, fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Nivel y categoría 🏀</div>
          <div style={{ color: T.tenue, fontSize: 13, marginBottom: 22, lineHeight: 1.5 }}>Define el nivel de competencia y para quién es el torneo.</div>

          <label style={label}>Nivel del torneo</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {NIVELES.map((n) => {
              const activa = nivel === n.id
              return (
                <button key={n.id} onClick={() => setNivel(n.id)} title={n.desc} style={{ border: activa ? `1.5px solid ${T.acento}` : `1px solid ${T.bordeSuave}`, background: activa ? `${T.acento}14` : T.input, color: activa ? T.acento : T.textoBody, fontSize: 13, fontWeight: activa ? 700 : 500, padding: '9px 15px', borderRadius: 20, cursor: 'pointer' }}>{n.nombre}</button>
              )
            })}
          </div>
          <div style={{ color: T.muyTenue, fontSize: 11.5, marginTop: -12, marginBottom: 22 }}>{NIVELES.find((n) => n.id === nivel)?.desc}</div>

          <label style={label}>Categoría</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
            {CATEGORIAS.map((c) => {
              const activa = categoria === c.id
              return (
                <button key={c.id} onClick={() => setCategoria(c.id)} style={{ border: activa ? `1.5px solid ${T.acento}` : `1px solid ${T.bordeSuave}`, background: activa ? `${T.acento}14` : T.input, color: activa ? T.acento : T.textoBody, fontSize: 13, fontWeight: activa ? 700 : 500, padding: '8px 16px', borderRadius: 20, cursor: 'pointer' }}>{c.nombre}</button>
              )
            })}
          </div>

          <label style={label}>Rama</label>
          <div style={{ display: 'flex', gap: 9 }}>
            {RAMAS.map((r) => {
              const activa = rama === r.id
              return (
                <button key={r.id} onClick={() => setRama(r.id)} style={{ flex: 1, border: activa ? `1.5px solid ${T.acento}` : `1px solid ${T.bordeSuave}`, background: activa ? `${T.acento}14` : T.input, color: activa ? T.acento : T.textoBody, fontSize: 14, fontWeight: activa ? 700 : 500, padding: 12, borderRadius: 12, cursor: 'pointer' }}>{r.nombre}</button>
              )
            })}
          </div>
        </>
      )
    }

    // PASO 4: ESTADÍSTICAS
    if (paso === 4) {
      return (
        <>
          <div style={{ color: T.textoFuerte, fontSize: 20, fontWeight: 800, marginBottom: 6 }}>¿Qué estadísticas se llevan?</div>
          <div style={{ color: T.tenue, fontSize: 13, marginBottom: 22, lineHeight: 1.5 }}>Solo estas aparecerán en los Líderes del torneo. Puntos siempre va.</div>

          {ESTADISTICAS.map((s) => {
            const activa = stats[s.id]
            const fija = s.id === 'pts'
            return (
              <button key={s.id} onClick={() => toggleStat(s.id)} disabled={fija} style={{ width: '100%', textAlign: 'left', border: activa ? `1.5px solid ${T.acento}` : `1px solid ${T.bordeSuave}`, background: activa ? `${T.acento}12` : T.tarjeta, borderRadius: 13, padding: '13px 14px', marginBottom: 9, cursor: fija ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 12, opacity: fija ? 0.85 : 1 }}>
                <span style={{ fontSize: 22 }}>{s.emoji}</span>
                <span style={{ flex: 1, color: T.textoFuerte, fontSize: 14.5, fontWeight: 600 }}>{s.nombre}{fija && <span style={{ color: T.muyTenue, fontSize: 11, fontWeight: 400 }}> (siempre)</span>}</span>
                <span style={{ width: 24, height: 24, borderRadius: 7, border: activa ? 'none' : `1.5px solid ${T.bordeSuave}`, background: activa ? T.boton : 'transparent', color: T.botonTexto, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{activa && '✓'}</span>
              </button>
            )
          })}
        </>
      )
    }

    // PASO 5: EQUIPOS
    if (paso === 5) {
      return (
        <>
          <div style={{ color: T.textoFuerte, fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Los equipos 🛡️</div>
          <div style={{ color: T.tenue, fontSize: 13, marginBottom: 22, lineHeight: 1.5 }}>Agrega los equipos que van a competir. Puedes agregar más después desde la gestión.</div>

          <label style={label}>Nombre del equipo</label>
          <input value={nuevoEquipo} onChange={(e) => setNuevoEquipo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') agregarEquipoLocal() }} placeholder="Ej: Tigres del Nordeste" style={{ ...inputStyle, marginBottom: 14 }} />

          <label style={label}>Color del equipo</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            {COLORES_EQUIPO.map((c) => (
              <button key={c} onClick={() => setColorEquipo(c)} style={{ width: 34, height: 34, borderRadius: '50%', background: c, border: colorEquipo === c ? `3px solid ${T.textoFuerte}` : `2px solid ${T.bordeSuave}`, cursor: 'pointer', flexShrink: 0 }} />
            ))}
          </div>

          <button onClick={agregarEquipoLocal} disabled={nuevoEquipo.trim().length < 2} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 13, background: nuevoEquipo.trim().length < 2 ? T.tarjeta : T.boton, color: nuevoEquipo.trim().length < 2 ? T.muyTenue : T.botonTexto, fontSize: 14.5, fontWeight: 800, cursor: nuevoEquipo.trim().length < 2 ? 'default' : 'pointer' }}>＋ Agregar equipo</button>

          {equipos.length > 0 ? (
            <div style={{ marginTop: 20 }}>
              <div style={{ color: T.tenue, fontSize: 12, fontWeight: 700, marginBottom: 11 }}>{equipos.length} equipo{equipos.length === 1 ? '' : 's'} agregado{equipos.length === 1 ? '' : 's'}</div>
              {equipos.map((eq, i) => {
                const nJug = (eq.jugadores || []).length
                return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', background: T.tarjeta, border: `1px solid ${T.bordeSuave}`, borderRadius: 12, marginBottom: 8 }}>
                  <span style={{ width: 36, height: 36, borderRadius: '50%', background: eq.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12.5, flexShrink: 0 }}>{eq.codigo}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.textoFuerte, fontSize: 14.5, fontWeight: 600 }}>{eq.nombre}</div>
                    <button onClick={() => abrirRoster(i)} style={{ border: 'none', background: 'transparent', color: T.acento, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '2px 0 0' }}>👥 {nJug === 0 ? 'Agregar jugadores' : `${nJug} jugador${nJug === 1 ? '' : 'es'}`} ›</button>
                  </div>
                  <button onClick={() => quitarEquipo(i)} style={{ border: 'none', background: 'transparent', color: T.muyTenue, fontSize: 19, cursor: 'pointer', padding: '0 4px' }}>✕</button>
                </div>
                )
              })}
            </div>
          ) : (
            <div style={{ marginTop: 18, color: T.muyTenue, fontSize: 12.5, textAlign: 'center', lineHeight: 1.5 }}>Agrega tus equipos aquí. Si prefieres, puedes crearlos después desde la gestión del torneo.</div>
          )}
        </>
      )
    }

    // PASO 6: REVISAR Y CREAR
    const statsActivas = ESTADISTICAS.filter((s) => stats[s.id]).map((s) => s.nombre).join(', ')
    const formatoNombre = FORMATOS.find((f) => f.id === formato)?.nombre || formato
    const nivelNombre = NIVELES.find((n) => n.id === nivel)?.nombre || nivel
    const catNombre = CATEGORIAS.find((c) => c.id === categoria)?.nombre || categoria
    const ramaNombre = RAMAS.find((r) => r.id === rama)?.nombre || rama
    return (
      <>
        <div style={{ color: T.textoFuerte, fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Revisa y crea 🏆</div>
        <div style={{ color: T.tenue, fontSize: 13, marginBottom: 22, lineHeight: 1.5 }}>Confirma que todo esté bien antes de crear el torneo.</div>

        <div style={{ background: T.tarjeta, border: `0.5px solid ${T.bordeSuave}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 16, paddingBottom: 16, borderBottom: `0.5px solid ${T.bordeSuave}` }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, background: logoUrl ? `url(${logoUrl}) center/cover` : T.boton, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{!logoUrl && emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: T.textoFuerte, fontSize: 17, fontWeight: 800 }}>{nombre || 'Sin nombre'}</div>
              {lugar && <div style={{ color: T.tenue, fontSize: 12.5, marginTop: 2 }}>📍 {lugar}</div>}
            </div>
          </div>
          {[
            { l: 'Nivel', v: nivelNombre },
            { l: 'Categoría', v: `${catNombre} · ${ramaNombre}` },
            { l: 'Formato', v: formatoNombre },
            { l: 'Equipos', v: equipos.length > 0 ? `${equipos.length} equipos · ${equipos.reduce((s, e) => s + (e.jugadores || []).length, 0)} jugadores` : `${cantEquipos} (agregar después)` },
            { l: 'Estadísticas', v: statsActivas },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '8px 0', fontSize: 13.5 }}>
              <span style={{ color: T.tenue, flexShrink: 0 }}>{r.l}</span>
              <span style={{ color: T.textoFuerte, fontWeight: 600, textAlign: 'right' }}>{r.v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: `${T.acento}10`, border: `0.5px solid ${T.borde}`, borderRadius: 13, padding: 14, color: T.textoBody, fontSize: 12.5, lineHeight: 1.5 }}>
          💡 Quedarás como <span style={{ color: T.acento, fontWeight: 700 }}>presidente</span> del torneo. Podrás agregar más jugadores, capitanes y la directiva después desde la gestión.
        </div>
      </>
    )
  }

  return (
    <div style={{ fontFamily: font, color: T.textoBody, background: T.fondo, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: alturaRaiz, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'height .25s' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 70% 36% at 50% 0%, ${T.glow}, transparent 72%)` }} />

      {/* HEADER con progreso */}
      <div style={{ position: 'relative', zIndex: 3, flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: T.panel, borderBottom: `0.5px solid ${T.borde}`, backdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px' }}>
          <button onClick={retroceder} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: 'none', background: T.esClaro ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)', color: T.textoFuerte, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: T.textoFuerte, fontSize: 15.5, fontWeight: 800 }}>Crear torneo</div>
            <div style={{ color: T.acento, fontSize: 11, fontWeight: 700 }}>Paso {paso} de {TOTAL_PASOS}</div>
          </div>
          <div style={{ width: 40, flexShrink: 0 }} />
        </div>
        <div style={{ height: 3, background: T.bordeSuave }}>
          <div style={{ width: `${(paso / TOTAL_PASOS) * 100}%`, height: '100%', background: T.boton, transition: 'width .3s' }} />
        </div>
      </div>

      {/* CONTENIDO scroll */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px 30px' }}>
          {Contenido()}
        </div>
      </div>

      {/* FOOTER con botón */}
      <div style={{ position: 'relative', zIndex: 3, flexShrink: 0, borderTop: `0.5px solid ${T.borde}`, background: T.panel, padding: '12px 16px', paddingBottom: kbAlto > 0 ? 12 : 'calc(12px + env(safe-area-inset-bottom))', backdropFilter: 'blur(14px)' }}>
        {paso < TOTAL_PASOS ? (
          <button onClick={avanzar} disabled={!puedeAvanzar()} style={{ width: '100%', border: 'none', borderRadius: 14, padding: 15, background: puedeAvanzar() ? T.boton : (T.esClaro ? '#e0e3e8' : 'rgba(255,255,255,.08)'), color: puedeAvanzar() ? T.botonTexto : T.tenue, fontSize: 15, fontWeight: 800, cursor: puedeAvanzar() ? 'pointer' : 'default' }}>Siguiente →</button>
        ) : (
          <button onClick={finalizar} disabled={guardando} style={{ width: '100%', border: 'none', borderRadius: 14, padding: 15, background: T.boton, color: T.botonTexto, fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: guardando ? 0.6 : 1 }}>{guardando ? 'Creando…' : '🏆 Crear torneo'}</button>
        )}
      </div>

      {equipoEditando != null && equipos[equipoEditando] && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: T.fondo, display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderBottom: `0.5px solid ${T.borde}`, background: T.panel }}>
            <span style={{ width: 38, height: 38, borderRadius: '50%', background: equipos[equipoEditando].color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{equipos[equipoEditando].codigo}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: T.textoFuerte, fontSize: 15.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{equipos[equipoEditando].nombre}</div>
              <div style={{ color: T.tenue, fontSize: 11.5 }}>Plantilla del equipo</div>
            </div>
            <button onClick={cerrarRoster} style={{ border: 'none', borderRadius: 10, padding: '8px 16px', background: T.boton, color: T.botonTexto, fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>Listo</button>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ maxWidth: 540, margin: '0 auto', padding: '16px 16px 40px' }}>
              <div style={{ background: T.tarjeta, border: `0.5px solid ${T.bordeSuave}`, borderRadius: 16, padding: 16, marginBottom: 18 }}>
                <label style={label}>Nombre del jugador</label>
                <input value={jNombre} onChange={(e) => setJNombre(e.target.value)} placeholder="Ej: Starling Reyes" style={{ ...inputStyle, marginBottom: 14 }} />

                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 90 }}>
                    <label style={label}>Número</label>
                    <input value={jNumero} onChange={(e) => setJNumero(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} inputMode="numeric" placeholder="7" style={{ ...inputStyle, textAlign: 'center' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={label}>Posición</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {POSICIONES.map((p) => (
                        <button key={p} onClick={() => setJPosicion(jPosicion === p ? '' : p)} style={{ border: jPosicion === p ? `1.5px solid ${T.acento}` : `1px solid ${T.bordeSuave}`, background: jPosicion === p ? `${T.acento}14` : T.input, color: jPosicion === p ? T.acento : T.textoBody, fontSize: 12, fontWeight: jPosicion === p ? 700 : 500, padding: '7px 11px', borderRadius: 16, cursor: 'pointer' }}>{p}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {jVinculo ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: `${T.acento}12`, border: `1px solid ${T.borde}`, borderRadius: 12, padding: '10px 12px', marginBottom: 14 }}>
                    <span style={{ fontSize: 16 }}>🔗</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: T.textoFuerte, fontSize: 13, fontWeight: 700 }}>{`${jVinculo.nombre || ''} ${jVinculo.apellido || ''}`.trim()}</div>
                      <div style={{ color: T.tenue, fontSize: 11 }}>Cuenta Media Cancha{jVinculo.codigo_unico ? ` · ${jVinculo.codigo_unico}` : ''}</div>
                    </div>
                    <button onClick={() => setJVinculo(null)} style={{ border: 'none', background: 'transparent', color: T.muyTenue, fontSize: 17, cursor: 'pointer' }}>✕</button>
                  </div>
                ) : !mostrarBuscar ? (
                  <button onClick={() => setMostrarBuscar(true)} style={{ border: `1px dashed ${T.borde}`, background: 'transparent', color: T.acento, fontSize: 12.5, fontWeight: 700, padding: '9px 14px', borderRadius: 12, cursor: 'pointer', marginBottom: 14, width: '100%' }}>🔗 Vincular a cuenta de Media Cancha (opcional)</button>
                ) : (
                  <div style={{ marginBottom: 14 }}>
                    <input value={jBuscar} onChange={(e) => setJBuscar(e.target.value)} placeholder="Buscar por nombre o código único…" style={{ ...inputStyle, marginBottom: 8 }} />
                    {jResultados.length > 0 && (
                      <div style={{ background: T.input, border: `1px solid ${T.bordeSuave}`, borderRadius: 12, overflow: 'hidden' }}>
                        {jResultados.map((p) => (
                          <button key={p.id} onClick={() => seleccionarVinculo(p)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '10px 12px', cursor: 'pointer', borderBottom: `0.5px solid ${T.bordeSuave}` }}>
                            <span style={{ width: 30, height: 30, borderRadius: '50%', background: p.foto_url ? `url(${p.foto_url}) center/cover` : T.boton, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: T.textoFuerte, fontSize: 13, fontWeight: 600 }}>{`${p.nombre || ''} ${p.apellido || ''}`.trim()}</div>
                              <div style={{ color: T.muyTenue, fontSize: 11 }}>{p.codigo_unico || ''}{p.municipio ? ` · ${p.municipio}` : ''}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {jBuscar.trim().length >= 2 && jResultados.length === 0 && (
                      <div style={{ color: T.muyTenue, fontSize: 12, padding: '6px 2px' }}>No se encontró ninguna cuenta. El jugador se agregará sin vincular.</div>
                    )}
                    <button onClick={() => { setMostrarBuscar(false); setJBuscar(''); setJResultados([]) }} style={{ border: 'none', background: 'transparent', color: T.muyTenue, fontSize: 12, cursor: 'pointer', marginTop: 6 }}>Cancelar vínculo</button>
                  </div>
                )}

                <button onClick={agregarJugadorLocal} disabled={jNombre.trim().length < 2} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 13, background: jNombre.trim().length < 2 ? T.tarjeta : T.boton, color: jNombre.trim().length < 2 ? T.muyTenue : T.botonTexto, fontSize: 14.5, fontWeight: 800, cursor: jNombre.trim().length < 2 ? 'default' : 'pointer' }}>＋ Agregar a la plantilla</button>
              </div>

              {(equipos[equipoEditando].jugadores || []).length > 0 ? (
                <>
                  <div style={{ color: T.tenue, fontSize: 12, fontWeight: 700, marginBottom: 11 }}>{equipos[equipoEditando].jugadores.length} jugador{equipos[equipoEditando].jugadores.length === 1 ? '' : 'es'}</div>
                  {equipos[equipoEditando].jugadores.map((j, k) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px', background: T.tarjeta, border: `1px solid ${T.bordeSuave}`, borderRadius: 12, marginBottom: 8 }}>
                      <span style={{ width: 32, textAlign: 'center', color: T.acento, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{j.numero || '–'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: T.textoFuerte, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>{j.nombre}{j.perfilId && <span style={{ fontSize: 11 }}>🔗</span>}</div>
                        <div style={{ color: T.muyTenue, fontSize: 11.5 }}>{j.posicion || 'Sin posición'}{j.perfilId ? ' · vinculado' : ''}</div>
                      </div>
                      <button onClick={() => quitarJugadorLocal(k)} style={{ border: 'none', background: 'transparent', color: T.muyTenue, fontSize: 18, cursor: 'pointer', padding: '0 4px' }}>✕</button>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ color: T.muyTenue, fontSize: 12.5, textAlign: 'center', lineHeight: 1.5, padding: '8px 20px' }}>Aún no hay jugadores en este equipo. Agrégalos arriba — puedes vincular a cada uno con su cuenta de Media Cancha por su código único.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {fotoARecortar && (
        <RecortadorFoto
          archivo={fotoARecortar}
          forma="cuadrado"
          tema={T}
          onListo={alRecortar}
          onCancelar={() => setFotoARecortar(null)}
        />
      )}
    </div>
  )
}