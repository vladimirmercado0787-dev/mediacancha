import { useState, useEffect } from 'react'
import { aviso, confirmar } from './Avisos'
import { buscarPersonas } from '../torneos'
import { leerMiembrosLiga, quitarMiembroLiga, invitarMiembroLiga, leerInvitacionesLiga, confirmarMiembroLigaConCodigo } from '../ligas'

// ============================================================
//  INVITAR MIEMBROS A LA LIGA
//  - Busca cuentas registradas y las agrega como miembros.
//  - Muestra el roster real (con quitar).
//  - Comparte una invitación para los que aún no están en la app.
//  Identidad TURQUESA, igual que la pantalla de liga.
// ============================================================

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const DISP = '"Arial Narrow", Impact, "Haettenschweiler", system-ui, sans-serif'
const C = {
  fondo: '#04161a', glow: 'rgba(31,209,193,0.14)', panel: 'rgba(255,255,255,0.045)',
  borde: 'rgba(110,205,196,0.18)', borde2: 'rgba(110,205,196,0.34)', txt: '#eafcf8',
  tenue: '#84b8b2', tenue2: '#56908a', teal: '#27d3c2', rojo: '#e0563f',
}
const TEAL_BTN = 'linear-gradient(150deg, #36e3d2, #0e9c90)'
const ROL_LBL = { admin: 'Dueño', presidente: 'Presidente', vice: 'Vicepresidente', tesorero: 'Tesorero', miembro: 'Miembro' }

