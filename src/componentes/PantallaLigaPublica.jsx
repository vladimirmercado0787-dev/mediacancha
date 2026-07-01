import { useState, useEffect } from 'react'
import { leerJuegosLiga, leerMiembrosLiga, miUsuarioId } from '../ligas'
import { cacheGet, cacheSet } from '../cache'
import { calcularTablaLiga, lideresLiga, destacadosLiga, resumenLiga } from '../ligaEstadisticas'

// ============================================================================
//  PANTALLA PÚBLICA DE LIGA — Media Cancha
//  La cara espectacular de una liga de comunidad. Identidad LARIMAR (teal),
//  distinta del torneo (dorado/NBA): aquí mandan la COMUNIDAD y el COMITÉ.
//  Secciones: Hero · La Directiva · Tabla · Líderes · Juegos · La comunidad.
// ============================================================================

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const DISP = '"Arial Narrow", Impact, "Haettenschweiler", system-ui, sans-serif'

const C = {
  fondo: '#04161a',
  fondo2: '#072227',
  glow: 'rgba(39,211,194,0.16)',
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

const MODO_COLOR = { fogueo: '#27d3c2', rapido: '#5fb0ec', normal: '#9aa7b2', '1v1': '#c98bff', '3v3': '#f5b82e', '5v5': '#3fbf7f' }
const RAMA = { masculino: { t: 'Masculino', e: '♂' }, femenino: { t: 'Femenino', e: '♀' }, mixto: { t: 'Mixto', e: '⚥' } }
const DIA_LBL = { lun: 'Lun', mar: 'Mar', mie: 'Mié', jue: 'Jue', vie: 'Vie', sab: 'Sáb', dom: 'Dom' }

const inicialesDe = (nombre, apellido) => `${(nombre || '?')[0] || ''}${(apellido || '')[0] || ''}`.toUpperCase()
const fechaCorta = (iso) => { try { return new Date(iso).toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric', month: 'short' }) } catch (e) { return '' } }

export default function PantallaLigaPublica({ liga, onVolver, onGestionar, onVerPerfil, onAnotar }) {
  const L = liga || {}
  const esReal = !!(L && L.id)

  const [juegos, setJuegos] = useState([])
  const [miembros, setMiembros] = useState([])
  const [miId, setMiId] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { miUsuarioId().then(setMiId).catch(() => {}) }, [])

  useEffect(() => {
    if (!esReal) { setJuegos([]); setMiembros([]); setCargando(false); return }
    let vivo = true
    const clave = 'liga_' + L.id
    // PASO 2: mostrar al instante lo último guardado de esta liga.
    const guardado = cacheGet(clave)
    if (guardado) {
      setJuegos(guardado.juegos || [])
      setMiembros(guardado.miembros || [])
      setCargando(false)
    } else {
      setCargando(true)
    }
    Promise.all([leerJuegosLiga(L.id), leerMiembrosLiga(L.id)])
      .then(([{ juegos }, { miembros }]) => {
        if (!vivo) return
        setJuegos(juegos || []); setMiembros(miembros || [])
        // PASO 3: guardar lo nuevo para la próxima.
        cacheSet(clave, { juegos: juegos || [], miembros: miembros || [] })
      })
      .catch(() => {})
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [L && L.id])

  const tabla = calcularTablaLiga(juegos)
  const lid = lideresLiga(juegos)
  const destacados = destacadosLiga(juegos)
  const res = resumenLiga(juegos)

  const esMiembro = !!(miId && miembros.some((m) => m.perfil_id === miId))
  const esAdmin = !!(miId && (miId === L.creador_id || miembros.some((m) => m.perfil_id === miId && m.rol === 'admin')))
  const puedeGestionar = esMiembro || esAdmin

  const rama = RAMA[L.rama] || RAMA.masculino
  const dias = Array.isArray(L.dias) ? (L.dias.length === 7 ? 'Todos los días' : L.dias.map((d) => DIA_LBL[d] || d).join(' · ')) : ''
  const comite = L.comite || {}
  const directiva = [
    { rol: 'Presidente', nombre: comite.presidente, id: comite.presidente_id },
    { rol: 'Vicepresidente', nombre: comite.vicepresidente, id: comite.vicepresidente_id },
    { rol: 'Tesorero', nombre: comite.tesorero, id: comite.tesorero_id },
  ].filter((d) => d.nombre)

  // -------- piezas reutilizables --------
  const tarjeta = { background: C.card, border: `0.5px solid ${C.borde}`, borderRadius: 16 }
  const secHead = (txt) => (
    <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, textTransform: 'uppercase', letterSpacing: 0.6, color: C.teal, margin: '22px 2px 11px' }}>{txt}</div>
  )

  const avatar = (foto, ini, size = 44, onClick) => (
    <div onClick={onClick} style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: foto ? `url(${foto}) center/cover` : C.panel, border: `1.5px solid ${C.borde2}`, display: 'grid', placeItems: 'center', color: C.teal, fontWeight: 800, fontSize: size * 0.34, cursor: onClick ? 'pointer' : 'default' }}>{!foto && ini}</div>
  )

  // -------- secciones --------
  const heroBloque = (
    <div style={{ position: 'relative', textAlign: 'center', padding: '8px 0 4px' }}>
      <div style={{ position: 'absolute', inset: '-40px -40px auto -40px', height: 220, background: `radial-gradient(ellipse 60% 80% at 50% 0%, ${C.glow}, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', margin: '0 auto 14px', background: L.logo_url ? `url(${L.logo_url}) center/cover` : `linear-gradient(150deg, ${C.fondo2}, #0a3239)`, border: `2px solid ${C.borde2}`, boxShadow: `0 0 30px ${C.glow}`, display: 'grid', placeItems: 'center', fontSize: 44 }}>{!L.logo_url && (L.emoji || '🤝')}</div>
        <div style={{ fontFamily: DISP, fontSize: 34, fontWeight: 900, color: C.txt, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.5, padding: '0 16px' }}>{L.nombre || 'Liga'}</div>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 7, marginTop: 12, padding: '0 16px' }}>
          <span style={{ background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 20, padding: '4px 11px', fontSize: 11.5, fontWeight: 700, color: C.teal }}>{rama.e} {rama.t}</span>
          {(L.lugar || L.ciudad) && <span style={{ background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 20, padding: '4px 11px', fontSize: 11.5, color: C.tenue }}>📍 {L.lugar || L.ciudad}</span>}
          {dias && <span style={{ background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 20, padding: '4px 11px', fontSize: 11.5, color: C.tenue }}>🗓 {dias}</span>}
        </div>
      </div>
    </div>
  )

  const tira = (
    <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
      {[['Juegos', res.totalJuegos], ['Equipos', res.totalEquipos], ['Miembros', miembros.length]].map(([t, v]) => (
        <div key={t} style={{ flex: 1, ...tarjeta, padding: '14px 6px', textAlign: 'center' }}>
          <div style={{ fontFamily: DISP, fontSize: 28, fontWeight: 900, color: C.teal, lineHeight: 1 }}>{v}</div>
          <div style={{ fontSize: 10.5, color: C.tenue, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 5 }}>{t}</div>
        </div>
      ))}
    </div>
  )

  const bloqueDirectiva = directiva.length === 0 ? null : (
    <>
      {secHead('La Directiva')}
      <div style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 4 }}>
        {directiva.map((d, i) => (
          <div key={i} onClick={() => d.id && onVerPerfil && onVerPerfil(d.id)} style={{ flex: '1 0 38%', minWidth: 130, ...tarjeta, padding: 14, textAlign: 'center', cursor: d.id ? 'pointer' : 'default' }}>
            <div style={{ margin: '0 auto 9px' }}>{avatar(null, inicialesDe(...(d.nombre || '').split(' ')), 50)}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.nombre}</div>
            <div style={{ fontSize: 10.5, color: C.teal, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginTop: 3 }}>{d.rol}</div>
          </div>
        ))}
      </div>
    </>
  )

  const filaTabla = (e) => {
    const lider = e.posicion === 1
    return (
      <div key={e.nombre} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderTop: e.posicion > 1 ? `0.5px solid ${C.borde}` : 'none' }}>
        <span style={{ fontFamily: DISP, fontSize: 18, width: 22, textAlign: 'center', color: lider ? C.ambar : C.tenue2, fontWeight: 900 }}>{e.posicion}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: lider ? 800 : 600, color: lider ? C.txt : C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.nombre}</div>
          <div style={{ fontSize: 11, color: C.tenue2, marginTop: 1 }}>{e.ganados}G · {e.perdidos}P{e.empates ? ` · ${e.empates}E` : ''} · {e.dif >= 0 ? '+' : ''}{e.dif} dif</div>
        </div>
        <div style={{ fontFamily: DISP, fontSize: 20, fontWeight: 900, color: C.teal, width: 52, textAlign: 'right' }}>{Math.round(e.pct * 1000) / 10}<span style={{ fontSize: 11, color: C.tenue2 }}>%</span></div>
      </div>
    )
  }

  const bloqueTabla = (
    <>
      {secHead('Tabla de la temporada')}
      {tabla.length === 0 ? (
        <div style={{ ...tarjeta, padding: 22, textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>🏀</div>
          <div style={{ color: C.txt, fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>La tabla empieza con el primer juego</div>
          <div style={{ color: C.tenue, fontSize: 12.5, lineHeight: 1.5 }}>Apenas se anote un partido, los equipos aparecen aquí ordenados por victorias.</div>
        </div>
      ) : (
        <div style={tarjeta}>{tabla.map(filaTabla)}</div>
      )}
    </>
  )

  const bloqueLideres = (() => {
    if (lid.hayDatos && lid.puntos.length) {
      const top = lid.puntos.slice(0, 5)
      return (
        <>
          {secHead('Líderes en anotación')}
          <div style={tarjeta}>
            {top.map((p, i) => (
              <div key={p.nombre} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderTop: i > 0 ? `0.5px solid ${C.borde}` : 'none' }}>
                <span style={{ fontFamily: DISP, fontSize: 17, width: 18, textAlign: 'center', color: i === 0 ? C.ambar : C.tenue2, fontWeight: 900 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: C.tenue2 }}>{p.juegos} juego{p.juegos === 1 ? '' : 's'}</div>
                </div>
                <div style={{ fontFamily: DISP, fontSize: 22, fontWeight: 900, color: C.teal }}>{Math.round(p.prom * 10) / 10}<span style={{ fontSize: 10.5, color: C.tenue2, marginLeft: 2 }}>PPJ</span></div>
              </div>
            ))}
          </div>
        </>
      )
    }
    if (destacados.length) {
      return (
        <>
          {secHead('Jugadores destacados')}
          <div style={tarjeta}>
            {destacados.slice(0, 5).map((d, i) => (
              <div key={d.nombre} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderTop: i > 0 ? `0.5px solid ${C.borde}` : 'none' }}>
                <span style={{ fontSize: 18, width: 22, textAlign: 'center' }}>{i === 0 ? '⭐' : '🏅'}</span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: C.txt }}>{d.nombre}</div>
                <div style={{ fontSize: 12, color: C.tenue }}>{d.veces}× destacado</div>
              </div>
            ))}
          </div>
        </>
      )
    }
    return null
  })()

  const bloqueJuegos = juegos.length === 0 ? null : (
    <>
      {secHead('Juegos recientes')}
      {juegos.slice(0, 8).map((g) => {
        const ganaA = g.puntos_a > g.puntos_b
        const ganaB = g.puntos_b > g.puntos_a
        const col = MODO_COLOR[g.modo] || C.tenue
        return (
          <div key={g.id} style={{ ...tarjeta, padding: 13, marginBottom: 9 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: col, textTransform: 'uppercase', letterSpacing: 0.5, background: col + '1e', borderRadius: 20, padding: '2px 9px' }}>{g.modo || 'normal'}</span>
              <span style={{ fontSize: 11, color: C.tenue2 }}>{fechaCorta(g.creado_en)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, fontSize: 14.5, fontWeight: ganaA ? 800 : 600, color: ganaA ? C.txt : C.tenue }}>{g.nombre_a}</div>
              <div style={{ fontFamily: DISP, fontSize: 24, fontWeight: 900, color: ganaA ? C.teal : C.tenue }}>{g.puntos_a}</div>
              <span style={{ color: C.tenue2 }}>—</span>
              <div style={{ fontFamily: DISP, fontSize: 24, fontWeight: 900, color: ganaB ? C.teal : C.tenue }}>{g.puntos_b}</div>
              <div style={{ flex: 1, textAlign: 'right', fontSize: 14.5, fontWeight: ganaB ? 800 : 600, color: ganaB ? C.txt : C.tenue }}>{g.nombre_b}</div>
            </div>
            {g.destacado_nombre && <div style={{ marginTop: 8, fontSize: 11.5, color: C.tenue, textAlign: 'center' }}>⭐ {g.destacado_nombre}{g.destacado_pts ? ` · ${g.destacado_pts} pts` : ''}</div>}
          </div>
        )
      })}
    </>
  )

  const bloqueComunidad = miembros.length === 0 ? null : (
    <>
      {secHead(`La comunidad · ${miembros.length}`)}
      <div style={{ ...tarjeta, padding: 14, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {miembros.slice(0, 18).map((m) => {
          const p = m.perfil || {}
          return (
            <div key={m.id} onClick={() => p.id && onVerPerfil && onVerPerfil(p.id)} style={{ width: 58, textAlign: 'center', cursor: p.id ? 'pointer' : 'default' }}>
              {avatar(p.foto_url, inicialesDe(p.nombre, p.apellido), 48)}
              <div style={{ fontSize: 10.5, color: C.tenue, marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(p.nombre || '').split(' ')[0]}</div>
            </div>
          )
        })}
      </div>
    </>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.fondo, color: C.txt, fontFamily: FONT, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Barra superior */}
      <div style={{ flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: 'rgba(4,22,26,.86)', borderBottom: `0.5px solid ${C.borde}`, backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px' }}>
          <button onClick={onVolver} style={{ border: `1px solid ${C.borde}`, background: 'transparent', color: C.txt, borderRadius: 10, padding: '7px 13px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>‹ Volver</button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: C.teal }}>Liga</div>
          {puedeGestionar
            ? <button onClick={onGestionar} style={{ border: 'none', background: TEAL_BTN, color: '#062a26', borderRadius: 10, padding: '7px 13px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Gestionar</button>
            : <div style={{ width: 64 }} />}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px calc(env(safe-area-inset-bottom) + 90px)' }}>
          {heroBloque}
          {tira}
          {cargando ? (
            <div style={{ color: C.tenue, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Cargando la liga…</div>
          ) : (
            <>
              {bloqueDirectiva}
              {bloqueTabla}
              {bloqueLideres}
              {bloqueJuegos}
              {bloqueComunidad}
            </>
          )}
        </div>
      </div>

      {/* CTA para miembros: anotar un juego */}
      {puedeGestionar && onAnotar && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 16px calc(env(safe-area-inset-bottom) + 12px)', background: `linear-gradient(0deg, ${C.fondo} 60%, transparent)` }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <button onClick={() => onAnotar()} style={{ width: '100%', border: 'none', borderRadius: 14, padding: 15, background: TEAL_BTN, color: '#062a26', fontSize: 15.5, fontWeight: 800, cursor: 'pointer', boxShadow: `0 8px 24px ${C.glow}` }}>🏀 Anotar un juego</button>
          </div>
        </div>
      )}
    </div>
  )
}