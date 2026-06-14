import { useState, useEffect, useRef } from 'react'
import fondoCancha from '../assets/fondo-cancha.png'

const TEMAS = {
  dorado: { acento: '#e8b65a', borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)', texto: 'linear-gradient(120deg,#fbe08a,#c8842e)', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', glow: 'rgba(190,135,55,0.20)' },
  azul: { acento: '#6fb0ec', borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)', texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', glow: 'rgba(55,120,190,0.22)' },
}

// Colores de equipo armonizados con el tema de la app (A dorado, B azul)
const EQ = [
  { acento: '#e8b65a', fuerte: '#c8842e', suave: 'rgba(232,169,75,.10)', borde: 'rgba(232,169,75,.45)', solido: 'linear-gradient(150deg,#f3cf63,#c8842e)', textoBoton: '#1a1205' },
  { acento: '#6fb0ec', fuerte: '#3b7fcf', suave: 'rgba(111,176,236,.10)', borde: 'rgba(111,176,236,.45)', solido: 'linear-gradient(150deg,#6fb0ec,#2f6fc8)', textoBoton: '#04121f' },
]

const VERDE = '#2fbf71', ROJO = '#e0563f', TENUE = '#9aa7b2', TEXTO = '#eef3f6'
// placa de cristal (igual que login/perfil/config)
const VIDRIO = 'linear-gradient(150deg, rgba(24,26,30,0.88), rgba(12,14,18,0.92))'
const VIDRIO_CLARO = 'linear-gradient(150deg, rgba(30,33,38,0.9), rgba(16,18,22,0.93))'
const BORDE_TENUE = 'rgba(255,255,255,.12)'

const ACCIONES_PUNTO = [
  { id: 'p2', ico: '2', et: '2 Puntos', pts: 2, sub: 'Doble', pos: true },
  { id: 'p3', ico: '3', et: 'Triple', pts: 3, sub: 'Triple', pos: true },
  { id: 'p1', ico: '1', et: 'Punto', pts: 1, sub: 'Punto', pos: true },
]
const ACCIONES_OTRAS = {
  reb: { id: 'reb', ico: '⊕', et: 'Rebote', pts: 0, sub: 'Rebote', suma: { reb: 1 } },
  ast: { id: 'ast', ico: '↗', et: 'Asistencia', pts: 0, sub: 'Asist.', suma: { ast: 1 } },
}

