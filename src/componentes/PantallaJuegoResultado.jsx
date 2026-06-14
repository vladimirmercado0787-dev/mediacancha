import { useState } from 'react'
import fondoJuego from '../assets/fondo-juego.png'
import { publicarJuego } from '../techado'

const TEMAS = {
  dorado: {
    acento: '#e8b65a', borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)',
    texto: 'linear-gradient(120deg,#fbe08a,#c8842e)', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', glow: 'rgba(190,135,55,0.20)', avatar: 'linear-gradient(150deg,#e0b057,#9a6420)',
  },
  azul: {
    acento: '#6fb0ec', borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)',
    texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', glow: 'rgba(55,120,190,0.22)', avatar: 'linear-gradient(150deg,#5f9fd8,#1d4a80)',
  },
}

export default function PantallaJuegoResultado({ resultado, onNuevo, onInicio, onRepetir, onSustituirPerdedor }) {
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
  const tema = (typeof window !== 'undefined' && localStorage.getItem('mc_tema')) || 'dorado'
  const T = TEMAS[tema] || TEMAS.dorado
  const ORO = { background: T.texto, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }
  const C = { texto: '#eef3f6', tenue: '#9aa7b2', font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }

  const jugadores = resultado?.jugadores || []
  const statsActivas = resultado?.statsActivas || ['pts']
  const totalEq = (eq) => jugadores.filter((j) => j.equipo === eq).reduce((a, j) => a + j.pts, 0)
  const totalA = totalEq(0), totalB = totalEq(1)
  const hayEmpate = totalA === totalB
  const ganadorEq = hayEmpate ? null : (totalA > totalB ? 0 : 1)
  const ganador = hayEmpate ? null : (totalA > totalB ? resultado.nombreA : resultado.nombreB)

  // Destacado: mayor suma ponderada simple (pts + reb + ast + rob + tap)
  const valor = (j) => j.pts + (j.reb || 0) + (j.ast || 0) + (j.rob || 0) + (j.tap || 0)
  const destacado = jugadores.length ? [...jugadores].sort((a, b) => valor(b) - valor(a))[0] : null

  const cols = [
    { id: 'pts', t: 'PTS' },
    statsActivas.includes('reb') && { id: 'reb', t: 'REB' },
    statsActivas.includes('ast') && { id: 'ast', t: 'AST' },
  ].filter(Boolean)

  const placa = (contenido, mb = 12) => (
    <div style={{ position: 'relative', borderRadius: 16, padding: 1.5, background: T.borde, marginBottom: mb }}>
      <div style={{ borderRadius: 15, padding: 16, background: 'linear-gradient(150deg, rgba(24,26,30,0.9), rgba(12,14,18,0.93))' }}>{contenido}</div>
    </div>
  )

  const tablaEquipo = (eq, nombre) => (
    <>
      <div style={{ fontSize: 12, fontWeight: 800, color: eq === 1 ? T.acento : '#fff', textTransform: 'uppercase', letterSpacing: 0.5, margin: '4px 2px 8px' }}>{nombre} · {totalEq(eq)}</div>
      <div style={{ display: 'flex', fontSize: 9.5, color: C.tenue, textTransform: 'uppercase', padding: '0 4px 6px', fontWeight: 700 }}>
        <span style={{ flex: 2 }}>Jugador</span>
        {cols.map((c) => <span key={c.id} style={{ flex: 1, textAlign: 'center' }}>{c.t}</span>)}
      </div>
      {jugadores.filter((j) => j.equipo === eq).map((j) => (
        <div key={j.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 4px', borderTop: '1px solid rgba(255,255,255,.06)', fontSize: 13, color: C.texto }}>
          <span style={{ flex: 2, fontWeight: 700 }}>{j.numero && <span style={{ color: C.tenue, fontSize: 11 }}>#{j.numero} </span>}{j.nombre}</span>
          {cols.map((c) => <span key={c.id} style={{ flex: 1, textAlign: 'center', fontWeight: c.id === 'pts' ? 800 : 400, color: c.id === 'pts' ? T.acento : C.texto }}>{j[c.id] || 0}</span>)}
        </div>
      ))}
    </>
  )

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: C.font, background: '#08090c', color: C.texto }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoJuego})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(8,9,12,0.86) 0%, rgba(8,9,12,0.93) 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 70% 40% at 50% 12%, ${T.glow}, transparent 70%)` }} />

      <style>{`
        @keyframes mcSubeFade { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes mcPop { 0% { opacity: 0; transform: scale(0.7); } 60% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes mcBrillo { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.25); } }
        @keyframes mcCae { 0% { transform: translateY(-20px) rotate(0deg); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(620px) rotate(420deg); opacity: 0; } }
      `}</style>

      {/* confeti de celebración */}
      {!hayEmpate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 14 }).map((_, i) => {
            const cols = ['#e8b65a', '#6fb0ec', '#f3cf63', '#fff', '#2fbf71']
            return <div key={i} style={{ position: 'absolute', top: -20, left: `${(i * 7 + 4) % 100}%`, width: 8, height: 8, borderRadius: i % 2 ? '50%' : 2, background: cols[i % cols.length], animation: `mcCae ${2.4 + (i % 5) * 0.4}s ${i * 0.12}s ease-in forwards` }} />
          })}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '22px 14px 40px' }}>
        {/* CELEBRACIÓN DEL GANADOR */}
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

        {/* Marcador final */}
        {placa(
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{resultado?.nombreA}</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: totalA >= totalB ? '#fff' : C.tenue, lineHeight: 1 }}>{totalA}</div>
            </div>
            <div style={{ fontSize: 14, color: C.tenue, fontWeight: 700 }}>—</div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.acento, marginBottom: 4 }}>{resultado?.nombreB}</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: totalB >= totalA ? '#fff' : C.tenue, lineHeight: 1 }}>{totalB}</div>
            </div>
          </div>
        )}

        {/* Jugador destacado */}
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

        {/* Tablas de stats */}
        {placa(<>{tablaEquipo(0, resultado?.nombreA)}<div style={{ height: 16 }} />{tablaEquipo(1, resultado?.nombreB)}</>)}

        <div style={{ textAlign: 'center', fontSize: 12, color: C.tenue, marginBottom: 16, lineHeight: 1.5 }}>
          📸 Haz una captura de pantalla si quieres guardar este resultado.<br />Los juegos rápidos se borran del historial a las 24 horas.
        </div>

        {/* Publicar en el Techado (opcional) */}
        <button
          onClick={publicar}
          disabled={publicado || publicando}
          style={{ width: '100%', marginBottom: 12, borderRadius: 13, padding: 14, cursor: (publicado || publicando) ? 'default' : 'pointer', fontWeight: 800, fontSize: 14, border: `1.5px solid ${T.acento}`, background: publicado ? `${T.acento}1a` : 'transparent', color: T.acento }}>
          {publicado ? '✓ Publicado en el Techado (24 h)' : (publicando ? 'Publicando…' : '↗ Publicar en el Techado')}
        </button>

        {/* Botones de continuación */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => onRepetir && onRepetir()} style={{ width: '100%', borderRadius: 13, padding: 15, border: 'none', background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>🔄 Repetir equipos</button>
          {!hayEmpate && (
            <button onClick={() => onSustituirPerdedor && onSustituirPerdedor(ganadorEq)} style={{ width: '100%', borderRadius: 13, padding: 15, border: `1.5px solid ${T.acento}`, background: 'transparent', color: T.acento, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Sustituir el perdedor</button>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onInicio && onInicio()} style={{ flex: 1, borderRadius: 13, padding: 14, border: '1px solid rgba(255,255,255,.14)', background: 'transparent', color: C.texto, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Ir al inicio</button>
            <button onClick={() => onNuevo && onNuevo()} style={{ flex: 1, borderRadius: 13, padding: 14, border: '1px solid rgba(255,255,255,.14)', background: 'transparent', color: C.texto, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Juego nuevo</button>
          </div>
        </div>
      </div>
    </div>
  )
}