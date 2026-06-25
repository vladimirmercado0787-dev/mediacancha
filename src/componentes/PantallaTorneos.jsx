import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { cargarTorneoPublico, generarCalendario } from '../torneoData'

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

export default function PantallaTorneos({ esAdmin = false, onVolver, onAccion }) {
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

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        // por ahora carga el torneo que exista; más adelante vendrá por id desde una lista
        const { data: ts } = await supabase.from('torneos').select('*').order('creado_en', { ascending: false }).limit(1)
        const t = (ts || [])[0]
        if (!t || !vivo) return
        setTorneoRow(t)
        const pub = await cargarTorneoPublico(t.id)
        const { count } = await supabase.from('torneo_jugadores').select('id', { count: 'exact', head: true }).eq('torneo_id', t.id)
        if (!vivo) return
        setDatos(pub)
        setJugCount(count || 0)
      } catch (e) {
        /* si algo falla, la pantalla se queda con la data de ejemplo */
      }
    })()
    return () => { vivo = false }
  }, [recarga])

  // mapa equipo_id -> equipo (para sacar código y color)
  const eqPorId = {}
  ;(datos?.equipos || []).forEach((e) => { eqPorId[e.id] = e })

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

  const tarjeta = { background: T.tarjeta, border: `0.5px solid ${T.bordeSuave}`, borderRadius: 16, overflow: 'hidden' }
  const tituloModulo = (txt, color) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 11 }}>
      <span style={{ width: 4, height: 16, background: color || T.acento, borderRadius: 2, display: 'inline-block' }} />
      <span style={{ color: T.textoFuerte, fontSize: 15, fontWeight: 800 }}>{txt}</span>
    </div>
  )
  const avatarEquipo = (cod, color, colorTexto, size) => {
    const s = size || 22
    return <span style={{ width: s, height: s, borderRadius: '50%', background: color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: s * 0.4, color: colorTexto, fontWeight: 800, flexShrink: 0 }}>{cod}</span>
  }
  const colorDe = (cod) => clasificacion.find((e) => e.cod === cod)?.color || T.avatar
  const colorTxtDe = (cod) => clasificacion.find((e) => e.cod === cod)?.colorTexto || '#fff'

  const alGenerar = async (reemplazar = false) => {
    if (!torneoRow || generando) return
    setGenerando(true); setErrorGen(null)
    try {
      const { error } = await generarCalendario(torneoRow.id, datos?.equipos || [], torneoRow.formato || 'liga', { vueltas, reemplazar })
      if (error) { setErrorGen(error); setGenerando(false); return }
      setRecarga((r) => r + 1) // recarga el torneo ya con su calendario
    } catch (e) {
      setErrorGen('No se pudo generar el calendario.')
    } finally {
      setGenerando(false)
    }
  }

  const Contenido = () => {
    if (pestana === 'resumen') {
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 9, marginBottom: 16 }}>
            {[{ l: 'Equipos', v: tj.equipos }, { l: 'Jugadores', v: tj.jugadores }, { l: 'Juegos', v: `${tj.juegosJugados}/${tj.juegosTotal}` }, { l: 'Fase', v: tj.fase, chico: true }].map((m, i) => (
              <div key={i} style={{ background: T.tarjeta, border: `0.5px solid ${T.bordeSuave}`, borderRadius: 13, padding: '12px 14px' }}>
                <div style={{ color: T.tenue, fontSize: 11, marginBottom: 5 }}>{m.l}</div>
                <div style={{ color: T.textoFuerte, fontSize: m.chico ? 15 : 22, fontWeight: 800 }}>{m.v}</div>
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
                    <span style={{ color: T.textoFuerte, fontSize: 24, fontWeight: 800 }}>58 — 52</span>
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
                    <div style={{ color: T.acento, fontSize: 24, fontWeight: 800 }}>RD$ 84,000</div>
                  </div>
                  <span style={{ color: T.tenue, fontSize: 16 }}>›</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, background: T.esClaro ? 'rgba(93,202,165,.08)' : 'rgba(93,202,165,.1)', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ color: T.muyTenue, fontSize: 10 }}>Ingresos</div>
                    <div style={{ color: '#5dcaa5', fontSize: 14, fontWeight: 800 }}>+126K</div>
                  </div>
                  <div style={{ flex: 1, background: T.esClaro ? 'rgba(240,149,149,.08)' : 'rgba(240,149,149,.1)', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ color: T.muyTenue, fontSize: 10 }}>Gastos</div>
                    <div style={{ color: '#f09595', fontSize: 14, fontWeight: 800 }}>−42K</div>
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
                    {jugs.map((j) => (
                      <div key={j.jugador_id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: `0.5px solid ${T.bordeSuave}` }}>
                        <span style={{ width: 30, height: 30, borderRadius: 8, background: T.esClaro ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)', color: T.acento, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{j.numero ?? '–'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: T.textoFuerte, fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>{j.nombre}{j.esCapitan && <span style={{ fontSize: 9, fontWeight: 800, color: T.botonTexto, background: T.boton, padding: '1px 6px', borderRadius: 8 }}>CAP</span>}{j.esRefuerzo && <span style={{ fontSize: 9, fontWeight: 800, color: T.tenue, border: `1px solid ${T.bordeSuave}`, padding: '1px 6px', borderRadius: 8 }}>R</span>}</div>
                          <div style={{ color: T.muyTenue, fontSize: 11.5 }}>{j.posicion || '—'}</div>
                        </div>
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
                <div key={j.jugador_id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderBottom: `0.5px solid ${T.bordeSuave}` }}>
                  {avatarEquipo(j.cod, j.color, '#fff', 32)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.textoFuerte, fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{j.numero ?? '–'} {j.nombre}</div>
                    <div style={{ color: T.muyTenue, fontSize: 11.5 }}>{j.posicion || '—'} · {j.equipoNombre}</div>
                  </div>
                  {j.esCapitan && <span style={{ fontSize: 9, fontWeight: 800, color: T.botonTexto, background: T.boton, padding: '2px 7px', borderRadius: 8 }}>CAP</span>}
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
          {tituloModulo('Contabilidad del torneo', '#5dcaa5')}
          <div style={{ ...tarjeta, padding: 16, marginBottom: 16, textAlign: 'center', background: `${T.acento}10`, border: `0.5px solid ${T.borde}` }}>
            <div style={{ color: T.tenue, fontSize: 12, marginBottom: 5 }}>Balance del fondo</div>
            <div style={{ color: T.acento, fontSize: 32, fontWeight: 800 }}>RD$ 84,000</div>
          </div>
          <div style={tarjeta}>
            {[{ l: 'Inscripciones (16 equipos)', v: '+ RD$ 96,000', verde: true }, { l: 'Patrocinadores', v: '+ RD$ 30,000', verde: true }, { l: 'Pago de árbitros', v: '− RD$ 24,000', verde: false }, { l: 'Premiación + logística', v: '− RD$ 18,000', verde: false }].map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 14px', borderBottom: `0.5px solid ${T.bordeSuave}`, fontSize: 13.5 }}>
                <span style={{ color: T.textoBody }}>{m.l}</span>
                <span style={{ color: m.verde ? '#5dcaa5' : '#f09595', fontWeight: 700 }}>{m.v}</span>
              </div>
            ))}
          </div>
          <button onClick={() => alert('Agregar movimiento (demo)')} style={{ width: '100%', marginTop: 14, border: `1px solid ${T.borde}`, borderRadius: 13, padding: 13, background: 'transparent', color: T.acento, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>＋ Registrar movimiento</button>
        </>
      )
    }

    if (pestana === 'directiva') {
      const DIR = [
        { rol: 'Presidente', nombre: 'Vladimir Mercado', cod: 'VM' },
        { rol: 'Vicepresidente', nombre: 'Joel Brito', cod: 'JB' },
        { rol: 'Tesorero', nombre: 'Héctor Tavárez', cod: 'HT' },
        { rol: 'Vocal', nombre: 'Pedro Julio', cod: 'PJ' },
      ]
      return (
        <>
          {tituloModulo('Directiva del torneo', '#6fb0ec')}
          {DIR.map((d, i) => (
            <div key={i} style={{ ...tarjeta, padding: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.avatarTexto, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{d.cod}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: T.textoFuerte, fontSize: 14.5, fontWeight: 700 }}>{d.nombre}</div>
                <div style={{ color: T.acento, fontSize: 12, fontWeight: 600 }}>{d.rol}</div>
              </div>
              <span style={{ color: T.tenue, fontSize: 18 }}>⋯</span>
            </div>
          ))}
          <button onClick={() => alert('Agregar miembro (demo)')} style={{ width: '100%', marginTop: 4, border: `1px solid ${T.borde}`, borderRadius: 13, padding: 13, background: 'transparent', color: T.acento, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>＋ Agregar a la directiva</button>
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
                      return (
                        <div key={j.id || i} style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', borderBottom: i < porJornada[jn].length - 1 ? `0.5px solid ${T.bordeSuave}` : 'none', gap: 10 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 12px', maxWidth: maxAncho, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <button onClick={() => onVolver && onVolver()} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: 'none', background: T.esClaro ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)', color: T.textoFuerte, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: T.boton, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 }}>{tj.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: T.textoFuerte, fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tj.nombre}</div>
            <div style={{ color: T.tenue, fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tj.subtitulo} · {tj.lugar}</div>
          </div>
          {esAdmin && (
            <button onClick={() => onAccion && onAccion('verPublico')} style={{ flexShrink: 0, border: `1px solid ${T.borde}`, background: 'transparent', color: T.acento, fontSize: 12, fontWeight: 700, padding: esAncho ? '7px 12px' : '7px 10px', borderRadius: 16, cursor: 'pointer', whiteSpace: 'nowrap' }}>{esAncho ? '👁️ Vista pública' : '👁️'}</button>
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
              <button key={p.id} onClick={() => setPestana(p.id)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 20, border: activa ? 'none' : `0.5px solid ${esModAdmin ? T.borde : T.bordeSuave}`, background: activa ? T.boton : (esModAdmin ? `${T.acento}10` : (T.esClaro ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.04)')), color: activa ? T.botonTexto : (esModAdmin ? T.acento : T.tenue), fontSize: 13, fontWeight: activa ? 800 : 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
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
    </div>
  )
}