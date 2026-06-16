import { useState } from 'react'
import fondoJuego from '../assets/fondo-juego.png'
import LogoEquipo from './LogoEquipo'
import { LOGOS_EQUIPO, CATEGORIAS_LOGO } from '../logosEquipos'

const SUP_OSCURA = {
  esClaro: false, fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2',
  vidrio: 'linear-gradient(150deg, rgba(24,26,30,0.86), rgba(12,14,18,0.92))',
  veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.84) 0%, rgba(8,9,12,0.92) 100%)',
  inputBg: 'rgba(12,14,18,0.7)', inputBorde: 'rgba(255,255,255,.12)', inputWash: 'rgba(255,255,255,.05)',
}
const SUP_CLARA_BASE = {
  esClaro: true, textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58',
  vidrio: 'linear-gradient(150deg, rgba(255,255,255,0.92), rgba(250,248,244,0.95))',
  inputBg: 'rgba(0,0,0,.03)', inputBorde: 'rgba(0,0,0,.12)', inputWash: 'rgba(0,0,0,.04)',
}
const TEMAS = {
  dorado: {
    ...SUP_OSCURA, nombre: 'Dorado', acento: '#e8b65a',
    borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)',
    texto: 'linear-gradient(120deg,#fbe08a,#c8842e)', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', glow: 'rgba(190,135,55,0.20)',
  },
  azul: {
    ...SUP_OSCURA, nombre: 'Azul', acento: '#6fb0ec',
    borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)',
    texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', glow: 'rgba(55,120,190,0.22)',
  },
  claro: {
    ...SUP_CLARA_BASE, nombre: 'Claro', acento: '#b07a26', fondo: '#e6dcc8',
    borde: 'linear-gradient(140deg,#f0d79a,#c79a45 40%,#9a7530 70%,#e3c578)',
    texto: 'linear-gradient(120deg,#c8902f,#9a6420)', boton: 'linear-gradient(150deg, #e7c069, #b07a26)', glow: 'rgba(190,135,55,0.12)',
    veloGrad: 'linear-gradient(180deg, rgba(248,243,233,0.84) 0%, rgba(244,238,226,0.92) 100%)',
  },
  larimar: {
    ...SUP_CLARA_BASE, nombre: 'Larimar', acento: '#2a8fb8', fondo: '#d6e7e8',
    borde: 'linear-gradient(140deg,#8fd4e8,#2a8fb8 45%,#1a6a8a 75%,#6ac0d8)',
    texto: 'linear-gradient(120deg,#2a8fb8,#1a6a8a)', boton: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', glow: 'rgba(42,143,184,0.14)',
    veloGrad: 'linear-gradient(180deg, rgba(232,244,245,0.84) 0%, rgba(224,240,242,0.92) 100%)',
    textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375',
  },
}

