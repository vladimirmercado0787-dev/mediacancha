import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { miUsuarioId } from '../social'
import { leerMensajesGrupo, enviarMensajeGrupo, leerMiembrosGrupo, salirDeGrupo } from '../grupos'

const C = {
  bg: '#0e0f12', card: '#16181d', card2: '#1c1f26',
  borde: 'rgba(255,255,255,.08)', oro: '#e8b65a',
  txt: '#f4f7f9', body: '#c3cad3', tenue: '#828a95',
}

function hora(iso) {
  try { return new Date(iso).toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit' }) } catch (e) { return '' }
}
function nombreDe(p) { return p ? `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Alguien' : 'Alguien' }
function avatarColor(seed) {
  const colores = ['#e8b65a', '#6fb0ec', '#7adfa6', '#e0876a', '#c890e8', '#e86fa0']
  let h = 0; for (let i = 0; i < (seed || '').length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return colores[h % colores.length]
}

export default function PantallaGrupo({ grupoId, grupoNombre, grupoTipo, onVolver, onVerPerfil }) {
  const [yo, setYo] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [miembros, setMiembros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [texto, setTexto] = useState('')
  const [verMiembros, setVerMiembros] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const finRef = useRef(null)

  useEffect(() => { miUsuarioId().then(setYo) }, [])

  const cargar = () => {
    Promise.all([leerMensajesGrupo(grupoId), leerMiembrosGrupo(grupoId)])
      .then(([m, mi]) => { setMensajes(m.mensajes || []); setMiembros(mi.miembros || []) })
      .finally(() => setCargando(false))
  }
  useEffect(() => { if (grupoId) cargar() }, [grupoId])

  // Tiempo real: nuevos mensajes del grupo
  useEffect(() => {
    if (!grupoId) return
    const canal = supabase
      .channel('grupo-' + grupoId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_grupo', filter: `grupo_id=eq.${grupoId}` }, (payload) => {
        setMensajes((prev) => prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new])
      })
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [grupoId])

  useEffect(() => { finRef.current && finRef.current.scrollIntoView({ behavior: 'smooth' }) }, [mensajes.length])

  const mandar = async () => {
    const t = texto.trim()
    if (!t || enviando) return
    setTexto(''); setEnviando(true)
    await enviarMensajeGrupo(grupoId, t)
    setEnviando(false)
  }

  const salir = async () => {
    await salirDeGrupo(grupoId)
    onVolver && onVolver()
  }

  const miembroPorId = {}
  miembros.forEach((m) => { miembroPorId[m.perfil_id] = m.perfil })

  const badge = grupoTipo === 'liga' ? '🤝 Liga' : grupoTipo === 'torneo' ? '🏆 Torneo' : '👥 Grupo'

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, color: C.txt, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, background: 'rgba(14,15,18,.95)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${C.borde}`, padding: 'calc(env(safe-area-inset-top) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onVolver} style={{ background: 'none', border: 'none', color: C.txt, fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
        <div onClick={() => setVerMiembros(true)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <div style={{ fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{grupoNombre || 'Grupo'}</div>
          <div style={{ fontSize: 11, color: C.tenue }}>{badge} · {miembros.length} {miembros.length === 1 ? 'miembro' : 'miembros'}</div>
        </div>
        <button onClick={() => setVerMiembros(true)} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.borde}`, background: C.card, color: C.txt, fontSize: 15, cursor: 'pointer' }}>ⓘ</button>
      </div>

      {/* MENSAJES */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 14px' }}>
        {cargando ? (
          <div style={{ textAlign: 'center', color: C.tenue, padding: 40, fontSize: 13 }}>Cargando…</div>
        ) : mensajes.length === 0 ? (
          <div style={{ textAlign: 'center', color: C.tenue, padding: 40, fontSize: 13.5 }}>Todavía no hay mensajes. ¡Saluda al grupo! 🏀</div>
        ) : (
          mensajes.map((m, i) => {
            const mio = m.de_id === yo
            const prev = mensajes[i - 1]
            const mostrarNombre = !mio && (!prev || prev.de_id !== m.de_id)
            const autor = m.autor || miembroPorId[m.de_id]
            const nom = nombreDe(autor)
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mio ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                {mostrarNombre && (
                  <div onClick={() => onVerPerfil && autor?.id && onVerPerfil(autor.id)} style={{ fontSize: 11.5, fontWeight: 800, color: avatarColor(m.de_id || ''), marginBottom: 3, marginLeft: 4, cursor: 'pointer' }}>{nom}</div>
                )}
                <div style={{ maxWidth: '78%', display: 'flex', alignItems: 'flex-end', gap: 7, flexDirection: mio ? 'row-reverse' : 'row' }}>
                  {!mio && (
                    <div onClick={() => onVerPerfil && autor?.id && onVerPerfil(autor.id)} style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, cursor: 'pointer', background: autor?.foto_url ? `url(${autor.foto_url}) center/cover` : avatarColor(m.de_id || ''), display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, color: '#1a1205' }}>{!autor?.foto_url && nom.slice(0, 1).toUpperCase()}</div>
                  )}
                  <div style={{ background: mio ? C.oro : C.card, color: mio ? '#1a1205' : C.txt, borderRadius: 16, padding: '9px 13px', fontSize: 14, lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {m.texto}
                    <div style={{ fontSize: 9.5, opacity: 0.65, marginTop: 3, textAlign: 'right' }}>{hora(m.creado_en)}</div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={finRef} />
      </div>

      {/* INPUT */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${C.borde}`, padding: '10px 12px calc(env(safe-area-inset-bottom) + 10px)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') mandar() }}
          placeholder="Escribe un mensaje…"
          style={{ flex: 1, boxSizing: 'border-box', background: C.card, border: `1px solid ${C.borde}`, borderRadius: 20, padding: '11px 16px', color: C.txt, fontSize: 14.5, outline: 'none' }}
        />
        <button onClick={mandar} disabled={!texto.trim() || enviando} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: texto.trim() ? C.oro : C.card, color: texto.trim() ? '#1a1205' : C.tenue, fontSize: 17, cursor: texto.trim() ? 'pointer' : 'default', flexShrink: 0 }}>➤</button>
      </div>

      {/* MIEMBROS */}
      {verMiembros && (
        <div onClick={() => setVerMiembros(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '75vh', overflowY: 'auto', background: C.bg, borderTop: `1px solid ${C.borde}`, borderRadius: '20px 20px 0 0', padding: '18px 18px calc(env(safe-area-inset-bottom) + 20px)' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: C.borde, margin: '0 auto 16px' }} />
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{grupoNombre}</div>
            <div style={{ fontSize: 12, color: C.tenue, marginBottom: 16 }}>{badge} · {miembros.length} {miembros.length === 1 ? 'miembro' : 'miembros'}</div>
            {miembros.map((m) => {
              const p = m.perfil
              const nom = nombreDe(p)
              return (
                <div key={m.perfil_id} onClick={() => { onVerPerfil && p?.id && onVerPerfil(p.id) }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 4px', cursor: 'pointer' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: p?.foto_url ? `url(${p.foto_url}) center/cover` : avatarColor(m.perfil_id), display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 800, color: '#1a1205' }}>{!p?.foto_url && nom.slice(0, 1).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{nom}{m.perfil_id === yo ? ' (tú)' : ''}</div>
                    {m.rol === 'admin' && <div style={{ fontSize: 11, color: C.oro, fontWeight: 700 }}>Admin</div>}
                  </div>
                </div>
              )
            })}
            {grupoTipo === 'manual' && (
              <button onClick={salir} style={{ width: '100%', marginTop: 16, border: '1px solid rgba(224,86,63,.35)', borderRadius: 12, padding: 12, background: 'rgba(224,86,63,.1)', color: '#e0563f', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>Salir del grupo</button>
            )}
            {grupoTipo !== 'manual' && (
              <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 14, textAlign: 'center', lineHeight: 1.5 }}>Este grupo se actualiza solo con quién está en la {grupoTipo === 'liga' ? 'liga' : 'torneo'}.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}