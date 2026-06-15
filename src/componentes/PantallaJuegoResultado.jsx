import { useState } from 'react'
import fondoJuego from '../assets/fondo-juego.png'
import { publicarJuego } from '../techado'

const SUP_OSCURA = {
  esClaro: false, fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2',
  vidrio: 'linear-gradient(150deg, rgba(24,26,30,0.9), rgba(12,14,18,0.93))',
  veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.86) 0%, rgba(8,9,12,0.93) 100%)',
  lineaFila: 'rgba(255,255,255,.06)', botonBorde: 'rgba(255,255,255,.14)',
}
const SUP_CLARA_BASE = {
  esClaro: true, textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58',
  vidrio: 'linear-gradient(150deg, rgba(255,255,255,0.93), rgba(250,248,244,0.95))',
  lineaFila: 'rgba(0,0,0,.07)', botonBorde: 'rgba(0,0,0,.14)',
}
const TEMAS = {
  dorado: {
    ...SUP_OSCURA, nombre: 'Dorado', acento: '#e8b65a',
    borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)',
    texto: 'linear-gradient(120deg,#fbe08a,#c8842e)', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', glow: 'rgba(190,135,55,0.20)', avatar: 'linear-gradient(150deg,#e0b057,#9a6420)',
  },
  azul: {
    ...SUP_OSCURA, nombre: 'Azul', acento: '#6fb0ec',
    borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)',
    texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', glow: 'rgba(55,120,190,0.22)', avatar: 'linear-gradient(150deg,#5f9fd8,#1d4a80)',
  },
  claro: {
    ...SUP_CLARA_BASE, nombre: 'Claro', acento: '#b07a26', fondo: '#e6dcc8',
    borde: 'linear-gradient(140deg,#f0d79a,#c79a45 40%,#9a7530 70%,#e3c578)',
    texto: 'linear-gradient(120deg,#c8902f,#9a6420)', boton: 'linear-gradient(150deg, #e7c069, #b07a26)', glow: 'rgba(190,135,55,0.12)', avatar: 'linear-gradient(150deg,#e7c069,#a9741f)',
    veloGrad: 'linear-gradient(180deg, rgba(248,243,233,0.86) 0%, rgba(244,238,226,0.93) 100%)',
  },
  larimar: {
    ...SUP_CLARA_BASE, nombre: 'Larimar', acento: '#2a8fb8', fondo: '#d6e7e8',
    borde: 'linear-gradient(140deg,#8fd4e8,#2a8fb8 45%,#1a6a8a 75%,#6ac0d8)',
    texto: 'linear-gradient(120deg,#2a8fb8,#1a6a8a)', boton: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', glow: 'rgba(42,143,184,0.14)', avatar: 'linear-gradient(150deg,#4aafc8,#1a6a8a)',
    veloGrad: 'linear-gradient(180deg, rgba(232,244,245,0.86) 0%, rgba(224,240,242,0.93) 100%)',
    textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375',
  },
}

export default function PantallaJuegoResultado({ resultado, onNuevo, onInicio, onRepetir, onSustituirPerdedor }) {
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

  const [publicado, setPublicado] = useState(false)
  const [publicando, setPublicando] = useState(false)
  const publicar = async () => {
    if (publicado || publicando) return
    setPublicando(true)
    const res = await publicarJuego(resultado)
    if (!res.error) setPublicado(true)
    else alert(res.error)
    setPublicando(false)
  }

  const jugadores = resultado?.jugadores || []
  const statsActivas = resultado?.statsActivas || ['pts']
  const totalEq = (eq) => jugadores.filter((j) => j.equipo === eq).reduce((a, j) => a + j.pts, 0)
  const totalA = totalEq(0), totalB = totalEq(1)
  const hayEmpate = totalA === totalB
  const ganadorEq = hayEmpate ? null : (totalA > totalB ? 0 : 1)
  const ganador = hayEmpate ? null : (totalA > totalB ? resultado.nombreA : resultado.nombreB)

  const valor = (j) => j.pts + (j.reb || 0) + (j.ast || 0) + (j.rob || 0) + (j.tap || 0)
  const destacado = jugadores.length ? [...jugadores].sort((a, b) => valor(b) - valor(a))[0] : null

  const cols = [
    { id: 'pts', t: 'PTS' },
    statsActivas.includes('reb') && { id: 'reb', t: 'REB' },
    statsActivas.includes('ast') && { id: 'ast', t: 'AST' },
  ].filter(Boolean)

  const placa = (contenido, mb = 12) => (
    <div style={{ position: 'relative', borderRadius: 16, padding: 1.5, background: T.borde, marginBottom: mb }}>
      <div style={{ borderRadius: 15, padding: 16, background: T.vidrio }}>{contenido}</div>
    </div>
  )

  const tablaEquipo = (eq, nombre) => (
    <>
      <div style={{ fontSize: 12, fontWeight: 800, color: eq === 1 ? T.acento : T.textoFuerte, textTransform: 'uppercase', letterSpacing: 0.5, margin: '4px 2px 8px' }}>{nombre} · {totalEq(eq)}</div>
      <div style={{ display: 'flex', fontSize: 9.5, color: C.tenue, textTransform: 'uppercase', padding: '0 4px 6px', fontWeight: 700 }}>
        <span style={{ flex: 2 }}>Jugador</span>
        {cols.map((c) => <span key={c.id} style={{ flex: 1, textAlign: 'center' }}>{c.t}</span>)}
      </div>
      {jugadores.filter((j) => j.equipo === eq).map((j) => (
        <div key={j.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 4px', borderTop: `1px solid ${T.lineaFila}`, fontSize: 13, color: C.texto }}>
          <span style={{ flex: 2, fontWeight: 700 }}>{j.numero && <span style={{ color: C.tenue, fontSize: 11 }}>#{j.numero} </span>}{j.nombre}</span>
          {cols.map((c) => <span key={c.id} style={{ flex: 1, textAlign: 'center', fontWeight: c.id === 'pts' ? 800 : 400, color: c.id === 'pts' ? T.acento : C.texto }}>{j[c.id] || 0}</span>)}
        </div>
      ))}
    </>
  )

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: C.font, background: T.fondo, color: C.texto }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoJuego})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: T.veloGrad }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 70% 40% at 50% 12%, ${T.glow}, transparent 70%)` }} />

      {/* selector de tema flotante */}
      <button onClick={cambiarTema} title={`Tema: ${T.nombre}`} style={{ position: 'fixed', top: 16, right: 16, zIndex: 5, display: 'flex', alignItems: 'center', gap: 7, background: T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(20,18,16,.7)', border: `1px solid ${T.acento}55`, color: T.acento, fontSize: 11.5, fontWeight: 700, padding: '7px 11px', borderRadius: 10, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: T.boton, display: 'inline-block' }} />{T.nombre}
      </button>

      <style>{`
        @keyframes mcSubeFade { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes mcPop { 0% { opacity: 0; transform: scale(0.7); } 60% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes mcBrillo { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.25); } }
        @keyframes mcCae { 0% { transform: translateY(-20px) rotate(0deg); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(620px) rotate(420deg); opacity: 0; } }
      `}</style>

      {!hayEmpate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 14 }).map((_, i) => {
            const colores = ['#e8b65a', '#6fb0ec', '#f3cf63', '#fff', '#2fbf71']
            return <div key={i} style={{ position: 'absolute', top: -20, left: `${(i * 7 + 4) % 100}%`, width: 8, height: 8, borderRadius: i % 2 ? '50%' : 2, background: colores[i % colores.length], animation: `mcCae ${2.4 + (i % 5) * 0.4}s ${i * 0.12}s ease-in forwards` }} />
          })}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '22px 14px 40px' }}>
        {!hayEmpate ? (
          <div style={{ textAlign: 'center', marginBottom: 18, animation: 'mcPop .5s ease-out' }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: C.tenue, marginBottom: 6 }}>🏆 ¡Felicidades!</div>
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1, animation: 'mcBrillo 2s ease-in-out infinite', ...ORO }}>{ganador}</div>
            <div style={{ fontSize: 13, color: C.tenue, marginTop: 6 }}>¡Ganaron el juego! 🏀</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: 18, animation: 'mcPop .5s ease-out' }}>
            <div style={{ fontSize: 24, fontWeight: 800, ...ORO }}>¡Empate!</div>
            <div style={{ fontSize: 13, color: C.tenue, marginTop: 4 }}>Quedaron iguales</div>
          </div>
        )}
        {resultado?.nombreJuego && <div style={{ textAlign: 'center', fontSize: 13, color: C.tenue, marginBottom: 16 }}>{resultado.nombreJuego}</div>}

        {placa(
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.textoFuerte, marginBottom: 4 }}>{resultado?.nombreA}</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: totalA >= totalB ? T.textoFuerte : C.tenue, lineHeight: 1 }}>{totalA}</div>
            </div>
            <div style={{ fontSize: 14, color: C.tenue, fontWeight: 700 }}>—</div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.acento, marginBottom: 4 }}>{resultado?.nombreB}</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: totalB >= totalA ? T.textoFuerte : C.tenue, lineHeight: 1 }}>{totalB}</div>
            </div>
          </div>
        )}

        {destacado && placa(
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#241a07', flexShrink: 0 }}>
              {(destacado.nombre || destacado.numero || '?').slice(0, 1).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: T.acento, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>⭐ Jugador destacado</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.texto }}>{destacado.nombre || ('#' + destacado.numero)}</div>
              <div style={{ fontSize: 12.5, color: C.tenue }}>
                {destacado.pts} pts
                {statsActivas.includes('reb') ? ` · ${destacado.reb || 0} reb` : ''}
                {statsActivas.includes('ast') ? ` · ${destacado.ast || 0} ast` : ''}
              </div>
            </div>
          </div>
        )}

        {placa(<>{tablaEquipo(0, resultado?.nombreA)}<div style={{ height: 16 }} />{tablaEquipo(1, resultado?.nombreB)}</>)}

        <div style={{ textAlign: 'center', fontSize: 12, color: C.tenue, marginBottom: 16, lineHeight: 1.5 }}>
          📸 Haz una captura de pantalla si quieres guardar este resultado.<br />Los juegos rápidos se borran del historial a las 24 horas.
        </div>

        <button
          onClick={publicar}
          disabled={publicado || publicando}
          style={{ width: '100%', marginBottom: 12, borderRadius: 13, padding: 14, cursor: (publicado || publicando) ? 'default' : 'pointer', fontWeight: 800, fontSize: 14, border: `1.5px solid ${T.acento}`, background: publicado ? `${T.acento}1a` : 'transparent', color: T.acento }}>
          {publicado ? '✓ Publicado en el Techado (24 h)' : (publicando ? 'Publicando…' : '↗ Publicar en el Techado')}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => onRepetir && onRepetir()} style={{ width: '100%', borderRadius: 13, padding: 15, border: 'none', background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>🔄 Repetir equipos</button>
          {!hayEmpate && (
            <button onClick={() => onSustituirPerdedor && onSustituirPerdedor(ganadorEq)} style={{ width: '100%', borderRadius: 13, padding: 15, border: `1.5px solid ${T.acento}`, background: 'transparent', color: T.acento, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Sustituir el perdedor</button>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onInicio && onInicio()} style={{ flex: 1, borderRadius: 13, padding: 14, border: `1px solid ${T.botonBorde}`, background: 'transparent', color: C.texto, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Ir al inicio</button>
            <button onClick={() => onNuevo && onNuevo()} style={{ flex: 1, borderRadius: 13, padding: 14, border: `1px solid ${T.botonBorde}`, background: 'transparent', color: C.texto, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Juego nuevo</button>
          </div>
        </div>
      </div>
    </div>
  )
}