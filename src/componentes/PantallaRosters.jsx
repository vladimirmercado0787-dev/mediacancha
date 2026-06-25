import { useState, useEffect } from 'react'
import { Capacitor, CapacitorHttp } from '@capacitor/core'

// ============================================================
//  PLANTILLAS NBA — Media Cancha
//  Lista los 30 equipos; al tocar uno, muestra su roster completo
//  desde la API pública de ESPN (gratis, sin clave), con la posición,
//  el número y el ESTADO de disponibilidad de cada jugador.
//
//  "QUIÉN JUEGA HOY": el estado (Fuera / En duda / Disponible) se llena
//  con los reportes de lesión de ESPN. En verano (sin juegos) viene vacío;
//  se enciende solo cuando arranca la temporada.
//
//  FOTOS: iniciales en público. Si en ESTE teléfono está prendido el modo
//  privado (el de Noticias), salen las caras de ESPN.
// ============================================================

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'

const C = {
  fondo: '#070d1d',
  glow1: 'rgba(62,107,214,0.16)',
  glow2: 'rgba(47,191,113,0.10)',
  panel: 'rgba(255,255,255,0.045)',
  panelAlt: 'rgba(255,255,255,0.07)',
  borde: 'rgba(150,172,228,0.18)',
  texto: '#eef3fc',
  texto2: '#c2cce0',
  tenue: '#8a9bc0',
  tenue2: '#5d6c8c',
}

const NORM = { GS: 'GSW', NY: 'NYK', SA: 'SAS', NO: 'NOP', UTAH: 'UTA', UTH: 'UTA', WSH: 'WAS', PHO: 'PHX', NOR: 'NOP' }
const normAbv = (a) => { const x = (a || '').toUpperCase(); return NORM[x] || x }

// fetch con tope de tiempo; en el teléfono va por HTTP nativo (salta el CORS del WebView)
async function getJson(url, ms = 10000) {
  if (Capacitor.isNativePlatform()) {
    const resp = await CapacitorHttp.get({ url, headers: { accept: 'application/json' }, connectTimeout: ms, readTimeout: ms })
    if (resp.status < 200 || resp.status >= 300) throw new Error('HTTP ' + resp.status)
    return typeof resp.data === 'string' ? JSON.parse(resp.data) : resp.data
  }
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    return await r.json()
  } finally { clearTimeout(t) }
}

