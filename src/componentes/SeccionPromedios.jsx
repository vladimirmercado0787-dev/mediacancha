import { useState, useEffect } from 'react'
import { promediosPorModo } from '../estadisticas'

// Etiqueta corta de cada estadística secundaria (además de puntos).
const ETIQ = { reb: 'reb', ast: 'ast', rob: 'rob', tap: 'tap', tl: 'tl', per: 'per' }
const ORDEN_SEC = ['reb', 'ast', 'rob', 'tap', 'tl', 'per']

// Sección "Promedios por modo" para el perfil (propio y ajeno).
// Lee la libreta de récords y muestra, por cada modo jugado: % que gana,
// juegos, promedio de puntos, y las demás stats SOLO donde se midieron.
export default function SeccionPromedios({ perfilId, T }) {
  const [modos, setModos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    if (!perfilId) { setCargando(false); return }
    promediosPorModo(perfilId)
      .then((lista) => { if (vivo) { setModos(lista || []); setCargando(false) } })
      .catch(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [perfilId])

  // Redondea a un decimal y quita el ".0" (18.0 -> 18, 18.53 -> 18.5)
  const fmt = (v) => (v == null ? null : String(Math.round(v * 10) / 10))

  if (cargando) return null
  if (!modos.length) return null   // si no tiene juegos registrados, la sección no aparece

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.textoFuerte, marginBottom: 12 }}>Promedios por modo</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
        {modos.map((m) => {
          const otras = ORDEN_SEC.filter((s) => m[s] != null).map((s) => `${fmt(m[s])} ${ETIQ[s]}`)
          return (
            <div key={m.formato} style={{ background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 14, padding: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: T.textoFuerte }}>{m.formato}</span>
                <span style={{ fontSize: 11, color: T.tenue }}>{m.juegos} {m.juegos === 1 ? 'juego' : 'juegos'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: 25, fontWeight: 800, color: T.acento }}>{fmt(m.pts)}</span>
                <span style={{ fontSize: 12, color: T.textoBody }}>pts</span>
              </div>

              <div style={{ fontSize: 11.5, color: T.tenue, marginTop: 6, lineHeight: 1.45 }}>
                <span style={{ color: T.acento, fontWeight: 800 }}>{m.winPct}%</span> ganados
                {otras.length ? <><br />{otras.join(' · ')}</> : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}