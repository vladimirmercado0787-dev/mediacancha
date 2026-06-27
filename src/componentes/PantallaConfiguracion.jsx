import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { cargarMiPerfil, guardarMiPerfil, cambiarMiPin } from '../social'
import { subirFotoPerfil, subirFoto } from '../fotos'

// ============================================================
//  CONFIGURACIÓN — Media Cancha
//  Empieza por "Mi identidad" (foto, logo personal, apodo y
//  datos editables), más Seguridad (PIN, cerrar sesión).
//  Lo demás queda listado para próximas versiones.
//  Identidad oscura con acento dorado, como el perfil.
// ============================================================

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const fCond = "'Oswald', 'Arial Narrow', 'Helvetica Neue', sans-serif"
const C = {
  bg: '#0b0d12', panel: 'rgba(14,16,22,.96)', card: 'rgba(255,255,255,.045)',
  oro: '#e8b65a', oroBtn: 'linear-gradient(180deg, #ffd66b, #e8b65a)',
  txt: '#f3f1ea', tenue: '#a7a294', muyTenue: '#6f6b61',
  borde: 'rgba(232,182,90,.20)', bordeSuave: 'rgba(255,255,255,.08)',
  rojo: '#e0563f', verde: '#4cc38a', input: 'rgba(255,255,255,.05)',
}
const POSICIONES = [
  { v: 'PG', t: 'Base' }, { v: 'SG', t: 'Escolta' }, { v: 'SF', t: 'Alero' },
  { v: 'PF', t: 'Ala-pívot' }, { v: 'C', t: 'Pívot' },
]
const PRONTO = [
  { ic: '🎨', t: 'Apariencia', d: 'Tema y tamaño de letra' },
  { ic: '🔔', t: 'Notificaciones', d: 'Qué avisos quieres recibir' },
  { ic: '🔒', t: 'Privacidad', d: 'Quién te ve, te sigue y te escribe' },
  { ic: '🛡️', t: 'Mis equipos y logos', d: 'Editar el logo de cada equipo' },
]

