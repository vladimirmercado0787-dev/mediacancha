import { useState, useEffect } from 'react'
import { aviso, confirmar } from './Avisos'
import { leerJuegosLiga, leerMiembrosLiga, leerCajaLiga, agregarMovimientoLiga, eliminarMovimientoLiga } from '../ligas'
import { lideresLiga, destacadosLiga } from '../ligaEstadisticas'
import { tieneGrupoActivo, activarGrupoLiga } from '../grupos'

// ============================================================
//  PANTALLA DE LIGA  (grupo menos formal que el torneo)
//  Identidad TURQUESA para diferenciarla del torneo (dorado).
//  Una liga: gente que se reúne un día fijo a jugar. Lleva
//  estadística igual, pero el modo de anotar es MÁS LIBRE:
//  fogueo, juego rápido, 1v1, 5v5... y todo cuenta.
//  Tiene inscripciones, invitaciones en nombre de la liga, y
//  su pequeña contabilidad, como el torneo.
//
//  NOTA: por ahora con datos de ejemplo (diseño). El guardado
//  de verdad (tabla 'ligas' + funciones) se conecta después.
// ============================================================

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const DISP = '"Arial Narrow", Impact, "Haettenschweiler", system-ui, sans-serif'

// ---- Paleta TURQUESA (la liga). El torneo es dorado; esta es teal. ----
const C = {
  fondo: '#04161a',
  glow: 'rgba(31,209,193,0.14)',
  panel: 'rgba(255,255,255,0.045)',
  card: 'rgba(255,255,255,0.055)',
  borde: 'rgba(110,205,196,0.18)',
  borde2: 'rgba(110,205,196,0.34)',
  txt: '#eafcf8',
  tenue: '#84b8b2',
  tenue2: '#56908a',
  teal: '#27d3c2',
  tealD: '#0e9c90',
  verde: '#3fbf7f',
  rojo: '#e0563f',
  ambar: '#f5b82e',
}
const TEAL_BTN = 'linear-gradient(150deg, #36e3d2, #0e9c90)'

// Modos de juego (libres). Cada uno con su color.
const MODOS = {
  fogueo: { txt: 'Fogueo', color: '#27d3c2' },
  rapido: { txt: 'Rápido', color: '#5fb0ec' },
  normal: { txt: 'Normal', color: '#9aa7b2' },
  '1v1': { txt: '1 vs 1', color: '#c98bff' },
  '3v3': { txt: '3 vs 3', color: '#f5b82e' },
  '5v5': { txt: '5 vs 5', color: '#3fbf7f' },
}
// Orden para el selector de modo al anotar
const MODOS_LISTA = [
  { id: 'fogueo', txt: 'Fogueo', desc: 'Amistoso, cuenta igual', color: '#27d3c2', emoji: '🤝' },
  { id: 'rapido', txt: 'Juego rápido', desc: 'Partido corto', color: '#5fb0ec', emoji: '⚡' },
  { id: 'normal', txt: 'Juego normal', desc: 'Partido completo', color: '#9aa7b2', emoji: '🏀' },
  { id: '1v1', txt: '1 vs 1', desc: 'Mano a mano', color: '#c98bff', emoji: '🤺' },
  { id: '3v3', txt: '3 vs 3', desc: 'Medio cancha', color: '#f5b82e', emoji: '🔼' },
  { id: '5v5', txt: '5 vs 5', desc: 'Cancha completa', color: '#3fbf7f', emoji: '🏀' },
]

