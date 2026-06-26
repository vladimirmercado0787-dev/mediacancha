import { useState, useEffect } from 'react'
import { misInvitaciones, responderInvitacion } from '../torneos'

// ============================================================================
//  MIS INVITACIONES — bandeja del jugador (T-004)
//  Aquí a la persona le llegan las invitaciones a equipos de torneos y las
//  acepta o rechaza. Usa misInvitaciones() y responderInvitacion() (ya hechas).
//  Identidad "transmisión": azul-marino + dorado + tricolor, letra condensada.
// ============================================================================

const C = {
  bg: '#070d1d', fondo2: '#0a1226', panel: 'rgba(9,14,28,.97)',
  card: '#111a30', card2: '#0e1628',
  oro: '#f5b82e', oroClaro: '#ffd66b', oroSuave: 'rgba(245,184,46,.13)',
  txt: '#f3f6fc', body: '#e7edf6', tenue: '#9aa6bd', muyTenue: '#6b7791',
  borde: 'rgba(245,184,46,.22)', bordeSuave: 'rgba(255,255,255,.07)',
  verde: '#2dd496', vino: '#d24f4f',
  triAzul: '#1b3a8c', triRojo: '#ce1126',
}
const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const fDisp = "'Anton', 'Arial Narrow', Impact, sans-serif"
const fCond = "'Oswald', 'Arial Narrow', 'Helvetica Neue', sans-serif"

const ROL = {
  capitan: { txt: 'Capitán', color: C.oro, emoji: '©' },
  jugador: { txt: 'Jugador', color: C.verde, emoji: '🏀' },
  directiva: { txt: 'Directiva', color: '#5b8def', emoji: '💼' },
}

