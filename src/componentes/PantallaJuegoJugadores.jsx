import { useState } from 'react'
import fondoJuego from '../assets/fondo-juego.png'

const TEMAS = {
  dorado: {
    acento: '#e8b65a', borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)',
    texto: 'linear-gradient(120deg,#fbe08a,#c8842e)', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', glow: 'rgba(190,135,55,0.20)',
  },
  azul: {
    acento: '#6fb0ec', borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)',
    texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', glow: 'rgba(55,120,190,0.22)',
  },
}

export default function PantallaJuegoJugadores({ config, onListo, onVolver }) {
  const tema = (typeof window !== 'undefined' && localStorage.getItem('mc_tema')) || 'dorado'
  const T = TEMAS[tema] || TEMAS.dorado
  const ORO = { background: T.texto, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }
  const C = { texto: '#eef3f6', tenue: '#9aa7b2', font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }

  const n = config?.jugadoresPorLado || 5
  const vacios = (eq) => Array.from({ length: n }, (_, i) => ({ nombre: '', numero: '', equipo: eq }))

  // Si viene de "sustituir el perdedor", un equipo está fijo (el ganador)
  const equipoFijo = config?.equipoFijo // 0, 1, o undefined
  const fijosComoInputs = (config?.jugadoresFijos || []).map((j) => ({ nombre: j.nombre || '', numero: j.numero || '', equipo: j.equipo }))

  const initNombre = (eq, def) => {
    if (equipoFijo === eq) return config?.nombreEquipoFijo || def
    return '' // vacío para que el usuario escriba directo (el placeholder muestra Equipo A/B)
  }
  const initJug = (eq) => {
    if (equipoFijo === eq) return fijosComoInputs.length ? fijosComoInputs : vacios(eq)
    return vacios(eq)
  }

  const [nombreA, setNombreA] = useState(initNombre(0, 'Equipo A'))
  const [nombreB, setNombreB] = useState(initNombre(1, 'Equipo B'))
  const [jugA, setJugA] = useState(initJug(0))
  const [jugB, setJugB] = useState(initJug(1))
  const [error, setError] = useState('')

  const setJ = (equipo, idx, campo, valor) => {
    const setter = equipo === 0 ? setJugA : setJugB
    const lista = equipo === 0 ? jugA : jugB
    const copia = lista.map((j, i) => i === idx ? { ...j, [campo]: valor } : j)
    setter(copia)
  }

  const empezar = () => {
    setError('')
    const todos = [...jugA, ...jugB]
    // Cada jugador necesita al menos nombre O número
    const incompleto = todos.find((j) => !j.nombre.trim() && !j.numero.trim())
    if (incompleto) {
      setError('Cada jugador necesita al menos un nombre o un número.')
      return
    }
    const jugadores = todos.map((j, i) => ({
      id: 'j' + i,
      nombre: j.nombre.trim(),
      numero: j.numero.trim(),
      equipo: j.equipo,
      etiqueta: j.nombre.trim() || ('#' + j.numero.trim()),
      pts: 0, reb: 0, ast: 0, rob: 0,
    }))
    // Limpiar campos de "sustituir perdedor" para que no afecten el próximo juego
    const { equipoFijo: _ef, nombreEquipoFijo: _nef, jugadoresFijos: _jf, ...configLimpia } = config || {}
    onListo && onListo({ ...configLimpia, nombreA: nombreA.trim() || 'Equipo A', nombreB: nombreB.trim() || 'Equipo B', jugadores })
  }

  const inputBase = {
    background: 'rgba(12,14,18,0.7)', border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 10, padding: '11px 12px', color: C.texto, fontSize: 15, outline: 'none', fontFamily: C.font, boxSizing: 'border-box',
  }

  const bloqueEquipo = (equipo, nombreEq, setNombreEq, lista, esFijo) => (
    <div style={{ position: 'relative', borderRadius: 18, padding: 1.5, background: T.borde, marginBottom: 14, opacity: esFijo ? 0.82 : 1 }}>
      <div style={{ borderRadius: 17, padding: 16, background: 'linear-gradient(150deg, rgba(24,26,30,0.86), rgba(12,14,18,0.92))', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        {esFijo && <div style={{ fontSize: 10, fontWeight: 800, color: T.acento, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>🏆 Ganador · se queda</div>}
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.tenue, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>✏️ Nombre del equipo (tócalo para cambiarlo)</div>
        <input
          value={nombreEq}
          onChange={(e) => setNombreEq(e.target.value)}
          placeholder={equipo === 0 ? 'Equipo A' : 'Equipo B'}
          style={{ ...inputBase, width: '100%', fontWeight: 800, fontSize: 17, marginBottom: 14, color: equipo === 0 ? C.texto : T.acento, background: 'rgba(255,255,255,.05)', border: `1px solid ${T.acento}55`, borderRadius: 10, padding: '11px 12px' }}
        />
        {lista.map((j, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 9, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: C.tenue, width: 18, flexShrink: 0 }}>{idx + 1}.</span>
            <input
              value={j.nombre}
              onChange={(e) => setJ(equipo, idx, 'nombre', e.target.value)}
              placeholder="Nombre"
              style={{ ...inputBase, flex: 1, minWidth: 0 }}
            />
            <input
              value={j.numero}
              onChange={(e) => setJ(equipo, idx, 'numero', e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="#"
              inputMode="numeric"
              style={{ ...inputBase, width: 56, flexShrink: 0, textAlign: 'center' }}
            />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: C.font, background: '#08090c', color: C.texto }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoJuego})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(8,9,12,0.84) 0%, rgba(8,9,12,0.92) 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 60% 40% at 50% 15%, ${T.glow}, transparent 70%)` }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '20px 16px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span onClick={() => onVolver && onVolver()} style={{ color: C.tenue, fontSize: 14, cursor: 'pointer' }}>← Atrás</span>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', ...ORO }}>{config?.formato || ''} · {config?.nombreJuego || 'Juego rápido'}</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>{equipoFijo !== undefined ? 'Sustituir el perdedor' : '¿Quiénes juegan?'}</h1>
        {equipoFijo !== undefined ? (
          <p style={{ fontSize: 13.5, color: C.tenue, margin: '0 0 22px' }}>🏆 <b style={{ color: T.acento }}>{config?.nombreEquipoFijo}</b> se queda (ganó). Pon el equipo retador que entra.</p>
        ) : (
          <p style={{ fontSize: 13.5, color: C.tenue, margin: '0 0 22px' }}>Pon nombre o número a cada jugador (al menos uno). Toca el nombre del equipo para cambiarlo.</p>
        )}

        {bloqueEquipo(0, nombreA, setNombreA, jugA, equipoFijo === 0)}
        {bloqueEquipo(1, nombreB, setNombreB, jugB, equipoFijo === 1)}

        {error && <div style={{ padding: '11px 14px', borderRadius: 11, background: 'rgba(226,75,74,.14)', border: '1px solid rgba(226,75,74,.3)', color: '#f09595', fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <button onClick={empezar} style={{ width: '100%', border: 'none', borderRadius: 14, padding: 17, background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 17, cursor: 'pointer' }}>
          Empezar el juego →
        </button>
      </div>
    </div>
  )
}