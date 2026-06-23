import { useState, useEffect } from 'react'
import fondoJuego from '../assets/fondo-juego.png'

const SUP_OSCURA = {
  esClaro: false, fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', subTexto: '#c3ccd4',
  vidrio: 'linear-gradient(150deg, rgba(24,26,30,0.86), rgba(12,14,18,0.92))',
  veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.84) 0%, rgba(8,9,12,0.92) 100%)',
  inputBg: 'rgba(12,14,18,0.7)', inputBorde: 'rgba(255,255,255,.12)', lineaSuave: 'rgba(255,255,255,.14)', wash: 'rgba(255,255,255,.08)', washTenue: 'rgba(255,255,255,.02)',
}
const SUP_CLARA_BASE = {
  esClaro: true, textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58', subTexto: '#5b5040',
  vidrio: 'linear-gradient(150deg, rgba(255,255,255,0.92), rgba(250,248,244,0.95))',
  inputBg: 'rgba(0,0,0,.03)', inputBorde: 'rgba(0,0,0,.12)', lineaSuave: 'rgba(0,0,0,.14)', wash: 'rgba(0,0,0,.05)', washTenue: 'rgba(0,0,0,.02)',
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
    veloGrad: 'linear-gradient(180deg, rgba(248,243,233,0.84) 0%, rgba(244,238,226,0.92) 100%)',
  },
  larimar: {
    ...SUP_CLARA_BASE, nombre: 'Larimar', acento: '#2a8fb8', fondo: '#d6e7e8',
    borde: 'linear-gradient(140deg,#8fd4e8,#2a8fb8 45%,#1a6a8a 75%,#6ac0d8)',
    texto: 'linear-gradient(120deg,#2a8fb8,#1a6a8a)', balon: ['#6ac0d8', '#2a8fb8', '#1a6a8a'],
    boton: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', glow: 'rgba(42,143,184,0.14)',
    veloGrad: 'linear-gradient(180deg, rgba(232,244,245,0.84) 0%, rgba(224,240,242,0.92) 100%)',
    textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375', subTexto: '#48595a',
  },
}

// fuente deportiva condensada (igual que el resto del rediseño)
const DISP = '"Arial Narrow", Impact, "Haettenschweiler", system-ui, sans-serif'

// TODAS las estadísticas desbloqueadas (la app es gratis)
const STATS = [
  { id: 'pts', nombre: 'Puntos', obligatorio: true },
  { id: 'reb', nombre: 'Rebote' },
  { id: 'ast', nombre: 'Asistencia' },
  { id: 'rob', nombre: 'Robo' },
  { id: 'tap', nombre: 'Bloqueo' },
  { id: 'fal', nombre: 'Falta' },
  { id: 'min', nombre: 'Minutos' },
  { id: 'per', nombre: 'Pérdida' },
  { id: 'fall', nombre: 'Tiros fallados (%)' },
  { id: 'tl', nombre: 'Tiros libres' },
]
const RECOMENDADO_TEL = 6

// En 1v1 estas estadísticas no tienen sentido (no te asistes a ti mismo, no se
// cargan minutos/pérdidas, ni porcentajes): se ocultan para dejarlo sencillo.
const STATS_NO_1V1 = ['ast', 'min', 'per', 'fall']

const FORMATOS = ['1v1', '2v2', '3v3', '4v4', '5v5']
const PUNTOS_RAPIDOS = [11, 15, 21, 32]