export default function PantallaInvitarLiga({ liga, onVolver }) {
  const ligaId = liga && liga.id
  const nombreCompleto = (p) => `${(p && p.nombre) || ''} ${(p && p.apellido) || ''}`.trim()

  const [miembros, setMiembros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [agregando, setAgregando] = useState(null)
  const [pendientes, setPendientes] = useState([])
  const [confirmando, setConfirmando] = useState(null) // persona a confirmar con su PIN
  const [pin, setPin] = useState('')
  const [errorPin, setErrorPin] = useState('')
  const [verificando, setVerificando] = useState(false)

  const cargarMiembros = () => {
    if (!ligaId) { setMiembros([]); setCargando(false); return }
    setCargando(true)
    leerMiembrosLiga(ligaId)
      .then(({ miembros }) => setMiembros(miembros || []))
      .catch(() => setMiembros([]))
      .finally(() => setCargando(false))
  }
  const cargarPendientes = () => {
    if (!ligaId) { setPendientes([]); return }
    leerInvitacionesLiga(ligaId).then(({ invitaciones }) => setPendientes(invitaciones || [])).catch(() => setPendientes([]))
  }
  useEffect(() => { cargarMiembros(); cargarPendientes() }, [ligaId])

  // Búsqueda con espera (debounce)
  useEffect(() => {
    let vivo = true
    const t = buscar.trim()
    if (t.length < 2) { setResultados([]); setBuscando(false); return }
    setBuscando(true)
    const id = setTimeout(() => {
      buscarPersonas(t)
        .then(({ personas }) => { if (vivo) setResultados(personas || []) })
        .catch(() => { if (vivo) setResultados([]) })
        .finally(() => { if (vivo) setBuscando(false) })
    }, 300)
    return () => { vivo = false; clearTimeout(id) }
  }, [buscar])

  const yaEsMiembro = (perfilId) => miembros.some((m) => m.perfil_id === perfilId)
  const yaInvitado = (perfilId) => pendientes.some((i) => i.invitado_id === perfilId)

  const invitar = async (p) => {
    if (!ligaId || yaEsMiembro(p.id) || yaInvitado(p.id)) return
    setAgregando(p.id)
    const { error } = await invitarMiembroLiga(ligaId, p.id, 'miembro')
    if (error) aviso('No se pudo invitar: ' + error)
    else { setBuscar(''); setResultados([]); cargarPendientes() }
    setAgregando(null)
  }

  // Confirmar en persona: la persona escribe SU PIN en este teléfono
  const abrirConfirmar = (persona) => { setConfirmando(persona); setPin(''); setErrorPin('') }
  const cerrarConfirmar = () => { setConfirmando(null); setPin(''); setErrorPin('') }
  const verificarConfirmar = async () => {
    if (!confirmando || verificando) return
    if (!/^[0-9]{4}$/.test(pin)) { setErrorPin('Escribe los cuatro dígitos.'); return }
    setVerificando(true); setErrorPin('')
    const { ok, error } = await confirmarMiembroLigaConCodigo(ligaId, confirmando.id, pin)
    setVerificando(false)
    if (!ok) { setErrorPin(error || 'Código incorrecto.'); return }
    const nom = nombreCompleto(confirmando)
    cerrarConfirmar()
    setBuscar(''); setResultados([])
    cargarMiembros(); cargarPendientes()
    aviso('✓ ' + (nom || 'Miembro') + ' confirmado')
  }

  const quitar = async (m) => {
    if (!ligaId) return
    if (m.rol === 'admin') { aviso('El dueño de la liga no se puede quitar.'); return }
    if (!(await confirmar(`¿Quitar a ${nombreCompleto(m.perfil)} de la liga?`))) return
    const { error } = await quitarMiembroLiga(ligaId, m.perfil_id)
    if (error) aviso('No se pudo quitar: ' + error)
    else cargarMiembros()
  }

  const compartirInvitacion = async () => {
    const nom = (liga && liga.nombre) || 'mi liga'
    const texto = `🏀 Te invito a *${nom}* en Media Cancha. Descárgate la app y regístrate; luego te agrego a la liga.`
    try {
      if (navigator.share) { await navigator.share({ title: nom, text: texto }); return }
    } catch (e) { /* el usuario canceló o no se pudo */ }
    try {
      await navigator.clipboard.writeText(texto)
      aviso('Invitación copiada. Pégala en WhatsApp o donde quieras.')
    } catch (e) {
      window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank')
    }
  }

  const Avatar = ({ url, nombre, size = 44 }) => (
    <span style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: url ? `url(${url}) center/cover` : TEAL_BTN, color: '#04161a', fontSize: size * 0.36, fontWeight: 800 }}>
      {!url && ((nombre || '?').slice(0, 1).toUpperCase())}
    </span>
  )

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.borde2}`, borderRadius: 12, padding: '12px 14px', color: C.txt, fontSize: 15, outline: 'none', boxSizing: 'border-box' }
  const TituloSec = ({ children }) => (
    <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: C.teal, margin: '20px 0 10px' }}>{children}</div>
  )

  return (
    <div style={{ fontFamily: FONT, color: C.txt, background: C.fondo, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 70% 36% at 50% 0%, ${C.glow}, transparent 72%)` }} />

      {/* HEADER */}
      <div style={{ position: 'relative', zIndex: 3, flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: C.panel, borderBottom: `0.5px solid ${C.borde}` }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, #0e9c90, #36e3d2, #0e9c90)', maxWidth: 760, margin: '0 auto' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 12px', maxWidth: 760, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <button onClick={onVolver} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,.06)', color: C.txt, fontSize: 22, cursor: 'pointer' }}>‹</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DISP, fontSize: 19, fontWeight: 900, letterSpacing: 0.3, textTransform: 'uppercase', color: C.txt }}>Invitar miembros</div>
            <div style={{ fontSize: 11.5, color: C.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(liga && liga.nombre) || 'Liga'}</div>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 14px 40px' }}>

          {/* BUSCAR */}
          <div style={{ fontSize: 13.5, color: C.txt, fontWeight: 700, marginBottom: 4 }}>Invitar de la app</div>
          <div style={{ fontSize: 12, color: C.tenue, lineHeight: 1.55, marginBottom: 12 }}>Busca por nombre o código a quien tenga cuenta. <strong style={{ color: C.txt }}>Invitar</strong> le manda la invitación a su pantalla para que la acepte. Si la persona está aquí contigo, dale a <strong style={{ color: C.txt }}>Con código</strong> y que escriba su código secreto de cuatro dígitos para confirmar al instante.</div>
          <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Nombre o código…" style={inputStyle} />
          {buscando && <div style={{ color: C.tenue2, fontSize: 11.5, marginTop: 8 }}>Buscando…</div>}
          {resultados.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.borde}`, borderRadius: 13, overflow: 'hidden', marginTop: 10 }}>
              {resultados.map((p) => {
                const dentro = yaEsMiembro(p.id)
                const invitado = yaInvitado(p.id)
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderBottom: `0.5px solid ${C.borde}` }}>
                    <Avatar url={p.foto_url} nombre={p.nombre} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreCompleto(p)}</div>
                      <div style={{ fontSize: 11, color: C.tenue }}>{p.codigo_unico || ''}{p.municipio ? ` · ${p.municipio}` : ''}</div>
                    </div>
                    {dentro ? (
                      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: C.tenue2 }}>Ya está ✓</span>
                    ) : (
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                        {invitado ? (
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.teal }}>Invitado ✓</span>
                        ) : (
                          <button onClick={() => invitar(p)} disabled={agregando === p.id} style={{ border: 'none', borderRadius: 9, padding: '7px 14px', background: TEAL_BTN, color: '#04161a', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>{agregando === p.id ? '…' : 'Invitar'}</button>
                        )}
                        <button onClick={() => abrirConfirmar(p)} style={{ border: `1px solid ${C.borde2}`, borderRadius: 9, padding: '6px 12px', background: 'transparent', color: C.teal, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>🔒 Con código</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {buscar.trim().length >= 2 && !buscando && resultados.length === 0 && (
            <div style={{ color: C.tenue2, fontSize: 12, marginTop: 8 }}>No se encontró ninguna cuenta con ese nombre o código.</div>
          )}

          {/* COMPARTIR PARA LOS QUE NO ESTÁN EN LA APP */}
          <TituloSec>¿No está en la app?</TituloSec>
          <div style={{ background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 14, padding: 15 }}>
            <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.55, marginBottom: 13 }}>Mándale la invitación para que se registre. Cuando tenga cuenta, lo buscas arriba y lo invitas. Mientras tanto, para un juego lo escribes por su nombre.</div>
            <button onClick={compartirInvitacion} style={{ width: '100%', border: 'none', borderRadius: 12, padding: '13px 0', background: TEAL_BTN, color: '#04161a', fontSize: 14.5, fontWeight: 800, cursor: 'pointer' }}>📲 Compartir invitación</button>
          </div>

          {/* INVITACIONES PENDIENTES (enviadas) */}
          {pendientes.length > 0 && (
            <>
              <TituloSec>{pendientes.length} {pendientes.length === 1 ? 'invitación pendiente' : 'invitaciones pendientes'}</TituloSec>
              {pendientes.map((i) => (
                <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 11, background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 11, marginBottom: 9 }}>
                  <Avatar url={i.perfil && i.perfil.foto_url} nombre={i.perfil && i.perfil.nombre} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreCompleto(i.perfil) || 'Invitado'}</div>
                    <div style={{ fontSize: 11.5, color: C.tenue }}>Esperando que acepte</div>
                  </div>
                  <button onClick={() => abrirConfirmar(i.perfil)} style={{ flexShrink: 0, border: `1px solid ${C.borde2}`, borderRadius: 9, padding: '7px 12px', background: 'transparent', color: C.teal, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>🔒 Con código</button>
                </div>
              ))}
            </>
          )}

          {/* MIEMBROS ACTUALES */}
          <TituloSec>{cargando ? 'Miembros' : `${miembros.length} ${miembros.length === 1 ? 'miembro' : 'miembros'}`}</TituloSec>
          {cargando ? (
            <div style={{ color: C.tenue, fontSize: 13, padding: '6px 2px' }}>Cargando…</div>
          ) : miembros.length === 0 ? (
            <div style={{ color: C.tenue, fontSize: 13, padding: '6px 2px', lineHeight: 1.5 }}>Todavía no hay miembros. Agrega el primero buscándolo arriba.</div>
          ) : (
            miembros.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 11, marginBottom: 9 }}>
                <Avatar url={m.perfil && m.perfil.foto_url} nombre={m.perfil && m.perfil.nombre} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreCompleto(m.perfil) || 'Miembro'}</div>
                  <div style={{ fontSize: 11.5, color: C.tenue }}>{ROL_LBL[m.rol] || 'Miembro'}{m.perfil && m.perfil.codigo_unico ? ` · ${m.perfil.codigo_unico}` : ''}</div>
                </div>
                {m.rol === 'admin' ? (
                  <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: C.teal, background: `${C.teal}22`, padding: '4px 10px', borderRadius: 8 }}>Dueño</span>
                ) : (
                  <button onClick={() => quitar(m)} style={{ flexShrink: 0, border: 'none', background: 'transparent', color: C.tenue2, fontSize: 18, cursor: 'pointer', padding: '4px 6px' }}>✕</button>
                )}
              </div>
            ))
          )}

        </div>
      </div>

      {/* MODAL: confirmar en persona con el PIN del jugador */}
      {confirmando && (
        <div onClick={() => !verificando && cerrarConfirmar()} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.fondo, border: `1px solid ${C.borde2}`, borderRadius: 18, width: '100%', maxWidth: 380, padding: 22, textAlign: 'center' }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>🔒</div>
            <div style={{ fontFamily: DISP, fontWeight: 900, fontSize: 20, textTransform: 'uppercase', letterSpacing: 0.4, color: C.txt, marginBottom: 8 }}>Confirmar a {nombreCompleto(confirmando) || 'jugador'}</div>
            <div style={{ color: C.tenue, fontSize: 13, lineHeight: 1.5, marginBottom: 18 }}>Que <strong style={{ color: C.txt }}>{nombreCompleto(confirmando)}</strong> escriba aquí su código secreto de cuatro dígitos para entrar a la liga al instante.</div>
            <input value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setErrorPin('') }} type="tel" inputMode="numeric" autoFocus maxLength={4} placeholder="••••" style={{ width: '100%', textAlign: 'center', fontFamily: DISP, fontSize: 34, letterSpacing: 14, padding: '12px 0', borderRadius: 13, border: `1px solid ${errorPin ? 'rgba(226,75,74,.6)' : C.borde2}`, background: 'rgba(255,255,255,.05)', color: C.txt, outline: 'none', boxSizing: 'border-box' }} />
            {errorPin && <div style={{ fontSize: 12.5, color: C.rojo, marginTop: 9 }}>{errorPin}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button disabled={verificando} onClick={cerrarConfirmar} style={{ flex: 1, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', background: 'transparent', color: C.tenue }}>Cancelar</button>
              <button disabled={verificando || pin.length !== 4} onClick={verificarConfirmar} style={{ flex: 1, border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 800, cursor: (verificando || pin.length !== 4) ? 'default' : 'pointer', background: (verificando || pin.length !== 4) ? 'rgba(54,227,210,.4)' : TEAL_BTN, color: '#04161a' }}>{verificando ? '…' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}