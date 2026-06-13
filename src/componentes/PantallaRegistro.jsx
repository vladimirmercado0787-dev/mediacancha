import { useState } from 'react'
import { supabase } from '../supabaseClient'
import fondoCancha from '../assets/fondo-cancha.png'
import { MUNICIPIOS_RD } from '../data/municipiosRD'

// Provincias ordenadas alfabéticamente (sacadas del archivo real de RD)
const PROVINCIAS = Object.keys(MUNICIPIOS_RD)
  .map((k) => ({ llave: k, nombre: MUNICIPIOS_RD[k].provincia }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre))

function municipiosDe(llaveProvincia) {
  if (!llaveProvincia || !MUNICIPIOS_RD[llaveProvincia]) return []
  return MUNICIPIOS_RD[llaveProvincia].municipios
    .map((m) => m.nombre)
    .sort((a, b) => a.localeCompare(b))
}

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
  const tema = (typeof window !== 'undefined' && localStorage.getItem('mc_tema')) || 'dorado'
  const T = TEMAS[tema] || TEMAS.dorado
  const ORO = { background: T.texto, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }

  const [modo, setModo] = useState(null) // 'jugador' | 'fanatico'
  const [f, setF] = useState({ nombre: '', apellido: '', correo: '', clave: '', clave2: '', sexo: '', fechaNac: '', provincia: '', municipio: '', pies: '', pulgadas: '', posiciones: [] })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [verClave, setVerClave] = useState(false)

  const set = (k, v) => setF((p) => {
    const next = { ...p, [k]: v }
    if (k === 'provincia') next.municipio = '' // al cambiar provincia, resetea municipio
    return next
  })
  const muniLista = municipiosDe(f.provincia)

  // Alterna una posición: si ya está la quita; si no, la agrega (máx 3). La primera = natural.
  const togglePosicion = (v) => setF((p) => {
    const ya = p.posiciones.includes(v)
    if (ya) return { ...p, posiciones: p.posiciones.filter((x) => x !== v) }
    if (p.posiciones.length >= 3) return p // ya tiene 3, no agrega más
    return { ...p, posiciones: [...p.posiciones, v] }
  })

  const C = { texto: '#eef3f6', tenue: '#9aa7b2', font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }

  const registrar = async () => {
    setError('')
    if (!f.nombre.trim()) return setError('Escribe tu nombre.')
    if (!f.correo.trim()) return setError('Escribe tu correo.')
    if (f.clave.length < 6) return setError('La clave debe tener al menos 6 caracteres.')
    if (f.clave !== f.clave2) return setError('Las dos contraseñas no son iguales. Revísalas.')
    if (!f.sexo) return setError('Selecciona tu sexo.')
    if (!f.fechaNac) return setError('Pon tu fecha de nacimiento.')
    if (!f.provincia) return setError('Selecciona tu provincia.')
    setCargando(true)
    try {
      // 1) Crear la cuenta en Supabase Auth
      const { data, error: errAuth } = await supabase.auth.signUp({ email: f.correo.trim(), password: f.clave })
      if (errAuth) throw errAuth
      const userId = data.user?.id
      if (!userId) throw new Error('No se pudo crear la cuenta. Revisa el correo.')

      // 2) Crear el perfil (el código único se genera solo en la BD)
      const nombreProvincia = MUNICIPIOS_RD[f.provincia]?.provincia || f.provincia
      const perfil = {
        id: userId, nombre: f.nombre.trim(), apellido: f.apellido.trim() || null,
        pais: 'República Dominicana', modo,
        sexo: f.sexo, fecha_nacimiento: f.fechaNac,
        provincia: nombreProvincia, municipio: f.municipio || null,
        estatura_pies: modo === 'jugador' && f.pies ? parseInt(f.pies) : null,
        estatura_pulgadas: modo === 'jugador' && f.pulgadas ? parseInt(f.pulgadas) : null,
        posiciones: modo === 'jugador' && f.posiciones.length ? f.posiciones : null,
      }
      const { error: errPerfil } = await supabase.from('perfiles').insert(perfil)
      if (errPerfil) throw errPerfil

      setOk(true)
      setTimeout(() => onListo && onListo(), 1800)
    } catch (e) {
      setError(e.message || 'Algo salió mal. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'rgba(12,14,18,0.7)', border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 12, padding: '13px 14px', color: C.texto, fontSize: 15, outline: 'none', fontFamily: C.font,
  }
  const label = { fontSize: 12, color: C.tenue, fontWeight: 600, marginBottom: 6, display: 'block' }

  const placa = (children) => (
    <div style={{ position: 'relative', borderRadius: 20, padding: 1.5, background: T.borde, width: '100%', maxWidth: 440 }}>
      <div style={{ borderRadius: 19, padding: 26, background: 'linear-gradient(150deg, rgba(24,26,30,0.88), rgba(12,14,18,0.92))', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}>{children}</div>
    </div>
  )

  const fondo = () => (<>
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(8,9,12,0.82) 0%, rgba(8,9,12,0.9) 100%)' }} />
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 60% 45% at 50% 40%, ${T.glow}, transparent 70%)` }} />
  </>)

  const wrap = { minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 18px', fontFamily: C.font, background: '#08090c' }

  // PASO 1: elegir modo
  if (!modo) {
    return (
      <div style={wrap}>
        {fondo()}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><Balon size={64} cols={T.balon} /></div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.texto, margin: '0 0 8px' }}>Crea tu cuenta</h1>
          <p style={{ fontSize: 15, color: C.tenue, margin: '0 0 26px' }}>¿Cómo quieres usar Media Cancha?</p>

          <button onClick={() => setModo('jugador')} style={{ width: '100%', marginBottom: 14, position: 'relative', borderRadius: 18, padding: 1.5, background: T.borde, border: 'none', cursor: 'pointer' }}>
            <div style={{ borderRadius: 17, padding: '20px 22px', background: 'linear-gradient(150deg, rgba(24,26,30,0.9), rgba(12,14,18,0.92))', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 34 }}>🏀</div>
              <div><div style={{ fontSize: 18, fontWeight: 800, ...ORO }}>Soy Jugador</div><div style={{ fontSize: 13, color: C.tenue, marginTop: 3 }}>Quiero mis estadísticas y que me descubran</div></div>
            </div>
          </button>

          <button onClick={() => setModo('fanatico')} style={{ width: '100%', position: 'relative', borderRadius: 18, padding: 1.5, background: T.borde, border: 'none', cursor: 'pointer' }}>
            <div style={{ borderRadius: 17, padding: '20px 22px', background: 'linear-gradient(150deg, rgba(24,26,30,0.9), rgba(12,14,18,0.92))', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left' }}>
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
      {fondo()}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Balon size={40} cols={T.balon} />
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1, color: C.texto }}>MEDIA <span style={ORO}>CANCHA</span></div>
        </div>

        {placa(
          <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 22 }}>{modo === 'jugador' ? '🏀' : '📣'}</span>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: C.texto }}>Registro de {modo === 'jugador' ? 'jugador' : 'fanático'}</div>
              <span onClick={() => setModo(null)} style={{ fontSize: 12, color: T.acento, cursor: 'pointer', fontWeight: 600 }}>← Cambiar</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}><label style={label}>Nombre *</label><input style={inputStyle} value={f.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej: Brayan" /></div>
            <div style={{ flex: 1 }}><label style={label}>Apellido</label><input style={inputStyle} value={f.apellido} onChange={(e) => set('apellido', e.target.value)} placeholder="Ej: Tavárez" /></div>
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
            {f.clave2 && f.clave !== f.clave2 && <div style={{ fontSize: 11.5, color: '#f09595', marginTop: 5 }}>Las claves no coinciden todavía.</div>}
            {f.clave2 && f.clave === f.clave2 && <div style={{ fontSize: 11.5, color: '#7bd6a3', marginTop: 5 }}>✓ Las claves coinciden.</div>}
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>Sexo *</label>
              <select style={inputStyle} value={f.sexo} onChange={(e) => set('sexo', e.target.value)}>
                <option value="" style={{ background: '#14161a' }}>Selecciona...</option>
                <option value="hombre" style={{ background: '#14161a' }}>Hombre</option>
                <option value="mujer" style={{ background: '#14161a' }}>Mujer</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Fecha de nacimiento *</label>
              <input style={inputStyle} type="date" value={f.fechaNac} onChange={(e) => set('fechaNac', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: modo === 'jugador' ? 18 : 6 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>Provincia *</label>
              <select style={inputStyle} value={f.provincia} onChange={(e) => set('provincia', e.target.value)}>
                <option value="" style={{ background: '#14161a' }}>Selecciona...</option>
                {PROVINCIAS.map((p) => <option key={p.llave} value={p.llave} style={{ background: '#14161a' }}>{p.nombre}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Municipio</label>
              <select style={inputStyle} value={f.municipio} onChange={(e) => set('municipio', e.target.value)} disabled={!f.provincia}>
                <option value="" style={{ background: '#14161a' }}>{f.provincia ? 'Selecciona...' : 'Elige provincia'}</option>
                {muniLista.map((m) => <option key={m} value={m} style={{ background: '#14161a' }}>{m}</option>)}
              </select>
            </div>
          </div>

          {modo === 'jugador' && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 16, marginBottom: 6 }}>
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
                          border: activa ? 'none' : '1px solid rgba(255,255,255,.14)', cursor: lleno ? 'not-allowed' : 'pointer', opacity: lleno ? 0.4 : 1,
                        }}>
                        <div style={{ borderRadius: 10, padding: '9px 14px', background: activa ? 'rgba(12,14,18,0.9)' : 'transparent', color: activa ? T.acento : C.tenue, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
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

          {error && <div style={{ marginTop: 14, padding: '10px 13px', borderRadius: 10, background: 'rgba(226,75,74,.14)', border: '1px solid rgba(226,75,74,.3)', color: '#f09595', fontSize: 13 }}>{error}</div>}

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