export default function PantallaJuegoJugadores({ config, onListo, onVolver }) {
  const [tema, setTema] = useState(() => {
    const validos = ['dorado', 'azul', 'claro', 'larimar']
    if (typeof window !== 'undefined') {
      const g = localStorage.getItem('mc_tema')
      return validos.includes(g) ? g : 'dorado'
    }
    return 'dorado'
  })
  const T = TEMAS[tema] || TEMAS.dorado
  const ORO = { background: T.texto, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }
  const C = { texto: T.textoBody, tenue: T.tenue, font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }

  const cambiarTema = () => {
    const orden = ['dorado', 'azul', 'claro', 'larimar']
    const i = orden.indexOf(tema)
    const nuevo = orden[(i + 1) % orden.length]
    setTema(nuevo)
    try { localStorage.setItem('mc_tema', nuevo) } catch (e) {}
  }

  const n = config?.jugadoresPorLado || 5
  const vacios = (eq) => Array.from({ length: n }, (_, i) => ({ nombre: '', numero: '', equipo: eq }))

  const equipoFijo = config?.equipoFijo
  const fijosComoInputs = (config?.jugadoresFijos || []).map((j) => ({ nombre: j.nombre || '', numero: j.numero || '', equipo: j.equipo }))

  const initNombre = (eq, def) => {
    if (equipoFijo === eq) return config?.nombreEquipoFijo || def
    return ''
  }
  const initJug = (eq) => {
    if (equipoFijo === eq) return fijosComoInputs.length ? fijosComoInputs : vacios(eq)
    return vacios(eq)
  }

  const [nombreA, setNombreA] = useState(initNombre(0, 'Equipo A'))
  const [nombreB, setNombreB] = useState(initNombre(1, 'Equipo B'))
  const [logoA, setLogoA] = useState(config?.logoEquipoFijo && equipoFijo === 0 ? config.logoEquipoFijo : null)
  const [logoB, setLogoB] = useState(config?.logoEquipoFijo && equipoFijo === 1 ? config.logoEquipoFijo : null)
  const [eligiendoLogo, setEligiendoLogo] = useState(null) // 0 | 1 | null
  const [catLogo, setCatLogo] = useState(CATEGORIAS_LOGO[0])
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
    const { equipoFijo: _ef, nombreEquipoFijo: _nef, jugadoresFijos: _jf, logoEquipoFijo: _lf, ...configLimpia } = config || {}
    onListo && onListo({ ...configLimpia, nombreA: nombreA.trim() || 'Equipo A', nombreB: nombreB.trim() || 'Equipo B', logoA, logoB, jugadores })
  }

  const inputBase = {
    background: T.inputBg, border: `1px solid ${T.inputBorde}`,
    borderRadius: 10, padding: '11px 12px', color: T.textoFuerte, fontSize: 15, outline: 'none', fontFamily: C.font, boxSizing: 'border-box',
  }

  const bloqueEquipo = (equipo, nombreEq, setNombreEq, lista, esFijo) => {
    const logoActual = equipo === 0 ? logoA : logoB
    return (
    <div style={{ position: 'relative', borderRadius: 18, padding: 1.5, background: T.borde, marginBottom: 14, opacity: esFijo ? 0.82 : 1 }}>
      <div style={{ borderRadius: 17, padding: 16, background: T.vidrio, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        {esFijo && <div style={{ fontSize: 10, fontWeight: 800, color: T.acento, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>🏆 Ganador · se queda</div>}
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.tenue, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>✏️ Nombre y escudo del equipo</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
          <button onClick={() => { setEligiendoLogo(equipo); setCatLogo(CATEGORIAS_LOGO[0]) }} title="Escoger escudo" style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 13, border: `1px solid ${T.acento}55`, background: T.inputWash, display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0, overflow: 'hidden' }}>
            {logoActual ? <LogoEquipo id={logoActual} size={48} /> : <span style={{ fontSize: 20, color: C.tenue }}>＋</span>}
          </button>
          <input
            value={nombreEq}
            onChange={(e) => setNombreEq(e.target.value)}
            placeholder={equipo === 0 ? 'Equipo A' : 'Equipo B'}
            style={{ ...inputBase, flex: 1, minWidth: 0, fontWeight: 800, fontSize: 17, color: equipo === 0 ? T.textoFuerte : T.acento, background: T.inputWash, border: `1px solid ${T.acento}55`, borderRadius: 10, padding: '11px 12px' }}
          />
        </div>
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
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: C.font, background: T.fondo, color: C.texto }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoJuego})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: T.veloGrad }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 60% 40% at 50% 15%, ${T.glow}, transparent 70%)` }} />

      {/* selector de tema flotante */}
      <button onClick={cambiarTema} title={`Tema: ${T.nombre}`} style={{ position: 'fixed', top: 16, right: 16, zIndex: 5, display: 'flex', alignItems: 'center', gap: 7, background: T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(20,18,16,.7)', border: `1px solid ${T.acento}55`, color: T.acento, fontSize: 11.5, fontWeight: 700, padding: '7px 11px', borderRadius: 10, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: T.boton, display: 'inline-block' }} />{T.nombre}
      </button>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '20px 16px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span onClick={() => onVolver && onVolver()} style={{ color: C.tenue, fontSize: 14, cursor: 'pointer' }}>← Atrás</span>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', ...ORO }}>{config?.formato || ''} · {config?.nombreJuego || 'Juego rápido'}</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: T.textoFuerte }}>{equipoFijo !== undefined ? 'Sustituir el perdedor' : '¿Quiénes juegan?'}</h1>
        {equipoFijo !== undefined ? (
          <p style={{ fontSize: 13.5, color: C.tenue, margin: '0 0 22px' }}>🏆 <b style={{ color: T.acento }}>{config?.nombreEquipoFijo}</b> se queda (ganó). Pon el equipo retador que entra.</p>
        ) : (
          <p style={{ fontSize: 13.5, color: C.tenue, margin: '0 0 22px' }}>Pon nombre o número a cada jugador (al menos uno). Toca el nombre del equipo para cambiarlo.</p>
        )}

        {bloqueEquipo(0, nombreA, setNombreA, jugA, equipoFijo === 0)}
        {bloqueEquipo(1, nombreB, setNombreB, jugB, equipoFijo === 1)}

        {error && <div style={{ padding: '11px 14px', borderRadius: 11, background: 'rgba(226,75,74,.14)', border: '1px solid rgba(226,75,74,.3)', color: '#e0563f', fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <button onClick={empezar} style={{ width: '100%', border: 'none', borderRadius: 14, padding: 17, background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 17, cursor: 'pointer' }}>
          Empezar el juego →
        </button>
      </div>

      {/* Selector de logo/escudo */}
      {eligiendoLogo !== null && (
        <div onClick={() => setEligiendoLogo(null)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: T.esClaro ? 'rgba(30,26,18,0.5)' : 'rgba(4,5,7,0.84)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '86vh', display: 'flex', flexDirection: 'column', borderRadius: '20px 20px 0 0', padding: 1.5, background: T.borde }}>
            <div style={{ borderRadius: '19px 19px 0 0', background: T.esClaro ? '#f3eee3' : 'linear-gradient(180deg, #14161a, #0c0e12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 16px 10px' }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: T.textoFuerte }}>Escudo de {eligiendoLogo === 0 ? (nombreA || 'Equipo A') : (nombreB || 'Equipo B')}</span>
                <span onClick={() => setEligiendoLogo(null)} style={{ fontSize: 24, color: C.tenue, cursor: 'pointer', lineHeight: 1 }}>×</span>
              </div>
              {/* pestañas de categoría */}
              <div style={{ display: 'flex', gap: 7, padding: '0 16px 12px', overflowX: 'auto' }}>
                <button onClick={() => { const eq = eligiendoLogo; eq === 0 ? setLogoA(null) : setLogoB(null) }} style={{ flexShrink: 0, padding: '7px 13px', borderRadius: 18, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1px solid ${T.inputBorde}`, background: 'transparent', color: C.tenue }}>Sin escudo</button>
                {CATEGORIAS_LOGO.map((cat) => (
                  <button key={cat} onClick={() => setCatLogo(cat)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 18, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', border: `1px solid ${catLogo === cat ? T.acento : T.inputBorde}`, background: catLogo === cat ? T.acento : 'transparent', color: catLogo === cat ? '#1a1205' : C.tenue }}>{cat}</button>
                ))}
              </div>
              {/* grid de logos */}
              <div style={{ overflowY: 'auto', padding: '4px 16px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {LOGOS_EQUIPO.filter((l) => l.cat === catLogo).map((l) => {
                  const sel = (eligiendoLogo === 0 ? logoA : logoB) === l.id
                  return (
                    <button key={l.id} onClick={() => { eligiendoLogo === 0 ? setLogoA(l.id) : setLogoB(l.id); setEligiendoLogo(null) }} style={{ aspectRatio: '1', borderRadius: 14, border: `2px solid ${sel ? T.acento : T.inputBorde}`, background: T.inputWash, display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 8 }}>
                      <LogoEquipo id={l.id} size={56} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}