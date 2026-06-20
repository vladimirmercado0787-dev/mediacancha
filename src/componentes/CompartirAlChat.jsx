import { useState, useEffect } from 'react'
import { listaConversaciones, perfilesDe, enviarResultado } from '../mensajes'
import { supabase } from '../supabaseClient'

// ============================================================================
//  COMPARTIR AL CHAT — Media Cancha
//  Hoja para elegir a quién mandar un resultado de juego dentro de la app.
//  Muestra tus chats recientes + buscador de personas.
//
//  Props:
//    datos    — el `datos` del juego a compartir
//    tema     — { acento, boton, ... }
//    onCerrar — () => {}
//    onEnviado— (paraId) => {}  (opcional) tras enviar con éxito
// ============================================================================

export default function CompartirAlChat({ datos, tema, onCerrar, onEnviado }) {
  const T = tema || { acento: '#e8b65a', boton: 'linear-gradient(150deg,#f3cf63,#c8842e)' }
  const [chats, setChats] = useState([])
  const [perfiles, setPerfiles] = useState({})
  const [cargando, setCargando] = useState(true)
  const [busca, setBusca] = useState('')
  const [resultadosBusca, setResultadosBusca] = useState([])
  const [enviandoA, setEnviandoA] = useState(null)
  const [enviados, setEnviados] = useState([])

  // Cargar chats recientes
  useEffect(() => {
    (async () => {
      try {
        const lista = await listaConversaciones()
        setChats(lista || [])
        const ids = (lista || []).map((c) => c.otroId)
        if (ids.length) setPerfiles(await perfilesDe(ids))
      } catch (e) {}
      setCargando(false)
    })()
  }, [])

  // Buscar personas
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = busca.trim()
      if (q.length < 2) { setResultadosBusca([]); return }
      try {
        const { data } = await supabase.from('perfiles').select('id, nombre, apellido, foto_url').or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%`).limit(8)
        setResultadosBusca(data || [])
      } catch (e) { setResultadosBusca([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [busca])

  const nombreDe = (p) => p ? `${p.nombre || ''}${p.apellido ? ' ' + p.apellido : ''}`.trim() || 'Jugador' : 'Jugador'

  const enviar = async (paraId) => {
    if (enviandoA || enviados.includes(paraId)) return
    setEnviandoA(paraId)
    const r = await enviarResultado(paraId, datos)
    setEnviandoA(null)
    if (r && r.ok) {
      setEnviados((prev) => [...prev, paraId])
      onEnviado && onEnviado(paraId)
    } else {
      alert('No se pudo enviar: ' + (r?.error || 'intenta de nuevo'))
    }
  }

  const Avatar = ({ p, size = 44 }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: p?.foto_url ? `url(${p.foto_url}) center/cover` : 'linear-gradient(150deg,#e0b057,#9a6420)', display: 'grid', placeItems: 'center', fontSize: size * 0.4, fontWeight: 800, color: '#241a07' }}>{!p?.foto_url && nombreDe(p).slice(0, 1).toUpperCase()}</div>
  )

  const fila = (p, paraId) => {
    const yaEnviado = enviados.includes(paraId)
    const enviando = enviandoA === paraId
    return (
      <div key={paraId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
        <Avatar p={p} />
        <div style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700, color: '#f4f7f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreDe(p)}</div>
        <button onClick={() => enviar(paraId)} disabled={yaEnviado || enviando} style={{ flexShrink: 0, border: yaEnviado ? '1px solid rgba(255,255,255,.18)' : 'none', borderRadius: 11, padding: '8px 16px', background: yaEnviado ? 'transparent' : T.boton, color: yaEnviado ? '#9aa7b2' : '#1a1205', fontSize: 12.5, fontWeight: 800, cursor: yaEnviado ? 'default' : 'pointer', opacity: enviando ? 0.6 : 1 }}>{yaEnviado ? 'Enviado ✓' : (enviando ? 'Enviando…' : 'Enviar')}</button>
      </div>
    )
  }

  return (
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, zIndex: 320, background: 'rgba(4,5,7,.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '82dvh', background: '#14161a', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'subeComp .26s cubic-bezier(.2,.8,.3,1)' }}>
        <style>{`@keyframes subeComp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Cabecera */}
        <div style={{ flexShrink: 0, padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f4f7f9', textAlign: 'center' }}>Compartir resultado</div>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} onMouseDown={(e) => e.stopPropagation()} placeholder="Buscar persona…" style={{ width: '100%', boxSizing: 'border-box', marginTop: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 11, padding: '10px 14px', color: '#f4f7f9', fontSize: 14, outline: 'none' }} />
        </div>

        {/* Lista */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}>
          {busca.trim().length >= 2 ? (
            resultadosBusca.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8b94a0', fontSize: 13, padding: '24px 0' }}>Sin resultados.</div>
            ) : resultadosBusca.map((p) => fila(p, p.id))
          ) : cargando ? (
            <div style={{ textAlign: 'center', color: '#8b94a0', fontSize: 13, padding: '24px 0' }}>Cargando chats…</div>
          ) : chats.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8b94a0', fontSize: 13, padding: '24px 16px' }}>No tienes chats todavía. Busca a alguien arriba.</div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: '#8b94a0', fontWeight: 800, letterSpacing: 0.4, padding: '10px 16px 4px' }}>CHATS RECIENTES</div>
              {chats.map((c) => fila(perfiles[c.otroId], c.otroId))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}