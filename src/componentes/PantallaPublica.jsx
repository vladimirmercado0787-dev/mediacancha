import { useState, useEffect } from 'react'
import fondoCancha from '../assets/fondo-cancha.png'

const TEMAS = {
  dorado: {
    nombre: 'Dorado',
    acento: '#e8b65a',
    borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)',
    texto: 'linear-gradient(120deg,#fbe08a,#c8842e)',
    balon: ['#fbe08a', '#d18f33', '#9a6420'],
    avatar: 'linear-gradient(150deg, #e0b057, #9a6420)',
    avatarTexto: '#241a07',
    boton: 'linear-gradient(150deg, #f3cf63, #c8842e)',
    glow: 'rgba(190,135,55,0.20)',
    navActivoBg: 'rgba(232,169,75,.15)',
    navActivoBorde: 'rgba(232,169,75,.35)',
  },
  azul: {
    nombre: 'Azul',
    acento: '#6fb0ec',
    borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)',
    texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)',
    balon: ['#9fd4fb', '#4f8fd0', '#1d4a80'],
    avatar: 'linear-gradient(150deg, #5aa0e0, #1d4a80)',
    avatarTexto: '#08151f',
    boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)',
    glow: 'rgba(55,120,190,0.22)',
    navActivoBg: 'rgba(111,176,236,.15)',
    navActivoBorde: 'rgba(111,176,236,.35)',
  },
}

function Balon({ size = 200, sw = 5.5, gid = 'gbal', cols }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="100" y1="22" x2="100" y2="178">
          <stop offset="0%" stopColor={cols[0]} /><stop offset="50%" stopColor={cols[1]} /><stop offset="100%" stopColor={cols[2]} />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${gid})`} strokeLinecap="round">
        <circle cx="100" cy="100" r="78" strokeWidth={sw} />
        <line x1="0" y1="100" x2="200" y2="100" strokeWidth={sw} />
        <path d="M58 50 Q90 100 58 150" strokeWidth={sw} />
        <path d="M142 50 Q110 100 142 150" strokeWidth={sw} />
        <line x1="100" y1="40" x2="100" y2="160" strokeWidth={sw + 1} />
      </g>
    </svg>
  )
}
function IconoMapa({ size = 20, cols }) {
  return <Icono nombre="mapa" size={size} cols={cols} />
}

function Icono({ nombre, size = 20, cols }) {
  const gid = `gic-${nombre}-${size}`
  const grad = (
    <defs><linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="50" y1="12" x2="50" y2="88">
      <stop offset="0%" stopColor={cols[0]} /><stop offset="100%" stopColor={cols[2]} /></linearGradient></defs>
  )
  const st = { fill: 'none', stroke: `url(#${gid})`, strokeWidth: 6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    inicio: <g style={st}><path d="M20 50 L50 24 L80 50" /><path d="M30 46 V78 H70 V46" /></g>,
    torneos: <g style={st}><path d="M32 22 H68 V40 Q68 56 50 58 Q32 56 32 40 Z" /><path d="M32 28 H22 Q22 42 34 44 M68 28 H78 Q78 42 66 44" /><path d="M50 58 V70 M40 78 H60 M44 70 H56" /></g>,
    mapa: <g style={st}><path d="M50 22 Q68 22 68 42 Q68 60 50 80 Q32 60 32 42 Q32 22 50 22 Z" /><circle cx="50" cy="42" r="9" /></g>,
    techado: <g style={st}><path d="M18 48 L50 24 L82 48" /><path d="M28 46 V78 M72 46 V78" /><line x1="22" y1="78" x2="78" y2="78" /></g>,
    rankings: <g style={st}><path d="M50 20 L59 39 L80 42 L65 57 L68 78 L50 68 L32 78 L35 57 L20 42 L41 39 Z" /></g>,
    perfil: <g style={st}><circle cx="50" cy="38" r="16" /><path d="M22 80 Q22 58 50 58 Q78 58 78 80" /></g>,
    juego: <g style={st}><path d="M54 18 L28 54 H48 L44 82 L72 44 H52 Z" /></g>,
    crearTorneo: <g style={st}><path d="M34 24 H66 V40 Q66 54 50 56 Q34 54 34 40 Z" /><path d="M50 56 V66 M40 74 H60" /><line x1="50" y1="74" x2="50" y2="86" /><line x1="44" y1="80" x2="56" y2="80" /></g>,
    crearLiga: <g style={st}><circle cx="36" cy="36" r="12" /><circle cx="66" cy="40" r="10" /><path d="M16 78 Q16 56 36 56 Q50 56 54 64" /><path d="M52 78 Q52 60 66 60 Q82 60 82 78" /></g>,
  }
  return <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>{grad}{paths[nombre] || paths.inicio}</svg>
}

