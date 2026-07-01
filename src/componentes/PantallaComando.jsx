import { useState, useEffect } from 'react'
import { cargarMetricas, crecimientoUsuarios, usuariosPorProvincia, demografia } from '../comando'

const C = {
  bg: '#0e0f12', card: '#16181d', card2: '#1c1f26',
  borde: 'rgba(255,255,255,.08)', oro: '#e8b65a',
  txt: '#f4f7f9', body: '#c3cad3', tenue: '#828a95',
}

function KPI({ etiqueta, valor, sub, destacado }) {
  return (
    <div style={{ background: destacado ? `linear-gradient(160deg, ${C.card2}, ${C.card})` : C.card, border: `1px solid ${destacado ? 'rgba(232,182,90,.35)' : C.borde}`, borderRadius: 16, padding: '16px 15px' }}>
      <div style={{ fontSize: 11.5, color: C.tenue, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>{etiqueta}</div>
      <div style={{ fontSize: destacado ? 38 : 28, fontWeight: 800, color: destacado ? C.oro : C.txt, lineHeight: 1.05, marginTop: 6 }}>
        {valor == null ? '—' : valor}
      </div>
      {sub ? <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 4 }}>{sub}</div> : null}
    </div>
  )
}

function Barras({ items }) {
  const max = Math.max(1, ...items.map((i) => i.n))
  const total = items.reduce((a, i) => a + i.n, 0)
  return (
    <div>
      {items.map((it) => (
        <div key={it.etiqueta} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
            <span style={{ color: C.txt, fontWeight: 600 }}>{it.etiqueta}</span>
            <span style={{ color: C.tenue }}>{it.n}{total ? ` · ${Math.round((it.n / total) * 100)}%` : ''}</span>
          </div>
          <div style={{ height: 7, background: 'rgba(255,255,255,.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(it.n / max) * 100}%`, background: C.oro, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PantallaComando({ onVolver }) {
  const [m, setM] = useState(null)
  const [crec, setCrec] = useState([])
  const [prov, setProv] = useState([])
  const [demo, setDemo] = useState({ sexo: [], edad: [], pais: [] })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    Promise.all([cargarMetricas(), crecimientoUsuarios(14), usuariosPorProvincia(), demografia()])
      .then(([met, cr, pr, dm]) => { if (!vivo) return; setM(met); setCrec(cr || []); setProv(pr || []); setDemo(dm || { sexo: [], edad: [], pais: [] }) })
      .catch(() => {})
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [])

  const maxCrec = Math.max(1, ...crec.map((d) => d.n))

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.txt }}>
      {/* Barra superior */}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(14,15,18,.92)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${C.borde}`, padding: 'calc(env(safe-area-inset-top) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onVolver} style={{ background: 'none', border: 'none', color: C.txt, fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.3 }}>Panel del Fundador</div>
          <div style={{ fontSize: 11, color: C.tenue }}>Solo tú ves esto · Media Cancha</div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px calc(env(safe-area-inset-bottom) + 40px)' }}>
        {cargando ? (
          <div style={{ textAlign: 'center', color: C.tenue, padding: 50, fontSize: 14 }}>Cargando métricas…</div>
        ) : (
          <>
            {/* CRECIMIENTO */}
            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.oro, textTransform: 'uppercase', letterSpacing: 1, margin: '4px 0 12px' }}>Crecimiento</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 10 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <KPI etiqueta="Usuarios registrados" valor={m?.usuarios} sub="total en la app" destacado />
              </div>
              <KPI etiqueta="Nuevos hoy" valor={m?.usuHoy} />
              <KPI etiqueta="Esta semana" valor={m?.usu7} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <KPI etiqueta="Este mes" valor={m?.usu30} sub="últimos 30 días" />
            </div>

            {/* GRÁFICO de registros por día */}
            {crec.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 16, padding: 16, marginBottom: 22 }}>
                <div style={{ fontSize: 12.5, color: C.body, fontWeight: 700, marginBottom: 12 }}>Registros por día (14 días)</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90 }}>
                  {crec.map((d) => (
                    <div key={d.dia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }} title={`${d.dia}: ${d.n}`}>
                      <div style={{ fontSize: 9, color: C.tenue, marginBottom: 3 }}>{d.n || ''}</div>
                      <div style={{ width: '100%', maxWidth: 22, height: `${Math.max(3, (d.n / maxCrec) * 70)}px`, background: d.n ? C.oro : 'rgba(255,255,255,.08)', borderRadius: 4 }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIVIDAD */}
            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.oro, textTransform: 'uppercase', letterSpacing: 1, margin: '4px 0 12px' }}>Actividad y contenido</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 22 }}>
              <KPI etiqueta="Juegos jugados" valor={m?.juegos} sub="liga + torneo" />
              <KPI etiqueta="Publicaciones" valor={m?.publicaciones} />
              <KPI etiqueta="Torneos" valor={m?.torneos} />
              <KPI etiqueta="Ligas" valor={m?.ligas} />
              <KPI etiqueta="Fotos/videos de torneo" valor={m?.album} />
            </div>

            {/* DEMOGRAFÍA */}
            {(demo.sexo.length > 0 || demo.edad.length > 0 || demo.pais.length > 0) && (
              <>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: C.oro, textTransform: 'uppercase', letterSpacing: 1, margin: '4px 0 12px' }}>¿Quién se registra?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                  {demo.sexo.length > 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 16, padding: 16 }}>
                      <div style={{ fontSize: 12.5, color: C.body, fontWeight: 700, marginBottom: 12 }}>Sexo</div>
                      <Barras items={demo.sexo} />
                    </div>
                  )}
                  {demo.edad.length > 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 16, padding: 16 }}>
                      <div style={{ fontSize: 12.5, color: C.body, fontWeight: 700, marginBottom: 12 }}>Edad</div>
                      <Barras items={demo.edad} />
                    </div>
                  )}
                  {demo.pais.length > 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 16, padding: 16 }}>
                      <div style={{ fontSize: 12.5, color: C.body, fontWeight: 700, marginBottom: 12 }}>País</div>
                      <Barras items={demo.pais} />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* GEOGRAFÍA */}
            {prov.length > 0 && (
              <>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: C.oro, textTransform: 'uppercase', letterSpacing: 1, margin: '4px 0 12px' }}>¿Dónde está pegando?</div>
                <div style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 16, padding: 16 }}>
                  <Barras items={prov.slice(0, 10).map((p) => ({ etiqueta: p.provincia, n: p.n }))} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}