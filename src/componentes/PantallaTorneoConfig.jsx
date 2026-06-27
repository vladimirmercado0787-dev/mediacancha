import { useState, useEffect } from 'react'
import { leerTorneoCompleto } from '../torneos'

// ============================================================
//  CONFIGURAR JUEGO DE TORNEO  (formal, por reloj)
//  NO reinventa el anotador: arma el "config" y lo entrega al
//  flujo de siempre (Jugadores -> JuegoVivo -> Resultado).
//  Un torneo es siempre formal: cuartos, minutos, faltas, bonus.
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
}
const ORO_BTN = 'linear-gradient(150deg, #f3cf63, #c8842e)'

// estadísticas que se pueden seguir (puntos siempre va)
const STATS = [
  { id: 'pts', nombre: 'Puntos', fijo: true },
  { id: 'reb', nombre: 'Rebote' },
  { id: 'ast', nombre: 'Asistencia' },
  { id: 'rob', nombre: 'Robo' },
  { id: 'tap', nombre: 'Bloqueo' },
  { id: 'fal', nombre: 'Falta' },
  { id: 'per', nombre: 'Pérdida' },
  { id: 'min', nombre: 'Minutos' },
  { id: 'tl', nombre: 'Tiros libres' },
  { id: 'fall', nombre: 'Tiros fallados (%)' },
]
const RECOMENDADO_TEL = 6

