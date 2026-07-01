// ============================================================================
//  NOTICIA EN CHAT — Media Cancha · NBA
//  Tarjeta de noticia que se despliega DENTRO del chat, con la MARCA de la NBA
//  (paleta Miami negro/vino/oro). Se distingue de la LNB y de los resultados.
//  Trae botón "Leer" que abre la noticia completa en NBAManiacs.
//
//  Props:
//    datos — { tipo:'noticia', titulo, fuente, tiempo, imagen, enlace, tag }
//    mio   — true si el mensaje es mío (afecta la cola de la burbuja)
// ============================================================================

const VINO = '#98002E', ROJO = '#D31B3C', ORO = '#F9A01B', OROLT = '#FFC44D'
const TEXTO = '#F3ECEE', TENUE = '#A1939A'

export default function NoticiaEnChat({ datos, mio }) {
  if (!datos) return null
  const d = datos
  return (
    <div style={{ width: '100%', maxWidth: 300, borderRadius: mio ? '16px 16px 6px 16px' : '16px 16px 16px 6px', overflow: 'hidden', background: 'linear-gradient(165deg, #1a0c12, #0B0709)', border: `1px solid ${ORO}55`, boxShadow: '0 10px 24px rgba(0,0,0,.35)' }}>
      {/* franja tricolor NBA */}
      <div style={{ display: 'flex', height: 4 }}>
        <span style={{ flex: 1, background: VINO }} /><span style={{ flex: 1, background: ROJO }} /><span style={{ flex: 1, background: ORO }} />
      </div>

      {d.imagen && <div style={{ width: '100%', height: 140, background: `#000 url(${d.imagen}) center/cover` }} />}

      <div style={{ padding: '11px 13px 4px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: OROLT, letterSpacing: 1 }}>🏀 NOTICIA · NBA{d.tag ? ` · ${String(d.tag).toUpperCase()}` : ''}</div>
      </div>

      <div style={{ padding: '2px 13px 11px' }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: TEXTO, lineHeight: 1.22, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.titulo || 'Noticia'}</div>
        <div style={{ fontSize: 10, color: TENUE, marginTop: 7 }}>{[d.fuente, d.tiempo].filter(Boolean).join(' · ')}</div>
      </div>

      {d.enlace && (
        <a href={d.enlace} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,.08)', fontSize: 12, fontWeight: 800, color: OROLT, textDecoration: 'none' }}>Leer la noticia ›</a>
      )}
    </div>
  )
}