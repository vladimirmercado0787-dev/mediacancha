import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { subirFotoPerfil } from '../fotos'
import RecortadorFoto from './RecortadorFoto'
import fondoCancha from '../assets/fondo-cancha.webp'
import { MUNICIPIOS_RD } from '../data/municipiosRD'
import { ESTADOS_USA } from '../data/estadosUSA'

// Catálogo de divisiones por país (RD = provincias/municipios, USA = estados/ciudades)
const PAISES = {
  rd: { nombre: 'República Dominicana', datos: MUNICIPIOS_RD, etiquetaRegion: 'Provincia', etiquetaCiudad: 'Municipio' },
  usa: { nombre: 'Estados Unidos', datos: ESTADOS_USA, etiquetaRegion: 'Estado', etiquetaCiudad: 'Ciudad' },
}

function regionesDe(paisLlave) {
  const pais = PAISES[paisLlave]
  if (!pais) return []
  return Object.keys(pais.datos)
    .map((k) => ({ llave: k, nombre: pais.datos[k].provincia }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
}

function ciudadesDe(paisLlave, llaveRegion) {
  const pais = PAISES[paisLlave]
  if (!pais || !llaveRegion || !pais.datos[llaveRegion]) return []
  return pais.datos[llaveRegion].municipios
    .map((m) => m.nombre)
    .sort((a, b) => a.localeCompare(b))
}

const SUP_OSCURA = {
  esClaro: false, fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2',
  vidrio: 'linear-gradient(150deg, rgba(24,26,30,0.88), rgba(12,14,18,0.92))',
  veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.82) 0%, rgba(8,9,12,0.9) 100%)',
  inputBg: 'rgba(12,14,18,0.7)', inputBorde: 'rgba(255,255,255,.12)', optionBg: '#14161a', lineaSuave: 'rgba(255,255,255,.08)',
}
const SUP_CLARA_BASE = {
  esClaro: true, textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58',
  vidrio: 'linear-gradient(150deg, rgba(255,255,255,0.92), rgba(250,248,244,0.95))',
  inputBg: 'rgba(0,0,0,.03)', inputBorde: 'rgba(0,0,0,.12)', optionBg: '#fff', lineaSuave: 'rgba(0,0,0,.08)',
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

const POSICIONES = [
  { v: 'PG', sigla: 'PG', t: 'Base' },
  { v: 'SG', sigla: 'SG', t: 'Escolta' },
  { v: 'SF', sigla: 'SF', t: 'Alero' },
  { v: 'PF', sigla: 'PF', t: 'Ala-pívot' },
  { v: 'C', sigla: 'C', t: 'Pívot' },
]

function Balon({ size = 64, cols }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: 'block' }}>
      <defs><linearGradient id="gregbal" gradientUnits="userSpaceOnUse" x1="100" y1="22" x2="100" y2="178">
        <stop offset="0%" stopColor={cols[0]} /><stop offset="50%" stopColor={cols[1]} /><stop offset="100%" stopColor={cols[2]} /></linearGradient></defs>
      <g fill="none" stroke="url(#gregbal)" strokeLinecap="round">
        <circle cx="100" cy="100" r="78" strokeWidth="5.5" /><line x1="0" y1="100" x2="200" y2="100" strokeWidth="5.5" />
        <path d="M58 50 Q90 100 58 150" strokeWidth="5.5" /><path d="M142 50 Q110 100 142 150" strokeWidth="5.5" />
        <line x1="100" y1="40" x2="100" y2="160" strokeWidth="6.5" />
      </g>
    </svg>
  )
}

