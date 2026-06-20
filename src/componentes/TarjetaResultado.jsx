import { useState, useEffect } from 'react'
import LogoEquipo from './LogoEquipo'

// Temas compactos (solo lo que la tarjeta necesita) — coherentes con el resto de la app
const TEMAS_CARD = {
  dorado: { esClaro: false, acento: '#e8b65a', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', subTexto: '#c3ccd4', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', tarjetaBg: 'rgba(20,22,26,.96)', tarjetaBorde: 'rgba(255,255,255,.08)', tarjetaSombra: 'none', lineaSuave: 'rgba(255,255,255,.08)' },
  azul: { esClaro: false, acento: '#6fb0ec', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', subTexto: '#c3ccd4', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', tarjetaBg: 'rgba(20,22,26,.96)', tarjetaBorde: 'rgba(255,255,255,.08)', tarjetaSombra: 'none', lineaSuave: 'rgba(255,255,255,.08)' },
  claro: { esClaro: true, acento: '#b07a26', textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58', subTexto: '#5b5040', boton: 'linear-gradient(150deg, #e7c069, #b07a26)', tarjetaBg: '#ffffff', tarjetaBorde: '#e0e3e8', tarjetaSombra: '0 8px 24px rgba(20,24,30,.06)', lineaSuave: '#eceef1' },
  larimar: { esClaro: true, acento: '#b07a26', textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375', subTexto: '#48595a', boton: 'linear-gradient(150deg, #e7c069, #b07a26)', tarjetaBg: '#ffffff', tarjetaBorde: '#cfe0e2', tarjetaSombra: '0 8px 24px rgba(20,30,32,.06)', lineaSuave: '#e2edee' },
}

const FUENTES = {
  rapido: { etiqueta: 'Rápido', color: '#2f9e6e', colorClaro: '#e4f4ec', icono: '🏆' },
  liga: { etiqueta: 'Liga', color: '#3a6ea5', colorClaro: '#e6eef7', icono: '👑' },
  torneo: { etiqueta: 'Torneo', color: '#c8842e', colorClaro: '#f6e9cf', icono: '👑' },
}

// fuente deportiva condensada (igual que el resto del rediseño)
const DISP = '"Arial Narrow", Impact, "Haettenschweiler", system-ui, sans-serif'

function colorEquipo(semilla) {
  const paleta = [
    'linear-gradient(150deg,#3a6ea5,#23415f)', 'linear-gradient(150deg,#c0504e,#7a2f2e)',
    'linear-gradient(150deg,#3a9e6e,#23543f)', 'linear-gradient(150deg,#8a5cc4,#4f3275)',
    'linear-gradient(150deg,#c4823a,#754d1f)', 'linear-gradient(150deg,#3a8a9e,#23545f)',
  ]
  let h = 0
  const s = String(semilla || 'x')
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % paleta.length
  return paleta[Math.abs(h)]
}

// genera la nota inteligente (tipo cronista) según cómo se dio el juego
function generarNota(d, totalA, totalB, destacado) {
  const empate = totalA === totalB
  if (empate) return `Igualados hasta el final, terminaron ${totalA}-${totalB}. Un duelo que pudo caer para cualquier lado.`
  const ganaA = totalA > totalB
  const ganador = ganaA ? d.nombreA : d.nombreB
  const perdedor = ganaA ? d.nombreB : d.nombreA
  const dif = Math.abs(totalA - totalB)
  let nota
  if (dif >= 15) nota = `Dominio total de ${ganador} de principio a fin ante ${perdedor}.`
  else if (dif >= 6) nota = `${ganador} controló el juego ante ${perdedor}.`
  else nota = `Partido cerrado, definido en los detalles. ${ganador} lo sacó por la mínima.`
  if (destacado && (destacado.pts || 0) >= 25) {
    nota += ` ${destacado.nombre || ('#' + destacado.numero)} fue la figura con ${destacado.pts} puntos.`
  }
  return nota
}

// === TITULAR con verbo fuerte (psicología periodística) según cómo se dio el juego ===
// Devuelve { antes, verbo, despues, gancho } — "verbo" va en oro.
function generarTitular(d, totalA, totalB) {
  const empate = totalA === totalB
  if (empate) {
    return { antes: d.nombreA + ' y ' + d.nombreB, verbo: 'empataron', despues: 'a lo grande', gancho: 'Un duelo que pudo caer para cualquier lado.' }
  }
  const ganaA = totalA > totalB
  const ganador = ganaA ? d.nombreA : d.nombreB
  const perdedor = ganaA ? d.nombreB : d.nombreA
  const dif = Math.abs(totalA - totalB)
  if (dif >= 20) return { antes: ganador, verbo: 'aplastó', despues: 'a ' + perdedor, gancho: 'Una paliza de principio a fin.' }
  if (dif >= 12) return { antes: ganador, verbo: 'dominó', despues: 'el juego', gancho: 'Controló de principio a fin ante ' + perdedor + '.' }
  if (dif <= 3) return { antes: ganador, verbo: 'sobrevivió', despues: 'al final', gancho: 'Partido cerrado, definido en los detalles.' }
  return { antes: ganador, verbo: 'venció', despues: 'a ' + perdedor, gancho: 'Se llevó un buen duelo de canchas.' }
}

export default function TarjetaResultado({ datos, fuente = 'rapido', tiempo, autorNombre, autorFoto, autorId, onIrPerfil, comentario, acciones, pie, temaForzado }) {
  const [abierto, setAbierto] = useState(false)
  const [esAncho, setEsAncho] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : false)
  useEffect(() => {
    const f = () => setEsAncho(window.innerWidth >= 768)
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  const tema = temaForzado || (typeof window !== 'undefined' ? (localStorage.getItem('mc_tema') || 'dorado') : 'dorado')
  const T = TEMAS_CARD[tema] || TEMAS_CARD.dorado
  const F = FUENTES[fuente] || FUENTES.rapido

  const d = datos || {}
  const jugadores = d.jugadores || []
  const momentosCard = (d.momentos || []).slice(0, 6)
  const iconoMom = (tipo) => ({ racha: '🔥', parcial: '💥', mejorJuego: '⭐', cambioMando: '🔄', empate: '🤝', manual: '⭐' }[tipo] || '🏀')
  const totalA = d.totalA != null ? d.totalA : jugadores.filter((x) => x.equipo === 0).reduce((a, x) => a + (x.pts || 0), 0)
  const totalB = d.totalB != null ? d.totalB : jugadores.filter((x) => x.equipo === 1).reduce((a, x) => a + (x.pts || 0), 0)
  const hayEmpate = totalA === totalB
  const ganoA = !hayEmpate && totalA > totalB
  const ganoB = !hayEmpate && totalB > totalA

  // destacado = más puntos (desempate reb, ast)
  let destacado = null
  jugadores.forEach((j) => {
    if (!destacado) { destacado = j; return }
    const mejor = (j.pts || 0) > (destacado.pts || 0) ||
      ((j.pts || 0) === (destacado.pts || 0) && (j.reb || 0) > (destacado.reb || 0))
    if (mejor) destacado = j
  })
  const destNombre = d.destacadoNombre || (destacado ? (destacado.nombre || ('#' + destacado.numero)) : null)
  const destPts = d.destacadoPts != null ? d.destacadoPts : (destacado ? (destacado.pts || 0) : 0)
  const destReb = d.destacadoReb != null ? d.destacadoReb : (destacado ? (destacado.reb || 0) : 0)
  const destAst = d.destacadoAst != null ? d.destacadoAst : (destacado ? (destacado.ast || 0) : 0)

  const nota = d.narracion || generarNota(d, totalA, totalB, destacado)
  const titular = generarTitular(d, totalA, totalB)
  const jugA = jugadores.filter((x) => x.equipo === 0)
  const jugB = jugadores.filter((x) => x.equipo === 1)

  // columnas dinámicas: se muestran si se activaron O si hay datos anotados
  const COLS_POS = [['reb', 'REB'], ['ast', 'AST'], ['rob', 'ROB'], ['tap', 'TAP'], ['fal', 'FAL'], ['per', 'PER'], ['min', 'MIN']]
  const statsActivas = d.statsActivas || ['pts']
  const tieneDato = (id) => jugadores.some((x) => (x[id] || 0) > 0)
  // El % de tiro de campo SOLO sale si se anotaron tiros FALLADOS (sin ellos daría 100% falso)
  const hayFalladosT = jugadores.some((x) => (x.fa2 || 0) + (x.fa3 || 0) > 0)
  const hayLibresT = jugadores.some((x) => (x.tlm || 0) + (x.tlf || 0) > 0)
  const colsT = [{ id: 'pts', t: 'PTS', fuerte: true }]
  COLS_POS.forEach(([id, t]) => { if (statsActivas.includes(id) || tieneDato(id)) colsT.push({ id, t }) })
  if (hayFalladosT) colsT.push({ id: 'tc', t: 'TC%', porc: true })
  if (hayLibresT) colsT.push({ id: 'tl', t: 'TL%', porc: true })
  const pctT = (m, a) => (a > 0 ? Math.round((m / a) * 100) : null)
  const celdaT = (x, c) => {
    if (c.id === 'tc') { const p = pctT((x.m2 || 0) + (x.m3 || 0), (x.m2 || 0) + (x.m3 || 0) + (x.fa2 || 0) + (x.fa3 || 0)); return p == null ? '—' : p + '%' }
    if (c.id === 'tl') { const p = pctT(x.tlm || 0, (x.tlm || 0) + (x.tlf || 0)); return p == null ? '—' : p + '%' }
    return x[c.id] || 0
  }
  const ANCHO_NOM_T = 104, ANCHO_COL_T = 46

  // escudo con marcador GRANDE al lado (estilo mockup) — crece en computadora
  const fila = (nombre, total, gano, logoId, alinearDer) => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: esAncho ? 14 : 11, flexDirection: alinearDer ? 'row-reverse' : 'row', textAlign: alinearDer ? 'right' : 'left', minWidth: 0 }}>
      <div style={{ width: esAncho ? 54 : 44, height: esAncho ? 54 : 44, borderRadius: 13, flexShrink: 0, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: esAncho ? 19 : 16, fontFamily: 'ui-monospace, monospace', background: logoId ? (T.esClaro ? '#f5f6f8' : 'rgba(255,255,255,.04)') : colorEquipo(nombre), position: 'relative', boxShadow: '0 6px 16px rgba(20,24,30,.2)', overflow: 'hidden' }}>
        {gano && <span style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', fontSize: 16, zIndex: 2 }}>{F.icono}</span>}
        {logoId ? <LogoEquipo id={logoId} size={esAncho ? 50 : 40} /> : (nombre || '?').slice(0, 1).toUpperCase()}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: esAncho ? 16 : 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.2, color: gano ? T.acento : T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</div>
      </div>
      <div style={{ fontFamily: DISP, fontWeight: 900, fontSize: esAncho ? 56 : 44, lineHeight: 0.8, color: gano ? T.acento : (T.esClaro ? '#bcae92' : '#6f6452') }}>{total}</div>
    </div>
  )

  const tablaStats = (titulo, lista, color) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color, marginBottom: 6 }}>{titulo}</div>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.lineaSuave}` }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: ANCHO_NOM_T + colsT.length * ANCHO_COL_T }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '7px 12px', background: T.esClaro ? '#f5f6f8' : 'rgba(255,255,255,.04)', fontSize: 10, fontWeight: 700, color: T.tenue, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <span style={{ width: ANCHO_NOM_T, flexShrink: 0 }}>Jugador</span>
              {colsT.map((c) => <span key={c.id} style={{ width: ANCHO_COL_T, flexShrink: 0, textAlign: 'center' }}>{c.t}</span>)}
            </div>
            {lista.length === 0 ? (
              <div style={{ padding: '10px 12px', fontSize: 12, color: T.tenue }}>Sin datos de jugadores.</div>
            ) : lista.map((x, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderTop: `1px solid ${T.lineaSuave}`, fontSize: 12.5, color: T.textoBody }}>
                <span style={{ width: ANCHO_NOM_T, flexShrink: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 6 }}>{x.nombre || ('#' + (x.numero || '?'))}</span>
                {colsT.map((c) => (
                  <span key={c.id} style={{ width: ANCHO_COL_T, flexShrink: 0, textAlign: 'center', fontWeight: c.fuerte ? 800 : 500, color: c.fuerte ? T.acento : (c.porc ? T.textoFuerte : T.textoBody) }}>{celdaT(x, c)}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 16, boxShadow: T.tarjetaSombra, overflow: 'hidden' }}>
      <style>{`
        @keyframes mcDetalleIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .mc-detalle-anim { animation: mcDetalleIn .32s cubic-bezier(.2,.8,.3,1); }
        @keyframes mcChevron { from { transform: rotate(0); } to { transform: rotate(180deg); } }
      `}</style>

      {/* cabecera: autor + sello FINAL dorado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px 9px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          {autorNombre && (
            <div onClick={() => autorId && onIrPerfil && onIrPerfil(autorId)} style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, cursor: autorId && onIrPerfil ? 'pointer' : 'default', background: autorFoto ? `url(${autorFoto}) center/cover` : colorEquipo(autorNombre), display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{!autorFoto && autorNombre.slice(0, 1).toUpperCase()}</div>
          )}
          <div style={{ minWidth: 0 }}>
            <div onClick={() => autorId && onIrPerfil && onIrPerfil(autorId)} style={{ fontSize: 12.5, fontWeight: 700, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: autorId && onIrPerfil ? 'pointer' : 'default' }}>{autorNombre || d.nombreJuego || 'Juego'}</div>
            <div style={{ fontSize: 10, color: T.tenue }}>{F.etiqueta}{tiempo ? ` · ${tiempo}` : ''}</div>
          </div>
        </div>
        <span style={{ fontFamily: DISP, fontWeight: 900, fontSize: 14, letterSpacing: 1, color: '#1a1205', background: T.boton, padding: '3px 11px', borderRadius: 6, flexShrink: 0, marginLeft: 8 }}>{hayEmpate ? 'EMPATE' : 'FINAL'}</span>
      </div>

      {/* TITULAR grande con verbo fuerte en oro + gancho */}
      <div style={{ padding: '2px 16px 0' }}>
        <div style={{ fontFamily: DISP, fontWeight: 900, fontSize: esAncho ? 33 : 26, lineHeight: 0.96, textTransform: 'uppercase', color: T.textoFuerte }}>
          {titular.antes} <span style={{ background: T.boton, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{titular.verbo}</span> {titular.despues}
        </div>
        <div style={{ fontSize: esAncho ? 14 : 12.5, color: T.subTexto, marginTop: 5, lineHeight: 1.35 }}>{d.narracion || titular.gancho}</div>
      </div>

      {/* MARCADOR grande: equipo + número a cada lado */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 12px', gap: 12 }}>
        {fila(d.nombreA, totalA, ganoA, d.logoA, false)}
        <div style={{ width: 1, alignSelf: 'stretch', background: T.lineaSuave }} />
        {fila(d.nombreB, totalB, ganoB, d.logoB, true)}
      </div>

      {/* figura del partido */}
      {destNombre && (
        <div style={{ margin: '0 16px 12px', padding: '10px 13px', background: T.esClaro ? '#f5f6f8' : 'rgba(255,255,255,.04)', borderRadius: 11, display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: T.boton, display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>⭐</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: T.acento }}>Figura del partido</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.textoFuerte }}>{destNombre} <span style={{ fontWeight: 600, fontSize: 12.5, color: T.subTexto }}>— {destPts} pts{destReb ? ` · ${destReb} reb` : ''}{destAst ? ` · ${destAst} ast` : ''}</span></div>
          </div>
        </div>
      )}

      {/* comentario de la persona */}
      {comentario && (
        <div style={{ margin: '0 16px 12px', padding: '10px 13px', background: T.esClaro ? '#f5f6f8' : 'rgba(255,255,255,.04)', borderRadius: 11, borderLeft: `3px solid ${T.acento}`, fontSize: 13, fontStyle: 'italic', color: T.subTexto }}>{comentario}</div>
      )}

      {/* detalles expandibles con animación */}
      {abierto && (
        <div className="mc-detalle-anim" style={{ padding: '4px 16px 14px' }}>
          <div style={{ height: 1, background: T.lineaSuave, marginBottom: 14 }} />
          {momentosCard.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: T.acento, marginBottom: 8 }}>🔥 Momentos</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {momentosCard.map((m, i) => (
                  <span key={i} style={{ fontSize: 11.5, fontWeight: 600, color: T.textoBody, background: T.esClaro ? 'rgba(176,122,38,.08)' : 'rgba(232,182,90,.08)', border: `1px solid ${T.esClaro ? 'rgba(176,122,38,.18)' : 'rgba(232,182,90,.16)'}`, borderRadius: 9, padding: '6px 10px' }}>{iconoMom(m.tipo)} {m.etiqueta}</span>
                ))}
              </div>
            </div>
          )}
          {tablaStats(d.nombreA, jugA, ganoA ? T.acento : T.tenue)}
          {tablaStats(d.nombreB, jugB, ganoB ? T.acento : T.tenue)}
        </div>
      )}

      {/* fila de acciones: Detalles + lo que pase el padre */}
      {jugadores.length > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: acciones ? '0 16px 14px' : '0 16px 12px' }}>
          <button onClick={() => setAbierto(!abierto)} style={{ flex: acciones ? 1 : 'none', border: `1px solid ${T.tarjetaBorde}`, borderRadius: 10, padding: '10px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: abierto ? `${T.acento}1a` : (T.esClaro ? '#f5f6f8' : 'rgba(255,255,255,.04)'), color: abierto ? T.acento : T.subTexto, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', fontSize: 10, animation: abierto ? 'mcChevron .3s forwards' : 'none' }}>▼</span>
            {abierto ? 'Ocultar tabla' : 'Tabla'}
          </button>
          {acciones}
        </div>
      )}

      {/* pie (barra de reacciones del Techado, si la pasan) */}
      {pie}
    </div>
  )
}