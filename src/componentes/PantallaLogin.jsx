import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import fondoCancha from '../assets/fondo-cancha.png'

// ============================================================
//  IDENTIDAD MEDIA CANCHA (rediseño) — usa la misma clave 'mc_tema'
//  y los mismos nombres de tema de la app (dorado/azul/claro/larimar)
//  para no chocar con las pantallas que todavía no se han migrado.
//  Aquí "azul" = el navy premium "Cancha de noche".
// ============================================================
const FUENTE = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const DISP = '"Arial Narrow","Roboto Condensed","Helvetica Neue",Impact,sans-serif'
const TRI_AZUL = '#1b3a8c', TRI_ROJO = '#ce1126'

const TEMAS = {
  azul: { esClaro: false, bg: '#070f26', glow1: 'rgba(62,107,214,.22)', glow2: 'rgba(228,38,60,.14)', veil: 'linear-gradient(180deg, rgba(7,13,29,.82), rgba(5,10,24,.95))', surf: 'rgba(255,255,255,.06)', surf2: 'rgba(255,255,255,.09)', bd: 'rgba(150,172,228,.18)', bd2: 'rgba(150,172,228,.32)', tx: '#eef3fc', tx2: '#c2cce0', tn: '#8a9bc0', accent: '#3e6bd6', hot: '#e8b65a', live: '#e4263c', boton: 'linear-gradient(135deg,#3e6bd6,#2748a0)', onBoton: '#fff', inputBg: 'rgba(255,255,255,.05)', inputBd: 'rgba(150,172,228,.25)', balon: ['#9fd4fb', '#4f8fd0', '#1d4a80'], nombre: 'Cancha de noche' },
  dorado: { esClaro: false, bg: '#141009', glow1: 'rgba(232,182,79,.20)', glow2: 'rgba(180,30,47,.12)', veil: 'linear-gradient(180deg, rgba(20,16,9,.84), rgba(14,11,6,.95))', surf: 'rgba(255,240,210,.06)', surf2: 'rgba(255,240,210,.10)', bd: 'rgba(232,182,79,.22)', bd2: 'rgba(232,182,79,.40)', tx: '#f6efe1', tx2: '#dccdb0', tn: '#a08e6f', accent: '#e8b65a', hot: '#f0c674', live: '#e4263c', boton: 'linear-gradient(135deg,#f0c674,#caa24a)', onBoton: '#211705', inputBg: 'rgba(255,240,210,.05)', inputBd: 'rgba(232,182,79,.30)', balon: ['#fbe08a', '#d18f33', '#9a6420'], nombre: 'Dorado' },
  claro: { esClaro: true, bg: '#eef2fa', glow1: 'rgba(27,58,140,.10)', glow2: 'rgba(206,17,38,.07)', veil: 'linear-gradient(180deg, rgba(238,242,250,.84), rgba(233,238,248,.96))', surf: '#ffffff', surf2: '#f5f8fd', bd: '#e5eaf4', bd2: '#d3dcec', tx: '#13224a', tx2: '#46557a', tn: '#8b97b2', accent: '#1b3a8c', hot: '#1b3a8c', live: '#ce1126', boton: 'linear-gradient(135deg,#1b3a8c,#2a4fa8)', onBoton: '#fff', inputBg: '#ffffff', inputBd: '#d3dcec', balon: ['#2a4fa8', '#1b3a8c', '#16224a'], nombre: 'Cancha de día' },
  larimar: { esClaro: false, bg: '#04181f', glow1: 'rgba(63,193,201,.22)', glow2: 'rgba(86,214,221,.12)', veil: 'linear-gradient(180deg, rgba(4,24,31,.84), rgba(3,18,26,.95))', surf: 'rgba(200,250,255,.06)', surf2: 'rgba(200,250,255,.10)', bd: 'rgba(63,193,201,.22)', bd2: 'rgba(63,193,201,.42)', tx: '#e8fbff', tx2: '#b9e6ec', tn: '#79b4bd', accent: '#3fc1c9', hot: '#56d6dd', live: '#ff5a6e', boton: 'linear-gradient(135deg,#56d6dd,#2ba6ae)', onBoton: '#04222a', inputBg: 'rgba(200,250,255,.05)', inputBd: 'rgba(63,193,201,.30)', balon: ['#8fd4e8', '#3fc1c9', '#1a6a8a'], nombre: 'Larimar' },
}
const ORDEN_TEMAS = ['azul', 'dorado', 'claro', 'larimar']
function leerTema() {
  try { const v = localStorage.getItem('mc_tema'); if (TEMAS[v]) return v } catch (e) {}
  return 'azul'
}

function Balon({ size = 64, cols }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: 'block' }}>
      <defs><linearGradient id="glogbal" gradientUnits="userSpaceOnUse" x1="100" y1="22" x2="100" y2="178">
        <stop offset="0%" stopColor={cols[0]} /><stop offset="50%" stopColor={cols[1]} /><stop offset="100%" stopColor={cols[2]} /></linearGradient></defs>
      <g fill="none" stroke="url(#glogbal)" strokeLinecap="round">
        <circle cx="100" cy="100" r="78" strokeWidth="5.5" /><line x1="0" y1="100" x2="200" y2="100" strokeWidth="5.5" />
        <path d="M58 50 Q90 100 58 150" strokeWidth="5.5" /><path d="M142 50 Q110 100 142 150" strokeWidth="5.5" />
        <line x1="100" y1="40" x2="100" y2="160" strokeWidth="6.5" />
      </g>
    </svg>
  )
}