export default function PantallaTorneoConfig({ torneoId = null, nombreTorneo = '', onListo, onVolver }) {
  const [nombreJuego, setNombreJuego] = useState('')
  const [cuartos, setCuartos] = useState(4)
  const [minutos, setMinutos] = useState(10)
  const [relojApp, setRelojApp] = useState(false) // por ahora: reloj manual por fuera
  const [rosterEquipo, setRosterEquipo] = useState(10)
  const [expulsionA, setExpulsionA] = useState(5)
  const [bonusCada, setBonusCada] = useState(5)
  const [modoAnotacion, setModoAnotacion] = useState('jugada')
  const [statsActivas, setStatsActivas] = useState(['pts', 'reb', 'ast', 'rob', 'tap', 'fal', 'per'])

  // candado: congela el fondo para que el teclado no lo mueva
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

  // Carga las reglas por defecto del torneo (las que se guardan en el panel de
  // Configuración) y deja la pantalla ya lista con esas reglas. Así no hay que
  // configurar lo mismo en cada juego; solo confirmas o cambias lo puntual.
  useEffect(() => {
    let vivo = true
    ;(async () => {
      if (!torneoId) return
      try {
        const r = await leerTorneoCompleto(torneoId)
        if (!vivo || !r || !r.torneo || !r.torneo.reglas) return
        const rg = r.torneo.reglas
        if (rg.cuartos != null) setCuartos(rg.cuartos)
        if (rg.minutos != null) setMinutos(rg.minutos)
        if (rg.expulsionA != null) setExpulsionA(rg.expulsionA)
        if (rg.bonusCada != null) setBonusCada(rg.bonusCada)
        if (rg.modoAnotacion) setModoAnotacion(rg.modoAnotacion)
        if (Array.isArray(rg.statsActivas) && rg.statsActivas.length) setStatsActivas(rg.statsActivas)
      } catch (e) { /* si falla, se quedan los valores por defecto */ }
    })()
    return () => { vivo = false }
  }, [torneoId])

  const toggleStat = (id) => {
    if (id === 'pts') return
    setStatsActivas((p) => p.includes(id) ? p.filter((s) => s !== id) : [...p, id])
  }

  const empezar = () => {
    const config = {
      tipo: 'torneo',
      torneoId,
      nombreJuego: nombreJuego.trim() || 'Juego de torneo',
      formato: '5v5',
      jugadoresPorLado: 5,
      tipoFin: 'reloj',
      minutos,
      cuartos,
      relojApp,
      rosterEquipo,
      reservas: 0,
      puntosMeta: null,
      porDif2: false,
      estiloPuntos: 'normal',
      llevarFaltas: true,
      expulsionA,
      bonusCada,
      modoAnotacion,
      statsActivas,
    }
    onListo && onListo(config)
  }

  // ---- helpers de UI ----
  const Placa = ({ children }) => (
    <div style={{ borderRadius: 16, padding: 16, background: C.panel, border: `1px solid ${C.borde}`, marginBottom: 13 }}>{children}</div>
  )
  const Titulo = ({ children }) => (
    <div style={{ fontSize: 11, color: C.oro, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{children}</div>
  )
  const Pastilla = ({ activo, onClick, children }) => (
    <button onClick={onClick} style={{ flex: 1, minWidth: 0, borderRadius: 11, padding: '11px 6px', cursor: 'pointer', fontSize: 13.5, fontWeight: 700, border: activo ? 'none' : `1px solid ${C.borde2}`, background: activo ? ORO_BTN : 'transparent', color: activo ? '#1a1205' : C.tenue }}>{children}</button>
  )
  const btnMas = { width: 46, height: 46, borderRadius: 12, border: 'none', background: ORO_BTN, color: '#1a1205', fontSize: 24, fontWeight: 800, cursor: 'pointer', lineHeight: 1 }
  const Stepper = ({ valor, set, min, max, sufijo }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={() => set(Math.max(min, valor - 1))} style={btnMas}>−</button>
      <div style={{ fontFamily: DISP, fontSize: 34, fontWeight: 900, minWidth: 64, textAlign: 'center', color: C.oro }}>{valor}</div>
      <button onClick={() => set(Math.min(max, valor + 1))} style={btnMas}>+</button>
      {sufijo && <div style={{ fontSize: 12.5, color: C.tenue, marginLeft: 6 }}>{sufijo}</div>}
    </div>
  )
  const inputStyle = { width: '100%', background: 'rgba(0,0,0,0.25)', border: `1px solid ${C.borde2}`, borderRadius: 12, padding: '13px 14px', color: C.txt, fontSize: 15, outline: 'none', fontFamily: FONT, boxSizing: 'border-box' }

  return (
    <div style={{ height: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: C.fondo, color: C.txt, fontFamily: FONT }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 40px)' }}>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <span onClick={() => onVolver && onVolver()} style={{ color: C.tenue, fontSize: 14, cursor: 'pointer' }}>‹ Volver</span>
        </div>

        <h1 style={{ fontFamily: DISP, fontSize: 32, fontWeight: 900, textTransform: 'uppercase', margin: '0 0 4px', color: C.txt, lineHeight: 0.95 }}>Juego de torneo</h1>
        <p style={{ fontSize: 13, color: C.tenue, margin: '0 0 18px' }}>
          {nombreTorneo ? `${nombreTorneo} · ` : ''}Reglas formales: cuartos, reloj y faltas. La forma de anotar es la misma de siempre.
        </p>

        <Placa>
          <Titulo>Nombre del juego (opcional)</Titulo>
          <input style={inputStyle} value={nombreJuego} onChange={(e) => setNombreJuego(e.target.value)} placeholder="Ej: Jornada 1, Final, Semifinal..." />
        </Placa>

        <Placa>
          <Titulo>Reloj</Titulo>
          <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 8 }}>Cantidad de cuartos</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6].map((c) => (
              <button key={c} onClick={() => setCuartos(c)} style={{ flex: 1, minWidth: 42, border: cuartos === c ? `1.5px solid ${C.oro}` : `1px solid ${C.borde2}`, background: cuartos === c ? 'rgba(245,184,46,0.12)' : 'transparent', color: cuartos === c ? C.oro : C.tenue, borderRadius: 9, padding: '9px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{c}</button>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 8 }}>Minutos por cuarto</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setMinutos((m) => Math.max(1, m - 1))} style={btnMas}>−</button>
            <div style={{ fontFamily: DISP, fontSize: 34, fontWeight: 900, minWidth: 64, textAlign: 'center', color: C.oro }}>{minutos}</div>
            <button onClick={() => setMinutos((m) => Math.min(99, m + 1))} style={btnMas}>+</button>
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              {[5, 10, 12, 20].map((m) => (
                <button key={m} onClick={() => setMinutos(m)} style={{ border: `1px solid ${C.borde2}`, background: minutos === m ? C.card : 'transparent', color: C.tenue, borderRadius: 8, padding: '6px 9px', fontSize: 12, cursor: 'pointer' }}>{m}</button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: C.tenue2, marginTop: 12, fontStyle: 'italic' }}>{cuartos} {cuartos === 1 ? 'cuarto' : 'cuartos'} de {minutos} min = {cuartos * minutos} min de juego</div>
          <div style={{ height: 1, background: C.borde, margin: '16px 0' }} />
          <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 10 }}>¿Quién lleva el reloj?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Pastilla activo={relojApp} onClick={() => setRelojApp(true)}>⏱ La app</Pastilla>
            <Pastilla activo={!relojApp} onClick={() => setRelojApp(false)}>✋ Afuera (manual)</Pastilla>
          </div>
          <div style={{ fontSize: 11.5, color: C.tenue2, marginTop: 10, lineHeight: 1.5 }}>{relojApp ? 'La aplicación corre el cronómetro.' : 'El tiempo lo controlan en la mesa; tú solo anotas las jugadas.'}</div>
        </Placa>

        <Placa>
          <Titulo>Roster del equipo</Titulo>
          <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 10 }}>Jugadores por equipo (hasta 12)</div>
          <Stepper valor={rosterEquipo} set={setRosterEquipo} min={5} max={12} sufijo={rosterEquipo === 1 ? 'jugador' : 'jugadores'} />
          <div style={{ fontSize: 11.5, color: C.tenue2, marginTop: 12, lineHeight: 1.5 }}>Por ahora los nombres se ponen a mano en el próximo paso. Cuando inscribamos los equipos, saldrán solos del roster.</div>
        </Placa>

        <Placa>
          <Titulo>Faltas</Titulo>
          <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 8 }}>Expulsión por faltas</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Pastilla activo={expulsionA === 5} onClick={() => setExpulsionA(5)}>A las 5</Pastilla>
            <Pastilla activo={expulsionA === 6} onClick={() => setExpulsionA(6)}>A las 6</Pastilla>
            <Pastilla activo={expulsionA === 0} onClick={() => setExpulsionA(0)}>Sin</Pastilla>
          </div>
          <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 8 }}>Tiros libres por bonus (faltas de equipo por cuarto)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Pastilla activo={bonusCada === 0} onClick={() => setBonusCada(0)}>Sin</Pastilla>
            <Pastilla activo={bonusCada === 4} onClick={() => setBonusCada(4)}>Cada 4</Pastilla>
            <Pastilla activo={bonusCada === 5} onClick={() => setBonusCada(5)}>Cada 5</Pastilla>
            <Pastilla activo={bonusCada === 7} onClick={() => setBonusCada(7)}>Cada 7</Pastilla>
          </div>
          <div style={{ fontSize: 11.5, color: C.tenue2, marginTop: 10, lineHeight: 1.5 }}>{bonusCada === 0 ? 'No se cobran tiros libres por bonus.' : `Al llegar a ${bonusCada} faltas de equipo en el cuarto, el rival tira libres. Se reinicia cada cuarto.`}</div>
        </Placa>

        <Placa>
          <Titulo>¿Cómo prefieres anotar?</Titulo>
          <div style={{ display: 'flex', gap: 8 }}>
            <Pastilla activo={modoAnotacion === 'jugada'} onClick={() => setModoAnotacion('jugada')}>Por Jugada</Pastilla>
            <Pastilla activo={modoAnotacion === 'jugador'} onClick={() => setModoAnotacion('jugador')}>Por Jugador</Pastilla>
          </div>
          <div style={{ fontSize: 12, color: C.tenue2, marginTop: 10, lineHeight: 1.5 }}>
            {modoAnotacion === 'jugada' ? 'Primero tocas lo que pasó (triple, rebote...) y luego quién lo hizo.' : 'Primero tocas el jugador y luego la acción.'} Puedes cambiarlo durante el juego.
          </div>
        </Placa>

        <Placa>
          <Titulo>¿Qué estadísticas vas a llevar?</Titulo>
          <div style={{ fontSize: 12, color: C.tenue2, marginBottom: 12 }}>Puntos siempre va. Activa las que quieras seguir en vivo.</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {STATS.map((s) => {
              const activa = statsActivas.includes(s.id)
              return (
                <button key={s.id} onClick={() => toggleStat(s.id)} disabled={s.fijo} style={{ borderRadius: 10, padding: '9px 14px', fontSize: 13.5, fontWeight: 700, cursor: s.fijo ? 'default' : 'pointer', border: activa ? 'none' : `1px solid ${C.borde2}`, background: activa ? ORO_BTN : 'transparent', color: activa ? '#1a1205' : C.tenue, opacity: s.fijo ? 0.95 : 1 }}>
                  {activa ? '✓ ' : ''}{s.nombre}{s.fijo ? ' (fijo)' : ''}
                </button>
              )
            })}
          </div>
          <div style={{ marginTop: 14, padding: '11px 13px', borderRadius: 11, background: statsActivas.length > RECOMENDADO_TEL ? 'rgba(245,184,46,0.10)' : 'rgba(255,255,255,0.02)', border: `1px solid ${statsActivas.length > RECOMENDADO_TEL ? C.oro : C.borde}` }}>
            <div style={{ fontSize: 12.5, color: statsActivas.length > RECOMENDADO_TEL ? C.oro : C.tenue, lineHeight: 1.5 }}>
              Llevas <b>{statsActivas.length}</b> {statsActivas.length === 1 ? 'estadística' : 'estadísticas'}. {statsActivas.length > RECOMENDADO_TEL ? 'Son bastantes para un teléfono; mejor computadora o iPad.' : 'En el teléfono recomendamos hasta seis. Para más, mejor iPad o computadora.'}
            </div>
          </div>
        </Placa>

        <button onClick={empezar} style={{ width: '100%', marginTop: 6, border: 'none', borderRadius: 14, padding: 17, background: ORO_BTN, color: '#1a1205', fontFamily: DISP, fontWeight: 900, fontSize: 20, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer' }}>
          Empezar a anotar →
        </button>
        <div style={{ textAlign: 'center', fontSize: 12, color: C.tenue2, marginTop: 12 }}>Después pondrás los nombres de los equipos y los jugadores.</div>

      </div>
    </div>
  )
}