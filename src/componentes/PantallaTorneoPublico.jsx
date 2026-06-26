import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { cargarTorneoPublico } from '../torneoData'

// ============================================================================
//  PANTALLA PÚBLICA DEL TORNEO (vista de fanáticos) — Media Cancha · T-012
//  Lo que ve cualquier fanático cuando entra a un torneo: su carrusel de
//  momentos, la carrera de MVP, la tabla, los líderes. Lee datos reales de
//  Supabase a través de cargarTorneoPublico (motores de estadística+momentos).
//  Identidad: charcoal + dorado, tipografía deportiva.
// ============================================================================

const C = {
  bg: '#08090c', panel: 'rgba(14,16,20,.96)', card: 'rgba(20,22,26,.72)',
  oro: '#e8b65a', oroSuave: 'rgba(232,182,79,.14)',
  txt: '#f4f7f9', body: '#eef3f6', tenue: '#9aa7b2', muyTenue: '#6b7682',
  borde: 'rgba(232,182,79,.22)', bordeSuave: 'rgba(255,255,255,.08)',
  vino: '#b0413e', verde: '#5dcaa5', azul: '#6fb0ec', rosa: '#d4537e', fuego: '#ef7a3a',
}
const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const ICONO_MOMENTO = { remontada: '🔥', racha: '⚡', explosion: '💥' }
const COLOR_MOMENTO = { remontada: '#ef7a3a', racha: '#e8b65a', explosion: '#d4537e' }
const ETIQUETA_MOMENTO = { remontada: 'Remontada', racha: 'Racha', explosion: 'Explosión' }
const EMO_LIDER = { puntos: ['🏀', '#e8b65a'], rebotes: ['💪', '#5dcaa5'], asistencias: ['🤝', '#6fb0ec'], robos: ['✋', '#d4537e'], tapones: ['🚫', '#ef9f27'], triples: ['🎯', '#9b6ff0'], perdidas: ['🔁', '#c77d5a'], pct_tc: ['📈', '#5dcaa5'], pct_tp: ['🏹', '#9b6ff0'], pct_tl: ['💯', '#e8b65a'], eficiencia: ['⚡', '#f0c040'] }

