import { useState, useRef, useEffect } from 'react'

// ============================================================================
//  RECORTADOR DE FOTOS — Media Cancha (componente central reutilizable)
//  Se usa en TODA la app: perfil, equipos, torneos, publicaciones, etc.
//  NO deforma: la imagen siempre mantiene su proporción real.
//  El usuario elige la FORMA: cuadrada, original, vertical, horizontal.
//
//  Props:
//    archivo    — el File/Blob que el usuario eligió
//    forma      — forma inicial: 'cuadrado'(def) | 'circulo' | 'ancho' | 'vertical' | 'original'
//    elegirForma— true para mostrar el selector de formas (def: depende)
//    tema       — objeto de tema (acento, boton, etc.) opcional
//    onListo    — (blob) => {}  recibe el recorte como Blob JPEG
//    onCancelar — () => {}
// ============================================================================

const TEMAS = {
  dorado: { acento: '#e8b65a', boton: 'linear-gradient(150deg,#f3cf63,#c8842e)', botonTexto: '#1a1205', panel: 'rgba(12,14,18,.98)', texto: '#f4f7f9', tenue: '#9aa7b2' },
}

// Relación de aspecto (ancho/alto) de cada forma
const RELACION = {
  cuadrado: 1,
  circulo: 1,
  vertical: 3 / 4,     // más alta que ancha (tipo retrato)
  ancho: 16 / 9,       // horizontal
  horizontal: 4 / 3,   // horizontal suave
}

