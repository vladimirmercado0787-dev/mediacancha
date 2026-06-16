import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { miUsuarioId } from '../social'
import { enviarMensaje, leerConversacion, marcarLeido, listaConversaciones, perfilesDe } from '../mensajes'
import fondoCancha from '../assets/fondo-cancha.png'

const TEMAS = {
  dorado: { esClaro: false, acento: '#e8b65a', fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', avatar: 'linear-gradient(150deg, #e0b057, #9a6420)', avatarTexto: '#241a07', tarjetaBg: 'rgba(20,22,26,.72)', tarjetaBorde: 'rgba(255,255,255,.08)', inputBg: 'rgba(12,14,18,0.7)', burbujaMia: 'linear-gradient(150deg, #f3cf63, #c8842e)', burbujaMiaTexto: '#1a1205', burbujaOtro: 'rgba(40,43,48,.92)', burbujaOtroTexto: '#eef3f6', glow: 'rgba(190,135,55,0.18)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.84), rgba(8,9,12,0.92))' },
  azul: { esClaro: false, acento: '#6fb0ec', fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', avatar: 'linear-gradient(150deg, #5aa0e0, #1d4a80)', avatarTexto: '#08151f', tarjetaBg: 'rgba(20,22,26,.72)', tarjetaBorde: 'rgba(255,255,255,.08)', inputBg: 'rgba(12,14,18,0.7)', burbujaMia: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', burbujaMiaTexto: '#08151f', burbujaOtro: 'rgba(40,43,48,.92)', burbujaOtroTexto: '#eef3f6', glow: 'rgba(55,120,190,0.2)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.84), rgba(8,9,12,0.92))' },
  claro: { esClaro: true, acento: '#b07a26', fondo: '#e6dcc8', textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58', boton: 'linear-gradient(150deg, #e7c069, #b07a26)', avatar: 'linear-gradient(150deg, #e7c069, #a9741f)', avatarTexto: '#3a2806', tarjetaBg: '#fff', tarjetaBorde: '#e0e3e8', inputBg: '#fff', burbujaMia: 'linear-gradient(150deg, #e7c069, #b07a26)', burbujaMiaTexto: '#2a1c06', burbujaOtro: '#fff', burbujaOtroTexto: '#2a2014', glow: 'rgba(190,135,55,0.10)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(235,228,212,0.86), rgba(228,220,200,0.92))' },
  larimar: { esClaro: true, acento: '#2a8fb8', fondo: '#d6e7e8', textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375', boton: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', avatar: 'linear-gradient(150deg, #4aafc8, #1a6a8a)', avatarTexto: '#04121f', tarjetaBg: '#fff', tarjetaBorde: '#cfe0e2', inputBg: '#fff', burbujaMia: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', burbujaMiaTexto: '#04121f', burbujaOtro: '#fff', burbujaOtroTexto: '#1c2624', glow: 'rgba(42,143,184,0.12)', navDorada: 'linear-gradient(180deg,#6ac0d8,#2a8fb8 55%,#1a6a8a)', veloGrad: 'linear-gradient(180deg, rgba(214,231,232,0.86), rgba(214,231,232,0.92))' },
}

function horaCorta(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function fechaCorta(iso) {
  if (!iso) return ''
  const d = new Date(iso), hoy = new Date()
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1)
  if (d.toDateString() === hoy.toDateString()) return horaCorta(iso)
  if (d.toDateString() === ayer.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit' })
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
  const [vistaChat, setVistaChat] = useState(abrirCon || null) // id de la persona con quien chateo; null = inbox
  const [convs, setConvs] = useState([])
  const [perfilesMap, setPerfilesMap] = useState({})
  const [cargandoInbox, setCargandoInbox] = useState(true)

  const [mensajes, setMensajes] = useState([])
  const [perfilOtro, setPerfilOtro] = useState(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const finRef = useRef(null)

  useEffect(() => { (async () => setYo(await miUsuarioId()))() }, [])

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
    // perfil del otro
    const mapa = await perfilesDe([otroId])
    setPerfilOtro(mapa[otroId] || null)
    setTimeout(() => finRef.current?.scrollIntoView({ behavior: 'auto' }), 100)
  }

  useEffect(() => {
    if (!vistaChat || !yo) return
    cargarConversacion(vistaChat)
    // realtime: escucha mensajes nuevos de esta conversación
    const canal = supabase
      .channel('chat-' + vistaChat)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, (payload) => {
        const m = payload.new
        const esDeEstaConv = (m.de_id === vistaChat && m.para_id === yo) || (m.de_id === yo && m.para_id === vistaChat)
        if (esDeEstaConv) {
          setMensajes((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m])
          if (m.para_id === yo) marcarLeido(vistaChat)
          setTimeout(() => finRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [vistaChat, yo])

  const enviar = async () => {
    const limpio = texto.trim()
    if (!limpio || enviando) return
    setEnviando(true)
    setTexto('')
    const r = await enviarMensaje(vistaChat, limpio)
    if (r.error) { alert(r.error); setTexto(limpio) }
    else if (r.mensaje) {
      setMensajes((prev) => prev.some((x) => x.id === r.mensaje.id) ? prev : [...prev, r.mensaje])
      setTimeout(() => finRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    }
    setEnviando(false)
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

  // ====== VISTA: CONVERSACIÓN 1 A 1 ======
  if (vistaChat) {
    return (
      <div style={{ ...wrap, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Velo />
        {/* header del chat */}
        <div style={{ position: 'relative', zIndex: 2, background: T.navDorada, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 16px rgba(156,101,24,.3)' }}>
          <span onClick={() => { setVistaChat(null); setMensajes([]); setPerfilOtro(null) }} style={{ color: '#2a1c08', fontWeight: 800, fontSize: 19, cursor: 'pointer', lineHeight: 1 }}>←</span>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: perfilOtro?.foto_url ? `url(${perfilOtro.foto_url}) center/cover` : 'rgba(42,28,8,.25)', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 800, color: '#2a1c08', flexShrink: 0 }}>{!perfilOtro?.foto_url && nombreDe(perfilOtro).slice(0, 1).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#2a1c08', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreDe(perfilOtro)}</div>
          </div>
        </div>

        {/* mensajes */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mensajes.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: T.tenue, fontSize: 13.5, maxWidth: 240 }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>💬</div>
              Escríbele el primer mensaje a {nombreDe(perfilOtro)}.
            </div>
          ) : mensajes.map((m) => {
            const mio = m.de_id === yo
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: mio ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '76%', padding: '9px 13px', borderRadius: mio ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: mio ? T.burbujaMia : T.burbujaOtro, color: mio ? T.burbujaMiaTexto : T.burbujaOtroTexto, border: !mio && T.esClaro ? `1px solid ${T.tarjetaBorde}` : 'none', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}>
                  <div style={{ fontSize: 14.5, lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{m.texto}</div>
                  <div style={{ fontSize: 9.5, opacity: 0.7, textAlign: 'right', marginTop: 3 }}>{horaCorta(m.creado_en)}{mio && m.leido ? ' · visto' : ''}</div>
                </div>
              </div>
            )
          })}
          <div ref={finRef} />
        </div>

        {/* input */}
        <div style={{ position: 'relative', zIndex: 2, padding: '10px 12px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', background: T.esClaro ? 'rgba(255,255,255,.85)' : 'rgba(8,9,12,.9)', borderTop: `1px solid ${T.tarjetaBorde}`, display: 'flex', alignItems: 'flex-end', gap: 9, backdropFilter: 'blur(10px)' }}>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
            placeholder="Escribe un mensaje…"
            rows={1}
            style={{ flex: 1, minWidth: 0, resize: 'none', maxHeight: 110, background: T.inputBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 20, padding: '10px 14px', color: T.textoFuerte, fontSize: 16, outline: 'none', fontFamily: font, lineHeight: 1.35 }}
          />
          <button onClick={enviar} disabled={!texto.trim() || enviando} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', border: 'none', background: texto.trim() ? T.boton : T.tarjetaBorde, color: '#1a1205', fontSize: 18, cursor: texto.trim() ? 'pointer' : 'default', display: 'grid', placeItems: 'center' }}>➤</button>
        </div>
      </div>
    )
  }

  // ====== VISTA: INBOX (lista de conversaciones) ======
  return (
    <div style={wrap}>
      <Velo />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 620, margin: '0 auto', padding: '16px 16px 50px' }}>
        <div style={{ background: T.navDorada, borderRadius: 14, padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, boxShadow: '0 6px 18px rgba(156,101,24,.3)' }}>
          <span onClick={() => onVolver && onVolver()} style={{ color: '#2a1c08', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Volver</span>
          <span style={{ color: '#2a1c08', fontWeight: 800, fontSize: 14 }}>✉️ Mensajes</span>
          <span style={{ width: 40 }} />
        </div>

        {cargandoInbox ? (
          <div style={{ textAlign: 'center', padding: '40px', color: T.tenue, fontSize: 14 }}>Cargando…</div>
        ) : convs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: T.tenue }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>💬</div>
            <div style={{ fontSize: 14.5, lineHeight: 1.5 }}>Todavía no tienes conversaciones.<br/>Busca a un jugador y escríbele.</div>
          </div>
        ) : (
          convs.map((c) => {
            const p = perfilesMap[c.otroId]
            const nom = nombreDe(p)
            const ultimoMio = c.ultimo.de_id === yo
            return (
              <div key={c.otroId} onClick={() => setVistaChat(c.otroId)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 14, marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', flexShrink: 0, background: p?.foto_url ? `url(${p.foto_url}) center/cover` : T.avatar, display: 'grid', placeItems: 'center', fontSize: 19, fontWeight: 800, color: T.avatarTexto }}>{!p?.foto_url && nom.slice(0, 1).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nom}</span>
                    <span style={{ fontSize: 11, color: T.tenue, flexShrink: 0 }}>{fechaCorta(c.ultimo.creado_en)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 12.5, color: c.noLeidos > 0 ? T.textoBody : T.tenue, fontWeight: c.noLeidos > 0 ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ultimoMio ? 'Tú: ' : ''}{c.ultimo.texto}</span>
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