export default function PantallaRegistro({ onListo, onIrLogin, onVolver }) {
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

  const [modo, setModo] = useState(null)
  const [f, setF] = useState({ nombre: '', apellido: '', apodo: '', correo: '', clave: '', clave2: '', sexo: '', fechaNac: '', pais: 'rd', provincia: '', municipio: '', pies: '', pulgadas: '', posiciones: [], pin: '', pin2: '' })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [verClave, setVerClave] = useState(false)
  const [fotoUrl, setFotoUrl] = useState(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [fotoARecortar, setFotoARecortar] = useState(null)

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

  const set = (k, v) => setF((p) => {
    const next = { ...p, [k]: v }
    if (k === 'provincia') next.municipio = ''
    if (k === 'pais') { next.provincia = ''; next.municipio = '' }
    return next
  })
  const regionLista = regionesDe(f.pais)
  const muniLista = ciudadesDe(f.pais, f.provincia)
  const paisActual = PAISES[f.pais] || PAISES.rd

  const togglePosicion = (v) => setF((p) => {
    const ya = p.posiciones.includes(v)
    if (ya) return { ...p, posiciones: p.posiciones.filter((x) => x !== v) }
    if (p.posiciones.length >= 3) return p
    return { ...p, posiciones: [...p.posiciones, v] }
  })

  const alElegirFotoReg = (e) => { const arch = e.target.files && e.target.files[0]; if (arch) setFotoARecortar(arch); e.target.value = '' }
  const alRecortarFotoReg = async (blob) => {
    setFotoARecortar(null)
    setSubiendoFoto(true)
    const { url, error: errFoto } = await subirFotoPerfil(blob)
    setSubiendoFoto(false)
    if (errFoto) setError('No se pudo subir la foto: ' + errFoto)
    else if (url) setFotoUrl(url)
  }

  const registrar = async () => {
    setError('')
    if (!f.nombre.trim()) return setError('Escribe tu nombre.')
    if (!f.correo.trim()) return setError('Escribe tu correo.')
    if (f.clave.length < 6) return setError('La clave debe tener al menos 6 caracteres.')
    if (f.clave !== f.clave2) return setError('Las dos contraseñas no son iguales. Revísalas.')
    if (!/^[0-9]{4}$/.test(f.pin)) return setError('Crea tu código de jugador de cuatro dígitos.')
    if (f.pin !== f.pin2) return setError('Los dos códigos de jugador no son iguales.')
    if (!f.sexo) return setError('Selecciona tu sexo.')
    if (!f.fechaNac) return setError('Pon tu fecha de nacimiento.')
    if (!f.provincia) return setError(`Selecciona tu ${paisActual.etiquetaRegion.toLowerCase()}.`)
    setCargando(true)
    try {
      const { data, error: errAuth } = await supabase.auth.signUp({ email: f.correo.trim(), password: f.clave })
      if (errAuth) throw errAuth
      const userId = data.user?.id
      if (!userId) throw new Error('No se pudo crear la cuenta. Revisa el correo.')

      const nombreProvincia = paisActual.datos[f.provincia]?.provincia || f.provincia
      const perfil = {
        id: userId, nombre: f.nombre.trim(), apellido: f.apellido.trim() || null,
        apodo: f.apodo.trim() || null,
        pais: paisActual.nombre, modo,
        sexo: f.sexo, fecha_nacimiento: f.fechaNac,
        provincia: nombreProvincia, municipio: f.municipio || null,
        foto_url: fotoUrl || null,
        estatura_pies: modo === 'jugador' && f.pies ? parseInt(f.pies) : null,
        estatura_pulgadas: modo === 'jugador' && f.pulgadas ? parseInt(f.pulgadas) : null,
        posiciones: modo === 'jugador' && f.posiciones.length ? f.posiciones : null,
      }
      const { error: errPerfil } = await supabase.from('perfiles').insert(perfil)
      if (errPerfil) throw errPerfil

      // Guardar el código de jugador (PIN) encriptado vía función segura en Supabase
      const { error: errPin } = await supabase.rpc('set_pin', { nuevo_pin: f.pin })
      if (errPin) throw errPin

      setOk(true)
      setTimeout(() => onListo && onListo(), 1800)
    } catch (e) {
      setError(e.message || 'Algo salió mal. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const inputStyle = {
    width: '100%', background: T.inputBg, border: `1px solid ${T.inputBorde}`,
    borderRadius: 12, padding: '13px 14px', color: T.textoFuerte, fontSize: 15, outline: 'none', fontFamily: C.font, boxSizing: 'border-box',
  }
  const label = { fontSize: 12, color: C.tenue, fontWeight: 600, marginBottom: 6, display: 'block' }

  const BotonTema = () => (
    <button onClick={cambiarTema} title={`Tema: ${T.nombre}`} style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top) + 14px)', right: 18, zIndex: 5, display: 'flex', alignItems: 'center', gap: 7, background: T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(20,18,16,.7)', border: `1px solid ${T.acento}55`, color: T.acento, fontSize: 11.5, fontWeight: 700, padding: '7px 11px', borderRadius: 10, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: T.boton, display: 'inline-block' }} />{T.nombre}
    </button>
  )

  const placa = (children) => (
    <div style={{ position: 'relative', borderRadius: 20, padding: 1.5, background: T.borde, width: '100%', maxWidth: 440 }}>
      <div style={{ position: 'relative', borderRadius: 19, padding: 26, background: T.vidrio, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}>
        <div style={{ position: 'absolute', inset: 8, borderRadius: 13, border: `1.5px dashed ${T.acento}33`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>{children}</div>
      </div>
    </div>
  )

  const fondo = () => (<>
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: T.veloGrad }} />
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 60% 45% at 50% 40%, ${T.glow}, transparent 70%)` }} />
  </>)

  const wrap = { height: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'calc(env(safe-area-inset-top) + 28px) 18px calc(env(safe-area-inset-bottom) + 28px)', fontFamily: C.font, background: T.fondo }

  // PASO 1: elegir modo
  if (!modo) {
    return (
      <div style={wrap}>
        {fondo()}<BotonTema />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><Balon size={64} cols={T.balon} /></div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.textoFuerte, margin: '0 0 8px' }}>Crea tu cuenta</h1>
          <p style={{ fontSize: 15, color: C.tenue, margin: '0 0 26px' }}>¿Cómo quieres usar Media Cancha?</p>

          <button onClick={() => setModo('jugador')} style={{ width: '100%', marginBottom: 14, position: 'relative', borderRadius: 18, padding: 1.5, background: T.borde, border: 'none', cursor: 'pointer' }}>
            <div style={{ borderRadius: 17, padding: '20px 22px', background: T.vidrio, display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 34 }}>🏀</div>
              <div><div style={{ fontSize: 18, fontWeight: 800, ...ORO }}>Soy Jugador</div><div style={{ fontSize: 13, color: C.tenue, marginTop: 3 }}>Quiero mis estadísticas y que me descubran</div></div>
            </div>
          </button>

          <button onClick={() => setModo('fanatico')} style={{ width: '100%', position: 'relative', borderRadius: 18, padding: 1.5, background: T.borde, border: 'none', cursor: 'pointer' }}>
            <div style={{ borderRadius: 17, padding: '20px 22px', background: T.vidrio, display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 34 }}>📣</div>
              <div><div style={{ fontSize: 18, fontWeight: 800, ...ORO }}>Soy Fanático</div><div style={{ fontSize: 13, color: C.tenue, marginTop: 3 }}>Quiero seguir torneos y a mi equipo</div></div>
            </div>
          </button>

          <div style={{ marginTop: 22, fontSize: 13, color: C.tenue }}>
            ¿Ya tienes cuenta? <span onClick={() => onIrLogin && onIrLogin()} style={{ color: T.acento, fontWeight: 600, cursor: 'pointer' }}>Entrar</span>
          </div>
          {onVolver && <div style={{ marginTop: 12 }}><span onClick={onVolver} style={{ color: C.tenue, fontSize: 13, cursor: 'pointer' }}>← Volver</span></div>}
        </div>
      </div>
    )
  }

  // PANTALLA DE ÉXITO
  if (ok) {
    return (
      <div style={wrap}>
        {fondo()}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 440 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}><Balon size={72} cols={T.balon} /></div>
          <h1 style={{ fontSize: 26, fontWeight: 800, ...ORO, margin: '0 0 10px' }}>¡Cuenta creada!</h1>
          <p style={{ fontSize: 15, color: C.tenue }}>Bienvenido a Media Cancha, {f.nombre}. Entrando...</p>
        </div>
      </div>
    )
  }

  // PASO 2: formulario
  return (
    <div style={wrap}>
      {fondo()}<BotonTema />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Balon size={40} cols={T.balon} />
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1, color: T.textoFuerte }}>MEDIA <span style={ORO}>CANCHA</span></div>
        </div>

        {placa(
          <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 22 }}>{modo === 'jugador' ? '🏀' : '📣'}</span>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: T.textoFuerte }}>Registro de {modo === 'jugador' ? 'jugador' : 'fanático'}</div>
              <span onClick={() => setModo(null)} style={{ fontSize: 12, color: T.acento, cursor: 'pointer', fontWeight: 600 }}>← Cambiar</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
            <label style={{ position: 'relative', cursor: subiendoFoto ? 'default' : 'pointer', display: 'inline-block' }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: fotoUrl ? `url(${fotoUrl}) center/cover` : T.inputBg, border: `1px solid ${T.inputBorde}`, boxShadow: `0 0 0 3px ${T.acento}`, display: 'grid', placeItems: 'center', color: T.tenue, fontSize: 30, fontWeight: 800, overflow: 'hidden', opacity: subiendoFoto ? 0.5 : 1 }}>
                {!fotoUrl && (((f.nombre || '')[0] || '') + ((f.apellido || '')[0] || '')).toUpperCase()}
                {!fotoUrl && !f.nombre && '📷'}
              </div>
              <span style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: T.boton, display: 'grid', placeItems: 'center', fontSize: 13, border: `2px solid ${T.fondo}` }}>📷</span>
              <input type="file" accept="image/*" onChange={alElegirFotoReg} disabled={subiendoFoto} style={{ display: 'none' }} />
            </label>
            <div style={{ marginTop: 8, fontSize: 12.5, color: T.tenue }}>{subiendoFoto ? 'Subiendo…' : fotoUrl ? 'Toca para cambiar' : 'Foto (opcional)'}</div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}><label style={label}>Nombre *</label><input style={inputStyle} value={f.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej: Brayan" /></div>
            <div style={{ flex: 1 }}><label style={label}>Apellido</label><input style={inputStyle} value={f.apellido} onChange={(e) => set('apellido', e.target.value)} placeholder="Ej: Tavárez" /></div>
          </div>

          {fotoARecortar && (
            <RecortadorFoto archivo={fotoARecortar} forma="circulo" tema={{ acento: T.acento, boton: T.boton, botonTexto: '#1a1205', panel: 'rgba(12,14,18,.98)', texto: '#f4f7f9', tenue: '#9aa7b2' }} onListo={alRecortarFotoReg} onCancelar={() => setFotoARecortar(null)} />
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={label}>Apodo</label>
            <input style={inputStyle} value={f.apodo} onChange={(e) => set('apodo', e.target.value)} placeholder='Como te conocen en la cancha. Ej: "El Tigre"' maxLength={24} />
          </div>

          <div style={{ marginBottom: 14 }}><label style={label}>Correo *</label><input style={inputStyle} type="email" value={f.correo} onChange={(e) => set('correo', e.target.value)} placeholder="tucorreo@ejemplo.com" autoCapitalize="none" /></div>
          <div style={{ marginBottom: 14 }}>
            <label style={label}>Clave * (mínimo 6)</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputStyle, paddingRight: 70 }} type={verClave ? 'text' : 'password'} value={f.clave} onChange={(e) => set('clave', e.target.value)} placeholder="••••••" />
              <span onClick={() => setVerClave(!verClave)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: T.acento, cursor: 'pointer', userSelect: 'none' }}>{verClave ? 'Ocultar' : 'Ver'}</span>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={label}>Repite la clave *</label>
            <input style={{ ...inputStyle, ...(f.clave2 && f.clave !== f.clave2 ? { border: '1px solid rgba(226,75,74,.5)' } : f.clave2 && f.clave === f.clave2 ? { border: '1px solid rgba(47,191,113,.5)' } : {}) }} type={verClave ? 'text' : 'password'} value={f.clave2} onChange={(e) => set('clave2', e.target.value)} placeholder="••••••" />
            {f.clave2 && f.clave !== f.clave2 && <div style={{ fontSize: 11.5, color: '#e0563f', marginTop: 5 }}>Las claves no coinciden todavía.</div>}
            {f.clave2 && f.clave === f.clave2 && <div style={{ fontSize: 11.5, color: '#5bbd85', marginTop: 5 }}>✓ Las claves coinciden.</div>}
          </div>

          {/* CÓDIGO DE JUGADOR (PIN de 4 dígitos) */}
          <div style={{ borderTop: `1px solid ${T.lineaSuave}`, paddingTop: 16, marginBottom: 4 }}>
            <div style={{ fontSize: 12, color: T.acento, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>🔒 Tu código de jugador</div>
            <div style={{ fontSize: 12, color: C.tenue, marginBottom: 14, lineHeight: 1.45 }}>Cuatro dígitos secretos. Con este código confirmas que jugaste un juego (como el PIN del cajero). Lo puedes cambiar después en Configuración.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={label}>Código (4 dígitos) *</label>
                <input style={{ ...inputStyle, letterSpacing: 6, textAlign: 'center', fontWeight: 800 }} type="password" inputMode="numeric" value={f.pin} onChange={(e) => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>Repite el código *</label>
                <input style={{ ...inputStyle, letterSpacing: 6, textAlign: 'center', fontWeight: 800, ...(f.pin2 && f.pin !== f.pin2 ? { border: '1px solid rgba(226,75,74,.5)' } : f.pin2 && f.pin === f.pin2 && f.pin.length === 4 ? { border: '1px solid rgba(47,191,113,.5)' } : {}) }} type="password" inputMode="numeric" value={f.pin2} onChange={(e) => set('pin2', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" />
              </div>
            </div>
            {f.pin2 && f.pin !== f.pin2 && <div style={{ fontSize: 11.5, color: '#e0563f', marginTop: 6 }}>Los códigos no coinciden todavía.</div>}
            {f.pin2 && f.pin === f.pin2 && f.pin.length === 4 && <div style={{ fontSize: 11.5, color: '#5bbd85', marginTop: 6 }}>✓ Código de jugador listo.</div>}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>Sexo *</label>
              <select style={inputStyle} value={f.sexo} onChange={(e) => set('sexo', e.target.value)}>
                <option value="" style={{ background: T.optionBg }}>Selecciona...</option>
                <option value="hombre" style={{ background: T.optionBg }}>Hombre</option>
                <option value="mujer" style={{ background: T.optionBg }}>Mujer</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Fecha de nacimiento *</label>
              <input style={inputStyle} type="date" value={f.fechaNac} onChange={(e) => set('fechaNac', e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={label}>País *</label>
            <select style={inputStyle} value={f.pais} onChange={(e) => set('pais', e.target.value)}>
              <option value="rd" style={{ background: T.optionBg }}>🇩🇴 República Dominicana</option>
              <option value="usa" style={{ background: T.optionBg }}>🇺🇸 Estados Unidos</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: modo === 'jugador' ? 18 : 6 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>{paisActual.etiquetaRegion} *</label>
              <select style={inputStyle} value={f.provincia} onChange={(e) => set('provincia', e.target.value)}>
                <option value="" style={{ background: T.optionBg }}>Selecciona...</option>
                {regionLista.map((p) => <option key={p.llave} value={p.llave} style={{ background: T.optionBg }}>{p.nombre}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>{paisActual.etiquetaCiudad}</label>
              <select style={inputStyle} value={f.municipio} onChange={(e) => set('municipio', e.target.value)} disabled={!f.provincia}>
                <option value="" style={{ background: T.optionBg }}>{f.provincia ? 'Selecciona...' : `Elige ${paisActual.etiquetaRegion.toLowerCase()}`}</option>
                {muniLista.map((m) => <option key={m} value={m} style={{ background: T.optionBg }}>{m}</option>)}
              </select>
            </div>
          </div>

          {modo === 'jugador' && (
            <div style={{ borderTop: `1px solid ${T.lineaSuave}`, paddingTop: 16, marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: T.acento, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Datos de atleta</div>
              <div style={{ fontSize: 12, color: C.tenue, marginBottom: 14 }}>Opcional, pero ayuda a que te descubran. La estatura es clave en básquet.</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1 }}><label style={label}>Estatura (pies)</label><input style={inputStyle} type="number" value={f.pies} onChange={(e) => set('pies', e.target.value)} placeholder="6" /></div>
                <div style={{ flex: 1 }}><label style={label}>Pulgadas</label><input style={inputStyle} type="number" value={f.pulgadas} onChange={(e) => set('pulgadas', e.target.value)} placeholder="2" /></div>
              </div>
              <div>
                <label style={label}>Posiciones que juegas (hasta 3)</label>
                <div style={{ fontSize: 11.5, color: T.acento, marginBottom: 10, lineHeight: 1.45, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13 }}>💡</span>
                  <span style={{ color: C.tenue }}>Elige a conciencia. Piensa cuál es tu <b style={{ color: T.acento }}>posición natural</b> y márcala primero — esa será tu posición principal. Sé honesto: ayuda a que te encuentren para lo que de verdad juegas.</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {POSICIONES.map((p) => {
                    const idx = f.posiciones.indexOf(p.v)
                    const activa = idx >= 0
                    const lleno = f.posiciones.length >= 3 && !activa
                    return (
                      <button key={p.v} type="button" onClick={() => togglePosicion(p.v)} disabled={lleno}
                        style={{
                          position: 'relative', borderRadius: 11, padding: activa ? 1.5 : 0, background: activa ? T.borde : 'transparent',
                          border: activa ? 'none' : `1px solid ${T.inputBorde}`, cursor: lleno ? 'not-allowed' : 'pointer', opacity: lleno ? 0.4 : 1,
                        }}>
                        <div style={{ borderRadius: 10, padding: '9px 14px', background: activa ? (T.esClaro ? 'rgba(255,255,255,.85)' : 'rgba(12,14,18,0.9)') : 'transparent', color: activa ? T.acento : C.tenue, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
                          {activa && <span style={{ width: 18, height: 18, borderRadius: '50%', background: T.boton, color: '#1a1205', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>}
                          <b style={{ fontSize: 14.5 }}>{p.sigla}</b>
                          <span style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.8 }}>{p.t}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                {f.posiciones.length > 0 && (
                  <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 9 }}>
                    Principal: <b style={{ color: T.acento }}>{(() => { const x = POSICIONES.find((x) => x.v === f.posiciones[0]); return x ? `${x.sigla} (${x.t})` : '' })()}</b>
                    {f.posiciones.length > 1 && <span> · También: {f.posiciones.slice(1).map((v) => POSICIONES.find((x) => x.v === v)?.sigla).join(', ')}</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <div style={{ marginTop: 14, padding: '10px 13px', borderRadius: 10, background: 'rgba(226,75,74,.14)', border: '1px solid rgba(226,75,74,.3)', color: '#e0563f', fontSize: 13 }}>{error}</div>}

          <button onClick={registrar} disabled={cargando} style={{ width: '100%', marginTop: 18, border: 'none', borderRadius: 13, padding: 15, background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 16, cursor: cargando ? 'wait' : 'pointer', opacity: cargando ? 0.7 : 1 }}>
            {cargando ? 'Creando cuenta...' : 'Crear mi cuenta'}
          </button>
          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 13, color: C.tenue }}>
            ¿Ya tienes cuenta? <span onClick={() => onIrLogin && onIrLogin()} style={{ color: T.acento, fontWeight: 600, cursor: 'pointer' }}>Entrar</span>
          </div>
          </>
        )}
      </div>
    </div>
  )
}