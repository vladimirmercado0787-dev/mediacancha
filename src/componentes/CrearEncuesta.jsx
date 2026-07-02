// ============================================================================
//  CREAR ENCUESTA — el compositor. 📊
//  Un modal con la pregunta y de dos a seis opciones. Se usa igual desde
//  Publicar (Techado), el chat privado y los grupos: cada pantalla le pasa
//  su propio onCrear(pregunta, opciones) que decide a dónde va la encuesta.
//  onCrear debe devolver true si todo salió bien (para cerrar el modal).
// ============================================================================
import { useState } from 'react'
import { aviso } from './Avisos'

export default function CrearEncuesta({ onCerrar, onCrear }) {
  let tema = 'dorado'
  try { tema = localStorage.getItem('mc_tema') || 'dorado' } catch (e) {}
  const esClaro = tema === 'claro'
  const C = {
    velo: 'rgba(0,0,0,.6)',
    panel: esClaro ? '#ffffff' : '#101318',
    borde: esClaro ? '#e3e6ea' : 'rgba(202,162,74,.35)',
    texto: esClaro ? '#15181d' : '#eceef1',
    tenue: esClaro ? '#5b6270' : '#9aa1ad',
    campo: esClaro ? '#f4f6f8' : 'rgba(255,255,255,.06)',
    acento: '#caa24a',
    acentoTexto: '#15120a',
  }

  const [pregunta, setPregunta] = useState('')
  const [ops, setOps] = useState(['', ''])
  const [creando, setCreando] = useState(false)

  const cambiarOp = (i, v) => setOps((prev) => prev.map((o, k) => (k === i ? v : o)))
  const quitarOp = (i) => setOps((prev) => (prev.length > 2 ? prev.filter((_, k) => k !== i) : prev))
  const agregarOp = () => setOps((prev) => (prev.length < 6 ? [...prev, ''] : prev))

  const crear = async () => {
    if (creando) return
    const preg = pregunta.trim()
    const limpias = ops.map((o) => o.trim()).filter(Boolean)
    if (!preg) { aviso('Escribe la pregunta de la encuesta 📊'); return }
    if (limpias.length < 2) { aviso('La encuesta necesita al menos dos opciones'); return }
    setCreando(true)
    try {
      const ok = await onCrear(preg, limpias)
      if (!ok) setCreando(false)
    } catch (e) {
      aviso('No se pudo crear la encuesta: ' + (e.message || e))
      setCreando(false)
    }
  }

  const campoBase = {
    width: '100%', boxSizing: 'border-box', background: C.campo,
    border: `1px solid ${C.borde}`, borderRadius: 11, padding: '11px 13px',
    color: C.texto, fontSize: 16, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div
      onClick={onCerrar}
      style={{ position: 'fixed', inset: 0, zIndex: 9000, background: C.velo, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'calc(env(safe-area-inset-top) + 18px) 20px 20px', overflowY: 'auto', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 380,  background: C.panel, border: `1.5px solid ${C.borde}`, borderRadius: 18, padding: '20px 18px 16px', boxShadow: '0 18px 50px rgba(0,0,0,.45)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0.8, color: C.acentoTexto, background: C.acento, borderRadius: 6, padding: '3px 8px' }}>📊 NUEVA ENCUESTA</span>
        </div>

        <input
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value.slice(0, 140))}
          placeholder="Escribe la pregunta… (ej: ¿Quién gana esta noche?)"
          type="text"
          style={{ ...campoBase, fontWeight: 700, marginBottom: 12 }}
        />

        <div style={{ fontSize: 11, fontWeight: 800, color: C.tenue, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Opciones</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ops.map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                value={o}
                onChange={(e) => cambiarOp(i, e.target.value.slice(0, 60))}
                placeholder={`Opción ${i + 1}`}
                type="text"
                style={campoBase}
              />
              {ops.length > 2 && (
                <button onClick={() => quitarOp(i)} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.borde}`, background: 'transparent', color: C.tenue, fontSize: 15, cursor: 'pointer', flexShrink: 0 }}>✕</button>
              )}
            </div>
          ))}
        </div>

        {ops.length < 6 && (
          <button onClick={agregarOp} style={{ marginTop: 10, background: 'transparent', border: `1.5px dashed ${C.borde}`, borderRadius: 11, padding: '9px 0', width: '100%', color: C.tenue, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            + Agregar opción
          </button>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onCerrar} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: `1.5px solid ${C.borde}`, background: 'transparent', color: C.tenue, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={crear} disabled={creando} style={{ flex: 1.4, padding: '12px 0', borderRadius: 12, border: 'none', background: C.acento, color: C.acentoTexto, fontWeight: 900, fontSize: 14, cursor: creando ? 'default' : 'pointer', opacity: creando ? 0.65 : 1 }}>
            {creando ? 'Creando…' : 'Crear encuesta'}
          </button>
        </div>
      </div>
    </div>
  )
}