// ---- Datos de ejemplo (diseño). Se reemplazan por datos reales después. ----
const LIGA_DEMO = {
  nombre: 'Liga Jícome',
  lugar: 'Cancha de Jícome, Valverde',
  dia: 'Martes y Jueves · 7:00 PM',
  emoji: '🤝',
  miembros: 18,
  jornadas: 6,
}
const JUEGOS_DEMO = [
  { id: 1, modo: '5v5', a: 'Los Tigres', b: 'Halcones', ptsA: 78, ptsB: 71, fecha: 'Jue 24 jun' },
  { id: 2, modo: '3v3', a: 'Equipo Rojo', b: 'Equipo Azul', ptsA: 21, ptsB: 18, fecha: 'Mar 22 jun' },
  { id: 3, modo: '1v1', a: 'E. Mercado', b: 'J. Brito', ptsA: 11, ptsB: 9, fecha: 'Mar 22 jun' },
  { id: 4, modo: 'fogueo', a: 'Veteranos', b: 'Novatos', ptsA: 64, ptsB: 60, fecha: 'Jue 17 jun' },
]
const MIEMBROS_DEMO = [
  { id: 1, nombre: 'Elvin Mercado', pos: 'Base', jj: 6 },
  { id: 2, nombre: 'Junior Brito', pos: 'Escolta', jj: 6 },
  { id: 3, nombre: 'Héctor Tavárez', pos: 'Pívot', jj: 5 },
  { id: 4, nombre: 'Pedro Julio', pos: 'Alero', jj: 5 },
  { id: 5, nombre: 'Ramón Ramírez', pos: 'Ala-pívot', jj: 4 },
]
const LIDERES_DEMO = [
  { stat: 'Puntos', emoji: '🏀', jugador: 'E. Mercado', valor: '24.6', color: '#27d3c2' },
  { stat: 'Asistencias', emoji: '🤝', jugador: 'J. Brito', valor: '8.4', color: '#5fb0ec' },
  { stat: 'Rebotes', emoji: '💪', jugador: 'H. Tavárez', valor: '11.2', color: '#3fbf7f' },
  { stat: 'Robos', emoji: '✋', jugador: 'P. Julio', valor: '3.0', color: '#c98bff' },
]
const CAJA_DEMO = { saldo: 4200, movs: [
  { id: 1, tipo: 'ingreso', concepto: 'Inscripción miembros', monto: 5400, fecha: 'Jun' },
  { id: 2, tipo: 'gasto', concepto: 'Balones y silbatos', monto: 1200, fecha: 'Jun' },
] }

const PESTANAS = [
  { id: 'resumen', txt: 'Resumen', icono: '📋' },
  { id: 'miembros', txt: 'Miembros', icono: '👥' },
  { id: 'juegos', txt: 'Juegos', icono: '🏀' },
  { id: 'lideres', txt: 'Líderes', icono: '🏅' },
  { id: 'caja', txt: 'Caja', icono: '💰' },
]

