import { useState } from 'react'
import fondoCancha from '../assets/fondo-cancha.png'

const TEMAS = {
  dorado: {
    acento: '#e8b65a', borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)',
    texto: 'linear-gradient(120deg,#fbe08a,#c8842e)', balon: ['#fbe08a', '#d18f33', '#9a6420'],
    boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', glow: 'rgba(190,135,55,0.20)',
  },
  azul: {
    acento: '#6fb0ec', borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)',
    texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)', balon: ['#9fd4fb', '#4f8fd0', '#1d4a80'],
    boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', glow: 'rgba(55,120,190,0.22)',
  },
}

// Estadísticas: las gratis se pueden activar; las de pago muestran candado
const STATS_GRATIS = [
  { id: 'pts', nombre: 'Puntos', obligatorio: true },
  { id: 'reb', nombre: 'Rebote' },
  { id: 'ast', nombre: 'Asistencia' },
]
const STATS_PAGO = [
  { id: 'rob', nombre: 'Robo' },
  { id: 'tap', nombre: 'Bloqueo' },
  { id: 'fal', nombre: 'Falta' },
  { id: 'tir', nombre: '% de tiro' },
  { id: 'min', nombre: 'Minutos' },
  { id: 'per', nombre: 'Pérdida' },
  { id: 'fall', nombre: 'Tiros fallados' },
  { id: 'tl', nombre: 'Tiros libres' },
]

const FORMATOS = ['1v1', '2v2', '3v3', '4v4', '5v5']
const PUNTOS_RAPIDOS = [11, 15, 21, 32]

