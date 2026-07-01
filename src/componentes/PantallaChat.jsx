import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { miUsuarioId } from '../social'
import { leerConversacion, marcarLeido, listaConversaciones, perfilesDe } from '../mensajes'
import { misGrupos } from '../grupos'
import ResultadoEnChat from './ResultadoEnChat'
import FichaEnChat from './FichaEnChat'
import NoticiaEnChat from './NoticiaEnChat'
import fondoCancha from '../assets/fondo-cancha.png'
import { Capacitor } from '@capacitor/core'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'
import { VoiceRecorder } from '@independo/capacitor-voice-recorder'

const TEMAS = {
  dorado: { esClaro: false, acento: '#e8b65a', acentoSolido: '#d99f3e', fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', avatar: 'linear-gradient(150deg, #e0b057, #9a6420)', avatarTexto: '#241a07', tarjetaBg: 'rgba(20,22,26,.72)', tarjetaBorde: 'rgba(255,255,255,.08)', inputBg: 'rgba(12,14,18,0.7)', burbujaMia: 'linear-gradient(150deg, #f3cf63, #c8842e)', burbujaMiaTexto: '#1a1205', burbujaOtro: 'rgba(40,43,48,.95)', burbujaOtroTexto: '#eef3f6', glow: 'rgba(190,135,55,0.18)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.84), rgba(8,9,12,0.92))', sheetBg: 'rgba(18,20,24,0.98)' },
  azul: { esClaro: false, acento: '#6fb0ec', acentoSolido: '#4f8fd0', fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', avatar: 'linear-gradient(150deg, #5aa0e0, #1d4a80)', avatarTexto: '#08151f', tarjetaBg: 'rgba(20,22,26,.72)', tarjetaBorde: 'rgba(255,255,255,.08)', inputBg: 'rgba(12,14,18,0.7)', burbujaMia: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', burbujaMiaTexto: '#08151f', burbujaOtro: 'rgba(40,43,48,.95)', burbujaOtroTexto: '#eef3f6', glow: 'rgba(55,120,190,0.2)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.84), rgba(8,9,12,0.92))', sheetBg: 'rgba(18,20,24,0.98)' },
  claro: { esClaro: true, acento: '#b07a26', acentoSolido: '#b07a26', fondo: '#e6dcc8', textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58', boton: 'linear-gradient(150deg, #e7c069, #b07a26)', avatar: 'linear-gradient(150deg, #e7c069, #a9741f)', avatarTexto: '#3a2806', tarjetaBg: '#fff', tarjetaBorde: '#e0e3e8', inputBg: '#fff', burbujaMia: 'linear-gradient(150deg, #e7c069, #b07a26)', burbujaMiaTexto: '#2a1c06', burbujaOtro: '#fff', burbujaOtroTexto: '#2a2014', glow: 'rgba(190,135,55,0.10)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(235,228,212,0.86), rgba(228,220,200,0.92))', sheetBg: 'rgba(252,249,243,0.99)' },
  larimar: { esClaro: true, acento: '#2a8fb8', acentoSolido: '#2a8fb8', fondo: '#d6e7e8', textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375', boton: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', avatar: 'linear-gradient(150deg, #4aafc8, #1a6a8a)', avatarTexto: '#04121f', tarjetaBg: '#fff', tarjetaBorde: '#cfe0e2', inputBg: '#fff', burbujaMia: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', burbujaMiaTexto: '#04121f', burbujaOtro: '#fff', burbujaOtroTexto: '#1c2624', glow: 'rgba(42,143,184,0.12)', navDorada: 'linear-gradient(180deg,#6ac0d8,#2a8fb8 55%,#1a6a8a)', veloGrad: 'linear-gradient(180deg, rgba(214,231,232,0.86), rgba(214,231,232,0.92))', sheetBg: 'rgba(245,251,252,0.99)' },
}

const EMOJIS = ['🔥', '🏀', '😂', '👏', '😮', '💪']

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
  if (m.tipo === 'resultado') {
    let d = m.adjunto_meta
    if (typeof d === 'string') { try { d = JSON.parse(d) } catch (e) { d = null } }
    if (d && d.tipo === 'ficha') return `🏀 Ficha · ${d.nombre || 'jugador'}`
    if (d && d.tipo === 'noticia') return `🏀 Noticia · ${(d.titulo || '').slice(0, 40)}`
    if (d && d.nombreA && d.nombreB) {
      return `🏀 ${d.nombreA} ${d.totalA != null ? d.totalA : ''}-${d.totalB != null ? d.totalB : ''} ${d.nombreB}`
    }
    return '🏀 Resultado de juego'
  }
  if (m.tipo === 'voz') return '🎤 Nota de voz'
  if (m.tipo === 'ubicacion') return '📍 Ubicación'
  return m.texto || 'Mensaje'
}

// Reproductor de voz propio: botón play/pausa que controla un Audio por JS.
// No usa <audio controls> del sistema (que falla en Capacitor iOS) y detiene
// la propagación del toque para no abrir el menú del mensaje.
function ReproductorVoz({ src, dur, mio, id, activa, siguienteId, onActivar, onTerminar }) {
  const audioRef = useRef(null)
  const [pos, setPos] = useState(0)
  const [total, setTotal] = useState(dur || 0)
  const sonando = activa === id

  useEffect(() => {
    const a = new Audio(src)
    audioRef.current = a
    a.preload = 'metadata'
    const onMeta = () => { if (a.duration && isFinite(a.duration)) setTotal(Math.round(a.duration)) }
    const onTime = () => setPos(a.currentTime || 0)
    const onEnd = () => { setPos(0); a.currentTime = 0; onTerminar && onTerminar(id, siguienteId) }
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnd)
    return () => {
      a.pause()
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('ended', onEnd)
      audioRef.current = null
    }
  }, [src, id, siguienteId])

  // Reacciona al control central: si esta nota es la activa, suena; si no, se pausa.
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (sonando) { a.play().catch(() => onActivar && onActivar(null)) }
    else { a.pause() }
  }, [sonando])

  const alternar = (e) => {
    e.stopPropagation()
    if (sonando) { onActivar && onActivar(null) }
    else { onActivar && onActivar(id) }
  }

  const fmt = (s) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); const seg = s % 60; return `${m}:${seg.toString().padStart(2, '0')}` }
  const pct = total > 0 ? Math.min(100, (pos / total) * 100) : 0
  const colorBtn = mio ? '#1a1205' : '#f3cf63'
  const colorBarra = mio ? 'rgba(26,18,5,.25)' : 'rgba(243,207,99,.25)'
  const colorRelleno = mio ? '#1a1205' : '#f3cf63'

  return (
    <div onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180, padding: '2px 0' }}>
      <button onClick={alternar} onTouchEnd={alternar} style={{ flexShrink: 0, width: 38, height: 38, borderRadius: '50%', border: 'none', background: mio ? 'rgba(26,18,5,.18)' : 'rgba(243,207,99,.18)', color: colorBtn, fontSize: 16, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>{sonando ? '⏸' : '▶'}</button>
      <div style={{ flex: 1, minWidth: 90 }}>
        <div style={{ height: 4, borderRadius: 3, background: colorBarra, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: colorRelleno, borderRadius: 3, transition: 'width .15s linear' }} />
        </div>
        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>{fmt(sonando || pos ? pos : total)}</div>
      </div>
    </div>
  )
}


export default function PantallaChat({ abrirCon, onVolver, onVerPerfil, onAbrirGrupo, onCrearGrupo }) {
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
  const [grupos, setGrupos] = useState([])
  const [perfilesMap, setPerfilesMap] = useState({})
  const [cargandoInbox, setCargandoInbox] = useState(true)
  const [buscaInbox, setBuscaInbox] = useState('')

  const [mensajes, setMensajes] = useState([])
  const [perfilOtro, setPerfilOtro] = useState(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [respondeA, setRespondeA] = useState(null)
  const [selMsg, setSelMsg] = useState(null)
  const [vozActiva, setVozActiva] = useState(null)
  const [editando, setEditando] = useState(null)
  const [menuHeader, setMenuHeader] = useState(false)
  const [confirmarVaciar, setConfirmarVaciar] = useState(false)
  const [otroEscribiendo, setOtroEscribiendo] = useState(false)
  const [menuCompartir, setMenuCompartir] = useState(false)
  const [grabando, setGrabando] = useState(false)
  const [segGrab, setSegGrab] = useState(0)
  const [subiendo, setSubiendo] = useState(false)
  const [fotoPrevia, setFotoPrevia] = useState(null)
  const [fotoAmpliada, setFotoAmpliada] = useState(null)
  const [vozPrevia, setVozPrevia] = useState(null)
  const [toast, setToast] = useState('')
  const [emojiAbierto, setEmojiAbierto] = useState(false)
  const [catEmoji, setCatEmoji] = useState('Básquet')
  const [kbAlto, setKbAlto] = useState(0)
  const ajusteTeclado = 30
  const inputRef = useRef(null)

  useEffect(() => {
    if (!vistaChat) return
    const html = document.documentElement, body = document.body
    html.classList.add('mc-chat-lock'); body.classList.add('mc-chat-lock')
    return () => { html.classList.remove('mc-chat-lock'); body.classList.remove('mc-chat-lock') }
  }, [vistaChat])

  // ===== TECLADO FLUIDO (mismo motor que los comentarios de la pantalla pública) =====
  useEffect(() => {
    if (!vistaChat) return
    if (!Capacitor?.isNativePlatform?.()) return
    let subShow, subHide
    Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {})
    Keyboard.addListener('keyboardWillShow', (info) => setKbAlto(info?.keyboardHeight || 0)).then((s) => { subShow = s }).catch(() => {})
    Keyboard.addListener('keyboardWillHide', () => setKbAlto(0)).then((s) => { subHide = s }).catch(() => {})
    return () => {
      try { subShow?.remove?.() } catch (e) {}
      try { subHide?.remove?.() } catch (e) {}
      setKbAlto(0)
      Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {})
    }
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

  useEffect(() => { if (typeof window !== 'undefined') { (async () => setYo(await miUsuarioId()))() } }, [])

  const irAbajo = (b = 'smooth') => setTimeout(() => finRef.current?.scrollIntoView({ behavior: b, block: 'end' }), 80)
  const irAbajoSuave = () => { [50, 150, 300].forEach((ms) => setTimeout(() => finRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' }), ms)) }
  const avisar = (t) => { setToast(t); clearTimeout(toastRef.current); toastRef.current = setTimeout(() => setToast(''), 1800) }

  // ===== INBOX =====
  const cargarInbox = async () => {
    setCargandoInbox(true)
    const lista = await listaConversaciones()
    setConvs(lista)
    const ids = lista.map((c) => c.otroId)
    if (ids.length) setPerfilesMap(await perfilesDe(ids))
    const { grupos: gs } = await misGrupos()
    setGrupos(gs || [])
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
    // La columna "texto" no admite null NI vacío (tiene un check). Para adjuntos
    // sin comentario, mandamos un espacio para cumplir la restricción.
    const hayCuerpo = cuerpo && cuerpo.trim().length > 0
    const textoSeguro = hayCuerpo ? cuerpo : ' '
    const fila = { de_id: yo, para_id: vistaChat, texto: textoSeguro, tipo, responde_a: respondeA?.id || null, adjunto_url, adjunto_meta }
    const { data, error } = await supabase.from('mensajes').insert(fila).select().single()
    if (error) {
      console.error('Mandar:', error)
      avisar('No se pudo enviar: ' + (error.message || 'error'))
      return
    }
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

  // ===== EDITAR (dentro de 3 horas) =====
  const menos3h = (m) => (Date.now() - new Date(m.creado_en).getTime()) < 3 * 60 * 60 * 1000
  const iniciarEdicion = (m) => {
    setSelMsg(null)
    setRespondeA(null)
    setEditando(m)
    setTexto((m.texto || '').trim())
    setTimeout(() => inputRef.current?.focus(), 100)
  }
  const cancelarEdicion = () => { setEditando(null); setTexto('') }
  const guardarEdicion = async () => {
    if (!editando || enviando) return
    const nuevo = texto.trim()
    if (!nuevo) { avisar('El mensaje no puede quedar vacío'); return }
    const id = editando.id
    setEnviando(true)
    const { error } = await supabase.from('mensajes').update({ texto: nuevo, editado: true }).eq('id', id)
    setEnviando(false)
    if (error) { console.error('Editar:', error); avisar('No se pudo editar: ' + (error.message || 'error')); return }
    setMensajes((prev) => prev.map((x) => x.id === id ? { ...x, texto: nuevo, editado: true } : x))
    setEditando(null); setTexto('')
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
    if (valor) {
      const otros = mensajes.filter((x) => x.fijado && x.id !== m.id)
      for (const o of otros) await supabase.rpc('fijar_mensaje', { msg_id: o.id, valor: false })
    }
    await supabase.rpc('fijar_mensaje', { msg_id: m.id, valor })
  }

  // ===== ACCIONES DE TOQUE =====
  const handlersPresion = (m) => ({
    onClick: () => setSelMsg(m),
    onContextMenu: (e) => { e.preventDefault(); setSelMsg(m) },
    onTouchStart: () => { presionTimer.current = setTimeout(() => setSelMsg(m), 420) },
    onTouchEnd: () => clearTimeout(presionTimer.current),
    onTouchMove: () => clearTimeout(presionTimer.current),
  })

  // Para tarjetas (resultado): el toque NO abre el menú (la tarjeta lo usa para desplegar).
  // El menú sale SOLO al dejar pisado (long-press).
  const handlersSoloPresion = (m) => ({
    onContextMenu: (e) => { e.preventDefault(); setSelMsg(m) },
    onTouchStart: () => { presionTimer.current = setTimeout(() => setSelMsg(m), 420) },
    onTouchEnd: () => clearTimeout(presionTimer.current),
    onTouchMove: () => clearTimeout(presionTimer.current),
  })

  // ===== ADJUNTOS =====
  const subirArchivo = async (blob, ext, contentType) => {
    try {
      // Aseguramos tener el id del usuario (puede no haber cargado aún)
      let quien = yo
      if (!quien) { quien = await miUsuarioId(); if (quien) setYo(quien) }
      if (!quien) { alert('CHIVATO: no hay sesión (yo = null). Cierra y abre sesión de nuevo.'); return null }

      const ruta = `${quien}/${Date.now()}.${ext}`

      // === Arreglo Capacitor: reconstruir un Blob limpio desde el binario puro ===
      // En móvil nativo, el File del input puede traer punteros rotos. Extraemos
      // los bytes con arrayBuffer y rearmamos un Blob que Supabase acepta bien.
      let archivoFinal
      if (blob instanceof File) {
        try {
          const buffer = await blob.arrayBuffer()
          archivoFinal = new Blob([buffer], { type: contentType || blob.type || 'application/octet-stream' })
        } catch (e2) {
          archivoFinal = new File([blob], `archivo.${ext}`, { type: contentType || 'application/octet-stream' })
        }
      } else {
        archivoFinal = blob
      }

      const subida = supabase.storage.from('chat').upload(ruta, archivoFinal, { contentType: contentType || archivoFinal.type || undefined, upsert: true })
      const limite = new Promise((resolve) => setTimeout(() => resolve({ error: { message: 'tardó demasiado (timeout 30s)' } }), 30000))
      const res = await Promise.race([subida, limite])
      const error = res?.error
      if (error) {
        console.error('Storage:', error)
        avisar('No se pudo subir: ' + (error.message || 'error'))
        return null
      }
      const { data } = supabase.storage.from('chat').getPublicUrl(ruta)
      return data?.publicUrl || null
    } catch (e) {
      console.error('Storage catch:', e)
      avisar('No se pudo subir: ' + (e?.message || 'error desconocido'))
      return null
    }
  }

  const elegirFoto = () => { setMenuCompartir(false); fotoInputRef.current?.click() }
  const alSeleccionarFoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    // No subimos todavía: la dejamos en vista previa para que el usuario
    // pueda escribirle un comentario y luego enviar (estilo WhatsApp).
    const previaUrl = URL.createObjectURL(file)
    setFotoPrevia({ file, previaUrl, nombre: file.name })
  }

  // Enviar la foto que está en vista previa (con o sin comentario)
  const enviarFotoPrevia = async () => {
    if (!fotoPrevia || subiendo) return
    const { file, previaUrl, nombre } = fotoPrevia
    const comentario = texto.trim()
    setSubiendo(true)
    try {
      const url = await subirArchivo(file, (file.name.split('.').pop() || 'jpg'), file.type)
      if (url) {
        await mandar({ tipo: 'foto', cuerpo: comentario, adjunto_url: url, adjunto_meta: { nombre } })
        setTexto('')
        setFotoPrevia(null)
        try { URL.revokeObjectURL(previaUrl) } catch (e2) {}
      }
    } finally {
      setSubiendo(false)
    }
  }

  const cancelarFotoPrevia = () => {
    if (fotoPrevia) { try { URL.revokeObjectURL(fotoPrevia.previaUrl) } catch (e) {} }
    setFotoPrevia(null)
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
    if (Capacitor?.isNativePlatform?.()) {
      try {
        const tiene = await VoiceRecorder.hasAudioRecordingPermission().catch(() => ({ value: false }))
        if (!tiene?.value) {
          const ped = await VoiceRecorder.requestAudioRecordingPermission()
          if (!ped?.value) { avisar('Activa el permiso del micrófono'); return }
        }
        await VoiceRecorder.startRecording()
        grabRef.current = { nativo: true, cancelar: false }
        setGrabando(true); setSegGrab(0)
        grabTimer.current = setInterval(() => setSegGrab((s) => s + 1), 1000)
      } catch (e) {
        console.error('VoiceRecorder start:', e)
        avisar('No se pudo iniciar: ' + (e?.message || e?.errorMessage || JSON.stringify(e) || 'error'))
      }
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { avisar('Tu navegador no permite grabar'); return }
    if (typeof window !== 'undefined' && !window.isSecureContext) { avisar('Grabar voz necesita https'); return }
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') avisar('Activa el permiso del micrófono')
      else if (e?.name === 'NotFoundError') avisar('No se encontró micrófono')
      else avisar('No se pudo abrir el micrófono')
      return
    }
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
        // Vista previa: el usuario escucha y decide enviar o borrar
        const previaUrl = URL.createObjectURL(blob)
        setVozPrevia({ blob, ext, mime: tipoReal, dur, previaUrl })
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
  const detenerGrab = async (cancelar) => {
    clearInterval(grabTimer.current)
    setGrabando(false)
    if (grabRef.current?.nativo) {
      const durTimer = segGrab
      grabRef.current = null
      let res
      try { res = await VoiceRecorder.stopRecording() } catch (e) { console.error('VoiceRecorder stop:', e); if (!cancelar) avisar('No se pudo grabar'); return }
      if (cancelar) return
      const b64 = res?.value?.recordDataBase64
      const mime = res?.value?.mimeType || 'audio/aac'
      if (!b64) { avisar('No se grabó audio'); return }
      let blob
      try {
        const bin = atob(b64)
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
        blob = new Blob([bytes], { type: mime })
      } catch (e) { console.error('base64->blob:', e); avisar('No se pudo procesar el audio'); return }
      const ext = (mime.includes('aac') || mime.includes('mp4') || mime.includes('m4a')) ? 'm4a' : (mime.includes('wav') ? 'wav' : 'webm')
      const dur = res?.value?.msDuration ? Math.round(res.value.msDuration / 1000) : durTimer
      // Vista previa: el usuario escucha y decide enviar o borrar
      const previaUrl = URL.createObjectURL(blob)
      setVozPrevia({ blob, ext, mime, dur, previaUrl })
      return
    }
    if (grabRef.current) { grabRef.current.cancelar = cancelar; try { grabRef.current.mr.stop() } catch (e) {} }
  }

  // Enviar la nota de voz que está en vista previa
  const enviarVozPrevia = async () => {
    if (!vozPrevia || subiendo) return
    const { blob, ext, mime, dur, previaUrl } = vozPrevia
    const comentario = texto.trim()
    setSubiendo(true)
    try {
      const url = await subirArchivo(blob, ext, mime)
      if (url) {
        await mandar({ tipo: 'voz', cuerpo: comentario, adjunto_url: url, adjunto_meta: { dur } })
        setTexto('')
        setVozPrevia(null)
        try { URL.revokeObjectURL(previaUrl) } catch (e2) {}
      }
    } finally {
      setSubiendo(false)
    }
  }

  const cancelarVozPrevia = () => {
    if (vozPrevia) { try { URL.revokeObjectURL(vozPrevia.previaUrl) } catch (e) {} }
    setVozPrevia(null)
  }

  const wrap = { minHeight: '100dvh', fontFamily: font, color: T.textoBody, position: 'relative', background: T.fondo }
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
    .mc-b-me{background:linear-gradient(150deg,#f3cf63,#c8842e);color:#1a1205;border:1px solid rgba(255,243,205,.55);box-shadow:0 5px 16px rgba(200,132,46,.5),0 2px 6px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.5)}
    .mc-b-you{background:linear-gradient(150deg,rgba(58,98,150,.96),rgba(26,58,98,.97));color:#eaf2fb;border:1px solid rgba(130,185,240,.5);box-shadow:0 5px 16px rgba(20,60,120,.5),0 0 12px rgba(90,160,235,.18),inset 0 1px 0 rgba(255,255,255,.18)}
    .mc-tail-me::after{content:"";position:absolute;right:-5px;bottom:0;width:0;height:0;border-left:11px solid #c8842e;border-bottom:9px solid transparent}
    .mc-tail-you::after{content:"";position:absolute;left:-5px;bottom:0;width:0;height:0;border-right:11px solid rgba(26,58,98,.97);border-bottom:9px solid transparent}
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
    // Para la cadena de voz: la siguiente nota es la del mensaje inmediatamente
    // siguiente, SOLO si también es voz (si hay texto/foto en medio, se corta).
    const siguienteVozId = (idActual) => {
      const idx = visibles.findIndex((x) => x.id === idActual)
      if (idx < 0 || idx + 1 >= visibles.length) return null
      const sig = visibles[idx + 1]
      return (sig && sig.tipo === 'voz' && sig.adjunto_url) ? sig.id : null
    }
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
          <div className="mc-msg" style={{ display: 'flex', justifyContent: mio ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6, marginTop: primero ? 7 : 2 }}>
            {!mio && <div style={{ width: 28, flexShrink: 0 }} />}
            <div {...handlersPresion(m)} style={{ cursor: 'pointer', maxWidth: '78%', padding: '8px 12px', borderRadius: radio, background: mio ? T.burbujaMia : T.burbujaOtro, opacity: 0.65, color: mio ? T.burbujaMiaTexto : T.burbujaOtroTexto, border: !mio && T.esClaro ? `1px solid ${T.tarjetaBorde}` : 'none', display: 'flex', alignItems: 'center', gap: 7, fontStyle: 'italic', fontSize: 13.5 }}>
              🚫 Este mensaje fue eliminado
            </div>
          </div>
        )
      }
      const orig = m.responde_a ? mensajes.find((x) => x.id === m.responde_a) : null
      const reacs = m.reacciones || {}
      const listaReacs = Object.values(reacs)
      const radio = mio ? `16px 16px ${ultimo ? '5px' : '16px'} 16px` : `16px 16px 16px ${ultimo ? '5px' : '16px'}`

      // ----- TIPO RESULTADO: tarjeta especial (sin burbuja de color) -----
      if (m.tipo === 'resultado' && m.adjunto_meta) {
        let datosJuego = m.adjunto_meta
        if (typeof datosJuego === 'string') { try { datosJuego = JSON.parse(datosJuego) } catch (e) { datosJuego = null } }
        return (
          <div className="mc-msg" style={{ display: 'flex', justifyContent: mio ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6, marginTop: primero ? 7 : 2, marginBottom: 4 }}>
            {!mio && (ultimo ? (
              <div onClick={() => onVerPerfil && perfilOtro?.id && onVerPerfil(perfilOtro.id)} style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, cursor: 'pointer', background: perfilOtro?.foto_url ? `url(${perfilOtro.foto_url}) center/cover` : T.avatar, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, color: T.avatarTexto, marginBottom: 2 }}>{!perfilOtro?.foto_url && nombreDe(perfilOtro).slice(0, 1).toUpperCase()}</div>
            ) : <div style={{ width: 28, flexShrink: 0 }} />)}
            <div id={`msg-${m.id}`} {...handlersSoloPresion(m)} style={{ maxWidth: '82%', WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}>
              {datosJuego && datosJuego.tipo === 'ficha'
                ? <FichaEnChat datos={datosJuego} mio={mio} />
                : datosJuego && datosJuego.tipo === 'noticia'
                  ? <NoticiaEnChat datos={datosJuego} mio={mio} />
                  : <ResultadoEnChat datos={datosJuego} mio={mio} onVerJuego={null} onFijar={() => fijar(m, !m.fijado)} fijado={m.fijado} />}
              <div style={{ fontSize: 9.5, opacity: 0.6, textAlign: 'right', marginTop: 3, color: T.tenue }}>{horaCorta(m.creado_en)}{mio ? (m.leido ? ' ✓✓' : ' ✓') : ''}</div>
            </div>
          </div>
        )
      }

      return (
        <div className="mc-msg" style={{ display: 'flex', justifyContent: mio ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6, marginTop: primero ? 7 : 2, marginBottom: listaReacs.length ? 12 : 0 }}>
          {!mio && (
            ultimo ? (
              <div onClick={() => onVerPerfil && perfilOtro?.id && onVerPerfil(perfilOtro.id)} style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, cursor: 'pointer', background: perfilOtro?.foto_url ? `url(${perfilOtro.foto_url}) center/cover` : T.avatar, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, color: T.avatarTexto, marginBottom: 2 }}>{!perfilOtro?.foto_url && nombreDe(perfilOtro).slice(0, 1).toUpperCase()}</div>
            ) : (
              <div style={{ width: 28, flexShrink: 0 }} />
            )
          )}
          <div style={{ position: 'relative', maxWidth: '78%' }}>
            <div id={`msg-${m.id}`} {...handlersPresion(m)} className={`${mio ? 'mc-b-me' : 'mc-b-you'}${ultimo ? (mio ? ' mc-tail-me' : ' mc-tail-you') : ''}`} style={{ position: 'relative', cursor: 'pointer', WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none', padding: m.tipo === 'foto' ? 4 : '8px 12px', borderRadius: radio }}>
              {orig && (
                <div style={{ borderLeft: `3px solid ${mio ? 'rgba(0,0,0,.35)' : T.acento}`, padding: '4px 8px', margin: '0 0 5px', borderRadius: 6, background: mio ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.06)', fontSize: 12.5 }}>
                  <div style={{ fontWeight: 800, opacity: .85, marginBottom: 1 }}>{orig.de_id === yo ? 'Tú' : nombreDe(perfilOtro)}</div>
                  <div style={{ opacity: .8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{resumenMsg(orig)}</div>
                </div>
              )}
              {m.tipo === 'foto' && m.adjunto_url && (
                <img onClick={(e) => { e.stopPropagation(); setFotoAmpliada(m.adjunto_url) }} src={m.adjunto_url} alt="foto" style={{ display: 'block', maxWidth: 240, width: '100%', borderRadius: 10, marginBottom: m.texto ? 6 : 0, border: '2px solid rgba(232,182,79,.55)', boxShadow: '0 3px 12px rgba(0,0,0,.45)', cursor: 'pointer' }} />
              )}
              {m.tipo === 'voz' && m.adjunto_url && (
                <ReproductorVoz
                  src={m.adjunto_url}
                  dur={m.adjunto_meta?.dur}
                  mio={mio}
                  id={m.id}
                  activa={vozActiva}
                  siguienteId={siguienteVozId(m.id)}
                  onActivar={setVozActiva}
                  onTerminar={(idTerm, sigId) => { setVozActiva(sigId || null) }}
                />
              )}
              {m.tipo === 'ubicacion' && m.adjunto_meta && (
                <a href={`https://maps.google.com/?q=${m.adjunto_meta.lat},${m.adjunto_meta.lng}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', minWidth: 180 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: mio ? 'rgba(0,0,0,.15)' : 'rgba(255,255,255,.08)', display: 'grid', placeItems: 'center', fontSize: 20 }}>📍</div>
                  <div><div style={{ fontWeight: 800, fontSize: 14 }}>Ubicación</div><div style={{ fontSize: 11.5, opacity: .75, textDecoration: 'underline' }}>Abrir en el mapa</div></div>
                </a>
              )}
              {m.texto && m.texto.trim() && (m.tipo === 'texto' || m.tipo === 'foto' || m.tipo === 'voz') && (
                <div style={{ fontSize: 14.5, lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'pre-wrap', padding: m.tipo === 'foto' ? '0 6px 4px' : 0, marginTop: m.tipo === 'voz' ? 5 : 0 }}>{m.texto}</div>
              )}
              <div style={{ fontSize: 9.5, opacity: 0.65, textAlign: 'right', marginTop: 3, padding: m.tipo === 'foto' ? '0 6px 2px' : 0 }}>{m.editado ? 'editado · ' : ''}{horaCorta(m.creado_en)}{mio ? (m.leido ? ' ✓✓' : ' ✓') : ''}</div>
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
      <div style={{ fontFamily: font, color: '#eef3f6', background: '#0a0b0e', display: 'flex', flexDirection: 'column', width: '100vw', height: kbAlto > 0 ? `calc(100dvh - ${Math.max(0, kbAlto - ajusteTeclado)}px)` : '100dvh', position: 'relative', overflow: 'hidden', transition: 'height .25s cubic-bezier(.25,.8,.25,1)' }}>
        <style>{css}</style>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(8,9,12,.72), rgba(8,9,12,.9))' }} />
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 26%, rgba(190,135,55,.15), transparent 70%)' }} />

        {/* header (FIJO arriba) */}
        <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, background: 'linear-gradient(180deg,#15171c,#0c0e12)', borderBottom: '1px solid rgba(232,182,79,.28)', padding: '10px 14px', paddingTop: 'calc(env(safe-area-inset-top) + 10px)', display: 'flex', alignItems: 'center', gap: 11, boxShadow: '0 4px 18px rgba(0,0,0,.5)' }}>
          <span onClick={() => { setVistaChat(null); setMensajes([]); setPerfilOtro(null) }} style={{ color: '#e8b65a', fontWeight: 800, fontSize: 22, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>‹</span>
          <div onClick={() => onVerPerfil && perfilOtro?.id && onVerPerfil(perfilOtro.id)} style={{ width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', background: perfilOtro?.foto_url ? `url(${perfilOtro.foto_url}) center/cover` : 'rgba(255,255,255,.08)', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800, color: '#e8b65a', flexShrink: 0, border: '1.5px solid rgba(232,182,79,.6)' }}>{!perfilOtro?.foto_url && nombreDe(perfilOtro).slice(0, 1).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#f4f7f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreDe(perfilOtro)}</div>
            <div style={{ fontSize: 11.5, color: '#e8b65a', fontWeight: 600, height: 14 }}>
              {otroEscribiendo ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>escribiendo
                  <span style={{ display: 'inline-flex', gap: 2 }}>
                    {[0, 1, 2].map((i) => <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#e8b65a', animation: `mcDot 1.2s ${i * 0.2}s infinite` }} />)}
                  </span>
                </span>
              ) : '✓✓ En línea'}
            </div>
          </div>
          <span onClick={() => avisar('Llamadas: pronto')} title="Llamar" style={{ color: '#e8b65a', fontSize: 19, cursor: 'pointer', lineHeight: 1, flexShrink: 0, padding: '0 3px' }}>📞</span>
          <span onClick={() => avisar('Videollamadas: pronto')} title="Videollamada" style={{ color: '#e8b65a', fontSize: 19, cursor: 'pointer', lineHeight: 1, flexShrink: 0, padding: '0 3px' }}>🎥</span>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <span onClick={() => setMenuHeader((v) => !v)} style={{ color: '#e8b65a', fontWeight: 800, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>⋮</span>
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
              <div onClick={() => { const el = document.getElementById(`msg-${fijo.id}`); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.transition = 'box-shadow .3s'; el.style.boxShadow = `0 0 0 2px ${T.acento}`; setTimeout(() => { el.style.boxShadow = 'none' }, 1200) } }} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: T.acento, textTransform: 'uppercase', letterSpacing: 0.4 }}>Mensaje fijado</div>
                <div style={{ fontSize: 12.5, color: T.textoBody, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resumenMsg(fijo)}</div>
              </div>
              <span onClick={() => fijar(fijo, false)} style={{ fontSize: 18, color: T.tenue, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>×</span>
            </div>
          )
        })()}

        {/* mensajes (con scroll interno) */}
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
        {editando && (
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: T.esClaro ? 'rgba(255,255,255,.9)' : 'rgba(8,9,12,.92)', borderTop: `1px solid ${T.tarjetaBorde}` }}>
            <div style={{ width: 3, alignSelf: 'stretch', background: '#f3cf63', borderRadius: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#f3cf63' }}>✏️ Editando mensaje</div>
              <div style={{ fontSize: 12.5, color: T.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(editando.texto || '').trim()}</div>
            </div>
            <span onClick={cancelarEdicion} style={{ fontSize: 20, color: T.tenue, cursor: 'pointer', lineHeight: 1 }}>×</span>
          </div>
        )}

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

        {/* panel de emojis selector */}
        {emojiAbierto && !grabando && (
          <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, height: 250, background: T.sheetBg, borderTop: `1px solid ${T.tarjetaBorde}`, display: 'flex', flexDirection: 'column' }}>
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

        {/* Vista previa de nota de voz: escúchala antes de enviar */}
        {vozPrevia && !grabando && (
          <div style={{ position: 'relative', zIndex: 3, flexShrink: 0, padding: '10px 12px', background: 'rgba(10,12,16,.97)', borderTop: '1px solid rgba(232,182,79,.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span onClick={cancelarVozPrevia} title="Borrar" style={{ fontSize: 22, color: '#e0563f', cursor: 'pointer', flexShrink: 0 }}>🗑</span>
            <div style={{ flex: 1, minWidth: 0 }}><ReproductorVoz src={vozPrevia.previaUrl} dur={vozPrevia.dur} mio={false} id="previa" activa={vozActiva} siguienteId={null} onActivar={setVozActiva} onTerminar={() => setVozActiva(null)} /></div>
            <button onClick={enviarVozPrevia} disabled={subiendo} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'linear-gradient(150deg, #f3cf63, #c8842e)', color: '#1a1205', fontSize: 18, cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 3px 12px rgba(200,132,46,.45)', opacity: subiendo ? 0.6 : 1 }}>➤</button>
          </div>
        )}

        {/* Vista previa de foto (estilo WhatsApp): se ve antes de enviar */}
        {fotoPrevia && !grabando && (
          <div style={{ position: 'relative', zIndex: 3, flexShrink: 0, padding: '10px 12px', background: 'rgba(10,12,16,.97)', borderTop: '1px solid rgba(232,182,79,.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0, background: `url(${fotoPrevia.previaUrl}) center/cover`, border: '2px solid rgba(232,182,79,.55)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f4f7f9' }}>Foto lista para enviar</div>
              <div style={{ fontSize: 11.5, color: '#9aa3ad', marginTop: 2 }}>Escribe un comentario (opcional) y envía</div>
            </div>
            <span onClick={cancelarFotoPrevia} title="Quitar" style={{ fontSize: 22, color: '#e0563f', cursor: 'pointer', padding: '0 4px' }}>×</span>
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
          <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, padding: '10px 10px', paddingBottom: (emojiAbierto || kbAlto > 0) ? '10px' : 'calc(10px + env(safe-area-inset-bottom))', background: 'rgba(10,12,16,.94)', borderTop: '1px solid rgba(232,182,79,.25)', display: 'flex', alignItems: 'flex-end', gap: 6, backdropFilter: 'blur(10px)' }}>
            <button onClick={() => setMenuCompartir(true)} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(232,182,79,.35)', background: 'transparent', color: '#e8b65a', fontSize: 21, cursor: 'pointer', display: 'grid', placeItems: 'center', lineHeight: 1 }}>+</button>
            <button onClick={toggleEmoji} title="Emojis" style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', border: `1px solid ${emojiAbierto ? '#e8b65a' : 'rgba(232,182,79,.35)'}`, background: emojiAbierto ? 'rgba(232,182,79,.13)' : 'transparent', color: '#e8b65a', fontSize: 20, cursor: 'pointer', display: 'grid', placeItems: 'center', lineHeight: 1 }}>{emojiAbierto ? '⌨️' : '😀'}</button>
            <textarea
              ref={inputRef}
              value={texto}
              onChange={(e) => { setTexto(e.target.value); avisarTyping() }}
              onFocus={() => { setEmojiAbierto(false); setTimeout(() => irAbajo('smooth'), 180) }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarTexto() } }}
              placeholder={vozPrevia ? 'Indica de qué trata el audio…' : fotoPrevia ? 'Escribe un comentario…' : 'Escribe un mensaje…'}
              rows={1}
              style={{ flex: 1, minWidth: 0, resize: 'none', maxHeight: 110, background: 'rgba(20,22,28,.9)', border: '1px solid rgba(232,182,79,.35)', borderRadius: 20, padding: '10px 14px', color: '#f4f7f9', fontSize: 16, outline: 'none', fontFamily: font, lineHeight: 1.35 }}
            />
            {editando ? (
              <button onMouseDown={(e) => e.preventDefault()} onClick={guardarEdicion} disabled={enviando} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'linear-gradient(150deg, #f3cf63, #c8842e)', color: '#1a1205', fontSize: 20, cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 3px 12px rgba(200,132,46,.45)', opacity: enviando ? 0.6 : 1 }}>✓</button>
            ) : vozPrevia ? (
              <button onMouseDown={(e) => e.preventDefault()} onClick={enviarVozPrevia} disabled={subiendo} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'linear-gradient(150deg, #f3cf63, #c8842e)', color: '#1a1205', fontSize: 18, cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 3px 12px rgba(200,132,46,.45)', opacity: subiendo ? 0.6 : 1 }}>➤</button>
            ) : fotoPrevia ? (
              <button onMouseDown={(e) => e.preventDefault()} onClick={enviarFotoPrevia} disabled={subiendo} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'linear-gradient(150deg, #f3cf63, #c8842e)', color: '#1a1205', fontSize: 18, cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 3px 12px rgba(200,132,46,.45)', opacity: subiendo ? 0.6 : 1 }}>➤</button>
            ) : texto.trim() ? (
              <button onMouseDown={(e) => e.preventDefault()} onClick={enviarTexto} disabled={enviando} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'linear-gradient(150deg, #f3cf63, #c8842e)', color: '#1a1205', fontSize: 18, cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 3px 12px rgba(200,132,46,.45)' }}>➤</button>
            ) : (
              <button onClick={iniciarGrab} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'linear-gradient(150deg, #f3cf63, #c8842e)', color: '#1a1205', fontSize: 19, cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 3px 12px rgba(200,132,46,.45)' }}>🎤</button>
            )}
          </div>
        )}

        <input ref={fotoInputRef} type="file" accept="image/*" onChange={alSeleccionarFoto} style={{ display: 'none' }} />

        {fotoAmpliada && (
          <div onClick={() => setFotoAmpliada(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <span onClick={() => setFotoAmpliada(null)} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', right: 18, fontSize: 34, color: '#fff', cursor: 'pointer', lineHeight: 1, fontWeight: 300 }}>×</span>
            <img src={fotoAmpliada} alt="foto" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
          </div>
        )}

        {subiendo && (
          <div style={{ position: 'fixed', left: '50%', bottom: 90, transform: 'translateX(-50%)', zIndex: 40, background: T.acentoSolido, color: '#1a1205', fontWeight: 800, fontSize: 12.5, padding: '8px 16px', borderRadius: 20 }}>Subiendo…</div>
        )}
        {toast && (
          <div style={{ position: 'fixed', left: '50%', bottom: 90, transform: 'translateX(-50%)', zIndex: 40, background: '#e0563f', color: '#fff', fontWeight: 700, fontSize: 12.5, padding: '8px 16px', borderRadius: 20 }}>{toast}</div>
        )}

        {/* menú de acciones de mensaje */}
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
                {selMsg.de_id === yo && !selMsg.borrado_todos && selMsg.texto && selMsg.texto.trim() && menos3h(selMsg) && (
                  <div onClick={() => iniciarEdicion(selMsg)} style={{ padding: '14px 18px', fontSize: 14.5, fontWeight: 600, color: T.textoBody, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${T.tarjetaBorde}` }}>✏️ Editar</div>
                )}
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
  const gruposFiltrados = grupos.filter((g) => !buscaInbox.trim() || (g.nombre || '').toLowerCase().includes(buscaInbox.toLowerCase()))
  const itemsInbox = [
    ...convsFiltradas.map((c) => ({ esGrupo: false, c, t: new Date(c.ultimo.creado_en).getTime() })),
    ...gruposFiltrados.map((g) => ({ esGrupo: true, g, t: g.ultimo ? new Date(g.ultimo.creado_en).getTime() : new Date(g.creado_en).getTime() })),
  ].sort((a, b) => b.t - a.t)

  return (
    <div style={wrap}>
      <style>{css}</style>
      <Velo />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 620, margin: '0 auto', padding: 'calc(env(safe-area-inset-top) + 16px) 16px 50px' }}>
        <div style={{ background: T.navDorada, borderRadius: 14, padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, boxShadow: '0 6px 18px rgba(156,101,24,.3)' }}>
          <span onClick={() => onVolver && onVolver()} style={{ color: '#2a1c08', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Volver</span>
          <span style={{ color: '#2a1c08', fontWeight: 800, fontSize: 14 }}>✉️ Mensajes</span>
          <span style={{ width: 40 }} />
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <input value={buscaInbox} onChange={(e) => setBuscaInbox(e.target.value)} placeholder="🔍 Buscar conversación" style={{ flex: 1, boxSizing: 'border-box', background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 12, padding: '11px 14px', color: T.textoFuerte, fontSize: 14, outline: 'none', fontFamily: font }} />
          <button onClick={() => onCrearGrupo && onCrearGrupo()} style={{ flexShrink: 0, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 12, padding: '0 14px', background: T.tarjetaBg, color: T.acento, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>＋ Grupo</button>
        </div>

        {cargandoInbox ? (
          <div style={{ textAlign: 'center', padding: '40px', color: T.tenue, fontSize: 14 }}>Cargando…</div>
        ) : convsFiltradas.length === 0 && gruposFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: T.tenue }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>💬</div>
            <div style={{ fontSize: 14.5, lineHeight: 1.5 }}>{buscaInbox ? 'Nada con ese nombre.' : <>Todavía no tienes conversaciones.<br />Busca a un jugador y escríbele, o crea un grupo.</>}</div>
          </div>
        ) : (
          itemsInbox.map((it) => {
            if (it.esGrupo) {
              const g = it.g
              const badge = g.tipo === 'liga' ? '🤝' : g.tipo === 'torneo' ? '🏆' : '👥'
              const prev = g.ultimo ? (g.ultimo.de_id === yo ? 'Tú: ' : '') + g.ultimo.texto : 'Grupo creado'
              return (
                <div key={'g-' + g.id} onClick={() => onAbrirGrupo && onAbrirGrupo(g)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 14, marginBottom: 10, cursor: 'pointer' }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', flexShrink: 0, background: g.foto_url ? `url(${g.foto_url}) center/cover` : T.avatar, display: 'grid', placeItems: 'center', fontSize: 20 }}>{badge}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.nombre}</span>
                      {g.ultimo && <span style={{ fontSize: 11, color: T.tenue, flexShrink: 0 }}>{fechaCorta(g.ultimo.creado_en)}</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: T.tenue, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prev}</div>
                  </div>
                </div>
              )
            }
            const c = it.c
            const p = perfilesMap[c.otroId]
            const nom = nombreDe(p)
            const ultimoMio = c.ultimo.de_id === yo
            const prev = c.ultimo.tipo && c.ultimo.tipo !== 'texto' ? resumenMsg(c.ultimo) : c.ultimo.texto
            return (
              <div key={c.otroId} onClick={() => setVistaChat(c.otroId)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 14, marginBottom: 10, cursor: 'pointer' }}>
                <div onClick={(e) => { e.stopPropagation(); onVerPerfil && p?.id && onVerPerfil(p.id) }} style={{ width: 50, height: 50, borderRadius: '50%', flexShrink: 0, cursor: 'pointer', background: p?.foto_url ? `url(${p.foto_url}) center/cover` : T.avatar, display: 'grid', placeItems: 'center', fontSize: 19, fontWeight: 800, color: T.avatarTexto }}>{!p?.foto_url && nom.slice(0, 1).toUpperCase()}</div>
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