const TORNEOS = [
  { nombre: 'Copa Jícome 2026', meta: 'Jícome, Valverde · 8 equipos', nivel: 'Campo', color: '#2fbf71', likes: 1240 },
  { nombre: 'Liga Superior del Cibao', meta: 'Santiago · 12 equipos', nivel: 'Superior', color: '#e0a64b', likes: 980 },
  { nombre: 'Torneo Mao Centro', meta: 'Mao, Valverde · 10 equipos', nivel: 'Intermedio', color: '#d88f3a', likes: 612 },
]
const TECHADO = [
  { tag: 'RESULTADO', tagColor: '#2fbf71', titulo: 'Los Tígres remontan y van a semis', texto: 'Vencieron 67-61 a Leones Mao. MVP: Starlin Polanco con 22 pts.', tiempo: 'hace 12 min', likes: 340 },
  { tag: 'RÉCORD', tagColor: '#f0c44c', titulo: 'Doble-doble de Bautista', texto: '14 puntos y 13 rebotes anoche en Jícome. Tercer doble-doble del torneo.', tiempo: 'hace 3 h', likes: 188 },
  { tag: 'POPULAR', tagColor: '#e8a94b', titulo: 'La Copa Jícome es la #1 de Valverde', texto: 'Con 1,240 me gusta, lidera la provincia esta semana.', tiempo: 'hace 5 h', likes: 95 },
]
const RANKING = [
  { rk: 1, ini: 'BT', nombre: 'Brayan Tavárez', equipo: 'Águilas Esperanza', val: '24.5' },
  { rk: 2, ini: 'SP', nombre: 'Starlin Polanco', equipo: 'Los Tígres', val: '22.1' },
  { rk: 3, ini: 'RB', nombre: 'Ramón Bautista', equipo: 'Leones Mao', val: '13.2' },
  { rk: 4, ini: 'JM', nombre: 'Julio Martínez', equipo: 'Caciques Sur', val: '12.8' },
  { rk: 5, ini: 'ED', nombre: 'Elvin De León', equipo: 'Metro Santiago', val: '11.9' },
]

const DESTACADOS = [
  { ini: 'BT', nombre: 'Brayan Tavárez', stat: '32 PTS', detalle: 'anoche', torneo: 'Copa Jícome', lugar: 'Cancha Jícome, Valverde', color: '#2fbf71' },
  { ini: 'SP', nombre: 'Starlin Polanco', stat: '28 PTS', detalle: 'hace 2 días', torneo: 'Liga Superior', lugar: 'Polideportivo Santiago', color: '#e0a64b' },
  { ini: 'RB', nombre: 'Ramón Bautista', stat: '14 REB', detalle: 'doble-doble', torneo: 'Torneo Mao Centro', lugar: 'Multiuso Mao', color: '#d88f3a' },
  { ini: 'JM', nombre: 'Julio Martínez', stat: '11 AST', detalle: 'récord del torneo', torneo: 'Copa del Sur', lugar: 'Cancha Caciques', color: '#3d9be0' },
  { ini: 'ED', nombre: 'Elvin De León', stat: '26 PTS', detalle: 'remontada', torneo: 'Liga Metro', lugar: 'Metro Santiago', color: '#2fbf71' },
]