export default function RecortadorFoto({ archivo, forma = 'cuadrado', elegirForma, tema, onListo, onCancelar }) {
  const T = tema || TEMAS.dorado
  const [imgUrl, setImgUrl] = useState(null)
  const [natural, setNatural] = useState(null)   // { w, h } tamaño real
  const [escala, setEscala] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [procesando, setProcesando] = useState(false)
  const [formaSel, setFormaSel] = useState(forma === 'circulo' ? 'circulo' : forma)

  const arrastrando = useRef(false)
  const inicio = useRef({ x: 0, y: 0 })
  const posInicio = useRef({ x: 0, y: 0 })
  const pinchInicio = useRef(null)

  const esCirculo = formaSel === 'circulo'
  const esOriginal = formaSel === 'original'
  // El círculo se trata como cuadrado para el marco; "original" usa la proporción real de la foto
  const mostrarSelector = elegirForma !== undefined ? elegirForma : !esCirculo

  // Lado base del marco
  const ladoMarco = 280
  // Relación del marco según la forma elegida
  let relacion = RELACION[formaSel] || 1
  if (esOriginal && natural) relacion = natural.w / natural.h

  // Dimensiones del marco (ancho fijo, alto según relación; con tope para que no se salga)
  let anchoMarco = ladoMarco
  let altoMarco = Math.round(ladoMarco / relacion)
  const altoMax = 360
  if (altoMarco > altoMax) { altoMarco = altoMax; anchoMarco = Math.round(altoMax * relacion) }

  // Cargar la imagen y leer su tamaño real
  useEffect(() => {
    if (!archivo) return
    const url = URL.createObjectURL(archivo)
    setImgUrl(url)
    const im = new Image()
    im.onload = () => setNatural({ w: im.naturalWidth, h: im.naturalHeight })
    im.src = url
    return () => URL.revokeObjectURL(url)
  }, [archivo])

  // Al cambiar de forma, reiniciar zoom y posición
  useEffect(() => { setEscala(1); setPos({ x: 0, y: 0 }) }, [formaSel])

  // Tamaño base: la imagen "cubre" el marco manteniendo proporción (sin deformar)
  let baseW = anchoMarco, baseH = altoMarco
  if (natural) {
    const escalaCubrir = Math.max(anchoMarco / natural.w, altoMarco / natural.h)
    baseW = natural.w * escalaCubrir
    baseH = natural.h * escalaCubrir
  }
  const mostrW = baseW * escala
  const mostrH = baseH * escala

  // ---- Arrastre (mouse + touch) ----
  const onDown = (e) => {
    arrastrando.current = true
    const p = e.touches ? e.touches[0] : e
    inicio.current = { x: p.clientX, y: p.clientY }
    posInicio.current = { ...pos }
  }
  const onMove = (e) => {
    if (e.touches && e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
      if (pinchInicio.current == null) { pinchInicio.current = { d, escala } }
      else {
        const factor = d / pinchInicio.current.d
        setEscala(Math.min(4, Math.max(1, pinchInicio.current.escala * factor)))
      }
      return
    }
    if (!arrastrando.current) return
    const p = e.touches ? e.touches[0] : e
    setPos({ x: posInicio.current.x + (p.clientX - inicio.current.x), y: posInicio.current.y + (p.clientY - inicio.current.y) })
  }
  const onUp = () => { arrastrando.current = false; pinchInicio.current = null }

  useEffect(() => {
    const up = () => onUp()
    window.addEventListener('mouseup', up)
    window.addEventListener('touchend', up)
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('touchend', up) }
  }, [])

  // ---- Recortar con canvas (cálculo matemático, sin getBoundingClientRect) ----
  const recortar = async () => {
    if (!natural || !imgUrl) return
    setProcesando(true)
    try {
      const im = new Image()
      im.src = imgUrl
      await new Promise((res) => { if (im.complete) res(); else im.onload = res })

      // Salida en píxeles (mantiene la proporción del marco)
      const baseSalida = 800
      const salidaW = relacion >= 1 ? baseSalida : Math.round(baseSalida * relacion)
      const salidaH = relacion >= 1 ? Math.round(baseSalida / relacion) : baseSalida
      const canvas = document.createElement('canvas')
      canvas.width = salidaW
      canvas.height = salidaH
      const ctx = canvas.getContext('2d')

      // Cuántos px reales de imagen = 1 px de pantalla
      const realPorPantalla = natural.w / mostrW

      // Esquina sup-izq del marco respecto al centro de la imagen mostrada (px pantalla)
      const marcoLeftDesdeCentro = -anchoMarco / 2 - pos.x
      const marcoTopDesdeCentro = -altoMarco / 2 - pos.y

      // Convertir a px reales (el centro de la imagen real es natural.w/2, natural.h/2)
      const sx = natural.w / 2 + marcoLeftDesdeCentro * realPorPantalla
      const sy = natural.h / 2 + marcoTopDesdeCentro * realPorPantalla
      const sw = anchoMarco * realPorPantalla
      const sh = altoMarco * realPorPantalla

      ctx.drawImage(im, sx, sy, sw, sh, 0, 0, salidaW, salidaH)

      canvas.toBlob((blob) => {
        setProcesando(false)
        if (blob) onListo && onListo(blob)
      }, 'image/jpeg', 0.92)
    } catch (e) {
      setProcesando(false)
      alert('No se pudo recortar: ' + (e.message || e))
    }
  }

  const FORMAS = [
    { id: 'cuadrado', txt: 'Cuadrada', icono: '⬛' },
    { id: 'original', txt: 'Original', icono: '🖼️' },
    { id: 'vertical', txt: 'Vertical', icono: '📱' },
    { id: 'horizontal', txt: 'Horizontal', icono: '🖥️' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(4,5,7,.94)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ color: T.texto, fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Ajusta tu foto</div>
      <div style={{ color: T.tenue, fontSize: 12.5, marginBottom: 16, textAlign: 'center' }}>Arrastra para mover · pellizca o usa la barra para acercar</div>

      {/* Selector de FORMA */}
      {mostrarSelector && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {FORMAS.map((f) => {
            const activa = formaSel === f.id
            return (
              <button key={f.id} onClick={() => setFormaSel(f.id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                border: activa ? `1.5px solid ${T.acento}` : '1px solid rgba(255,255,255,.18)',
                background: activa ? 'rgba(232,182,79,.16)' : 'rgba(255,255,255,.05)',
                color: activa ? T.acento : T.tenue, borderRadius: 11, padding: '8px 12px',
                fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 14 }}>{f.icono}</span>{f.txt}
              </button>
            )
          })}
        </div>
      )}

      {/* Zona de recorte */}
      <div
        onMouseDown={onDown} onMouseMove={onMove}
        onTouchStart={onDown} onTouchMove={onMove}
        style={{ position: 'relative', width: anchoMarco, height: altoMarco, overflow: 'hidden', borderRadius: esCirculo ? '50%' : 16, touchAction: 'none', cursor: 'grab', background: '#000', boxShadow: '0 0 0 2px rgba(232,182,79,.6), 0 0 0 9999px rgba(4,5,7,.72)' }}
      >
        {imgUrl && natural && (
          <img
            src={imgUrl} alt="recortar" draggable={false}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              width: mostrW, height: mostrH,
              transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`,
              maxWidth: 'none', userSelect: 'none', pointerEvents: 'none', display: 'block',
            }}
          />
        )}
      </div>

      {/* Zoom: botones grandes + slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: Math.max(anchoMarco, 220), marginTop: 20 }}>
        <button onClick={() => setEscala((s) => Math.max(1, Math.round((s - 0.3) * 100) / 100))} style={{ width: 46, height: 46, borderRadius: 12, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)', color: T.acento, fontSize: 24, fontWeight: 700, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
        <input type="range" min="1" max="4" step="0.01" value={escala} onChange={(e) => setEscala(parseFloat(e.target.value))} style={{ flex: 1, accentColor: T.acento, height: 30 }} />
        <button onClick={() => setEscala((s) => Math.min(4, Math.round((s + 0.3) * 100) / 100))} style={{ width: 46, height: 46, borderRadius: 12, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)', color: T.acento, fontSize: 24, fontWeight: 700, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 10, marginTop: 22, width: Math.max(anchoMarco, 220) }}>
        <button onClick={() => onCancelar && onCancelar()} style={{ flex: 1, border: '1px solid rgba(255,255,255,.18)', borderRadius: 13, padding: 14, background: 'transparent', color: T.tenue, fontSize: 14.5, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
        <button onClick={recortar} disabled={procesando || !natural} style={{ flex: 1.4, border: 'none', borderRadius: 13, padding: 14, background: T.boton, color: T.botonTexto, fontSize: 14.5, fontWeight: 800, cursor: 'pointer', opacity: (procesando || !natural) ? 0.6 : 1 }}>{procesando ? 'Recortando…' : 'Listo ✓'}</button>
      </div>
    </div>
  )
}