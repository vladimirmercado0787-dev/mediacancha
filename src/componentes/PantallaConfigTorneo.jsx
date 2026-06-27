import { useState, useEffect } from 'react'
import { leerTorneoCompleto, guardarReglasTorneo, cambiarEstadoTorneo } from '../torneos'

// ============================================================
//  PANEL DE CONFIGURACIÓN DEL TORNEO
//  Un solo sitio para el dueño:
//   1) Reglas por defecto (cuartos, minutos, faltas, bonus, modo).
//      Se usan como punto de partida al anotar cada juego.
//   2) Estado del torneo: terminar / reactivar. NUNCA borra datos:
//      las estadísticas y los juegos se quedan guardados siempre.
// ============================================================

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const DISP = '"Arial Narrow", Impact, "Haettenschweiler", system-ui, sans-serif'

const C = {
  fondo: '#0a0e1a',
  panel: 'rgba(255,255,255,0.045)',
  card: 'rgba(255,255,255,0.05)',
  borde: 'rgba(150,172,228,0.16)',
  borde2: 'rgba(150,172,228,0.30)',
  txt: '#eef3fc',
  tenue: '#8a9bc0',
  tenue2: '#5d6c8c',
  oro: '#F5B82E',
  oroD: '#c8842e',
  rojo: '#e0563f',
  verde: '#3fbf7f',
}
const ORO_BTN = 'linear-gradient(150deg, #f3cf63, #c8842e)'

const OPC_CUARTOS = [1, 2, 4]
const OPC_MINUTOS = [6, 8, 10, 12, 15, 20]
const OPC_FALTAS = [4, 5, 6]
const OPC_BONUS = [0, 4, 5, 6, 7]

