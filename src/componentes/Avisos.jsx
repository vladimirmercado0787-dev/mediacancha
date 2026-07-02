// ============================================================================
//  AVISOS — el reemplazo elegante de alert() y confirm().
//  Se monta UNA sola vez en main.jsx (<AvisosHost />) y desde cualquier
//  pantalla se llama con una línea, igualito que antes pero bonito:
//
//    import { aviso, confirmar } from './Avisos'
//
//    aviso('Guardado con éxito')                 // antes: alert(...)
//    if (!(await confirmar('¿Borrar esto?'))) return   // antes: confirm(...)
//
//  El aviso respeta el tema activo (dorado/azul/claro/larimar) y usa el
//  dorado de la marca. Si se disparan varios seguidos, salen en fila.
// ============================================================================
import { useEffect, useState } from 'react'

const cola = []
let notificar = null

function emitir(item) {
  cola.push(item)
  if (notificar) notificar()
}

// Reemplazo directo de alert(mensaje). El título es opcional.
export function aviso(mensaje, titulo) {
  emitir({ tipo: 'aviso', mensaje: String(mensaje ?? ''), titulo: titulo || null })
}

// Reemplazo de confirm(mensaje): devuelve una promesa true/false.
// Uso: if (!(await confirmar('¿Seguro?'))) return
export function confirmar(mensaje, opciones = {}) {
  return new Promise((resolver) => {
    emitir({
      tipo: 'confirmar',
      mensaje: String(mensaje ?? ''),
      titulo: opciones.titulo || null,
      textoSi: opciones.textoSi || 'Sí',
      textoNo: opciones.textoNo || 'Cancelar',
      resolver,
    })
  })
}

export default function AvisosHost() {
  const [, setTic] = useState(0)

  useEffect(() => {
    notificar = () => setTic((t) => t + 1)
    if (cola.length) setTic((t) => t + 1)
    return () => { notificar = null }
  }, [])

  const actual = cola[0] || null
  if (!actual) return null

  let tema = 'dorado'
  try { tema = localStorage.getItem('mc_tema') || 'dorado' } catch (e) {}
  const esClaro = tema === 'claro'
  const C = {
    velo: 'rgba(0,0,0,.55)',
    panel: esClaro ? '#ffffff' : '#101318',
    borde: esClaro ? '#e3e6ea' : 'rgba(202,162,74,.35)',
    texto: esClaro ? '#15181d' : '#eceef1',
    secundario: esClaro ? '#5b6270' : '#9aa1ad',
    acento: '#caa24a',
    textoAcento: '#15120a',
  }

  const cerrar = (respuesta) => {
    const a = cola.shift()
    setTic((t) => t + 1)
    if (a && a.resolver) { try { a.resolver(!!respuesta) } catch (e) {} }
  }

  const botonBase = {
    flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit',
  }

  return (
    <div
      onClick={() => { if (actual.tipo === 'aviso') cerrar() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, background: C.velo,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 340, background: C.panel,
          border: `1.5px solid ${C.borde}`, borderRadius: 18,
          padding: '22px 20px 16px', boxShadow: '0 18px 50px rgba(0,0,0,.45)',
          animation: 'mcAvisoEntra .18s ease-out',
        }}
      >
        <div style={{ width: 44, height: 3, borderRadius: 2, background: C.acento, margin: '0 auto 14px' }} />
        {actual.titulo ? (
          <div style={{ color: C.texto, fontWeight: 900, fontSize: 16, textAlign: 'center', marginBottom: 8 }}>
            {actual.titulo}
          </div>
        ) : null}
        <div style={{
          color: actual.titulo ? C.secundario : C.texto, fontSize: 14.5,
          lineHeight: 1.55, textAlign: 'center', whiteSpace: 'pre-wrap',
          fontWeight: actual.titulo ? 500 : 600, wordBreak: 'break-word',
        }}>
          {actual.mensaje}
        </div>
        {actual.tipo === 'confirmar' ? (
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button
              onClick={() => cerrar(false)}
              style={{ ...botonBase, border: `1.5px solid ${C.borde}`, background: 'transparent', color: C.secundario, fontWeight: 800 }}
            >
              {actual.textoNo}
            </button>
            <button
              onClick={() => cerrar(true)}
              style={{ ...botonBase, border: 'none', background: C.acento, color: C.textoAcento, fontWeight: 900 }}
            >
              {actual.textoSi}
            </button>
          </div>
        ) : (
          <button
            onClick={() => cerrar()}
            style={{ ...botonBase, display: 'block', width: '100%', marginTop: 18, border: 'none', background: C.acento, color: C.textoAcento, fontWeight: 900 }}
          >
            Entendido
          </button>
        )}
      </div>
      <style>{'@keyframes mcAvisoEntra { from { transform: scale(.92); opacity: 0 } to { transform: scale(1); opacity: 1 } }'}</style>
    </div>
  )
}
