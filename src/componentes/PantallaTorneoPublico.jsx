import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { cargarTorneoPublico } from '../torneoData'
import { sigoTorneo, contarSeguidoresTorneo, alternarSeguirTorneo } from '../torneos'

// ============================================================================
//  PANTALLA PÚBLICA DEL TORNEO (vista de fanáticos) — Media Cancha · T-012
//  Rediseño "transmisión profesional": portada de impacto, juego en vivo
//  estilo NBA, tabla pulida, líderes en tarjetas, momentos. TODO cliqueable.
//  Lee datos reales de Supabase vía cargarTorneoPublico. Identidad: azul-carbón
//  + dorado + acento tricolor dominicano, tipografía deportiva condensada.
// ============================================================================

const C = {
  bg: '#070d1d', fondo2: '#0a1226', panel: 'rgba(9,14,28,.97)',
  card: '#111a30', card2: '#0e1628',
  oro: '#f5b82e', oroClaro: '#ffd66b', oroSuave: 'rgba(245,184,46,.13)',
  txt: '#f3f6fc', body: '#e7edf6', tenue: '#9aa6bd', muyTenue: '#6b7791',
  borde: 'rgba(245,184,46,.22)', bordeSuave: 'rgba(255,255,255,.07)',
  vino: '#d24f4f', verde: '#2dd496', azul: '#5b8def', rosa: '#d4537e', fuego: '#ef7a3a',
  triAzul: '#1b3a8c', triRojo: '#ce1126',
}
const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const fDisp = "'Anton', 'Arial Narrow', Impact, sans-serif"
const fCond = "'Oswald', 'Arial Narrow', 'Helvetica Neue', sans-serif"