export default function PantallaTorneoPublico({ torneoId = null, onVolver, onVerPerfil, onAnotar }) {
  const [datos, setDatos] = useState(null)
  const [torneoRow, setTorneoRow] = useState(null)
  const [jugCount, setJugCount] = useState(0)
  const [pestana, setPestana] = useState('portada')
  const [equipoAbierto, setEquipoAbierto] = useState(null)
  const [juegoAbierto, setJuegoAbierto] = useState(null)
  const [jugadorAbierto, setJugadorAbierto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [ancho, setAncho] = useState(typeof window !== 'undefined' ? window.innerWidth : 390)
  const refMomentos = useRef(null)
  const [miId, setMiId] = useState(null)

  const esAncho = ancho >= 820
  const esEscritorio = ancho >= 1180
  const maxAncho = esEscritorio ? 1080 : (esAncho ? 900 : 560)

  useEffect(() => {
    const r = () => setAncho(window.innerWidth)
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMiId(data?.user?.id || null)) }, [])

  useEffect(() => {
    const y = window.scrollY
    document.body.style.position = 'fixed'; document.body.style.top = `-${y}px`
    document.body.style.left = '0'; document.body.style.right = '0'; document.body.style.width = '100%'
    return () => {
      document.body.style.position = ''; document.body.style.top = ''
      document.body.style.left = ''; document.body.style.right = ''; document.body.style.width = ''
      window.scrollTo(0, y)
    }
  }, [])

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        let t = null
        if (torneoId) {
          const { data } = await supabase.from('torneos').select('*').eq('id', torneoId).single()
          t = data
        } else {
          const { data } = await supabase.from('torneos').select('*').order('creado_en', { ascending: false }).limit(1)
          t = (data || [])[0]
        }
        if (!t || !vivo) { if (vivo) setCargando(false); return }
        setTorneoRow(t)
        const pub = await cargarTorneoPublico(t.id, t.estadisticas)
        const { count } = await supabase.from('torneo_jugadores').select('id', { count: 'exact', head: true }).eq('torneo_id', t.id)
        if (!vivo) return
        setDatos(pub); setJugCount(count || 0); setCargando(false)
      } catch (e) { if (vivo) setCargando(false) }
    })()
    return () => { vivo = false }
  }, [torneoId])

  // ---------- DATOS DERIVADOS ----------
  const eqPorId = {}
  ;(datos?.equipos || []).forEach((e) => { eqPorId[e.id] = e })
  const nombreFormato = (f) => ({ liga: 'Liga', copa: 'Copa', mixto: 'Mixto' }[f] || 'Liga')
  const juegos = datos?.juegos || []
  const finales = juegos.filter((j) => j.estado === 'final')
  const proximos = juegos.filter((j) => j.estado === 'proximo')
  const enVivo = juegos.filter((j) => j.estado === 'vivo')
  const tabla = datos?.tabla || []
  const momentos = datos?.momentos || []
  const mvp = datos?.candidatosMVP || []
  const top = datos?.top10 || []
  const lideres = datos?.lideres || []
  const roster = datos?.roster || []
  const jugadores = datos?.jugadores || []
  const estadisticas = datos?.estadisticas || []

  // badges v1 (derivados de la data real; luego usarán tráfico/seguidores reales)
  const margenProm = finales.length ? finales.reduce((s, j) => s + Math.abs((j.puntosA || 0) - (j.puntosB || 0)), 0) / finales.length : 0
  const calidad = finales.length ? Math.max(45, Math.min(99, Math.round(100 - margenProm * 2.4))) : 0
  const popularidad = Math.min(99, finales.length * 8 + momentos.length * 6 + (datos?.equipos?.length || 0) * 3)

  const fechaCorta = (iso) => {
    if (!iso) return ''
    const d = new Date(iso), hoy = new Date()
    const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    const etq = d.toDateString() === hoy.toDateString() ? 'Hoy' : `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`
    let h = d.getHours(); const m = d.getMinutes(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12
    return `${etq} ${h}:${String(m).padStart(2, '0')} ${ap}`
  }

  const avatar = (id, size) => {
    const e = eqPorId[id]; const s = size || 26
    return <span style={{ width: s, height: s, borderRadius: '50%', background: e?.color || '#444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: s * 0.38, color: '#fff', fontWeight: 800, flexShrink: 0 }}>{e?.codigo || '??'}</span>
  }

  const tarjeta = { background: C.card, border: `0.5px solid ${C.bordeSuave}`, borderRadius: 16, overflow: 'hidden' }
  const titulo = (txt, color) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, marginTop: 4 }}>
      <span style={{ width: 4, height: 17, background: color || C.oro, borderRadius: 2 }} />
      <span style={{ color: C.txt, fontSize: 16, fontWeight: 800 }}>{txt}</span>
    </div>
  )
  const verTodo = (destino) => (
    <button onClick={() => setPestana(destino)} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: C.oro, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Ver todo ›</button>
  )

  // ---------- BLOQUES REUTILIZABLES ----------
  const bloqueMomentos = () => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, marginTop: 4 }}>
        <span style={{ width: 4, height: 17, background: C.fuego, borderRadius: 2 }} />
        <span style={{ color: C.txt, fontSize: 16, fontWeight: 800 }}>Momentos del torneo</span>
      </div>
      {momentos.length === 0 ? (
        <div style={{ ...tarjeta, padding: 20, textAlign: 'center', color: C.muyTenue, fontSize: 13, marginBottom: 20 }}>Aún no hay momentos destacados. Aparecerán cuando se jueguen partidos.</div>
      ) : (
        <div ref={refMomentos} style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, marginBottom: 14, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {momentos.map((m, i) => {
            const col = COLOR_MOMENTO[m.tipo] || C.oro
            const eq = eqPorId[m.equipo_id]
            return (
              <div key={i} style={{ flex: `0 0 ${esAncho ? '320px' : '84%'}`, background: `linear-gradient(155deg, ${col}1f, ${C.card})`, border: `0.5px solid ${col}55`, borderRadius: 18, padding: 17, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -18, right: -8, fontSize: 92, opacity: 0.08, lineHeight: 1 }}>{ICONO_MOMENTO[m.tipo] || '✨'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11, position: 'relative' }}>
                  <span style={{ fontSize: 20 }}>{ICONO_MOMENTO[m.tipo] || '✨'}</span>
                  <span style={{ color: col, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7 }}>{ETIQUETA_MOMENTO[m.tipo] || 'Momento'}</span>
                  {m.jornada ? <span style={{ marginLeft: 'auto', color: C.muyTenue, fontSize: 11 }}>J{m.jornada}</span> : null}
                </div>
                <div style={{ color: C.txt, fontSize: 15.5, fontWeight: 700, lineHeight: 1.3, marginBottom: 12, position: 'relative', minHeight: 40 }}>{m.titulo}</div>
                {eq && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, position: 'relative' }}>
                    {avatar(m.equipo_id, 22)}
                    <span style={{ color: C.tenue, fontSize: 12.5 }}>{eq.nombre}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )

  const filaJuegoFinal = (j, i, total) => {
    const a = eqPorId[j.equipoA_id], b = eqPorId[j.equipoB_id]
    const ganaA = (j.puntosA || 0) > (j.puntosB || 0)
    const tieneStats = estadisticas.some((s) => s.juego_id === j.id)
    return (
      <div key={j.id} onClick={() => setJuegoAbierto(j)} style={{ padding: '12px 14px', borderBottom: i < total - 1 ? `0.5px solid ${C.bordeSuave}` : 'none', cursor: 'pointer' }}>
        <div style={{ color: C.muyTenue, fontSize: 10.5, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>{j.jornada ? `Jornada ${j.jornada}` : 'Final'} · {fechaCorta(j.fecha)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          {avatar(j.equipoA_id, 26)}
          <span style={{ flex: 1, color: ganaA ? C.txt : C.tenue, fontSize: 13.5, fontWeight: ganaA ? 700 : 500 }}>{a?.nombre || 'Equipo'}</span>
          <span style={{ color: ganaA ? C.oro : C.tenue, fontSize: 16, fontWeight: 800, width: 30, textAlign: 'right' }}>{j.puntosA}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 7 }}>
          {avatar(j.equipoB_id, 26)}
          <span style={{ flex: 1, color: !ganaA ? C.txt : C.tenue, fontSize: 13.5, fontWeight: !ganaA ? 700 : 500 }}>{b?.nombre || 'Equipo'}</span>
          <span style={{ color: !ganaA ? C.oro : C.tenue, fontSize: 16, fontWeight: 800, width: 30, textAlign: 'right' }}>{j.puntosB}</span>
        </div>
        <div style={{ marginTop: 8, textAlign: 'right', color: C.oro, fontSize: 11, fontWeight: 700 }}>{tieneStats ? 'Ver box score ›' : 'Ver detalle ›'}</div>
      </div>
    )
  }

  const filaTabla = (e, i, grande) => (
    <div key={e.equipo_id} style={{ display: 'flex', alignItems: 'center', padding: grande ? '12px 14px' : '10px 14px', fontSize: 13.5, borderBottom: `0.5px solid ${C.bordeSuave}` }}>
      <span style={{ width: 22, color: e.posicion <= 2 ? C.oro : C.tenue, fontWeight: 700 }}>{e.posicion}</span>
      <span style={{ flex: 1, color: C.txt, display: 'flex', alignItems: 'center', gap: 8 }}>{avatar(e.equipo_id, grande ? 26 : 22)}{e.nombre}</span>
      <span style={{ width: 28, textAlign: 'center', color: C.tenue }}>{e.jugados}</span>
      <span style={{ width: 28, textAlign: 'center', color: C.body }}>{e.ganados}</span>
      <span style={{ width: 32, textAlign: 'center', color: C.oro, fontWeight: 800 }}>{e.puntos}</span>
    </div>
  )

  const tarjetaMVP = (j, idx) => (
    <div key={j.equipo_id + '-' + idx} style={{ ...tarjeta, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 13, background: idx === 0 ? `linear-gradient(150deg, ${C.oroSuave}, ${C.card})` : C.card, border: idx === 0 ? `0.5px solid ${C.borde}` : `0.5px solid ${C.bordeSuave}` }}>
      <div style={{ position: 'relative' }}>
        {avatar(j.equipo_id, 46)}
        <span style={{ position: 'absolute', top: -6, right: -6, fontSize: 16 }}>{['👑', '🥈', '🥉'][idx] || ''}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: C.txt, fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombre}</div>
        <div style={{ color: C.muyTenue, fontSize: 12 }}>{eqPorId[j.equipo_id]?.nombre || ''}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: C.oro, fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{j.mcRating}</div>
        <div style={{ color: C.muyTenue, fontSize: 10 }}>valoración</div>
      </div>
    </div>
  )

  const proximoMini = () => (
    <>
      {titulo('Próximos juegos', C.azul)}
      <div style={{ ...tarjeta, marginBottom: 20 }}>
        <div style={{ padding: '6px 14px 8px' }}>
          {proximos.length === 0 ? (
            <div style={{ padding: '12px 0', color: C.muyTenue, fontSize: 13 }}>No hay juegos programados.</div>
          ) : proximos.slice(0, 5).map((j, i) => (
            <div key={j.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < Math.min(proximos.length, 5) - 1 ? `0.5px solid ${C.bordeSuave}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {avatar(j.equipoA_id, 22)}
                <span style={{ color: C.body, fontSize: 13 }}>vs</span>
                {avatar(j.equipoB_id, 22)}
              </div>
              <span style={{ color: i === 0 ? C.oro : C.tenue, fontSize: 12, fontWeight: i === 0 ? 700 : 400 }}>{fechaCorta(j.fecha)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  // ---------- CONTENIDO POR PESTAÑA ----------
  const contenido = () => {
    if (cargando) return <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, padding: '50px 0' }}>Cargando torneo…</div>
    if (!datos) return <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, padding: '50px 0' }}>No se encontró el torneo.</div>

    if (pestana === 'portada') {
      return (
        <>
          {bloqueMomentos()}

          {enVivo.length > 0 && (
            <>
              {titulo('En vivo ahora', C.vino)}
              {enVivo.slice(0, 2).map((j) => (
                <div key={j.id} style={{ ...tarjeta, border: `0.5px solid ${C.borde}`, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>{avatar(j.equipoA_id, 40)}<span style={{ color: C.body, fontSize: 11 }}>{eqPorId[j.equipoA_id]?.nombre}</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <span style={{ color: C.txt, fontSize: 24, fontWeight: 800 }}>{j.puntosA} — {j.puntosB}</span>
                      <span style={{ color: '#f09595', fontSize: 11, fontWeight: 700, marginTop: 3 }}>● EN VIVO</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>{avatar(j.equipoB_id, 40)}<span style={{ color: C.body, fontSize: 11 }}>{eqPorId[j.equipoB_id]?.nombre}</span></div>
                  </div>
                </div>
              ))}
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, marginTop: 4 }}>
            <span style={{ width: 4, height: 17, background: C.oro, borderRadius: 2 }} />
            <span style={{ color: C.txt, fontSize: 16, fontWeight: 800 }}>Tabla</span>
            {verTodo('tabla')}
          </div>
          <div style={{ ...tarjeta, marginBottom: 20 }}>
            {tabla.length === 0 ? <div style={{ padding: 16, color: C.muyTenue, fontSize: 13 }}>Aún no hay posiciones.</div> : tabla.slice(0, 4).map((e, i) => filaTabla(e, i, false))}
          </div>

          {mvp.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, marginTop: 4 }}>
                <span style={{ width: 4, height: 17, background: C.oro, borderRadius: 2 }} />
                <span style={{ color: C.txt, fontSize: 16, fontWeight: 800 }}>Carrera por el MVP</span>
                {verTodo('lideres')}
              </div>
              <div style={{ color: C.muyTenue, fontSize: 11.5, marginBottom: 12 }}>Los tres primeros por valoración del torneo 👑</div>
              {mvp.slice(0, 3).map((j, i) => tarjetaMVP(j, i))}
              <div style={{ height: 8 }} />
            </>
          )}

          {proximoMini()}
        </>
      )
    }

    if (pestana === 'juegos') {
      return (
        <>
          {enVivo.length > 0 && (
            <>
              {titulo('En vivo', C.vino)}
              <div style={{ ...tarjeta, marginBottom: 18 }}>{enVivo.map((j, i) => filaJuegoFinal(j, i, enVivo.length))}</div>
            </>
          )}
          {titulo('Resultados', C.oro)}
          <div style={{ ...tarjeta, marginBottom: 18 }}>
            {finales.length === 0 ? <div style={{ padding: 16, color: C.muyTenue, fontSize: 13 }}>Aún no hay juegos jugados.</div> : finales.map((j, i) => filaJuegoFinal(j, i, finales.length))}
          </div>
          {titulo('Próximos', C.azul)}
          <div style={tarjeta}>
            {proximos.length === 0 ? <div style={{ padding: 16, color: C.muyTenue, fontSize: 13 }}>No hay juegos programados.</div> : proximos.map((j, i) => (
              <div key={j.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', borderBottom: i < proximos.length - 1 ? `0.5px solid ${C.bordeSuave}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  {avatar(j.equipoA_id, 24)}<span style={{ color: C.body, fontSize: 13 }}>{eqPorId[j.equipoA_id]?.nombre}</span>
                  <span style={{ color: C.muyTenue, fontSize: 12 }}>vs</span>
                  {avatar(j.equipoB_id, 24)}<span style={{ color: C.body, fontSize: 13 }}>{eqPorId[j.equipoB_id]?.nombre}</span>
                </div>
                <span style={{ color: C.oro, fontSize: 12, fontWeight: 600 }}>{fechaCorta(j.fecha)}</span>
              </div>
            ))}
          </div>
        </>
      )
    }

    if (pestana === 'tabla') {
      return (
        <>
          {titulo('Tabla de posiciones')}
          <div style={tarjeta}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', fontSize: 10.5, color: C.tenue, borderBottom: `0.5px solid ${C.bordeSuave}`, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              <span style={{ width: 22 }}>#</span><span style={{ flex: 1 }}>Equipo</span>
              <span style={{ width: 28, textAlign: 'center' }}>PJ</span><span style={{ width: 28, textAlign: 'center' }}>G</span>
              <span style={{ width: 32, textAlign: 'center', color: C.oro }}>Pts</span>
            </div>
            {tabla.length === 0 ? <div style={{ padding: 16, color: C.muyTenue, fontSize: 13 }}>Aún no hay posiciones.</div> : tabla.map((e, i) => filaTabla(e, i, true))}
          </div>
        </>
      )
    }

    if (pestana === 'lideres') {
      return (
        <>
          {titulo('Líderes por estadística', C.oro)}
          {lideres.filter((c) => c.filas && c.filas.length).length === 0 ? (
            <div style={{ ...tarjeta, padding: 20, textAlign: 'center', color: C.muyTenue, fontSize: 13, marginBottom: 20 }}>Aún no hay estadísticas.</div>
          ) : lideres.filter((c) => c.filas && c.filas.length).map((c) => {
            const top1 = c.filas[0]; const par = EMO_LIDER[c.id] || ['🏀', C.oro]
            return (
              <div key={c.id} style={{ ...tarjeta, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: `${par[1]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23 }}>{par[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: C.tenue, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{c.titulo}</div>
                  <div style={{ color: C.txt, fontSize: 15, fontWeight: 700 }}>{top1.nombre}</div>
                  <div style={{ color: C.muyTenue, fontSize: 12 }}>{eqPorId[top1.equipo_id]?.nombre || ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: par[1], fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{top1.valor}{c.esPct ? '%' : ''}</div>
                  <div style={{ color: C.muyTenue, fontSize: 10.5, marginTop: 2 }}>{c.sub || 'por juego'}</div>
                </div>
              </div>
            )
          })}

          {mvp.length > 0 && (
            <>
              <div style={{ height: 10 }} />
              {titulo('Carrera por el MVP', C.oro)}
              <div style={{ color: C.muyTenue, fontSize: 11.5, marginBottom: 12, marginTop: -6 }}>Ranking general por valoración. Los tres primeros entran a la votación 👑</div>
              {top.slice(0, 10).map((j, i) => (
                <div key={j.equipo_id + '-' + i} onClick={() => setJugadorAbierto(j.jugador_id)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderBottom: `0.5px solid ${C.bordeSuave}`, background: i < 3 ? `${C.oro}0d` : 'transparent', borderRadius: i === 0 ? '12px 12px 0 0' : 0, cursor: 'pointer' }}>
                  <span style={{ width: 24, textAlign: 'center', color: i < 3 ? C.oro : C.tenue, fontSize: 15, fontWeight: 800 }}>{j.posicion}</span>
                  {avatar(j.equipo_id, 30)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.txt, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombre}</div>
                    <div style={{ color: C.muyTenue, fontSize: 11.5 }}>{eqPorId[j.equipo_id]?.nombre || ''}</div>
                  </div>
                  {i < 3 && <span style={{ fontSize: 13 }}>👑</span>}
                  <span style={{ color: C.oro, fontSize: 16, fontWeight: 800 }}>{j.mcRating}</span>
                </div>
              ))}
            </>
          )}
        </>
      )
    }

    if (pestana === 'equipos') {
      const statsMap = {}
      jugadores.forEach((j) => { statsMap[j.jugador_id] = j })
      const r1 = (n) => Math.round((n || 0) * 10) / 10
      return (
        <>
          {titulo('Equipos y plantillas', C.oro)}
          {(datos.equipos || []).length === 0 ? (
            <div style={{ ...tarjeta, padding: 20, textAlign: 'center', color: C.muyTenue, fontSize: 13 }}>Aún no hay equipos.</div>
          ) : (datos.equipos || []).map((eq) => {
            const fila = tabla.find((t) => t.equipo_id === eq.id)
            const plantilla = roster.filter((p) => p.equipo_id === eq.id).sort((a, b) => (statsMap[b.jugador_id]?.prom.puntos || 0) - (statsMap[a.jugador_id]?.prom.puntos || 0))
            const abierto = equipoAbierto === eq.id
            return (
              <div key={eq.id} style={{ ...tarjeta, marginBottom: 11 }}>
                <div onClick={() => setEquipoAbierto(abierto ? null : eq.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', cursor: 'pointer' }}>
                  {avatar(eq.id, 42)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.txt, fontSize: 15, fontWeight: 800 }}>{eq.nombre}</div>
                    <div style={{ color: C.tenue, fontSize: 12 }}>{fila ? `${fila.ganados}-${fila.jugados - fila.ganados}` : 'sin juegos'} · {plantilla.length} jugador{plantilla.length === 1 ? '' : 'es'}</div>
                  </div>
                  <span style={{ color: C.tenue, fontSize: 20, display: 'inline-block', transform: abierto ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>›</span>
                </div>
                {abierto && (
                  <div style={{ borderTop: `0.5px solid ${C.bordeSuave}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', fontSize: 10, color: C.muyTenue, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                      <span style={{ width: 26 }}>#</span><span style={{ flex: 1 }}>Jugador</span>
                      <span style={{ width: 30, textAlign: 'center' }}>PJ</span>
                      <span style={{ width: 40, textAlign: 'center' }}>PTS</span>
                      <span style={{ width: 40, textAlign: 'center' }}>REB</span>
                      <span style={{ width: 40, textAlign: 'center' }}>AST</span>
                    </div>
                    {plantilla.length === 0 ? (
                      <div style={{ padding: '12px 14px', color: C.muyTenue, fontSize: 12.5 }}>Sin jugadores registrados todavía.</div>
                    ) : plantilla.map((p, i) => {
                      const s = statsMap[p.jugador_id]
                      return (
                        <div key={p.jugador_id} onClick={() => setJugadorAbierto(p.jugador_id)} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', fontSize: 13, borderTop: i > 0 ? `0.5px solid ${C.bordeSuave}` : 'none', cursor: 'pointer' }}>
                          <span style={{ width: 26, color: C.tenue, fontWeight: 700 }}>{p.numero ?? '–'}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: C.txt, fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.nombre}{p.esCapitan ? <span style={{ fontSize: 11 }}>©</span> : null}{p.esRefuerzo ? <span style={{ fontSize: 9, color: C.azul, fontWeight: 800 }}>REF</span> : null}
                            </div>
                            {p.posicion ? <div style={{ color: C.muyTenue, fontSize: 11 }}>{p.posicion}</div> : null}
                          </div>
                          <span style={{ width: 30, textAlign: 'center', color: C.tenue }}>{s?.juegos ?? 0}</span>
                          <span style={{ width: 40, textAlign: 'center', color: C.oro, fontWeight: 700 }}>{s ? r1(s.prom.puntos) : '–'}</span>
                          <span style={{ width: 40, textAlign: 'center', color: C.body }}>{s ? r1(s.prom.rebotes) : '–'}</span>
                          <span style={{ width: 40, textAlign: 'center', color: C.body }}>{s ? r1(s.prom.asistencias) : '–'}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          <div style={{ color: C.muyTenue, fontSize: 11, textAlign: 'center', marginTop: 6 }}>Toca un equipo para ver su plantilla y estadísticas (promedios por juego)</div>
        </>
      )
    }

    if (pestana === 'votos' || pestana === 'albumes') {
      const esVotos = pestana === 'votos'
      return (
        <div style={{ ...tarjeta, padding: '34px 20px', textAlign: 'center', marginTop: 10 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>{esVotos ? '🗳️' : '📸'}</div>
          <div style={{ color: C.txt, fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{esVotos ? 'Votaciones' : 'Álbumes de fotos'}</div>
          <div style={{ color: C.tenue, fontSize: 13, lineHeight: 1.5, maxWidth: 340, margin: '0 auto' }}>
            {esVotos
              ? 'Pronto los fanáticos podrán votar por el MVP, el mejor juego de la jornada y más. Estamos construyéndolo.'
              : 'Pronto cada equipo y cada jornada tendrá su álbum de fotos. Estamos construyéndolo.'}
          </div>
          <div style={{ display: 'inline-block', marginTop: 16, padding: '6px 14px', borderRadius: 20, background: C.oroSuave, border: `1px solid ${C.borde}`, color: C.oro, fontSize: 12, fontWeight: 700 }}>Próximamente</div>
        </div>
      )
    }
    return null
  }

  // ---------- MODAL: BOX SCORE DE UN JUEGO ----------
  const boxScoreModal = () => {
    if (!juegoAbierto) return null
    const j = juegoAbierto
    const a = eqPorId[j.equipoA_id], b = eqPorId[j.equipoB_id]
    const ganaA = (j.puntosA || 0) > (j.puntosB || 0)
    const sj = estadisticas.filter((s) => s.juego_id === j.id)
    const ef = (s) => (s.puntos || 0) + (s.rebotes || 0) + (s.asistencias || 0) + (s.robos || 0) + (s.tapones || 0) - (s.perdidas || 0)
    const figura = sj.length ? [...sj].sort((x, y) => ef(y) - ef(x))[0] : null
    const statsA = sj.filter((s) => s.equipo_id === j.equipoA_id).sort((x, y) => (y.puntos || 0) - (x.puntos || 0))
    const statsB = sj.filter((s) => s.equipo_id === j.equipoB_id).sort((x, y) => (y.puntos || 0) - (x.puntos || 0))
    const qs = Math.max((j.parcialesA || []).length, (j.parcialesB || []).length)

    const tablaEquipo = (equipoId, stats) => {
      const eq = eqPorId[equipoId]
      return (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: `${eq?.color || '#333'}22` }}>
            {avatar(equipoId, 24)}<span style={{ color: C.txt, fontSize: 14, fontWeight: 800 }}>{eq?.nombre || 'Equipo'}</span>
          </div>
          <div style={{ display: 'flex', padding: '6px 14px', fontSize: 9.5, color: C.muyTenue, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            <span style={{ flex: 1 }}>Jugador</span>
            <span style={{ width: 34, textAlign: 'center' }}>PTS</span>
            <span style={{ width: 34, textAlign: 'center' }}>REB</span>
            <span style={{ width: 34, textAlign: 'center' }}>AST</span>
            <span style={{ width: 30, textAlign: 'center' }}>ROB</span>
            <span style={{ width: 30, textAlign: 'center' }}>TAP</span>
          </div>
          {stats.length === 0 ? (
            <div style={{ padding: '10px 14px', color: C.muyTenue, fontSize: 12 }}>Sin estadística registrada de este equipo.</div>
          ) : stats.map((s, i) => (
            <div key={(s.jugador_id || 'x') + '-' + i} onClick={() => { setJuegoAbierto(null); setJugadorAbierto(s.jugador_id) }} style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', fontSize: 12.5, borderTop: `0.5px solid ${C.bordeSuave}`, cursor: 'pointer' }}>
              <span style={{ flex: 1, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.numero != null ? `${s.numero} · ` : ''}{s.nombre}</span>
              <span style={{ width: 34, textAlign: 'center', color: C.oro, fontWeight: 700 }}>{s.puntos || 0}</span>
              <span style={{ width: 34, textAlign: 'center', color: C.body }}>{s.rebotes || 0}</span>
              <span style={{ width: 34, textAlign: 'center', color: C.body }}>{s.asistencias || 0}</span>
              <span style={{ width: 30, textAlign: 'center', color: C.tenue }}>{s.robos || 0}</span>
              <span style={{ width: 30, textAlign: 'center', color: C.tenue }}>{s.tapones || 0}</span>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div onClick={() => setJuegoAbierto(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: esAncho ? 'center' : 'flex-end', justifyContent: 'center', padding: esAncho ? 20 : 0 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, border: `1px solid ${C.borde}`, borderRadius: esAncho ? 20 : '20px 20px 0 0', width: '100%', maxWidth: 600, maxHeight: esAncho ? '88dvh' : '90dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `0.5px solid ${C.bordeSuave}`, position: 'sticky', top: 0, background: C.bg, zIndex: 2 }}>
            <span style={{ color: C.txt, fontSize: 15, fontWeight: 800 }}>Detalle del juego</span>
            <button onClick={() => setJuegoAbierto(null)} style={{ width: 32, height: 32, borderRadius: 9, border: `0.5px solid ${C.bordeSuave}`, background: C.card, color: C.txt, fontSize: 15, cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ padding: '14px 14px 10px' }}>
            <div style={{ color: C.muyTenue, fontSize: 11, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>{j.jornada ? `Jornada ${j.jornada}` : 'Final'} · {fechaCorta(j.fecha)}</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>{avatar(j.equipoA_id, 48)}<span style={{ color: ganaA ? C.txt : C.tenue, fontSize: 13, fontWeight: ganaA ? 700 : 500, textAlign: 'center' }}>{a?.nombre || 'Equipo'}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px' }}>
                <span style={{ color: ganaA ? C.oro : C.tenue, fontSize: 34, fontWeight: 800 }}>{j.puntosA}</span>
                <span style={{ color: C.muyTenue, fontSize: 18 }}>—</span>
                <span style={{ color: !ganaA ? C.oro : C.tenue, fontSize: 34, fontWeight: 800 }}>{j.puntosB}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>{avatar(j.equipoB_id, 48)}<span style={{ color: !ganaA ? C.txt : C.tenue, fontSize: 13, fontWeight: !ganaA ? 700 : 500, textAlign: 'center' }}>{b?.nombre || 'Equipo'}</span></div>
            </div>
          </div>

          {qs > 0 && (
            <div style={{ padding: '0 14px 14px' }}>
              <div style={{ ...tarjeta, padding: '10px 12px' }}>
                <div style={{ display: 'flex', fontSize: 10, color: C.muyTenue, marginBottom: 6 }}>
                  <span style={{ flex: 1 }} />
                  {Array.from({ length: qs }).map((_, k) => <span key={k} style={{ width: 34, textAlign: 'center' }}>Q{k + 1}</span>)}
                </div>
                {[[j.equipoA_id, j.parcialesA || []], [j.equipoB_id, j.parcialesB || []]].map(([eid, parc], r) => (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', fontSize: 12.5, marginTop: r ? 4 : 0 }}>
                    <span style={{ flex: 1, color: C.body, display: 'flex', alignItems: 'center', gap: 6 }}>{avatar(eid, 18)}{eqPorId[eid]?.codigo || ''}</span>
                    {Array.from({ length: qs }).map((_, k) => <span key={k} style={{ width: 34, textAlign: 'center', color: C.tenue }}>{parc[k] ?? '–'}</span>)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {figura && (
            <div style={{ padding: '0 14px 14px' }}>
              <div style={{ ...tarjeta, padding: 14, display: 'flex', alignItems: 'center', gap: 12, background: `linear-gradient(150deg, ${C.oroSuave}, ${C.card})`, border: `0.5px solid ${C.borde}` }}>
                <div style={{ position: 'relative' }}>{avatar(figura.equipo_id, 46)}<span style={{ position: 'absolute', top: -6, right: -6, fontSize: 16 }}>⭐</span></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: C.muyTenue, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.4 }}>Figura del juego</div>
                  <div style={{ color: C.txt, fontSize: 15, fontWeight: 800 }}>{figura.nombre}</div>
                  <div style={{ color: C.tenue, fontSize: 12 }}>{figura.puntos || 0} pts · {figura.rebotes || 0} reb · {figura.asistencias || 0} ast</div>
                </div>
              </div>
            </div>
          )}

          {sj.length === 0 ? (
            <div style={{ padding: '6px 14px 26px', color: C.muyTenue, fontSize: 13, textAlign: 'center' }}>Este juego no tiene estadística de jugadores registrada todavía.</div>
          ) : (
            <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
              {tablaEquipo(j.equipoA_id, statsA)}
              {tablaEquipo(j.equipoB_id, statsB)}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ---------- MODAL: PERFIL DE UN JUGADOR ----------
  const perfilModal = () => {
    if (!jugadorAbierto) return null
    const jug = jugadores.find((j) => j.jugador_id === jugadorAbierto)
    const ros = roster.find((r) => r.jugador_id === jugadorAbierto)
    const nombre = jug?.nombre || ros?.nombre || 'Jugador'
    const numero = (jug?.numero ?? ros?.numero)
    const equipoId = jug?.equipo_id || ros?.equipo_id
    const posicion = ros?.posicion
    const eq = eqPorId[equipoId]
    const r1 = (n) => Math.round((n || 0) * 10) / 10
    const pct = (v) => v == null ? '–' : Math.round(v * 100) + '%'
    const log = estadisticas
      .filter((s) => s.jugador_id === jugadorAbierto)
      .map((s) => ({ s, g: juegos.find((x) => x.id === s.juego_id) }))
      .sort((a, b) => (b.g?.jornada || 0) - (a.g?.jornada || 0))

    const stat = (label, val, color) => (
      <div style={{ flex: 1, textAlign: 'center', padding: '10px 4px' }}>
        <div style={{ color: color || C.txt, fontSize: 19, fontWeight: 800 }}>{val}</div>
        <div style={{ color: C.muyTenue, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 3 }}>{label}</div>
      </div>
    )

    return (
      <div onClick={() => setJugadorAbierto(null)} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: esAncho ? 'center' : 'flex-end', justifyContent: 'center', padding: esAncho ? 20 : 0 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, border: `1px solid ${C.borde}`, borderRadius: esAncho ? 20 : '20px 20px 0 0', width: '100%', maxWidth: 580, maxHeight: esAncho ? '88dvh' : '90dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `0.5px solid ${C.bordeSuave}`, position: 'sticky', top: 0, background: C.bg, zIndex: 2 }}>
            <span style={{ color: C.txt, fontSize: 15, fontWeight: 800 }}>Perfil del jugador</span>
            <button onClick={() => setJugadorAbierto(null)} style={{ width: 32, height: 32, borderRadius: 9, border: `0.5px solid ${C.bordeSuave}`, background: C.card, color: C.txt, fontSize: 15, cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 16px' }}>
            <div style={{ position: 'relative' }}>
              {avatar(equipoId, 58)}
              {numero != null && <span style={{ position: 'absolute', bottom: -4, right: -4, background: C.bg, border: `2px solid ${eq?.color || '#444'}`, color: C.txt, fontSize: 11, fontWeight: 800, borderRadius: 10, padding: '1px 6px' }}>{numero}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.txt, fontSize: 19, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</div>
              <div style={{ color: C.tenue, fontSize: 13 }}>{eq?.nombre || ''}{posicion ? ` · ${posicion}` : ''}</div>
            </div>
            {jug && <div style={{ textAlign: 'center' }}><div style={{ color: C.oro, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{jug.mcRating}</div><div style={{ color: C.muyTenue, fontSize: 10 }}>valoración</div></div>}
          </div>

          {/* Botón al perfil GENERAL de Media Cancha (vía el código único / perfil_id) */}
          <div style={{ padding: '0 16px 12px' }}>
            {ros?.perfilId ? (
              <button onClick={() => { setJugadorAbierto(null); onVerPerfil && onVerPerfil(ros.perfilId) }} style={{ width: '100%', border: 'none', borderRadius: 12, padding: '12px', background: 'linear-gradient(150deg, #f3cf63, #c8842e)', color: '#1a1205', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>Ver perfil en Media Cancha ›</button>
            ) : (
              <div style={{ width: '100%', borderRadius: 12, padding: '11px 14px', background: C.card, border: `0.5px dashed ${C.bordeSuave}`, color: C.muyTenue, fontSize: 12, textAlign: 'center', lineHeight: 1.45 }}>
                Este jugador aún no está vinculado a una cuenta de Media Cancha.<br />Cuando se registre con su código único, su perfil aparecerá aquí.
              </div>
            )}
          </div>

          {!jug ? (
            <div style={{ padding: '10px 16px 30px', color: C.muyTenue, fontSize: 13, textAlign: 'center' }}>Este jugador aún no ha jugado en el torneo.</div>
          ) : (
            <>
              <div style={{ display: 'flex', margin: '0 14px', background: C.card, borderRadius: 14, border: `0.5px solid ${C.bordeSuave}` }}>
                {stat('PTS', r1(jug.prom.puntos), C.oro)}
                <div style={{ width: '0.5px', background: C.bordeSuave }} />
                {stat('REB', r1(jug.prom.rebotes))}
                <div style={{ width: '0.5px', background: C.bordeSuave }} />
                {stat('AST', r1(jug.prom.asistencias))}
              </div>
              <div style={{ color: C.muyTenue, fontSize: 11, textAlign: 'center', margin: '8px 0 14px' }}>Promedios por juego · {jug.juegos} juego{jug.juegos === 1 ? '' : 's'}</div>

              <div style={{ padding: '0 14px 14px' }}>
                <div style={{ ...tarjeta, padding: '2px 0' }}>
                  <div style={{ display: 'flex' }}>
                    {stat('ROB', r1(jug.prom.robos))}
                    {stat('TAP', r1(jug.prom.tapones))}
                    {stat('PÉR', r1(jug.prom.perdidas))}
                    {stat('EF', r1(jug.efPorJuego), C.verde)}
                  </div>
                  <div style={{ height: '0.5px', background: C.bordeSuave }} />
                  <div style={{ display: 'flex' }}>
                    {stat('TC%', pct(jug.pct.tc))}
                    {stat('3P%', pct(jug.pct.tp))}
                    {stat('TL%', pct(jug.pct.tl))}
                    {stat('PTS TOT', jug.tot.puntos, C.body)}
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 14px calc(env(safe-area-inset-bottom) + 18px)' }}>
                <div style={{ color: C.tenue, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Juego por juego</div>
                <div style={tarjeta}>
                  <div style={{ display: 'flex', padding: '8px 12px', fontSize: 9.5, color: C.muyTenue, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    <span style={{ flex: 1 }}>Rival</span>
                    <span style={{ width: 34, textAlign: 'center' }}>PTS</span>
                    <span style={{ width: 34, textAlign: 'center' }}>REB</span>
                    <span style={{ width: 34, textAlign: 'center' }}>AST</span>
                  </div>
                  {log.map(({ s, g }, i) => {
                    const esLocal = g && g.equipoA_id === equipoId
                    const rivalId = g ? (esLocal ? g.equipoB_id : g.equipoA_id) : null
                    const miPts = g ? (esLocal ? g.puntosA : g.puntosB) : 0
                    const suPts = g ? (esLocal ? g.puntosB : g.puntosA) : 0
                    const gano = miPts > suPts
                    return (
                      <div key={s.juego_id + '-' + i} style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', fontSize: 12.5, borderTop: `0.5px solid ${C.bordeSuave}` }}>
                        <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span style={{ color: gano ? C.verde : C.vino, fontWeight: 800, fontSize: 11, width: 12 }}>{g ? (gano ? 'G' : 'P') : '–'}</span>
                          {rivalId ? avatar(rivalId, 18) : null}
                          <span style={{ color: C.tenue, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rivalId ? (eqPorId[rivalId]?.codigo || '') : ''} {g ? `${miPts}-${suPts}` : ''}</span>
                        </span>
                        <span style={{ width: 34, textAlign: 'center', color: C.oro, fontWeight: 700 }}>{s.puntos || 0}</span>
                        <span style={{ width: 34, textAlign: 'center', color: C.body }}>{s.rebotes || 0}</span>
                        <span style={{ width: 34, textAlign: 'center', color: C.body }}>{s.asistencias || 0}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ---------- PESTAÑAS ----------
  const TABS = [
    { id: 'portada', t: 'Portada', i: '🏠' },
    { id: 'juegos', t: 'Juegos', i: '📅' },
    { id: 'tabla', t: 'Tabla', i: '🏆' },
    { id: 'equipos', t: 'Equipos', i: '🛡️' },
    { id: 'lideres', t: 'Líderes', i: '🥇' },
    { id: 'votos', t: 'Votos', i: '🗳️' },
    { id: 'albumes', t: 'Álbumes', i: '📸' },
  ]

  const nombre = torneoRow?.nombre || 'Torneo'
  const sub = datos ? `${datos.equipos.length} equipos · ${nombreFormato(torneoRow?.formato)}${torneoRow?.lugar ? ' · ' + torneoRow.lugar : ''}` : ''

  return (
    <div style={{ position: 'fixed', inset: 0, height: '100dvh', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: font, overflow: 'hidden' }}>
      {/* HEADER */}
      <div style={{ position: 'relative', zIndex: 2, background: C.panel, borderBottom: `0.5px solid ${C.bordeSuave}`, padding: '12px 16px 0', paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
        <div style={{ maxWidth: maxAncho, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onVolver} style={{ width: 38, height: 38, borderRadius: 11, border: `0.5px solid ${C.bordeSuave}`, background: C.card, color: C.txt, fontSize: 17, cursor: 'pointer', flexShrink: 0 }}>‹</button>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(150deg, #f3cf63, #c8842e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 }}>{torneoRow?.emoji || '🏆'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.txt, fontSize: 16.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</div>
              <div style={{ color: C.tenue, fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
            </div>
            {onAnotar && torneoRow && (
              <button onClick={() => onAnotar(torneoRow.id)} style={{ flexShrink: 0, border: `0.5px solid ${C.oro}66`, background: 'rgba(245,184,46,0.12)', color: C.oro, borderRadius: 11, padding: '8px 12px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>✎ Anotar</button>
            )}
          </div>

          {/* BADGES */}
          <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
            <div style={{ flex: esAncho ? '0 0 auto' : 1, minWidth: esAncho ? 150 : 0, display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `0.5px solid ${C.bordeSuave}`, borderRadius: 12, padding: '8px 13px' }}>
              <span style={{ fontSize: 18 }}>⭐</span>
              <div>
                <div style={{ color: C.muyTenue, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}>Calidad</div>
                <div style={{ color: C.oro, fontSize: 17, fontWeight: 800, lineHeight: 1 }}>{calidad || '—'}<span style={{ fontSize: 11, color: C.muyTenue, fontWeight: 600 }}>/100</span></div>
              </div>
            </div>
            <div style={{ flex: esAncho ? '0 0 auto' : 1, minWidth: esAncho ? 150 : 0, display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `0.5px solid ${C.bordeSuave}`, borderRadius: 12, padding: '8px 13px' }}>
              <span style={{ fontSize: 18 }}>🔥</span>
              <div>
                <div style={{ color: C.muyTenue, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}>Popularidad</div>
                <div style={{ color: C.fuego, fontSize: 17, fontWeight: 800, lineHeight: 1 }}>{popularidad || '—'}</div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '13px 0 11px', scrollbarWidth: 'none' }}>
            {TABS.map((p) => {
              const activa = pestana === p.id
              return (
                <button key={p.id} onClick={() => setPestana(p.id)} style={{ flexShrink: 0, border: `0.5px solid ${activa ? C.borde : C.bordeSuave}`, background: activa ? C.oroSuave : 'transparent', color: activa ? C.oro : C.tenue, borderRadius: 20, padding: '7px 14px', fontSize: 13, fontWeight: activa ? 800 : 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <span style={{ marginRight: 5 }}>{p.i}</span>{p.t}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <div style={{ maxWidth: maxAncho, margin: '0 auto', padding: esAncho ? '20px 28px calc(env(safe-area-inset-bottom) + 40px)' : '16px 14px calc(env(safe-area-inset-bottom) + 30px)' }}>
          {contenido()}
        </div>
      </div>

      {boxScoreModal()}
      {perfilModal()}
    </div>
  )
}