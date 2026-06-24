import { useState } from 'react'

// ============================================================================
//  FICHA EN CHAT — Media Cancha · NBA
//  Tarjeta de jugador (ficha) que se despliega DENTRO del chat, con la MARCA
//  de la NBA (paleta Miami negro/vino/oro) para que se distinga claramente de
//  los resultados de la LNB. No comparte estilos con la tarjeta de la LNB.
//
//  Props:
//    datos — { tipo:'ficha', nombre, equipo, pos, rating, pts, reb, ast,
//              rob, tap, fgPct, tpPct, ftPct, temporada }
//    mio   — true si el mensaje es mío (afecta la cola de la burbuja)
// ============================================================================

const VINO = '#98002E', ROJO = '#D31B3C', ORO = '#F9A01B', OROLT = '#FFC44D'
const TEXTO = '#F3ECEE', TENUE = '#A1939A'

function iniciales(nombre) {
  const p = (nombre || '').trim().split(/\s+/)
  if (!p.length || !p[0]) return '?'
  if (p.length === 1) return p[0].slice(0, 3).toUpperCase()
  return (p[0][0] + p[p.length - 1].slice(0, 2)).toUpperCase()
}

export default function FichaEnChat({ datos, mio }) {
  if (!datos) return null
  const d = datos
  const f1 = (v) => (v == null || v === '' ? '—' : Number(v).toFixed(1))
  const pc = (v) => (v == null || v === '' ? '—' : Number(v).toFixed(1) + '%')

  const Stat = ({ lbl, val }) => (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 16, fontWeight: 800, color: TEXTO }}>{val}</div>
      <div style={{ fontSize: 8, fontWeight: 800, color: TENUE, letterSpacing: 0.5, marginTop: 2 }}>{lbl}</div>
    </div>
  )

  return (
    <div style={{ width: '100%', maxWidth: 300, borderRadius: mio ? '16px 16px 6px 16px' : '16px 16px 16px 6px', overflow: 'hidden', background: 'linear-gradient(165deg, #1a0c12, #0B0709)', border: `1px solid ${ORO}55`, boxShadow: '0 10px 24px rgba(0,0,0,.35)' }}>
      {/* franja tricolor NBA */}
      <div style={{ display: 'flex', height: 4 }}>
        <span style={{ flex: 1, background: VINO }} /><span style={{ flex: 1, background: ROJO }} /><span style={{ flex: 1, background: ORO }} />
      </div>

      <div style={{ padding: '11px 13px 4px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: OROLT, letterSpacing: 1 }}>🏀 FICHA · NBA</div>
      </div>

      {/* cabecera del jugador */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 13px 10px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: `linear-gradient(150deg, ${VINO}, #2a0c16)`, display: 'grid', placeItems: 'center', fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: 15, color: '#fff' }}>{iniciales(d.nombre)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: TEXTO, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.nombre || '—'}</div>
          <div style={{ fontSize: 11, color: TENUE, marginTop: 2 }}>{[d.equipo, d.pos].filter(Boolean).join(' · ') || '—'}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: 26, color: OROLT, lineHeight: 1 }}>{d.rating != null ? d.rating : '—'}</div>
          <div style={{ fontSize: 8, fontWeight: 800, color: TENUE, letterSpacing: 1, marginTop: 1 }}>ADN MC</div>
        </div>
      </div>

      {/* promedios */}
      <div style={{ display: 'flex', padding: '8px 6px', margin: '0 10px', background: 'rgba(255,255,255,.045)', borderRadius: 11 }}>
        <Stat lbl="PTS" val={f1(d.pts)} />
        <Stat lbl="REB" val={f1(d.reb)} />
        <Stat lbl="AST" val={f1(d.ast)} />
        <Stat lbl="ROB" val={f1(d.rob)} />
        <Stat lbl="TAP" val={f1(d.tap)} />
      </div>

      {/* porcentajes */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 13, padding: '9px 13px 4px', fontSize: 10.5, color: '#D8CDD2' }}>
        <span>%Campo <b style={{ color: TEXTO }}>{pc(d.fgPct)}</b></span>
        <span>%Triple <b style={{ color: TEXTO }}>{pc(d.tpPct)}</b></span>
        <span>%Libre <b style={{ color: TEXTO }}>{pc(d.ftPct)}</b></span>
      </div>

      <div style={{ textAlign: 'center', padding: '6px 0 10px', fontSize: 9, color: '#6E5F66', letterSpacing: 0.3 }}>{d.temporada ? `Temporada ${d.temporada} · ` : ''}vía Media Cancha</div>
    </div>
  )
}