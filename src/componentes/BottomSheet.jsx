import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'

export default function BottomSheet({
  T,
  esEscritorio = false,
  titulo,
  encabezado,
  accionDerecha,
  pie,
  onCerrar,
  maxAncho = 480,
  expandido = false,
  children,
}) {
  const modalFondo = T.fondo || (T.esClaro ? '#f3eee3' : 'linear-gradient(180deg, #14161a, #0c0e12)')
  const lineaModal = T.esClaro ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.07)'
  const modalTexto = T.textoBody
  const modalTenue = T.tenue

  const [offset, setOffset] = useState(esEscritorio ? 0 : 700)
  const [transicionOn, setTransicionOn] = useState(true)
  const [kbAlto, setKbAlto] = useState(0)
  const inicioY = useRef(null)

  const esNativo =
    typeof Capacitor !== 'undefined' &&
    typeof Capacitor.isNativePlatform === 'function' &&
    Capacitor.isNativePlatform()

  // Entrada deslizando hacia arriba
  useEffect(() => {
    const id = requestAnimationFrame(() => setOffset(0))
    return () => cancelAnimationFrame(id)
  }, [])

  // Bloquear el scroll del fondo
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Cerrar con Escape
  useEffect(() => {
    const alPresionar = (e) => { if (e.key === 'Escape') onCerrar && onCerrar() }
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [onCerrar])

  // Teclado fluido: mientras la hoja esté abierta tomamos control manual del
  // teclado (modo None) y subimos la hoja nosotros con una transición suave.
  // Al cerrar, devolvemos el modo Native para el resto de la app.
  useEffect(() => {
    if (!esNativo) return
    let listenerShow = null
    let listenerHide = null
    Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {})
    ;(async () => {
      try {
        listenerShow = await Keyboard.addListener('keyboardWillShow', (info) => {
          setKbAlto((info && info.keyboardHeight) || 0)
        })
        listenerHide = await Keyboard.addListener('keyboardWillHide', () => {
          setKbAlto(0)
        })
      } catch (e) { /* en web no existe, se ignora */ }
    })()
    return () => {
      if (listenerShow && listenerShow.remove) listenerShow.remove()
      if (listenerHide && listenerHide.remove) listenerHide.remove()
      setKbAlto(0)
      Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {})
    }
  }, [esNativo])

  const tocarInicio = (e) => {
    if (esEscritorio) return
    inicioY.current = e.touches[0].clientY
    setTransicionOn(false)
  }
  const tocarMover = (e) => {
    if (esEscritorio || inicioY.current === null) return
    const delta = e.touches[0].clientY - inicioY.current
    if (delta > 0) setOffset(delta)
  }
  const tocarFin = () => {
    if (esEscritorio) return
    setTransicionOn(true)
    if (offset > 110) { onCerrar && onCerrar() }
    else setOffset(0)
    inicioY.current = null
  }

  // "Base oscura": extendemos el fondo de la hoja hacia abajo por detrás del
  // teclado. Subimos la hoja un poco MENOS (kbAlto - baseOscura) y le metemos
  // ese mismo alto de relleno oscuro abajo. Así, si queda un huequito entre el
  // input y el teclado, se rellena de oscuro y se ve uniforme con el teclado.
  const baseOscura = 120
  const maxAlto = esEscritorio
    ? '88dvh'
    : (kbAlto > 0 ? `calc(92dvh - ${kbAlto}px)` : '92dvh')

  // El fondo del input queda en (tope del teclado + ajusteTeclado). Si es
  // POSITIVO, el input se mete DETRÁS del teclado (se corta). Negativo lo sube
  // por encima con un margencito. -8 = el input queda 8px sobre el teclado.
  // Si queda mucho espacio entre input y teclado, súbelo hacia 0; si el input
  // todavía se esconde detrás del teclado, bájalo más (ej. -16).
  const ajusteTeclado = -8
  const liftPadding = esEscritorio
    ? 20
    : (kbAlto > 0 ? Math.max(0, kbAlto - baseOscura - ajusteTeclado) : 0)

  return (
    <div
      onClick={onCerrar}
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        background: T.esClaro ? 'rgba(30,26,18,0.5)' : 'rgba(4,5,7,0.82)',
        backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: esEscritorio ? 'center' : (expandido ? 'stretch' : 'flex-end'),
        justifyContent: 'center',
        paddingTop: (!esEscritorio && expandido) ? '13vh' : (esEscritorio ? 20 : 0),
        paddingLeft: esEscritorio ? 20 : 0,
        paddingRight: esEscritorio ? 20 : 0,
        paddingBottom: liftPadding,
        transition: 'padding-bottom .25s cubic-bezier(.25,.8,.25,1)',
        animation: 'bsFundido .2s ease',
      }}
    >
      <style>{`@keyframes bsFundido{from{opacity:0}to{opacity:1}}`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: maxAncho,
          maxHeight: (!esEscritorio && expandido) ? 'none' : maxAlto,
          height: (esEscritorio && expandido) ? '82dvh' : undefined,
          display: 'flex', flexDirection: 'column',
          borderRadius: esEscritorio ? 20 : '20px 20px 0 0',
          padding: 1.5, background: T.borde, overflow: 'hidden',
          transform: `translateY(${offset}px)`,
          transition: transicionOn
            ? 'transform .3s cubic-bezier(.2,.8,.3,1), max-height .25s cubic-bezier(.25,.8,.25,1)'
            : 'max-height .25s cubic-bezier(.25,.8,.25,1)',
        }}
      >
        <div style={{
          borderRadius: esEscritorio ? 19 : '19px 19px 0 0',
          background: modalFondo, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', flex: 1, minHeight: 0,
        }}>

          <div
            onTouchStart={tocarInicio}
            onTouchMove={tocarMover}
            onTouchEnd={tocarFin}
            style={{ flexShrink: 0, borderBottom: `1px solid ${lineaModal}`, touchAction: 'none' }}
          >
            {!esEscritorio && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
                <div style={{ width: 40, height: 4, borderRadius: 4, background: modalTenue, opacity: 0.4 }} />
              </div>
            )}
            {encabezado ? encabezado : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 14px' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: modalTexto, flex: 1 }}>{titulo}</span>
                {accionDerecha}
                <span onClick={onCerrar} style={{ fontSize: 24, color: modalTenue, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>×</span>
              </div>
            )}
          </div>

          <div style={{
            flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
          }}>
            {children}
          </div>

          {pie && (
            <div style={{
              flexShrink: 0, borderTop: `1px solid ${lineaModal}`,
              paddingBottom: kbAlto > 0 ? baseOscura : 'env(safe-area-inset-bottom)',
              background: T.fondo || (T.esClaro ? 'rgba(255,255,255,.55)' : 'rgba(8,9,12,.55)'),
            }}>
              {pie}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}