const ICONO_MOMENTO = { remontada: '🔥', racha: '⚡', explosion: '💥' }
const COLOR_MOMENTO = { remontada: '#ef7a3a', racha: '#e8b65a', explosion: '#d4537e' }
const ETIQUETA_MOMENTO = { remontada: 'Remontada', racha: 'Racha', explosion: 'Explosión' }
const EMO_LIDER = { puntos: ['🏀', '#f5b82e'], rebotes: ['💪', '#2dd496'], asistencias: ['🤝', '#5b8def'], robos: ['✋', '#d4537e'], tapones: ['🚫', '#ef9f27'], triples: ['🎯', '#9b6ff0'], perdidas: ['🔁', '#c77d5a'], pct_tc: ['📈', '#2dd496'], pct_tp: ['🏹', '#9b6ff0'], pct_tl: ['💯', '#f5b82e'], eficiencia: ['⚡', '#f0c040'] }

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
  const [siguiendo, setSiguiendo] = useState(false)
  const [seguidoresCount, setSeguidoresCount] = useState(0)
  const [procesandoSeguir, setProcesandoSeguir] = useState(false)
  const refMomentos = useRef(null)
  const [miId, setMiId] = useState(null)

  const esAncho = ancho >= 820
  const esEscritorio = ancho >= 1180
  const maxAncho = esEscritorio ? 1080 : (esAncho ? 900 : 560)

  // Cargar tipografía deportiva (Anton/Oswald) sin tocar otros archivos.
  useEffect(() => {
    const id = 'mc-fuentes-deportivas'
    if (typeof document === 'undefined' || document.getElementById(id)) return
    const l = document.createElement('link')
    l.id = id; l.rel = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600;700&display=swap'
    document.head.appendChild(l)
  }, [])

  useEffect(() => {
    const r = () => setAncho(window.innerWidth)
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMiId(data?.user?.id || null)) }, [])

  // Seguir / dejar de seguir el torneo (se guarda de verdad)
  const onSeguir = async () => {
    if (procesandoSeguir || !torneoRow) return
    setProcesandoSeguir(true)
    const previo = siguiendo
    // Respuesta optimista para que se sienta inmediato
    setSiguiendo(!previo)
    setSeguidoresCount((n) => Math.max(0, n + (previo ? -1 : 1)))
    const r = await alternarSeguirTorneo(torneoRow.id)
    if (r.error) {
      // Si falló, revertir
      setSiguiendo(previo)
      setSeguidoresCount((n) => Math.max(0, n + (previo ? 1 : -1)))
    } else {
      setSiguiendo(r.siguiendo)
    }
    setProcesandoSeguir(false)
  }

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
    const cargar = async (primera) => {
      try {
        let t = null
        if (torneoId) {
          const { data } = await supabase.from('torneos').select('*').eq('id', torneoId).single()
          t = data
        } else {
          const { data } = await supabase.from('torneos').select('*').order('creado_en', { ascending: false }).limit(1)
          t = (data || [])[0]
        }
        if (!t || !vivo) { if (vivo && primera) setCargando(false); return }
        setTorneoRow(t)
        if (primera) {
          // Lee el estado real de "seguir" para que no se reinicie al volver a entrar
          sigoTorneo(t.id).then((s) => { if (vivo) setSiguiendo(s) })
          contarSeguidoresTorneo(t.id).then((n) => { if (vivo) setSeguidoresCount(n) })
        }
        const pub = await cargarTorneoPublico(t.id, t.estadisticas)
        const { count } = await supabase.from('torneo_jugadores').select('id', { count: 'exact', head: true }).eq('torneo_id', t.id)
        if (!vivo) return
        setDatos(pub); setJugCount(count || 0); if (primera) setCargando(false)
      } catch (e) { if (vivo && primera) setCargando(false) }
    }
    cargar(true)
    // Refresco automático: el marcador en vivo sube solo cada doce segundos.
    const id = setInterval(() => cargar(false), 12000)
    return () => { vivo = false; clearInterval(id) }
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

  // círculo con código del equipo (para vistas pequeñas, modales)
  const avatar = (id, size) => {
    const e = eqPorId[id]; const s = size || 26
    return <span style={{ width: s, height: s, borderRadius: '50%', background: e?.color || '#444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: s * 0.38, color: '#fff', fontWeight: 800, flexShrink: 0 }}>{e?.codigo || '??'}</span>
  }
  // escudo cuadrado degradado (para el rediseño)
  const crest = (id, size, radius) => {
    const e = eqPorId[id]; const s = size || 40; const r = radius ?? Math.round(s * 0.26)
    const col = e?.color || '#3a4357'
    return (
      <span style={{ width: s, height: s, borderRadius: r, display: 'inline-grid', placeItems: 'center', background: `linear-gradient(155deg, ${col}, rgba(0,0,0,.5))`, color: '#fff', fontFamily: fCond, fontWeight: 700, fontSize: s * 0.4, letterSpacing: 0.3, flexShrink: 0, boxShadow: '0 6px 16px rgba(0,0,0,.4)', border: '1.5px solid rgba(255,255,255,.14)' }}>{e?.codigo || '??'}</span>
    )
  }
  const iniciales = (n) => ((n || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?')

  const tarjeta = { background: C.card, border: `0.5px solid ${C.bordeSuave}`, borderRadius: 16, overflow: 'hidden' }
  const titulo = (txt, color) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, marginTop: 4 }}>
      <span style={{ width: 4, height: 17, background: color || C.oro, borderRadius: 2 }} />
      <span style={{ color: C.txt, fontSize: 16, fontWeight: 800 }}>{txt}</span>
    </div>
  )
  // encabezado de sección estilo deportivo (con "Ver todo")
  const secHead = (txt, destino) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13, marginTop: 4 }}>
      <span style={{ fontFamily: fCond, fontWeight: 700, fontSize: 16, letterSpacing: 0.5, textTransform: 'uppercase', color: C.txt, display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 4, height: 18, borderRadius: 2, background: C.oro }} />{txt}
      </span>
      {destino && <button onClick={() => setPestana(destino)} style={{ border: 'none', background: 'transparent', color: C.oro, fontFamily: fCond, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>Ver todo →</button>}
    </div>
  )
  const verTodo = (destino) => (
    <button onClick={() => setPestana(destino)} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: C.oro, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Ver todo ›</button>
  )
  const scrollx = { display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }

  // ---------- COMPARTIR (real, vía Web Share / portapapeles) ----------
  const compartir = async () => {
    const nom = torneoRow?.nombre || 'este torneo'
    const texto = `Mira "${nom}" en Media Cancha 🏀`
    try {
      if (navigator.share) { await navigator.share({ title: nom, text: texto }) }
      else if (navigator.clipboard) { await navigator.clipboard.writeText(texto); }
    } catch (e) { /* el usuario canceló, no pasa nada */ }
  }

  // ---------- TARJETA DE ENFRENTAMIENTO (en vivo / próximo) ----------
  const matchupCard = (j, modo) => {
    const a = eqPorId[j.equipoA_id], b = eqPorId[j.equipoB_id]
    const ganaA = (j.puntosA || 0) >= (j.puntosB || 0)
    return (
      <div key={j.id} onClick={() => setJuegoAbierto(j)} style={{ background: `linear-gradient(160deg, ${C.fondo2}, ${C.card2})`, border: `1px solid ${C.borde}`, borderRadius: 20, padding: '20px 16px', position: 'relative', overflow: 'hidden', cursor: 'pointer', marginBottom: 4 }}>
        <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 240, height: 140, background: 'radial-gradient(ellipse, rgba(245,184,46,.10), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, textAlign: 'center', minWidth: 0 }}>
            {crest(j.equipoA_id, 58)}
            <span style={{ fontFamily: fCond, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.4, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 96 }}>{a?.nombre || 'Equipo'}</span>
          </div>
          {modo === 'vivo' ? (
            <>
              <span style={{ fontFamily: fDisp, fontSize: 40, lineHeight: 1, color: ganaA ? '#fff' : C.tenue, minWidth: 50, textAlign: 'center' }}>{j.puntosA ?? 0}</span>
              <span style={{ fontFamily: fDisp, fontSize: 20, color: C.oro, padding: '0 4px' }}>·</span>
              <span style={{ fontFamily: fDisp, fontSize: 40, lineHeight: 1, color: !ganaA ? '#fff' : C.tenue, minWidth: 50, textAlign: 'center' }}>{j.puntosB ?? 0}</span>
            </>
          ) : (
            <span style={{ fontFamily: fDisp, fontSize: 24, color: C.oro, padding: '0 10px' }}>VS</span>
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, textAlign: 'center', minWidth: 0 }}>
            {crest(j.equipoB_id, 58)}
            <span style={{ fontFamily: fCond, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.4, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 96 }}>{b?.nombre || 'Equipo'}</span>
          </div>
        </div>
        <div style={{ position: 'relative', textAlign: 'center', marginTop: 16, paddingTop: 13, borderTop: `0.5px solid ${C.bordeSuave}`, fontFamily: fCond, fontWeight: 600, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', color: C.tenue }}>
          {modo === 'vivo'
            ? <>{torneoRow?.lugar ? torneoRow.lugar + ' · ' : ''}<span style={{ color: C.oro }}>En juego ahora</span></>
            : <>Programado · <span style={{ color: C.oro }}>{fechaCorta(j.fecha)}</span></>}
        </div>
      </div>
    )
  }

  // ---------- BLOQUES REUTILIZABLES ----------
  const bloqueMomentos = () => (
    momentos.length === 0 ? null : (
      <div style={{ marginBottom: 6 }}>
        {secHead('Momentos del torneo')}
        <div ref={refMomentos} style={{ ...scrollx, marginBottom: 8 }}>
          {momentos.map((m, i) => {
            const col = COLOR_MOMENTO[m.tipo] || C.oro
            const eq = eqPorId[m.equipo_id]
            return (
              <div key={i} style={{ flex: `0 0 ${esAncho ? '300px' : '78%'}`, background: `linear-gradient(160deg, ${col}24, ${C.card2})`, border: `0.5px solid ${col}44`, borderRadius: 18, padding: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -16, right: -6, fontSize: 84, opacity: 0.09, lineHeight: 1 }}>{ICONO_MOMENTO[m.tipo] || '✨'}</div>
                <div style={{ fontSize: 22, position: 'relative' }}>{ICONO_MOMENTO[m.tipo] || '✨'}</div>
                <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 15, textTransform: 'uppercase', letterSpacing: 0.5, color: col, margin: '8px 0 6px', position: 'relative' }}>{ETIQUETA_MOMENTO[m.tipo] || 'Momento'}{m.jornada ? <span style={{ color: C.muyTenue, fontWeight: 600, marginLeft: 8 }}>J{m.jornada}</span> : null}</div>
                <div style={{ color: C.body, fontSize: 13, fontWeight: 500, lineHeight: 1.4, position: 'relative', minHeight: 36 }}>{m.titulo}</div>
                {eq && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, position: 'relative', marginTop: 9 }}>
                    {avatar(m.equipo_id, 20)}
                    <span style={{ color: C.muyTenue, fontSize: 11.5, fontWeight: 600 }}>{eq.nombre}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  )

  const filaJuegoFinal = (j, i, total) => {
    const a = eqPorId[j.equipoA_id], b = eqPorId[j.equipoB_id]
    const ganaA = (j.puntosA || 0) > (j.puntosB || 0)
    const tieneStats = estadisticas.some((s) => s.juego_id === j.id)
    return (
      <div key={j.id} onClick={() => setJuegoAbierto(j)} style={{ padding: '12px 14px', borderBottom: i < total - 1 ? `0.5px solid ${C.bordeSuave}` : 'none', cursor: 'pointer' }}>
        <div style={{ fontFamily: fCond, fontWeight: 600, color: C.muyTenue, fontSize: 10.5, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>{j.jornada ? `Jornada ${j.jornada}` : 'Final'} · {fechaCorta(j.fecha)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {crest(j.equipoA_id, 30)}
          <span style={{ flex: 1, fontFamily: fCond, fontWeight: ganaA ? 700 : 500, color: ganaA ? C.txt : C.tenue, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.3 }}>{a?.nombre || 'Equipo'}</span>
          <span style={{ fontFamily: fDisp, color: ganaA ? C.oro : C.tenue, fontSize: 22, width: 34, textAlign: 'right' }}>{j.puntosA}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          {crest(j.equipoB_id, 30)}
          <span style={{ flex: 1, fontFamily: fCond, fontWeight: !ganaA ? 700 : 500, color: !ganaA ? C.txt : C.tenue, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.3 }}>{b?.nombre || 'Equipo'}</span>
          <span style={{ fontFamily: fDisp, color: !ganaA ? C.oro : C.tenue, fontSize: 22, width: 34, textAlign: 'right' }}>{j.puntosB}</span>
        </div>
        <div style={{ marginTop: 9, textAlign: 'right', color: C.oro, fontSize: 11, fontWeight: 700 }}>{tieneStats ? 'Ver box score →' : 'Ver detalle →'}</div>
      </div>
    )
  }

  // fila de tabla pulida (rank + escudo + récord + PTS). Cliqueable → equipo.
  const filaTabla = (e, i, grande) => {
    const lider = e.posicion === 1
    const perdidas = (e.jugados || 0) - (e.ganados || 0)
    return (
      <div key={e.equipo_id} onClick={() => { setEquipoAbierto(e.equipo_id); setPestana('equipos') }} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 34px 44px 40px', gap: 6, alignItems: 'center', padding: grande ? '13px 14px' : '12px 14px', borderBottom: `0.5px solid rgba(255,255,255,.05)`, cursor: 'pointer', background: lider ? 'linear-gradient(90deg, rgba(245,184,46,.12), transparent)' : 'transparent' }}>
        <span style={{ fontFamily: fDisp, fontSize: 18, textAlign: 'center', color: lider ? C.oro : C.muyTenue }}>{e.posicion}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {crest(e.equipo_id, 30)}
          <span style={{ fontFamily: fCond, fontWeight: 600, fontSize: 13.5, textTransform: 'uppercase', letterSpacing: 0.3, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.nombre}</span>
        </span>
        <span style={{ fontFamily: fCond, fontWeight: 600, fontSize: 14, textAlign: 'center', color: C.tenue }}>{e.jugados}</span>
        <span style={{ fontFamily: fCond, fontWeight: 600, fontSize: 14, textAlign: 'center', color: C.body }}>{e.ganados}-{perdidas}</span>
        <span style={{ fontFamily: fCond, fontWeight: 700, fontSize: 15, textAlign: 'center', color: C.oro }}>{e.puntos}</span>
      </div>
    )
  }

  // tarjeta de líder (horizontal). Cliqueable → perfil del jugador.
  const tarjetaLider = (c) => {
    const t = c.filas[0]; const par = EMO_LIDER[c.id] || ['🏀', C.oro]
    const eq = eqPorId[t.equipo_id]
    return (
      <div key={c.id} onClick={() => t.jugador_id && setJugadorAbierto(t.jugador_id)} style={{ flex: '0 0 160px', background: `linear-gradient(165deg, ${C.card}, ${C.card2})`, border: `0.5px solid ${C.bordeSuave}`, borderRadius: 17, padding: 15, cursor: t.jugador_id ? 'pointer' : 'default', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: par[1] }}>★ {c.titulo}</div>
        <div style={{ width: 46, height: 46, borderRadius: '50%', display: 'grid', placeItems: 'center', fontFamily: fCond, fontWeight: 700, fontSize: 16, color: '#fff', margin: '12px 0 9px', background: `linear-gradient(150deg, ${eq?.color || '#3a4357'}, rgba(0,0,0,.45))`, boxShadow: `0 0 0 2px ${par[1]}` }}>{iniciales(t.nombre)}</div>
        <div style={{ fontFamily: fCond, fontWeight: 600, fontSize: 14, textTransform: 'uppercase', lineHeight: 1.05, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre}</div>
        <div style={{ color: C.muyTenue, fontSize: 10.5, marginTop: 2 }}>{eq?.nombre || ''}</div>
        <div style={{ fontFamily: fDisp, fontSize: 34, color: '#fff', marginTop: 10, lineHeight: 1 }}>{t.valor}{c.esPct ? '%' : ''}<span style={{ fontFamily: fCond, fontWeight: 600, fontSize: 11, color: C.tenue, marginLeft: 4, letterSpacing: 0.5 }}>{c.sub || 'x juego'}</span></div>
      </div>
    )
  }

  const tarjetaMVP = (j, idx) => (
    <div key={j.equipo_id + '-' + idx} onClick={() => j.jugador_id && setJugadorAbierto(j.jugador_id)} style={{ ...tarjeta, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 13, cursor: j.jugador_id ? 'pointer' : 'default', background: idx === 0 ? `linear-gradient(150deg, ${C.oroSuave}, ${C.card})` : C.card, border: idx === 0 ? `0.5px solid ${C.borde}` : `0.5px solid ${C.bordeSuave}` }}>
      <div style={{ position: 'relative' }}>
        {avatar(j.equipo_id, 46)}
        <span style={{ position: 'absolute', top: -6, right: -6, fontSize: 16 }}>{['👑', '🥈', '🥉'][idx] || ''}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: C.txt, fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombre}</div>
        <div style={{ color: C.muyTenue, fontSize: 12 }}>{eqPorId[j.equipo_id]?.nombre || ''}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: fDisp, color: C.oro, fontSize: 26, lineHeight: 1 }}>{j.mcRating}</div>
        <div style={{ color: C.muyTenue, fontSize: 10 }}>valoración</div>
      </div>
    </div>
  )

  // ---------- CONTENIDO POR PESTAÑA ----------
  const contenido = () => {
    if (cargando) return <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, padding: '50px 0' }}>Cargando torneo…</div>
    if (!datos) return <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, padding: '50px 0' }}>No se encontró el torneo.</div>

    if (pestana === 'portada') {
      const lideresCon = lideres.filter((c) => c.filas && c.filas.length)
      return (
        <>
          {/* EN VIVO / PRÓXIMO */}
          {enVivo.length > 0 ? (
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: fCond, fontWeight: 700, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: '#ff5b5b', marginBottom: 9 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3b3b', boxShadow: '0 0 8px #ff3b3b' }} /> En vivo ahora
              </div>
              {enVivo.slice(0, 2).map((j) => matchupCard(j, 'vivo'))}
            </div>
          ) : proximos.length > 0 ? (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: C.oro, marginBottom: 9 }}>Próximo juego</div>
              {matchupCard(proximos[0], 'prox')}
            </div>
          ) : null}

          {/* TABLA */}
          <div style={{ marginBottom: 22 }}>
            {secHead('Tabla de posiciones', 'tabla')}
            <div style={{ background: `linear-gradient(160deg, ${C.card}, ${C.card2})`, border: `0.5px solid ${C.bordeSuave}`, borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 34px 44px 40px', gap: 6, padding: '11px 14px', fontFamily: fCond, fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: C.muyTenue, borderBottom: `0.5px solid ${C.bordeSuave}` }}>
                <span style={{ textAlign: 'center' }}>#</span><span>Equipo</span>
                <span style={{ textAlign: 'center' }}>PJ</span><span style={{ textAlign: 'center' }}>G-P</span><span style={{ textAlign: 'center' }}>PTS</span>
              </div>
              {tabla.length === 0 ? <div style={{ padding: 16, color: C.muyTenue, fontSize: 13 }}>Aún no hay posiciones. Aparecerán cuando se jueguen partidos.</div> : tabla.slice(0, 5).map((e, i) => filaTabla(e, i, false))}
            </div>
          </div>

          {/* LÍDERES */}
          {lideresCon.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              {secHead('Líderes del torneo', 'lideres')}
              <div style={scrollx}>{lideresCon.slice(0, 6).map((c) => tarjetaLider(c))}</div>
            </div>
          )}

          {/* MOMENTOS */}
          {bloqueMomentos()}
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
              <div key={j.id} onClick={() => setJuegoAbierto(j)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', borderBottom: i < proximos.length - 1 ? `0.5px solid ${C.bordeSuave}` : 'none', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  {crest(j.equipoA_id, 26)}<span style={{ fontFamily: fCond, fontWeight: 600, fontSize: 13, textTransform: 'uppercase', color: C.body }}>{eqPorId[j.equipoA_id]?.codigo}</span>
                  <span style={{ color: C.muyTenue, fontSize: 12 }}>vs</span>
                  {crest(j.equipoB_id, 26)}<span style={{ fontFamily: fCond, fontWeight: 600, fontSize: 13, textTransform: 'uppercase', color: C.body }}>{eqPorId[j.equipoB_id]?.codigo}</span>
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
          {secHead('Tabla de posiciones')}
          <div style={{ background: `linear-gradient(160deg, ${C.card}, ${C.card2})`, border: `0.5px solid ${C.bordeSuave}`, borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 34px 44px 40px', gap: 6, padding: '11px 14px', fontFamily: fCond, fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: C.muyTenue, borderBottom: `0.5px solid ${C.bordeSuave}` }}>
              <span style={{ textAlign: 'center' }}>#</span><span>Equipo</span>
              <span style={{ textAlign: 'center' }}>PJ</span><span style={{ textAlign: 'center' }}>G-P</span><span style={{ textAlign: 'center' }}>PTS</span>
            </div>
            {tabla.length === 0 ? <div style={{ padding: 16, color: C.muyTenue, fontSize: 13 }}>Aún no hay posiciones.</div> : tabla.map((e, i) => filaTabla(e, i, true))}
          </div>
          <div style={{ color: C.muyTenue, fontSize: 11, textAlign: 'center', marginTop: 10 }}>Toca un equipo para ver su plantilla y estadísticas</div>
        </>
      )
    }

    if (pestana === 'lideres') {
      const lideresCon = lideres.filter((c) => c.filas && c.filas.length)
      return (
        <>
          {secHead('Líderes por estadística')}
          {lideresCon.length === 0 ? (
            <div style={{ ...tarjeta, padding: 20, textAlign: 'center', color: C.muyTenue, fontSize: 13, marginBottom: 20 }}>Aún no hay estadísticas.</div>
          ) : lideresCon.map((c) => {
            const top1 = c.filas[0]; const par = EMO_LIDER[c.id] || ['🏀', C.oro]
            return (
              <div key={c.id} onClick={() => top1.jugador_id && setJugadorAbierto(top1.jugador_id)} style={{ ...tarjeta, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 13, cursor: top1.jugador_id ? 'pointer' : 'default' }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: `${par[1]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23 }}>{par[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: fCond, fontWeight: 600, color: C.tenue, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.6 }}>{c.titulo}</div>
                  <div style={{ color: C.txt, fontSize: 15, fontWeight: 700 }}>{top1.nombre}</div>
                  <div style={{ color: C.muyTenue, fontSize: 12 }}>{eqPorId[top1.equipo_id]?.nombre || ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: fDisp, color: par[1], fontSize: 28, lineHeight: 1 }}>{top1.valor}{c.esPct ? '%' : ''}</div>
                  <div style={{ color: C.muyTenue, fontSize: 10.5, marginTop: 2 }}>{c.sub || 'por juego'}</div>
                </div>
              </div>
            )
          })}

          {mvp.length > 0 && (
            <>
              <div style={{ height: 10 }} />
              {secHead('Carrera por el MVP')}
              <div style={{ color: C.muyTenue, fontSize: 11.5, marginBottom: 12, marginTop: -6 }}>Ranking general por valoración. Los tres primeros entran a la votación 👑</div>
              <div style={tarjeta}>
                {top.slice(0, 10).map((j, i) => (
                  <div key={j.equipo_id + '-' + i} onClick={() => setJugadorAbierto(j.jugador_id)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderBottom: i < Math.min(top.length, 10) - 1 ? `0.5px solid ${C.bordeSuave}` : 'none', background: i < 3 ? `${C.oro}0d` : 'transparent', cursor: 'pointer' }}>
                    <span style={{ fontFamily: fDisp, width: 24, textAlign: 'center', color: i < 3 ? C.oro : C.tenue, fontSize: 17 }}>{j.posicion}</span>
                    {crest(j.equipo_id, 30)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: fCond, fontWeight: 600, color: C.txt, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombre}</div>
                      <div style={{ color: C.muyTenue, fontSize: 11.5 }}>{eqPorId[j.equipo_id]?.nombre || ''}</div>
                    </div>
                    {i < 3 && <span style={{ fontSize: 13 }}>👑</span>}
                    <span style={{ fontFamily: fDisp, color: C.oro, fontSize: 19 }}>{j.mcRating}</span>
                  </div>
                ))}
              </div>
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
          {secHead('Equipos y plantillas')}
          {(datos.equipos || []).length === 0 ? (
            <div style={{ ...tarjeta, padding: 20, textAlign: 'center', color: C.muyTenue, fontSize: 13 }}>Aún no hay equipos.</div>
          ) : (datos.equipos || []).map((eq) => {
            const fila = tabla.find((t) => t.equipo_id === eq.id)
            const plantilla = roster.filter((p) => p.equipo_id === eq.id).sort((a, b) => (statsMap[b.jugador_id]?.prom.puntos || 0) - (statsMap[a.jugador_id]?.prom.puntos || 0))
            const abierto = equipoAbierto === eq.id
            return (
              <div key={eq.id} style={{ ...tarjeta, marginBottom: 11, border: abierto ? `0.5px solid ${C.borde}` : `0.5px solid ${C.bordeSuave}` }}>
                <div onClick={() => setEquipoAbierto(abierto ? null : eq.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer' }}>
                  {crest(eq.id, 44)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 15.5, textTransform: 'uppercase', letterSpacing: 0.3, color: C.txt }}>{eq.nombre}</div>
                    <div style={{ color: C.tenue, fontSize: 12 }}>{fila ? `${fila.ganados}-${fila.jugados - fila.ganados}` : 'sin juegos'} · {plantilla.length} jugador{plantilla.length === 1 ? '' : 'es'}</div>
                  </div>
                  <span style={{ color: C.tenue, fontSize: 20, display: 'inline-block', transform: abierto ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>›</span>
                </div>
                {abierto && (
                  <div style={{ borderTop: `0.5px solid ${C.bordeSuave}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', fontFamily: fCond, fontWeight: 600, fontSize: 10, color: C.muyTenue, textTransform: 'uppercase', letterSpacing: 0.6 }}>
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
                          <span style={{ fontFamily: fCond, fontWeight: 700, width: 26, color: C.tenue }}>{p.numero ?? '–'}</span>
                          {p.foto ? <img src={p.foto} alt="" style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'cover', marginRight: 9, flexShrink: 0, border: `1px solid ${C.bordeSuave}` }} /> : null}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: C.txt, fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.nombre}{p.esCapitan ? <span style={{ fontSize: 11 }}>©</span> : null}{p.esRefuerzo ? <span style={{ fontSize: 9, color: C.azul, fontWeight: 800 }}>REF</span> : null}
                            </div>
                            {p.posicion ? <div style={{ color: C.muyTenue, fontSize: 11 }}>{p.posicion}</div> : null}
                          </div>
                          <span style={{ width: 30, textAlign: 'center', color: C.tenue }}>{s?.juegos ?? 0}</span>
                          <span style={{ fontFamily: fCond, fontWeight: 700, width: 40, textAlign: 'center', color: C.oro }}>{s ? r1(s.prom.puntos) : '–'}</span>
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
        <div style={{ ...tarjeta, padding: '34px 20px', textAlign: 'center', marginTop: 10, background: `linear-gradient(160deg, ${C.card}, ${C.card2})` }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>{esVotos ? '🗳️' : '📸'}</div>
          <div style={{ fontFamily: fCond, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: C.txt, fontSize: 18, marginBottom: 8 }}>{esVotos ? 'Votaciones' : 'Álbumes de fotos'}</div>
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>{crest(j.equipoA_id, 50)}<span style={{ color: ganaA ? C.txt : C.tenue, fontSize: 13, fontWeight: ganaA ? 700 : 500, textAlign: 'center' }}>{a?.nombre || 'Equipo'}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px' }}>
                <span style={{ fontFamily: fDisp, color: ganaA ? C.oro : C.tenue, fontSize: 38 }}>{j.puntosA}</span>
                <span style={{ color: C.muyTenue, fontSize: 18 }}>—</span>
                <span style={{ fontFamily: fDisp, color: !ganaA ? C.oro : C.tenue, fontSize: 38 }}>{j.puntosB}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>{crest(j.equipoB_id, 50)}<span style={{ color: !ganaA ? C.txt : C.tenue, fontSize: 13, fontWeight: !ganaA ? 700 : 500, textAlign: 'center' }}>{b?.nombre || 'Equipo'}</span></div>
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
        <div style={{ fontFamily: fDisp, color: color || C.txt, fontSize: 21 }}>{val}</div>
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
              {ros?.foto ? <img src={ros.foto} alt="" style={{ width: 58, height: 58, borderRadius: 14, objectFit: 'cover', border: `1px solid ${C.bordeSuave}`, display: 'block' }} /> : crest(equipoId, 58)}
              {numero != null && <span style={{ position: 'absolute', bottom: -4, right: -4, background: C.bg, border: `2px solid ${eq?.color || '#444'}`, color: C.txt, fontSize: 11, fontWeight: 800, borderRadius: 10, padding: '1px 6px' }}>{numero}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.txt, fontSize: 19, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</div>
              <div style={{ color: C.tenue, fontSize: 13 }}>{eq?.nombre || ''}{posicion ? ` · ${posicion}` : ''}</div>
            </div>
            {jug && <div style={{ textAlign: 'center' }}><div style={{ fontFamily: fDisp, color: C.oro, fontSize: 30, lineHeight: 1 }}>{jug.mcRating}</div><div style={{ color: C.muyTenue, fontSize: 10 }}>valoración</div></div>}
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
    { id: 'portada', t: 'Portada' },
    { id: 'tabla', t: 'Tabla' },
    { id: 'juegos', t: 'Juegos' },
    { id: 'lideres', t: 'Líderes' },
    { id: 'equipos', t: 'Equipos' },
    { id: 'votos', t: 'Votos' },
    { id: 'albumes', t: 'Álbumes' },
  ]

  const nombre = torneoRow?.nombre || 'Torneo'
  const nEquipos = datos?.equipos?.length || 0
  const cg = 2 * Math.PI * 22 // circunferencia del medidor
  const offCalidad = cg * (1 - (calidad || 0) / 100)

  // pastilla de "edición"
  const pastillaEdicion = `${nombreFormato(torneoRow?.formato)}${torneoRow?.nivel ? ' · ' + torneoRow.nivel : ' · Temporada activa'}`

  return (
    <div style={{ position: 'fixed', inset: 0, height: '100dvh', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: font, overflow: 'hidden' }}>
      {/* BARRA SUPERIOR FIJA (tricolor + volver + marca + anotar) */}
      <div style={{ flexShrink: 0, position: 'relative', zIndex: 6, background: C.panel, borderBottom: `0.5px solid ${C.bordeSuave}`, paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ height: 4, display: 'flex' }}>
          <i style={{ flex: 1, background: C.triAzul }} /><i style={{ flex: 1, background: '#fff' }} /><i style={{ flex: 1, background: C.triRojo }} />
        </div>
        <div style={{ maxWidth: maxAncho, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
          <button onClick={onVolver} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: C.tenue, fontSize: 14, fontWeight: 600, cursor: 'pointer', minWidth: 70 }}>‹ Volver</button>
          <span style={{ fontFamily: fCond, fontWeight: 700, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: C.oro }}>Media Cancha</span>
          <span style={{ minWidth: 70 }} />
        </div>
      </div>

      {/* ÁREA DE SCROLL: portada grande + pestañas pegajosas + contenido */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>

        {/* HERO / PORTADA */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -70, left: '50%', transform: 'translateX(-50%)', width: 420, height: 420, background: 'radial-gradient(circle, rgba(245,184,46,.18), transparent 62%)', pointerEvents: 'none' }} />
          {torneoRow?.logo_url && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${torneoRow.logo_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px) saturate(1.25)', opacity: 0.16, pointerEvents: 'none' }} />}
          <div style={{ position: 'relative', maxWidth: maxAncho, margin: '0 auto', padding: '22px 20px 4px', textAlign: 'center' }}>
            <div style={{ width: 92, height: 92, margin: '6px auto 14px', borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #16223f, #0b1228)', border: `2px solid ${C.oro}`, display: 'grid', placeItems: 'center', overflow: 'hidden', boxShadow: '0 0 0 6px rgba(245,184,46,.08), 0 18px 40px rgba(0,0,0,.55)' }}>{torneoRow?.logo_url ? <img src={torneoRow.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 44 }}>{torneoRow?.emoji || '🏆'}</span>}</div>
            <div style={{ display: 'inline-block', fontFamily: fCond, fontWeight: 600, fontSize: 10, letterSpacing: 2.5, color: C.oro, textTransform: 'uppercase', border: `1px solid ${C.borde}`, borderRadius: 30, padding: '4px 14px', marginBottom: 12 }}>{pastillaEdicion}</div>
            <div style={{ fontFamily: fDisp, fontSize: 'clamp(34px, 11vw, 50px)', lineHeight: 0.94, letterSpacing: 0.5, textTransform: 'uppercase', color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,.5)' }}>{nombre}</div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginTop: 14 }}>
              <span style={{ fontFamily: fCond, fontWeight: 700, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', padding: '6px 12px', borderRadius: 9, background: `linear-gradient(180deg, ${C.oroClaro}, ${C.oro})`, color: '#1a1205' }}>{nombreFormato(torneoRow?.formato)}</span>
              {torneoRow?.lugar && <span style={{ fontFamily: fCond, fontWeight: 500, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', padding: '6px 12px', borderRadius: 9, background: 'rgba(255,255,255,.05)', border: `1px solid ${C.bordeSuave}`, color: C.tenue }}>📍 {torneoRow.lugar}</span>}
              {torneoRow?.rama && <span style={{ fontFamily: fCond, fontWeight: 500, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', padding: '6px 12px', borderRadius: 9, background: 'rgba(255,255,255,.05)', border: `1px solid ${C.bordeSuave}`, color: C.tenue }}>{torneoRow.rama}</span>}
              <span style={{ fontFamily: fCond, fontWeight: 500, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', padding: '6px 12px', borderRadius: 9, background: 'rgba(255,255,255,.05)', border: `1px solid ${C.bordeSuave}`, color: C.tenue }}>{nEquipos} equipos</span>
            </div>

            {/* SELLOS */}
            <div style={{ display: 'flex', gap: 12, margin: '20px 4px 4px' }}>
              <div style={{ flex: 1, background: `linear-gradient(160deg, ${C.card}, ${C.card2})`, border: `1px solid ${C.bordeSuave}`, borderRadius: 16, padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 52, height: 52, flexShrink: 0, position: 'relative' }}>
                  <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5" />
                    <circle cx="26" cy="26" r="22" fill="none" stroke={C.oro} strokeWidth="5" strokeLinecap="round" strokeDasharray={cg} strokeDashoffset={offCalidad} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: fCond, fontWeight: 700, fontSize: 17, color: C.oro }}>{calidad || '—'}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontFamily: fCond, fontWeight: 600, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: C.muyTenue }}>Calidad</div>
                  <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 19, color: C.txt, lineHeight: 1.1 }}>{calidad >= 80 ? 'Alto nivel' : calidad >= 60 ? 'Buen nivel' : calidad > 0 ? 'En forma' : 'Por jugar'}</div>
                </div>
              </div>
              <div style={{ flex: 1, background: `linear-gradient(160deg, ${C.card}, ${C.card2})`, border: `1px solid ${C.bordeSuave}`, borderRadius: 16, padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 13, display: 'grid', placeItems: 'center', fontSize: 26, background: 'radial-gradient(circle, rgba(206,17,38,.25), rgba(245,184,46,.10))', border: `1px solid ${C.borde}` }}>🔥</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontFamily: fCond, fontWeight: 600, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: C.muyTenue }}>Popularidad</div>
                  <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 19, color: C.txt, lineHeight: 1.1 }}>{popularidad || '—'}</div>
                </div>
              </div>
            </div>

            {/* ACCIONES */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={onSeguir} disabled={procesandoSeguir} style={{ flex: 1, border: siguiendo ? `1px solid ${C.borde}` : 'none', borderRadius: 13, padding: 13, fontFamily: fCond, fontWeight: 600, fontSize: 14, letterSpacing: 0.6, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: siguiendo ? 'rgba(245,184,46,.10)' : `linear-gradient(180deg, ${C.oroClaro}, ${C.oro})`, color: siguiendo ? C.oro : '#1a1205', boxShadow: siguiendo ? 'none' : '0 8px 22px rgba(245,184,46,.26)' }}>{siguiendo ? '✓ Siguiendo' : '＋ Seguir'}</button>
              <button onClick={compartir} style={{ flex: 1, border: `1px solid ${C.bordeSuave}`, borderRadius: 13, padding: 13, fontFamily: fCond, fontWeight: 600, fontSize: 14, letterSpacing: 0.6, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,.05)', color: C.txt }}>↗ Compartir</button>
            </div>
            {seguidoresCount > 0 && (
              <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12.5, color: C.tenue }}>
                <b style={{ color: C.txt, fontWeight: 700 }}>{seguidoresCount.toLocaleString('es-DO')}</b> {seguidoresCount === 1 ? 'persona sigue' : 'personas siguen'} este torneo
              </div>
            )}
          </div>
        </div>

        {/* PESTAÑAS (pegajosas) */}
        <div style={{ position: 'sticky', top: 0, zIndex: 5, background: C.bg, paddingTop: 14 }}>
          <div style={{ maxWidth: maxAncho, margin: '0 auto', display: 'flex', gap: 5, overflowX: 'auto', padding: '0 14px 6px', scrollbarWidth: 'none' }}>
            {TABS.map((p) => {
              const activa = pestana === p.id
              return (
                <button key={p.id} onClick={() => setPestana(p.id)} style={{ flexShrink: 0, border: 'none', borderRadius: 11, padding: '9px 15px', fontFamily: fCond, fontWeight: activa ? 700 : 600, fontSize: 12.5, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', color: activa ? '#1a1205' : C.muyTenue, background: activa ? `linear-gradient(180deg, ${C.oroClaro}, ${C.oro})` : 'transparent' }}>{p.t}</button>
              )
            })}
          </div>
          <div style={{ height: 1, background: C.bordeSuave }} />
        </div>

        {/* CONTENIDO */}
        <div style={{ maxWidth: maxAncho, margin: '0 auto', padding: esAncho ? '20px 28px calc(env(safe-area-inset-bottom) + 40px)' : '18px 14px calc(env(safe-area-inset-bottom) + 34px)' }}>
          {contenido()}
        </div>
      </div>

      {boxScoreModal()}
      {perfilModal()}
    </div>
  )
}