export default function PantallaLiga({ liga, onVolver, onAnotar, onInvitar, onAbrirGrupo }) {
  // Mezcla la liga real (si llega) sobre la de ejemplo, para que el encabezado
  // muestre los datos verdaderos y las pestañas conserven el demo por ahora.
  const DIA_LBL = { lun: 'Lun', mar: 'Mar', mie: 'Mié', jue: 'Jue', vie: 'Vie', sab: 'Sáb', dom: 'Dom' }
  const L = { ...LIGA_DEMO, ...(liga || {}) }
  if (liga && Array.isArray(liga.dias)) {
    L.dia = liga.dias.length === 7 ? 'Todos los días' : (liga.dias.length ? liga.dias.map((d) => DIA_LBL[d] || d).join(' · ') : LIGA_DEMO.dia)
  }
  const esReal = !!(liga && liga.id)

  const [pestana, setPestana] = useState('resumen')
  const [modoPicker, setModoPicker] = useState(false)

  // Grupo de chat de la liga: si ya está activo, y activarlo a mano.
  const [grupoActivo, setGrupoActivo] = useState(false)
  const [activandoGrupo, setActivandoGrupo] = useState(false)
  const [pedirConfirmarGrupo, setPedirConfirmarGrupo] = useState(false)
  useEffect(() => {
    if (!esReal) return
    tieneGrupoActivo('liga', L.id).then(setGrupoActivo).catch(() => {})
  }, [esReal, L.id])
  const botonGrupoTocado = () => { if (grupoActivo) { activarGrupo() } else { setPedirConfirmarGrupo(true) } }
  const activarGrupo = async () => {
    setPedirConfirmarGrupo(false)
    setActivandoGrupo(true)
    const grupoId = await activarGrupoLiga(L.id, L.nombre)
    setActivandoGrupo(false)
    setGrupoActivo(true)
    onAbrirGrupo && grupoId && onAbrirGrupo({ id: grupoId, nombre: L.nombre, tipo: 'liga' })
  }

  // Juegos reales de esta liga
  const [juegos, setJuegos] = useState([])
  const [cargandoJuegos, setCargandoJuegos] = useState(true)

  // Miembros reales de esta liga
  const [miembros, setMiembros] = useState([])
  const [cargandoMiembros, setCargandoMiembros] = useState(true)

  // Caja real de la liga
  const [caja, setCaja] = useState([])
  const [cargandoCaja, setCargandoCaja] = useState(true)
  const [movModal, setMovModal] = useState(null) // null | { tipo, monto, concepto, categoria, miembro }

  useEffect(() => {
    if (!esReal) { setJuegos([]); setCargandoJuegos(false); return }
    let vivo = true
    setCargandoJuegos(true)
    leerJuegosLiga(liga.id)
      .then(({ juegos }) => { if (vivo) setJuegos(juegos || []) })
      .catch(() => { if (vivo) setJuegos([]) })
      .finally(() => { if (vivo) setCargandoJuegos(false) })
    return () => { vivo = false }
  }, [liga && liga.id])

  useEffect(() => {
    if (!esReal) { setMiembros([]); setCargandoMiembros(false); return }
    let vivo = true
    setCargandoMiembros(true)
    leerMiembrosLiga(liga.id)
      .then(({ miembros }) => { if (vivo) setMiembros(miembros || []) })
      .catch(() => { if (vivo) setMiembros([]) })
      .finally(() => { if (vivo) setCargandoMiembros(false) })
    return () => { vivo = false }
  }, [liga && liga.id])

  const cargarCaja = () => {
    if (!esReal) { setCaja([]); setCargandoCaja(false); return }
    setCargandoCaja(true)
    leerCajaLiga(liga.id)
      .then(({ caja }) => setCaja(caja || []))
      .catch(() => setCaja([]))
      .finally(() => setCargandoCaja(false))
  }
  useEffect(() => { let v = true; if (v) cargarCaja(); return () => { v = false } }, [liga && liga.id])

  const saldoCaja = caja.reduce((s, m) => s + (m.tipo === 'egreso' ? -1 : 1) * (Number(m.monto) || 0), 0)
  const guardarMovimiento = async () => {
    const m = movModal
    if (!m || !esReal) return
    const monto = Number(m.monto) || 0
    if (monto <= 0) { aviso('Escribe un monto válido'); return }
    const concepto = (m.concepto || '').trim() || (m.categoria === 'cuota' ? 'Cuota de miembro' : (m.tipo === 'egreso' ? 'Gasto' : 'Ingreso'))
    const datos = {
      tipo: m.tipo, categoria: m.categoria || null, concepto, monto,
      miembro_id: m.miembro ? m.miembro.perfil_id : null,
      miembro_nombre: m.miembro ? `${(m.miembro.perfil && m.miembro.perfil.nombre) || ''} ${(m.miembro.perfil && m.miembro.perfil.apellido) || ''}`.trim() : null,
    }
    const { error } = await agregarMovimientoLiga(liga.id, datos)
    if (error) { aviso('No se pudo guardar: ' + error); return }
    setMovModal(null); cargarCaja()
  }
  const borrarMovimiento = async (id) => {
    if (!(await confirmar('¿Borrar este movimiento?'))) return
    const { error } = await eliminarMovimientoLiga(id)
    if (!error) cargarCaja()
  }

  // Convierte un juego real de la BD al formato que dibuja la tarjeta
  const fechaCorta = (iso) => { try { return new Date(iso).toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric', month: 'short' }) } catch (e) { return '' } }
  const aCard = (g) => ({ id: g.id, modo: g.modo, a: g.nombre_a, b: g.nombre_b, ptsA: g.puntos_a, ptsB: g.puntos_b, fecha: fechaCorta(g.creado_en) })
  // Lista lista para mostrar: reales si la liga es real, demo si es ejemplo
  const juegosCard = esReal ? juegos.map(aCard) : JUEGOS_DEMO
  // Líderes reales de la liga (se llenan según pasan los juegos)
  const lidReal = lideresLiga(esReal ? juegos : [])
  const destReal = destacadosLiga(esReal ? juegos : [])

  const pesoRD = (n) => 'RD$' + (n || 0).toLocaleString('es-DO')

  const Badge = ({ color, children }) => (
    <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5, padding: '3px 9px', borderRadius: 8, textTransform: 'uppercase', color, background: `${color}22` }}>{children}</span>
  )
  const Tarjeta = ({ children, pad = 16 }) => (
    <div style={{ background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 14, padding: pad, marginBottom: 12 }}>{children}</div>
  )
  const TituloSec = ({ children }) => (
    <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: C.teal, marginBottom: 10 }}>{children}</div>
  )

  const tarjetaJuego = (j) => {
    const m = MODOS[j.modo] || MODOS.fogueo
    const ganaA = j.ptsA >= j.ptsB
    return (
      <div key={j.id} style={{ background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 13, padding: 13, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <Badge color={m.color}>{m.txt}</Badge>
          <span style={{ fontSize: 11, color: C.tenue2 }}>{j.fecha}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: ganaA ? 800 : 600, color: ganaA ? C.txt : C.tenue }}>{j.a}</div>
          <div style={{ fontFamily: DISP, fontSize: 22, fontWeight: 900, color: ganaA ? C.teal : C.tenue }}>{j.ptsA}</div>
          <span style={{ color: C.tenue2, fontSize: 12 }}>—</span>
          <div style={{ fontFamily: DISP, fontSize: 22, fontWeight: 900, color: !ganaA ? C.teal : C.tenue }}>{j.ptsB}</div>
          <div style={{ flex: 1, textAlign: 'right', fontSize: 14, fontWeight: !ganaA ? 800 : 600, color: !ganaA ? C.txt : C.tenue }}>{j.b}</div>
        </div>
      </div>
    )
  }

  let contenido = null
  if (pestana === 'resumen') {
    contenido = (
      <>
        <Tarjeta>
          <div style={{ display: 'flex', gap: 12, textAlign: 'center' }}>
            {[['Miembros', esReal ? (cargandoMiembros ? '—' : miembros.length) : L.miembros], ['Jornadas', esReal ? '—' : L.jornadas], ['Juegos', juegosCard.length]].map(([t, v]) => (
              <div key={t} style={{ flex: 1 }}>
                <div style={{ fontFamily: DISP, fontSize: 30, fontWeight: 900, color: C.teal }}>{v}</div>
                <div style={{ fontSize: 11, color: C.tenue, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t}</div>
              </div>
            ))}
          </div>
        </Tarjeta>
        <Tarjeta>
          <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 4 }}>Próxima jornada</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.txt }}>{L.dia}</div>
          <div style={{ fontSize: 12.5, color: C.tenue2, marginTop: 4 }}>📍 {L.lugar}</div>
        </Tarjeta>
        <button onClick={() => setModoPicker(true)} style={{ width: '100%', border: 'none', borderRadius: 12, padding: '14px 0', background: TEAL_BTN, color: '#04161a', fontSize: 15, fontWeight: 800, cursor: 'pointer', marginBottom: 16 }}>🏀 Anotar un juego</button>
        <TituloSec>Últimos juegos</TituloSec>
        {cargandoJuegos && esReal ? (
          <div style={{ color: C.tenue, fontSize: 13, padding: '8px 2px' }}>Cargando…</div>
        ) : juegosCard.length === 0 ? (
          <div style={{ color: C.tenue, fontSize: 13, padding: '8px 2px', lineHeight: 1.5 }}>Todavía no hay juegos. Anota el primero con el botón de arriba.</div>
        ) : juegosCard.slice(0, 3).map(tarjetaJuego)}
      </>
    )
  } else if (pestana === 'miembros') {
    const ROL_LBL = { admin: 'Dueño', presidente: 'Presidente', vice: 'Vicepresidente', tesorero: 'Tesorero', miembro: 'Miembro' }
    const nombreMiembro = (m) => `${(m.perfil && m.perfil.nombre) || ''} ${(m.perfil && m.perfil.apellido) || ''}`.trim() || 'Miembro'
    contenido = (
      <>
        <button onClick={() => onInvitar && onInvitar()} style={{ width: '100%', border: 'none', borderRadius: 12, padding: '14px 0', background: TEAL_BTN, color: '#04161a', fontSize: 15, fontWeight: 800, cursor: 'pointer', marginBottom: 16 }}>＋ Invitar miembros</button>

        <button onClick={botonGrupoTocado} disabled={activandoGrupo} style={{ width: '100%', border: `1px solid ${C.borde2}`, borderRadius: 12, padding: '13px 0', background: C.card, color: C.teal, fontSize: 14, fontWeight: 800, cursor: activandoGrupo ? 'default' : 'pointer', marginBottom: 16, opacity: activandoGrupo ? 0.6 : 1 }}>
          {activandoGrupo ? 'Activando…' : grupoActivo ? '💬 Abrir grupo de chat' : '💬 Crear grupo de chat de la liga'}
        </button>

        {pedirConfirmarGrupo && (
          <div onClick={() => setPedirConfirmarGrupo(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-end' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: C.fondo, borderTop: `1px solid ${C.borde}`, borderRadius: '20px 20px 0 0', padding: '20px 20px calc(env(safe-area-inset-bottom) + 20px)' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: C.borde2, margin: '0 auto 16px' }} />
              <div style={{ fontSize: 16, fontWeight: 800, color: C.txt, marginBottom: 6 }}>¿Crear el grupo de chat?</div>
              <div style={{ fontSize: 13, color: C.tenue, lineHeight: 1.5, marginBottom: 18 }}>Se va a crear un chat de grupo con todos los miembros de "{L.nombre}". Cada vez que alguien entre o salga de la liga, el chat se actualiza solo.</div>
              <button onClick={activarGrupo} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 13, background: TEAL_BTN, color: '#04161a', fontWeight: 800, fontSize: 14.5, cursor: 'pointer', marginBottom: 10 }}>Sí, crear el grupo</button>
              <button onClick={() => setPedirConfirmarGrupo(false)} style={{ width: '100%', border: `1px solid ${C.borde}`, borderRadius: 12, padding: 12, background: 'transparent', color: C.tenue, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}
        {!esReal ? (
          <>
            <TituloSec>{MIEMBROS_DEMO.length} miembros</TituloSec>
            {MIEMBROS_DEMO.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 12, marginBottom: 9 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: TEAL_BTN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#04161a' }}>{m.nombre.slice(0, 1)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: C.txt }}>{m.nombre}</div>
                  <div style={{ fontSize: 11.5, color: C.tenue }}>{m.pos} · {m.jj} juegos</div>
                </div>
              </div>
            ))}
          </>
        ) : cargandoMiembros ? (
          <div style={{ color: C.tenue, fontSize: 13, padding: '6px 2px' }}>Cargando miembros…</div>
        ) : miembros.length === 0 ? (
          <div style={{ color: C.tenue, fontSize: 13, padding: '6px 2px', lineHeight: 1.5 }}>Todavía no hay miembros. Invita al primero con el botón de arriba.</div>
        ) : (
          <>
            <TituloSec>{miembros.length} {miembros.length === 1 ? 'miembro' : 'miembros'}</TituloSec>
            {miembros.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 12, marginBottom: 9 }}>
                <span style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: (m.perfil && m.perfil.foto_url) ? `url(${m.perfil.foto_url}) center/cover` : TEAL_BTN, fontSize: 15, fontWeight: 800, color: '#04161a' }}>{!(m.perfil && m.perfil.foto_url) && nombreMiembro(m).slice(0, 1).toUpperCase()}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreMiembro(m)}</div>
                  <div style={{ fontSize: 11.5, color: C.tenue }}>{ROL_LBL[m.rol] || 'Miembro'}</div>
                </div>
                {m.rol === 'admin' && <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: C.teal, background: `${C.teal}22`, padding: '4px 10px', borderRadius: 8 }}>Dueño</span>}
              </div>
            ))}
          </>
        )}
      </>
    )
  } else if (pestana === 'juegos') {
    contenido = (
      <>
        <button onClick={() => setModoPicker(true)} style={{ width: '100%', border: 'none', borderRadius: 12, padding: '14px 0', background: TEAL_BTN, color: '#04161a', fontSize: 15, fontWeight: 800, cursor: 'pointer', marginBottom: 16 }}>🏀 Anotar un juego</button>
        <div style={{ fontSize: 12, color: C.tenue, marginBottom: 12, lineHeight: 1.5 }}>El modo es libre: fogueo, rápido, uno-contra-uno, tres-contra-tres, cinco-contra-cinco. Todo se anota y todo cuenta para la estadística.</div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.values(MODOS).map((m) => <Badge key={m.txt} color={m.color}>{m.txt}</Badge>)}
        </div>
        {cargandoJuegos && esReal ? (
          <div style={{ color: C.tenue, fontSize: 13, padding: '8px 2px' }}>Cargando juegos…</div>
        ) : juegosCard.length === 0 ? (
          <div style={{ color: C.tenue, fontSize: 13, padding: '8px 2px', lineHeight: 1.5 }}>Todavía no hay juegos en esta liga. Anota el primero con el botón de arriba.</div>
        ) : juegosCard.map(tarjetaJuego)}
      </>
    )
  } else if (pestana === 'lideres') {
    const fila = (rank, nombre, sub, valor, etiqueta, color) => (
      <div key={nombre + rank} style={{ display: 'flex', alignItems: 'center', gap: 13, background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 13, marginBottom: 9 }}>
        <div style={{ fontFamily: DISP, fontSize: 20, fontWeight: 900, width: 22, textAlign: 'center', color: rank === 1 ? C.ambar : C.tenue2 }}>{rank}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</div>
          {sub && <div style={{ fontSize: 11, color: C.tenue }}>{sub}</div>}
        </div>
        <div style={{ fontFamily: DISP, fontSize: 24, fontWeight: 900, color: color || C.teal }}>{valor}<span style={{ fontSize: 10.5, color: C.tenue2, marginLeft: 3 }}>{etiqueta}</span></div>
      </div>
    )
    let cuerpo
    if (!esReal) {
      cuerpo = <div style={{ color: C.tenue, fontSize: 13, padding: '8px 2px' }}>Datos de ejemplo.</div>
    } else if (lidReal.hayDatos && lidReal.puntos.length) {
      cuerpo = lidReal.puntos.slice(0, 8).map((p, i) => fila(i + 1, p.nombre, `${p.juegos} juego${p.juegos === 1 ? '' : 's'}`, Math.round(p.prom * 10) / 10, 'PPJ', i === 0 ? C.teal : C.txt))
    } else if (destReal.length) {
      cuerpo = destReal.slice(0, 8).map((d, i) => fila(i + 1, d.nombre, 'Jugador del partido', d.veces, '×', i === 0 ? C.teal : C.txt))
    } else {
      cuerpo = (
        <div style={{ ...{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 14, padding: 22 }, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏅</div>
          <div style={{ color: C.txt, fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>Los líderes se llenan solos</div>
          <div style={{ color: C.tenue, fontSize: 12.5, lineHeight: 1.5 }}>Apenas anotes juegos con estadísticas, aquí aparecen los mejores de la liga.</div>
        </div>
      )
    }
    contenido = (
      <>
        <TituloSec>Líderes de la liga</TituloSec>
        {cuerpo}
      </>
    )
  } else if (pestana === 'caja') {
    const CAT_LBL = { cuota: 'Cuota', inscripcion: 'Inscripción', arbitros: 'Árbitros', equipo: 'Equipo', otro: 'Otro' }
    contenido = (
      <>
        <Tarjeta pad={20}>
          <div style={{ fontSize: 12, color: C.tenue, textTransform: 'uppercase', letterSpacing: 1 }}>Saldo de la liga</div>
          <div style={{ fontFamily: DISP, fontSize: 40, fontWeight: 900, color: saldoCaja < 0 ? C.rojo : C.teal, marginTop: 4 }}>{pesoRD(saldoCaja)}</div>
        </Tarjeta>

        {esReal && (
          <div style={{ display: 'flex', gap: 9, marginBottom: 16 }}>
            <button onClick={() => setMovModal({ tipo: 'ingreso', categoria: 'cuota', monto: '', concepto: '', miembro: null })} style={{ flex: 1, border: 'none', borderRadius: 12, padding: '13px 0', background: TEAL_BTN, color: '#04161a', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>💵 Cobrar cuota</button>
            <button onClick={() => setMovModal({ tipo: 'egreso', categoria: 'otro', monto: '', concepto: '', miembro: null })} style={{ flex: 1, border: `1px solid ${C.borde2}`, borderRadius: 12, padding: '13px 0', background: 'transparent', color: C.teal, fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>+ Movimiento</button>
          </div>
        )}

        <TituloSec>Movimientos</TituloSec>
        {!esReal ? (
          <div style={{ color: C.tenue, fontSize: 13, padding: '8px 2px' }}>Datos de ejemplo.</div>
        ) : cargandoCaja ? (
          <div style={{ color: C.tenue, fontSize: 13, padding: '8px 2px' }}>Cargando la caja…</div>
        ) : caja.length === 0 ? (
          <div style={{ color: C.tenue, fontSize: 13, padding: '8px 2px', lineHeight: 1.5 }}>Todavía no hay movimientos. Registra una cuota o un gasto con los botones de arriba.</div>
        ) : caja.map((m) => {
          const ing = m.tipo !== 'egreso'
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 13, marginBottom: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: ing ? 'rgba(63,191,127,.15)' : 'rgba(224,86,63,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{ing ? '↘' : '↗'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.concepto}{m.miembro_nombre ? ` · ${m.miembro_nombre}` : ''}</div>
                <div style={{ fontSize: 11, color: C.tenue }}>{m.categoria ? (CAT_LBL[m.categoria] || m.categoria) + ' · ' : ''}{fechaCorta(m.creado_en)}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: ing ? C.verde : C.rojo, whiteSpace: 'nowrap' }}>{ing ? '+' : '−'}{pesoRD(m.monto)}</div>
              <button onClick={() => borrarMovimiento(m.id)} style={{ border: 'none', background: 'transparent', color: C.tenue2, fontSize: 16, cursor: 'pointer', padding: '0 2px', flexShrink: 0 }}>✕</button>
            </div>
          )
        })}
      </>
    )
  }

  return (
    <div style={{ fontFamily: FONT, color: C.txt, background: C.fondo, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 70% 36% at 50% 0%, ${C.glow}, transparent 72%)` }} />

      {/* HEADER */}
      <div style={{ position: 'relative', zIndex: 3, flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: C.panel, borderBottom: `0.5px solid ${C.borde}` }}>
        {/* franja turquesa (en vez del tricolor del torneo) para diferenciar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #0e9c90, #36e3d2, #0e9c90)', maxWidth: 760, margin: '0 auto' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 12px', maxWidth: 760, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <button onClick={onVolver} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,.06)', color: C.txt, fontSize: 22, cursor: 'pointer' }}>‹</button>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: TEAL_BTN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 }}>{L.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DISP, fontSize: 19, fontWeight: 900, letterSpacing: 0.3, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: C.txt }}>{L.nombre}</div>
            <div style={{ fontSize: 11.5, color: C.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{L.dia}</div>
          </div>
          <span style={{ flexShrink: 0, background: TEAL_BTN, color: '#04161a', fontSize: 11, fontWeight: 800, padding: '6px 12px', borderRadius: 16, letterSpacing: 0.5 }}>LIGA</span>
        </div>

        {/* pestañas */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 12px 10px', WebkitOverflowScrolling: 'touch', maxWidth: 760, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {PESTANAS.map((p) => {
            const activa = p.id === pestana
            return (
              <button key={p.id} onClick={() => setPestana(p.id)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 20, border: activa ? 'none' : `0.5px solid ${C.borde}`, background: activa ? TEAL_BTN : 'rgba(255,255,255,.04)', color: activa ? '#04161a' : C.tenue, fontFamily: DISP, fontSize: 13.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 13 }}>{p.icono}</span>{p.txt}
              </button>
            )
          })}
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 14px 40px' }}>
          {!esReal && (
            <div style={{ fontSize: 10.5, color: C.tenue2, textAlign: 'center', marginBottom: 14, fontStyle: 'italic' }}>
              Datos de ejemplo · el diseño de la liga (el guardado real se conecta después)
            </div>
          )}
          {contenido}
        </div>
      </div>

      {/* MODAL: registrar movimiento / cobrar cuota */}
      {movModal && (
        <div onClick={() => setMovModal(null)} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.66)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: C.fondo, borderTopLeftRadius: 24, borderTopRightRadius: 24, border: `1px solid ${C.borde}`, padding: '0 0 calc(env(safe-area-inset-bottom) + 20px)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ height: 4, background: 'linear-gradient(90deg, #0e9c90, #36e3d2, #0e9c90)' }} />
            <div style={{ padding: '18px 18px 0' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.txt, marginBottom: 14 }}>{movModal.categoria === 'cuota' ? 'Cobrar cuota' : 'Registrar movimiento'}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[['ingreso', 'Ingreso'], ['egreso', 'Gasto']].map(([id, txt]) => {
                  const on = movModal.tipo === id
                  return <button key={id} onClick={() => setMovModal((s) => ({ ...s, tipo: id }))} style={{ flex: 1, border: on ? 'none' : `1px solid ${C.borde}`, background: on ? (id === 'ingreso' ? 'rgba(63,191,127,.2)' : 'rgba(224,86,63,.2)') : 'transparent', color: on ? (id === 'ingreso' ? C.verde : C.rojo) : C.tenue, borderRadius: 12, padding: '11px 0', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>{txt}</button>
                })}
              </div>
              <input value={movModal.monto} onChange={(e) => setMovModal((s) => ({ ...s, monto: e.target.value.replace(/[^0-9.]/g, '') }))} inputMode="decimal" placeholder="Monto (RD$)" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,.05)', border: `1px solid ${C.borde}`, borderRadius: 12, padding: '12px 14px', color: C.txt, fontSize: 16, outline: 'none', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
                {[['cuota', 'Cuota'], ['inscripcion', 'Inscripción'], ['arbitros', 'Árbitros'], ['equipo', 'Equipo'], ['otro', 'Otro']].map(([id, txt]) => {
                  const on = movModal.categoria === id
                  return <button key={id} onClick={() => setMovModal((s) => ({ ...s, categoria: id, miembro: id === 'cuota' ? s.miembro : null }))} style={{ border: on ? 'none' : `1px solid ${C.borde}`, background: on ? TEAL_BTN : 'transparent', color: on ? '#04161a' : C.tenue, borderRadius: 18, padding: '7px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>{txt}</button>
                })}
              </div>
              {movModal.categoria === 'cuota' && esReal && (
                miembros.length === 0
                  ? <div style={{ fontSize: 12, color: C.tenue, marginBottom: 10 }}>Aún no hay miembros para asignar la cuota. Igual puedes registrarla sin miembro.</div>
                  : <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10, maxHeight: 130, overflowY: 'auto' }}>
                      {miembros.map((mm) => {
                        const nom = `${(mm.perfil && mm.perfil.nombre) || ''} ${(mm.perfil && mm.perfil.apellido) || ''}`.trim() || 'Miembro'
                        const on = movModal.miembro && movModal.miembro.perfil_id === mm.perfil_id
                        return <button key={mm.id} onClick={() => setMovModal((s) => ({ ...s, miembro: on ? null : mm }))} style={{ border: on ? 'none' : `1px solid ${C.borde}`, background: on ? TEAL_BTN : 'transparent', color: on ? '#04161a' : C.tenue, borderRadius: 16, padding: '7px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>{nom}</button>
                      })}
                    </div>
              )}
              <input value={movModal.concepto} onChange={(e) => setMovModal((s) => ({ ...s, concepto: e.target.value }))} placeholder={movModal.categoria === 'cuota' ? 'Concepto (ej: Cuota de junio)' : 'Concepto (opcional)'} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,.05)', border: `1px solid ${C.borde}`, borderRadius: 12, padding: '12px 14px', color: C.txt, fontSize: 15, outline: 'none', marginBottom: 16 }} />
              <button onClick={guardarMovimiento} style={{ width: '100%', border: 'none', borderRadius: 14, padding: 14, background: TEAL_BTN, color: '#04161a', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>Guardar</button>
              <button onClick={() => setMovModal(null)} style={{ width: '100%', marginTop: 10, padding: 13, borderRadius: 14, border: 'none', background: 'rgba(255,255,255,.06)', color: C.tenue, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: elegir modo para anotar */}
      {modoPicker && (
        <div onClick={() => setModoPicker(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.66)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: C.fondo, borderTopLeftRadius: 24, borderTopRightRadius: 24, border: `1px solid ${C.borde}`, padding: '0 0 calc(env(safe-area-inset-bottom) + 20px)' }}>
            <div style={{ height: 4, background: 'linear-gradient(90deg, #0e9c90, #36e3d2, #0e9c90)' }} />
            <div style={{ padding: '18px 18px 0' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.txt, marginBottom: 4 }}>¿Qué van a jugar?</div>
              <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 16, lineHeight: 1.5 }}>Elige el modo. Después anotas con el mismo sistema de siempre, y las estadísticas se pueden editar en el juego.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 8 }}>
                {MODOS_LISTA.map((m) => (
                  <button key={m.id} onClick={() => { setModoPicker(false); onAnotar && onAnotar(m.id) }} style={{ display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', border: `1px solid ${C.borde}`, background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: '13px 14px', cursor: 'pointer' }}>
                    <span style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: 'grid', placeItems: 'center', background: `${m.color}22`, fontSize: 20 }}>{m.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: m.color }}>{m.txt}</div>
                      <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 1 }}>{m.desc}</div>
                    </div>
                    <span style={{ fontSize: 22, color: C.tenue2 }}>›</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setModoPicker(false)} style={{ width: '100%', marginTop: 10, padding: 13, borderRadius: 14, border: 'none', background: 'rgba(255,255,255,.06)', color: C.tenue, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}