export default function PantallaLogin({ onListo, onIrRegistro, onVolver }) {
  const [tema, setTema] = useState(leerTema)
  const T = TEMAS[tema] || TEMAS.azul
  const C = { texto: T.tx2, tenue: T.tn, font: FUENTE }

  const cambiarTema = () => {
    const i = ORDEN_TEMAS.indexOf(tema)
    const nuevo = ORDEN_TEMAS[(i + 1) % ORDEN_TEMAS.length]
    setTema(nuevo)
    try { localStorage.setItem('mc_tema', nuevo) } catch (e) {}
  }

  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

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

  const entrar = async () => {
    setError('')
    if (!correo.trim()) return setError('Escribe tu correo.')
    if (!clave) return setError('Escribe tu clave.')
    setCargando(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: clave })
      if (err) throw err
      onListo && onListo()
    } catch (e) {
      const msg = (e.message || '').toLowerCase()
      if (msg.includes('invalid')) setError('Correo o clave incorrectos. Revísalos.')
      else setError(e.message || 'No se pudo iniciar sesión.')
    } finally {
      setCargando(false)
    }
  }

  const inputStyle = { width: '100%', background: T.inputBg, border: `1px solid ${T.inputBd}`, borderRadius: 12, padding: '13px 14px', color: T.tx, fontSize: 15, outline: 'none', fontFamily: FUENTE, boxSizing: 'border-box' }
  const label = { fontSize: 11.5, color: C.tenue, fontWeight: 700, marginBottom: 6, display: 'block', letterSpacing: 0.2, textTransform: 'uppercase' }

  return (
    <div style={{ height: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 18px', fontFamily: FUENTE, background: T.bg }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: T.esClaro ? 0.25 : 0.5 }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: T.veil }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(360px 300px at 12% 8%, ${T.glow1}, transparent 60%), radial-gradient(380px 320px at 92% 92%, ${T.glow2}, transparent 60%)` }} />

      <button onClick={cambiarTema} title={`Tema: ${T.nombre}`} style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top) + 14px)', right: 16, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, background: T.surf, border: `1px solid ${T.bd}`, borderRadius: 10, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
        <span style={{ width: 13, height: 13, borderRadius: '50%', background: T.boton, display: 'inline-block', boxShadow: `0 0 8px ${T.accent}66` }} />
      </button>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Balon size={56} cols={T.balon} /></div>
        <div style={{ fontFamily: DISP, fontStyle: 'italic', fontWeight: 700, fontSize: 26, letterSpacing: 0.3, lineHeight: 1, marginBottom: 16, textAlign: 'center' }}>
          <span style={{ color: T.tx2 }}>MEDIA</span><span style={{ color: T.accent }}>CANCHA</span>
        </div>

        <div style={{ position: 'relative', borderRadius: 22, width: '100%', maxWidth: 400, background: T.surf, border: `1px solid ${T.bd2}`, overflow: 'hidden', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', boxShadow: T.esClaro ? '0 18px 44px rgba(27,58,140,.16)' : '0 18px 46px rgba(4,10,28,.5)' }}>
          <div style={{ display: 'flex', height: 4 }}><span style={{ flex: 1, background: TRI_AZUL }} /><span style={{ flex: 1, background: '#fff' }} /><span style={{ flex: 1, background: TRI_ROJO }} /></div>
          <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.tx, margin: '0 0 4px', textAlign: 'center' }}>Iniciar sesión</h1>
            <p style={{ fontSize: 13.5, color: C.tenue, margin: '0 0 22px', textAlign: 'center' }}>Entra a tu cuenta</p>

            <div style={{ marginBottom: 14 }}><label style={label}>Correo</label><input style={inputStyle} type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="tucorreo@ejemplo.com" autoCapitalize="none" /></div>
            <div style={{ marginBottom: 4 }}>
              <label style={label}>Clave</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputStyle, paddingRight: 70 }} type={verClave ? 'text' : 'password'} value={clave} onChange={(e) => setClave(e.target.value)} placeholder="••••••" onKeyDown={(e) => e.key === 'Enter' && entrar()} />
                <span onClick={() => setVerClave(!verClave)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: T.accent, cursor: 'pointer', userSelect: 'none' }}>{verClave ? 'Ocultar' : 'Ver'}</span>
              </div>
            </div>

            {error && <div style={{ marginTop: 14, padding: '10px 13px', borderRadius: 10, background: 'rgba(228,38,60,.14)', border: '1px solid rgba(228,38,60,.32)', color: '#ff8593', fontSize: 13 }}>{error}</div>}

            <button onClick={entrar} disabled={cargando} style={{ width: '100%', marginTop: 18, border: 'none', borderRadius: 13, padding: 15, background: T.boton, color: T.onBoton, fontWeight: 800, fontSize: 16, cursor: cargando ? 'wait' : 'pointer', opacity: cargando ? 0.7 : 1 }}>
              {cargando ? 'Entrando...' : 'Iniciar sesión'}
            </button>

            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: C.tenue }}>
              ¿No tienes cuenta? <span onClick={() => onIrRegistro && onIrRegistro()} style={{ color: T.accent, fontWeight: 700, cursor: 'pointer' }}>Regístrate gratis</span>
            </div>
          </div>
        </div>

        {onVolver && <div style={{ marginTop: 18 }}><span onClick={onVolver} style={{ color: C.tenue, fontSize: 13, cursor: 'pointer' }}>‹ Volver al inicio</span></div>}
      </div>
    </div>
  )
}