export default function PantallaConfigTorneo({ torneoId = null, onVolver }) {
  const [cargando, setCargando] = useState(true)
  const [nombre, setNombre] = useState('')
  const [estado, setEstado] = useState('activo')

  const [cuartos, setCuartos] = useState(4)
  const [minutos, setMinutos] = useState(10)
  const [expulsionA, setExpulsionA] = useState(5)
  const [bonusCada, setBonusCada] = useState(5)
  const [modoAnotacion, setModoAnotacion] = useState('jugada')

  const [guardado, setGuardado] = useState(false)
  const [trabajando, setTrabajando] = useState(false)
  const [confirmar, setConfirmar] = useState(null) // 'terminar' | 'reactivar'

  useEffect(() => {
    let vivo = true
    ;(async () => {
      if (!torneoId) { setCargando(false); return }
      const r = await leerTorneoCompleto(torneoId)
      if (!vivo) return
      if (r && r.torneo) {
        const t = r.torneo
        setNombre(t.nombre || 'Torneo')
        setEstado(t.estado === 'finalizado' ? 'finalizado' : 'activo')
        const rg = t.reglas || {}
        setCuartos(rg.cuartos ?? 4)
        setMinutos(rg.minutos ?? 10)
        setExpulsionA(rg.expulsionA ?? 5)
        setBonusCada(rg.bonusCada ?? 5)
        setModoAnotacion(rg.modoAnotacion || 'jugada')
      }
      setCargando(false)
    })()
    return () => { vivo = false }
  }, [torneoId])

  const guardarReglas = async () => {
    if (trabajando) return
    setTrabajando(true)
    const reglas = {
      cuartos, minutos, expulsionA, bonusCada, modoAnotacion,
      statsActivas: ['pts', 'reb', 'ast', 'rob', 'tap', 'fal', 'per'],
    }
    const { error } = await guardarReglasTorneo(torneoId, reglas)
    setTrabajando(false)
    if (!error) { setGuardado(true); setTimeout(() => setGuardado(false), 2200) }
  }

  const aplicarEstado = async (nuevo) => {
    if (trabajando) return
    setTrabajando(true)
    const { error } = await cambiarEstadoTorneo(torneoId, nuevo)
    setTrabajando(false)
    setConfirmar(null)
    if (!error) setEstado(nuevo)
  }

  // ---------- UI helpers ----------
  const Titulo = ({ children }) => (
    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: C.oro, marginBottom: 12 }}>{children}</div>
  )
  const Tarjeta = ({ children }) => (
    <div style={{ background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>{children}</div>
  )
  const fila = (opciones, valor, set, sufijo = '') => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {opciones.map((o) => (
        <button key={o} onClick={() => set(o)} style={{ flex: '1 1 56px', minWidth: 52, border: valor === o ? `1.5px solid ${C.oro}` : `1px solid ${C.borde2}`, background: valor === o ? 'rgba(245,184,46,0.12)' : 'transparent', color: valor === o ? C.oro : C.tenue, borderRadius: 9, padding: '10px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          {o === 0 ? 'No' : o}{o !== 0 && sufijo ? sufijo : ''}
        </button>
      ))}
    </div>
  )

  if (cargando) {
    return (
      <div style={{ minHeight: '100dvh', background: C.fondo, color: C.tenue, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Cargando…
      </div>
    )
  }

  const finalizado = estado === 'finalizado'

  return (
    <div style={{ minHeight: '100dvh', background: C.fondo, color: C.txt, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      {/* cabecera */}
      <div style={{ flexShrink: 0, background: C.panel, borderBottom: `0.5px solid ${C.borde}`, paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ height: 4, display: 'flex' }}>
          <i style={{ flex: 1, background: '#1a4ed8' }} /><i style={{ flex: 1, background: '#fff' }} /><i style={{ flex: 1, background: '#d8281a' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
          <button onClick={onVolver} style={{ border: 'none', background: 'transparent', color: C.tenue, fontSize: 14, fontWeight: 600, cursor: 'pointer', minWidth: 64, textAlign: 'left' }}>‹ Volver</button>
          <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontFamily: DISP, fontSize: 19, fontWeight: 900, letterSpacing: 0.5, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: C.tenue }}>Configuración</div>
          </div>
          <span style={{ minWidth: 64, textAlign: 'right', fontSize: 11, fontWeight: 800, color: finalizado ? C.tenue2 : C.verde }}>{finalizado ? 'Finalizado' : 'Activo'}</span>
        </div>
      </div>

      {/* contenido */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '18px 16px 40px', maxWidth: 560, width: '100%', margin: '0 auto' }}>

        {/* ----- REGLAS POR DEFECTO ----- */}
        <Titulo>Reglas por defecto</Titulo>
        <div style={{ fontSize: 12.5, color: C.tenue, lineHeight: 1.5, marginBottom: 14 }}>
          Estas reglas son el punto de partida cada vez que anotas un juego del torneo. Las pones una vez aquí y no hay que repetirlas en cada juego. Si un juego necesita algo distinto, lo cambias en el momento.
        </div>

        <Tarjeta>
          <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 8 }}>Cantidad de cuartos</div>
          {fila(OPC_CUARTOS, cuartos, setCuartos)}
          <div style={{ fontSize: 12.5, color: C.tenue, margin: '16px 0 8px' }}>Minutos por cuarto</div>
          {fila(OPC_MINUTOS, minutos, setMinutos)}
          <div style={{ fontSize: 11.5, color: C.tenue2, marginTop: 10, fontStyle: 'italic' }}>{cuartos} {cuartos === 1 ? 'cuarto' : 'cuartos'} de {minutos} min = {cuartos * minutos} min de juego</div>
        </Tarjeta>

        <Tarjeta>
          <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 8 }}>Faltas para expulsión</div>
          {fila(OPC_FALTAS, expulsionA, setExpulsionA)}
          <div style={{ fontSize: 12.5, color: C.tenue, margin: '16px 0 8px' }}>Tiros libres por bonus (faltas de equipo por cuarto)</div>
          {fila(OPC_BONUS, bonusCada, setBonusCada)}
          <div style={{ fontSize: 11.5, color: C.tenue2, marginTop: 10, lineHeight: 1.5 }}>{bonusCada === 0 ? 'No se cobran tiros libres por bonus.' : `Al llegar a ${bonusCada} faltas de equipo en el cuarto, el rival tira libres. Se reinicia cada cuarto.`}</div>
        </Tarjeta>

        <Tarjeta>
          <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 10 }}>Modo de anotar</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['jugada', 'Por Jugada'], ['jugador', 'Por Jugador']].map(([id, txt]) => (
              <button key={id} onClick={() => setModoAnotacion(id)} style={{ flex: 1, border: modoAnotacion === id ? `1.5px solid ${C.oro}` : `1px solid ${C.borde2}`, background: modoAnotacion === id ? 'rgba(245,184,46,0.12)' : 'transparent', color: modoAnotacion === id ? C.oro : C.tenue, borderRadius: 10, padding: '11px 0', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>{txt}</button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: C.tenue2, marginTop: 10, lineHeight: 1.5 }}>
            {modoAnotacion === 'jugada' ? 'Primero tocas lo que pasó (triple, rebote…) y luego quién lo hizo.' : 'Primero tocas el jugador y luego la acción.'} Se puede cambiar durante el juego.
          </div>
        </Tarjeta>

        <button onClick={guardarReglas} disabled={trabajando} style={{ width: '100%', border: 'none', borderRadius: 12, padding: '14px 0', background: guardado ? C.verde : ORO_BTN, color: guardado ? '#fff' : '#1a1205', fontSize: 15, fontWeight: 800, cursor: 'pointer', marginBottom: 8 }}>
          {guardado ? '✓ Reglas guardadas' : (trabajando ? 'Guardando…' : 'Guardar reglas')}
        </button>

        <div style={{ fontSize: 11.5, color: C.tenue2, lineHeight: 1.5, marginBottom: 28, textAlign: 'center' }}>
          ¿Quieres cambiar la cantidad de juegos? Eso se hace en el Calendario, con el botón de regenerar — y respeta los juegos ya jugados, nunca los borra.
        </div>

        {/* ----- ESTADO DEL TORNEO ----- */}
        <Titulo>Estado del torneo</Titulo>
        <Tarjeta>
          {finalizado ? (
            <>
              <div style={{ fontSize: 13.5, color: C.txt, lineHeight: 1.6, marginBottom: 14 }}>
                Este torneo está <b style={{ color: C.tenue2 }}>finalizado</b>. Todas sus estadísticas y juegos siguen guardados. Puedes reactivarlo cuando quieras y todo aparece intacto.
              </div>
              <button onClick={() => setConfirmar('reactivar')} disabled={trabajando} style={{ width: '100%', border: `1.5px solid ${C.verde}`, borderRadius: 12, padding: '13px 0', background: 'rgba(63,191,127,0.12)', color: C.verde, fontSize: 14.5, fontWeight: 800, cursor: 'pointer' }}>↻ Reactivar torneo</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13.5, color: C.txt, lineHeight: 1.6, marginBottom: 14 }}>
                Este torneo está <b style={{ color: C.verde }}>activo</b>. Si lo terminas, queda cerrado pero <b>nada se borra</b>: los marcadores, los líderes y las estadísticas se quedan guardados. Lo puedes reactivar después.
              </div>
              <button onClick={() => setConfirmar('terminar')} disabled={trabajando} style={{ width: '100%', border: `1.5px solid ${C.rojo}`, borderRadius: 12, padding: '13px 0', background: 'rgba(224,86,63,0.10)', color: C.rojo, fontSize: 14.5, fontWeight: 800, cursor: 'pointer' }}>■ Terminar torneo</button>
            </>
          )}
        </Tarjeta>

      </div>

      {/* ----- CONFIRMACIÓN ----- */}
      {confirmar && (
        <div onClick={() => setConfirmar(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(4,6,12,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16, paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#121726', border: `1px solid ${C.borde2}`, borderRadius: 18, padding: 22 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.txt, marginBottom: 10 }}>
              {confirmar === 'terminar' ? '¿Terminar el torneo?' : '¿Reactivar el torneo?'}
            </div>
            <div style={{ fontSize: 13.5, color: C.tenue, lineHeight: 1.6, marginBottom: 20 }}>
              {confirmar === 'terminar'
                ? 'El torneo queda cerrado. Nada se borra: todas las estadísticas y juegos se quedan guardados, y lo puedes reactivar cuando quieras.'
                : 'El torneo vuelve a estar activo, con todo su historial intacto.'}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmar(null)} style={{ flex: 1, border: `1px solid ${C.borde2}`, borderRadius: 11, padding: '12px 0', background: 'transparent', color: C.tenue, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => aplicarEstado(confirmar === 'terminar' ? 'finalizado' : 'activo')} disabled={trabajando} style={{ flex: 1, border: 'none', borderRadius: 11, padding: '12px 0', background: confirmar === 'terminar' ? C.rojo : C.verde, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                {trabajando ? '…' : (confirmar === 'terminar' ? 'Sí, terminar' : 'Sí, reactivar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}