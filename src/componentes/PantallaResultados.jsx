import { useState, useEffect } from 'react'
import fondoCancha from '../assets/fondo-cancha.png'
import fondoTarjetaMiembro from '../assets/fondo-tarjeta-miembro.png'
import texturaCuero from '../assets/textura-cuero.png'
import barraMiembroClara from '../assets/barra-miembro-clara.png'
import barraMiembroLarimar from '../assets/barra-miembro-larimar.png'
import texturaCueroClara from '../assets/textura-cuero-clara.png'
import texturaCueroLarimar from '../assets/textura-cuero-larimar.png'
import { leerHistorialDia, haceCuanto as haceCuantoLocal, borrarJuegoDelDia } from '../historialDia'
import ResultadoCard from './TarjetaResultado'

const SUP_OSCURA = {
  esClaro: false, fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', subTexto: '#c3ccd4',
  vidrio: 'linear-gradient(150deg, rgba(24,26,30,0.82), rgba(12,14,18,0.86))',
  scrimCarnet: 'linear-gradient(90deg, rgba(6,7,9,0.92) 0%, rgba(6,7,9,0.7) 45%, rgba(6,7,9,0.15) 75%, transparent 100%)',
  headerBg: 'rgba(8,9,12,0.92)',
  veloGrad: 'linear-gradient(90deg, rgba(8,9,12,0.92) 0%, rgba(8,9,12,0.66) 45%, rgba(8,9,12,0.55) 100%)',
  navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)',
  tarjetaBg: 'rgba(20,22,26,.72)', tarjetaBorde: 'rgba(255,255,255,.08)', tarjetaSombra: 'none', lineaSuave: 'rgba(255,255,255,.07)',
  texturaImg: texturaCuero, barraImg: fondoTarjetaMiembro,
}
const TEMAS = {
  dorado: {
    ...SUP_OSCURA, nombre: 'Dorado', acento: '#e8b65a',
    borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)',
    texto: 'linear-gradient(120deg,#fbe08a,#c8842e)', balon: ['#fbe08a', '#d18f33', '#9a6420'],
    avatar: 'linear-gradient(150deg, #e0b057, #9a6420)', avatarTexto: '#241a07',
    boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', glow: 'rgba(190,135,55,0.20)',
    navActivoBg: 'rgba(232,169,75,.15)', navActivoBorde: 'rgba(232,169,75,.35)',
  },
  azul: {
    ...SUP_OSCURA, nombre: 'Azul', acento: '#6fb0ec',
    borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)',
    texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)', balon: ['#9fd4fb', '#4f8fd0', '#1d4a80'],
    avatar: 'linear-gradient(150deg, #5aa0e0, #1d4a80)', avatarTexto: '#08151f',
    boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', glow: 'rgba(55,120,190,0.22)',
    navActivoBg: 'rgba(111,176,236,.15)', navActivoBorde: 'rgba(111,176,236,.35)',
  },
  claro: {
    esClaro: true, nombre: 'Claro', acento: '#b07a26',
    borde: 'linear-gradient(140deg,#f0d79a,#c79a45 40%,#9a7530 70%,#e3c578)',
    texto: 'linear-gradient(120deg,#c8902f,#9a6420)', balon: ['#e7c069', '#c8842e', '#9a6420'],
    avatar: 'linear-gradient(150deg, #e7c069, #a9741f)', avatarTexto: '#3a2806',
    boton: 'linear-gradient(150deg, #e7c069, #b07a26)', glow: 'rgba(190,135,55,0.10)',
    navActivoBg: 'rgba(176,122,38,.16)', navActivoBorde: 'rgba(176,122,38,.35)',
    fondo: '#e6dcc8', textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58', subTexto: '#5b5040',
    vidrio: 'linear-gradient(150deg, rgba(255,255,255,0.60), rgba(255,255,255,0.46))',
    scrimCarnet: 'linear-gradient(100deg, rgba(250,245,235,0.86) 0%, rgba(250,245,235,0.52) 45%, rgba(250,245,235,0.12) 75%, transparent 100%)',
    headerBg: 'rgba(248,243,233,0.92)',
    veloGrad: 'linear-gradient(90deg, rgba(248,243,233,0.86) 0%, rgba(248,243,233,0.66) 45%, rgba(248,243,233,0.55) 100%)',
    navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)',
    tarjetaBg: '#fff', tarjetaBorde: '#e0e3e8', tarjetaSombra: '0 8px 24px rgba(20,24,30,.06)', lineaSuave: '#eceef1',
    texturaImg: texturaCueroClara, barraImg: barraMiembroClara,
  },
  larimar: {
    esClaro: true, nombre: 'Larimar', acento: '#b07a26',
    borde: 'linear-gradient(140deg,#f0d79a,#c79a45 40%,#9a7530 70%,#e3c578)',
    texto: 'linear-gradient(120deg,#c8902f,#9a6420)', balon: ['#e7c069', '#c8842e', '#9a6420'],
    avatar: 'linear-gradient(150deg, #e7c069, #a9741f)', avatarTexto: '#3a2806',
    boton: 'linear-gradient(150deg, #e7c069, #b07a26)', glow: 'rgba(60,150,170,0.12)',
    navActivoBg: 'rgba(176,122,38,.16)', navActivoBorde: 'rgba(176,122,38,.35)',
    fondo: '#d6e7e8', textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375', subTexto: '#48595a',
    vidrio: 'linear-gradient(150deg, rgba(255,255,255,0.58), rgba(255,255,255,0.44))',
    scrimCarnet: 'linear-gradient(100deg, rgba(236,246,247,0.86) 0%, rgba(236,246,247,0.52) 45%, rgba(236,246,247,0.12) 75%, transparent 100%)',
    headerBg: 'rgba(232,244,245,0.92)',
    veloGrad: 'linear-gradient(90deg, rgba(232,244,245,0.86) 0%, rgba(232,244,245,0.66) 45%, rgba(232,244,245,0.55) 100%)',
    navDorada: 'linear-gradient(180deg,#6ac0d8,#2a8fb8 55%,#1a6a8a)',
    tarjetaBg: '#fff', tarjetaBorde: '#cfe0e2', tarjetaSombra: '0 8px 24px rgba(20,30,32,.06)', lineaSuave: '#e2edee',
    texturaImg: texturaCueroLarimar, barraImg: barraMiembroLarimar,
  },
}