export default function PantallaInvitaciones({ onVolver }) {
  const [invitaciones, setInvitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(null)
  const [toast, setToast] = useState(null)
  const [ancho, setAncho] = useState(typeof window !== 'undefined' ? window.innerWidth : 390)
  const esAncho = ancho >= 820
  const maxAncho = esAncho ? 620 : 560

  // Cargar tipografía deportiva (Anton/Oswald) sin tocar otros archivos.
  useEffect(() => {
    const id = 'mc-fuentes-deportivas'
    if (typeof document === 'undefined' || document.getElementById(id)) return
    const l = document.createElement('link')
    l.id = id; l.rel = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600;700&display=swap'
    document.head.appendChild(l)
  }, [])

  useEffect(() => {
    const r = () => setAncho(window.innerWidth)
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  // Bloquear el scroll del fondo mientras esta pantalla está montada.
  useEffect(() => {
    const y = window.scrollY
    document.body.style.position = 'fixed'; document.body.style.top = `-${y}px`
    document.body.style.left = '0'; document.body.style.right = '0'; document.body.style.width = '100%'
    return () => {
      document.body.style.position = ''; document.body.style.top = ''
      document.body.style.left = ''; document.body.style.right = ''; document.body.style.width = ''
      window.scrollTo(0, y)
    }
  }, [])

  const cargar = async () => {
    setCargando(true)
    const { invitaciones } = await misInvitaciones()
    setInvitaciones(invitaciones || [])
    setCargando(false)
  }
  useEffect(() => { cargar() }, [])

  const mostrarToast = (txt) => { setToast(txt); setTimeout(() => setToast(null), 2600) }

  const responder = async (inv, aceptar) => {
    if (procesando) return
    setProcesando(inv.id)
    const { error } = await responderInvitacion(inv.id, aceptar)
    setProcesando(null)
    if (error) { mostrarToast('No se pudo: ' + error); return }
    setInvitaciones((prev) => prev.filter((x) => x.id !== inv.id))
    mostrarToast(aceptar ? '¡Aceptaste la invitación! 🏀' : 'Invitación rechazada')
  }

  const tarjeta = (inv) => {
    const tor = inv.torneos || {}
    const equipo = inv.torneo_equipos?.nombre
    const rol = ROL[inv.tipo] || ROL.jugador
    const yo = procesando === inv.id
    return (
      <div key={inv.id} style={{ background: `linear-gradient(160deg, ${C.card}, ${C.card2})`, border: `0.5px solid ${C.bordeSuave}`, borderRadius: 18, overflow: 'hidden', marginBottom: 13 }}>
        {/* cabecera: torneo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `0.5px solid ${C.bordeSuave}` }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 24, background: `linear-gradient(150deg, ${C.oro}, #c8842e)`, border: '1.5px solid rgba(255,255,255,.16)' }}>{tor.emoji || '🏆'}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: fCond, fontWeight: 600, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: C.muyTenue }}>Te invitaron a</div>
            <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 18, letterSpacing: 0.3, textTransform: 'uppercase', color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tor.nombre || 'Torneo'}</div>
          </div>
        </div>

        {/* cuerpo: equipo + rol */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: inv.mensaje ? 11 : 14 }}>
            <span style={{ color: C.tenue, fontSize: 13.5 }}>Unirte{equipo ? ' a' : ''}</span>
            {equipo && <span style={{ fontFamily: fCond, fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.3, color: C.body }}>{equipo}</span>}
            <span style={{ color: C.tenue, fontSize: 13.5 }}>como</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: fCond, fontWeight: 700, fontSize: 11.5, letterSpacing: 0.6, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 8, color: rol.color, background: `${rol.color}1c`, border: `1px solid ${rol.color}3a` }}>{rol.emoji} {rol.txt}</span>
          </div>

          {inv.mensaje && (
            <div style={{ background: 'rgba(255,255,255,.04)', border: `0.5px solid ${C.bordeSuave}`, borderRadius: 11, padding: '10px 13px', marginBottom: 14, color: C.body, fontSize: 13, lineHeight: 1.45, fontStyle: 'italic' }}>“{inv.mensaje}”</div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button disabled={yo} onClick={() => responder(inv, true)} style={{ flex: 2, border: 'none', borderRadius: 12, padding: '12px', fontFamily: fCond, fontWeight: 700, fontSize: 14, letterSpacing: 0.6, textTransform: 'uppercase', cursor: yo ? 'default' : 'pointer', background: `linear-gradient(180deg, ${C.oroClaro}, ${C.oro})`, color: '#1a1205', opacity: yo ? 0.6 : 1, boxShadow: '0 6px 18px rgba(245,184,46,.24)' }}>{yo ? '…' : '✓ Aceptar'}</button>
            <button disabled={yo} onClick={() => responder(inv, false)} style={{ flex: 1, border: `1px solid ${C.bordeSuave}`, borderRadius: 12, padding: '12px', fontFamily: fCond, fontWeight: 600, fontSize: 14, letterSpacing: 0.6, textTransform: 'uppercase', cursor: yo ? 'default' : 'pointer', background: 'rgba(255,255,255,.04)', color: C.tenue, opacity: yo ? 0.6 : 1 }}>Rechazar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, height: '100dvh', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: font, overflow: 'hidden' }}>
      {/* glow */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 32% at 50% 0%, rgba(245,184,46,.13), transparent 72%)' }} />

      {/* BARRA SUPERIOR FIJA */}
      <div style={{ flexShrink: 0, position: 'relative', zIndex: 3, background: C.panel, borderBottom: `0.5px solid ${C.bordeSuave}`, paddingTop: 'env(safe-area-inset-top)', backdropFilter: 'blur(14px)' }}>
        <div style={{ height: 4, display: 'flex', maxWidth: maxAncho, margin: '0 auto' }}><i style={{ flex: 1, background: C.triAzul }} /><i style={{ flex: 1, background: '#fff' }} /><i style={{ flex: 1, background: C.triRojo }} /></div>
        <div style={{ maxWidth: maxAncho, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px' }}>
          <button onClick={onVolver} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,.06)', color: C.txt, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 18, letterSpacing: 0.4, textTransform: 'uppercase', color: C.txt }}>Mis invitaciones</div>
            <div style={{ color: C.tenue, fontSize: 11.5 }}>Equipos que te invitaron a jugar</div>
          </div>
          {invitaciones.length > 0 && <span style={{ flexShrink: 0, fontFamily: fCond, fontWeight: 700, fontSize: 13, color: '#1a1205', background: `linear-gradient(180deg, ${C.oroClaro}, ${C.oro})`, borderRadius: 14, padding: '4px 12px' }}>{invitaciones.length}</span>}
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <div style={{ maxWidth: maxAncho, margin: '0 auto', padding: esAncho ? '22px 24px calc(env(safe-area-inset-bottom) + 40px)' : '16px 14px calc(env(safe-area-inset-bottom) + 34px)' }}>
          {cargando ? (
            <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, padding: '50px 0' }}>Cargando invitaciones…</div>
          ) : invitaciones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '46px 24px' }}>
              <div style={{ fontSize: 54, marginBottom: 14, opacity: 0.9 }}>✉️</div>
              <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 19, textTransform: 'uppercase', letterSpacing: 0.4, color: C.txt, marginBottom: 9 }}>No tienes invitaciones</div>
              <div style={{ color: C.tenue, fontSize: 13.5, lineHeight: 1.55, maxWidth: 320, margin: '0 auto' }}>Cuando un capitán u organizador te invite a su equipo, la invitación te llegará aquí para que la aceptes.</div>
            </div>
          ) : (
            <>
              <div style={{ color: C.tenue, fontSize: 12.5, marginBottom: 14, lineHeight: 1.5 }}>Acepta para unirte al equipo. El torneo te aparecerá en tu perfil.</div>
              {invitaciones.map((inv) => tarjeta(inv))}
            </>
          )}
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 'calc(env(safe-area-inset-bottom) + 22px)', transform: 'translateX(-50%)', zIndex: 40, background: C.card, border: `1px solid ${C.borde}`, borderRadius: 14, padding: '12px 20px', color: C.txt, fontSize: 13.5, fontWeight: 600, boxShadow: '0 12px 30px rgba(0,0,0,.5)', maxWidth: '88%', textAlign: 'center' }}>{toast}</div>
      )}
    </div>
  )
}