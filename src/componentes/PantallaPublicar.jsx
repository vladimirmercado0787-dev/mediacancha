import { useState, useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'
import plAroAtardecer from '../assets/plantillas/plantilla_aro_atardecer.png'
import plBalonDorado from '../assets/plantillas/plantilla_balon_dorado.png'
import plCanchaBarrioNoche from '../assets/plantillas/plantilla_cancha_barrio_noche.png'
import plCanchaMadera from '../assets/plantillas/plantilla_cancha_madera.png'
import plMonumentoSantiago from '../assets/plantillas/plantilla_monumento_santiago.png'
import RecortadorFoto from './RecortadorFoto'

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
  const [panelSentimiento, setPanelSentimiento] = useState(false)
  const [panelUbicacion, setPanelUbicacion] = useState(false)
  const [sentimiento, setSentimiento] = useState(null)   // { emoji, label } o null
  const [ubicacion, setUbicacion] = useState(null)        // string o null
  const [ubicacionTmp, setUbicacionTmp] = useState('')
  const [perfilCargado, setPerfilCargado] = useState(miPerfil || null)
  const areaRef = useRef(null)
  const inputFotosRef = useRef(null)
  const inputVideoRef = useRef(null)
  const [fotos, setFotos] = useState([])              // [{ blob, previa }]
  const [video, setVideo] = useState(null)            // { file, url, dur } o null
  const [fotoARecortar, setFotoARecortar] = useState(null)
  const [editandoIdx, setEditandoIdx] = useState(-1)
  const maxFotos = 2                                   // usuario: 2 (torneo 5, liga 4 cuando se construyan)
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
  const puedePublicar = hayTexto || fotos.length > 0 || !!video || !!sentimiento || !!ubicacion
  const nombreCompleto = `${p.nombre || 'Usuario'}${p.apellido ? ' ' + p.apellido : ''}`

  // Sentimientos con sabor de cancha (puro client-side, se guardan en el texto)
  const SENTIMIENTOS = [
    { emoji: '🔥', label: 'encendido' }, { emoji: '😤', label: 'con todo' },
    { emoji: '😎', label: 'tranquilo' }, { emoji: '🏆', label: 'campeón' },
    { emoji: '💪', label: 'fuerte' }, { emoji: '⚡', label: 'a millón' },
    { emoji: '👑', label: 'mandando' }, { emoji: '🙏', label: 'bendecido' },
    { emoji: '😅', label: 'sufriendo' }, { emoji: '😱', label: 'asombrado' },
    { emoji: '😭', label: 'dolido' }, { emoji: '🤝', label: 'agradecido' },
  ]

  // Mutua exclusión: abrir un panel cierra los otros
  const toggleEmoji = () => { setPanelEmoji((v) => !v); setPanelSentimiento(false); setPanelUbicacion(false) }
  const toggleSentimiento = () => { setPanelSentimiento((v) => !v); setPanelEmoji(false); setPanelUbicacion(false) }
  const toggleUbicacion = () => { setPanelUbicacion((v) => { if (!v) setUbicacionTmp(ubicacion || ''); return !v }); setPanelEmoji(false); setPanelSentimiento(false) }
  const elegirSentimiento = (s) => { setSentimiento(s); setPanelSentimiento(false) }
  const guardarUbicacion = () => { const v = ubicacionTmp.trim(); setUbicacion(v || null); setPanelUbicacion(false) }

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
    { id: 'torneo', emoji: '🏆', txt: 'Torneo', activa: false, fn: () => avisarPronto('Etiquetar torneo') },
    { id: 'ubicacion', emoji: '📍', txt: ubicacion || 'Ubicación', activa: !!ubicacion, fn: toggleUbicacion },
    { id: 'sentimiento', emoji: sentimiento ? sentimiento.emoji : '😊', txt: sentimiento ? sentimiento.label : 'Sentimiento', activa: !!sentimiento, fn: toggleSentimiento },
  ]
  const ACCIONES = [
    { id: 'foto', emoji: '📷', txt: 'Foto', fn: () => { if (fotos.length >= maxFotos) { alert(`Puedes subir hasta ${maxFotos} fotos por publicación.`) } else { inputFotosRef.current && inputFotosRef.current.click() } } },
    { id: 'video', emoji: '🎥', txt: 'Video', fn: () => { if (fotos.length > 0) { alert('Una publicación lleva fotos o un video, no ambos. Quita las fotos primero.'); return } inputVideoRef.current && inputVideoRef.current.click() } },
    { id: 'resultado', emoji: '📊', txt: 'Resultado', fn: () => { onResultado && onResultado() } },
    { id: 'encuesta', emoji: '🗳️', txt: 'Encuesta', fn: () => avisarPronto('Crear encuesta') },
    { id: 'gif', emoji: '🎬', txt: 'GIF', fn: () => avisarPronto('GIF') },
  ]
  const EMOJIS = ['🏀', '🔥', '💪', '🏆', '🥇', '⛹️', '🎯', '💥', '⚡', '🌟', '👑', '🚀', '💯', '🙌', '😤', '😎', '👏', '🤝', '😅', '😱', '💀', '😈', '🗣️', '👀']
  const insertarEmoji = (e) => setTexto((t) => (t || '') + e)

  // ----- Manejo de fotos -----
  const alElegirFotos = (e) => {
    const archivos = Array.from(e.target.files || [])
    if (inputFotosRef.current) inputFotosRef.current.value = ''
    if (!archivos.length) return
    const espacio = maxFotos - fotos.length
    if (espacio <= 0) { alert(`Puedes subir hasta ${maxFotos} fotos por publicación.`); return }
    const aUsar = archivos.slice(0, espacio)
    // Una sola foto en total → recortador
    if (aUsar.length === 1 && fotos.length === 0) {
      setEditandoIdx(-1)
      setFotoARecortar(aUsar[0])
      return
    }
    // Varias → directo (con opción de editar)
    const nuevas = aUsar.map((a) => ({ blob: a, previa: URL.createObjectURL(a) }))
    setFotos((prev) => [...prev, ...nuevas])
  }

  const alRecortar = (blob) => {
    const previa = URL.createObjectURL(blob)
    if (editandoIdx >= 0) setFotos((prev) => prev.map((f, i) => i === editandoIdx ? { blob, previa } : f))
    else setFotos((prev) => [...prev, { blob, previa }])
    setFotoARecortar(null); setEditandoIdx(-1)
  }

  const editarFoto = (idx) => { const f = fotos[idx]; if (!f) return; setEditandoIdx(idx); setFotoARecortar(f.blob) }
  const quitarFoto = (idx) => setFotos((prev) => { const f = prev[idx]; if (f) { try { URL.revokeObjectURL(f.previa) } catch (e) {} } return prev.filter((_, i) => i !== idx) })

  const MAX_VIDEO_TECHADO = 60   // un minuto
  const duracionDeVideo = (file) => new Promise((res) => {
    try {
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.onloadedmetadata = () => { const d = v.duration || 0; URL.revokeObjectURL(v.src); res(d) }
      v.onerror = () => res(0)
      v.src = URL.createObjectURL(file)
    } catch (e) { res(0) }
  })
  const alElegirVideo = async (e) => {
    const file = e.target.files && e.target.files[0]; if (e.target) e.target.value = ''
    if (!file) return
    if (fotos.length > 0) { alert('Una publicación lleva fotos o un video, no ambos. Quita las fotos primero.'); return }
    const dur = await duracionDeVideo(file)
    if (dur && dur > MAX_VIDEO_TECHADO + 0.6) { alert('El video del Techado debe ser de un minuto o menos.'); return }
    if (video && video.url) { try { URL.revokeObjectURL(video.url) } catch (x) {} }
    setVideo({ file, url: URL.createObjectURL(file), dur })
  }
  const quitarVideo = () => { if (video && video.url) { try { URL.revokeObjectURL(video.url) } catch (x) {} } setVideo(null) }

  const publicar = async () => {
    const base = texto.trim()
    const extras = []
    if (ubicacion) extras.push(`📍 ${ubicacion}`)
    if (sentimiento) extras.push(`${sentimiento.emoji} sintiéndose ${sentimiento.label}`)
    const meta = extras.join('  ·  ')
    const textoFinal = meta ? (base ? `${base}\n\n${meta}` : meta) : base
    const hayFotos = fotos.length > 0
    const hayVideo = !!video
    if (publicando) return
    if (!textoFinal && !hayFotos && !hayVideo) {
      alert('Escribe algo, elige un sentimiento o ubicación, o agrega una foto o video para publicar 🏀')
      return
    }
    setPublicando(true)
    try {
      const { publicarTexto } = await import('../techado')
      const { subirFotoPublicacion } = await import('../fotos')
      const fondoElegido = fondoSel > 0 ? NOMBRES_FONDO[fondoSel] : null
      let urls = []
      if (hayFotos) {
        for (const f of fotos) {
          const r = await subirFotoPublicacion(f.blob)
          if (r && r.url) urls.push(r.url)
        }
      }
      let videoUrl = null
      if (hayVideo) {
        const { subirVideoTechado } = await import('../historias')
        const rv = await subirVideoTechado(video.file)
        if (rv && rv.url) videoUrl = rv.url
        else { alert('No se pudo subir el video.'); setPublicando(false); return }
      }
      const res = await publicarTexto({ texto: textoFinal, imagenes: urls.length ? urls : null, video: videoUrl, fondo: (urls.length || videoUrl) ? null : fondoElegido })
      if (res && res.error) {
        alert('No se pudo publicar: ' + res.error)
      } else {
        setTexto(''); setFondoSel(0); setSentimiento(null); setUbicacion(null); setUbicacionTmp('')
        fotos.forEach((f) => { try { URL.revokeObjectURL(f.previa) } catch (e) {} })
        setFotos([])
        quitarVideo()
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
    <div style={{ fontFamily: font, color: T.textoBody, background: T.fondo, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300, height: kbAlto > 0 ? `calc(100dvh - ${Math.max(0, kbAlto - ajusteTeclado)}px)` : '100dvh', overflow: 'hidden', transition: 'height .25s cubic-bezier(.25,.8,.25,1)' }}>
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
          <button onClick={publicar} disabled={publicando} style={{ flexShrink: 0, border: 'none', borderRadius: 22, padding: '11px 22px', background: T.boton, color: T.botonTexto, fontWeight: 900, fontSize: 14.5, letterSpacing: 0.3, cursor: 'pointer', opacity: publicando ? 0.6 : (puedePublicar ? 1 : 0.72), boxShadow: `0 6px 18px ${T.glow}`, transition: 'all .2s' }}>{publicando ? 'Enviando…' : 'Publicar'}</button>
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
            <button key={c.id} onClick={c.fn} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 22, border: `1.5px solid ${c.activa ? T.acento : T.borde}`, background: c.activa ? T.glow : (T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.04)'), color: c.activa ? T.acento : T.textoFuerte, fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <span>{c.emoji}</span>{c.txt}
            </button>
          ))}
        </div>

        {/* Panel SENTIMIENTO (real, client-side) */}
        {panelSentimiento && (
          <div style={{ flexShrink: 0, margin: '0 16px 14px', padding: '12px', borderRadius: 16, border: `1px solid ${T.borde}`, background: T.esClaro ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.03)', animation: 'mcPubIn .22s ease' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: T.tenue, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>¿Cómo te sientes?</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {SENTIMIENTOS.map((s) => {
                const sel = sentimiento && sentimiento.label === s.label
                return (
                  <button key={s.label} onClick={() => elegirSentimiento(s)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 10px', borderRadius: 12, border: `1.5px solid ${sel ? T.acento : T.borde}`, background: sel ? T.glow : 'transparent', color: sel ? T.acento : T.textoBody, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ fontSize: 18 }}>{s.emoji}</span>{s.label}
                  </button>
                )
              })}
            </div>
            {sentimiento && (
              <button onClick={() => { setSentimiento(null); setPanelSentimiento(false) }} style={{ marginTop: 11, border: 'none', background: 'transparent', color: T.tenue, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', padding: 4 }}>✕ Quitar sentimiento</button>
            )}
          </div>
        )}

        {/* Panel UBICACIÓN (real, client-side) */}
        {panelUbicacion && (
          <div style={{ flexShrink: 0, margin: '0 16px 14px', padding: '12px', borderRadius: 16, border: `1px solid ${T.borde}`, background: T.esClaro ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.03)', animation: 'mcPubIn .22s ease' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: T.tenue, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>¿Dónde estás?</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={ubicacionTmp}
                onChange={(e) => setUbicacionTmp(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') guardarUbicacion() }}
                placeholder="Cancha, barrio, ciudad…"
                maxLength={60}
                style={{ flex: 1, minWidth: 0, background: T.esClaro ? '#fff' : 'rgba(255,255,255,.06)', border: `1px solid ${T.borde}`, borderRadius: 12, padding: '11px 14px', color: T.textoBody, fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
              />
              <button onClick={guardarUbicacion} style={{ flexShrink: 0, border: 'none', borderRadius: 12, padding: '11px 16px', background: T.boton, color: T.botonTexto, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>Listo</button>
            </div>
            {ubicacion && (
              <button onClick={() => { setUbicacion(null); setUbicacionTmp(''); setPanelUbicacion(false) }} style={{ marginTop: 11, border: 'none', background: 'transparent', color: T.tenue, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', padding: 4 }}>✕ Quitar ubicación</button>
            )}
          </div>
        )}

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

        {/* Fotos elegidas para la publicación */}
        {fotos.length > 0 && (
          <div style={{ flexShrink: 0, display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 14px', WebkitOverflowScrolling: 'touch' }}>
            {fotos.map((f, i) => (
              <div key={i} style={{ position: 'relative', flexShrink: 0, width: 96, height: 96, borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${T.acento}55` }}>
                <img src={f.previa} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button onClick={() => quitarFoto(i)} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'grid', placeItems: 'center', lineHeight: 1 }}>✕</button>
                <button onClick={() => editarFoto(i)} style={{ position: 'absolute', bottom: 4, right: 4, border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 10.5, fontWeight: 800, cursor: 'pointer', borderRadius: 7, padding: '3px 7px' }}>✎ Editar</button>
              </div>
            ))}
            {fotos.length < maxFotos && (
              <button onClick={() => inputFotosRef.current && inputFotosRef.current.click()} style={{ flexShrink: 0, width: 96, height: 96, borderRadius: 12, border: `1.5px dashed ${T.acento}77`, background: 'transparent', color: T.acento, fontSize: 28, cursor: 'pointer' }}>＋</button>
            )}
          </div>
        )}

        {/* Video elegido para la publicación */}
        {video && (
          <div style={{ flexShrink: 0, padding: '0 16px 14px' }}>
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${T.acento}55`, background: '#000' }}>
              <video src={video.url} controls playsInline style={{ width: '100%', maxHeight: 300, display: 'block', background: '#000' }} />
              <button onClick={quitarVideo} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 15, cursor: 'pointer', display: 'grid', placeItems: 'center', lineHeight: 1 }}>✕</button>
            </div>
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
          <button onClick={toggleEmoji} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 13, border: 'none', background: panelEmoji ? T.glow : (T.esClaro ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)'), fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>😊</button>
          {ACCIONES.map((a) => (
            <button key={a.id} onClick={a.fn} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 15px', borderRadius: 13, border: `1.5px solid ${T.borde}`, background: T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.04)', color: T.textoFuerte, fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 16 }}>{a.emoji}</span>{a.txt}
            </button>
          ))}
        </div>
      </div>

      {/* Input oculto para elegir fotos */}
      <input ref={inputFotosRef} type="file" accept="image/*" multiple={maxFotos > 1} onChange={alElegirFotos} style={{ display: 'none' }} />
      {/* Input oculto para elegir video (Techado, hasta un minuto) */}
      <input ref={inputVideoRef} type="file" accept="video/*" onChange={alElegirVideo} style={{ display: 'none' }} />

      {/* Recortador (1 foto o al editar) */}
      {fotoARecortar && (
        <RecortadorFoto
          archivo={fotoARecortar}
          forma="cuadrado"
          elegirForma={true}
          tema={{ acento: T.acento, boton: T.boton, botonTexto: T.botonTexto, panel: 'rgba(12,14,18,.98)', texto: '#f4f7f9', tenue: '#9aa7b2' }}
          onListo={alRecortar}
          onCancelar={() => { setFotoARecortar(null); setEditandoIdx(-1) }}
        />
      )}
    </div>
  )
}