function iniciales(nombre) {
  const p = (nombre || '').trim().split(/\s+/)
  if (!p.length || !p[0]) return '?'
  if (p.length === 1) return p[0].slice(0, 3).toUpperCase()
  return (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

// Estado de disponibilidad a partir del reporte de lesión de ESPN
function estadoDe(at) {
  const inj = (at?.injuries && at.injuries[0]) || null
  const txt = (inj?.status || inj?.type?.description || at?.status?.type?.description || '').toString().toLowerCase()
  if (!txt) return null // sin info (en verano casi todos)
  if (txt.includes('out')) return { lbl: 'Fuera', c: '#FF5A5F' }
  if (txt.includes('doubt')) return { lbl: 'Dudoso', c: '#FF8A3D' }
  if (txt.includes('question') || txt.includes('day')) return { lbl: 'En duda', c: '#F5B82E' }
  if (txt.includes('probable') || txt.includes('available') || txt.includes('active')) return { lbl: 'Disponible', c: '#2FBF71' }
  return { lbl: inj?.status || 'En duda', c: '#F5B82E' }
}

// ---- ESPN: 30 equipos con su color ----
async function cargarEquipos() {
  const data = await getJson(BASE + '/teams')
  const lista = data?.sports?.[0]?.leagues?.[0]?.teams || []
  return lista.map((x) => {
    const t = x?.team || {}
    return {
      id: t.id,
      abv: normAbv(t.abbreviation),
      nombre: t.shortDisplayName || t.name || t.displayName || t.abbreviation,
      color: '#' + (t.color || '1d428a'),
    }
  }).filter((t) => t.id)
}

// ---- ESPN: roster de un equipo (maneja lista plana o agrupada por posición) ----
async function cargarRoster(teamId) {
  const data = await getJson(BASE + '/teams/' + teamId + '/roster')
  let crudos = []
  const ath = data?.athletes
  if (Array.isArray(ath) && ath.length && Array.isArray(ath[0]?.items)) {
    ath.forEach((g) => { (g.items || []).forEach((a) => crudos.push(a)) })
  } else if (Array.isArray(ath)) {
    crudos = ath
  }
  return crudos.map((a) => ({
    id: a.id,
    nombre: a.displayName || a.fullName || a.shortName || 'Jugador',
    num: a.jersey || '',
    pos: a.position?.abbreviation || a.position?.name || '',
    foto: a.headshot?.href || null,
    estado: estadoDe(a),
  }))
}

export default function PantallaRosters({ onVolver }) {
  const [equipos, setEquipos] = useState([])
  const [cargandoEq, setCargandoEq] = useState(true)
  const [errorEq, setErrorEq] = useState(null)

  const [sel, setSel] = useState(null)       // equipo seleccionado
  const [jugadores, setJugadores] = useState([])
  const [cargandoR, setCargandoR] = useState(false)
  const [errorR, setErrorR] = useState(null)

  const [esEscritorio, setEsEscritorio] = useState(false)
  const fotos = (() => { try { return localStorage.getItem('mc_noticias_pro') === '1' } catch (e) { return false } })()

  useEffect(() => {
    const ver = () => setEsEscritorio(window.innerWidth >= 900)
    ver(); window.addEventListener('resize', ver)
    return () => window.removeEventListener('resize', ver)
  }, [])

  useEffect(() => {
    let vivo = true
    cargarEquipos()
      .then((e) => { if (vivo) { setEquipos(e); setErrorEq(e.length ? null : 'No se pudieron cargar los equipos.') } })
      .catch((err) => { if (vivo) setErrorEq(String(err?.message || err)) })
      .finally(() => { if (vivo) setCargandoEq(false) })
    return () => { vivo = false }
  }, [])

  async function abrirEquipo(eq) {
    setSel(eq); setJugadores([]); setErrorR(null); setCargandoR(true)
    try {
      const r = await cargarRoster(eq.id)
      setJugadores(r)
      if (!r.length) setErrorR('Este equipo no tiene roster disponible ahora.')
    } catch (e) {
      setErrorR(String(e?.message || e))
    } finally { setCargandoR(false) }
  }

  const Avatar = ({ j, color }) => {
    const base = { flexShrink: 0, width: 44, height: 44, borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${color}55` }
    if (fotos && j.foto) {
      return <div style={{ ...base, background: '#0d1426' }}><img src={j.foto} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} /></div>
    }
    return <div style={{ ...base, display: 'grid', placeItems: 'center', background: `${color}1f`, color, fontWeight: 900, fontSize: 14 }}>{iniciales(j.nombre)}</div>
  }

  const Badge = ({ abv, color, size }) => (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, flexShrink: 0, display: 'grid', placeItems: 'center', background: `${color}26`, border: `1.5px solid ${color}`, color: '#fff', fontWeight: 900, fontSize: size * 0.32, letterSpacing: 0.3 }}>{abv}</div>
  )

  // ---------------- VISTA: ROSTER DE UN EQUIPO ----------------
  if (sel) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: C.fondo, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: FONT }}>
        <div style={{ position: 'absolute', top: -120, left: -80, width: 360, height: 360, borderRadius: '50%', background: sel.color + '22', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: 'rgba(7,13,29,0.86)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.borde}` }}>
          <div style={{ maxWidth: esEscritorio ? 720 : '100%', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
            <button onClick={() => setSel(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 11, border: `1px solid ${C.borde}`, background: C.panel, color: C.texto, fontSize: 19, cursor: 'pointer', flexShrink: 0 }}>‹</button>
            <Badge abv={sel.abv} color={sel.color} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.texto }}>{sel.nombre}</div>
              <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 1 }}>Plantilla {jugadores.length ? '· ' + jugadores.length + ' jugadores' : ''}</div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ maxWidth: esEscritorio ? 720 : '100%', margin: '0 auto', padding: '14px 16px calc(env(safe-area-inset-bottom) + 40px)' }}>

            <div style={{ fontSize: 11.5, color: C.tenue, lineHeight: 1.5, background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 12, padding: '10px 12px', marginBottom: 14 }}>
              Pretemporada: el estado diario de <strong style={{ color: C.texto2 }}>quién juega y quién no</strong> se activa cuando empiece la temporada. Por ahora ves la plantilla.
            </div>

            {cargandoR && <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, padding: '40px 0' }}>Cargando plantilla…</div>}
            {!cargandoR && errorR && <div style={{ textAlign: 'center', color: '#FF8A8E', fontSize: 13, padding: '30px 16px', lineHeight: 1.5, background: 'rgba(255,90,95,0.08)', border: '1px solid rgba(255,90,95,0.25)', borderRadius: 14 }}>{errorR}</div>}

            {!cargandoR && !errorR && jugadores.map((j) => (
              <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14, border: `1px solid ${C.borde}`, background: C.panel, padding: '10px 12px', marginBottom: 9 }}>
                <span style={{ width: 26, textAlign: 'center', fontSize: 13, fontWeight: 900, color: C.tenue2, flexShrink: 0 }}>{j.num || '—'}</span>
                <Avatar j={j} color={sel.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombre}</div>
                  <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 2 }}>{j.pos || 'NBA'}</div>
                </div>
                {j.estado
                  ? <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, color: j.estado.c, background: `${j.estado.c}1a`, border: `1px solid ${j.estado.c}45`, borderRadius: 20, padding: '4px 10px' }}>{j.estado.lbl}</span>
                  : <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: C.tenue2 }}>—</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ---------------- VISTA: LISTA DE EQUIPOS ----------------
  return (
    <div style={{ position: 'fixed', inset: 0, background: C.fondo, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: FONT }}>
      <div style={{ position: 'absolute', top: -120, left: -80, width: 360, height: 360, borderRadius: '50%', background: C.glow1, filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -140, right: -100, width: 400, height: 400, borderRadius: '50%', background: C.glow2, filter: 'blur(90px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: 'rgba(7,13,29,0.86)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.borde}` }}>
        <div style={{ maxWidth: esEscritorio ? 720 : '100%', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
          <button onClick={onVolver} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 11, border: `1px solid ${C.borde}`, background: C.panel, color: C.texto, fontSize: 19, cursor: 'pointer', flexShrink: 0 }}>‹</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.texto }}>Plantillas NBA</div>
            <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 1 }}>Los rosters de los 30 equipos</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: C.panel, border: `1px solid ${C.borde}`, fontSize: 18 }}>🏀</div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: esEscritorio ? 720 : '100%', margin: '0 auto', padding: '16px 16px calc(env(safe-area-inset-bottom) + 40px)' }}>

          {cargandoEq && <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, padding: '60px 0' }}>Cargando equipos…</div>}
          {!cargandoEq && errorEq && <div style={{ textAlign: 'center', color: '#FF8A8E', fontSize: 13, padding: '40px 16px', lineHeight: 1.5, background: 'rgba(255,90,95,0.08)', border: '1px solid rgba(255,90,95,0.25)', borderRadius: 14 }}>No se pudieron cargar los equipos.<br /><span style={{ fontSize: 11, color: C.tenue }}>{errorEq}</span></div>}

          {!cargandoEq && !errorEq && (
            <div style={{ display: 'grid', gridTemplateColumns: esEscritorio ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 10 }}>
              {equipos.map((eq) => (
                <button key={eq.id} onClick={() => abrirEquipo(eq)} style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', textAlign: 'left', borderRadius: 16, border: `1px solid ${C.borde}`, background: `linear-gradient(135deg, ${eq.color}1a, ${C.panel})`, padding: '12px 12px' }}>
                  <Badge abv={eq.abv} color={eq.color} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: C.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eq.nombre}</div>
                    <div style={{ fontSize: 10.5, color: C.tenue, marginTop: 2 }}>Ver plantilla ›</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}