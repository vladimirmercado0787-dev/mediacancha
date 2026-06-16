import { useState } from 'react'
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

export default function TarjetaResultado({ datos, fuente = 'rapido', tiempo, autorNombre, autorFoto, comentario, acciones, pie, temaForzado }) {
  const [abierto, setAbierto] = useState(false)
  const tema = temaForzado || (typeof window !== 'undefined' ? (localStorage.getItem('mc_tema') || 'dorado') : 'dorado')
  const T = TEMAS_CARD[tema] || TEMAS_CARD.dorado
  const F = FUENTES[fuente] || FUENTES.rapido

  const d = datos || {}
  const jugadores = d.jugadores || []
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
  const jugA = jugadores.filter((x) => x.equipo === 0)
  const jugB = jugadores.filter((x) => x.equipo === 1)

  const escudo = (nombre, gano, logoId) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, textAlign: 'center', flex: 1, minWidth: 0 }}>
      <div style={{ width: 56, height: 56, borderRadius: 15, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 22, fontFamily: 'ui-monospace, monospace', background: logoId ? (T.esClaro ? '#f5f6f8' : 'rgba(255,255,255,.04)') : colorEquipo(nombre), position: 'relative', boxShadow: '0 6px 16px rgba(20,24,30,.2)', overflow: 'hidden' }}>
        {gano && <span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 16, zIndex: 2 }}>{F.icono}</span>}
        {logoId ? <LogoEquipo id={logoId} size={52} /> : (nombre || '?').slice(0, 1).toUpperCase()}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: gano ? T.acento : T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{nombre}</div>
    </div>
  )

  const tablaStats = (titulo, lista, color) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color, marginBottom: 6 }}>{titulo}</div>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.lineaSuave}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 38px 38px 38px', padding: '7px 12px', background: T.esClaro ? '#f5f6f8' : 'rgba(255,255,255,.04)', fontSize: 10, fontWeight: 700, color: T.tenue, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          <span>Jugador</span><span style={{ textAlign: 'center' }}>PTS</span><span style={{ textAlign: 'center' }}>REB</span><span style={{ textAlign: 'center' }}>AST</span>
        </div>
        {lista.length === 0 ? (
          <div style={{ padding: '10px 12px', fontSize: 12, color: T.tenue }}>Sin datos de jugadores.</div>
        ) : lista.map((x, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 38px 38px 38px', padding: '8px 12px', borderTop: `1px solid ${T.lineaSuave}`, fontSize: 12.5, color: T.textoBody, alignItems: 'center' }}>
            <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.nombre || ('#' + (x.numero || '?'))}</span>
            <span style={{ textAlign: 'center', fontWeight: 800, color: T.acento }}>{x.pts || 0}</span>
            <span style={{ textAlign: 'center' }}>{x.reb || 0}</span>
            <span style={{ textAlign: 'center' }}>{x.ast || 0}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderLeft: `4px solid ${F.color}`, borderRadius: 16, boxShadow: T.tarjetaSombra, overflow: 'hidden' }}>
      <style>{`
        @keyframes mcDetalleIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .mc-detalle-anim { animation: mcDetalleIn .32s cubic-bezier(.2,.8,.3,1); }
        @keyframes mcChevron { from { transform: rotate(0); } to { transform: rotate(180deg); } }
      `}</style>

      {/* cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: `1px solid ${T.lineaSuave}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          {autorNombre && (
            <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: autorFoto ? `url(${autorFoto}) center/cover` : colorEquipo(autorNombre), display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{!autorFoto && autorNombre.slice(0, 1).toUpperCase()}</div>
          )}
          <span style={{ fontSize: 12.5, fontWeight: 700, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{autorNombre || d.nombreJuego || 'Juego'}</span>
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20, color: F.color, background: T.esClaro ? F.colorClaro : `${F.color}26`, flexShrink: 0, marginLeft: 8 }}>{F.etiqueta}{tiempo ? ` · ${tiempo}` : ''}</span>
      </div>

      {/* nota inteligente */}
      {nota && (
        <div style={{ padding: '13px 16px 2px', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🏀</span>
          <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: T.textoBody }}>{nota}</span>
        </div>
      )}

      {/* matchup */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 8 }}>
        {escudo(d.nombreA, ganoA, d.logoA)}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 92 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: 36, fontFamily: 'ui-monospace, monospace', lineHeight: 1 }}>
            <span style={{ color: ganoA ? T.acento : T.textoFuerte }}>{totalA}</span>
            <span style={{ fontSize: 15, color: T.tenue, fontWeight: 400 }}>–</span>
            <span style={{ color: ganoB ? T.acento : T.textoFuerte }}>{totalB}</span>
          </div>
          <div style={{ fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: T.tenue, marginTop: 4 }}>{hayEmpate ? 'Empate' : 'Final'}</div>
        </div>
        {escudo(d.nombreB, ganoB, d.logoB)}
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
          {tablaStats(d.nombreA, jugA, ganoA ? T.acento : T.tenue)}
          {tablaStats(d.nombreB, jugB, ganoB ? T.acento : T.tenue)}
        </div>
      )}

      {/* fila de acciones: Detalles + lo que pase el padre */}
      {jugadores.length > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: acciones ? '0 16px 14px' : '0 16px 12px' }}>
          <button onClick={() => setAbierto(!abierto)} style={{ flex: acciones ? 1 : 'none', border: `1px solid ${T.tarjetaBorde}`, borderRadius: 10, padding: '10px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: abierto ? `${T.acento}1a` : (T.esClaro ? '#f5f6f8' : 'rgba(255,255,255,.04)'), color: abierto ? T.acento : T.subTexto, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', fontSize: 10, animation: abierto ? 'mcChevron .3s forwards' : 'none' }}>▼</span>
            {abierto ? 'Ocultar detalles' : 'Detalles'}
          </button>
          {acciones}
        </div>
      )}

      {/* pie (barra de reacciones del Techado, si la pasan) */}
      {pie}
    </div>
  )
}