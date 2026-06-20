import { useState, useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'
import plAroAtardecer from '../assets/plantillas/plantilla_aro_atardecer.png'
import plBalonDorado from '../assets/plantillas/plantilla_balon_dorado.png'
import plCanchaBarrioNoche from '../assets/plantillas/plantilla_cancha_barrio_noche.png'
import plCanchaMadera from '../assets/plantillas/plantilla_cancha_madera.png'
import plMonumentoSantiago from '../assets/plantillas/plantilla_monumento_santiago.png'

const TEMAS = {
  dorado: { esClaro: false, acento: '#e8b65a', fondo: '#08090c', panel: 'rgba(18,20,25,.96)', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', botonTexto: '#1a1205', avatar: 'linear-gradient(150deg, #e0b057, #9a6420)', avatarTexto: '#241a07', glow: 'rgba(190,135,55,0.22)', borde: 'rgba(234,182,79,.2)' },
  azul: { esClaro: false, acento: '#6fb0ec', fondo: '#08090c', panel: 'rgba(18,20,25,.96)', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', botonTexto: '#08151f', avatar: 'linear-gradient(150deg, #5aa0e0, #1d4a80)', avatarTexto: '#08151f', glow: 'rgba(55,120,190,0.24)', borde: 'rgba(111,176,236,.22)' },
  claro: { esClaro: true, acento: '#b07a26', fondo: '#ece4d4', panel: 'rgba(250,246,238,.98)', textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#8a7c64', boton: 'linear-gradient(150deg, #e7c069, #b07a26)', botonTexto: '#2a1d06', avatar: 'linear-gradient(150deg, #e7c069, #a9741f)', avatarTexto: '#3a2806', glow: 'rgba(176,122,38,0.16)', borde: 'rgba(176,122,38,.22)' },
  larimar: { esClaro: true, acento: '#2a8fb8', fondo: '#dcebec', panel: 'rgba(238,247,248,.98)', textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375', boton: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', botonTexto: '#04121f', avatar: 'linear-gradient(150deg, #4aafc8, #1a6a8a)', avatarTexto: '#04121f', glow: 'rgba(42,143,184,0.18)', borde: 'rgba(42,143,184,.22)' },
}

const NOMBRES_FONDO = [null, 'balon_dorado', 'aro_atardecer', 'cancha_barrio_noche', 'cancha_madera', 'monumento_santiago']

export default function PantallaPublicar({ miPerfil, onVolver, onPublicado, onResultado }) {
  const [tema] = useState(() => {
    const validos = ['dorado', 'azul', 'claro', 'larimar']
    if (typeof window !== 'undefined') {
      const g = localStorage.getItem('mc_tema')
      return validos.includes(g) ? g : 'dorado'
    }
    return 'dorado'
  })
  const T = TEMAS[tema] || TEMAS.dorado
  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

  const [texto, setTexto] = useState('')
  const [fondoSel, setFondoSel] = useState(0)
  const [publicando, setPublicando] = useState(false)
  const [panelEmoji, setPanelEmoji] = useState(false)
  const [perfilCargado, setPerfilCargado] = useState(miPerfil || null)
  const areaRef = useRef(null)
  const p = perfilCargado || miPerfil || {}

  // Si no llega el perfil por props, lo carga solo (como hace el Chat)
  useEffect(() => {
    if (miPerfil) { setPerfilCargado(miPerfil); return }
    let vivo = true
    ;(async () => {
      try {
        const { miPerfilCompleto } = await import('../techado')
        const pf = await miPerfilCompleto()
        if (vivo && pf) setPerfilCargado(pf)
      } catch (e) {}
    })()
    return () => { vivo = false }
  }, [miPerfil])

  const esNativo =
    typeof Capacitor !== 'undefined' &&
    typeof Capacitor.isNativePlatform === 'function' &&
    Capacitor.isNativePlatform()

  // ===== Teclado fluido (motor del Chat) =====
  const [kbAlto, setKbAlto] = useState(0)
  const ajusteTeclado = 30

  // ===== CANDADO REAL (del BottomSheet de comentarios): congela el body en su
  // posición exacta. ESTO es lo que impide que el fondo se mueva. =====
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

  // Teclado: modo None + listeners (igual que Chat y BottomSheet)
  useEffect(() => {
    if (!esNativo) return
    let lShow = null, lHide = null
    Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {})
    ;(async () => {
      try {
        lShow = await Keyboard.addListener('keyboardWillShow', (info) => setKbAlto((info && info.keyboardHeight) || 0))
        lHide = await Keyboard.addListener('keyboardWillHide', () => setKbAlto(0))
      } catch (e) {}
    })()
    return () => {
      if (lShow && lShow.remove) lShow.remove()
      if (lHide && lHide.remove) lHide.remove()
      setKbAlto(0)
      Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {})
    }
  }, [esNativo])

  // Cerrar con Escape
  useEffect(() => {
    const alPresionar = (e) => { if (e.key === 'Escape') onVolver && onVolver() }
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [onVolver])

  const iniciales = `${(p.nombre || '?')[0] || ''}${(p.apellido || '')[0] || ''}`.toUpperCase()
  const hayTexto = texto.trim().length > 0
  const nombreCompleto = `${p.nombre || 'Usuario'}${p.apellido ? ' ' + p.apellido : ''}`

  const PLANTILLAS = [
    { id: 0, nombre: 'Normal', img: null, emoji: '📝', textoColor: T.textoFuerte },
    { id: 1, nombre: 'Balón', img: plBalonDorado, emoji: '🏀', textoColor: '#fff' },
    { id: 2, nombre: 'Atardecer', img: plAroAtardecer, emoji: '🌅', textoColor: '#fff' },
    { id: 3, nombre: 'Barrio', img: plCanchaBarrioNoche, emoji: '🌃', textoColor: '#fff' },
    { id: 4, nombre: 'Madera', img: plCanchaMadera, emoji: '🏟️', textoColor: '#fff' },
    { id: 5, nombre: 'Santiago', img: plMonumentoSantiago, emoji: '🏛️', textoColor: '#fff' },
  ]
  const plantillaActiva = PLANTILLAS.find((x) => x.id === fondoSel) || PLANTILLAS[0]
  const conFondo = plantillaActiva.id > 0

  const avisarPronto = (n) => alert(`${n}: muy pronto 🏀`)
  const CHIPS = [
    { id: 'torneo', emoji: '🏆', txt: 'Torneo', fn: () => avisarPronto('Etiquetar torneo') },
    { id: 'ubicacion', emoji: '📍', txt: 'Ubicación', fn: () => avisarPronto('Ubicación') },
    { id: 'sentimiento', emoji: '😊', txt: 'Sentimiento', fn: () => avisarPronto('Sentimiento') },
  ]
  const ACCIONES = [
    { id: 'foto', emoji: '📷', txt: 'Foto', fn: () => avisarPronto('Subir foto') },
    { id: 'video', emoji: '🎥', txt: 'Video', fn: () => avisarPronto('Subir video') },
    { id: 'resultado', emoji: '📊', txt: 'Resultado', fn: () => { onResultado && onResultado() } },
    { id: 'encuesta', emoji: '🗳️', txt: 'Encuesta', fn: () => avisarPronto('Crear encuesta') },
    { id: 'gif', emoji: '🎬', txt: 'GIF', fn: () => avisarPronto('GIF') },
  ]
  const EMOJIS = ['🏀', '🔥', '💪', '🏆', '🥇', '⛹️', '🎯', '💥', '⚡', '🌟', '👑', '🚀', '💯', '🙌', '😤', '😎', '👏', '🤝', '😅', '😱', '💀', '😈', '🗣️', '👀']
  const insertarEmoji = (e) => setTexto((t) => (t || '') + e)

  const publicar = async () => {
    const txt = texto.trim()
    if (!txt || publicando) return
    setPublicando(true)
    try {
      const { publicarTexto } = await import('../techado')
      const fondoElegido = fondoSel > 0 ? NOMBRES_FONDO[fondoSel] : null
      const res = await publicarTexto({ texto: txt, fondo: fondoElegido })
      if (res && res.error) {
        alert('No se pudo publicar: ' + res.error)
      } else {
        setTexto(''); setFondoSel(0)
        onPublicado && onPublicado()
        onVolver && onVolver()
      }
    } catch (e) {
      alert('Error al publicar: ' + (e.message || e))
    }
    setPublicando(false)
  }

  const css = `
    .mc-pub-scroll::-webkit-scrollbar { width: 0; }
    .mc-pub-scroll { overscroll-behavior: contain; -webkit-overflow-scrolling: touch; touch-action: pan-y; }
    .mc-pub-row::-webkit-scrollbar { height: 0; }
    html.mc-pub-lock { height: 100%; overflow: hidden; overscroll-behavior: none; }
    @keyframes mcPubIn { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
  `

  // ===== ESTRUCTURA DEL CHAT: raíz que sube con el teclado (height calc) =====
  return (
    <div style={{ fontFamily: font, color: T.textoBody, background: T.fondo, display: 'flex', flexDirection: 'column', width: '100vw', height: kbAlto > 0 ? `calc(100dvh - ${Math.max(0, kbAlto - ajusteTeclado)}px)` : '100dvh', position: 'relative', overflow: 'hidden', transition: 'height .25s cubic-bezier(.25,.8,.25,1)' }}>
      <style>{css}</style>

      {/* Glow deportivo de fondo */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 70% 38% at 50% 0%, ${T.glow}, transparent 72%)` }} />

      {/* ===== HEADER deportivo, fijo, con botón Publicar ===== */}
      <div style={{ position: 'relative', zIndex: 3, flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: T.panel, borderBottom: `1px solid ${T.borde}`, backdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52, padding: '0 12px' }}>
          <button onClick={() => onVolver && onVolver()} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: 'none', background: T.esClaro ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)', color: T.textoFuerte, fontSize: 21, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
            <span style={{ fontSize: 15.5, fontWeight: 900, color: T.textoFuerte, letterSpacing: 0.3 }}>Nueva jugada</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.acento, textTransform: 'uppercase', letterSpacing: 1 }}>al techado</span>
          </div>
          <button onClick={publicar} disabled={!hayTexto || publicando} style={{ flexShrink: 0, border: 'none', borderRadius: 22, padding: '10px 20px', background: hayTexto ? T.boton : (T.esClaro ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.08)'), color: hayTexto ? T.botonTexto : T.tenue, fontWeight: 900, fontSize: 14, letterSpacing: 0.3, cursor: hayTexto ? 'pointer' : 'default', opacity: publicando ? 0.6 : 1, boxShadow: hayTexto ? `0 6px 18px ${T.glow}` : 'none', transition: 'all .2s' }}>{publicando ? 'Enviando…' : 'Publicar'}</button>
        </div>
      </div>

      {/* ===== CONTENIDO SCROLL (lo único que se mueve) ===== */}
      <div className="mc-pub-scroll" style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Identidad */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 12px', animation: 'mcPubIn .35s ease' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.foto_url ? `url(${p.foto_url}) center/cover` : T.avatar, color: T.avatarTexto, fontWeight: 800, fontSize: 17, boxShadow: `0 0 0 2.5px ${T.acento}, 0 6px 16px ${T.glow}` }}>{!p.foto_url && iniciales}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreCompleto}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4, fontSize: 11, fontWeight: 800, color: T.acento, border: `1.5px solid ${T.borde}`, borderRadius: 20, padding: '3px 10px' }}>🌐 Público</div>
          </div>
        </div>

        {/* Chips contextuales */}
        <div className="mc-pub-row" style={{ flexShrink: 0, display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 14px' }}>
          {CHIPS.map((c) => (
            <button key={c.id} onClick={c.fn} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 22, border: `1.5px solid ${T.borde}`, background: T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.04)', color: T.textoFuerte, fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <span>{c.emoji}</span>{c.txt}
            </button>
          ))}
        </div>

        {/* Área de escritura */}
        {conFondo ? (
          <div style={{ flexShrink: 0, margin: '0 16px 16px', borderRadius: 22, position: 'relative', overflow: 'hidden', minHeight: 280, background: `url(${plantillaActiva.img}) center/cover`, boxShadow: `0 14px 36px rgba(0,0,0,.4)`, border: `1px solid ${T.borde}` }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,9,12,.28), rgba(8,9,12,.6))' }} />
            <div style={{ position: 'relative', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 26 }}>
              <textarea ref={areaRef} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe con fuerza…" rows={4} style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', color: plantillaActiva.textoColor, fontSize: 27, fontWeight: 900, textAlign: 'center', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.3, textShadow: '0 2px 16px rgba(0,0,0,.75)' }} />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 140, padding: '2px 18px 14px', display: 'flex' }}>
            <textarea ref={areaRef} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="¿Qué está pasando en la cancha?" style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', color: T.textoFuerte, fontSize: 20, fontWeight: 500, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, minHeight: 130 }} />
          </div>
        )}

        {/* Selector de plantillas */}
        <div style={{ flexShrink: 0, padding: '0 0 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: T.tenue, textTransform: 'uppercase', letterSpacing: 1, padding: '0 16px 9px' }}>Elige tu cancha</div>
          <div className="mc-pub-row" style={{ display: 'flex', gap: 11, overflowX: 'auto', padding: '0 16px 6px' }}>
            {PLANTILLAS.map((pl) => {
              const activa = pl.id === fondoSel
              return (
                <div key={pl.id} onClick={() => setFondoSel(pl.id)} style={{ flexShrink: 0, width: 64, cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden', position: 'relative', border: activa ? `2.5px solid ${T.acento}` : `1px solid ${T.borde}`, background: pl.img ? `url(${pl.img}) center/cover` : (T.esClaro ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.05)'), display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: activa ? `0 6px 16px ${T.glow}` : 'none', transform: activa ? 'scale(1.04)' : 'scale(1)', transition: 'all .18s' }}>
                    {!pl.img && <span style={{ fontSize: 26 }}>{pl.emoji}</span>}
                    {pl.img && <span style={{ position: 'absolute', bottom: 3, right: 4, fontSize: 14 }}>{pl.emoji}</span>}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: activa ? T.acento : T.tenue, marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.nombre}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Panel emojis (despliega) */}
        {panelEmoji && (
          <div style={{ flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: 4, padding: '10px 16px 14px', borderTop: `1px solid ${T.borde}`, animation: 'mcPubIn .25s ease' }}>
            {EMOJIS.map((e) => (
              <span key={e} onClick={() => insertarEmoji(e)} style={{ fontSize: 27, cursor: 'pointer', padding: 4, lineHeight: 1 }}>{e}</span>
            ))}
          </div>
        )}
      </div>

      {/* ===== BARRA DE ACCIONES FIJA ABAJO (flexShrink:0, motor del Chat) ===== */}
      <div style={{ position: 'relative', zIndex: 3, flexShrink: 0, borderTop: `1px solid ${T.borde}`, background: T.panel, paddingBottom: kbAlto > 0 ? 6 : 'calc(8px + env(safe-area-inset-bottom))', backdropFilter: 'blur(14px)' }}>
        <div className="mc-pub-row" style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', padding: '9px 12px' }}>
          <button onClick={() => setPanelEmoji(!panelEmoji)} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 13, border: 'none', background: panelEmoji ? T.glow : (T.esClaro ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)'), fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>😊</button>
          {ACCIONES.map((a) => (
            <button key={a.id} onClick={a.fn} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 15px', borderRadius: 13, border: `1.5px solid ${T.borde}`, background: T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.04)', color: T.textoFuerte, fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 16 }}>{a.emoji}</span>{a.txt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}