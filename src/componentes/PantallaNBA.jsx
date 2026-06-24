import { useState, useEffect } from 'react'
import { getScoreboard, getStandings, getLeaders, getTeams, getNoticias } from './nbaApi'
import { supabase } from '../supabaseClient'
import CompartirAlChat from './CompartirAlChat'
import { enviarFicha, enviarNoticia } from '../mensajes'

// ============================================================
//  PANTALLA NBA — Media Cancha · tema Miami Heat (negro/vino/oro)
//  3 niveles: teléfono / iPad (tablet) / computadora.
//  FOTOS: cada jugador/equipo tiene un campo `foto`. Hoy va vacío
//  (sale silueta/iniciales por ley). El día que haya licencia oficial,
//  se llena `foto` y entran solas SIN rehacer nada.
//  DATOS: por ahora de ejemplo (abajo). El robot de ESPN los va a
//  reemplazar guardándolos en Supabase con ESTA MISMA forma.
// ============================================================

const DISP = '"Arial Narrow", "Helvetica Neue", Impact, system-ui, sans-serif'
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

// Tema Miami Heat (único por ahora; se pueden sumar más después)
const T = {
  fondo: '#0B0709',
  glow1: 'rgba(211,27,60,0.18)',
  glow2: 'rgba(249,160,27,0.10)',
  panel: 'linear-gradient(160deg, rgba(26,18,22,0.92), rgba(20,12,16,0.95))',
  panelLiso: 'rgba(255,255,255,0.045)',
  borde: 'rgba(255,255,255,0.10)',
  linea: 'rgba(255,255,255,0.06)',
  texto: '#F3ECEE', texto2: '#D8CDD2', tenue: '#A1939A', tenue2: '#6E5F66',
  rojo: '#D31B3C', vino: '#98002E', oro: '#F9A01B', oroLt: '#FFC44D',
  verde: '#33CC7A',
  headerBg: 'rgba(11,7,9,0.93)',
}

// Colores oficiales de equipo (los colores NO son propiedad intelectual;
// nos sirven para identificar sin usar logos).
const COL = {
  ATL: '#E03A3E', BOS: '#007A33', BKN: '#1a1a1a', CHA: '#1D1160', CHI: '#CE1141',
  CLE: '#860038', DAL: '#00538C', DEN: '#0E2240', DET: '#C8102E', GSW: '#1D428A',
  HOU: '#CE1141', IND: '#002D62', LAC: '#C8102E', LAL: '#552583', MEM: '#5D76A9',
  MIA: '#98002E', MIL: '#00471B', MIN: '#0C2340', NOP: '#0C2340', NYK: '#006BB6',
  OKC: '#007AC1', ORL: '#0077C0', PHI: '#006BB6', PHX: '#5A2D81', POR: '#E03A3E',
  SAC: '#5A2D81', SAS: '#2b2b2b', TOR: '#CE1141', UTA: '#002B5C', WAS: '#002B5C',
}
const col = (abv) => COL[abv] || '#555'

// ===== ADN MC (rating) — MISMA fórmula que la LNB, con columnas en español =====
// eff = pts+reb+ast+rob+tap−perdidas (o la columna efficiency si viene).
// El rating divide entre el techo global (la mejor campaña de toda la historia).
function effDe(s) {
  if (!s) return 0
  const e = Number(s.efficiency)
  if (s.efficiency != null && !Number.isNaN(e) && e > 0) return e
  return (Number(s.puntos) || 0) + (Number(s.rebotes) || 0) + (Number(s.asistencias) || 0)
    + (Number(s.robos) || 0) + (Number(s.tapones) || 0) - (Number(s.perdidas) || 0)
}
const adnMcDe = (s, maxEff) => Math.round(100 * Math.pow(Math.max(0, effDe(s)) / Math.max(1, maxEff), 0.85))

function iniciales(nombre) {
  const p = (nombre || '').trim().split(/\s+/)
  if (!p.length || !p[0]) return '?'
  if (p.length === 1) return p[0].slice(0, 3).toUpperCase()
  return (p[0][0] + p[p.length - 1].slice(0, 2)).toUpperCase()
}

// categorías de líderes (se sacan de la misma data del ADN MC)
const CATS_MC = [
  { id: 'pts', lbl: 'Puntos', key: 'pts' },
  { id: 'reb', lbl: 'Rebotes', key: 'reb' },
  { id: 'ast', lbl: 'Asistencias', key: 'ast' },
  { id: 'rob', lbl: 'Robos', key: 'rob' },
  { id: 'tap', lbl: 'Tapones', key: 'tap' },
]

// traduce y ordena la ronda de playoffs que viene de ESPN
// ("East 1st Round - Game 3" -> Primera Ronda · Este). El número de juego se
// quita para agrupar toda la ronda junta.
function rondaInfo(ronda) {
  if (!ronda) return { label: 'Juegos', orden: 9 }
  const base = String(ronda).replace(/\s*-\s*Game\s*\d+\s*$/i, '').trim()
  const M = {
    'NBA Finals': { label: 'Finales NBA', orden: 0 },
    'East Finals': { label: 'Final de Conferencia · Este', orden: 1 },
    'West Finals': { label: 'Final de Conferencia · Oeste', orden: 1 },
    'East Semifinals': { label: 'Semifinal · Este', orden: 2 },
    'West Semifinals': { label: 'Semifinal · Oeste', orden: 2 },
    'East 1st Round': { label: 'Primera Ronda · Este', orden: 3 },
    'West 1st Round': { label: 'Primera Ronda · Oeste', orden: 3 },
  }
  return M[base] || { label: base || 'Playoffs', orden: 8 }
}

// =================== DATOS DE EJEMPLO (los reemplaza el robot) ===================
const PORTADA = {
  tag: 'Traspaso · Oeste', breaking: true, indice: 97,
  titulo: 'Acuerdo histórico sacude la conferencia antes del receso',
  meta: ['Hace 22 min', '3 equipos movidos', '2.4k leyendo'],
  abvA: 'MIL', abvB: 'NOP', foto: null,
}
const JUEGOS = [
  { id: 1, estado: 'vivo', periodo: '3C', reloj: '4:12', local: { abv: 'LAL', rec: '31-14', score: 88, gana: true }, visita: { abv: 'BOS', rec: '36-9', score: 81 } },
  { id: 2, estado: 'final', local: { abv: 'MIA', rec: '27-18', score: 104 }, visita: { abv: 'OKC', rec: '40-6', score: 119, gana: true } },
  { id: 3, estado: 'final', nota: 'PR', local: { abv: 'SAS', rec: '33-13', score: 112, gana: true }, visita: { abv: 'MIN', rec: '28-18', score: 108 } },
  { id: 4, estado: 'previa', hora: '8:00 PM', local: { abv: 'CLE', rec: '38-8' }, visita: { abv: 'NYK', rec: '30-15' } },
  { id: 5, estado: 'previa', hora: '8:30 PM', local: { abv: 'DAL', rec: '26-19' }, visita: { abv: 'DEN', rec: '34-12' } },
]
const DESTACADAS = [
  { id: 1, tag: 'Lesión · Estrella', hot: true, indice: 91, titulo: 'Una figura sale lesionada y enciende las alarmas de su equipo', fuente: 'ESPN', tiempo: 'hace 1 h', foto: null },
  { id: 2, tag: 'Récord', hot: false, indice: 84, titulo: 'Triple-doble de 50 puntos rompe una marca de la franquicia', fuente: 'ESPN', tiempo: 'hace 3 h', foto: null },
  { id: 3, tag: 'Mercado', hot: false, indice: 78, titulo: 'Dos contendientes negocian un cambio de último minuto', fuente: 'ESPN', tiempo: 'hace 5 h', foto: null },
]
const CLASIF = {
  este: [
    { pos: 1, abv: 'BOS', nombre: 'Celtics', w: 36, l: 9, gb: '—', racha: 'G6' },
    { pos: 2, abv: 'CLE', nombre: 'Cavaliers', w: 38, l: 8, gb: '+1', racha: 'G3' },
    { pos: 3, abv: 'NYK', nombre: 'Knicks', w: 30, l: 15, gb: '6.5', racha: 'P1' },
    { pos: 4, abv: 'MIA', nombre: 'Heat', w: 27, l: 18, gb: '9', racha: 'G2' },
    { pos: 5, abv: 'ORL', nombre: 'Magic', w: 26, l: 20, gb: '10.5', racha: 'P2' },
    { pos: 6, abv: 'PHI', nombre: '76ers', w: 24, l: 21, gb: '12', racha: 'G1' },
  ],
  oeste: [
    { pos: 1, abv: 'OKC', nombre: 'Thunder', w: 40, l: 6, gb: '—', racha: 'G5' },
    { pos: 2, abv: 'DEN', nombre: 'Nuggets', w: 34, l: 12, gb: '6', racha: 'G2' },
    { pos: 3, abv: 'MEM', nombre: 'Grizzlies', w: 32, l: 15, gb: '8.5', racha: 'G1' },
    { pos: 4, abv: 'LAL', nombre: 'Lakers', w: 31, l: 14, gb: '8.5', racha: 'G3' },
    { pos: 5, abv: 'DAL', nombre: 'Mavericks', w: 26, l: 19, gb: '13.5', racha: 'P1' },
    { pos: 6, abv: 'SAS', nombre: 'Spurs', w: 33, l: 13, gb: '7', racha: 'G2' },
  ],
}
const LIDERES = [
  { cat: 'Puntos', abv: 'SGA', nombre: 'Gilgeous-Alexander', equipo: 'OKC', pos: 'Escolta', valor: '32.6', unidad: 'PPP', foto: null },
  { cat: 'Rebotes', abv: 'WEM', nombre: 'Wembanyama', equipo: 'SAS', pos: 'Centro', valor: '12.4', unidad: 'RPP', foto: null },
  { cat: 'Asistencias', abv: 'TYO', nombre: 'Trae Young', equipo: 'ATL', pos: 'Base', valor: '11.1', unidad: 'APP', foto: null },
  { cat: 'Robos', abv: 'DDA', nombre: 'Dyson Daniels', equipo: 'ATL', pos: 'Escolta', valor: '3.0', unidad: 'RBP', foto: null },
  { cat: 'Tapones', abv: 'WEM', nombre: 'Wembanyama', equipo: 'SAS', pos: 'Centro', valor: '3.8', unidad: 'TPP', foto: null },
  { cat: 'Eficiencia', abv: 'NJO', nombre: 'Nikola Jokić', equipo: 'DEN', pos: 'Centro', valor: '31.2', unidad: 'EFF', foto: null },
  { cat: '% de Campo', abv: 'ZWI', nombre: 'Zion Williamson', equipo: 'NOP', pos: 'Ala-pívot', valor: '62.1', unidad: 'FG%', foto: null },
  { cat: '% de Triples', abv: 'STC', nombre: 'Stephen Curry', equipo: 'GSW', pos: 'Base', valor: '44.8', unidad: '3P%', foto: null },
  { cat: '% T. Libres', abv: 'KDU', nombre: 'Kevin Durant', equipo: 'PHX', pos: 'Alero', valor: '91.0', unidad: 'FT%', foto: null },
  { cat: 'Minutos', abv: 'MCU', nombre: 'Mikal Bridges', equipo: 'NYK', pos: 'Alero', valor: '37.4', unidad: 'MPP', foto: null },
]
const NOTICIAS = [
  { id: 1, titulo: 'El líder de la liga amarra el mejor récord antes del receso', fuente: 'ESPN', tiempo: 'hace 4 h', foto: null },
  { id: 2, titulo: 'Reservas del Juego de Estrellas: tres novatos sorprenden', fuente: 'ESPN', tiempo: 'hace 6 h', foto: null },
  { id: 3, titulo: 'Un árbitro explica la polémica falta del final', fuente: 'ESPN', tiempo: 'ayer', foto: null },
  { id: 4, titulo: 'Cinco equipos que pueden moverse antes de la fecha límite', fuente: 'ESPN', tiempo: 'ayer', foto: null },
]
const EQUIPOS_DEMO = ['BOS', 'CLE', 'NYK', 'MIA', 'ORL', 'PHI', 'OKC', 'DEN', 'MEM', 'LAL', 'DAL', 'SAS', 'MIL', 'GSW', 'PHX', 'MIN']