export default function PantallaJuegoVivo({ config, onTerminar, onVolver }) {
  const tema = (typeof window !== 'undefined' && localStorage.getItem('mc_tema')) || 'dorado'
  const T = TEMAS[tema] || TEMAS.dorado
  const ORO = { background: T.texto, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }
  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

  const statsActivas = config?.statsActivas || ['pts']
  const accionesOtras = ['reb', 'ast'].filter((s) => statsActivas.includes(s)).map((s) => ACCIONES_OTRAS[s])
  const accionesTodas = [...ACCIONES_PUNTO.map((a) => ({ ...a, suma: { pts: a.pts } })), ...accionesOtras]

  const [jugadores, setJugadores] = useState(config?.jugadores || [])
  const [historial, setHistorial] = useState([])
  const [modo, setModo] = useState(config?.modoAnotacion || 'jugada')
  const [seleccion, setSeleccion] = useState(null)
  const [hojaPrev, setHojaPrev] = useState(null) // recuerda el contenido mientras la hoja baja
  const [toast, setToast] = useState('')
  const toastRef = useRef(null)

  const [verPizarra, setVerPizarra] = useState(false)
  const [sustituyendo, setSustituyendo] = useState(null)
  const [cambioEquipo, setCambioEquipo] = useState(null)
  const [jugASustituir, setJugASustituir] = useState(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoNumero, setNuevoNumero] = useState('')
  const [confirmarFin, setConfirmarFin] = useState(false)
  const [avisoFin, setAvisoFin] = useState(null)

  const esPorReloj = config?.tipoFin === 'reloj'
  const [segs, setSegs] = useState(esPorReloj ? (config.minutos || 10) * 60 : 0)
  const [corriendo, setCorriendo] = useState(false)
  const intervalo = useRef(null)

  useEffect(() => {
    if (corriendo && esPorReloj) {
      intervalo.current = setInterval(() => {
        setSegs((s) => { if (s <= 1) { clearInterval(intervalo.current); setCorriendo(false); setAvisoFin('reloj'); return 0 } return s - 1 })
      }, 1000)
    }
    return () => clearInterval(intervalo.current)
  }, [corriendo, esPorReloj])

  useEffect(() => {
    if (config?.tipoFin !== 'puntos' || avisoFin) return
    const a = jugadores.filter((j) => j.equipo === 0).reduce((x, j) => x + j.pts, 0)
    const b = jugadores.filter((j) => j.equipo === 1).reduce((x, j) => x + j.pts, 0)
    const lider = Math.max(a, b), dif = Math.abs(a - b)
    if (lider >= config.puntosMeta && (!config.porDif2 || dif >= 2)) setAvisoFin('puntos')
  }, [jugadores])

  useEffect(() => {
    if (seleccion) setHojaPrev(seleccion)
  }, [seleccion])

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const totalEquipo = (eq) => jugadores.filter((j) => j.equipo === eq).reduce((a, j) => a + j.pts, 0)
  const metaPuntos = config?.tipoFin === 'puntos' ? config.puntosMeta : null
  const jugadoresEq = (eq) => jugadores.filter((j) => j.equipo === eq)

  const mostrarToast = (txt) => { setToast(txt); clearTimeout(toastRef.current); toastRef.current = setTimeout(() => setToast(''), 1500) }

  // vibración háptica (da feeling de cancha) - patrones según la acción
  const vibrar = (patron) => { try { if (navigator.vibrate) navigator.vibrate(patron) } catch (e) {} }

  const registrar = (accion, jug) => {
    const suma = accion.suma || (accion.pts ? { pts: accion.pts } : {})
    setJugadores((prev) => prev.map((j) => {
      if (j.id !== jug.id) return j
      const nuevo = { ...j }
      Object.entries(suma).forEach(([k, v]) => { nuevo[k] = (nuevo[k] || 0) + v })
      return nuevo
    }))
    setHistorial((prev) => [...prev, { id: 'h' + Date.now() + Math.random().toString(36).slice(2, 6), jugId: jug.id, etiquetaJug: jug.etiqueta, equipo: jug.equipo, accionId: accion.id, etiquetaAccion: accion.et || accion.etiqueta, sub: accion.sub, suma }])
    mostrarToast(`${accion.sub} · ${jug.etiqueta}`)
    // vibración: punto = toque medio (35ms), otra acción = toque suave (20ms)
    vibrar((suma.pts && suma.pts > 0) ? 35 : 20)
    setSeleccion(null)
  }

  const tocarAccion = (accion, equipo) => { vibrar(12); setSeleccion({ tipo: 'accion', equipo, accion }) }
  const tocarJugador = (jug) => { vibrar(12); setSeleccion({ tipo: 'jugador', equipo: jug.equipo, jug }) }
  const elegirJugadorEnHoja = (jug) => { if (seleccion?.accion) registrar(seleccion.accion, jug) }
  const elegirAccionEnHoja = (accion) => { if (seleccion?.jug) registrar(accion, seleccion.jug) }

  const deshacer = (h) => {
    setJugadores((prev) => prev.map((j) => {
      if (j.id !== h.jugId) return j
      const nuevo = { ...j }
      Object.entries(h.suma).forEach(([k, v]) => { nuevo[k] = (nuevo[k] || 0) - v })
      return nuevo
    }))
    setHistorial((prev) => prev.filter((x) => x.id !== h.id))
    mostrarToast('Jugada deshecha')
    vibrar([20, 40, 20])
  }

  const sustituir = (hViejo, accionNueva, jugNuevo) => {
    const sumaNueva = accionNueva.suma || (accionNueva.pts ? { pts: accionNueva.pts } : {})
    setJugadores((prev) => prev.map((j) => {
      let nuevo = { ...j }
      if (j.id === hViejo.jugId) Object.entries(hViejo.suma).forEach(([k, v]) => { nuevo[k] = (nuevo[k] || 0) - v })
      if (j.id === jugNuevo.id) Object.entries(sumaNueva).forEach(([k, v]) => { nuevo[k] = (nuevo[k] || 0) + v })
      return nuevo
    }))
    setHistorial((prev) => prev.map((x) => x.id === hViejo.id ? { ...x, jugId: jugNuevo.id, etiquetaJug: jugNuevo.etiqueta, equipo: jugNuevo.equipo, accionId: accionNueva.id, etiquetaAccion: accionNueva.et || accionNueva.etiqueta, sub: accionNueva.sub, suma: sumaNueva } : x))
    setSustituyendo(null)
  }

  const aplicarCambio = () => {
    if (!nuevoNombre.trim() && !nuevoNumero.trim()) return
    setJugadores((prev) => prev.map((j) => j.id === jugASustituir.id ? { ...j, nombre: nuevoNombre.trim(), numero: nuevoNumero.trim(), etiqueta: nuevoNombre.trim() || ('#' + nuevoNumero.trim()), pts: 0, reb: 0, ast: 0 } : j))
    setCambioEquipo(null); setJugASustituir(null); setNuevoNombre(''); setNuevoNumero('')
  }

  // ---- cabecera de cada lado ----
  const ladoHead = (eq) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, color: EQ[eq].acento, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: EQ[eq].fuerte }} />
        {eq === 0 ? config?.nombreA : config?.nombreB} · {modo === 'jugada' ? '¿qué pasó?' : '¿quién?'}
      </div>
      <button onClick={() => setCambioEquipo(eq)} style={{ fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 18, background: 'rgba(255,255,255,.04)', border: `1px solid ${EQ[eq].borde}`, color: EQ[eq].acento, cursor: 'pointer', flexShrink: 0 }}>⇄ Cambio</button>
    </div>
  )

  // boton de accion (modo jugada) - estilo cristal
  const botonAccion = (a, eq) => (
    <button key={a.id} onClick={() => tocarAccion(a, eq)} style={{
      border: `1.5px solid ${BORDE_TENUE}`, borderRadius: 13, cursor: 'pointer', background: VIDRIO,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 0, padding: '4px 2px',
    }}>
      <span style={{ fontSize: 21, fontWeight: 800, lineHeight: 1, color: a.pos ? VERDE : EQ[eq].acento }}>{a.ico}</span>
      <span style={{ fontSize: 10.5, fontWeight: 600, color: TENUE }}>{a.et}</span>
    </button>
  )

  // jugador en cancha (modo jugador) - rectangulo vertical ALTO que llena el espacio
  const jugadorEnCancha = (j) => (
    <button key={j.id} onClick={() => tocarJugador(j)} style={{
      border: `1.5px solid ${EQ[j.equipo].borde}`, borderRadius: 16, cursor: 'pointer', background: VIDRIO,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 2px', minHeight: 0, height: '100%',
    }}>
      <span style={{ fontSize: 34, fontWeight: 800, lineHeight: 1, color: EQ[j.equipo].acento }}>{j.numero || (j.nombre || '?').slice(0, 1).toUpperCase()}</span>
      <span style={{ fontSize: 11, color: TENUE, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>{j.nombre || ('#' + j.numero)}</span>
    </button>
  )

  // RECTANGULO VERTICAL para la hoja (jugador "parado", fila de 5 como el diseño)
  const jugadorVertical = (j, onClick) => (
    <button key={j.id} onClick={() => onClick(j)} style={{
      border: `1.5px solid ${EQ[j.equipo].borde}`, borderRadius: 14, cursor: 'pointer', background: VIDRIO_CLARO,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '16px 4px', minHeight: 96,
    }}>
      <span style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: EQ[j.equipo].acento }}>{j.numero || (j.nombre || '?').slice(0, 1).toUpperCase()}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: TEXTO, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>{j.nombre || ('#' + j.numero)}</span>
    </button>
  )

  return (
    <div style={{ fontFamily: font, background: '#08090c', color: TEXTO, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* fondo de cancha como el resto de la app */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5 }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(8,9,12,0.86), rgba(8,9,12,0.93))' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* MARCADOR */}
        <div style={{ borderBottom: `1px solid ${BORDE_TENUE}`, padding: '12px 16px 11px', flexShrink: 0, background: VIDRIO, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <span onClick={() => onVolver && onVolver()} style={{ fontSize: 12, color: TENUE, cursor: 'pointer' }}>← Salir</span>
            <span style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700, ...ORO }}>{config?.nombreJuego || 'Juego rápido'}</span>
            <span onClick={() => setVerPizarra(true)} style={{ fontSize: 11, fontWeight: 800, color: T.acento, cursor: 'pointer' }}>📋 {historial.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: EQ[0].acento, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{config?.nombreA}</div>
              <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, color: '#fff' }}>{totalEquipo(0)}</div>
            </div>
            <div style={{ flexShrink: 0, padding: '0 12px', textAlign: 'center' }}>
              {esPorReloj ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', ...ORO }}>{segs === 0 ? 'FINAL' : fmt(segs)}</div>
                  <button onClick={() => setCorriendo(!corriendo)} disabled={segs === 0} style={{ marginTop: 3, fontSize: 9, fontWeight: 800, padding: '4px 10px', borderRadius: 7, border: 'none', background: corriendo ? 'rgba(224,86,63,.18)' : 'rgba(47,191,113,.18)', color: corriendo ? ROJO : VERDE, cursor: 'pointer', textTransform: 'uppercase' }}>{corriendo ? '⏸ Pausa' : (segs === (config.minutos || 10) * 60 ? '▶ Iniciar' : '▶ Seguir')}</button>
                </>
              ) : (
                <div style={{ fontSize: 10, color: TENUE, textTransform: 'uppercase' }}>juega a<div style={{ fontSize: 20, fontWeight: 800, ...ORO }}>{metaPuntos}</div></div>
              )}
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: EQ[1].acento, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{config?.nombreB}</div>
              <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, color: '#fff' }}>{totalEquipo(1)}</div>
            </div>
          </div>
        </div>

        {/* CANCHA - dos mitades */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {[0, 1].map((eq) => (
            <div key={eq} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 12px', minHeight: 0, background: eq === 0 ? `linear-gradient(180deg, ${EQ[0].suave}, transparent)` : `linear-gradient(0deg, ${EQ[1].suave}, transparent)`, borderTop: eq === 1 ? `1px solid ${BORDE_TENUE}` : 'none' }}>
              {ladoHead(eq)}
              {modo === 'jugada' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, flex: 1, minHeight: 0 }}>
                  {accionesTodas.map((a) => botonAccion(a, eq))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(jugadoresEq(eq).length, 5)}, 1fr)`, gap: 7, flex: 1, minHeight: 0 }}>
                  {jugadoresEq(eq).map((j) => jugadorEnCancha(j))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* PIE */}
        <div style={{ flexShrink: 0, padding: '10px 12px', background: VIDRIO, borderTop: `1px solid ${BORDE_TENUE}`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          {historial.length > 0 && (() => {
            const u = historial[historial.length - 1]
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9.5, color: TENUE, textTransform: 'uppercase', letterSpacing: 0.5 }}>Última jugada</div>
                  <div style={{ fontSize: 13.5, color: TEXTO, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><b style={{ color: EQ[u.equipo].acento }}>{u.etiquetaJug}</b> · {u.sub}</div>
                </div>
                <button onClick={() => setSustituyendo(u)} style={{ fontSize: 11, fontWeight: 700, padding: '7px 11px', borderRadius: 9, border: `1px solid ${T.acento}`, background: 'transparent', color: T.acento, cursor: 'pointer' }}>Corregir</button>
                <button onClick={() => deshacer(u)} style={{ fontSize: 11, fontWeight: 700, padding: '7px 11px', borderRadius: 9, border: `1px solid ${ROJO}`, background: 'transparent', color: ROJO, cursor: 'pointer' }}>Deshacer</button>
              </div>
            )
          })()}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setModo(modo === 'jugada' ? 'jugador' : 'jugada'); setSeleccion(null) }} style={{ flex: 1, border: `1px solid ${BORDE_TENUE}`, borderRadius: 11, padding: 11, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,.04)', color: TENUE }}>Modo: {modo === 'jugada' ? 'Por Jugada' : 'Por Jugador'} ⇄</button>
            <button onClick={() => setConfirmarFin(true)} style={{ flex: 1, border: `1px solid ${BORDE_TENUE}`, borderRadius: 11, padding: 11, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,.04)', color: TENUE }}>Terminar juego</button>
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'absolute', left: '50%', bottom: 118, transform: 'translateX(-50%)', background: VERDE, color: '#062012', fontWeight: 800, fontSize: 13, padding: '10px 18px', borderRadius: 24, zIndex: 30, whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,.4)' }}>✓ {toast}</div>
      )}

      {/* HOJA QUE SUBE - con animación de deslizar (siempre montada) */}
      {(() => {
        const abierta = !!seleccion
        const hoja = seleccion || hojaPrev // mientras baja, sigue mostrando lo anterior
        const eqColor = hoja ? EQ[hoja.equipo] : EQ[0]
        return (
          <>
            {/* fondo oscuro */}
            <div onClick={() => setSeleccion(null)} style={{
              position: 'absolute', inset: 0, background: 'rgba(4,5,7,.74)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 20,
              opacity: abierta ? 1 : 0, pointerEvents: abierta ? 'auto' : 'none', transition: 'opacity .22s ease',
            }} />
            {/* la hoja */}
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 21, borderRadius: '24px 24px 0 0', padding: 2,
              background: eqColor.solido, maxWidth: 480, margin: '0 auto', boxShadow: '0 -12px 40px rgba(0,0,0,.55)',
              transform: abierta ? 'translateY(0)' : 'translateY(105%)',
              transition: 'transform .3s cubic-bezier(.22,.9,.3,1)',
            }}>
              <div style={{ borderRadius: '22px 22px 0 0', background: 'linear-gradient(180deg, rgba(22,24,28,0.98), rgba(12,14,18,0.99))', padding: '16px 16px 30px', minHeight: '44vh', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                <div style={{ width: 44, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.18)', margin: '0 auto 18px' }} />
                {hoja && hoja.tipo === 'accion' ? (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ fontSize: 25, fontWeight: 800, color: eqColor.acento }}>{hoja.accion.et}</div>
                      <div style={{ fontSize: 13, color: TENUE, marginTop: 3 }}>{hoja.equipo === 0 ? config?.nombreA : config?.nombreB}</div>
                    </div>
                    <div style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: TENUE, textAlign: 'center', marginBottom: 16, fontWeight: 700 }}>¿Quién lo hizo?</div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(jugadoresEq(hoja.equipo).length, 5)}, 1fr)`, gap: 8 }}>
                      {jugadoresEq(hoja.equipo).map((j) => jugadorVertical(j, elegirJugadorEnHoja))}
                    </div>
                  </>
                ) : hoja && hoja.tipo === 'jugador' ? (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ fontSize: 25, fontWeight: 800, color: eqColor.acento }}>{hoja.jug.etiqueta}</div>
                      <div style={{ fontSize: 13, color: TENUE, marginTop: 3 }}>{hoja.equipo === 0 ? config?.nombreA : config?.nombreB}</div>
                    </div>
                    <div style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: TENUE, textAlign: 'center', marginBottom: 16, fontWeight: 700 }}>¿Qué hizo?</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 11 }}>
                      {accionesTodas.map((a) => (
                        <button key={a.id} onClick={() => elegirAccionEnHoja(a)} style={{ border: `1.5px solid ${eqColor.borde}`, borderRadius: 16, padding: '26px 6px', cursor: 'pointer', background: VIDRIO_CLARO, color: TEXTO, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, minHeight: 130 }}>
                          <span style={{ fontSize: 38, fontWeight: 800, color: a.pos ? VERDE : eqColor.acento }}>{a.ico}</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{a.et}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </>
        )
      })()}

      {verPizarra && <ModalPizarra T={T} ORO={ORO} historial={historial} eq={EQ} onCerrar={() => setVerPizarra(false)} onDeshacer={deshacer} onSustituir={(h) => { setSustituyendo(h); setVerPizarra(false) }} />}
      {sustituyendo && <ModalSustituir T={T} eq={EQ} jugada={sustituyendo} jugadores={jugadores} acciones={accionesTodas} onCancelar={() => setSustituyendo(null)} onConfirmar={(a, j) => sustituir(sustituyendo, a, j)} />}
      {cambioEquipo !== null && <ModalCambio T={T} eq={EQ} equipo={cambioEquipo} nombreEquipo={cambioEquipo === 0 ? config?.nombreA : config?.nombreB} jugadores={jugadoresEq(cambioEquipo)} jugSel={jugASustituir} setJugSel={setJugASustituir} nombre={nuevoNombre} numero={nuevoNumero} setNombre={setNuevoNombre} setNumero={setNuevoNumero} onCancelar={() => { setCambioEquipo(null); setJugASustituir(null); setNuevoNombre(''); setNuevoNumero('') }} onConfirmar={aplicarCambio} />}
      {confirmarFin && <ModalConfirmar T={T} titulo="¿Terminar el juego?" mensaje="Vas a cerrar el juego y ver el resultado. ¿Seguro?" textoSi="Sí, terminar" textoNo="No, seguir jugando" onSi={() => { vibrar([60, 30, 60, 30, 100]); onTerminar && onTerminar({ ...config, jugadores, historial }) }} onNo={() => setConfirmarFin(false)} />}
      {avisoFin && <ModalConfirmar T={T} titulo={avisoFin === 'puntos' ? '¡Se llegó a la meta!' : '¡Se acabó el tiempo!'} mensaje={avisoFin === 'puntos' ? `Un equipo llegó a ${config.puntosMeta} puntos. ¿Terminar?` : 'El reloj llegó a cero. ¿Terminar?'} textoSi="Terminar juego" textoNo="Seguir jugando" onSi={() => { vibrar([60, 30, 60, 30, 100]); onTerminar && onTerminar({ ...config, jugadores, historial }) }} onNo={() => setAvisoFin(null)} />}
    </div>
  )
}