export default function PantallaJuegoConfig({ onListo, onVolver }) {
  const tema = (typeof window !== 'undefined' && localStorage.getItem('mc_tema')) || 'dorado'
  const T = TEMAS[tema] || TEMAS.dorado
  const ORO = { background: T.texto, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }
  const C = { texto: '#eef3f6', tenue: '#9aa7b2', font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }

  const [nombreJuego, setNombreJuego] = useState('')
  const [formato, setFormato] = useState('5v5')
  const [tipoFin, setTipoFin] = useState('reloj') // 'reloj' | 'puntos'
  const [minutos, setMinutos] = useState(10)
  const [puntosMeta, setPuntosMeta] = useState(21)
  const [porDif2, setPorDif2] = useState(false)
  const [modoAnotacion, setModoAnotacion] = useState('jugada') // 'jugada' | 'jugador'
  const [statsActivas, setStatsActivas] = useState(['pts'])
  const [avisoPago, setAvisoPago] = useState('')

  const jugadoresPorLado = parseInt(formato[0], 10)

  const toggleStat = (id) => {
    if (id === 'pts') return // obligatorio
    setStatsActivas((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }
  const tocarPago = (nombre) => {
    setAvisoPago(`"${nombre}" es de la versión completa. Suscríbete para usarla.`)
    setTimeout(() => setAvisoPago(''), 3200)
  }

  const placa = (contenido, padding = 18) => (
    <div style={{ position: 'relative', borderRadius: 18, padding: 1.5, background: T.borde, marginBottom: 14 }}>
      <div style={{ borderRadius: 17, padding, background: 'linear-gradient(150deg, rgba(24,26,30,0.86), rgba(12,14,18,0.92))', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        {contenido}
      </div>
    </div>
  )

  const tituloSeccion = (txt) => (
    <div style={{ fontSize: 11, color: T.acento, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{txt}</div>
  )

  // Botón tipo "pastilla" seleccionable
  const pastilla = (activo, onClick, contenido, key) => (
    <button key={key} onClick={onClick} style={{
      flex: 1, minWidth: 0, borderRadius: 11, padding: '11px 6px', cursor: 'pointer', fontSize: 14, fontWeight: 700,
      border: activo ? 'none' : '1px solid rgba(255,255,255,.14)',
      background: activo ? T.boton : 'transparent',
      color: activo ? '#1a1205' : '#c3ccd4', transition: 'all .12s',
    }}>{contenido}</button>
  )

  const empezar = () => {
    const config = {
      nombreJuego: nombreJuego.trim() || 'Juego rápido',
      formato, jugadoresPorLado, tipoFin,
      minutos: tipoFin === 'reloj' ? minutos : null,
      puntosMeta: tipoFin === 'puntos' ? puntosMeta : null,
      porDif2, modoAnotacion, statsActivas,
    }
    onListo && onListo(config)
  }

  const inputStyle = {
    width: '100%', background: 'rgba(12,14,18,0.7)', border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 12, padding: '13px 14px', color: C.texto, fontSize: 15, outline: 'none', fontFamily: C.font, boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: C.font, background: '#08090c', color: C.texto }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(8,9,12,0.84) 0%, rgba(8,9,12,0.92) 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 60% 40% at 50% 15%, ${T.glow}, transparent 70%)` }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '20px 16px 40px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span onClick={() => onVolver && onVolver()} style={{ color: C.tenue, fontSize: 14, cursor: 'pointer' }}>← Inicio</span>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', ...ORO }}>Juego rápido · Gratis</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Arma tu juego</h1>
        <p style={{ fontSize: 13.5, color: C.tenue, margin: '0 0 22px' }}>Configura las reglas y empieza a anotar. Nada se guarda — es un juego suelto.</p>

        {/* Nombre del juego */}
        {placa(
          <>
            {tituloSeccion('Nombre del juego o cancha (opcional)')}
            <input style={inputStyle} value={nombreJuego} onChange={(e) => setNombreJuego(e.target.value)} placeholder="Ej: Cancha de Jícome, Final del barrio..." />
          </>
        )}

        {/* Formato */}
        {placa(
          <>
            {tituloSeccion('Formato')}
            <div style={{ display: 'flex', gap: 8 }}>
              {FORMATOS.map((f) => pastilla(formato === f, () => setFormato(f), f, f))}
            </div>
            <div style={{ fontSize: 12, color: C.tenue, marginTop: 10 }}>{jugadoresPorLado} {jugadoresPorLado === 1 ? 'jugador' : 'jugadores'} por equipo.</div>
          </>
        )}

        {/* Cómo termina: reloj o puntos */}
        {placa(
          <>
            {tituloSeccion('¿Cómo se gana?')}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {pastilla(tipoFin === 'reloj', () => setTipoFin('reloj'), '⏱ Por reloj', 'reloj')}
              {pastilla(tipoFin === 'puntos', () => setTipoFin('puntos'), '🎯 Por puntos', 'puntos')}
            </div>

            {tipoFin === 'reloj' ? (
              <div>
                <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 8 }}>Minutos por juego</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setMinutos((m) => Math.max(1, m - 1))} style={btnMas(T)}>−</button>
                  <div style={{ fontSize: 30, fontWeight: 800, minWidth: 70, textAlign: 'center', ...ORO }}>{minutos}</div>
                  <button onClick={() => setMinutos((m) => Math.min(99, m + 1))} style={btnMas(T)}>+</button>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                    {[5, 10, 12, 20].map((m) => (
                      <button key={m} onClick={() => setMinutos(m)} style={{ border: '1px solid rgba(255,255,255,.14)', background: minutos === m ? 'rgba(255,255,255,.08)' : 'transparent', color: C.tenue, borderRadius: 8, padding: '6px 9px', fontSize: 12, cursor: 'pointer' }}>{m}</button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 8 }}>Juega a... (gana el que llega primero)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <button onClick={() => setPuntosMeta((p) => Math.max(1, p - 1))} style={btnMas(T)}>−</button>
                  <div style={{ fontSize: 30, fontWeight: 800, minWidth: 70, textAlign: 'center', ...ORO }}>{puntosMeta}</div>
                  <button onClick={() => setPuntosMeta((p) => Math.min(199, p + 1))} style={btnMas(T)}>+</button>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
                    {PUNTOS_RAPIDOS.map((p) => (
                      <button key={p} onClick={() => setPuntosMeta(p)} style={{ border: '1px solid rgba(255,255,255,.14)', background: puntosMeta === p ? 'rgba(255,255,255,.08)' : 'transparent', color: C.tenue, borderRadius: 8, padding: '6px 9px', fontSize: 12, cursor: 'pointer' }}>{p}</button>
                    ))}
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: C.texto }}>
                  <span onClick={() => setPorDif2(!porDif2)} style={{ width: 44, height: 26, borderRadius: 13, background: porDif2 ? T.boton : 'rgba(255,255,255,.14)', position: 'relative', transition: 'all .15s', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', top: 3, left: porDif2 ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all .15s' }} />
                  </span>
                  Ganar por diferencia de 2
                </label>
              </div>
            )}
          </>
        )}

        {/* Modo de anotación */}
        {placa(
          <>
            {tituloSeccion('¿Cómo prefieres anotar?')}
            <div style={{ display: 'flex', gap: 8 }}>
              {pastilla(modoAnotacion === 'jugada', () => setModoAnotacion('jugada'), 'Por Jugada', 'jugada')}
              {pastilla(modoAnotacion === 'jugador', () => setModoAnotacion('jugador'), 'Por Jugador', 'jugador')}
            </div>
            <div style={{ fontSize: 12, color: C.tenue, marginTop: 10, lineHeight: 1.5 }}>
              {modoAnotacion === 'jugada'
                ? 'Primero tocas lo que pasó (triple, rebote...) y luego eliges quién lo hizo.'
                : 'Primero tocas el jugador y luego la acción que hizo.'}
              {' '}Puedes cambiarlo en cualquier momento durante el juego.
            </div>
          </>
        )}

        {/* Estadísticas a llevar */}
        {placa(
          <>
            {tituloSeccion('¿Qué estadísticas vas a llevar?')}
            <div style={{ fontSize: 12, color: C.tenue, marginBottom: 12 }}>Puntos siempre va. Activa las que quieras seguir en vivo.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {STATS_GRATIS.map((s) => {
                const activa = statsActivas.includes(s.id)
                return (
                  <button key={s.id} onClick={() => toggleStat(s.id)} disabled={s.obligatorio} style={{
                    borderRadius: 10, padding: '9px 14px', fontSize: 13.5, fontWeight: 700, cursor: s.obligatorio ? 'default' : 'pointer',
                    border: activa ? 'none' : '1px solid rgba(255,255,255,.14)',
                    background: activa ? T.boton : 'transparent', color: activa ? '#1a1205' : '#c3ccd4',
                    opacity: s.obligatorio ? 0.95 : 1,
                  }}>
                    {activa ? '✓ ' : ''}{s.nombre}{s.obligatorio ? ' (fijo)' : ''}
                  </button>
                )
              })}
            </div>

            <div style={{ fontSize: 11, color: C.tenue, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, opacity: 0.8 }}>Versión completa 🔒</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STATS_PAGO.map((s) => (
                <button key={s.id} onClick={() => tocarPago(s.nombre)} style={{
                  borderRadius: 10, padding: '9px 14px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                  border: '1px dashed rgba(255,255,255,.18)', background: 'rgba(255,255,255,.02)', color: '#6b7680',
                }}>
                  🔒 {s.nombre}
                </button>
              ))}
            </div>
            {avisoPago && (
              <div style={{ marginTop: 14, padding: '11px 14px', borderRadius: 11, background: T.glow, border: `1px solid ${T.acento}`, color: T.acento, fontSize: 13, fontWeight: 600 }}>
                {avisoPago}
              </div>
            )}
          </>
        )}

        {/* Botón empezar */}
        <button onClick={empezar} style={{
          width: '100%', marginTop: 6, border: 'none', borderRadius: 14, padding: 17,
          background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 17, cursor: 'pointer',
        }}>
          Empezar a anotar →
        </button>
        <div style={{ textAlign: 'center', fontSize: 12, color: C.tenue, marginTop: 12 }}>
          Después pondrás los nombres de los jugadores.
        </div>

      </div>
    </div>
  )
}

function btnMas(T) {
  return {
    width: 46, height: 46, borderRadius: 12, border: 'none', background: T.boton,
    color: '#1a1205', fontSize: 24, fontWeight: 800, cursor: 'pointer', lineHeight: 1,
  }
}