export default function PantallaConfiguracion({ onVolver, onSalir }) {
  const [cargando, setCargando] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const [f, setF] = useState({ nombre: '', apellido: '', apodo: '', numero: '', posiciones: [], pies: '', pulgadas: '', frase: '' })
  const [fotoUrl, setFotoUrl] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [pinMsg, setPinMsg] = useState('')
  const [cambiandoPin, setCambiandoPin] = useState(false)
  const refFoto = useRef(null)
  const refLogo = useRef(null)

  useEffect(() => {
    let vivo = true
    cargarMiPerfil().then(({ perfil }) => {
      if (!vivo || !perfil) { setCargando(false); return }
      setPerfil(perfil)
      setFotoUrl(perfil.foto_url || null)
      setLogoUrl(perfil.logo_url || null)
      setF({
        nombre: perfil.nombre || '', apellido: perfil.apellido || '', apodo: perfil.apodo || '',
        numero: perfil.numero || '', posiciones: Array.isArray(perfil.posiciones) ? perfil.posiciones : [],
        pies: perfil.estatura_pies != null ? String(perfil.estatura_pies) : '',
        pulgadas: perfil.estatura_pulgadas != null ? String(perfil.estatura_pulgadas) : '',
        frase: perfil.frase || '',
      })
      setCargando(false)
    }).catch(() => setCargando(false))
    return () => { vivo = false }
  }, [])

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const togglePos = (v) => setF((p) => {
    const ya = p.posiciones.includes(v)
    if (ya) return { ...p, posiciones: p.posiciones.filter((x) => x !== v) }
    if (p.posiciones.length >= 3) return p
    return { ...p, posiciones: [...p.posiciones, v] }
  })
  const flash = (txt) => { setAviso(txt); setTimeout(() => setAviso(null), 2600) }

  const alElegirFoto = async (e) => {
    const arch = e.target.files && e.target.files[0]; e.target.value = ''
    if (!arch) return
    setSubiendoFoto(true)
    try {
      const { url, error } = await subirFotoPerfil(arch)
      if (error || !url) flash('No se pudo subir la foto')
      else { setFotoUrl(url); await guardarMiPerfil({ foto_url: url }) }
    } catch (err) { flash('Error con la foto') }
    setSubiendoFoto(false)
  }
  const alElegirLogo = async (e) => {
    const arch = e.target.files && e.target.files[0]; e.target.value = ''
    if (!arch) return
    setSubiendoLogo(true)
    try {
      const { url, error } = await subirFoto(arch, 'logos', { maxLado: 600, calidad: 0.9 })
      if (error || !url) flash('No se pudo subir el logo')
      else { setLogoUrl(url); await guardarMiPerfil({ logo_url: url }) }
    } catch (err) { flash('Error con el logo') }
    setSubiendoLogo(false)
  }
  const quitarLogo = async () => { setLogoUrl(null); await guardarMiPerfil({ logo_url: null }) }

  const guardar = async () => {
    if (guardando) return
    if (!f.nombre.trim()) { flash('Pon tu nombre'); return }
    setGuardando(true)
    const cambios = {
      nombre: f.nombre.trim(), apellido: f.apellido.trim() || null, apodo: f.apodo.trim() || null,
      numero: f.numero.trim() || null,
      posiciones: f.posiciones.length ? f.posiciones : null,
      estatura_pies: f.pies ? parseInt(f.pies) : null,
      estatura_pulgadas: f.pulgadas !== '' ? parseInt(f.pulgadas) : null,
      frase: f.frase.trim() || null,
    }
    const { error } = await guardarMiPerfil(cambios)
    setGuardando(false)
    flash(error ? 'No se pudo guardar' : '✓ Cambios guardados')
  }

  const cambiarPin = async () => {
    if (cambiandoPin) return
    if (!/^[0-9]{4}$/.test(pin)) { setPinMsg('El código es de cuatro dígitos.'); return }
    if (pin !== pin2) { setPinMsg('Los dos códigos no coinciden.'); return }
    setCambiandoPin(true); setPinMsg('')
    const { error } = await cambiarMiPin(pin)
    setCambiandoPin(false)
    if (error) setPinMsg('No se pudo: ' + error)
    else { setPin(''); setPin2(''); setPinMsg('✓ Código actualizado'); }
  }

  const cerrarSesion = async () => {
    if (!confirm('¿Cerrar sesión?')) return
    try { await supabase.auth.signOut() } catch (e) {}
    onSalir && onSalir()
  }

  const label = { display: 'block', fontSize: 11.5, fontWeight: 700, color: C.tenue, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }
  const inputStyle = { width: '100%', background: C.input, border: `1px solid ${C.bordeSuave}`, borderRadius: 11, padding: '11px 13px', color: C.txt, fontSize: 15, outline: 'none', boxSizing: 'border-box' }
  const Seccion = ({ children }) => <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 12.5, letterSpacing: 1.2, textTransform: 'uppercase', color: C.oro, margin: '22px 2px 12px' }}>{children}</div>
  const Tarjeta = ({ children }) => <div style={{ background: C.card, border: `1px solid ${C.bordeSuave}`, borderRadius: 16, padding: 16 }}>{children}</div>

  const iniciales = `${(f.nombre || '?')[0] || ''}${(f.apellido || '')[0] || ''}`.toUpperCase()

  return (
    <div style={{ fontFamily: FONT, color: C.txt, background: C.bg, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 32% at 50% 0%, rgba(232,182,90,.10), transparent 72%)' }} />

      {/* HEADER */}
      <div style={{ flexShrink: 0, position: 'relative', zIndex: 3, background: C.panel, borderBottom: `0.5px solid ${C.bordeSuave}`, paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px' }}>
          <button onClick={onVolver} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,.06)', color: C.txt, fontSize: 22, cursor: 'pointer' }}>‹</button>
          <div style={{ fontFamily: fCond, fontWeight: 700, fontSize: 19, letterSpacing: 0.4, textTransform: 'uppercase', color: C.txt }}>Configuración</div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '8px 14px calc(env(safe-area-inset-bottom) + 40px)' }}>

          {cargando ? (
            <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, padding: '50px 0' }}>Cargando…</div>
          ) : (
            <>
              <Seccion>Mi identidad</Seccion>
              <Tarjeta>
                {/* Foto y logo */}
                <div style={{ display: 'flex', gap: 18, marginBottom: 18 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div onClick={() => !subiendoFoto && refFoto.current && refFoto.current.click()} style={{ width: 84, height: 84, borderRadius: '50%', cursor: 'pointer', background: fotoUrl ? `url(${fotoUrl}) center/cover` : 'rgba(255,255,255,.06)', display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 800, color: C.oro, border: `2px solid ${C.oro}`, opacity: subiendoFoto ? 0.5 : 1 }}>{!fotoUrl && (iniciales || '📷')}</div>
                    <div style={{ fontSize: 11.5, color: C.oro, fontWeight: 700, marginTop: 7 }}>{subiendoFoto ? 'Subiendo…' : 'Foto'}</div>
                    <input ref={refFoto} type="file" accept="image/*" onChange={alElegirFoto} style={{ display: 'none' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div onClick={() => !subiendoLogo && refLogo.current && refLogo.current.click()} style={{ width: 84, height: 84, borderRadius: 18, cursor: 'pointer', background: logoUrl ? `url(${logoUrl}) center/cover` : 'rgba(255,255,255,.06)', display: 'grid', placeItems: 'center', fontSize: 24, border: `1.5px dashed ${C.borde}`, opacity: subiendoLogo ? 0.5 : 1 }}>{!logoUrl && (subiendoLogo ? '…' : '🛡️')}</div>
                    <div style={{ fontSize: 11.5, color: C.oro, fontWeight: 700, marginTop: 7 }}>{subiendoLogo ? 'Subiendo…' : 'Logo personal'}</div>
                    {logoUrl && <button onClick={quitarLogo} style={{ border: 'none', background: 'transparent', color: C.muyTenue, fontSize: 11, cursor: 'pointer', marginTop: 2 }}>Quitar</button>}
                    <input ref={refLogo} type="file" accept="image/*" onChange={alElegirLogo} style={{ display: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}><label style={label}>Nombre</label><input style={inputStyle} value={f.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Tu nombre" /></div>
                  <div style={{ flex: 1 }}><label style={label}>Apellido</label><input style={inputStyle} value={f.apellido} onChange={(e) => set('apellido', e.target.value)} placeholder="Tu apellido" /></div>
                </div>
                <div style={{ marginBottom: 14 }}><label style={label}>Apodo</label><input style={inputStyle} value={f.apodo} onChange={(e) => set('apodo', e.target.value)} placeholder='Como te conocen. Ej: "El Tigre"' maxLength={24} /></div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 90 }}><label style={label}>Número</label><input style={inputStyle} value={f.numero} onChange={(e) => set('numero', e.target.value.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" placeholder="23" /></div>
                  <div style={{ flex: 1 }}><label style={label}>Altura</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input style={{ ...inputStyle }} value={f.pies} onChange={(e) => set('pies', e.target.value.replace(/\D/g, '').slice(0, 1))} inputMode="numeric" placeholder="Pies" />
                      <input style={{ ...inputStyle }} value={f.pulgadas} onChange={(e) => set('pulgadas', e.target.value.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" placeholder="Pulg." />
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={label}>Posiciones (hasta 3)</label>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {POSICIONES.map((p) => {
                      const on = f.posiciones.includes(p.v)
                      return <button key={p.v} onClick={() => togglePos(p.v)} style={{ border: on ? `1.5px solid ${C.oro}` : `1px solid ${C.bordeSuave}`, background: on ? 'rgba(232,182,90,.14)' : C.input, color: on ? C.oro : C.tenue, borderRadius: 11, padding: '9px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>{p.v} · {p.t}</button>
                    })}
                  </div>
                </div>
                <div style={{ marginBottom: 4 }}><label style={label}>Tu frase</label><input style={inputStyle} value={f.frase} onChange={(e) => set('frase', e.target.value)} placeholder="Algo que te represente" maxLength={80} /></div>
              </Tarjeta>

              <button onClick={guardar} disabled={guardando} style={{ width: '100%', marginTop: 14, border: 'none', borderRadius: 13, padding: 14, background: C.oroBtn, color: '#1a1205', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>

              {/* SEGURIDAD */}
              <Seccion>Seguridad</Seccion>
              <Tarjeta>
                <label style={label}>Cambiar código secreto (4 dígitos)</label>
                <div style={{ fontSize: 11.5, color: C.muyTenue, lineHeight: 1.5, marginBottom: 12 }}>Es tu PIN de jugador, con el que confirmas que jugaste. No se lo des a nadie.</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="password" inputMode="numeric" value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinMsg('') }} placeholder="Nuevo" style={{ ...inputStyle, textAlign: 'center', letterSpacing: 6, fontWeight: 800 }} />
                  <input type="password" inputMode="numeric" value={pin2} onChange={(e) => { setPin2(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinMsg('') }} placeholder="Repetir" style={{ ...inputStyle, textAlign: 'center', letterSpacing: 6, fontWeight: 800 }} />
                </div>
                {pinMsg && <div style={{ fontSize: 12, color: pinMsg.startsWith('✓') ? C.verde : C.rojo, marginTop: 9 }}>{pinMsg}</div>}
                <button onClick={cambiarPin} disabled={cambiandoPin || pin.length !== 4} style={{ width: '100%', marginTop: 12, border: `1px solid ${C.borde}`, borderRadius: 11, padding: 12, background: 'transparent', color: C.oro, fontSize: 14, fontWeight: 700, cursor: (cambiandoPin || pin.length !== 4) ? 'default' : 'pointer', opacity: pin.length !== 4 ? 0.5 : 1 }}>{cambiandoPin ? '…' : 'Cambiar código'}</button>
              </Tarjeta>

              <button onClick={cerrarSesion} style={{ width: '100%', marginTop: 12, border: '1px solid rgba(224,86,63,.32)', borderRadius: 12, padding: 13, background: 'rgba(224,86,63,.10)', color: C.rojo, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>↩ Cerrar sesión</button>

              {/* PRÓXIMAMENTE */}
              <Seccion>Pronto</Seccion>
              {PRONTO.map((p) => (
                <div key={p.t} style={{ display: 'flex', alignItems: 'center', gap: 13, background: C.card, border: `1px solid ${C.bordeSuave}`, borderRadius: 13, padding: 13, marginBottom: 9, opacity: 0.7 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{p.ic}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>{p.t}</div>
                    <div style={{ fontSize: 11.5, color: C.tenue }}>{p.d}</div>
                  </div>
                  <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: C.muyTenue, background: 'rgba(255,255,255,.05)', padding: '4px 9px', borderRadius: 8 }}>Pronto</span>
                </div>
              ))}

              <div style={{ textAlign: 'center', fontSize: 11, color: C.muyTenue, padding: '18px 0 4px' }}>Media Cancha</div>
            </>
          )}
        </div>
      </div>

      {/* AVISO */}
      {aviso && (
        <div style={{ position: 'fixed', left: '50%', bottom: 'calc(env(safe-area-inset-bottom) + 22px)', transform: 'translateX(-50%)', zIndex: 40, background: C.card, border: `1px solid ${C.borde}`, borderRadius: 13, padding: '11px 20px', color: C.txt, fontSize: 13.5, fontWeight: 600, backdropFilter: 'blur(8px)', maxWidth: '88%', textAlign: 'center' }}>{aviso}</div>
      )}
    </div>
  )
}