function fondoModal() { return { position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(4,5,7,0.8)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' } }
function cajaModal(T) { return { width: '100%', maxWidth: 480, maxHeight: '82vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: 1.5, background: T.borde } }
const TENUE2 = '#9aa7b2', TEXTO2 = '#eef3f6', ROJO2 = '#e0563f'

function ModalPizarra({ T, ORO, historial, eq, onCerrar, onDeshacer, onSustituir }) {
  return (
    <div style={fondoModal()} onClick={onCerrar}>
      <div style={cajaModal(T)} onClick={(e) => e.stopPropagation()}>
        <div style={{ borderRadius: '19px 19px 0 0', background: 'linear-gradient(180deg, #14161a, #0c0e12)', padding: 18, minHeight: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 17, fontWeight: 800, ...ORO }}>Historial de jugadas</span>
            <span onClick={onCerrar} style={{ fontSize: 22, color: TENUE2, cursor: 'pointer', lineHeight: 1 }}>×</span>
          </div>
          {historial.length === 0 ? (
            <div style={{ textAlign: 'center', color: TENUE2, fontSize: 13.5, padding: '30px 0' }}>Todavía no hay jugadas.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...historial].reverse().map((h, i) => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: 'rgba(255,255,255,.04)' }}>
                  <span style={{ fontSize: 11, color: TENUE2, width: 22 }}>{historial.length - i}</span>
                  <span style={{ flex: 1, fontSize: 14, color: TEXTO2 }}><b style={{ color: eq[h.equipo].acento, fontWeight: 800 }}>{h.etiquetaJug}</b> · {h.sub} <span style={{ color: TENUE2, fontSize: 12.5 }}>({h.etiquetaAccion})</span></span>
                  <button onClick={() => onSustituir(h)} style={{ fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.acento}`, background: 'transparent', color: T.acento, cursor: 'pointer' }}>Corregir</button>
                  <button onClick={() => onDeshacer(h)} style={{ fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 8, border: `1px solid ${ROJO2}`, background: 'transparent', color: ROJO2, cursor: 'pointer' }}>Deshacer</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ModalSustituir({ T, eq, jugada, jugadores, acciones, onCancelar, onConfirmar }) {
  const [accSel, setAccSel] = useState(acciones.find((a) => a.id === jugada.accionId) || null)
  const [jugSel, setJugSel] = useState(jugadores.find((j) => j.id === jugada.jugId) || null)
  return (
    <div style={fondoModal()} onClick={onCancelar}>
      <div style={cajaModal(T)} onClick={(e) => e.stopPropagation()}>
        <div style={{ borderRadius: '19px 19px 0 0', background: 'linear-gradient(180deg, #14161a, #0c0e12)', padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: TEXTO2 }}>Corregir jugada</span>
            <span onClick={onCancelar} style={{ fontSize: 22, color: TENUE2, cursor: 'pointer', lineHeight: 1 }}>×</span>
          </div>
          <div style={{ fontSize: 12.5, color: TENUE2, marginBottom: 14 }}>Era: <b style={{ color: TEXTO2 }}>{jugada.etiquetaJug} · {jugada.sub}</b>. Elige lo correcto:</div>
          <div style={{ fontSize: 11, color: T.acento, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 800 }}>¿Qué acción?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
            {acciones.map((a) => (<button key={a.id} onClick={() => setAccSel(a)} style={{ borderRadius: 9, padding: '8px 13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: accSel?.id === a.id ? 'none' : '1px solid rgba(255,255,255,.14)', background: accSel?.id === a.id ? T.boton : 'transparent', color: accSel?.id === a.id ? '#1a1205' : '#c3ccd4' }}>{a.et}</button>))}
          </div>
          <div style={{ fontSize: 11, color: T.acento, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 800 }}>¿Quién?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
            {jugadores.map((j) => (<button key={j.id} onClick={() => setJugSel(j)} style={{ borderRadius: 9, padding: '8px 13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: jugSel?.id === j.id ? 'none' : '1px solid rgba(255,255,255,.14)', background: jugSel?.id === j.id ? T.boton : 'transparent', color: jugSel?.id === j.id ? '#1a1205' : eq[j.equipo].acento }}>{j.etiqueta}</button>))}
          </div>
          <button onClick={() => accSel && jugSel && onConfirmar(accSel, jugSel)} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 15, background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Guardar corrección</button>
        </div>
      </div>
    </div>
  )
}

function ModalCambio({ T, eq, equipo, nombreEquipo, jugadores, jugSel, setJugSel, nombre, numero, setNombre, setNumero, onCancelar, onConfirmar }) {
  const col = eq[equipo]
  const input = { background: 'rgba(12,14,18,0.7)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '12px 13px', color: TEXTO2, fontSize: 15, outline: 'none', boxSizing: 'border-box' }
  return (
    <div style={fondoModal()} onClick={onCancelar}>
      <div style={cajaModal(T)} onClick={(e) => e.stopPropagation()}>
        <div style={{ borderRadius: '19px 19px 0 0', background: 'linear-gradient(180deg, #14161a, #0c0e12)', padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: col.acento }}>Sustituir en {nombreEquipo}</span>
            <span onClick={onCancelar} style={{ fontSize: 22, color: TENUE2, cursor: 'pointer', lineHeight: 1 }}>×</span>
          </div>
          <div style={{ fontSize: 12.5, color: TENUE2, marginBottom: 12 }}>1. ¿Quién SALE?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
            {jugadores.map((j) => (<button key={j.id} onClick={() => setJugSel(j)} style={{ borderRadius: 9, padding: '9px 14px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', border: jugSel?.id === j.id ? 'none' : `1px solid ${col.borde}`, background: jugSel?.id === j.id ? col.solido : 'transparent', color: jugSel?.id === j.id ? col.textoBoton : col.acento }}>{j.etiqueta}</button>))}
          </div>
          {jugSel && (<>
            <div style={{ fontSize: 12.5, color: TENUE2, marginBottom: 10 }}>2. ¿Quién ENTRA? (nombre o número)</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del que entra" style={{ ...input, flex: 1, minWidth: 0 }} />
              <input value={numero} onChange={(e) => setNumero(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="#" inputMode="numeric" style={{ ...input, width: 56, textAlign: 'center' }} />
            </div>
            <button onClick={onConfirmar} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 15, background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Aceptar cambio</button>
          </>)}
        </div>
      </div>
    </div>
  )
}

function ModalConfirmar({ T, titulo, mensaje, textoSi, textoNo, onSi, onNo }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(4,5,7,0.82)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onNo}>
      <div style={{ width: '100%', maxWidth: 360, borderRadius: 20, padding: 1.5, background: T.borde }} onClick={(e) => e.stopPropagation()}>
        <div style={{ borderRadius: 19, padding: 24, background: 'linear-gradient(150deg, #16181c, #0c0e12)', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: TEXTO2, marginBottom: 8 }}>{titulo}</div>
          <div style={{ fontSize: 14, color: TENUE2, marginBottom: 22, lineHeight: 1.5 }}>{mensaje}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={onSi} style={{ width: '100%', border: 'none', borderRadius: 13, padding: 15, background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>{textoSi}</button>
            <button onClick={onNo} style={{ width: '100%', border: '1px solid rgba(255,255,255,.16)', borderRadius: 13, padding: 14, background: 'transparent', color: TEXTO2, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{textoNo}</button>
          </div>
        </div>
      </div>
    </div>
  )
}