const NAV = [
  { id: 'inicio', txt: 'Inicio', icono: 'inicio' },
  { id: 'torneos', txt: 'Torneos', icono: 'torneos' },
  { id: 'mapa', txt: 'Mapa', icono: 'mapa' },
  { id: 'techado', txt: 'El Techado', icono: 'techado' },
  { id: 'rankings', txt: 'Rankings', icono: 'rankings' },
  { id: 'perfil', txt: 'Mi Perfil', icono: 'perfil' },
]
const ACCIONES = [
  { id: 'juego', txt: 'Armar juego rápido', icono: 'juego' },
  { id: 'crearTorneo', txt: 'Crear torneo', icono: 'crearTorneo' },
  { id: 'crearLiga', txt: 'Crear liga', icono: 'crearLiga' },
]

const VIDRIO = 'linear-gradient(150deg, rgba(24,26,30,0.82), rgba(12,14,18,0.86))'

export default function PantallaPublica({ onAccion }) {
  const [esEscritorio, setEsEscritorio] = useState(typeof window !== 'undefined' ? window.innerWidth >= 900 : false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [likes, setLikes] = useState({})
  const [tema, setTema] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('mc_tema') || 'dorado'
    return 'dorado'
  })

  const T = TEMAS[tema]
  const ORO_TEXTO = { background: T.texto, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }

  useEffect(() => {
    const onResize = () => setEsEscritorio(window.innerWidth >= 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const cambiarTema = () => {
    const nuevo = tema === 'dorado' ? 'azul' : 'dorado'
    setTema(nuevo)
    try { localStorage.setItem('mc_tema', nuevo) } catch (e) {}
  }

  const click = (id) => { setMenuAbierto(false); onAccion && onAccion(id) }
  const toggleLike = (key, base) => setLikes((p) => ({ ...p, [key]: p[key] ? undefined : base + 1 }))
  const verLikes = (key, base) => (likes[key] != null ? likes[key] : base)

  const C = { texto: '#eef3f6', tenue: '#9aa7b2', font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }

  const Placa = ({ children, radio = 18, pad = 17 }) => (
    <div style={{ position: 'relative', borderRadius: radio, padding: 1.5, background: T.borde }}>
      <div style={{ borderRadius: radio - 1, padding: pad, background: VIDRIO, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', height: '100%' }}>{children}</div>
    </div>
  )

  const BotonTema = ({ flotante }) => (
    <button onClick={cambiarTema} title={`Tema: ${T.nombre}`} style={{
      display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(20,18,16,.7)', border: `1px solid ${T.navActivoBorde}`,
      color: T.acento, fontSize: 12, fontWeight: 700, padding: '8px 13px', borderRadius: 11, cursor: 'pointer',
      backdropFilter: 'blur(8px)', ...(flotante ? { position: 'fixed', top: 18, right: 18, zIndex: 50 } : {}),
    }}>
      <span style={{ width: 13, height: 13, borderRadius: '50%', background: T.boton, display: 'inline-block' }} />
      {T.nombre}
    </button>
  )

  const Logo = ({ chico }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Balon size={chico ? 34 : 38} sw={5.5} gid="gico" cols={T.balon} />
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontSize: chico ? 15 : 17, fontWeight: 800, letterSpacing: 1, color: C.texto }}><span>MEDIA </span><span style={ORO_TEXTO}>CANCHA</span></div>
        <div style={{ fontSize: 8, letterSpacing: 2, color: C.tenue, marginTop: 3, textTransform: 'uppercase' }}>Estadísticas de baloncesto</div>
      </div>
    </div>
  )

  const TituloAcento = ({ children, icono }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
      {icono === 'techado' && <Icono nombre="techado" size={18} cols={T.balon} />}
      <h3 style={{ fontSize: 12, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: 800, margin: 0, ...ORO_TEXTO }}>{children}</h3>
    </div>
  )

  const SecHead = ({ titulo, icono, accion }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 2px 11px' }}>
      <TituloAcento icono={icono}>{titulo}</TituloAcento>
      {accion && <button onClick={accion.fn} style={{ fontSize: 12, color: C.tenue, background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer' }}>{accion.txt}</button>}
    </div>
  )

  const EnVivo = () => (
    <Placa>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 800, ...ORO_TEXTO }}>En vivo ahora</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 800, letterSpacing: 1, color: '#2fbf71', background: 'rgba(47,191,113,.14)', padding: '4px 9px', borderRadius: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2fbf71' }} />EN VIVO
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: '#b9c2cb' }}>Los Tígres</div><div style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>48</div></div>
        <div style={{ padding: '0 16px', textAlign: 'center' }}><div style={{ fontSize: 10, color: C.tenue, textTransform: 'uppercase' }}>3er Cuarto</div><div style={{ fontSize: 15, fontWeight: 700, color: T.acento }}>06:21</div></div>
        <div style={{ flex: 1, textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 700, color: T.acento }}>Leones Mao</div><div style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>43</div></div>
      </div>
    </Placa>
  )

  const ListaTorneos = () => (
    <>{TORNEOS.map((t, i) => (
      <div key={i} style={{ marginBottom: 10 }}>
        <Placa radio={15} pad={13}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0, background: 'linear-gradient(150deg, rgba(50,46,40,.6), rgba(18,18,20,.6))', border: `1px solid ${T.navActivoBorde}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Balon size={28} sw={4} gid={`gtb${i}`} cols={T.balon} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: C.texto }}>{t.nombre}</div>
              <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>📍 {t.meta}
                <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 7, textTransform: 'uppercase', color: t.color, background: `${t.color}26` }}>{t.nivel}</span>
              </div>
            </div>
            <div onClick={() => toggleLike(`t${i}`, t.likes)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: likes[`t${i}`] ? T.acento : C.tenue }}>
              <div style={{ fontSize: 16 }}>♥</div><div style={{ fontSize: 11, fontWeight: 700 }}>{verLikes(`t${i}`, t.likes).toLocaleString('en-US')}</div>
            </div>
          </div>
        </Placa>
      </div>
    ))}</>
  )

  const ListaTechado = () => (
    <>{TECHADO.map((p, i) => (
      <div key={i} style={{ marginBottom: 10 }}>
        <Placa radio={15} pad={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 0.5, padding: '3px 8px', borderRadius: 8, textTransform: 'uppercase', color: p.tagColor, background: `${p.tagColor}26` }}>{p.tag}</span>
            <span style={{ fontSize: 11, color: C.tenue }}>{p.tiempo}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.25, color: '#f4f7f9' }}>{p.titulo}</div>
          <div style={{ fontSize: 13, color: '#c3ccd4', marginTop: 5, lineHeight: 1.5 }}>{p.texto}</div>
          <div onClick={() => toggleLike(`p${i}`, p.likes)} style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 11, cursor: 'pointer', color: likes[`p${i}`] ? T.acento : C.tenue, fontSize: 12.5, fontWeight: 600 }}>
            <span style={{ fontSize: 14 }}>♥</span> {verLikes(`p${i}`, p.likes).toLocaleString('en-US')}
          </div>
        </Placa>
      </div>
    ))}</>
  )

  const ListaRanking = ({ n }) => (
    <Placa radio={15} pad={6}>
      {RANKING.slice(0, n).map((l, idx) => (
        <div key={l.rk} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 8px', borderBottom: idx < n - 1 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: l.rk <= 3 ? T.acento : C.tenue, width: 16, textAlign: 'center' }}>{l.rk}</div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: T.avatarTexto, flexShrink: 0 }}>{l.ini}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.texto }}>{l.nombre}</div><div style={{ fontSize: 10.5, color: C.tenue }}>{l.equipo}</div></div>
          <div style={{ textAlign: 'right' }}><b style={{ fontSize: 15, fontWeight: 800, color: T.acento }}>{l.val}</b><span style={{ fontSize: 9, color: C.tenue, display: 'block' }}>PTS/J</span></div>
        </div>
      ))}
    </Placa>
  )

  const ListaDestacados = () => (
    <>{DESTACADOS.map((d, i) => (
      <div key={i} style={{ marginBottom: 10 }}>
        <Placa radio={15} pad={13}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: T.avatarTexto, flexShrink: 0 }}>{d.ini}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: C.texto }}>{d.nombre}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: T.acento }}>{d.stat}</span>
                <span style={{ fontSize: 10.5, color: C.tenue }}>· {d.detalle}</span>
              </div>
              <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 7, textTransform: 'uppercase', color: d.color, background: `${d.color}26` }}>{d.torneo}</span>
                📍 {d.lugar}
              </div>
            </div>
          </div>
        </Placa>
      </div>
    ))}</>
  )

  const Bienvenida = ({ grande }) => (
    <div style={{ marginBottom: grande ? 24 : 8 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <span style={{ width: 26, height: 2, background: T.boton, display: 'block' }} />
        <span style={{ fontSize: 10.5, letterSpacing: 3, color: T.acento, fontWeight: 700, textTransform: 'uppercase' }}>Del barrio a la Superior</span>
      </div>
      <div style={{ fontSize: grande ? 40 : 30, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.5px', color: '#f4f7f9', textShadow: '0 2px 20px rgba(0,0,0,.6)' }}>Todo el baloncesto.</div>
      <div style={{ fontSize: grande ? 40 : 30, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.5px', ...ORO_TEXTO }}>Un solo lugar.</div>
      <div style={{ fontSize: grande ? 15 : 14, color: '#c3ccd4', marginTop: 14, lineHeight: 1.5, maxWidth: 560, textShadow: '0 1px 12px rgba(0,0,0,.7)' }}>Sigue torneos en vivo, mira las estadísticas y descubre los mejores jugadores de cada zona.</div>
    </div>
  )

  const CtaRegistro = () => (
    <div style={{ marginTop: 22, textAlign: 'center' }}>
      <button onClick={() => click('registro')} style={{ width: '100%', border: 'none', borderRadius: 14, padding: 15, background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Crea tu cuenta gratis</button>
      <div style={{ fontSize: 12, color: '#c3ccd4', marginTop: 10 }}>Registrarte es gratis. ¿Quieres más beneficios? <span onClick={() => click('planes')} style={{ color: T.acento, fontWeight: 600, cursor: 'pointer' }}>Mira los planes</span></div>
    </div>
  )

  const Velo = () => (<>
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'linear-gradient(90deg, rgba(8,9,12,0.92) 0%, rgba(8,9,12,0.66) 45%, rgba(8,9,12,0.55) 100%)' }} />
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 55% 40% at 42% 55%, ${T.glow}, transparent 70%)` }} />
  </>)

  if (esEscritorio) {
    return (
      <div style={{ minHeight: '100vh', color: C.texto, fontFamily: C.font, position: 'relative', display: 'flex', background: '#08090c' }}>
        <Velo />
        <BotonTema flotante />
        <aside style={{ width: 240, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,.08)', padding: '22px 16px', position: 'sticky', top: 0, height: '100vh', zIndex: 2, background: 'rgba(10,13,18,.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
          <div style={{ marginBottom: 26, paddingLeft: 6 }}><Logo /></div>
          {NAV.map((n) => (
            <button key={n.id} onClick={() => click(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', background: n.id === 'inicio' ? T.navActivoBg : 'transparent', border: n.id === 'inicio' ? `1px solid ${T.navActivoBorde}` : '1px solid transparent', color: n.id === 'inicio' ? T.acento : '#d3dae0', fontSize: 14.5, fontWeight: 600, padding: '11px 12px', borderRadius: 11, cursor: 'pointer', marginBottom: 4 }}>
              <span style={{ width: 22, display: 'inline-flex', justifyContent: 'center' }}><Icono nombre={n.icono} size={19} cols={T.balon} /></span>{n.txt}
            </button>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,.08)', margin: '14px 6px' }} />
          {ACCIONES.map((a) => (
            <button key={a.id} onClick={() => click(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#d3dae0', fontSize: 14, fontWeight: 600, padding: '10px 12px', borderRadius: 9, cursor: 'pointer' }}>
              <span style={{ width: 22, display: 'inline-flex', justifyContent: 'center' }}><Icono nombre={a.icono} size={18} cols={T.balon} /></span>{a.txt}
            </button>
          ))}
          <div style={{ position: 'absolute', bottom: 18, left: 16, right: 16 }}>
            <button onClick={() => click('registro')} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 12, background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Crear cuenta gratis</button>
            <button onClick={() => click('entrar')} style={{ width: '100%', marginTop: 8, background: 'transparent', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: 10, color: C.tenue, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Entrar</button>
          </div>
        </aside>
        <main style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', padding: '26px 28px', gap: 26, alignItems: 'flex-start', maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ flex: 1, maxWidth: 600 }}>
            <Bienvenida grande />
            <div style={{ marginBottom: 24 }}><EnVivo /></div>
            <SecHead titulo="El Techado" icono="techado" accion={{ txt: 'Ver todo →', fn: () => click('techado') }} />
            <ListaTechado />
            <div style={{ marginTop: 8 }}><SecHead titulo="Destacados de la semana" accion={{ txt: 'Ver todos →', fn: () => click('rankings') }} /><ListaDestacados /></div>
          </div>
          <div style={{ width: 320, flexShrink: 0 }}>
            <div style={{ marginBottom: 24 }}><SecHead titulo="Torneos populares" accion={{ txt: 'Ver todos →', fn: () => click('torneos') }} /><ListaTorneos /></div>
            <SecHead titulo="Ranking nacional" accion={{ txt: 'Ver todo →', fn: () => click('rankings') }} />
            <ListaRanking n={5} />
            <button onClick={() => click('rankings')} style={{ width: '100%', marginTop: 10, background: T.navActivoBg, border: `1px solid ${T.navActivoBorde}`, borderRadius: 12, padding: 11, color: T.acento, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Ver ranking completo →</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', color: C.texto, fontFamily: C.font, position: 'relative', overflowX: 'hidden', background: '#08090c' }}>
      <Velo />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '0 16px 90px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 2px 14px', position: 'relative' }}>
          <Logo chico />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BotonTema />
            <button onClick={() => setMenuAbierto(!menuAbierto)} style={{ background: 'rgba(30,26,20,.7)', border: `1px solid ${T.navActivoBorde}`, color: T.acento, fontSize: 20, width: 40, height: 40, borderRadius: 11, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>☰</button>
          </div>
          {menuAbierto && (
            <div style={{ position: 'absolute', top: 60, right: 2, zIndex: 30, width: 230, background: 'rgba(20,18,16,.95)', border: `1px solid ${T.navActivoBorde}`, borderRadius: 14, padding: 8, boxShadow: '0 10px 30px rgba(0,0,0,.6)', backdropFilter: 'blur(12px)' }}>
              {[{ id: 'mapa', txt: 'Mapa de torneos', icono: 'mapa' }, ...ACCIONES, { id: 'registro', txt: 'Crear mi cuenta gratis', icono: 'perfil' }, { id: 'entrar', txt: 'Entrar', icono: null }].map((a) => (
                <button key={a.id} onClick={() => click(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: C.texto, fontSize: 14, fontWeight: 600, padding: '12px', borderRadius: 9, cursor: 'pointer' }}>
                  {a.icono && <span style={{ width: 20, display: 'inline-flex', justifyContent: 'center' }}><Icono nombre={a.icono} size={17} cols={T.balon} /></span>}{a.txt}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginTop: 14 }}><Bienvenida /></div>
        <div style={{ marginTop: 22 }}><EnVivo /></div>
        <div style={{ marginTop: 22 }}><SecHead titulo="Torneos populares" /><ListaTorneos /></div>
        <div style={{ marginTop: 22 }}><SecHead titulo="El Techado" icono="techado" accion={{ txt: 'Ver todo →', fn: () => click('techado') }} /><ListaTechado /></div>
        <div style={{ marginTop: 22 }}><SecHead titulo="Destacados de la semana" /><ListaDestacados /></div>
        <div style={{ marginTop: 22 }}><SecHead titulo="Ranking nacional" accion={{ txt: 'Ver todo →', fn: () => click('rankings') }} /><ListaRanking n={5} /></div>
        <CtaRegistro />
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, display: 'flex', background: 'rgba(8,9,12,.92)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${T.navActivoBorde}`, padding: '9px 0 calc(9px + env(safe-area-inset-bottom))', zIndex: 40 }}>
        {NAV.filter((n) => n.id !== 'mapa').map((n) => (
          <button key={n.id} onClick={() => click(n.id)} style={{ flex: 1, background: 'transparent', border: 'none', textAlign: 'center', color: n.id === 'inicio' ? T.acento : C.tenue, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
            <div style={{ marginBottom: 3, display: 'flex', justifyContent: 'center' }}><Icono nombre={n.icono} size={18} cols={T.balon} /></div>{n.txt}
          </button>
        ))}
      </div>
    </div>
  )
}