import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import fondoCancha from '../assets/fondo-cancha.png'

const SUP_OSCURA = {
  esClaro: false, fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2',
  vidrio: 'linear-gradient(150deg, rgba(24,26,30,0.88), rgba(12,14,18,0.92))',
  veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.82) 0%, rgba(8,9,12,0.9) 100%)',
  inputBg: 'rgba(12,14,18,0.7)', inputBorde: 'rgba(255,255,255,.12)',
}
const SUP_CLARA_BASE = {
  esClaro: true, textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58',
  vidrio: 'linear-gradient(150deg, rgba(255,255,255,0.92), rgba(250,248,244,0.95))',
  inputBg: 'rgba(0,0,0,.03)', inputBorde: 'rgba(0,0,0,.12)',
}
const TEMAS = {
  dorado: {
    ...SUP_OSCURA, nombre: 'Dorado', acento: '#e8b65a',
    borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)',
    texto: 'linear-gradient(120deg,#fbe08a,#c8842e)', balon: ['#fbe08a', '#d18f33', '#9a6420'],
    boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', glow: 'rgba(190,135,55,0.20)',
  },
  azul: {
    ...SUP_OSCURA, nombre: 'Azul', acento: '#6fb0ec',
    borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)',
    texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)', balon: ['#9fd4fb', '#4f8fd0', '#1d4a80'],
    boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', glow: 'rgba(55,120,190,0.22)',
  },
  claro: {
    ...SUP_CLARA_BASE, nombre: 'Claro', acento: '#b07a26', fondo: '#e6dcc8',
    borde: 'linear-gradient(140deg,#f0d79a,#c79a45 40%,#9a7530 70%,#e3c578)',
    texto: 'linear-gradient(120deg,#c8902f,#9a6420)', balon: ['#e7c069', '#c8842e', '#9a6420'],
    boton: 'linear-gradient(150deg, #e7c069, #b07a26)', glow: 'rgba(190,135,55,0.12)',
    veloGrad: 'linear-gradient(180deg, rgba(248,243,233,0.82) 0%, rgba(244,238,226,0.9) 100%)',
  },
  larimar: {
    ...SUP_CLARA_BASE, nombre: 'Larimar', acento: '#2a8fb8', fondo: '#d6e7e8',
    borde: 'linear-gradient(140deg,#8fd4e8,#2a8fb8 45%,#1a6a8a 75%,#6ac0d8)',
    texto: 'linear-gradient(120deg,#2a8fb8,#1a6a8a)', balon: ['#6ac0d8', '#2a8fb8', '#1a6a8a'],
    boton: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', glow: 'rgba(42,143,184,0.14)',
    veloGrad: 'linear-gradient(180deg, rgba(232,244,245,0.82) 0%, rgba(224,240,242,0.9) 100%)',
    textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375',
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
  const [tema, setTema] = useState(() => {
    const validos = ['dorado', 'azul', 'claro', 'larimar']
    if (typeof window !== 'undefined') {
      const g = localStorage.getItem('mc_tema')
      return validos.includes(g) ? g : 'dorado'
    }
    return 'dorado'
  })
  const T = TEMAS[tema] || TEMAS.dorado
  const ORO = { background: T.texto, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }
  const C = { texto: T.textoBody, tenue: T.tenue, font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }

  const cambiarTema = () => {
    const orden = ['dorado', 'azul', 'claro', 'larimar']
    const i = orden.indexOf(tema)
    const nuevo = orden[(i + 1) % orden.length]
    setTema(nuevo)
    try { localStorage.setItem('mc_tema', nuevo) } catch (e) {}
  }

  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // ===== CANDADO OFICIAL: congela el fondo para que no se mueva con el teclado =====
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

  const inputStyle = {
    width: '100%', background: T.inputBg, border: `1px solid ${T.inputBorde}`,
    borderRadius: 12, padding: '13px 14px', color: T.textoFuerte, fontSize: 15, outline: 'none', fontFamily: C.font, boxSizing: 'border-box',
  }
  const label = { fontSize: 12, color: C.tenue, fontWeight: 600, marginBottom: 6, display: 'block' }

  return (
    <div style={{ height: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 18px', fontFamily: C.font, background: T.fondo }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: T.veloGrad }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 60% 45% at 50% 40%, ${T.glow}, transparent 70%)` }} />

      {/* selector de tema flotante */}
      <button onClick={cambiarTema} title={`Tema: ${T.nombre}`} style={{ position: 'fixed', top: 18, right: 18, zIndex: 5, display: 'flex', alignItems: 'center', gap: 7, background: T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(20,18,16,.7)', border: `1px solid ${T.acento}55`, color: T.acento, fontSize: 11.5, fontWeight: 700, padding: '7px 11px', borderRadius: 10, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: T.boton, display: 'inline-block' }} />{T.nombre}
      </button>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><Balon size={58} cols={T.balon} /></div>
        <h1 style={{ fontSize: 25, fontWeight: 800, color: T.textoFuerte, margin: '0 0 6px', textAlign: 'center' }}>Iniciar sesión</h1>
        <p style={{ fontSize: 14, color: C.tenue, margin: '0 0 24px', textAlign: 'center' }}>Entra a tu cuenta de Media Cancha</p>

        <div style={{ position: 'relative', borderRadius: 20, padding: 1.5, background: T.borde, width: '100%', maxWidth: 400 }}>
          <div style={{ position: 'relative', borderRadius: 19, padding: 24, background: T.vidrio, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}>
            {/* costura dorada credencial */}
            <div style={{ position: 'absolute', inset: 8, borderRadius: 13, border: `1.5px dashed ${T.acento}33`, pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ marginBottom: 14 }}><label style={label}>Correo</label><input style={inputStyle} type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="tucorreo@ejemplo.com" autoCapitalize="none" /></div>
              <div style={{ marginBottom: 4 }}>
                <label style={label}>Clave</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inputStyle, paddingRight: 70 }} type={verClave ? 'text' : 'password'} value={clave} onChange={(e) => setClave(e.target.value)} placeholder="••••••" onKeyDown={(e) => e.key === 'Enter' && entrar()} />
                  <span onClick={() => setVerClave(!verClave)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: T.acento, cursor: 'pointer', userSelect: 'none' }}>{verClave ? 'Ocultar' : 'Ver'}</span>
                </div>
              </div>

              {error && <div style={{ marginTop: 14, padding: '10px 13px', borderRadius: 10, background: 'rgba(226,75,74,.14)', border: '1px solid rgba(226,75,74,.3)', color: '#e0563f', fontSize: 13 }}>{error}</div>}

              <button onClick={entrar} disabled={cargando} style={{ width: '100%', marginTop: 18, border: 'none', borderRadius: 13, padding: 15, background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 16, cursor: cargando ? 'wait' : 'pointer', opacity: cargando ? 0.7 : 1 }}>
                {cargando ? 'Entrando...' : 'Iniciar sesión'}
              </button>

              <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: C.tenue }}>
                ¿No tienes cuenta? <span onClick={() => onIrRegistro && onIrRegistro()} style={{ color: T.acento, fontWeight: 600, cursor: 'pointer' }}>Regístrate gratis</span>
              </div>
            </div>
          </div>
        </div>

        {onVolver && <div style={{ marginTop: 18 }}><span onClick={onVolver} style={{ color: C.tenue, fontSize: 13, cursor: 'pointer' }}>← Volver al inicio</span></div>}
      </div>
    </div>
  )
}