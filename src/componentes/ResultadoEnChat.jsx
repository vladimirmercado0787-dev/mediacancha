import { useState } from 'react'

// ============================================================================
//  RESULTADO EN CHAT — Media Cancha
//  Tarjeta de resultado de juego que se despliega DENTRO del chat.
//  Reusa los DATOS del juego (igual que el techado), con diseño propio
//  pensado para la columna angosta del chat.
//
//  Props:
//    datos     — objeto del juego (nombreA, nombreB, logoA, logoB, totalA,
//                totalB, jugadores[], statsActivas, etc.)  (lo que guarda publicarJuego)
//    mio       — true si el mensaje es mío (afecta el borde/cola)
//    onVerJuego— () => {}  abrir el detalle completo (opcional)
//    onFijar   — () => {}  fijar la tarjeta en el chat (opcional)
//    fijado    — bool, si ya está fijada
// ============================================================================

const ORO = '#e8b65a'

export default function ResultadoEnChat({ datos, mio, onVerJuego, onFijar, fijado }) {
  const [abierto, setAbierto] = useState(false)
  if (!datos) return null

  const d = datos
  const nombreA = d.nombreA || 'Equipo A'
  const nombreB = d.nombreB || 'Equipo B'
  const totalA = d.totalA || 0
  const totalB = d.totalB || 0
  const ganaA = totalA > totalB
  const ganaB = totalB > totalA
  const empate = totalA === totalB
  const jugadores = Array.isArray(d.jugadores) ? d.jugadores : []
  const jugA = jugadores.filter((j) => j.equipo === 0 || j.equipo === 'A')
  const jugB = jugadores.filter((j) => j.equipo === 1 || j.equipo === 'B')

  // Figura del partido: el de más puntos
  let figura = null
  jugadores.forEach((j) => { if (!figura || (j.pts || 0) > (figura.pts || 0)) figura = j })

  // Titular dinámico
  const verbo = empate ? 'empató con' : (Math.abs(totalA - totalB) >= 15 ? 'aplastó a' : 'venció a')
  const ganador = empate ? nombreA : (ganaA ? nombreA : nombreB)
  const perdedor = empate ? nombreB : (ganaA ? nombreB : nombreA)

  // ¿Qué stats se llevaron? (para columnas dinámicas)
  const sa = d.statsActivas || {}
  const colStats = [
    { id: 'pts', txt: 'Pts', on: true },
    { id: 'reb', txt: 'Reb', on: sa.reb !== false },
    { id: 'ast', txt: 'Ast', on: sa.ast !== false },
    { id: 'rob', txt: 'Rob', on: !!sa.rob },
    { id: 'tap', txt: 'Tap', on: !!sa.tap },
  ].filter((c) => c.on)

  const Logo = ({ url, color }) => (
    <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: url ? `url(${url}) center/cover` : (color || '#2a2f38'), display: 'grid', placeItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.35)' }} />
  )
  const FotoJug = ({ url }) => (
    <div style={{ width: 22, height: 22, borderRadius: '50%', marginRight: 7, flexShrink: 0, background: url ? `url(${url}) center/cover` : '#2a2f38' }} />
  )

  const filaEquipo = (nombre, total, logo, color, gana, atenuado) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px 10px' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9 }}>
        <Logo url={logo} color={color} />
        <div style={{ fontSize: 13.5, fontWeight: 800, color: atenuado ? '#aeb6c0' : '#f4f7f9' }}>{nombre}</div>
        {gana && <span style={{ fontSize: 11, color: ORO }}>🏆</span>}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: atenuado ? '#8b94a0' : '#f4f7f9', letterSpacing: 1, padding: '0 4px' }}>{total}</div>
    </div>
  )

  const tablaJugadores = (titulo, lista, color) => (
    <div style={{ padding: '2px 14px 10px' }}>
      <div style={{ fontSize: 10, color: '#8b94a0', fontWeight: 800, letterSpacing: 0.4, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />{titulo}
      </div>
      <div style={{ display: 'flex', fontSize: 10, color: '#8b94a0', paddingBottom: 4 }}>
        <span style={{ flex: 1 }} />
        {colStats.map((c) => <span key={c.id} style={{ width: 32, textAlign: 'center' }}>{c.txt}</span>)}
      </div>
      {lista.length === 0 && <div style={{ fontSize: 11.5, color: '#6b7480', padding: '4px 0' }}>Sin datos de jugadores.</div>}
      {lista.map((j, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: 11.5, color: '#eef3f6', padding: '4px 0', borderTop: i ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
          <FotoJug url={j.foto_url} />
          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombre}{j.numero ? ` · ${j.numero}` : ''}</span>
          {colStats.map((c) => <span key={c.id} style={{ width: 32, textAlign: 'center', fontWeight: c.id === 'pts' ? 800 : 400 }}>{j[c.id] || 0}</span>)}
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ background: '#14161a', border: `1px solid ${ORO}66`, borderRadius: mio ? '16px 16px 6px 16px' : '16px 16px 16px 6px', overflow: 'hidden', width: '100%', maxWidth: 300 }}>

      {/* Sello + titular */}
      <div style={{ padding: '12px 14px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: ORO, letterSpacing: 0.5, marginBottom: 6 }}>🏀 RESULTADO{d.tipoJuego ? ` · ${String(d.tipoJuego).toUpperCase()}` : ''}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#f4f7f9', lineHeight: 1.15 }}>{ganador} <span style={{ color: ORO }}>{verbo}</span> {perdedor}</div>
      </div>

      {/* Marcador */}
      {filaEquipo(nombreA, totalA, d.logoUrlA || d.logoA, '#e0563f', ganaA, ganaB)}
      {filaEquipo(nombreB, totalB, d.logoUrlB || d.logoB, '#4a90d0', ganaB, ganaA)}

      {/* Figura del partido */}
      {figura && (
        <div style={{ margin: '0 14px 12px', background: 'rgba(232,182,79,.09)', borderRadius: 11, padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: figura.foto_url ? `url(${figura.foto_url}) center/cover` : '#2a2f38', flexShrink: 0, display: 'grid', placeItems: 'center', color: '#5f6772', fontSize: 18 }}>{!figura.foto_url && '👤'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9.5, color: ORO, fontWeight: 800, letterSpacing: 0.4 }}>🏆 FIGURA DEL PARTIDO</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#f4f7f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{figura.nombre}</div>
            <div style={{ fontSize: 11, color: '#9aa7b2' }}>{figura.pts || 0} pts · {figura.reb || 0} reb · {figura.ast || 0} ast</div>
          </div>
        </div>
      )}

      {/* Estadística desplegada */}
      {abierto && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 6 }}>
          {tablaJugadores(nombreA, jugA, '#e0563f')}
          {tablaJugadores(nombreB, jugB, '#4a90d0')}
        </div>
      )}

      {/* Acciones */}
      {!abierto ? (
        <div onClick={() => setAbierto(true)} style={{ textAlign: 'center', padding: '9px 0', borderTop: '1px solid rgba(255,255,255,.07)', fontSize: 11.5, color: ORO, fontWeight: 800, cursor: 'pointer' }}>
          Ver toda la estadística ⌄
        </div>
      ) : (
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,.07)' }}>
          <div onClick={() => onFijar && onFijar()} style={{ flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 11.5, color: fijado ? ORO : '#aeb6c0', fontWeight: fijado ? 800 : 600, cursor: 'pointer' }}>📌 {fijado ? 'Fijado' : 'Fijar'}</div>
          {onVerJuego && <div onClick={() => onVerJuego()} style={{ flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 11.5, color: '#aeb6c0', cursor: 'pointer', borderLeft: '1px solid rgba(255,255,255,.07)' }}>↗ Ver juego</div>}
          <div onClick={() => setAbierto(false)} style={{ flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 11.5, color: '#aeb6c0', cursor: 'pointer', borderLeft: '1px solid rgba(255,255,255,.07)' }}>⌃ Ocultar</div>
        </div>
      )}
    </div>
  )
}