export default function PantallaJuegoConfig({ onListo, onVolver, tipoInicial }) {
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

  // tipo de juego: rápido (por puntos) o fogueo (por reloj, completo)
  const [tipoJuego, setTipoJuego] = useState(() => {
    if (tipoInicial === 'fogueo') return 'fogueo'
    if (tipoInicial === 'rapido') return 'rapido'
    try {
      const g = localStorage.getItem('mc_tipo_juego')
      if (g) localStorage.removeItem('mc_tipo_juego')
      return g === 'fogueo' ? 'fogueo' : 'rapido'
    } catch (e) { return 'rapido' }
  })
  const esFogueo = tipoJuego === 'fogueo'

  const [nombreJuego, setNombreJuego] = useState('')
  // rápido
  const [formato, setFormato] = useState('5v5')
  const [puntosMeta, setPuntosMeta] = useState(21)
  const [porDif2, setPorDif2] = useState(false)
  const [estiloPuntos, setEstiloPuntos] = useState('normal') // 'normal' = 2 y 3 · 'americano' = 1 y 2
  // fogueo
  const [cuartos, setCuartos] = useState(4)
  const [minutos, setMinutos] = useState(10)
  const [relojApp, setRelojApp] = useState(true)
  const [jugadoresEquipo, setJugadoresEquipo] = useState(10)
  const [reservas, setReservas] = useState(0)
  // faltas (ambos modos)
  const [llevarFaltas, setLlevarFaltas] = useState(false)
  const [expulsionA, setExpulsionA] = useState(5)
  const [bonusCada, setBonusCada] = useState(0)
  // anotación + estadísticas
  const [modoAnotacion, setModoAnotacion] = useState('jugada')
  const [statsActivas, setStatsActivas] = useState(['pts'])
  const [avisoFogueo, setAvisoFogueo] = useState(false)
  const es1v1 = formato === '1v1'
  // Al cambiar a 1v1, quitamos solas las estadísticas que no aplican.
  useEffect(() => {
    if (es1v1) setStatsActivas((prev) => prev.filter((id) => !STATS_NO_1V1.includes(id)))
  }, [es1v1])

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

  const jugadoresPorLado = esFogueo ? 5 : parseInt(formato[0], 10)

  const cambiarTipo = (t) => {
    setTipoJuego(t)
    if (t === 'fogueo') setLlevarFaltas(true)
  }

  const toggleStat = (id) => {
    if (id === 'pts') return
    setStatsActivas((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  const placa = (contenido, padding = 18) => (
    <div style={{ position: 'relative', borderRadius: 18, padding: 1.5, background: T.borde, marginBottom: 14 }}>
      <div style={{ borderRadius: 17, padding, background: T.vidrio, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        {contenido}
      </div>
    </div>
  )

  const tituloSeccion = (txt) => (
    <div style={{ fontSize: 11, color: T.acento, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{txt}</div>
  )

  const pastilla = (activo, onClick, contenido, key) => (
    <button key={key} onClick={onClick} style={{
      flex: 1, minWidth: 0, borderRadius: 11, padding: '11px 6px', cursor: 'pointer', fontSize: 14, fontWeight: 700,
      border: activo ? 'none' : `1px solid ${T.lineaSuave}`,
      background: activo ? T.boton : 'transparent',
      color: activo ? '#1a1205' : T.subTexto, transition: 'all .12s',
    }}>{contenido}</button>
  )

  const btnMas = {
    width: 46, height: 46, borderRadius: 12, border: 'none', background: T.boton,
    color: '#1a1205', fontSize: 24, fontWeight: 800, cursor: 'pointer', lineHeight: 1,
  }

  // stepper compacto (− valor +) con mínimos y máximos
  const stepper = (valor, set, min, max, sufijo) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={() => set(Math.max(min, valor - 1))} style={btnMas}>−</button>
      <div style={{ fontFamily: DISP, fontSize: 34, fontWeight: 900, minWidth: 70, textAlign: 'center', ...ORO }}>{valor}</div>
      <button onClick={() => set(Math.min(max, valor + 1))} style={btnMas}>+</button>
      {sufijo && <div style={{ fontSize: 12.5, color: C.tenue, marginLeft: 6 }}>{sufijo}</div>}
    </div>
  )

  const inputStyle = {
    width: '100%', background: T.inputBg, border: `1px solid ${T.inputBorde}`,
    borderRadius: 12, padding: '13px 14px', color: T.textoFuerte, fontSize: 15, outline: 'none', fontFamily: C.font, boxSizing: 'border-box',
  }

  const empezar = () => {
    const config = {
      tipo: tipoJuego,
      nombreJuego: nombreJuego.trim() || (esFogueo ? 'Fogueo' : 'Juego rápido'),
      formato: esFogueo ? '5v5' : formato,
      jugadoresPorLado,
      tipoFin: esFogueo ? 'reloj' : 'puntos',
      minutos: esFogueo ? minutos : null,
      cuartos: esFogueo ? cuartos : null,
      relojApp: esFogueo ? relojApp : null,
      rosterEquipo: esFogueo ? jugadoresEquipo : null,
      reservas: esFogueo ? reservas : null,
      puntosMeta: esFogueo ? null : puntosMeta,
      porDif2: esFogueo ? false : porDif2,
      estiloPuntos: esFogueo ? 'normal' : estiloPuntos,
      llevarFaltas,
      expulsionA: llevarFaltas ? expulsionA : null,
      bonusCada: (llevarFaltas && esFogueo) ? bonusCada : null,
      modoAnotacion, statsActivas: esFogueo ? statsActivas : ['pts'],
    }
    onListo && onListo(config)
  }

  return (
    <div style={{ height: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', fontFamily: C.font, background: T.fondo, color: C.texto }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoJuego})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: T.veloGrad }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 60% 40% at 50% 15%, ${T.glow}, transparent 70%)` }} />

      <button onClick={cambiarTema} title={`Tema: ${T.nombre}`} style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top) + 12px)', right: 16, zIndex: 5, display: 'flex', alignItems: 'center', gap: 7, background: T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(20,18,16,.7)', border: `1px solid ${T.acento}55`, color: T.acento, fontSize: 11.5, fontWeight: 700, padding: '7px 11px', borderRadius: 10, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: T.boton, display: 'inline-block' }} />{T.nombre}
      </button>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: 'calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 40px)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span onClick={() => onVolver && onVolver()} style={{ color: C.tenue, fontSize: 14, cursor: 'pointer' }}>← Inicio</span>
        </div>

        <h1 style={{ fontFamily: DISP, fontSize: 34, fontWeight: 900, textTransform: 'uppercase', margin: '0 0 4px', color: T.textoFuerte, lineHeight: 0.95 }}>Arma tu juego</h1>
        <p style={{ fontSize: 13.5, color: C.tenue, margin: '0 0 18px' }}>{esFogueo ? 'Modo completo: roster, banca, reloj y faltas.' : 'Configura las reglas y empieza a anotar. Es un juego suelto.'}</p>

        {/* TIPO DE JUEGO */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {[{ id: 'rapido', e: '⚡', t: 'Juego rápido', d: 'Por puntos · de 1 a 5 por equipo' }, { id: 'fogueo', e: '🔥', t: 'Fogueo', d: 'Por reloj · roster, banca y faltas' }].map((x) => {
            const on = tipoJuego === x.id
            return (
              <button key={x.id} onClick={() => cambiarTipo(x.id)} style={{ flex: 1, textAlign: 'left', borderRadius: 14, padding: '13px 14px', cursor: 'pointer', border: on ? 'none' : `1px solid ${T.lineaSuave}`, background: on ? T.boton : 'transparent', color: on ? '#1a1205' : T.subTexto }}>
                <div style={{ fontSize: 20 }}>{x.e}</div>
                <div style={{ fontFamily: DISP, fontSize: 18, fontWeight: 900, textTransform: 'uppercase', marginTop: 2 }}>{x.t}</div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 1, lineHeight: 1.3 }}>{x.d}</div>
              </button>
            )
          })}
        </div>

        {placa(
          <>
            {tituloSeccion('Nombre del juego o cancha (opcional)')}
            <input style={inputStyle} value={nombreJuego} onChange={(e) => setNombreJuego(e.target.value)} placeholder="Ej: Cancha de Jícome, Final del barrio..." />
          </>
        )}

        {/* RÁPIDO: formato + por puntos */}
        {!esFogueo && placa(
          <>
            {tituloSeccion('Formato')}
            <div style={{ display: 'flex', gap: 8 }}>
              {FORMATOS.map((f) => pastilla(formato === f, () => setFormato(f), f, f))}
            </div>
            <div style={{ fontSize: 12, color: C.tenue, marginTop: 10 }}>{jugadoresPorLado} {jugadoresPorLado === 1 ? 'jugador' : 'jugadores'} por equipo.</div>
          </>
        )}

        {!esFogueo && placa(
          <>
            {tituloSeccion('¿A cuántos puntos se gana?')}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <button onClick={() => setPuntosMeta((p) => Math.max(1, p - 1))} style={btnMas}>−</button>
              <div style={{ fontFamily: DISP, fontSize: 34, fontWeight: 900, minWidth: 70, textAlign: 'center', ...ORO }}>{puntosMeta}</div>
              <button onClick={() => setPuntosMeta((p) => Math.min(199, p + 1))} style={btnMas}>+</button>
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
                {PUNTOS_RAPIDOS.map((p) => (
                  <button key={p} onClick={() => setPuntosMeta(p)} style={{ border: `1px solid ${T.lineaSuave}`, background: puntosMeta === p ? T.wash : 'transparent', color: C.tenue, borderRadius: 8, padding: '6px 9px', fontSize: 12, cursor: 'pointer' }}>{p}</button>
                ))}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: C.texto }}>
              <span onClick={() => setPorDif2(!porDif2)} style={{ width: 44, height: 26, borderRadius: 13, background: porDif2 ? T.boton : T.lineaSuave, position: 'relative', transition: 'all .15s', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 3, left: porDif2 ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all .15s' }} />
              </span>
              Ganar por diferencia de 2
            </label>
          </>
        )}

        {!esFogueo && placa(
          <>
            {tituloSeccion('Estilo de puntos')}
            <div style={{ display: 'flex', gap: 8 }}>
              {pastilla(estiloPuntos === 'normal', () => setEstiloPuntos('normal'), 'Normal · 2 y 3', 'pn')}
              {pastilla(estiloPuntos === 'americano', () => setEstiloPuntos('americano'), 'Americano · 1 y 2', 'pa')}
            </div>
            <div style={{ fontSize: 12, color: C.tenue, marginTop: 10, lineHeight: 1.5 }}>
              {estiloPuntos === 'normal'
                ? 'Como una liga: canastas de 2 y de 3.'
                : 'Estilo americano: 1 por dentro del arco, 2 por fuera.'}
              {llevarFaltas ? ' El tiro libre vale 1 punto.' : ''}
            </div>
          </>
        )}

        {/* FOGUEO: reloj + roster */}
        {esFogueo && placa(
          <>
            {tituloSeccion('Reloj')}
            <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 8 }}>Cantidad de cuartos</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5, 6].map((c) => (
                <button key={c} onClick={() => setCuartos(c)} style={{ flex: 1, minWidth: 42, border: cuartos === c ? `1.5px solid ${T.acento}` : `1px solid ${T.lineaSuave}`, background: cuartos === c ? `${T.acento}1a` : 'transparent', color: cuartos === c ? T.acento : C.tenue, borderRadius: 9, padding: '9px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{c}</button>
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 8 }}>Minutos por cuarto</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setMinutos((m) => Math.max(1, m - 1))} style={btnMas}>−</button>
              <div style={{ fontFamily: DISP, fontSize: 34, fontWeight: 900, minWidth: 70, textAlign: 'center', ...ORO }}>{minutos}</div>
              <button onClick={() => setMinutos((m) => Math.min(99, m + 1))} style={btnMas}>+</button>
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                {[5, 10, 12, 20].map((m) => (
                  <button key={m} onClick={() => setMinutos(m)} style={{ border: `1px solid ${T.lineaSuave}`, background: minutos === m ? T.wash : 'transparent', color: C.tenue, borderRadius: 8, padding: '6px 9px', fontSize: 12, cursor: 'pointer' }}>{m}</button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 12, fontStyle: 'italic' }}>
              {cuartos} {cuartos === 1 ? 'cuarto' : 'cuartos'} de {minutos} min = {cuartos * minutos} min de juego
            </div>
            <div style={{ height: 1, background: T.lineaSuave, margin: '16px 0' }} />
            <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 10 }}>¿Quién lleva el reloj?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {pastilla(relojApp, () => setRelojApp(true), '⏱ La app', 'app')}
              {pastilla(!relojApp, () => setRelojApp(false), '✋ Afuera (manual)', 'fuera')}
            </div>
            <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 10, lineHeight: 1.5 }}>
              {relojApp ? 'La aplicación corre el cronómetro del juego.' : 'El tiempo lo controlan en la mesa; tú solo anotas las jugadas.'}
            </div>
          </>
        )}

        {esFogueo && placa(
          <>
            {tituloSeccion('Roster del equipo')}
            <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 10 }}>Jugadores por equipo (hasta 12)</div>
            {stepper(jugadoresEquipo, setJugadoresEquipo, 5, 12, jugadoresEquipo === 1 ? 'jugador' : 'jugadores')}
            <div style={{ height: 1, background: T.lineaSuave, margin: '16px 0' }} />
            <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 10 }}>Reservas (opcional, hasta 3)</div>
            {stepper(reservas, setReservas, 0, 3, reservas === 1 ? 'reserva' : 'reservas')}
          </>
        )}

        {/* FALTAS — opcional en rápido, recomendado en fogueo */}
        {placa(
          <>
            {tituloSeccion('Faltas')}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: C.texto, marginBottom: llevarFaltas ? 16 : 0 }}>
              <span onClick={() => setLlevarFaltas(!llevarFaltas)} style={{ width: 44, height: 26, borderRadius: 13, background: llevarFaltas ? T.boton : T.lineaSuave, position: 'relative', transition: 'all .15s', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 3, left: llevarFaltas ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all .15s' }} />
              </span>
              Llevar faltas en este juego
            </label>
            {llevarFaltas && (
              <>
                <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 8 }}>Expulsión por faltas</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: esFogueo ? 16 : 0 }}>
                  {pastilla(expulsionA === 5, () => setExpulsionA(5), 'A las 5', 'e5')}
                  {pastilla(expulsionA === 6, () => setExpulsionA(6), 'A las 6', 'e6')}
                  {pastilla(expulsionA === 0, () => setExpulsionA(0), 'Sin expulsión', 'e0')}
                </div>
                {esFogueo && (
                  <>
                    <div style={{ fontSize: 12.5, color: C.tenue, marginBottom: 8 }}>Tiros libres por bonus (faltas de equipo por cuarto)</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {pastilla(bonusCada === 0, () => setBonusCada(0), 'Sin bonus', 'b0')}
                      {pastilla(bonusCada === 4, () => setBonusCada(4), 'Cada 4', 'b4')}
                      {pastilla(bonusCada === 5, () => setBonusCada(5), 'Cada 5', 'b5')}
                      {pastilla(bonusCada === 7, () => setBonusCada(7), 'Cada 7', 'b7')}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 10, lineHeight: 1.5 }}>
                      {bonusCada === 0 ? 'No se cobran tiros libres por bonus.' : `Al llegar a ${bonusCada} faltas de equipo en el cuarto, el rival tira libres. Se reinicia cada cuarto.`}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {placa(
          <>
            {tituloSeccion('¿Cómo prefieres anotar?')}
            <div style={{ display: 'flex', gap: 8 }}>
              {pastilla(modoAnotacion === 'jugada', () => setModoAnotacion('jugada'), 'Por Jugada', 'jugada')}
              {pastilla(modoAnotacion === 'jugador', () => setModoAnotacion('jugador'), 'Por Jugador', 'jugador')}
            </div>
            <div style={{ fontSize: 12, color: C.tenue, marginTop: 10, lineHeight: 1.5 }}>
              {modoAnotacion === 'jugada'
                ? 'Primero tocas lo que pasó (triple, rebote...) y luego eliges quién lo hizo.'
                : 'Primero tocas el jugador y luego la acción que hizo.'}
              {' '}Puedes cambiarlo en cualquier momento durante el juego.
            </div>
          </>
        )}

        {placa(
          <>
            {tituloSeccion('¿Qué estadísticas vas a llevar?')}
            {esFogueo
              ? <div style={{ fontSize: 12, color: C.tenue, marginBottom: 12 }}>Puntos siempre va. Activa las que quieras seguir en vivo. Todas están libres.</div>
              : <div style={{ fontSize: 12, color: C.tenue, marginBottom: 12, lineHeight: 1.5 }}>El juego rápido es liviano: <b style={{ color: T.acento }}>solo mide puntos y quién los metió</b>. Las demás estadísticas son del modo Fogueo.</div>}
            {es1v1 && <div style={{ fontSize: 12.5, color: T.acento, marginBottom: 12, fontWeight: 700, lineHeight: 1.5 }}>🏀 Uno-contra-uno: se simplifica solo. Sin asistencia, minutos, pérdidas ni porcentajes — solo lo que de verdad cuenta en un mano a mano.</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STATS.filter((s) => !(es1v1 && STATS_NO_1V1.includes(s.id))).map((s) => {
                const activa = statsActivas.includes(s.id)
                const bloqueada = !esFogueo && !s.obligatorio
                if (bloqueada) {
                  return (
                    <button key={s.id} onClick={() => { setAvisoFogueo(true); if (window.navigator?.vibrate) window.navigator.vibrate(30); clearTimeout(window.__avFog); window.__avFog = setTimeout(() => setAvisoFogueo(false), 2400) }} style={{
                      borderRadius: 10, padding: '9px 14px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                      border: `1px dashed ${T.lineaSuave}`, background: 'transparent', color: C.tenue, opacity: 0.6,
                    }}>
                      🔒 {s.nombre}
                    </button>
                  )
                }
                return (
                  <button key={s.id} onClick={() => toggleStat(s.id)} disabled={s.obligatorio} style={{
                    borderRadius: 10, padding: '9px 14px', fontSize: 13.5, fontWeight: 700, cursor: s.obligatorio ? 'default' : 'pointer',
                    border: activa ? 'none' : `1px solid ${T.lineaSuave}`,
                    background: activa ? T.boton : 'transparent', color: activa ? '#1a1205' : T.subTexto,
                    opacity: s.obligatorio ? 0.95 : 1,
                  }}>
                    {activa ? '✓ ' : ''}{s.nombre}{s.obligatorio ? ' (fijo)' : ''}
                  </button>
                )
              })}
            </div>
            {!esFogueo && avisoFogueo && (
              <div style={{ marginTop: 12, padding: '11px 13px', borderRadius: 11, background: T.glow, border: `1px solid ${T.acento}`, fontSize: 12.5, color: T.acento, fontWeight: 700, lineHeight: 1.5 }}>
                🔒 Esto está en Fogueo. En el juego rápido solo se llevan los puntos.
              </div>
            )}
            {esFogueo && <div style={{ marginTop: 14, padding: '11px 13px', borderRadius: 11, background: statsActivas.length > RECOMENDADO_TEL ? T.glow : T.washTenue, border: `1px solid ${statsActivas.length > RECOMENDADO_TEL ? T.acento : T.lineaSuave}` }}>
              <div style={{ fontSize: 12.5, color: statsActivas.length > RECOMENDADO_TEL ? T.acento : C.tenue, lineHeight: 1.5 }}>
                Llevas <b>{statsActivas.length}</b> {statsActivas.length === 1 ? 'estadística' : 'estadísticas'}.{' '}
                {statsActivas.length > RECOMENDADO_TEL
                  ? 'Son bastantes para un teléfono. Para anotar cómodo con tantas, te recomendamos computadora o iPad.'
                  : 'En el teléfono recomendamos hasta seis para anotar cómodo. Para llevar más, mejor desde computadora o iPad.'}
              </div>
            </div>}
          </>
        )}

        <button onClick={empezar} style={{
          width: '100%', marginTop: 6, border: 'none', borderRadius: 14, padding: 17,
          background: T.boton, color: '#1a1205', fontFamily: DISP, fontWeight: 900, fontSize: 20, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer',
        }}>
          Empezar a anotar →
        </button>
        <div style={{ textAlign: 'center', fontSize: 12, color: C.tenue, marginTop: 12 }}>
          Después pondrás los nombres de los jugadores{esFogueo ? ' y la banca' : ''}.
        </div>

      </div>
    </div>
  )
}