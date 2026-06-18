import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { miUsuarioId } from '../social'
import { leerConversacion, marcarLeido, listaConversaciones, perfilesDe } from '../mensajes'
import fondoCancha from '../assets/fondo-cancha.png'

const TEMAS = {
  dorado: { esClaro: false, acento: '#e8b65a', acentoSolido: '#d99f3e', fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', avatar: 'linear-gradient(150deg, #e0b057, #9a6420)', avatarTexto: '#241a07', tarjetaBg: 'rgba(20,22,26,.72)', tarjetaBorde: 'rgba(255,255,255,.08)', inputBg: 'rgba(12,14,18,0.7)', burbujaMia: 'linear-gradient(150deg, #f3cf63, #c8842e)', burbujaMiaTexto: '#1a1205', burbujaOtro: 'rgba(40,43,48,.95)', burbujaOtroTexto: '#eef3f6', glow: 'rgba(190,135,55,0.18)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.84), rgba(8,9,12,0.92))', sheetBg: 'rgba(18,20,24,0.98)' },
  azul: { esClaro: false, acento: '#6fb0ec', acentoSolido: '#4f8fd0', fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', avatar: 'linear-gradient(150deg, #5aa0e0, #1d4a80)', avatarTexto: '#08151f', tarjetaBg: 'rgba(20,22,26,.72)', tarjetaBorde: 'rgba(255,255,255,.08)', inputBg: 'rgba(12,14,18,0.7)', burbujaMia: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', burbujaMiaTexto: '#08151f', burbujaOtro: 'rgba(40,43,48,.95)', burbujaOtroTexto: '#eef3f6', glow: 'rgba(55,120,190,0.2)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.84), rgba(8,9,12,0.92))', sheetBg: 'rgba(18,20,24,0.98)' },
  claro: { esClaro: true, acento: '#b07a26', acentoSolido: '#b07a26', fondo: '#e6dcc8', textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58', boton: 'linear-gradient(150deg, #e7c069, #b07a26)', avatar: 'linear-gradient(150deg, #e7c069, #a9741f)', avatarTexto: '#3a2806', tarjetaBg: '#fff', tarjetaBorde: '#e0e3e8', inputBg: '#fff', burbujaMia: 'linear-gradient(150deg, #e7c069, #b07a26)', burbujaMiaTexto: '#2a1c06', burbujaOtro: '#fff', burbujaOtroTexto: '#2a2014', glow: 'rgba(190,135,55,0.10)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(235,228,212,0.86), rgba(228,220,200,0.92))', sheetBg: 'rgba(252,249,243,0.99)' },
  larimar: { esClaro: true, acento: '#2a8fb8', acentoSolido: '#2a8fb8', fondo: '#d6e7e8', textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375', boton: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', avatar: 'linear-gradient(150deg, #4aafc8, #1a6a8a)', avatarTexto: '#04121f', tarjetaBg: '#fff', tarjetaBorde: '#cfe0e2', inputBg: '#fff', burbujaMia: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', burbujaMiaTexto: '#04121f', burbujaOtro: '#fff', burbujaOtroTexto: '#1c2624', glow: 'rgba(42,143,184,0.12)', navDorada: 'linear-gradient(180deg,#6ac0d8,#2a8fb8 55%,#1a6a8a)', veloGrad: 'linear-gradient(180deg, rgba(214,231,232,0.86), rgba(214,231,232,0.92))', sheetBg: 'rgba(245,251,252,0.99)' },
}

const EMOJIS = ['🔥', '🏀', '😂', '👏', '😮', '💪']

// Catálogo del selector de emojis (por categoría), con sabor dominicano y de básquet
const CATS_EMOJI = {
  'Básquet': ['🏀', '🔥', '💪', '🏆', '🥇', '🥈', '🥉', '⛹️', '🤾', '🏅', '📊', '⏱️', '🎯', '💥', '⚡', '🌟', '👑', '🚀', '💯', '🙌', '🫡', '😤', '🥶', '🐐'],
  'Caritas': ['😀', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😎', '🤩', '😏', '😮', '😱', '🤔', '😤', '😭', '😢', '😡', '🥵', '🤯', '😴', '🥳', '😬', '🙃', '😜'],
  'Gestos': ['👍', '👎', '👏', '🙌', '🤝', '✊', '👊', '🤜', '🤛', '✌️', '🤞', '🫡', '🙏', '💪', '👈', '👉', '👆', '👇', '☝️', '🤙', '🫶', '👋', '🤟', '✋'],
  'Símbolos': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '❤️‍🔥', '⭐', '🌟', '✨', '💫', '🎉', '🎊', '🔔', '📢', '💬', '👀', '✅', '❌', '💢', '💦', '🩸'],
  'Banderas': ['🇩🇴', '🇺🇸', '🇵🇷', '🇲🇽', '🇨🇴', '🇻🇪', '🇪🇸', '🇨🇺', '🇦🇷', '🇧🇷', '🇨🇱', '🇵🇪', '🇪🇨', '🇬🇹', '🇭🇳', '🇳🇮', '🇨🇷', '🇵🇦', '🏳️', '🏁'],
}
const ICONO_CAT = { 'Básquet': '🏀', 'Caritas': '😀', 'Gestos': '👍', 'Símbolos': '❤️', 'Banderas': '🇩🇴' }

function horaCorta(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function fechaCorta(iso) {
  if (!iso) return ''
  const d = new Date(iso), hoy = new Date()
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1)
  if (d.toDateString() === hoy.toDateString()) return horaCorta(iso)
  if (d.toDateString() === ayer.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit' })
}
function diaLabel(iso) {
  if (!iso) return ''
  const d = new Date(iso), hoy = new Date()
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1)
  if (d.toDateString() === hoy.toDateString()) return 'Hoy'
  if (d.toDateString() === ayer.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'long' })
}
function resumenMsg(m) {
  if (!m) return ''
  if (m.tipo === 'foto') return '📷 Foto'
  if (m.tipo === 'voz') return '🎤 Nota de voz'
  if (m.tipo === 'ubicacion') return '📍 Ubicación'
  return m.texto || 'Mensaje'
}

export default function PantallaChat({ abrirCon, onVolver }) {
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

  const [yo, setYo] = useState(null)
  const [vistaChat, setVistaChat] = useState(abrirCon || null)
  const [convs, setConvs] = useState([])
  const [perfilesMap, setPerfilesMap] = useState({})
  const [cargandoInbox, setCargandoInbox] = useState(true)
  const [buscaInbox, setBuscaInbox] = useState('')

  const [mensajes, setMensajes] = useState([])
  const [perfilOtro, setPerfilOtro] = useState(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [respondeA, setRespondeA] = useState(null)
  const [selMsg, setSelMsg] = useState(null)
  const [menuHeader, setMenuHeader] = useState(false)
  const [confirmarVaciar, setConfirmarVaciar] = useState(false)
  const [otroEscribiendo, setOtroEscribiendo] = useState(false)
  const [menuCompartir, setMenuCompartir] = useState(false)
  const [grabando, setGrabando] = useState(false)
  const [segGrab, setSegGrab] = useState(0)
  const [subiendo, setSubiendo] = useState(false)
  const [toast, setToast] = useState('')
  const [emojiAbierto, setEmojiAbierto] = useState(false)
  const [catEmoji, setCatEmoji] = useState('Básquet')
  const inputRef = useRef(null)

  // Mientras el chat está abierto, trabamos el deslizamiento de la página entera
  // (así solo se mueve el área de mensajes por dentro, no toda la pantalla)
  useEffect(() => {
    if (!vistaChat) return
    const html = document.documentElement, body = document.body
    html.classList.add('mc-chat-lock'); body.classList.add('mc-chat-lock')
    return () => { html.classList.remove('mc-chat-lock'); body.classList.remove('mc-chat-lock') }
  }, [vistaChat])

  const insertarEmoji = (e) => { setTexto((t) => t + e); avisarTyping() }
  const toggleEmoji = () => { setEmojiAbierto((v) => { const n = !v; if (n) inputRef.current?.blur(); else inputRef.current?.focus(); return n }); irAbajoSuave() }

  const finRef = useRef(null)
  const canalRef = useRef(null)
  const ultimoTyping = useRef(0)
  const escTimeout = useRef(null)
  const grabRef = useRef(null)
  const grabTimer = useRef(null)
  const fotoInputRef = useRef(null)
  const toastRef = useRef(null)
  const presionTimer = useRef(null)

  useEffect(() => { (async () => setYo(await miUsuarioId()))() }, [])

  const irAbajo = (b = 'smooth') => setTimeout(() => finRef.current?.scrollIntoView({ behavior: b }), 80)
  // Al enfocar/abrir emojis, asegurar que se vea lo último (suave, sin pelear con el navegador)
  const irAbajoSuave = () => { [60, 280].forEach((ms) => setTimeout(() => finRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' }), ms)) }
  const avisar = (t) => { setToast(t); clearTimeout(toastRef.current); toastRef.current = setTimeout(() => setToast(''), 1800) }

  // ===== INBOX =====
  const cargarInbox = async () => {
    setCargandoInbox(true)
    const lista = await listaConversaciones()
    setConvs(lista)
    const ids = lista.map((c) => c.otroId)
    if (ids.length) setPerfilesMap(await perfilesDe(ids))
    setCargandoInbox(false)
  }
  useEffect(() => { if (!vistaChat) cargarInbox() }, [vistaChat])

  // ===== CONVERSACIÓN =====
  const cargarConversacion = async (otroId) => {
    const msgs = await leerConversacion(otroId)
    setMensajes(msgs)
    await marcarLeido(otroId)
    const mapa = await perfilesDe([otroId])
    setPerfilOtro(mapa[otroId] || null)
    irAbajo('auto')
  }

  useEffect(() => {
    if (!vistaChat || !yo) return
    setRespondeA(null); setSelMsg(null); setMenuCompartir(false); setOtroEscribiendo(false); setEmojiAbierto(false); setMenuHeader(false); setConfirmarVaciar(false)
    cargarConversacion(vistaChat)

    const canal = supabase
      .channel('chat-' + [yo, vistaChat].sort().join('-'), { config: { broadcast: { self: false } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, (payload) => {
        const m = payload.new
        const esDeEstaConv = (m.de_id === vistaChat && m.para_id === yo) || (m.de_id === yo && m.para_id === vistaChat)
        if (esDeEstaConv) {
          setMensajes((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m])
          if (m.para_id === yo) { marcarLeido(vistaChat); setOtroEscribiendo(false) }
          irAbajo()
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensajes' }, (payload) => {
        const m = payload.new
        setMensajes((prev) => prev.map((x) => x.id === m.id ? { ...x, ...m } : x))
      })
      .on('broadcast', { event: 'typing' }, (ev) => {
        if (ev.payload?.de === vistaChat) {
          setOtroEscribiendo(true)
          clearTimeout(escTimeout.current)
          escTimeout.current = setTimeout(() => setOtroEscribiendo(false), 3000)
        }
      })
      .subscribe()
    canalRef.current = canal
    return () => { supabase.removeChannel(canal); canalRef.current = null }
  }, [vistaChat, yo])

  const avisarTyping = () => {
    const ahora = Date.now()
    if (ahora - ultimoTyping.current < 1500) return
    ultimoTyping.current = ahora
    canalRef.current?.send({ type: 'broadcast', event: 'typing', payload: { de: yo } })
  }

  // ===== ENVIAR =====
  const mandar = async ({ tipo = 'texto', cuerpo = '', adjunto_url = null, adjunto_meta = null }) => {
    if (!yo || !vistaChat) return
    const fila = { de_id: yo, para_id: vistaChat, texto: cuerpo || null, tipo, responde_a: respondeA?.id || null, adjunto_url, adjunto_meta }
    const { data, error } = await supabase.from('mensajes').insert(fila).select().single()
    if (error) { avisar('No se pudo enviar'); return }
    if (data) { setMensajes((prev) => prev.some((x) => x.id === data.id) ? prev : [...prev, data]); irAbajo() }
    setRespondeA(null)
  }

  const enviarTexto = async () => {
    const limpio = texto.trim()
    if (!limpio || enviando) return
    setEnviando(true); setTexto('')
    await mandar({ tipo: 'texto', cuerpo: limpio })
    setEnviando(false)
  }

  // ===== REACCIONAR =====
  const reaccionar = async (msg, emoji) => {
    setSelMsg(null)
    setMensajes((prev) => prev.map((x) => {
      if (x.id !== msg.id) return x
      const r = { ...(x.reacciones || {}) }
      if (r[yo] === emoji) delete r[yo]; else r[yo] = emoji
      return { ...x, reacciones: r }
    }))
    await supabase.rpc('reaccionar_mensaje', { msg_id: msg.id, emoji })
  }

  // ===== BORRAR =====
  const menos24h = (m) => (Date.now() - new Date(m.creado_en).getTime()) < 24 * 60 * 60 * 1000
  const borrarParaTodos = async (m) => {
    setSelMsg(null)
    const { data, error } = await supabase.rpc('borrar_mensaje_todos', { msg_id: m.id })
    if (error || data === false) { avisar('No se pudo borrar para todos'); return }
    setMensajes((prev) => prev.map((x) => x.id === m.id ? { ...x, borrado_todos: true, texto: null, adjunto_url: null, adjunto_meta: null, reacciones: {} } : x))
  }
  const borrarParaMi = async (m) => {
    setSelMsg(null)
    setMensajes((prev) => prev.filter((x) => x.id !== m.id))
    await supabase.rpc('ocultar_mensaje_mi', { msg_id: m.id })
  }
  const vaciarChat = async () => {
    setConfirmarVaciar(false); setMenuHeader(false)
    setMensajes([])
    await supabase.rpc('vaciar_chat_mi', { otro_id: vistaChat })
    avisar('Conversación vaciada')
  }

  // ===== FIJAR =====
  const fijar = async (m, valor) => {
    setSelMsg(null)
    setMensajes((prev) => prev.map((x) => valor ? { ...x, fijado: x.id === m.id } : (x.id === m.id ? { ...x, fijado: false } : x)))
    if (valor) { // solo uno fijado a la vez: quitamos los demás
      const otros = mensajes.filter((x) => x.fijado && x.id !== m.id)
      for (const o of otros) await supabase.rpc('fijar_mensaje', { msg_id: o.id, valor: false })
    }
    await supabase.rpc('fijar_mensaje', { msg_id: m.id, valor })
  }

  // ===== MANTENER PRESIONADO (o tocar) PARA ABRIR ACCIONES =====
  const handlersPresion = (m) => ({
    onClick: () => setSelMsg(m),
    onContextMenu: (e) => { e.preventDefault(); setSelMsg(m) },
    onTouchStart: () => { presionTimer.current = setTimeout(() => setSelMsg(m), 420) },
    onTouchEnd: () => clearTimeout(presionTimer.current),
    onTouchMove: () => clearTimeout(presionTimer.current),
  })

  // ===== ADJUNTOS =====
  const subirArchivo = async (blob, ext, contentType) => {
    const ruta = `${yo}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('chat').upload(ruta, blob, { contentType, upsert: false })
    if (error) { console.error('Storage:', error); avisar('No se pudo subir: ' + (error.message || 'error')); return null }
    const { data } = supabase.storage.from('chat').getPublicUrl(ruta)
    return data?.publicUrl || null
  }

  const elegirFoto = () => { setMenuCompartir(false); fotoInputRef.current?.click() }
  const alSeleccionarFoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSubiendo(true)
    const url = await subirArchivo(file, (file.name.split('.').pop() || 'jpg'), file.type)
    if (url) await mandar({ tipo: 'foto', adjunto_url: url, adjunto_meta: { nombre: file.name } })
    setSubiendo(false)
  }

  const compartirUbicacion = () => {
    setMenuCompartir(false)
    if (!navigator.geolocation) return avisar('Tu navegador no da ubicación')
    if (typeof window !== 'undefined' && !window.isSecureContext) return avisar('La ubicación necesita https')
    setSubiendo(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        await mandar({ tipo: 'ubicacion', adjunto_meta: { lat: latitude, lng: longitude } })
        setSubiendo(false)
      },
      (err) => { setSubiendo(false); avisar(err?.code === 1 ? 'Permiso de ubicación denegado' : 'No se pudo obtener la ubicación') },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ===== NOTA DE VOZ =====
  const tipoAudioSoportado = () => {
    const tipos = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg;codecs=opus', 'audio/mpeg']
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return ''
    return tipos.find((t) => MediaRecorder.isTypeSupported(t)) || ''
  }

  const iniciarGrab = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { avisar('Tu navegador no permite grabar'); return }
    if (typeof window !== 'undefined' && !window.isSecureContext) { avisar('Grabar voz necesita https'); return }
    // 1) Pedir permiso PRIMERO y esperar a que el usuario acepte
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') avisar('Activa el permiso del micrófono')
      else if (e?.name === 'NotFoundError') avisar('No se encontró micrófono')
      else avisar('No se pudo abrir el micrófono')
      return
    }
    // 2) Ya con permiso, ahora sí grabamos
    try {
      const mime = tipoAudioSoportado()
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      const chunks = []
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const dur = grabRef.current?.dur || 0
        const cancelar = grabRef.current?.cancelar
        grabRef.current = null
        if (cancelar) return
        if (!chunks.length) { avisar('No se grabó audio'); return }
        const tipoReal = mr.mimeType || mime || 'audio/webm'
        const ext = (tipoReal.includes('mp4') || tipoReal.includes('aac') || tipoReal.includes('mpeg')) ? 'm4a' : tipoReal.includes('ogg') ? 'ogg' : 'webm'
        const blob = new Blob(chunks, { type: tipoReal })
        setSubiendo(true)
        const url = await subirArchivo(blob, ext, tipoReal)
        if (url) await mandar({ tipo: 'voz', adjunto_url: url, adjunto_meta: { dur } })
        setSubiendo(false)
      }
      grabRef.current = { mr, stream, dur: 0, cancelar: false }
      mr.start()
      setGrabando(true); setSegGrab(0)
      grabTimer.current = setInterval(() => { setSegGrab((s) => { const n = s + 1; if (grabRef.current) grabRef.current.dur = n; return n }) }, 1000)
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop())
      avisar('No se pudo grabar')
    }
  }
  const detenerGrab = (cancelar) => {
    clearInterval(grabTimer.current)
    setGrabando(false)
    if (grabRef.current) { grabRef.current.cancelar = cancelar; try { grabRef.current.mr.stop() } catch (e) {} }
  }

  const wrap = { minHeight: '100vh', fontFamily: font, color: T.textoBody, position: 'relative', background: T.fondo }
  const Velo = () => (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: T.veloGrad }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 55% 40% at 50% 12%, ${T.glow}, transparent 70%)` }} />
    </>
  )
  const nombreDe = (p) => p ? `${p.nombre || ''}${p.apellido ? ' ' + p.apellido : ''}`.trim() || 'Jugador' : 'Jugador'

  const css = `
    @keyframes mcMsgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes mcDot { 0%,60%,100% { opacity:.3; transform: translateY(0);} 30% { opacity:1; transform: translateY(-3px);} }
    @keyframes mcSheetUp { from { transform: translateY(100%);} to { transform: translateY(0);} }
    @keyframes mcPop { from { opacity:0; transform: scale(.85);} to { opacity:1; transform: scale(1);} }
    @keyframes mcPulse { 0%,100% { opacity:1;} 50% { opacity:.4;} }
    .mc-msg { animation: mcMsgIn .22s ease both; }
    .mc-scroll::-webkit-scrollbar { width: 0; }
    .mc-scroll { overscroll-behavior: contain; -webkit-overflow-scrolling: touch; touch-action: pan-y; }
    html.mc-chat-lock { height: 100%; overflow: hidden; overscroll-behavior: none; }
    body.mc-chat-lock { position: fixed; inset: 0; width: 100%; height: 100%; overflow: hidden; overscroll-behavior: none; }
  `

  // ====== VISTA: CONVERSACIÓN ======
  if (vistaChat) {
    const render = []
    let diaPrev = null
    const visibles = mensajes.filter((m) => !(m.oculto_para || []).includes(yo))
    visibles.forEach((m, i) => {
      const dia = diaLabel(m.creado_en)
      if (dia !== diaPrev) { render.push({ k: 'd' + i, tipo: 'dia', label: dia }); diaPrev = dia }
      const prev = visibles[i - 1], next = visibles[i + 1]
      const primero = !prev || prev.de_id !== m.de_id || diaLabel(prev.creado_en) !== dia
      const ultimo = !next || next.de_id !== m.de_id || diaLabel(next.creado_en) !== dia
      render.push({ k: m.id, tipo: 'msg', m, primero, ultimo })
    })

    const burbuja = (m, primero, ultimo) => {
      const mio = m.de_id === yo
      if (m.borrado_todos) {
        const radio = mio ? '16px 16px 5px 16px' : '16px 16px 16px 5px'
        return (
          <div className="mc-msg" style={{ display: 'flex', justifyContent: mio ? 'flex-end' : 'flex-start', marginTop: primero ? 7 : 2 }}>
            <div {...handlersPresion(m)} style={{ cursor: 'pointer', maxWidth: '78%', padding: '8px 12px', borderRadius: radio, background: mio ? T.burbujaMia : T.burbujaOtro, opacity: 0.65, color: mio ? T.burbujaMiaTexto : T.burbujaOtroTexto, border: !mio && T.esClaro ? `1px solid ${T.tarjetaBorde}` : 'none', display: 'flex', alignItems: 'center', gap: 7, fontStyle: 'italic', fontSize: 13.5 }}>
              🚫 Este mensaje fue eliminado
            </div>
          </div>
        )
      }
      const orig = m.responde_a ? mensajes.find((x) => x.id === m.responde_a) : null
      const reacs = m.reacciones || {}
      const listaReacs = Object.values(reacs)
      const radio = mio
        ? `16px 16px ${ultimo ? '5px' : '16px'} 16px`
        : `16px 16px 16px ${ultimo ? '5px' : '16px'}`
      return (
        <div className="mc-msg" style={{ display: 'flex', justifyContent: mio ? 'flex-end' : 'flex-start', marginTop: primero ? 7 : 2, marginBottom: listaReacs.length ? 12 : 0 }}>
          <div style={{ position: 'relative', maxWidth: '78%' }}>
            <div id={`msg-${m.id}`} {...handlersPresion(m)} style={{ cursor: 'pointer', WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none', padding: m.tipo === 'foto' ? 4 : '8px 12px', borderRadius: radio, background: mio ? T.burbujaMia : T.burbujaOtro, color: mio ? T.burbujaMiaTexto : T.burbujaOtroTexto, border: !mio && T.esClaro ? `1px solid ${T.tarjetaBorde}` : 'none', boxShadow: '0 2px 8px rgba(0,0,0,.14)' }}>
              {orig && (
                <div style={{ borderLeft: `3px solid ${mio ? 'rgba(0,0,0,.35)' : T.acento}`, padding: '4px 8px', margin: '0 0 5px', borderRadius: 6, background: mio ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.06)', fontSize: 12.5 }}>
                  <div style={{ fontWeight: 800, opacity: .85, marginBottom: 1 }}>{orig.de_id === yo ? 'Tú' : nombreDe(perfilOtro)}</div>
                  <div style={{ opacity: .8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{resumenMsg(orig)}</div>
                </div>
              )}

              {m.tipo === 'foto' && m.adjunto_url && (
                <img src={m.adjunto_url} alt="foto" style={{ display: 'block', maxWidth: 240, width: '100%', borderRadius: 12, marginBottom: m.texto ? 6 : 0 }} />
              )}
              {m.tipo === 'voz' && m.adjunto_url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180 }}>
                  <span style={{ fontSize: 18 }}>🎤</span>
                  <audio controls src={m.adjunto_url} style={{ height: 34, maxWidth: 190 }} />
                </div>
              )}
              {m.tipo === 'ubicacion' && m.adjunto_meta && (
                <a href={`https://maps.google.com/?q=${m.adjunto_meta.lat},${m.adjunto_meta.lng}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', minWidth: 180 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: mio ? 'rgba(0,0,0,.15)' : 'rgba(255,255,255,.08)', display: 'grid', placeItems: 'center', fontSize: 20 }}>📍</div>
                  <div><div style={{ fontWeight: 800, fontSize: 14 }}>Ubicación</div><div style={{ fontSize: 11.5, opacity: .75, textDecoration: 'underline' }}>Abrir en el mapa</div></div>
                </a>
              )}
              {m.texto && (m.tipo === 'texto' || m.tipo === 'foto') && (
                <div style={{ fontSize: 14.5, lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'pre-wrap', padding: m.tipo === 'foto' ? '0 6px 4px' : 0 }}>{m.texto}</div>
              )}
              <div style={{ fontSize: 9.5, opacity: 0.65, textAlign: 'right', marginTop: 3, padding: m.tipo === 'foto' ? '0 6px 2px' : 0 }}>{horaCorta(m.creado_en)}{mio ? (m.leido ? ' ✓✓' : ' ✓') : ''}</div>
            </div>

            {listaReacs.length > 0 && (
              <div style={{ position: 'absolute', bottom: -11, [mio ? 'right' : 'left']: 8, display: 'flex', alignItems: 'center', gap: 1, background: T.esClaro ? '#fff' : '#222', border: `1px solid ${T.tarjetaBorde}`, borderRadius: 11, padding: '1px 5px', fontSize: 12, boxShadow: '0 2px 6px rgba(0,0,0,.25)' }}>
                {[...new Set(listaReacs)].slice(0, 3).map((e, i) => <span key={i}>{e}</span>)}
                {listaReacs.length > 1 && <span style={{ fontSize: 10, color: T.tenue, fontWeight: 700, marginLeft: 2 }}>{listaReacs.length}</span>}
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div style={{ fontFamily: font, color: T.textoBody, background: T.fondo, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', touchAction: 'none' }}>
        <style>{css}</style>
        <Velo />

        {/* header (FIJO arriba) */}
        <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, background: T.navDorada, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 16px rgba(156,101,24,.3)' }}>
          <span onClick={() => { setVistaChat(null); setMensajes([]); setPerfilOtro(null) }} style={{ color: '#2a1c08', fontWeight: 800, fontSize: 19, cursor: 'pointer', lineHeight: 1 }}>←</span>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: perfilOtro?.foto_url ? `url(${perfilOtro.foto_url}) center/cover` : 'rgba(42,28,8,.25)', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800, color: '#2a1c08', flexShrink: 0 }}>{!perfilOtro?.foto_url && nombreDe(perfilOtro).slice(0, 1).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#2a1c08', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreDe(perfilOtro)}</div>
            <div style={{ fontSize: 11.5, color: '#4a3410', fontWeight: 600, height: 14 }}>
              {otroEscribiendo ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>escribiendo
                  <span style={{ display: 'inline-flex', gap: 2 }}>
                    {[0, 1, 2].map((i) => <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#4a3410', animation: `mcDot 1.2s ${i * 0.2}s infinite` }} />)}
                  </span>
                </span>
              ) : ''}
            </div>
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <span onClick={() => setMenuHeader((v) => !v)} style={{ color: '#2a1c08', fontWeight: 800, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>⋮</span>
            {menuHeader && (
              <>
                <div onClick={() => setMenuHeader(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
                <div style={{ position: 'absolute', top: '120%', right: 0, zIndex: 10, minWidth: 200, background: T.sheetBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>
                  <div onClick={() => { setMenuHeader(false); setConfirmarVaciar(true) }} style={{ padding: '13px 16px', fontSize: 14, fontWeight: 600, color: '#e0563f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>🗑 Vaciar conversación</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* barra de mensaje fijado */}
        {(() => {
          const fijo = mensajes.find((x) => x.fijado && !x.borrado_todos && !(x.oculto_para || []).includes(yo))
          if (!fijo) return null
          return (
            <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: T.esClaro ? 'rgba(255,255,255,.92)' : 'rgba(18,20,24,.96)', borderBottom: `1px solid ${T.tarjetaBorde}` }}>
              <span style={{ fontSize: 15 }}>📌</span>
              <div onClick={() => document.getElementById(`msg-${fijo.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: T.acento, textTransform: 'uppercase', letterSpacing: 0.4 }}>Mensaje fijado</div>
                <div style={{ fontSize: 12.5, color: T.textoBody, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resumenMsg(fijo)}</div>
              </div>
              <span onClick={() => fijar(fijo, false)} style={{ fontSize: 18, color: T.tenue, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>×</span>
            </div>
          )
        })()}

        {/* mensajes (lo ÚNICO que corre, por dentro) */}
        <div className="mc-scroll" style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 14px 6px' }}>
          {mensajes.length === 0 ? (
            <div style={{ margin: '40px auto', textAlign: 'center', color: T.tenue, fontSize: 13.5, maxWidth: 240 }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>💬</div>
              Escríbele el primer mensaje a {nombreDe(perfilOtro)}.
            </div>
          ) : render.map((it) => it.tipo === 'dia' ? (
            <div key={it.k} style={{ textAlign: 'center', margin: '14px 0 8px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.tenue, background: T.esClaro ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.07)', padding: '3px 12px', borderRadius: 20 }}>{it.label}</span>
            </div>
          ) : <div key={it.k}>{burbuja(it.m, it.primero, it.ultimo)}</div>)}
          <div ref={finRef} />
        </div>

        {/* barra de responder */}
        {respondeA && (
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: T.esClaro ? 'rgba(255,255,255,.9)' : 'rgba(8,9,12,.92)', borderTop: `1px solid ${T.tarjetaBorde}` }}>
            <div style={{ width: 3, alignSelf: 'stretch', background: T.acento, borderRadius: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.acento }}>Respondiendo a {respondeA.de_id === yo ? 'ti' : nombreDe(perfilOtro)}</div>
              <div style={{ fontSize: 12.5, color: T.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resumenMsg(respondeA)}</div>
            </div>
            <span onClick={() => setRespondeA(null)} style={{ fontSize: 20, color: T.tenue, cursor: 'pointer', lineHeight: 1 }}>×</span>
          </div>
        )}

        {/* panel de emojis pro (cuero + oro) */}
        {emojiAbierto && !grabando && (
          <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, height: 'min(40dvh, 280px)', background: T.sheetBg, borderTop: `1px solid ${T.tarjetaBorde}`, display: 'flex', flexDirection: 'column' }}>
            <div className="mc-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 8px', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, alignContent: 'start' }}>
              {CATS_EMOJI[catEmoji].map((e, i) => (
                <button key={i} onClick={() => insertarEmoji(e)} style={{ background: 'transparent', border: 'none', fontSize: 25, cursor: 'pointer', padding: 5, borderRadius: 9, lineHeight: 1 }}>{e}</button>
              ))}
            </div>
            <div style={{ display: 'flex', borderTop: `1px solid ${T.tarjetaBorde}`, padding: '6px 8px', gap: 4 }}>
              {Object.keys(CATS_EMOJI).map((k) => (
                <button key={k} onClick={() => setCatEmoji(k)} style={{ flex: 1, background: catEmoji === k ? T.boton : 'transparent', color: catEmoji === k ? '#1a1205' : T.tenue, border: 'none', borderRadius: 10, padding: '8px 0', fontSize: 19, cursor: 'pointer', transition: 'all .12s' }}>{ICONO_CAT[k]}</button>
              ))}
            </div>
          </div>
        )}

        {/* input / grabación */}
        {grabando ? (
          <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, padding: '12px 14px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', background: T.esClaro ? 'rgba(255,255,255,.92)' : 'rgba(8,9,12,.94)', borderTop: `1px solid ${T.tarjetaBorde}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span onClick={() => detenerGrab(true)} style={{ fontSize: 22, color: '#e0563f', cursor: 'pointer' }}>🗑</span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e0563f', animation: 'mcPulse 1s infinite' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: T.textoFuerte, fontFamily: 'ui-monospace, monospace' }}>{Math.floor(segGrab / 60)}:{(segGrab % 60).toString().padStart(2, '0')}</span>
              <span style={{ fontSize: 12.5, color: T.tenue }}>Grabando nota de voz…</span>
            </div>
            <button onClick={() => detenerGrab(false)} style={{ width: 46, height: 46, borderRadius: '50%', border: 'none', background: T.boton, color: '#1a1205', fontSize: 19, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>➤</button>
          </div>
        ) : (
          <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, padding: '10px 10px', paddingBottom: emojiAbierto ? '10px' : 'calc(10px + env(safe-area-inset-bottom))', background: T.esClaro ? 'rgba(255,255,255,.88)' : 'rgba(8,9,12,.92)', borderTop: `1px solid ${T.tarjetaBorde}`, display: 'flex', alignItems: 'flex-end', gap: 6, backdropFilter: 'blur(10px)', touchAction: 'auto' }}>
            <button onClick={() => setMenuCompartir(true)} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', border: `1px solid ${T.tarjetaBorde}`, background: 'transparent', color: T.acento, fontSize: 21, cursor: 'pointer', display: 'grid', placeItems: 'center', lineHeight: 1 }}>+</button>
            <button onClick={toggleEmoji} title="Emojis" style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', border: `1px solid ${emojiAbierto ? T.acento : T.tarjetaBorde}`, background: emojiAbierto ? `${T.acento}22` : 'transparent', color: T.acento, fontSize: 20, cursor: 'pointer', display: 'grid', placeItems: 'center', lineHeight: 1 }}>{emojiAbierto ? '⌨️' : '😀'}</button>
            <textarea
              ref={inputRef}
              value={texto}
              onChange={(e) => { setTexto(e.target.value); avisarTyping() }}
              onFocus={() => { setEmojiAbierto(false); irAbajoSuave() }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarTexto() } }}
              placeholder="Escribe un mensaje…"
              rows={1}
              style={{ flex: 1, minWidth: 0, resize: 'none', maxHeight: 110, background: T.inputBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 20, padding: '10px 14px', color: T.textoFuerte, fontSize: 16, outline: 'none', fontFamily: font, lineHeight: 1.35 }}
            />
            {texto.trim() ? (
              <button onMouseDown={(e) => e.preventDefault()} onClick={enviarTexto} disabled={enviando} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', border: 'none', background: T.boton, color: '#1a1205', fontSize: 18, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>➤</button>
            ) : (
              <button onClick={iniciarGrab} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', border: 'none', background: T.boton, color: '#1a1205', fontSize: 19, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>🎤</button>
            )}
          </div>
        )}

        <input ref={fotoInputRef} type="file" accept="image/*" onChange={alSeleccionarFoto} style={{ display: 'none' }} />

        {subiendo && (
          <div style={{ position: 'fixed', left: '50%', bottom: 90, transform: 'translateX(-50%)', zIndex: 40, background: T.acentoSolido, color: '#1a1205', fontWeight: 800, fontSize: 12.5, padding: '8px 16px', borderRadius: 20 }}>Subiendo…</div>
        )}
        {toast && (
          <div style={{ position: 'fixed', left: '50%', bottom: 90, transform: 'translateX(-50%)', zIndex: 40, background: '#e0563f', color: '#fff', fontWeight: 700, fontSize: 12.5, padding: '8px 16px', borderRadius: 20 }}>{toast}</div>
        )}

        {/* menú de acciones de mensaje (reacciones + responder + eliminar) */}
        {selMsg && (
          <div onClick={() => setSelMsg(null)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(4,5,7,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ animation: 'mcPop .18s ease both', width: '100%', maxWidth: 320 }}>
              {!selMsg.borrado_todos && (
                <div style={{ display: 'flex', justifyContent: 'space-around', background: T.sheetBg, borderRadius: 28, padding: '10px 8px', marginBottom: 10, boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>
                  {EMOJIS.map((e) => (
                    <span key={e} onClick={() => reaccionar(selMsg, e)} style={{ fontSize: 27, cursor: 'pointer', transition: 'transform .1s', padding: 2 }}>{e}</span>
                  ))}
                </div>
              )}
              <div style={{ background: T.sheetBg, borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>
                {!selMsg.borrado_todos && <div onClick={() => { setRespondeA(selMsg); setSelMsg(null) }} style={{ padding: '14px 18px', fontSize: 14.5, fontWeight: 600, color: T.textoBody, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${T.tarjetaBorde}` }}>↩️ Responder</div>}
                {!selMsg.borrado_todos && selMsg.texto && <div onClick={() => { navigator.clipboard?.writeText(selMsg.texto); setSelMsg(null); avisar('Copiado') }} style={{ padding: '14px 18px', fontSize: 14.5, fontWeight: 600, color: T.textoBody, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${T.tarjetaBorde}` }}>📋 Copiar</div>}
                {!selMsg.borrado_todos && (
                  <div onClick={() => fijar(selMsg, !selMsg.fijado)} style={{ padding: '14px 18px', fontSize: 14.5, fontWeight: 600, color: T.textoBody, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${T.tarjetaBorde}` }}>📌 {selMsg.fijado ? 'Quitar fijado' : 'Fijar mensaje'}</div>
                )}
                {selMsg.de_id === yo && !selMsg.borrado_todos && menos24h(selMsg) && (
                  <div onClick={() => borrarParaTodos(selMsg)} style={{ padding: '14px 18px', fontSize: 14.5, fontWeight: 600, color: '#e0563f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${T.tarjetaBorde}` }}>🚫 Eliminar para todos</div>
                )}
                <div onClick={() => borrarParaMi(selMsg)} style={{ padding: '14px 18px', fontSize: 14.5, fontWeight: 600, color: '#e0563f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>🗑 Eliminar para mí</div>
              </div>
            </div>
          </div>
        )}

        {/* confirmar vaciar conversación */}
        {confirmarVaciar && (
          <div onClick={() => setConfirmarVaciar(false)} style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(4,5,7,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ animation: 'mcPop .18s ease both', width: '100%', maxWidth: 320, background: T.sheetBg, borderRadius: 18, padding: 22, boxShadow: '0 10px 30px rgba(0,0,0,.45)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.textoFuerte, marginBottom: 8 }}>Vaciar conversación</div>
              <div style={{ fontSize: 13.5, color: T.tenue, lineHeight: 1.5, marginBottom: 20 }}>Se borrará toda esta conversación de tu lado. La otra persona la seguirá viendo. Esto no se puede deshacer.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <button onClick={vaciarChat} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 13, background: '#e0563f', color: '#fff', fontWeight: 800, fontSize: 14.5, cursor: 'pointer' }}>Sí, vaciar</button>
                <button onClick={() => setConfirmarVaciar(false)} style={{ width: '100%', border: `1px solid ${T.tarjetaBorde}`, borderRadius: 12, padding: 12, background: 'transparent', color: T.textoBody, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* menú de compartir (+) */}
        {menuCompartir && (
          <div onClick={() => setMenuCompartir(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(4,5,7,.55)', display: 'flex', alignItems: 'flex-end' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ animation: 'mcSheetUp .25s ease both', width: '100%', background: T.sheetBg, borderRadius: '22px 22px 0 0', padding: '12px 18px calc(24px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 30px rgba(0,0,0,.4)' }}>
              <div style={{ width: 42, height: 5, borderRadius: 3, background: T.tarjetaBorde, margin: '0 auto 16px' }} />
              <div style={{ fontSize: 13, fontWeight: 800, color: T.tenue, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Compartir</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { ic: '📷', t: 'Foto', on: elegirFoto, listo: true },
                  { ic: '📍', t: 'Ubicación', on: compartirUbicacion, listo: true },
                  { ic: '🎤', t: 'Voz', on: () => { setMenuCompartir(false); iniciarGrab() }, listo: true },
                  { ic: '🔴', t: 'Juego vivo', on: () => avisar('Pronto'), listo: false },
                  { ic: '🏀', t: 'Resultado', on: () => avisar('Pronto'), listo: false },
                  { ic: '👤', t: 'Perfil', on: () => avisar('Pronto'), listo: false },
                  { ic: '🏆', t: 'Torneo', on: () => avisar('Pronto'), listo: false },
                  { ic: '📊', t: 'Encuesta', on: () => avisar('Pronto'), listo: false },
                ].map((o) => (
                  <button key={o.t} onClick={o.on} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: o.listo ? 1 : 0.55 }}>
                    <span style={{ width: 56, height: 56, borderRadius: 16, background: o.listo ? T.boton : T.tarjetaBg, border: o.listo ? 'none' : `1px solid ${T.tarjetaBorde}`, display: 'grid', placeItems: 'center', fontSize: 24 }}>{o.ic}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: T.textoBody }}>{o.t}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ====== VISTA: INBOX ======
  const convsFiltradas = convs.filter((c) => {
    if (!buscaInbox.trim()) return true
    const p = perfilesMap[c.otroId]
    return nombreDe(p).toLowerCase().includes(buscaInbox.toLowerCase())
  })

  return (
    <div style={wrap}>
      <style>{css}</style>
      <Velo />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 620, margin: '0 auto', padding: '16px 16px 50px' }}>
        <div style={{ background: T.navDorada, borderRadius: 14, padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, boxShadow: '0 6px 18px rgba(156,101,24,.3)' }}>
          <span onClick={() => onVolver && onVolver()} style={{ color: '#2a1c08', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Volver</span>
          <span style={{ color: '#2a1c08', fontWeight: 800, fontSize: 14 }}>✉️ Mensajes</span>
          <span style={{ width: 40 }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <input value={buscaInbox} onChange={(e) => setBuscaInbox(e.target.value)} placeholder="🔍 Buscar conversación" style={{ width: '100%', boxSizing: 'border-box', background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 12, padding: '11px 14px', color: T.textoFuerte, fontSize: 14, outline: 'none', fontFamily: font }} />
        </div>

        {cargandoInbox ? (
          <div style={{ textAlign: 'center', padding: '40px', color: T.tenue, fontSize: 14 }}>Cargando…</div>
        ) : convsFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: T.tenue }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>💬</div>
            <div style={{ fontSize: 14.5, lineHeight: 1.5 }}>{buscaInbox ? 'Nada con ese nombre.' : <>Todavía no tienes conversaciones.<br />Busca a un jugador y escríbele.</>}</div>
          </div>
        ) : (
          convsFiltradas.map((c) => {
            const p = perfilesMap[c.otroId]
            const nom = nombreDe(p)
            const ultimoMio = c.ultimo.de_id === yo
            const prev = c.ultimo.tipo && c.ultimo.tipo !== 'texto' ? resumenMsg(c.ultimo) : c.ultimo.texto
            return (
              <div key={c.otroId} onClick={() => setVistaChat(c.otroId)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 14, marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', flexShrink: 0, background: p?.foto_url ? `url(${p.foto_url}) center/cover` : T.avatar, display: 'grid', placeItems: 'center', fontSize: 19, fontWeight: 800, color: T.avatarTexto }}>{!p?.foto_url && nom.slice(0, 1).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nom}</span>
                    <span style={{ fontSize: 11, color: T.tenue, flexShrink: 0 }}>{fechaCorta(c.ultimo.creado_en)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 12.5, color: c.noLeidos > 0 ? T.textoBody : T.tenue, fontWeight: c.noLeidos > 0 ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ultimoMio ? 'Tú: ' : ''}{prev}</span>
                    {c.noLeidos > 0 && <span style={{ flexShrink: 0, minWidth: 20, height: 20, borderRadius: 10, background: '#e0563f', color: '#fff', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center', padding: '0 6px' }}>{c.noLeidos}</span>}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}