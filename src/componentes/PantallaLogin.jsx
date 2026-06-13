import { useState } from 'react'
import { supabase } from '../supabaseClient'
import fondoCancha from '../assets/fondo-cancha.png'

const TEMAS = {
  dorado: {
    acento: '#e8b65a', borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)',
    texto: 'linear-gradient(120deg,#fbe08a,#c8842e)', balon: ['#fbe08a', '#d18f33', '#9a6420'],
    boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', glow: 'rgba(190,135,55,0.20)', borde2: 'rgba(232,169,75,.35)',
  },
  azul: {
    acento: '#6fb0ec', borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)',
    texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)', balon: ['#9fd4fb', '#4f8fd0', '#1d4a80'],
    boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', glow: 'rgba(55,120,190,0.22)', borde2: 'rgba(111,176,236,.35)',
  },
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
  const tema = (typeof window !== 'undefined' && localStorage.getItem('mc_tema')) || 'dorado'
  const T = TEMAS[tema] || TEMAS.dorado
  const ORO = { background: T.texto, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }

  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const C = { texto: '#eef3f6', tenue: '#9aa7b2', font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }

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

  const inputStyle = {
    width: '100%', background: 'rgba(12,14,18,0.7)', border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 12, padding: '13px 14px', color: C.texto, fontSize: 15, outline: 'none', fontFamily: C.font,
  }
  const label = { fontSize: 12, color: C.tenue, fontWeight: 600, marginBottom: 6, display: 'block' }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 18px', fontFamily: C.font, background: '#08090c' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(8,9,12,0.82) 0%, rgba(8,9,12,0.9) 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 60% 45% at 50% 40%, ${T.glow}, transparent 70%)` }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><Balon size={58} cols={T.balon} /></div>
        <h1 style={{ fontSize: 25, fontWeight: 800, color: C.texto, margin: '0 0 6px', textAlign: 'center' }}>Iniciar sesión</h1>
        <p style={{ fontSize: 14, color: C.tenue, margin: '0 0 24px', textAlign: 'center' }}>Entra a tu cuenta de Media Cancha</p>

        <div style={{ position: 'relative', borderRadius: 20, padding: 1.5, background: T.borde, width: '100%', maxWidth: 400 }}>
          <div style={{ borderRadius: 19, padding: 24, background: 'linear-gradient(150deg, rgba(24,26,30,0.88), rgba(12,14,18,0.92))', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}>
            <div style={{ marginBottom: 14 }}><label style={label}>Correo</label><input style={inputStyle} type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="tucorreo@ejemplo.com" autoCapitalize="none" /></div>
            <div style={{ marginBottom: 4 }}>
              <label style={label}>Clave</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputStyle, paddingRight: 70 }} type={verClave ? 'text' : 'password'} value={clave} onChange={(e) => setClave(e.target.value)} placeholder="••••••" onKeyDown={(e) => e.key === 'Enter' && entrar()} />
                <span onClick={() => setVerClave(!verClave)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: T.acento, cursor: 'pointer', userSelect: 'none' }}>{verClave ? 'Ocultar' : 'Ver'}</span>
              </div>
            </div>

            {error && <div style={{ marginTop: 14, padding: '10px 13px', borderRadius: 10, background: 'rgba(226,75,74,.14)', border: '1px solid rgba(226,75,74,.3)', color: '#f09595', fontSize: 13 }}>{error}</div>}

            <button onClick={entrar} disabled={cargando} style={{ width: '100%', marginTop: 18, border: 'none', borderRadius: 13, padding: 15, background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 16, cursor: cargando ? 'wait' : 'pointer', opacity: cargando ? 0.7 : 1 }}>
              {cargando ? 'Entrando...' : 'Iniciar sesión'}
            </button>

            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: C.tenue }}>
              ¿No tienes cuenta? <span onClick={() => onIrRegistro && onIrRegistro()} style={{ color: T.acento, fontWeight: 600, cursor: 'pointer' }}>Regístrate gratis</span>
            </div>
          </div>
        </div>

        {onVolver && <div style={{ marginTop: 18 }}><span onClick={onVolver} style={{ color: C.tenue, fontSize: 13, cursor: 'pointer' }}>← Volver al inicio</span></div>}
      </div>
    </div>
  )
}