// colores por fuente
const FUENTES = {
  rapido: { nombre: 'Juegos rápidos', etiqueta: 'Rápido', color: '#2f9e6e', colorClaro: '#e4f4ec' },
  liga: { nombre: 'Ligas', etiqueta: 'Liga', color: '#3a6ea5', colorClaro: '#e6eef7' },
  torneo: { nombre: 'Torneos', etiqueta: 'Torneo', color: '#c8842e', colorClaro: '#f6e9cf' },
}

// color de escudo según el nombre del equipo
function colorEquipo(semilla) {
  const paleta = [
    'linear-gradient(150deg,#3a6ea5,#23415f)', 'linear-gradient(150deg,#c0504e,#7a2f2e)',
    'linear-gradient(150deg,#3a9e6e,#23543f)', 'linear-gradient(150deg,#8a5cc4,#4f3275)',
    'linear-gradient(150deg,#c4823a,#754d1f)', 'linear-gradient(150deg,#3a8a9e,#23545f)',
  ]
  let h = 0
  const s = String(semilla || 'x')
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % paleta.length
  return paleta[Math.abs(h)]
}

export default function PantallaResultados({ onVolver, onNuevoJuego, onAccion }) {
  const [tema, setTema] = useState(() => {
    const validos = ['dorado', 'azul', 'claro', 'larimar']
    if (typeof window !== 'undefined') {
      const g = localStorage.getItem('mc_tema')
      return validos.includes(g) ? g : 'dorado'
    }
    return 'dorado'
  })
  const T = TEMAS[tema] || TEMAS.dorado
  const ORO_TEXTO = { background: T.texto, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }
  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const cambiarTema = () => {
    const orden = ['dorado', 'azul', 'claro', 'larimar']
    const i = orden.indexOf(tema)
    const nuevo = orden[(i + 1) % orden.length]
    setTema(nuevo)
    try { localStorage.setItem('mc_tema', nuevo) } catch (e) {}
  }

  const [filtro, setFiltro] = useState('todos')
  const [juegos, setJuegos] = useState([])
  const [expandido, setExpandido] = useState(null)
  const [publicandoId, setPublicandoId] = useState(null)
  const [publicadoIds, setPublicadoIds] = useState([])
  const [juegoAPublicar, setJuegoAPublicar] = useState(null)
  const [comentarioPub, setComentarioPub] = useState('')
  const [esEscritorio, setEsEscritorio] = useState(typeof window !== 'undefined' ? window.innerWidth >= 900 : true)

  useEffect(() => {
    const onResize = () => setEsEscritorio(window.innerWidth >= 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    // Por ahora todos los juegos guardados son "rápidos" (los del historial del teléfono)
    const lista = leerHistorialDia().map((j) => ({ ...j, fuente: j.fuente || 'rapido' }))
    setJuegos(lista)
  }, [])

  // ===== CANDADO OFICIAL: congela el fondo cuando el modal de publicar está abierto =====
  useEffect(() => {
    if (!juegoAPublicar) return
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
  }, [juegoAPublicar])

  const eliminarJuego = (j) => {
    if (!window.confirm(`¿Eliminar este juego (${j.nombreA} vs ${j.nombreB})? No se puede deshacer.`)) return
    borrarJuegoDelDia(j.id)
    setJuegos((prev) => prev.filter((x) => x.id !== j.id))
  }

  const fuenteDe = (j) => j.fuente || 'rapido'

  const publicarDesdeResultados = async (j, comentario) => {
    if (publicandoId || publicadoIds.includes(j.id)) return
    setPublicandoId(j.id)
    try {
      const { publicarJuego } = await import('../techado')
      const res = await publicarJuego({
        nombreA: j.nombreA, nombreB: j.nombreB,
        logoA: j.logoA || null, logoB: j.logoB || null,
        jugadores: j.jugadores || [],
        nombreJuego: j.nombreJuego,
        plantilla: 'estilo_tema',
        textoExtra: (comentario || '').trim() || null,
      })
      if (res.error) {
        alert('No se pudo publicar: ' + res.error)
      } else {
        setPublicadoIds((prev) => [...prev, j.id])
        setJuegoAPublicar(null)
        setComentarioPub('')
      }
    } catch (e) {
      alert('Error al publicar: ' + (e.message || e))
    }
    setPublicandoId(null)
  }

  const juegosFiltrados = filtro === 'todos' ? juegos : juegos.filter((j) => fuenteDe(j) === filtro)

  // agrupa por fuente para la vista "todos"
  const grupos = ['torneo', 'liga', 'rapido']
    .map((f) => ({ fuente: f, items: juegos.filter((j) => fuenteDe(j) === f) }))
    .filter((g) => g.items.length > 0)

  const PESTANAS = [
    { id: 'todos', txt: 'Todos', color: T.acento },
    { id: 'rapido', txt: 'Rápidos', color: FUENTES.rapido.color },
    { id: 'liga', txt: 'Ligas', color: FUENTES.liga.color },
    { id: 'torneo', txt: 'Torneos', color: FUENTES.torneo.color },
  ]

  const NAV = [
    { id: 'volver', txt: 'Inicio', icono: '⌂' },
    { id: 'resultados', txt: 'Resultados', icono: '🏀', activo: true },
    { id: 'perfil', txt: 'Perfil', icono: '👤' },
  ]

  const clickNav = (id) => {
    if (id === 'volver') { onVolver && onVolver(); return }
    if (id === 'resultados') return
    onAccion && onAccion(id)
  }

  // ===== TARJETA DE RESULTADO =====
  // ===== TARJETA: usa el componente compartido + botón Publicar =====
  const TarjetaResultado2 = ({ j }) => {
    const fuente = fuenteDe(j)
    const yaPub = publicadoIds.includes(j.id)
    const acciones = (
      <>
        <button onClick={() => { setJuegoAPublicar(j); setComentarioPub('') }} disabled={yaPub} style={{ flex: 1, border: 'none', borderRadius: 10, padding: '10px', fontSize: 12.5, fontWeight: 800, cursor: yaPub ? 'default' : 'pointer', background: yaPub ? `${T.acento}1a` : T.boton, color: yaPub ? T.acento : '#1a1205' }}>
          {yaPub ? '✓ Publicado' : '↗ Publicar'}
        </button>
        <button onClick={() => eliminarJuego(j)} title="Eliminar juego" style={{ flexShrink: 0, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 10, padding: '10px 13px', fontSize: 14, cursor: 'pointer', background: T.esClaro ? '#f5f6f8' : 'rgba(255,255,255,.04)', color: '#e0563f' }}>🗑️</button>
      </>
    )
    return (
      <div style={{ marginBottom: 14 }}>
        <ResultadoCard
          datos={j}
          fuente={fuente}
          tiempo={haceCuantoLocal(j.ts)}
          temaForzado={tema}
          acciones={acciones}
        />
      </div>
    )
  }


  // ===== contenido central =====
  const Contenido = () => (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: esEscritorio ? 28 : 23, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0, color: T.textoFuerte }}>RE<span style={ORO_TEXTO}>SULTADOS</span></h1>
        <span style={{ fontSize: 12, color: T.tenue }}>Todos tus juegos, en un solo lugar</span>
      </div>

      {/* pestañas */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
        {PESTANAS.map((p) => {
          const activa = filtro === p.id
          return (
            <button key={p.id} onClick={() => setFiltro(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 22, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', border: `1px solid ${activa ? p.color : T.tarjetaBorde}`, background: activa ? p.color : T.tarjetaBg, color: activa ? '#fff' : T.subTexto }}>
              {p.id !== 'todos' && <span style={{ width: 9, height: 9, borderRadius: '50%', background: activa ? '#fff' : p.color }} />}
              {p.txt}
            </button>
          )
        })}
      </div>

      {/* botón nuevo juego */}
      <button onClick={() => onNuevoJuego && onNuevoJuego()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', padding: 14, borderRadius: 14, border: `1.5px dashed ${T.acento}`, background: T.esClaro ? 'linear-gradient(180deg,#fdf8ee,#fff)' : 'rgba(232,169,75,.06)', color: T.acento, fontWeight: 800, fontSize: 14, cursor: 'pointer', marginBottom: 22 }}>
        ＋ Nuevo juego rápido
      </button>

      {/* lista */}
      {juegos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: T.tenue }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏀</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.textoFuerte, marginBottom: 6 }}>Todavía no hay resultados</div>
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>Cuando juegues, tus resultados aparecen aquí divididos por torneos, ligas y juegos rápidos.</div>
        </div>
      ) : filtro === 'todos' ? (
        grupos.map((g) => {
          const F = FUENTES[g.fuente]
          return (
            <div key={g.fuente}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '6px 2px 12px' }}>
                <span style={{ width: 4, height: 17, borderRadius: 3, background: F.color }} />
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.subTexto }}>{F.nombre}</span>
                <span style={{ fontSize: 11, color: T.tenue, marginLeft: 'auto' }}>{g.items.length} {g.items.length === 1 ? 'juego' : 'juegos'}{g.fuente === 'rapido' ? ' · se borran en 15 días' : ''}</span>
              </div>
              {g.items.map((j) => <TarjetaResultado2 key={j.id} j={j} />)}
            </div>
          )
        })
      ) : (
        <>
          {juegosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: T.tenue, fontSize: 13 }}>No hay resultados en esta categoría todavía.</div>
          ) : juegosFiltrados.map((j) => <TarjetaResultado2 key={j.id} j={j} />)}
        </>
      )}
    </>
  )

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', minHeight: '-webkit-fill-available', fontFamily: font, color: T.textoBody, background: T.fondo, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* fondo fijo: pegado a la pantalla, NUNCA se mueve, cubre hasta el borde */}
      <div style={{ position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, zIndex: 0, backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, zIndex: 0, background: T.veloGrad, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, zIndex: 0, background: `radial-gradient(ellipse 55% 40% at 42% 55%, ${T.glow}, transparent 70%)`, pointerEvents: 'none' }} />

      {/* barra dorada FIJA: cubre desde el reloj hasta abajo de la nav. No se mueve. */}
      <div style={{ position: 'relative', zIndex: 30, flexShrink: 0, background: T.navDorada, paddingTop: esEscritorio ? 0 : 'env(safe-area-inset-top)', boxShadow: '0 6px 18px rgba(156,101,24,.3)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: esEscritorio ? '12px 24px' : '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2a1c08', fontWeight: 800, fontSize: 14 }}>
            <span>🏀</span><span style={{ letterSpacing: 0.3 }}>MEDIA CANCHA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {NAV.map((n) => (
              <span key={n.id} onClick={() => clickNav(n.id)} style={{ fontSize: 12.5, fontWeight: 700, color: n.activo ? '#2a1c08' : 'rgba(42,28,8,.65)', cursor: 'pointer' }}>{n.txt}</span>
            ))}
            <span onClick={cambiarTema} title={`Tema: ${T.nombre}`} style={{ width: 18, height: 18, borderRadius: '50%', background: T.boton, cursor: 'pointer', border: '1.5px solid rgba(42,28,8,.3)', flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* SOLO esta área hace scroll, por debajo de la barra fija */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: esEscritorio ? '18px 24px 60px' : '16px 14px calc(env(safe-area-inset-bottom) + 40px)' }}>
          {Contenido()}
        </div>
      </div>

      {/* Modal: publicar con comentario + vista previa profesional */}
      {juegoAPublicar && (
        <div onClick={() => { setJuegoAPublicar(null); setComentarioPub('') }} style={{ position: 'fixed', inset: 0, zIndex: 80, background: T.esClaro ? 'rgba(30,26,18,0.5)' : 'rgba(4,5,7,0.82)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: esEscritorio ? 'center' : 'flex-end', justifyContent: 'center', padding: esEscritorio ? 20 : 0 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '92dvh', overflowY: 'auto', borderRadius: esEscritorio ? 18 : '18px 18px 0 0', background: T.esClaro ? '#f3eee3' : '#0c0e12', padding: 16, paddingBottom: esEscritorio ? 16 : 'calc(16px + env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: T.textoFuerte }}>Publicar resultado</span>
              <span onClick={() => { setJuegoAPublicar(null); setComentarioPub('') }} style={{ fontSize: 24, color: T.tenue, cursor: 'pointer', lineHeight: 1 }}>×</span>
            </div>

            <div style={{ fontSize: 11.5, fontWeight: 700, color: T.tenue, marginBottom: 6 }}>Agrega un comentario (opcional)</div>
            <textarea
              value={comentarioPub}
              onChange={(e) => setComentarioPub(e.target.value.slice(0, 200))}
              placeholder="Escribe algo sobre el juego…"
              rows={2}
              style={{ width: '100%', boxSizing: 'border-box', background: T.esClaro ? '#fff' : 'rgba(255,255,255,.05)', border: `1px solid ${T.tarjetaBorde}`, borderRadius: 10, padding: '10px 12px', color: T.textoFuerte, fontSize: 16, outline: 'none', resize: 'none', marginBottom: 14, fontFamily: 'inherit' }}
            />

            <div style={{ fontSize: 11.5, fontWeight: 700, color: T.tenue, marginBottom: 8 }}>Así se verá:</div>
            <div style={{ marginBottom: 16 }}>
              <ResultadoCard datos={juegoAPublicar} fuente={fuenteDe(juegoAPublicar)} tiempo="ahora" temaForzado={tema} comentario={comentarioPub.trim() || null} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setJuegoAPublicar(null); setComentarioPub('') }} style={{ flex: 1, borderRadius: 12, padding: 13, background: 'transparent', border: `1px solid ${T.tarjetaBorde}`, color: T.tenue, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => publicarDesdeResultados(juegoAPublicar, comentarioPub)} disabled={publicandoId === juegoAPublicar.id} style={{ flex: 2, borderRadius: 12, padding: 13, background: T.boton, border: 'none', color: '#1a1205', fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: publicandoId === juegoAPublicar.id ? 0.6 : 1 }}>
                {publicandoId === juegoAPublicar.id ? 'Publicando…' : '↗ Publicar en el Techado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}