const TABS = [
  { id: 'hoy', txt: 'Hoy' },
  { id: 'resultados', txt: 'Resultados' },
  { id: 'clasif', txt: 'Clasificación' },
  { id: 'lideres', txt: 'Líderes' },
  { id: 'equipos', txt: 'Equipos' },
  { id: 'noticias', txt: 'Noticias' },
]

// ====== avatar/escudo: usa foto si existe; si no, iniciales sobre color ======
function Avatar({ foto, abv, color, size = 46, radio = 12 }) {
  if (foto) return <img src={foto} alt="" style={{ width: size, height: size, borderRadius: radio, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,.12)' }} />
  return (
    <div style={{ width: size, height: size, borderRadius: radio, flexShrink: 0, display: 'grid', placeItems: 'center', background: `linear-gradient(150deg, ${color}55, rgba(0,0,0,.5))`, border: '1px solid rgba(255,255,255,.12)', fontFamily: DISP, fontWeight: 900, fontSize: size * 0.34, color: '#fff', letterSpacing: -0.5 }}>{abv}</div>
  )
}

// ====== lector de noticia (modal desde abajo) — A NIVEL DE MÓDULO ======
// Estar afuera del componente le da identidad estable: cuando la pantalla se
// redibuja (p.ej. el carrusel), React lo ACTUALIZA en vez de rearmarlo, así
// el scroll de lectura no se reinicia.
function ModalNoticia({ n, cerrar }) {
  const [sheet, setSheet] = useState(false)       // hoja de opciones (al chat / afuera)
  const [chatOpen, setChatOpen] = useState(false) // hoja "compartir al chat"
  if (!n) return null
  const noticiaADatos = () => ({
    tipo: 'noticia',
    titulo: n.titulo || 'Noticia',
    fuente: n.fuente || 'NBAManiacs',
    tiempo: n.tiempo || '',
    imagen: n.imagen || n.foto || null,
    enlace: n.enlace || null,
    tag: n.tag || null,
  })
  const compartirAfuera = async () => {
    const d = noticiaADatos()
    const texto = `🏀 ${d.titulo}\n${[d.fuente, d.tiempo].filter(Boolean).join(' · ')}${d.enlace ? '\n' + d.enlace : ''}\nvía Media Cancha`
    try {
      if (navigator.share) await navigator.share({ title: 'Media Cancha · NBA', text: texto })
      else await navigator.clipboard.writeText(texto)
    } catch (_) { /* cancelado */ }
  }
  return (
    <>
    <div onClick={cerrar} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 70, background: 'rgba(0,0,0,0.66)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: T.fondo, borderTopLeftRadius: 22, borderTopRightRadius: 22, border: `1px solid ${T.borde}`, maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', height: 3 }}>
          <span style={{ flex: 1, background: T.vino }} />
          <span style={{ flex: 1, background: T.rojo }} />
          <span style={{ flex: 1, background: T.oro }} />
        </div>
        {n.imagen && (
          <div style={{ width: '100%', height: 210, background: '#000' }}>
            <img src={n.imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { const p = e.currentTarget.parentElement; if (p) p.style.display = 'none' }} />
          </div>
        )}
        <div style={{ padding: '16px 18px calc(env(safe-area-inset-bottom) + 24px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: DISP, fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: T.oroLt }}>{n.fuente}{n.tiempo ? ` · ${n.tiempo}` : ''}</span>
            <span onClick={cerrar} style={{ fontSize: 24, color: T.tenue, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</span>
          </div>
          <h2 style={{ fontFamily: DISP, fontSize: 22, fontWeight: 800, lineHeight: 1.2, color: T.texto, margin: '0 0 14px' }}>{n.titulo}</h2>
          {n.cuerpo
            ? n.cuerpo.split('\n').filter((p) => p.trim()).map((p, i) => (
              <p key={i} style={{ fontSize: 14.5, color: T.texto2, lineHeight: 1.65, margin: '0 0 12px' }}>{p}</p>
            ))
            : <p style={{ fontSize: 14, color: T.tenue, lineHeight: 1.6 }}>{n.resumen || 'Toca abajo para leer la noticia completa.'}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            {n.enlace && (
              <a href={n.enlace} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', fontFamily: DISP, fontSize: 13, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: '#fff', background: `linear-gradient(135deg, ${T.vino}, ${T.rojo})`, padding: '11px 18px', borderRadius: 12, textDecoration: 'none' }}>Leer en NBAManiacs ›</a>
            )}
            <button onClick={() => setSheet(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: DISP, fontSize: 13, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: T.oroLt, background: 'transparent', border: `1px solid ${T.oro}55`, padding: '11px 16px', borderRadius: 12, cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>
              Compartir
            </button>
          </div>
        </div>
      </div>
    </div>

      {sheet && (
        <div onClick={() => setSheet(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: T.fondo, borderTopLeftRadius: 20, borderTopRightRadius: 20, border: `1px solid ${T.borde}`, padding: '14px 14px calc(env(safe-area-inset-bottom) + 14px)' }}>
            <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 14px' }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: T.texto, textAlign: 'center', marginBottom: 12 }}>Compartir noticia</div>
            {[
              { t: 'Al chat', d: 'Mándala a una conversación', ic: '💬', fn: () => { setSheet(false); setChatOpen(true) } },
              { t: 'Compartir afuera', d: 'WhatsApp y otras apps', ic: '↗', fn: () => { setSheet(false); compartirAfuera() } },
            ].map((o) => (
              <div key={o.t} onClick={o.fn} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 8px', borderRadius: 12, cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(150deg, ${T.vino}, #2a0c16)`, display: 'grid', placeItems: 'center', color: T.oroLt, fontSize: 17 }}>{o.ic}</div>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: T.texto }}>{o.t}</div><div style={{ fontSize: 11, color: T.tenue }}>{o.d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {chatOpen && <CompartirAlChat datos={noticiaADatos()} titulo="Compartir noticia" onEnviar={enviarNoticia} tema={{ acento: T.oro, boton: `linear-gradient(150deg, ${T.oroLt}, ${T.oro})` }} onCerrar={() => setChatOpen(false)} onEnviado={() => setChatOpen(false)} />}
    </>
  )
}

// ====== FICHA DEL JUGADOR (modal desde abajo) — A NIVEL DE MÓDULO ======
// Al abrirse, lee de Supabase la carrera completa del jugador (todas sus
// temporadas) y le saca el ADN MC a cada año con el techo global.
function FichaJugador({ jugadorId, maxEff, cerrar }) {
  const [info, setInfo] = useState(null)
  const [carrera, setCarrera] = useState([])
  const [cargando, setCargando] = useState(true)
  useEffect(() => {
    let vivo = true
    async function load() {
      try {
        const [rJ, rS] = await Promise.all([
          supabase.from('nba_jugadores').select('*').eq('id', jugadorId).limit(1),
          supabase.from('nba_stats_temporada').select('*').eq('jugador_id', jugadorId).order('temporada', { ascending: false }),
        ])
        if (!vivo) return
        setInfo((rJ.data || [])[0] || null)
        setCarrera(rS.data || [])
      } catch (e) { /* deja la ficha vacía */ }
      if (vivo) setCargando(false)
    }
    load()
    return () => { vivo = false }
  }, [jugadorId])

  const f1 = (v) => (v == null || v === '' ? '—' : Number(v).toFixed(1))
  const pc = (v) => (v == null || v === '' ? '—' : Number(v).toFixed(1) + '%')
  const actual = carrera.find((s) => Number(s.temporada) === 2026) || carrera[0] || null
  const equipo = actual?.equipo_abv || info?.equipo_abv || ''
  const sub = [equipo, info?.posicion].filter(Boolean).join(' · ')
  const ratingActual = actual ? adnMcDe(actual, maxEff) : 0

  // ---- compartir la ficha ----
  const [sheet, setSheet] = useState(false)      // hoja de opciones (al chat / afuera)
  const [chatOpen, setChatOpen] = useState(false) // hoja "compartir al chat"
  const fichaADatos = () => ({
    tipo: 'ficha',
    nombre: info?.nombre || '—',
    equipo, pos: info?.posicion || '',
    rating: ratingActual,
    pts: actual?.puntos != null ? Number(actual.puntos) : null,
    reb: actual?.rebotes != null ? Number(actual.rebotes) : null,
    ast: actual?.asistencias != null ? Number(actual.asistencias) : null,
    rob: actual?.robos != null ? Number(actual.robos) : null,
    tap: actual?.tapones != null ? Number(actual.tapones) : null,
    fgPct: actual?.fg_pct ?? null, tpPct: actual?.tp_pct ?? null, ftPct: actual?.ft_pct ?? null,
    temporada: actual?.temporada || null,
  })
  const compartirAfuera = async () => {
    const d = fichaADatos()
    const linea = [f1(d.pts) + ' pts', f1(d.reb) + ' reb', f1(d.ast) + ' ast'].join(' · ')
    const texto = `🏀 ${d.nombre} · NBA\n${[d.equipo, d.pos].filter(Boolean).join(' · ')}\nADN MC: ${d.rating}\n${linea}\nvía Media Cancha`
    try {
      if (navigator.share) await navigator.share({ title: 'Media Cancha · NBA', text: texto })
      else await navigator.clipboard.writeText(texto)
    } catch (_) { /* cancelado */ }
  }

  const Caja = ({ lbl, val }) => (
    <div style={{ background: T.panelLiso, border: `1px solid ${T.borde}`, borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 17, fontWeight: 800, color: T.texto, fontVariantNumeric: 'tabular-nums' }}>{val}</div>
      <div style={{ fontSize: 8.5, fontWeight: 800, color: T.tenue, letterSpacing: 0.6, marginTop: 3, textTransform: 'uppercase' }}>{lbl}</div>
    </div>
  )

  return (
    <>
    <div onClick={cerrar} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.66)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: T.fondo, borderTopLeftRadius: 22, borderTopRightRadius: 22, border: `1px solid ${T.borde}`, maxHeight: '92vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', height: 3 }}>
          <span style={{ flex: 1, background: T.vino }} /><span style={{ flex: 1, background: T.rojo }} /><span style={{ flex: 1, background: T.oro }} />
        </div>
        <div style={{ padding: '12px 18px calc(env(safe-area-inset-bottom) + 24px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {!cargando ? (
              <button onClick={() => setSheet(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `linear-gradient(135deg, ${T.vino}, ${T.rojo})`, border: 'none', borderRadius: 11, padding: '8px 14px', color: '#fff', fontFamily: DISP, fontWeight: 800, fontSize: 12.5, letterSpacing: 0.3, cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>
                Compartir
              </button>
            ) : <span />}
            <span onClick={cerrar} style={{ fontSize: 24, color: T.tenue, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</span>
          </div>
          {cargando ? (
            <div style={{ padding: '46px 0', textAlign: 'center', color: T.tenue, fontSize: 13 }}>Cargando la ficha…</div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 2 }}>
                <Avatar abv={iniciales(info?.nombre)} color={col(equipo)} size={64} radio={16} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: DISP, fontWeight: 900, fontSize: 22, color: T.texto, lineHeight: 1.05 }}>{info?.nombre || '—'}</div>
                  <div style={{ fontSize: 12, color: T.tenue, marginTop: 3 }}>{sub}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 56 }}>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: 30, color: T.oroLt, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{ratingActual}</div>
                  <div style={{ fontSize: 8.5, fontWeight: 800, color: T.tenue, letterSpacing: 1, marginTop: 2 }}>ADN MC</div>
                </div>
              </div>

              {actual && (
                <>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: T.tenue, textTransform: 'uppercase', letterSpacing: 1, margin: '20px 0 10px' }}>Temporada {actual.temporada} · promedios</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    <Caja lbl="Pts" val={f1(actual.puntos)} />
                    <Caja lbl="Reb" val={f1(actual.rebotes)} />
                    <Caja lbl="Ast" val={f1(actual.asistencias)} />
                    <Caja lbl="Rob" val={f1(actual.robos)} />
                    <Caja lbl="Tap" val={f1(actual.tapones)} />
                    <Caja lbl="Min" val={f1(actual.minutos)} />
                    <Caja lbl="% Campo" val={pc(actual.fg_pct)} />
                    <Caja lbl="% Triple" val={pc(actual.tp_pct)} />
                    <Caja lbl="% Libre" val={pc(actual.ft_pct)} />
                  </div>
                </>
              )}

              <div style={{ fontSize: 10.5, fontWeight: 800, color: T.tenue, textTransform: 'uppercase', letterSpacing: 1, margin: '24px 0 10px' }}>Carrera · año por año</div>
              {carrera.length ? (
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -2px' }}>
                  <div style={{ minWidth: 360 }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 4px', borderBottom: `1px solid ${T.linea}` }}>
                      <span style={{ width: 44, fontSize: 9.5, fontWeight: 800, color: T.tenue }}>AÑO</span>
                      <span style={{ width: 38, fontSize: 9.5, fontWeight: 800, color: T.tenue }}>EQ</span>
                      {['J', 'PTS', 'REB', 'AST'].map((h) => <span key={h} style={{ flex: 1, textAlign: 'center', fontSize: 9.5, fontWeight: 800, color: h === 'PTS' ? T.texto : T.tenue }}>{h}</span>)}
                      <span style={{ width: 44, textAlign: 'center', fontSize: 9.5, fontWeight: 800, color: T.oroLt }}>RAT</span>
                    </div>
                    {carrera.map((s) => (
                      <div key={s.temporada} style={{ display: 'flex', alignItems: 'center', padding: '9px 4px', borderBottom: `1px solid ${T.linea}` }}>
                        <span style={{ width: 44, fontFamily: DISP, fontWeight: 800, fontSize: 13, color: T.texto }}>{s.temporada}</span>
                        <span style={{ width: 38, fontSize: 11, fontWeight: 700, color: T.tenue }}>{s.equipo_abv || '—'}</span>
                        <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: T.texto2, fontVariantNumeric: 'tabular-nums' }}>{s.juegos ?? '—'}</span>
                        <span style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 900, color: T.texto, fontVariantNumeric: 'tabular-nums' }}>{f1(s.puntos)}</span>
                        <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: T.texto2, fontVariantNumeric: 'tabular-nums' }}>{f1(s.rebotes)}</span>
                        <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: T.texto2, fontVariantNumeric: 'tabular-nums' }}>{f1(s.asistencias)}</span>
                        <span style={{ width: 44, textAlign: 'center', fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 800, color: T.oroLt, fontVariantNumeric: 'tabular-nums' }}>{adnMcDe(s, maxEff)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '26px 0', textAlign: 'center', color: T.tenue, fontSize: 13 }}>No hay datos de carrera para este jugador.</div>
              )}
              <div style={{ marginTop: 16, fontSize: 10, color: T.tenue2, textAlign: 'center', letterSpacing: 0.3 }}>Promedios por temporada · Fuente ESPN · Rating ADN MC by Andamio</div>
            </>
          )}
        </div>
      </div>
    </div>

      {sheet && (
        <div onClick={() => setSheet(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: T.fondo, borderTopLeftRadius: 20, borderTopRightRadius: 20, border: `1px solid ${T.borde}`, padding: '14px 14px calc(env(safe-area-inset-bottom) + 14px)' }}>
            <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 14px' }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: T.texto, textAlign: 'center', marginBottom: 12 }}>Compartir ficha</div>
            {[
              { t: 'Al chat', d: 'Mándala a una conversación', ic: '💬', fn: () => { setSheet(false); setChatOpen(true) } },
              { t: 'Compartir afuera', d: 'WhatsApp y otras apps', ic: '↗', fn: () => { setSheet(false); compartirAfuera() } },
            ].map((o) => (
              <div key={o.t} onClick={o.fn} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 8px', borderRadius: 12, cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(150deg, ${T.vino}, #2a0c16)`, display: 'grid', placeItems: 'center', color: T.oroLt, fontSize: 17 }}>{o.ic}</div>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: T.texto }}>{o.t}</div><div style={{ fontSize: 11, color: T.tenue }}>{o.d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {chatOpen && <CompartirAlChat datos={fichaADatos()} titulo="Compartir ficha" onEnviar={enviarFicha} tema={{ acento: T.oro, boton: `linear-gradient(150deg, ${T.oroLt}, ${T.oro})` }} onCerrar={() => setChatOpen(false)} onEnviado={() => setChatOpen(false)} />}
    </>
  )
}

// ====== PLANTILLA DEL EQUIPO (modal desde abajo) — A NIVEL DE MÓDULO ======
// Lee de Supabase el róster actual del equipo + sus promedios; cada jugador
// se toca y abre su ficha.
function PlantillaEquipo({ abv, abrirJugador, cerrar }) {
  const [porAnio, setPorAnio] = useState({}) // { 2026: [jugadores], 2025: [...] }
  const [anios, setAnios] = useState([])     // años disponibles (desc)
  const [anioSel, setAnioSel] = useState(null)
  const [cargando, setCargando] = useState(true)
  useEffect(() => {
    let vivo = true
    async function load() {
      try {
        // todas las temporadas de este equipo (cada fila trae el equipo de ese año)
        const rS = await supabase.from('nba_stats_temporada').select('*').eq('equipo_abv', abv)
        const stats = rS.data || []
        const ids = [...new Set(stats.map((s) => s.jugador_id))]
        const jmap = {}
        for (let i = 0; i < ids.length; i += 300) {
          const trozo = ids.slice(i, i + 300)
          const rJ = await supabase.from('nba_jugadores').select('id,nombre,posicion').in('id', trozo)
          ;(rJ.data || []).forEach((j) => { jmap[j.id] = j })
        }
        const grupos = {}
        stats.forEach((s) => {
          const y = Number(s.temporada)
          if (!y) return
          const j = jmap[s.jugador_id] || {}
          ;(grupos[y] = grupos[y] || []).push({
            id: s.jugador_id, nombre: j.nombre || '—', pos: j.posicion || '',
            pts: Number(s.puntos) || 0, reb: Number(s.rebotes) || 0, ast: Number(s.asistencias) || 0,
            rob: Number(s.robos) || 0, tap: Number(s.tapones) || 0, min: Number(s.minutos) || 0,
            fg: s.fg_pct, tp: s.tp_pct, ft: s.ft_pct,
          })
        })
        Object.keys(grupos).forEach((y) => grupos[y].sort((a, b) => b.pts - a.pts))
        const ys = Object.keys(grupos).map(Number).sort((a, b) => b - a)
        if (vivo) {
          setPorAnio(grupos); setAnios(ys)
          setAnioSel(ys.includes(2026) ? 2026 : (ys[0] || null))
        }
      } catch (e) { /* deja vacío */ }
      if (vivo) setCargando(false)
    }
    load()
    return () => { vivo = false }
  }, [abv])

  const f1 = (v) => (v == null || v === '' ? '—' : Number(v).toFixed(1))
  const pc = (v) => (v == null || v === '' ? '—' : Number(v).toFixed(1) + '%')
  const roster = anioSel != null ? (porAnio[anioSel] || []) : []
  const COLS = [
    { k: 'pts', t: 'PTS', f: f1, fuerte: true }, { k: 'reb', t: 'REB', f: f1 }, { k: 'ast', t: 'AST', f: f1 },
    { k: 'rob', t: 'ROB', f: f1 }, { k: 'tap', t: 'TAP', f: f1 }, { k: 'min', t: 'MIN', f: f1 },
    { k: 'fg', t: '%TC', f: pc }, { k: 'tp', t: '%3P', f: pc }, { k: 'ft', t: '%TL', f: pc },
  ]

  return (
    <div onClick={cerrar} style={{ position: 'fixed', inset: 0, zIndex: 78, background: 'rgba(0,0,0,0.66)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: T.fondo, borderTopLeftRadius: 22, borderTopRightRadius: 22, border: `1px solid ${T.borde}`, maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', height: 3 }}><span style={{ flex: 1, background: T.vino }} /><span style={{ flex: 1, background: T.rojo }} /><span style={{ flex: 1, background: T.oro }} /></div>
        <div style={{ position: 'sticky', top: 0, background: T.fondo, padding: '14px 18px 12px', borderBottom: `1px solid ${T.linea}`, display: 'flex', alignItems: 'center', gap: 12, zIndex: 3 }}>
          <Avatar abv={abv} color={col(abv)} size={44} radio={12} />
          <div style={{ flex: 1 }}><div style={{ fontFamily: DISP, fontWeight: 900, fontSize: 20, color: T.texto }}>{abv}</div><div style={{ fontSize: 10.5, color: T.tenue, marginTop: 1 }}>{anioSel ? `Plantilla ${anioSel}` : 'Plantilla'} · {roster.length} jugadores</div></div>
          <span onClick={cerrar} style={{ fontSize: 24, color: T.tenue, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</span>
        </div>

        {/* selector de año */}
        {!cargando && anios.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '11px 14px', borderBottom: `1px solid ${T.linea}` }}>
            {anios.map((y) => (
              <button key={y} onClick={() => setAnioSel(y)} style={{ flex: '0 0 auto', fontFamily: DISP, fontWeight: 800, fontSize: 13, padding: '7px 14px', borderRadius: 10, border: y === anioSel ? 'none' : `1px solid ${T.borde}`, color: y === anioSel ? '#0B0709' : T.tenue, background: y === anioSel ? `linear-gradient(150deg, ${T.oroLt}, ${T.oro})` : 'transparent', cursor: 'pointer' }}>{y}</button>
            ))}
          </div>
        )}

        <div style={{ padding: '6px 14px calc(env(safe-area-inset-bottom) + 24px)' }}>
          {cargando ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: T.tenue, fontSize: 13 }}>Cargando la plantilla…</div>
          ) : roster.length ? (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -2px' }}>
              <div style={{ minWidth: 150 + COLS.length * 46 }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '6px 2px', borderBottom: `1px solid ${T.linea}` }}>
                  <span style={{ width: 150, fontSize: 9.5, fontWeight: 800, color: T.tenue, paddingLeft: 45 }}>JUGADOR</span>
                  {COLS.map((c) => <span key={c.k} style={{ width: 46, textAlign: 'center', fontSize: 9.5, fontWeight: 800, color: c.fuerte ? T.texto : T.tenue }}>{c.t}</span>)}
                </div>
                {roster.map((j) => (
                  <div key={j.id} onClick={() => abrirJugador(j.id)} style={{ display: 'flex', alignItems: 'center', padding: '9px 2px', borderBottom: `1px solid ${T.linea}`, cursor: 'pointer' }}>
                    <div style={{ width: 150, display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                      <Avatar abv={iniciales(j.nombre)} color={col(abv)} size={34} radio={9} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13.5, color: T.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombre}</div>
                        <div style={{ fontSize: 9.5, color: T.tenue }}>{j.pos || '—'}</div>
                      </div>
                    </div>
                    {COLS.map((c) => <span key={c.k} style={{ width: 46, textAlign: 'center', fontSize: c.fuerte ? 13.5 : 12, fontWeight: c.fuerte ? 900 : 500, color: c.fuerte ? T.texto : T.texto2, fontVariantNumeric: 'tabular-nums' }}>{c.f(j[c.k])}</span>)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '36px 0', textAlign: 'center', color: T.tenue, fontSize: 13, lineHeight: 1.5 }}>No hay plantilla cargada para {abv}{anioSel ? ' en ' + anioSel : ''}.</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ====== LISTA COMPLETA POR CATEGORÍA (modal desde abajo) — A NIVEL DE MÓDULO ======
function ListaCategoria({ cat, lista, abrirJugador, cerrar }) {
  return (
    <div onClick={cerrar} style={{ position: 'fixed', inset: 0, zIndex: 78, background: 'rgba(0,0,0,0.66)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: T.fondo, borderTopLeftRadius: 22, borderTopRightRadius: 22, border: `1px solid ${T.borde}`, maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', height: 3 }}><span style={{ flex: 1, background: T.vino }} /><span style={{ flex: 1, background: T.rojo }} /><span style={{ flex: 1, background: T.oro }} /></div>
        <div style={{ position: 'sticky', top: 0, background: T.fondo, padding: '14px 18px 10px', borderBottom: `1px solid ${T.linea}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
          <div><div style={{ fontFamily: DISP, fontWeight: 900, fontSize: 19, color: T.texto }}>Líderes · {cat.lbl}</div><div style={{ fontSize: 10.5, color: T.tenue, marginTop: 1 }}>Promedio por juego · {lista.length} jugadores</div></div>
          <span onClick={cerrar} style={{ fontSize: 24, color: T.tenue, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</span>
        </div>
        <div style={{ padding: '4px 14px calc(env(safe-area-inset-bottom) + 24px)' }}>
          {lista.map((j, i) => (
            <div key={j.id} onClick={() => abrirJugador(j.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 4px', borderTop: i === 0 ? 'none' : `1px solid ${T.linea}`, cursor: 'pointer' }}>
              <span style={{ width: 26, textAlign: 'center', fontFamily: DISP, fontWeight: 900, fontSize: 14, color: i < 3 ? T.oro : T.tenue }}>{i + 1}</span>
              <Avatar abv={iniciales(j.nombre)} color={col(j.equipo)} size={34} radio={9} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14, color: T.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombre}</div>
                <div style={{ fontSize: 10, color: T.tenue, marginTop: 1 }}>{j.equipo}{j.pos ? ' · ' + j.pos : ''}</div>
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: 18, color: T.oroLt, fontVariantNumeric: 'tabular-nums' }}>{(j[cat.key] || 0).toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ====== BOX SCORE DEL JUEGO (modal desde abajo) — A NIVEL DE MÓDULO ======
// Lee de Supabase la estadística por jugador del partido (nba_juego_jugadores).
// Cada jugador se toca y abre su ficha. Si el juego aún no tiene box cargado,
// lo dice claro (sale cuando el robot carga ese partido).
function PartidoBox({ juego, abrirJugador, cerrar }) {
  const [box, setBox] = useState([])
  const [nombres, setNombres] = useState({})
  const [cargando, setCargando] = useState(true)
  useEffect(() => {
    let vivo = true
    async function load() {
      try {
        const r = await supabase.from('nba_juego_jugadores').select('*').eq('juego_id', String(juego.id))
        const filas = r.data || []
        const ids = [...new Set(filas.map((x) => x.jugador_id))]
        const nm = {}
        for (let i = 0; i < ids.length; i += 300) {
          const rJ = await supabase.from('nba_jugadores').select('id,nombre').in('id', ids.slice(i, i + 300))
          ;(rJ.data || []).forEach((j) => { nm[j.id] = j.nombre })
        }
        if (vivo) { setBox(filas); setNombres(nm) }
      } catch (e) { /* deja vacío */ }
      if (vivo) setCargando(false)
    }
    load()
    return () => { vivo = false }
  }, [juego])

  const L = juego.local || {}, V = juego.visita || {}
  const n1 = (v) => (v == null || v === '' ? '—' : Math.round(Number(v)))
  const COLS = [['MIN', 'minutos'], ['PTS', 'puntos'], ['REB', 'rebotes'], ['AST', 'asistencias'], ['ROB', 'robos'], ['TAP', 'tapones']]
  const tablaEq = (abv, score) => {
    const filas = box.filter((x) => x.equipo_abv === abv).sort((a, b) => (Number(b.puntos) || 0) - (Number(a.puntos) || 0))
    if (!abv) return null
    return (
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
          <Avatar abv={abv} color={col(abv)} size={28} radio={8} />
          <span style={{ fontFamily: DISP, fontWeight: 900, fontSize: 15, color: T.texto }}>{abv}</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: 19, color: T.texto }}>{score != null ? score : ''}</span>
        </div>
        {filas.length ? (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -2px' }}>
            <div style={{ minWidth: 130 + COLS.length * 42 }}>
              <div style={{ display: 'flex', padding: '5px 2px', borderBottom: `1px solid ${T.linea}` }}>
                <span style={{ width: 130, fontSize: 9, fontWeight: 800, color: T.tenue }}>JUGADOR</span>
                {COLS.map(([t]) => <span key={t} style={{ width: 42, textAlign: 'center', fontSize: 9, fontWeight: 800, color: t === 'PTS' ? T.texto : T.tenue }}>{t}</span>)}
              </div>
              {filas.map((x) => (
                <div key={x.jugador_id} onClick={() => abrirJugador(x.jugador_id)} style={{ display: 'flex', alignItems: 'center', padding: '7px 2px', borderBottom: `1px solid ${T.linea}`, cursor: 'pointer' }}>
                  <span style={{ width: 130, fontSize: 12.5, fontWeight: 700, color: T.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombres[x.jugador_id] || '—'}</span>
                  {COLS.map(([t, k]) => <span key={t} style={{ width: 42, textAlign: 'center', fontSize: t === 'PTS' ? 13 : 12, fontWeight: t === 'PTS' ? 900 : 500, color: t === 'PTS' ? T.texto : T.texto2, fontVariantNumeric: 'tabular-nums' }}>{n1(x[k])}</span>)}
                </div>
              ))}
            </div>
          </div>
        ) : <div style={{ fontSize: 12, color: T.tenue, padding: '6px 2px' }}>Sin estadísticas de este equipo.</div>}
      </div>
    )
  }

  return (
    <div onClick={cerrar} style={{ position: 'fixed', inset: 0, zIndex: 82, background: 'rgba(0,0,0,0.66)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: T.fondo, borderTopLeftRadius: 22, borderTopRightRadius: 22, border: `1px solid ${T.borde}`, maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', height: 3 }}><span style={{ flex: 1, background: T.vino }} /><span style={{ flex: 1, background: T.rojo }} /><span style={{ flex: 1, background: T.oro }} /></div>
        <div style={{ position: 'sticky', top: 0, background: T.fondo, padding: '13px 18px 12px', borderBottom: `1px solid ${T.linea}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
          <div>
            <div style={{ fontFamily: DISP, fontWeight: 900, fontSize: 17, color: T.texto }}>{V.abv || '—'} {V.score != null ? V.score : ''} · {L.score != null ? L.score : ''} {L.abv || '—'}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.oroLt, letterSpacing: 0.6, marginTop: 2 }}>BOX SCORE · NBA</div>
          </div>
          <span onClick={cerrar} style={{ fontSize: 24, color: T.tenue, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</span>
        </div>
        <div style={{ padding: '12px 16px calc(env(safe-area-inset-bottom) + 24px)' }}>
          {cargando ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: T.tenue, fontSize: 13 }}>Cargando el box score…</div>
          ) : box.length ? (
            <>{tablaEq(V.abv, V.score)}{tablaEq(L.abv, L.score)}</>
          ) : (
            <div style={{ padding: '34px 6px', textAlign: 'center', color: T.tenue, fontSize: 13, lineHeight: 1.55 }}>Las estadísticas de este juego todavía no están cargadas.<br />Salen cuando el robot carga el partido (en temporada, automático).</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PantallaNBA({ onVolver }) {
  // ---- 3 niveles: teléfono / tablet (iPad) / escritorio ----
  const calcVista = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 380
    if (w >= 1180) return 'escritorio'
    if (w >= 820) return 'tablet'
    return 'movil'
  }
  const [vista, setVista] = useState(calcVista)
  useEffect(() => {
    const f = () => setVista(calcVista())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  const esMovil = vista === 'movil'
  const esEscritorio = vista === 'escritorio'
  const grande = vista !== 'movil' // tablet o escritorio
  const ancho = esEscritorio ? 1080 : grande ? 880 : '100%'
  const padLat = grande ? 24 : 16

  const [tab, setTab] = useState('hoy')
  const [conf, setConf] = useState('este') // toggle Este/Oeste

  // ---- datos en vivo de ESPN (con datos de muestra como respaldo) ----
  const [juegos, setJuegos] = useState(JUEGOS)
  const [clasif, setClasif] = useState(CLASIF)
  const [lideres, setLideres] = useState(LIDERES)
  const [equipos, setEquipos] = useState(EQUIPOS_DEMO)
  const [noticias, setNoticias] = useState([]) // se llena con el RSS real de NBAManiacs
  const [noticiaSel, setNoticiaSel] = useState(null) // noticia abierta en el lector
  const [slideIdx, setSlideIdx] = useState(0) // slide activo del carrusel de portada
  const [adn, setAdn] = useState([]) // ranking ADN MC (jugadores rankeados por rating)
  const [adnExpandido, setAdnExpandido] = useState(false) // top 10 por defecto, o top 50
  const [adnCargando, setAdnCargando] = useState(true)
  const [maxEff, setMaxEff] = useState(50) // techo global del ADN MC (respaldo razonable)
  const [jugadorSel, setJugadorSel] = useState(null) // id del jugador con ficha abierta
  const [equipoSel, setEquipoSel] = useState(null) // abreviatura del equipo con plantilla abierta
  const [catSel, setCatSel] = useState(null) // categoría con lista completa abierta
  const [juegoSel, setJuegoSel] = useState(null) // juego con box score abierto
  const [juegosDB, setJuegosDB] = useState([]) // juegos reales de Supabase (playoffs)
  useEffect(() => {
    let vivo = true
    getScoreboard().then((j) => { if (vivo && j && j.length) setJuegos(j) }).catch(() => {})
    getStandings().then((c) => { if (vivo && c) setClasif(c) }).catch(() => {})
    getLeaders().then((l) => { if (vivo && l && l.length) setLideres(l) }).catch(() => {})
    getTeams().then((t) => { if (vivo && t && t.length) setEquipos(t) }).catch(() => {})
    getNoticias().then((n) => { if (vivo && n && n.length) setNoticias(n) }).catch(() => {})
    return () => { vivo = false }
  }, [])

  // carrusel de portada: pasa solo cada 6 segundos (las 5 noticias de arriba).
  // Se PAUSA mientras hay una noticia abierta, para no redibujar al leer.
  useEffect(() => {
    const count = Math.min(5, noticias.length)
    if (count <= 1 || noticiaSel) return
    const id = setInterval(() => setSlideIdx((i) => (i + 1) % count), 6000)
    return () => clearInterval(id)
  }, [noticias.length, noticiaSel])

  // ---- ADN MC: lee jugadores + stats de la temporada actual desde Supabase,
  //      pide el techo global a la función nba_max_eff y calcula el rating ----
  useEffect(() => {
    let vivo = true
    async function cargarAdn() {
      try {
        const TEMP = 2026
        const [rJug, rStats, rMax] = await Promise.all([
          supabase.from('nba_jugadores').select('id,nombre,equipo_abv,posicion'),
          supabase.from('nba_stats_temporada').select('*').eq('temporada', TEMP),
          supabase.rpc('nba_max_eff'),
        ])
        const jugs = {}; (rJug.data || []).forEach((p) => { jugs[p.id] = p })
        const stats = rStats.data || []
        let maxEff = Number(rMax.data)
        if (!maxEff || Number.isNaN(maxEff)) maxEff = Math.max(1, ...stats.map(effDe)) // respaldo si la función aún no existe
        if (vivo) setMaxEff(maxEff)
        const lista = stats
          .map((s) => {
            const p = jugs[s.jugador_id] || {}
            return {
              id: s.jugador_id,
              nombre: p.nombre || '—',
              equipo: p.equipo_abv || s.equipo_abv || '',
              pos: p.posicion || '',
              rating: adnMcDe(s, maxEff),
              pts: Number(s.puntos) || 0,
              reb: Number(s.rebotes) || 0,
              ast: Number(s.asistencias) || 0,
              rob: Number(s.robos) || 0,
              tap: Number(s.tapones) || 0,
              juegos: Number(s.juegos) || 0,
            }
          })
          .filter((x) => x.rating > 0)
          .sort((a, b) => b.rating - a.rating)
        if (vivo) { setAdn(lista); setAdnCargando(false) }
      } catch (e) {
        if (vivo) setAdnCargando(false)
      }
    }
    cargarAdn()
    return () => { vivo = false }
  }, [])

  // ---- juegos reales desde Supabase (los carga el robot) ----
  useEffect(() => {
    let vivo = true
    async function cargarJuegos() {
      try {
        const r = await supabase.from('nba_juegos').select('*').eq('temporada', 2026).order('fecha', { ascending: true })
        const conv = (r.data || []).map((g) => ({
          id: g.id, estado: g.estado || 'final', fecha: g.fecha, ronda: g.ronda, fase: g.fase,
          local: { abv: g.local_abv, score: g.local_score, gana: !!g.ganador_abv && g.ganador_abv === g.local_abv },
          visita: { abv: g.visita_abv, score: g.visita_score, gana: !!g.ganador_abv && g.ganador_abv === g.visita_abv },
        }))
        if (vivo) setJuegosDB(conv)
      } catch (e) { /* deja vacío */ }
    }
    cargarJuegos()
    return () => { vivo = false }
  }, [])

  const fecha = new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })

  // ============== bloques reutilizables ==============

  const eyebrow = (titulo, oroParte, accion, onAccion) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 0 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ width: 4, height: 17, borderRadius: 3, background: `linear-gradient(180deg, ${T.rojo}, ${T.oro})` }} />
        <h2 style={{ fontFamily: DISP, fontWeight: 900, fontSize: grande ? 16 : 14, letterSpacing: 2, textTransform: 'uppercase', color: T.texto, margin: 0 }}>
          {titulo} {oroParte && <span style={{ color: T.oro }}>{oroParte}</span>}
        </h2>
      </div>
      {accion && <span onClick={onAccion} style={{ fontSize: 11.5, color: T.rojo, fontWeight: 700, cursor: onAccion ? 'pointer' : 'default' }}>{accion} →</span>}
    </div>
  )

  // ----- tarjeta de juego (marcador) -----
  const fila = (e, ganador) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
        <span style={{ width: 4, height: 22, borderRadius: 3, background: col(e.abv), flexShrink: 0 }} />
        <span style={{ fontFamily: DISP, fontWeight: 900, fontSize: 17, letterSpacing: 0.5, color: e.gana ? T.texto : (ganador ? T.tenue : T.texto) }}>{e.abv}</span>
        <span style={{ fontSize: 10, color: T.tenue2 }}>{e.rec}</span>
      </div>
      {e.score != null
        ? <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: 20, fontVariantNumeric: 'tabular-nums', color: e.gana ? T.texto : T.tenue }}>{e.score}{e.gana && <span style={{ color: T.oro, fontSize: 11, marginLeft: 5 }}>▲</span>}</span>
        : <span style={{ fontSize: 19, color: T.tenue2 }}>—</span>}
    </div>
  )
  const tarjetaJuego = (j) => {
    const ganador = j.estado === 'final'
    return (
      <div key={j.id} onClick={() => setJuegoSel(j)} style={{ width: esMovil ? 196 : 'auto', flex: grande ? '1 1 220px' : '0 0 auto', background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 15, padding: '12px 13px', boxShadow: '0 8px 22px rgba(0,0,0,.32)', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          {j.estado === 'vivo'
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: DISP, fontWeight: 900, fontSize: 10.5, letterSpacing: 1, color: T.rojo }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: T.rojo }} />EN VIVO · {j.periodo} {j.reloj}</span>
            : j.estado === 'final'
              ? <span style={{ fontFamily: DISP, fontWeight: 800, fontSize: 10.5, letterSpacing: 1, color: T.tenue2 }}>FINAL{j.nota ? ' · ' + j.nota : ''}</span>
              : <span style={{ fontSize: 11, fontWeight: 800, color: T.oro }}>{j.hora} <span style={{ color: T.tenue2, fontWeight: 600 }}>AST</span></span>}
        </div>
        {fila(j.visita, ganador)}
        {fila(j.local, ganador)}
      </div>
    )
  }

  // ----- noticia destacada (real, se toca y abre el lector) -----
  const tarjetaDestacada = (n) => {
    const img = n.imagen || n.foto
    return (
      <div key={n.id} onClick={() => setNoticiaSel(n)} style={{ background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 16, overflow: 'hidden', display: 'flex', minHeight: 104, boxShadow: '0 8px 22px rgba(0,0,0,.28)', cursor: 'pointer' }}>
        <div style={{ width: 118, flexShrink: 0, position: 'relative', background: img ? '#000' : `linear-gradient(140deg, ${T.vino}, #3a0a18)` }}>
          {img && <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />}
          <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(8,5,9,.66)', borderRadius: 14, padding: '3px 8px', backdropFilter: 'blur(4px)' }}>
            <span>🔥</span><b style={{ fontFamily: DISP, fontSize: 11, color: T.oroLt }}>{n.indice}</b>
          </div>
        </div>
        <div style={{ padding: '12px 13px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
          <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase', color: n.breaking ? T.rojo : '#7fb3ff', marginBottom: 4 }}>{n.tag}</div>
          <h4 style={{ fontFamily: DISP, fontWeight: 700, fontSize: 16, lineHeight: 1.12, color: T.texto, margin: 0 }}>{n.titulo}</h4>
          <div style={{ fontSize: 10.5, color: T.tenue, marginTop: 6 }}>{n.fuente} · {n.tiempo}</div>
        </div>
      </div>
    )
  }

  // ----- tabla de clasificación -----
  const tablaClasif = (lista, full) => (
    <div style={{ background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 22px rgba(0,0,0,.28)' }}>
      {(full ? lista : lista.slice(0, 5)).map((s, i) => {
        const top = s.pos <= 6
        return (
          <div key={s.abv} style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', borderTop: i === 0 ? 'none' : `1px solid ${T.linea}` }}>
            <span style={{ width: 22, fontFamily: DISP, fontWeight: 900, fontSize: 15, color: top ? T.oro : T.tenue }}>{s.pos}</span>
            <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span style={{ width: 4, height: 18, borderRadius: 3, background: col(s.abv) }} />
              <span style={{ fontFamily: DISP, fontWeight: 900, fontSize: 15, color: T.texto }}>{s.abv}</span>
              <span style={{ fontSize: 11, color: T.tenue }}>{s.nombre}</span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.texto, fontVariantNumeric: 'tabular-nums' }}>{s.w}-{s.l}</span>
            <span style={{ width: 44, textAlign: 'right', fontSize: 11, color: T.tenue }}>{s.gb}</span>
            <span style={{ width: 30, textAlign: 'right', fontSize: 10, fontWeight: 800, color: s.racha[0] === 'G' ? T.verde : T.rojo }}>{s.racha}</span>
          </div>
        )
      })}
    </div>
  )
  const toggleConf = () => (
    <div style={{ display: 'flex', gap: 6, background: T.panelLiso, border: `1px solid ${T.borde}`, borderRadius: 11, padding: 4, marginBottom: 12, maxWidth: 320 }}>
      {['este', 'oeste'].map((c) => (
        <button key={c} onClick={() => setConf(c)} style={{ flex: 1, border: 0, background: conf === c ? `linear-gradient(150deg, ${T.vino}, #3a0a18)` : 'transparent', color: conf === c ? '#ffd0d8' : T.tenue, fontFamily: DISP, fontWeight: 800, fontSize: 13, letterSpacing: 0.5, padding: 8, borderRadius: 8, cursor: 'pointer', textTransform: 'capitalize' }}>{c}</button>
      ))}
    </div>
  )

  // ----- tarjeta de líder -----
  const tarjetaLider = (l) => (
    <div key={l.cat} style={{ width: esMovil ? 152 : 'auto', flex: grande ? '1 1 170px' : '0 0 auto', background: 'linear-gradient(165deg, #2a0c16, #140a0e)', border: '1px solid rgba(255,255,255,.10)', borderRadius: 16, padding: 14, position: 'relative', overflow: 'hidden', boxShadow: '0 12px 26px rgba(0,0,0,.3)' }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 90, height: 90, borderRadius: '50%', background: `radial-gradient(circle, ${T.glow2}, transparent 70%)` }} />
      <div style={{ fontFamily: DISP, fontWeight: 900, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: T.oroLt }}>{l.cat}</div>
      <div style={{ margin: '10px 0 8px' }}><Avatar foto={l.foto} abv={l.abv} color={col(l.equipo)} size={46} /></div>
      <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, lineHeight: 1.05, color: '#fff' }}>{l.nombre}</div>
      <div style={{ fontSize: 10.5, color: T.tenue, marginTop: 2 }}>{l.equipo} · {l.pos}</div>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: 30, marginTop: 9, fontVariantNumeric: 'tabular-nums', background: 'linear-gradient(120deg,#ffd37a,#e08a12)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{l.valor}<span style={{ fontSize: 11, color: T.tenue, WebkitTextFillColor: T.tenue, marginLeft: 4, fontFamily: FONT }}>{l.unidad}</span></div>
    </div>
  )

  // ----- noticia en lista (DISEÑO NBA original) — ahora se toca y abre el lector -----
  const filaNoticia = (n) => {
    const img = n.imagen || n.foto
    return (
      <div key={n.id} onClick={() => setNoticiaSel(n)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderTop: `1px solid ${T.linea}`, cursor: 'pointer' }}>
        <div style={{ width: 54, height: 54, borderRadius: 11, flexShrink: 0, background: img ? '#000' : `linear-gradient(140deg, ${T.vino}, #26101a)`, overflow: 'hidden' }}>{img && <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />}</div>
        <div style={{ minWidth: 0 }}>
          <h5 style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14.5, lineHeight: 1.15, color: T.texto, margin: 0 }}>{n.titulo}</h5>
          <div style={{ fontSize: 10, color: T.tenue, marginTop: 4 }}>{n.fuente} · {n.tiempo}</div>
        </div>
      </div>
    )
  }

  // (el lector de noticias ModalNoticia ahora vive a nivel de módulo, abajo,
  //  para que NO se reinicie el scroll cuando la pantalla se redibuja)

  // ============== PORTADA (carrusel de bombazos reales) ==============
  // Reparte las noticias reales: las 5 más recientes = carrusel de portada;
  // las siguientes = "Lo más importante"; el resto = "Más noticias".
  // NOTA: el Índice MC aquí es PROVISIONAL (por recencia). El motor real de
  // relevancia lo montamos después y reemplaza este número sin tocar el diseño.
  const conIndice = noticias.map((n, i) => ({ ...n, indice: Math.max(72, 98 - i * 3), breaking: i === 0 }))
  const portadaItems = conIndice.slice(0, 5)
  const destacadas = conIndice.slice(5, 9)
  const masNoticiasHoy = conIndice.slice(9)

  const portada = () => {
    if (!portadaItems.length) {
      return (
        <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${T.borde}`, marginTop: 4, height: grande ? 280 : 230, display: 'grid', placeItems: 'center', background: `linear-gradient(125deg, #0a0507 0%, ${T.vino} 60%, ${T.rojo} 100%)`, color: '#e7d6da', fontFamily: DISP, letterSpacing: 1, fontSize: 13 }}>
          Cargando bombazos de NBAManiacs…
        </div>
      )
    }
    const i = slideIdx % portadaItems.length
    const n = portadaItems[i]
    const meta = [n.tiempo, n.fuente].filter(Boolean)
    return (
      <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', border: `1px solid ${T.borde}`, boxShadow: '0 22px 54px rgba(0,0,0,.5)', marginTop: 4 }}>
        <div onClick={() => setNoticiaSel(n)} style={{ height: grande ? 280 : 230, position: 'relative', background: n.imagen ? '#000' : `linear-gradient(125deg, #0a0507 0%, ${T.vino} 60%, ${T.rojo} 100%)`, cursor: 'pointer' }}>
          {n.imagen && <img src={n.imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />}
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(80% 60% at 80% 26%, rgba(249,160,27,.22), transparent 58%)` }} />
          {n.breaking && <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 7, background: T.rojo, color: '#fff', fontFamily: DISP, fontWeight: 900, fontSize: 11, letterSpacing: 1.5, padding: '6px 11px', borderRadius: 7, boxShadow: `0 6px 18px ${T.rojo}66` }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />BOMBAZO</div>}
          <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(8,5,9,.55)', border: `1px solid ${T.oro}`, borderRadius: 20, padding: '5px 10px', backdropFilter: 'blur(6px)' }}>
            <span style={{ fontSize: 9, color: '#d8c9bf', textTransform: 'uppercase', letterSpacing: 1 }}>Índice MC</span>
            <b style={{ fontFamily: DISP, fontSize: 13, color: T.oro }}>{n.indice}</b><span>🔥</span>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: grande ? '46px 24px 24px' : '34px 18px 22px', background: 'linear-gradient(180deg, transparent, rgba(8,5,9,.55) 45%, rgba(8,5,9,.95))' }}>
            {n.tag && <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 11, letterSpacing: 1.5, color: T.oroLt, textTransform: 'uppercase' }}>{n.tag}</div>}
            <h3 style={{ fontFamily: DISP, fontWeight: 900, fontSize: grande ? 29 : 22, lineHeight: 1.08, margin: '5px 0 7px', color: '#fff', maxWidth: 720, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.titulo}</h3>
            <div style={{ fontSize: 11.5, color: '#cbbfc6', display: 'flex', gap: 10, flexWrap: 'wrap' }}>{meta.map((m, k) => <span key={k}>{k > 0 && <span style={{ marginRight: 10, opacity: .5 }}>•</span>}{m}</span>)}</div>
          </div>
        </div>
        {portadaItems.length > 1 && (
          <div style={{ position: 'absolute', bottom: 13, right: 16, display: 'flex', gap: 6, zIndex: 2 }}>
            {portadaItems.map((_, k) => (
              <span key={k} onClick={(e) => { e.stopPropagation(); setSlideIdx(k) }} style={{ width: k === i ? 20 : 7, height: 7, borderRadius: 4, background: k === i ? T.oro : 'rgba(255,255,255,.45)', cursor: 'pointer', transition: 'width .25s' }} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ============== contenido por pestaña ==============
  const strip = (children) => (
    grande
      ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11 }}>{children}</div>
      : <div style={{ display: 'flex', gap: 11, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>{children}</div>
  )

  const bloqueMasNoticias = (lista) => {
    if (!lista.length) {
      if (noticias.length) return null // ya salieron arriba; no dejamos hueco
      return (
        <>
          {eyebrow('Más', 'noticias')}
          <div style={{ padding: '22px 0', textAlign: 'center', color: T.tenue, fontSize: 13 }}>Cargando noticias de NBAManiacs…</div>
        </>
      )
    }
    return (
      <>
        {eyebrow('Más', 'noticias')}
        <div>{lista.map(filaNoticia)}</div>
      </>
    )
  }

  const vistaHoy = () => (
    <>
      {portada()}
      {eyebrow(juegosDB.length ? 'Últimos' : 'En', juegosDB.length ? 'juegos' : 'vivo y de hoy', 'Todos', () => setTab('resultados'))}
      {strip((juegosDB.length ? [...juegosDB].slice(-8).reverse() : juegos).map(tarjetaJuego))}

      {destacadas.length > 0 && (
        <>
          {eyebrow('Lo más', 'importante', 'Ver más', () => setTab('noticias'))}
          <div style={{ display: 'grid', gridTemplateColumns: grande ? '1fr 1fr' : '1fr', gap: 11 }}>{destacadas.map(tarjetaDestacada)}</div>
        </>
      )}

      {esEscritorio ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>
            {eyebrow('Clasificación', '', 'Completa', () => setTab('clasif'))}
            {toggleConf()}
            {tablaClasif(clasif[conf], false)}
            {bloqueMasNoticias(masNoticiasHoy)}
          </div>
          <div style={{ minWidth: 0 }}>
            {eyebrow('Líderes de la', 'liga', 'Todos', () => setTab('lideres'))}
            {strip(lideres.map(tarjetaLider))}
          </div>
        </div>
      ) : (
        <>
          {eyebrow('Clasificación', '', 'Completa', () => setTab('clasif'))}
          {toggleConf()}
          {tablaClasif(clasif[conf], false)}
          {eyebrow('Líderes de la', 'liga', 'Todos', () => setTab('lideres'))}
          {strip(lideres.map(tarjetaLider))}
          {bloqueMasNoticias(masNoticiasHoy)}
        </>
      )}
    </>
  )

  const vistaResultados = () => {
    if (juegosDB.length) {
      const grupos = {}
      juegosDB.forEach((g) => {
        const info = rondaInfo(g.ronda)
        if (!grupos[info.label]) grupos[info.label] = { label: info.label, orden: info.orden, juegos: [] }
        grupos[info.label].juegos.push(g)
      })
      const secciones = Object.values(grupos).sort((a, b) => a.orden - b.orden || a.label.localeCompare(b.label))
      secciones.forEach((s) => s.juegos.sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0)))
      return (
        <>
          {eyebrow('Playoffs', '2026')}
          {secciones.map((s) => (
            <div key={s.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '22px 0 11px' }}>
                <span style={{ width: 4, height: 15, borderRadius: 3, background: `linear-gradient(180deg, ${T.rojo}, ${T.oro})` }} />
                <span style={{ fontFamily: DISP, fontWeight: 900, fontSize: 13.5, letterSpacing: 0.4, color: T.texto }}>{s.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.tenue }}>{s.juegos.length} {s.juegos.length === 1 ? 'juego' : 'juegos'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: grande ? 'repeat(auto-fill, minmax(220px, 1fr))' : '1fr', gap: 11 }}>{s.juegos.map(tarjetaJuego)}</div>
            </div>
          ))}
          <div style={{ textAlign: 'center', fontSize: 11, color: T.tenue2, marginTop: 20 }}>Toca un juego pa' ver el box score completo.</div>
        </>
      )
    }
    return (
      <>
        {eyebrow('Resultados', 'y juegos')}
        <div style={{ display: 'grid', gridTemplateColumns: grande ? 'repeat(auto-fill, minmax(220px, 1fr))' : '1fr', gap: 11 }}>{juegos.map(tarjetaJuego)}</div>
      </>
    )
  }
  const vistaClasif = () => (
    <>
      {eyebrow('Clasificación', 'completa')}
      {toggleConf()}
      {tablaClasif(clasif[conf], true)}
    </>
  )
  // ----- fila del ranking ADN MC -----
  const filaAdn = (j, i) => (
    <div key={j.id} onClick={() => setJugadorSel(j.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderTop: i === 0 ? 'none' : `1px solid ${T.linea}`, cursor: 'pointer' }}>
      <span style={{ width: 24, textAlign: 'center', fontFamily: DISP, fontWeight: 900, fontSize: 15, color: i < 3 ? T.oro : T.tenue }}>{i + 1}</span>
      <Avatar abv={iniciales(j.nombre)} color={col(j.equipo)} size={38} radio={10} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14.5, color: T.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombre}</div>
        <div style={{ fontSize: 10.5, color: T.tenue, marginTop: 1 }}>{j.equipo}{j.pos ? ' · ' + j.pos : ''} · {j.pts.toFixed(1)} pts · {j.reb.toFixed(1)} reb · {j.ast.toFixed(1)} ast</div>
      </div>
      <div style={{ textAlign: 'center', minWidth: 44 }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: 20, color: T.oroLt, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{j.rating}</div>
        <div style={{ fontSize: 8.5, fontWeight: 800, color: T.tenue, letterSpacing: 1, marginTop: 2 }}>ADN MC</div>
      </div>
    </div>
  )

  // ----- tarjeta de una categoría: top 5 + "ver todos" -----
  const ordenarCat = (key) => [...adn].sort((a, b) => (b[key] || 0) - (a[key] || 0))
  const tarjetaCategoria = (cat) => {
    const top = ordenarCat(cat.key).slice(0, 5)
    if (!top.length) return null
    return (
      <div key={cat.id} style={{ background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 16, overflow: 'hidden' }}>
        <div onClick={() => setCatSel(cat)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${T.linea}`, cursor: 'pointer' }}>
          <span style={{ fontFamily: DISP, fontWeight: 900, fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase', color: T.oroLt }}>{cat.lbl}</span>
          <span style={{ fontFamily: DISP, fontWeight: 800, fontSize: 11, color: T.tenue }}>Ver todos ›</span>
        </div>
        {top.map((j, i) => (
          <div key={j.id} onClick={() => setJugadorSel(j.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderTop: i === 0 ? 'none' : `1px solid ${T.linea}`, cursor: 'pointer' }}>
            <span style={{ width: 18, textAlign: 'center', fontFamily: DISP, fontWeight: 900, fontSize: 13, color: i === 0 ? T.oro : T.tenue }}>{i + 1}</span>
            <Avatar abv={iniciales(j.nombre)} color={col(j.equipo)} size={30} radio={8} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13, color: T.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombre}</div>
              <div style={{ fontSize: 9.5, color: T.tenue }}>{j.equipo}</div>
            </div>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: 16, color: T.texto, fontVariantNumeric: 'tabular-nums' }}>{(j[cat.key] || 0).toFixed(1)}</span>
          </div>
        ))}
      </div>
    )
  }

  const vistaLideres = () => {
    const tope = adnExpandido ? 50 : 10
    return (
    <>
      {eyebrow('ADN MC', '· ranking', adn.length ? (adnExpandido ? 'Top ' + Math.min(adn.length, 50) : 'Top 10') : '', adn.length > 10 ? () => setAdnExpandido((v) => !v) : undefined)}
      {adnCargando
        ? <div style={{ padding: '26px 0', textAlign: 'center', color: T.tenue, fontSize: 13 }}>Calculando el ADN MC…</div>
        : adn.length
          ? <>
              <div style={{ background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 16, overflow: 'hidden' }}>{adn.slice(0, tope).map(filaAdn)}</div>
              {adn.length > 10 && (
                <div onClick={() => setAdnExpandido((v) => !v)} style={{ textAlign: 'center', marginTop: 10, padding: '10px', fontFamily: DISP, fontWeight: 800, fontSize: 12.5, letterSpacing: 0.4, color: T.oroLt, cursor: 'pointer' }}>
                  {adnExpandido ? 'Ver menos ⌃' : `Ver más (${Math.min(adn.length, 50) - 10}) ⌄`}
                </div>
              )}
            </>
          : <div style={{ padding: '20px 16px', textAlign: 'center', color: T.tenue, fontSize: 12.5, lineHeight: 1.5 }}>Aún no hay datos del ADN MC.<br />Corre el robot y crea la función nba_max_eff en Supabase.</div>}

      {eyebrow('Líderes por', 'categoría')}
      {adn.length
        ? <div style={{ display: 'grid', gridTemplateColumns: grande ? 'repeat(auto-fill, minmax(260px, 1fr))' : '1fr', gap: 12 }}>{CATS_MC.map(tarjetaCategoria)}</div>
        : <div style={{ display: 'grid', gridTemplateColumns: grande ? 'repeat(auto-fill, minmax(170px, 1fr))' : 'repeat(2, 1fr)', gap: 11 }}>{lideres.map(tarjetaLider)}</div>}
    </>
    )
  }
  const vistaEquipos = () => (
    <>
      {eyebrow('Equipos', 'de la NBA')}
      <div style={{ display: 'grid', gridTemplateColumns: grande ? 'repeat(auto-fill, minmax(150px, 1fr))' : 'repeat(2, 1fr)', gap: 11 }}>
        {equipos.map((abv) => (
          <div key={abv} onClick={() => setEquipoSel(abv)} style={{ background: T.panel, border: `1px solid ${T.borde}`, borderRadius: 14, padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}>
            <Avatar abv={abv} color={col(abv)} size={42} radio={11} />
            <div style={{ fontFamily: DISP, fontWeight: 900, fontSize: 17, color: T.texto }}>{abv}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: T.tenue2, marginTop: 16 }}>Toca un equipo pa' ver su plantilla.</div>
    </>
  )
  const vistaNoticias = () => {
    if (!noticias.length) return <div style={{ padding: '40px 0', textAlign: 'center', color: T.tenue }}>Cargando noticias de NBAManiacs…</div>
    return (
      <>
        {eyebrow('Todas las', 'noticias')}
        <div>{noticias.map(filaNoticia)}</div>
      </>
    )
  }

  const contenido = () => {
    if (tab === 'resultados') return vistaResultados()
    if (tab === 'clasif') return vistaClasif()
    if (tab === 'lideres') return vistaLideres()
    if (tab === 'equipos') return vistaEquipos()
    if (tab === 'noticias') return vistaNoticias()
    return vistaHoy()
  }

  return (
    <div className="nbaRoot" style={{ position: 'fixed', inset: 0, background: T.fondo, color: T.texto, fontFamily: FONT, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`.nbaRoot, .nbaRoot * { box-sizing: border-box; }`}</style>
      {/* brasas de fondo */}
      <div style={{ position: 'absolute', top: -120, left: -80, width: 360, height: 360, borderRadius: '50%', background: T.glow1, filter: 'blur(90px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -140, right: -100, width: 400, height: 400, borderRadius: '50%', background: T.glow2, filter: 'blur(100px)', pointerEvents: 'none' }} />

      {/* ===== HEADER (cuida safe-area arriba: reloj/fechas no chocan con el notch) ===== */}
      <div style={{ position: 'relative', zIndex: 3, flexShrink: 0, background: T.headerBg, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: `1px solid ${T.borde}`, paddingTop: esMovil ? 'env(safe-area-inset-top)' : 0 }}>
        <div style={{ maxWidth: ancho, margin: '0 auto', width: '100%', padding: `${esMovil ? 12 : 16}px ${padLat}px 0` }}>
          {/* fila marca */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
              <span onClick={() => onVolver && onVolver()} style={{ fontSize: grande ? 30 : 27, lineHeight: 1, color: T.texto, cursor: 'pointer', flexShrink: 0 }}>‹</span>
              <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'grid', placeItems: 'center', background: `linear-gradient(150deg, ${T.oroLt}, #e08a12)`, fontFamily: DISP, fontWeight: 900, color: '#241300', fontSize: 20, boxShadow: `0 4px 14px ${T.glow2}` }}>A</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: DISP, fontWeight: 900, fontSize: 15, letterSpacing: 0.5, color: T.texto, lineHeight: 1 }}>MEDIA CANCHA</div>
                <div style={{ fontSize: 10, color: T.tenue, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>Élite · Ligas</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: T.tenue, textTransform: 'capitalize', display: grande ? 'inline' : 'none' }}>{fecha}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: T.vino, border: '1px solid rgba(255,90,110,.4)', borderRadius: 20, padding: '6px 12px', boxShadow: `0 4px 14px ${T.rojo}55` }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.rojo }} />
                <b style={{ fontFamily: DISP, fontSize: 13, letterSpacing: 1.5, color: '#ffdde2' }}>NBA</b>
              </div>
            </div>
          </div>
          {/* pestañas */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, overflowX: 'auto', paddingBottom: 12 }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: '0 0 auto', fontFamily: DISP, fontWeight: 800, fontSize: 13, letterSpacing: 0.4, padding: '7px 14px', borderRadius: 9, border: tab === t.id ? 'none' : `1px solid ${T.borde}`, color: tab === t.id ? '#fff' : T.tenue, background: tab === t.id ? `linear-gradient(150deg, ${T.rojo}, ${T.vino})` : 'transparent', whiteSpace: 'nowrap', cursor: 'pointer', boxShadow: tab === t.id ? `0 4px 14px ${T.rojo}55` : 'none' }}>{t.txt}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== CUERPO ===== */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', overscrollBehaviorX: 'none', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: ancho, margin: '0 auto', width: '100%', padding: `4px ${padLat}px calc(env(safe-area-inset-bottom) + 40px)` }}>
          {contenido()}
          <div style={{ textAlign: 'center', fontSize: 10.5, color: T.tenue2, marginTop: 28, letterSpacing: 0.5 }}>Actualizado al instante · Fuente ESPN · by Andamio</div>
        </div>
      </div>

      {/* ===== LECTOR DE NOTICIA (dentro de la app) ===== */}
      {noticiaSel && <ModalNoticia n={noticiaSel} cerrar={() => setNoticiaSel(null)} />}
      {jugadorSel && <FichaJugador jugadorId={jugadorSel} maxEff={maxEff} cerrar={() => setJugadorSel(null)} />}
      {equipoSel && <PlantillaEquipo abv={equipoSel} abrirJugador={(id) => setJugadorSel(id)} cerrar={() => setEquipoSel(null)} />}
      {catSel && <ListaCategoria cat={catSel} lista={ordenarCat(catSel.key)} abrirJugador={(id) => setJugadorSel(id)} cerrar={() => setCatSel(null)} />}
      {juegoSel && <PartidoBox juego={juegoSel} abrirJugador={(id) => setJugadorSel(id)} cerrar={() => setJuegoSel(null)} />}
    </div>
  )
}