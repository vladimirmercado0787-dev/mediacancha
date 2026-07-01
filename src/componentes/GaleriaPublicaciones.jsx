import { useState } from 'react'
import { haceCuanto } from '../techado'
import TarjetaResultado from './TarjetaResultado'

// --- helpers para leer una publicación ---
function parseDatos(p) {
  let d = p.datos || {}
  if (typeof d === 'string') { try { d = JSON.parse(d) } catch (e) { d = {} } }
  return d
}
function fotosDe(datos, p) {
  const foto = datos.imagen || p.imagen_url || null
  return (Array.isArray(datos.imagenes) && datos.imagenes.length) ? datos.imagenes : (foto ? [foto] : [])
}
function esJuegoDe(datos) {
  return !!(datos && datos.nombreA && datos.nombreB && (datos.totalA != null || (datos.jugadores && datos.jugadores.length)))
}

// Galería tipo Instagram: cuadritos en cuadrícula. Al tocar uno, se abre la
// publicación completa. Compartida por el perfil propio y el ajeno.
export default function GaleriaPublicaciones({ publicaciones = [], T, tema, esMio = false }) {
  const [ver, setVer] = useState(null)

  if (!publicaciones.length) {
    return (
      <div style={{ textAlign: 'center', padding: '34px 20px', color: T.tenue, background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 16 }}>
        <div style={{ fontSize: 30, marginBottom: 10 }}>🏀</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{esMio ? 'Todavía no has publicado nada.' : 'Todavía no ha publicado nada.'}</div>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
        {publicaciones.map((p) => {
          const datos = parseDatos(p)
          const fotos = fotosDe(datos, p)
          const juego = esJuegoDe(datos)
          return (
            <div key={p.id} onClick={() => setVer(p)}
              style={{ position: 'relative', paddingTop: '100%', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}` }}>
              {fotos.length ? (
                <>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${fotos[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  {fotos.length > 1 && <span style={{ position: 'absolute', top: 5, right: 6, color: '#fff', fontSize: 12, textShadow: '0 1px 4px rgba(0,0,0,.8)' }}>▦</span>}
                </>
              ) : juego ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
                  <span style={{ fontSize: 15 }}>🏀</span>
                  <span style={{ fontSize: 17, fontWeight: 800, color: T.textoFuerte, marginTop: 2 }}>{datos.totalA}–{datos.totalB}</span>
                  <span style={{ fontSize: 9, color: T.tenue, marginTop: 2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{datos.nombreA} vs {datos.nombreB}</span>
                </div>
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                  <span style={{ fontSize: 11.5, color: T.textoBody, lineHeight: 1.4, textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.texto || p.titulo || '—'}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {ver && (() => {
        const datos = parseDatos(ver)
        const fotos = fotosDe(datos, ver)
        const juego = esJuegoDe(datos)
        const fuente = datos.fuente || (ver.tipo === 'torneo' ? 'torneo' : ver.tipo === 'liga' ? 'liga' : 'rapido')
        return (
          <div onClick={() => setVer(null)} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
            <button onClick={() => setVer(null)} style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 22, cursor: 'pointer', zIndex: 2 }}>×</button>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, margin: 'auto' }}>
              {juego ? (
                <TarjetaResultado datos={datos} fuente={fuente} tiempo={haceCuanto(ver.creado_en)} comentario={ver.texto && !ver.texto.startsWith('Ganaron') && !ver.texto.startsWith('Quedaron') ? ver.texto.split('\n')[0] : null} temaForzado={tema} />
              ) : (
                <div style={{ background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 16, overflow: 'hidden' }}>
                  {fotos.map((src, i) => <img key={i} src={src} alt="" style={{ width: '100%', display: 'block' }} />)}
                  <div style={{ padding: 16 }}>
                    {ver.titulo && <div style={{ fontSize: 16, fontWeight: 800, color: T.textoFuerte, marginBottom: 6 }}>{ver.titulo}</div>}
                    {ver.texto && <div style={{ fontSize: 14, color: T.textoBody, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{ver.texto}</div>}
                    <div style={{ fontSize: 11, color: T.tenue, marginTop: 8 }}>{haceCuanto(ver.creado_en)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </>
  )
}