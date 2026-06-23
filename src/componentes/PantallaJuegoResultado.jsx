import { useState } from 'react'
import fondoJuego from '../assets/fondo-juego.png'
import LogoEquipo from './LogoEquipo'
import { publicarJuego } from '../techado'
import { compartirPdfResultado } from '../generarPdfResultado'

const SUP_OSCURA = {
  esClaro: false, fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2',
  vidrio: 'linear-gradient(150deg, rgba(24,26,30,0.9), rgba(12,14,18,0.93))',
  veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.86) 0%, rgba(8,9,12,0.93) 100%)',
  lineaFila: 'rgba(255,255,255,.06)', botonBorde: 'rgba(255,255,255,.14)', filaApagada: 'rgba(255,255,255,.03)',
}
const SUP_CLARA_BASE = {
  esClaro: true, textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58',
  vidrio: 'linear-gradient(150deg, rgba(255,255,255,0.93), rgba(250,248,244,0.95))',
  lineaFila: 'rgba(0,0,0,.07)', botonBorde: 'rgba(0,0,0,.14)', filaApagada: 'rgba(0,0,0,.025)',
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

const DISP = '"Arial Narrow", Impact, "Haettenschweiler", system-ui, sans-serif'

const COL_DEFS = [
  { id: 'reb', t: 'REB' },
  { id: 'ast', t: 'AST' },
  { id: 'rob', t: 'ROB' },
  { id: 'tap', t: 'TAP' },
  { id: 'fal', t: 'FAL' },
  { id: 'per', t: 'PER' },
  { id: 'min', t: 'MIN' },
]

const pct = (m, a) => (a > 0 ? Math.round((m / a) * 100) : null)

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
  const [pdfCargando, setPdfCargando] = useState(false)
  const publicar = async () => {
    if (publicado || publicando) return
    setPublicando(true)
    const res = await publicarJuego(resultado)
    if (!res.error) setPublicado(true)
    else alert(res.error)
    setPublicando(false)
  }
  const compartirPdf = async () => {
    if (pdfCargando) return
    setPdfCargando(true)
    try { await compartirPdfResultado(resultado) }
    catch (e) { alert('No se pudo generar el PDF. Intenta de nuevo.') }
    setPdfCargando(false)
  }

  const jugadores = resultado?.jugadores || []
  const statsActivas = resultado?.statsActivas || ['pts']
  const totalEq = (eq) => jugadores.filter((j) => j.equipo === eq).reduce((a, j) => a + (j.pts || 0), 0)
  const totalA = totalEq(0), totalB = totalEq(1)
  const hayEmpate = totalA === totalB
  const ganadorEq = hayEmpate ? null : (totalA > totalB ? 0 : 1)
  const ganadorNombre = hayEmpate ? null : (totalA > totalB ? resultado?.nombreA : resultado?.nombreB)
  const ganadorLogo = hayEmpate ? null : (totalA > totalB ? resultado?.logoA : resultado?.logoB)
  const altoTotal = Math.max(totalA, totalB), bajoTotal = Math.min(totalA, totalB)

  const valor = (j) => (j.pts || 0) + (j.reb || 0) + (j.ast || 0) + (j.rob || 0) + (j.tap || 0)
  const destacado = jugadores.length ? [...jugadores].sort((a, b) => valor(b) - valor(a))[0] : null

  // momentos destacados (capturados en vivo: rachas, parciales, hitos, manuales)
  const momentosLista = resultado?.momentos || []
  const iconoMomento = (tipo) => ({ racha: '🔥', parcial: '💥', mejorJuego: '⭐', cambioMando: '🔄', empate: '🤝', manual: '⭐' }[tipo] || '🏀')

  // ===== DESGLOSE POR CUARTO (sale del historial, que guarda el cuarto de cada jugada) =====
  const historial = resultado?.historial || []
  const totalCuartos = resultado?.cuartos || 1
  const hayCuartos = totalCuartos > 1 && historial.some((h) => h.cuarto)
  const cuartosArr = Array.from({ length: totalCuartos }, (_, i) => i + 1)
  const ptsCuartoEq = (q, eq) => historial.filter((h) => h.cuarto === q && h.equipo === eq).reduce((a, h) => a + ((h.suma && h.suma.pts) || 0), 0)
  const ptsCuartoJug = (q, jid) => historial.filter((h) => h.cuarto === q && h.jugId === jid).reduce((a, h) => a + ((h.suma && h.suma.pts) || 0), 0)

  const cols = [{ id: 'pts', t: 'PTS', fuerte: true }]
  COL_DEFS.forEach((c) => { if (statsActivas.includes(c.id)) cols.push(c) })
  // El % de tiro de campo SOLO sale si de verdad se anotaron tiros fallados
  // (sin fallados no hay con qué calcular: daría 100% falso).
  const hayFallados = jugadores.some((j) => (j.fa2 || 0) + (j.fa3 || 0) > 0)
  const hayLibres = jugadores.some((j) => (j.tlm || 0) + (j.tlf || 0) > 0)
  if (hayFallados) cols.push({ id: 'tc', t: 'TC%', porc: true })
  if (hayLibres) cols.push({ id: 'tl', t: 'TL%', porc: true })

  const valCelda = (j, c) => {
    if (c.id === 'tc') { const p = pct((j.m2 || 0) + (j.m3 || 0), (j.m2 || 0) + (j.m3 || 0) + (j.fa2 || 0) + (j.fa3 || 0)); return p == null ? '—' : p + '%' }
    if (c.id === 'tl') { const p = pct(j.tlm || 0, (j.tlm || 0) + (j.tlf || 0)); return p == null ? '—' : p + '%' }
    return j[c.id] || 0
  }

  const ANCHO_NOM = 116, ANCHO_COL = 50

  const escudo = (logoId, nombre, size, anillo) => (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: logoId ? 'transparent' : T.avatar, color: '#241a07', fontWeight: 900, fontFamily: DISP, fontSize: Math.round(size * 0.42), boxShadow: anillo ? `0 0 0 3px ${T.acento}, 0 0 26px ${T.glow}` : 'none' }}>
      {logoId ? <LogoEquipo id={logoId} size={size} /> : (nombre || '?').slice(0, 1).toUpperCase()}
    </div>
  )

  const placa = (contenido, mb = 12) => (
    <div style={{ position: 'relative', borderRadius: 16, padding: 1.5, background: T.borde, marginBottom: mb }}>
      <div style={{ borderRadius: 15, padding: 16, background: T.vidrio }}>{contenido}</div>
    </div>
  )

  const tablaEquipo = (eq, nombre, logoId, esGanador) => {
    const lista = jugadores.filter((j) => j.equipo === eq)
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '2px 2px 10px' }}>
          {escudo(logoId, nombre, 30)}
          <span style={{ flex: 1, fontSize: 14, fontWeight: 800, color: T.textoFuerte, fontFamily: DISP, textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</span>
          {esGanador && <span style={{ fontSize: 14 }}>👑</span>}
          <span style={{ fontSize: 22, fontWeight: 900, fontFamily: DISP, color: esGanador ? T.acento : C.tenue }}>{totalEq(eq)}</span>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: ANCHO_NOM + cols.length * ANCHO_COL }}>
            <div style={{ display: 'flex', fontSize: 9.5, color: C.tenue, textTransform: 'uppercase', padding: '0 2px 6px', fontWeight: 800, letterSpacing: 0.3 }}>
              <span style={{ width: ANCHO_NOM, flexShrink: 0 }}>Jugador</span>
              {cols.map((c) => <span key={c.id} style={{ width: ANCHO_COL, flexShrink: 0, textAlign: 'center' }}>{c.t}</span>)}
            </div>
            {lista.map((j) => (
              <div key={j.id} style={{ display: 'flex', alignItems: 'center', padding: '9px 2px', borderTop: `1px solid ${T.lineaFila}`, fontSize: 13, color: C.texto }}>
                <span style={{ width: ANCHO_NOM, flexShrink: 0, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 6 }}>
                  {j.numero ? <span style={{ color: C.tenue, fontSize: 11 }}>#{j.numero} </span> : null}{j.nombre || ('#' + j.numero)}
                </span>
                {cols.map((c) => (
                  <span key={c.id} style={{ width: ANCHO_COL, flexShrink: 0, textAlign: 'center', fontWeight: c.fuerte ? 900 : 600, fontFamily: c.fuerte ? DISP : C.font, fontSize: c.fuerte ? 16 : 13, color: c.fuerte ? T.acento : (c.porc ? T.textoFuerte : C.texto) }}>{valCelda(j, c)}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const ladoMarcador = (nombre, logoId, total, esGana) => (
    <div style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
      {esGana ? <div style={{ fontSize: 18, marginBottom: 2 }}>👑</div> : <div style={{ height: 20 }} />}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 7 }}>{escudo(logoId, nombre, 46, esGana)}</div>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: esGana ? T.acento : C.tenue, fontFamily: DISP, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px' }}>{nombre}</div>
      <div style={{ fontSize: 54, fontWeight: 900, lineHeight: 0.95, fontFamily: DISP, color: esGana ? 'transparent' : C.tenue, ...(esGana ? ORO : {}), animation: esGana ? 'mcBrillo 2.4s ease-in-out infinite' : 'none' }}>{total}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: C.font, background: T.fondo, color: C.texto }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoJuego})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: T.veloGrad }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 80% 44% at 50% 8%, ${T.glow}, transparent 70%)` }} />

      <button onClick={cambiarTema} title={`Tema: ${T.nombre}`} style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top) + 12px)', right: 16, zIndex: 5, display: 'flex', alignItems: 'center', gap: 7, background: T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(20,18,16,.7)', border: `1px solid ${T.acento}55`, color: T.acento, fontSize: 11.5, fontWeight: 700, padding: '7px 11px', borderRadius: 10, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: T.boton, display: 'inline-block' }} />{T.nombre}
      </button>

      <style>{`
        @keyframes mcSubeFade { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes mcPop { 0% { opacity: 0; transform: scale(0.7); } 60% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes mcBrillo { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.3); } }
        @keyframes mcCorona { 0% { opacity: 0; transform: translateY(-18px) scale(.4) rotate(-12deg); } 55% { transform: translateY(0) scale(1.18) rotate(6deg); } 100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); } }
        @keyframes mcCae { 0% { transform: translateY(-20px) rotate(0deg); opacity: 0; } 12% { opacity: 1; } 100% { transform: translateY(680px) rotate(460deg); opacity: 0; } }
        @keyframes mcAnillo { 0% { transform: scale(.8); opacity: .55; } 100% { transform: scale(1.7); opacity: 0; } }
      `}</style>

      {!hayEmpate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 22 }).map((_, i) => {
            const colores = ['#e8b65a', '#6fb0ec', '#f3cf63', '#ffffff', '#2fbf71', '#c8842e']
            return <div key={i} style={{ position: 'absolute', top: -20, left: `${(i * 4.5 + 3) % 100}%`, width: 8, height: 8, borderRadius: i % 2 ? '50%' : 2, background: colores[i % colores.length], animation: `mcCae ${2.6 + (i % 5) * 0.45}s ${i * 0.1}s ease-in forwards` }} />
          })}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top) + 22px) 14px calc(env(safe-area-inset-bottom) + 40px)' }}>

        {!hayEmpate ? (
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 46, lineHeight: 1, marginBottom: 2, animation: 'mcCorona .7s ease-out both' }}>👑</div>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: C.tenue, marginBottom: 10 }}>Campeón del juego</div>
            <div style={{ position: 'relative', display: 'inline-grid', placeItems: 'center', marginBottom: 12 }}>
              <span style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', border: `2px solid ${T.acento}`, animation: 'mcAnillo 1.8s ease-out infinite' }} />
              <div style={{ animation: 'mcPop .5s ease-out both' }}>{escudo(ganadorLogo, ganadorNombre, 90, true)}</div>
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.02, fontFamily: DISP, textTransform: 'uppercase', letterSpacing: 0.5, animation: 'mcBrillo 2.4s ease-in-out infinite', ...ORO }}>{ganadorNombre}</div>
            <div style={{ fontSize: 14, color: C.tenue, marginTop: 6, fontWeight: 700 }}>Ganó <b style={{ color: T.textoFuerte }}>{altoTotal}</b> a {bajoTotal} 🏀</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: 18, animation: 'mcPop .5s ease-out both' }}>
            <div style={{ fontSize: 40, marginBottom: 4 }}>🤝</div>
            <div style={{ fontSize: 34, fontWeight: 900, fontFamily: DISP, textTransform: 'uppercase', letterSpacing: 1, ...ORO }}>¡Empate!</div>
            <div style={{ fontSize: 13.5, color: C.tenue, marginTop: 4 }}>Quedaron iguales {totalA} a {totalB}</div>
          </div>
        )}
        {resultado?.nombreJuego && <div style={{ textAlign: 'center', fontSize: 13, color: C.tenue, marginBottom: 14 }}>{resultado.nombreJuego}</div>}

        {placa(
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around' }}>
            {ladoMarcador(resultado?.nombreA, resultado?.logoA, totalA, !hayEmpate && ganadorEq === 0)}
            <div style={{ alignSelf: 'center', fontSize: 13, color: C.tenue, fontWeight: 900, fontFamily: DISP, padding: '0 6px', marginTop: 14 }}>VS</div>
            {ladoMarcador(resultado?.nombreB, resultado?.logoB, totalB, !hayEmpate && ganadorEq === 1)}
          </div>
        )}

        {destacado && placa(
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, fontFamily: DISP, color: '#241a07', flexShrink: 0 }}>
              {(destacado.nombre || destacado.numero || '?').slice(0, 1).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: T.acento, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>⭐ Figura del partido</div>
              <div style={{ fontSize: 19, fontWeight: 900, fontFamily: DISP, textTransform: 'uppercase', color: C.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{destacado.nombre || ('#' + destacado.numero)}</div>
              <div style={{ fontSize: 12.5, color: C.tenue }}>
                {destacado.pts || 0} pts
                {statsActivas.includes('reb') ? ` · ${destacado.reb || 0} reb` : ''}
                {statsActivas.includes('ast') ? ` · ${destacado.ast || 0} ast` : ''}
                {statsActivas.includes('rob') ? ` · ${destacado.rob || 0} rob` : ''}
                {statsActivas.includes('tap') ? ` · ${destacado.tap || 0} tap` : ''}
              </div>
            </div>
          </div>
        )}

        {momentosLista.length > 0 && placa(
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: T.acento, marginBottom: 11, display: 'flex', alignItems: 'center', gap: 6 }}>🔥 Momentos del juego</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {momentosLista.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 11, background: T.esClaro ? 'rgba(176,122,38,.08)' : 'rgba(232,182,90,.08)', border: `1px solid ${T.esClaro ? 'rgba(176,122,38,.18)' : 'rgba(232,182,90,.16)'}` }}>
                  <span style={{ fontSize: 17, flexShrink: 0 }}>{iconoMomento(m.tipo)}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.texto, lineHeight: 1.3 }}>{m.etiqueta}</span>
                  {m.manual && <span style={{ fontSize: 9, fontWeight: 800, color: T.acento, textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 0 }}>Marcado</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {hayCuartos && placa(
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: T.acento, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>📊 Puntos por cuarto</div>

            {/* Parciales por equipo */}
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16 }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 60 + (totalCuartos + 1) * 46 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', fontSize: 9.5, fontWeight: 800, color: C.tenue, textTransform: 'uppercase', letterSpacing: 0.4, padding: '0 8px 8px 2px' }}>Equipo</th>
                    {cuartosArr.map((q) => <th key={q} style={{ width: 46, fontSize: 10.5, fontWeight: 800, color: C.tenue, padding: '0 0 8px' }}>{q}º</th>)}
                    <th style={{ width: 46, fontSize: 10.5, fontWeight: 900, color: T.acento, padding: '0 0 8px' }}>Tot</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1].map((eq) => {
                    const nombreEq = eq === 0 ? resultado?.nombreA : resultado?.nombreB
                    const esGana = !hayEmpate && ganadorEq === eq
                    return (
                      <tr key={eq} style={{ borderTop: `1px solid ${T.lineaFila}` }}>
                        <td style={{ textAlign: 'left', fontSize: 12.5, fontWeight: 800, color: esGana ? T.acento : C.texto, fontFamily: DISP, textTransform: 'uppercase', letterSpacing: 0.3, padding: '10px 8px 10px 2px', whiteSpace: 'nowrap', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreEq}</td>
                        {cuartosArr.map((q) => <td key={q} style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: C.texto, padding: '10px 0' }}>{ptsCuartoEq(q, eq)}</td>)}
                        <td style={{ textAlign: 'center', fontSize: 17, fontWeight: 900, fontFamily: DISP, color: esGana ? T.acento : C.texto, padding: '10px 0' }}>{totalEq(eq)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Puntos por jugador, por cuarto */}
            {[0, 1].map((eq) => {
              const lista = jugadores.filter((j) => j.equipo === eq && (j.pts || 0) > 0)
              if (!lista.length) return null
              const nombreEq = eq === 0 ? resultado?.nombreA : resultado?.nombreB
              return (
                <div key={eq} style={{ marginTop: eq === 0 ? 4 : 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.tenue, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{nombreEq}</div>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 110 + (totalCuartos + 1) * 40 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', fontSize: 9.5, fontWeight: 800, color: C.tenue, padding: '0 6px 6px 2px' }}>Jugador</th>
                          {cuartosArr.map((q) => <th key={q} style={{ width: 40, fontSize: 10, fontWeight: 800, color: C.tenue, padding: '0 0 6px' }}>{q}º</th>)}
                          <th style={{ width: 40, fontSize: 10, fontWeight: 900, color: T.acento, padding: '0 0 6px' }}>Tot</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lista.map((j) => (
                          <tr key={j.id} style={{ borderTop: `1px solid ${T.lineaFila}` }}>
                            <td style={{ textAlign: 'left', fontSize: 12.5, color: C.texto, padding: '8px 6px 8px 2px', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.numero ? <span style={{ color: C.tenue, fontSize: 11 }}>#{j.numero} </span> : null}{j.nombre || ('#' + j.numero)}</td>
                            {cuartosArr.map((q) => { const v = ptsCuartoJug(q, j.id); return <td key={q} style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: v ? C.texto : C.tenue, padding: '8px 0' }}>{v || '·'}</td> })}
                            <td style={{ textAlign: 'center', fontSize: 14, fontWeight: 900, fontFamily: DISP, color: T.acento, padding: '8px 0' }}>{j.pts || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {placa(
          <>
            {tablaEquipo(0, resultado?.nombreA, resultado?.logoA, !hayEmpate && ganadorEq === 0)}
            <div style={{ height: 18 }} />
            {tablaEquipo(1, resultado?.nombreB, resultado?.logoB, !hayEmpate && ganadorEq === 1)}
            {cols.length > 4 && <div style={{ fontSize: 10.5, color: C.tenue, textAlign: 'center', marginTop: 10 }}>Desliza la tabla → para ver todas las estadísticas</div>}
          </>
        )}

        <button
          onClick={compartirPdf}
          disabled={pdfCargando}
          style={{ width: '100%', marginBottom: 12, borderRadius: 13, padding: 15, cursor: pdfCargando ? 'default' : 'pointer', fontWeight: 800, fontSize: 15, border: 'none', background: T.boton, color: '#1a1205', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {pdfCargando ? 'Generando PDF…' : '📄 Compartir resultado en PDF'}
        </button>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: C.tenue, marginBottom: 16, lineHeight: 1.5 }}>
          Un documento para abrir, imprimir o enviar.<br />Los juegos rápidos se borran del historial a las 24 horas.
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
            <button onClick={() => onSustituirPerdedor && onSustituirPerdedor(ganadorEq)} style={{ width: '100%', borderRadius: 13, padding: 15, border: `1.5px solid ${T.acento}`, background: 'transparent', color: T.acento, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Ganador se queda · cambia el perdedor</button>
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