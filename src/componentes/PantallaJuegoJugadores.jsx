import { useState, useEffect } from 'react'
import fondoJuego from '../assets/fondo-juego.png'
import LogoEquipo from './LogoEquipo'
import { LOGOS_EQUIPO, CATEGORIAS_LOGO } from '../logosEquipos'
import { supabase } from '../supabaseClient'
import { idsQueSigo } from '../social'

const SUP_OSCURA = {
  esClaro: false, fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2',
  vidrio: 'linear-gradient(150deg, rgba(24,26,30,0.86), rgba(12,14,18,0.92))',
  veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.84) 0%, rgba(8,9,12,0.92) 100%)',
  inputBg: 'rgba(12,14,18,0.7)', inputBorde: 'rgba(255,255,255,.12)', inputWash: 'rgba(255,255,255,.05)',
}
const SUP_CLARA_BASE = {
  esClaro: true, textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58',
  vidrio: 'linear-gradient(150deg, rgba(255,255,255,0.92), rgba(250,248,244,0.95))',
  inputBg: 'rgba(0,0,0,.03)', inputBorde: 'rgba(0,0,0,.12)', inputWash: 'rgba(0,0,0,.04)',
}
const TEMAS = {
  dorado: {
    ...SUP_OSCURA, nombre: 'Dorado', acento: '#e8b65a',
    borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)',
    texto: 'linear-gradient(120deg,#fbe08a,#c8842e)', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', glow: 'rgba(190,135,55,0.20)',
  },
  azul: {
    ...SUP_OSCURA, nombre: 'Azul', acento: '#6fb0ec',
    borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)',
    texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', glow: 'rgba(55,120,190,0.22)',
  },
  claro: {
    ...SUP_CLARA_BASE, nombre: 'Claro', acento: '#b07a26', fondo: '#e6dcc8',
    borde: 'linear-gradient(140deg,#f0d79a,#c79a45 40%,#9a7530 70%,#e3c578)',
    texto: 'linear-gradient(120deg,#c8902f,#9a6420)', boton: 'linear-gradient(150deg, #e7c069, #b07a26)', glow: 'rgba(190,135,55,0.12)',
    veloGrad: 'linear-gradient(180deg, rgba(248,243,233,0.84) 0%, rgba(244,238,226,0.92) 100%)',
  },
  larimar: {
    ...SUP_CLARA_BASE, nombre: 'Larimar', acento: '#2a8fb8', fondo: '#d6e7e8',
    borde: 'linear-gradient(140deg,#8fd4e8,#2a8fb8 45%,#1a6a8a 75%,#6ac0d8)',
    texto: 'linear-gradient(120deg,#2a8fb8,#1a6a8a)', boton: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', glow: 'rgba(42,143,184,0.14)',
    veloGrad: 'linear-gradient(180deg, rgba(232,244,245,0.84) 0%, rgba(224,240,242,0.92) 100%)',
    textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375',
  },
}

export default function PantallaJuegoJugadores({ config, onListo, onVolver }) {
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

  const n = config?.tipo === 'fogueo'
    ? ((config?.rosterEquipo || config?.jugadoresPorLado || 5) + (config?.reservas || 0))
    : (config?.jugadoresPorLado || 5)
  const vacios = (eq) => Array.from({ length: n }, (_, i) => ({ nombre: '', numero: '', equipo: eq, perfilId: null, foto: null, ini: null }))

  const equipoFijo = config?.equipoFijo
  const fijosComoInputs = (config?.jugadoresFijos || []).map((j) => ({ nombre: j.nombre || '', numero: j.numero || '', equipo: j.equipo, perfilId: j.perfilId || null, foto: j.foto || null, ini: null }))

  const initNombre = (eq, def) => {
    if (equipoFijo === eq) return config?.nombreEquipoFijo || def
    return ''
  }
  const initJug = (eq) => {
    if (equipoFijo === eq) return fijosComoInputs.length ? fijosComoInputs : vacios(eq)
    return vacios(eq)
  }

  const [nombreA, setNombreA] = useState(initNombre(0, 'Equipo A'))
  const [nombreB, setNombreB] = useState(initNombre(1, 'Equipo B'))
  const [logoA, setLogoA] = useState(config?.logoEquipoFijo && equipoFijo === 0 ? config.logoEquipoFijo : null)
  const [logoB, setLogoB] = useState(config?.logoEquipoFijo && equipoFijo === 1 ? config.logoEquipoFijo : null)
  const [eligiendoLogo, setEligiendoLogo] = useState(null) // 0 | 1 | null
  const [catLogo, setCatLogo] = useState(CATEGORIAS_LOGO[0])
  const [jugA, setJugA] = useState(initJug(0))
  const [jugB, setJugB] = useState(initJug(1))
  const [error, setError] = useState('')

  // ===== Agregar jugadores desde "los que sigo" =====
  const [buscandoPara, setBuscandoPara] = useState(null) // {equipo, idx} | null
  const [siguiendo, setSiguiendo] = useState([])
  const [bq, setBq] = useState('')
  const [bResultados, setBResultados] = useState([])
  const [bCargando, setBCargando] = useState(false)
  const [dupAviso, setDupAviso] = useState('')

  // mínimo en cancha = formato (5 para 5v5). Puede haber más (banca) y equipos disparejos.
  const minimo = config?.jugadoresPorLado || 5
  const [eligiendoQuinteto, setEligiendoQuinteto] = useState(false)
  const [titA, setTitA] = useState([]) // índices de jugA titulares
  const [titB, setTitB] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const ids = await idsQueSigo()
        if (ids && ids.length) {
          const { data } = await supabase.from('perfiles').select('id, nombre, apellido, codigo_unico, foto_url, municipio').in('id', ids)
          setSiguiendo(data || [])
        }
      } catch (e) {}
    })()
  }, [])

  const [esEscritorio, setEsEscritorio] = useState(typeof window !== 'undefined' ? window.innerWidth >= 900 : false)
  useEffect(() => {
    const onR = () => setEsEscritorio(window.innerWidth >= 900)
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [])

  useEffect(() => {
    if (bq.trim().length < 2) { setBResultados([]); return }
    const t = setTimeout(async () => {
      setBCargando(true)
      const termino = bq.trim()
      const { data } = await supabase.from('perfiles')
        .select('id, nombre, apellido, codigo_unico, foto_url, municipio')
        .or(`nombre.ilike.%${termino}%,apellido.ilike.%${termino}%,codigo_unico.ilike.%${termino}%`)
        .limit(10)
      setBResultados(data || [])
      setBCargando(false)
    }, 300)
    return () => clearTimeout(t)
  }, [bq])

  const inicialesDe = (nom, ape) => `${(nom || '?')[0] || ''}${(ape || '')[0] || ''}`.toUpperCase()
  const colorAvatar = (semilla) => {
    const paleta = ['linear-gradient(150deg,#3a6ea5,#23415f)', 'linear-gradient(150deg,#9e3a3a,#5f2323)', 'linear-gradient(150deg,#3a9e6e,#235f43)', 'linear-gradient(150deg,#8a5cc4,#4f3275)', 'linear-gradient(150deg,#c4823a,#754d1f)', 'linear-gradient(150deg,#3a8a9e,#23545f)']
    let h = 0; const s = String(semilla || 'x')
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % paleta.length
    return paleta[Math.abs(h)]
  }
  // ¿este perfil ya está en otra casilla del juego? (excluye la casilla que se edita)
  const idUsado = (perfilId) => {
    if (!perfilId) return false
    const enLista = (lista, eq) => lista.some((j, i) => j.perfilId === perfilId && !(buscandoPara && buscandoPara.equipo === eq && buscandoPara.idx === i))
    return enLista(jugA, 0) || enLista(jugB, 1)
  }

  const asignarPerfil = (persona) => {
    if (!buscandoPara) return
    if (idUsado(persona.id)) {
      setDupAviso(`${(persona.nombre || 'Ese jugador').split(' ')[0]} ya está en este juego.`)
      setTimeout(() => setDupAviso(''), 2600)
      return
    }
    const { equipo, idx } = buscandoPara
    const setter = equipo === 0 ? setJugA : setJugB
    const lista = equipo === 0 ? jugA : jugB
    const nombreP = `${persona.nombre || ''} ${persona.apellido || ''}`.trim()
    setter(lista.map((j, i) => i === idx ? { ...j, nombre: nombreP, perfilId: persona.id, foto: persona.foto_url || null, ini: inicialesDe(persona.nombre, persona.apellido) } : j))
    setBuscandoPara(null); setBq(''); setBResultados([])
  }
  const quitarPerfil = (equipo, idx) => {
    const setter = equipo === 0 ? setJugA : setJugB
    const lista = equipo === 0 ? jugA : jugB
    setter(lista.map((j, i) => i === idx ? { ...j, perfilId: null, foto: null, ini: null } : j))
  }

  const setJ = (equipo, idx, campo, valor) => {
    const setter = equipo === 0 ? setJugA : setJugB
    const lista = equipo === 0 ? jugA : jugB
    const copia = lista.map((j, i) => i === idx ? { ...j, [campo]: valor } : j)
    setter(copia)
  }

  // casillas con algo escrito (nombre o número), con su índice original
  const llenosCon = (lista) => lista.map((j, idx) => ({ j, idx })).filter(({ j }) => j.nombre.trim() || j.numero.trim())

  const empezar = () => {
    setError('')
    const lA = llenosCon(jugA), lB = llenosCon(jugB)
    if (lA.length < minimo || lB.length < minimo) {
      setError(`Cada equipo necesita al menos ${minimo} jugadores en cancha.`)
      return
    }
    // si algún equipo tiene banca (más del mínimo), hay que elegir quinteto abridor
    const hayBanca = lA.length > minimo || lB.length > minimo
    if (hayBanca) {
      setTitA(lA.slice(0, minimo).map((x) => x.idx))
      setTitB(lB.slice(0, minimo).map((x) => x.idx))
      setEligiendoQuinteto(true)
      return
    }
    finalizar(lA.map((x) => x.idx), lB.map((x) => x.idx))
  }

  const toggleTit = (equipo, idx) => {
    const sel = equipo === 0 ? titA : titB
    const setSel = equipo === 0 ? setTitA : setTitB
    if (sel.includes(idx)) { setSel(sel.filter((i) => i !== idx)); return }
    if (sel.length >= minimo) return // ya hay cinco
    setSel([...sel, idx])
  }

  const finalizar = (titIdxA, titIdxB) => {
    const construir = (lista, eq, titIdx) => llenosCon(lista).map(({ j, idx }, k) => ({
      id: 'j' + eq + '_' + k,
      nombre: j.nombre.trim(),
      numero: j.numero.trim(),
      equipo: eq,
      perfilId: j.perfilId || null,
      foto: j.foto || null,
      etiqueta: j.nombre.trim() || ('#' + j.numero.trim()),
      enCancha: titIdx.includes(idx),
      pts: 0, reb: 0, ast: 0, rob: 0,
    }))
    const jugadores = [...construir(jugA, 0, titIdxA), ...construir(jugB, 1, titIdxB)]
    const { equipoFijo: _ef, nombreEquipoFijo: _nef, jugadoresFijos: _jf, logoEquipoFijo: _lf, ...configLimpia } = config || {}
    onListo && onListo({ ...configLimpia, nombreA: nombreA.trim() || 'Equipo A', nombreB: nombreB.trim() || 'Equipo B', logoA, logoB, jugadores })
  }

  const confirmarQuinteto = () => {
    if (titA.length !== minimo || titB.length !== minimo) return
    finalizar(titA, titB)
  }

  const inputBase = {
    background: T.inputBg, border: `1px solid ${T.inputBorde}`,
    borderRadius: 10, padding: '11px 12px', color: T.textoFuerte, fontSize: 15, outline: 'none', fontFamily: C.font, boxSizing: 'border-box',
  }

  const bloqueEquipo = (equipo, nombreEq, setNombreEq, lista, esFijo) => {
    const logoActual = equipo === 0 ? logoA : logoB
    return (
    <div style={{ position: 'relative', borderRadius: 18, padding: 1.5, background: T.borde, marginBottom: 14, opacity: esFijo ? 0.82 : 1 }}>
      <div style={{ borderRadius: 17, padding: 16, background: T.vidrio, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        {esFijo && <div style={{ fontSize: 10, fontWeight: 800, color: T.acento, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>🏆 Ganador · se queda</div>}
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.tenue, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>✏️ Nombre y escudo del equipo</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
          <button onClick={() => { setEligiendoLogo(equipo); setCatLogo(CATEGORIAS_LOGO[0]) }} title="Escoger escudo" style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 13, border: `1px solid ${T.acento}55`, background: T.inputWash, display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0, overflow: 'hidden' }}>
            {logoActual ? <LogoEquipo id={logoActual} size={48} /> : <span style={{ fontSize: 20, color: C.tenue }}>＋</span>}
          </button>
          <input
            value={nombreEq}
            onChange={(e) => setNombreEq(e.target.value)}
            placeholder={equipo === 0 ? 'Equipo A' : 'Equipo B'}
            style={{ ...inputBase, flex: 1, minWidth: 0, fontWeight: 800, fontSize: 17, color: equipo === 0 ? T.textoFuerte : T.acento, background: T.inputWash, border: `1px solid ${T.acento}55`, borderRadius: 10, padding: '11px 12px' }}
          />
        </div>
        {lista.map((j, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 9, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: C.tenue, width: 16, flexShrink: 0 }}>{idx + 1}.</span>
            {j.perfilId ? (
              <button onClick={() => quitarPerfil(equipo, idx)} title="Quitar enlace" style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', flexShrink: 0, border: `2px solid ${T.acento}`, background: j.foto ? `url(${j.foto}) center/cover` : colorAvatar(j.nombre), display: 'grid', placeItems: 'center', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', padding: 0 }}>
                {!j.foto && (j.ini || inicialesDe(j.nombre))}
                <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#e0563f', color: '#fff', fontSize: 11, lineHeight: 1, display: 'grid', placeItems: 'center', border: `1.5px solid ${T.fondo}` }}>×</span>
              </button>
            ) : (
              <button onClick={() => { setBuscandoPara({ equipo, idx }); setBq('') }} title="Agregar de los que sigues" style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, border: `1px dashed ${T.acento}77`, background: T.inputWash, color: T.acento, fontSize: 20, fontWeight: 800, cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0, lineHeight: 1 }}>＋</button>
            )}
            <input
              value={j.nombre}
              onChange={(e) => setJ(equipo, idx, 'nombre', e.target.value)}
              placeholder="Nombre"
              style={{ ...inputBase, flex: 1, minWidth: 0 }}
            />
            <input
              value={j.numero}
              onChange={(e) => setJ(equipo, idx, 'numero', e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="#"
              inputMode="numeric"
              style={{ ...inputBase, width: 52, flexShrink: 0, textAlign: 'center' }}
            />
          </div>
        ))}
      </div>
    </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: C.font, background: T.fondo, color: C.texto }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoJuego})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: T.veloGrad }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 60% 40% at 50% 15%, ${T.glow}, transparent 70%)` }} />

      <button onClick={cambiarTema} title={`Tema: ${T.nombre}`} style={{ position: 'fixed', top: 16, right: 16, zIndex: 5, display: 'flex', alignItems: 'center', gap: 7, background: T.esClaro ? 'rgba(255,255,255,.6)' : 'rgba(20,18,16,.7)', border: `1px solid ${T.acento}55`, color: T.acento, fontSize: 11.5, fontWeight: 700, padding: '7px 11px', borderRadius: 10, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: T.boton, display: 'inline-block' }} />{T.nombre}
      </button>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '20px 16px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span onClick={() => onVolver && onVolver()} style={{ color: C.tenue, fontSize: 14, cursor: 'pointer' }}>← Atrás</span>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', ...ORO }}>{config?.formato || ''} · {config?.nombreJuego || 'Juego rápido'}</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: T.textoFuerte }}>{equipoFijo !== undefined ? 'Sustituir el perdedor' : '¿Quiénes juegan?'}</h1>
        {equipoFijo !== undefined ? (
          <p style={{ fontSize: 13.5, color: C.tenue, margin: '0 0 22px' }}>🏆 <b style={{ color: T.acento }}>{config?.nombreEquipoFijo}</b> se queda (ganó). Pon el equipo retador que entra.</p>
        ) : (
          <p style={{ fontSize: 13.5, color: C.tenue, margin: '0 0 22px' }}>Pon nombre o número a cada jugador (al menos uno). Toca el nombre del equipo para cambiarlo.</p>
        )}

        {bloqueEquipo(0, nombreA, setNombreA, jugA, equipoFijo === 0)}
        {bloqueEquipo(1, nombreB, setNombreB, jugB, equipoFijo === 1)}

        {error && <div style={{ padding: '11px 14px', borderRadius: 11, background: 'rgba(226,75,74,.14)', border: '1px solid rgba(226,75,74,.3)', color: '#e0563f', fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <button onClick={empezar} style={{ width: '100%', border: 'none', borderRadius: 14, padding: 17, background: T.boton, color: '#1a1205', fontWeight: 800, fontSize: 17, cursor: 'pointer' }}>
          Empezar el juego →
        </button>
      </div>

      {/* Selector de logo/escudo */}
      {eligiendoLogo !== null && (
        <div onClick={() => setEligiendoLogo(null)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: T.esClaro ? 'rgba(30,26,18,0.5)' : 'rgba(4,5,7,0.84)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: esEscritorio ? 'center' : 'flex-end', justifyContent: 'center', padding: esEscritorio ? 20 : 0 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '86vh', display: 'flex', flexDirection: 'column', borderRadius: '20px 20px 0 0', padding: 1.5, background: T.borde }}>
            <div style={{ borderRadius: '19px 19px 0 0', background: T.esClaro ? '#f3eee3' : 'linear-gradient(180deg, #14161a, #0c0e12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 16px 10px' }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: T.textoFuerte }}>Escudo de {eligiendoLogo === 0 ? (nombreA || 'Equipo A') : (nombreB || 'Equipo B')}</span>
                <span onClick={() => setEligiendoLogo(null)} style={{ fontSize: 24, color: C.tenue, cursor: 'pointer', lineHeight: 1 }}>×</span>
              </div>
              <div style={{ display: 'flex', gap: 7, padding: '0 16px 12px', overflowX: 'auto' }}>
                <button onClick={() => { const eq = eligiendoLogo; eq === 0 ? setLogoA(null) : setLogoB(null) }} style={{ flexShrink: 0, padding: '7px 13px', borderRadius: 18, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1px solid ${T.inputBorde}`, background: 'transparent', color: C.tenue }}>Sin escudo</button>
                {CATEGORIAS_LOGO.map((cat) => (
                  <button key={cat} onClick={() => setCatLogo(cat)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 18, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', border: `1px solid ${catLogo === cat ? T.acento : T.inputBorde}`, background: catLogo === cat ? T.acento : 'transparent', color: catLogo === cat ? '#1a1205' : C.tenue }}>{cat}</button>
                ))}
              </div>
              <div style={{ overflowY: 'auto', padding: '4px 16px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {LOGOS_EQUIPO.filter((l) => l.cat === catLogo).map((l) => {
                  const sel = (eligiendoLogo === 0 ? logoA : logoB) === l.id
                  return (
                    <button key={l.id} onClick={() => { eligiendoLogo === 0 ? setLogoA(l.id) : setLogoB(l.id); setEligiendoLogo(null) }} style={{ aspectRatio: '1', borderRadius: 14, border: `2px solid ${sel ? T.acento : T.inputBorde}`, background: T.inputWash, display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 8 }}>
                      <LogoEquipo id={l.id} size={56} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Buscar entre los que sigues (o cualquiera por nombre/MC-ID) */}
      {buscandoPara !== null && (
        <div onClick={() => setBuscandoPara(null)} style={{ position: 'fixed', inset: 0, zIndex: 85, background: T.esClaro ? 'rgba(30,26,18,0.5)' : 'rgba(4,5,7,0.84)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: esEscritorio ? 'center' : 'flex-end', justifyContent: 'center', padding: esEscritorio ? 20 : 0 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '86vh', display: 'flex', flexDirection: 'column', borderRadius: esEscritorio ? 20 : '20px 20px 0 0', padding: 1.5, background: T.borde }}>
            <div style={{ borderRadius: esEscritorio ? '18.5px' : '19px 19px 0 0', background: T.esClaro ? '#f3eee3' : 'linear-gradient(180deg, #14161a, #0c0e12)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 16px 8px' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: T.textoFuerte }}>Agregar jugador</span>
                <span onClick={() => setBuscandoPara(null)} style={{ fontSize: 24, color: C.tenue, cursor: 'pointer', lineHeight: 1 }}>×</span>
              </div>
              <div style={{ padding: '0 16px 12px' }}>
                <input autoFocus value={bq} onChange={(e) => setBq(e.target.value)} placeholder="Busca por nombre o MC-ID..." style={{ ...inputBase, width: '100%' }} />
                {dupAviso && <div style={{ marginTop: 8, fontSize: 12.5, color: '#e0563f', fontWeight: 700 }}>⚠ {dupAviso}</div>}
              </div>
              <div style={{ overflowY: 'auto', padding: '0 10px 24px', minHeight: 0 }}>
                {(() => {
                  const usarBusqueda = bq.trim().length >= 2
                  const lista = usarBusqueda ? bResultados : siguiendo
                  const titulo = usarBusqueda ? (bCargando ? 'Buscando…' : 'Resultados') : (siguiendo.length ? 'A quién sigues' : '')
                  return (
                    <>
                      {titulo && <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: T.acento, padding: '4px 6px 8px' }}>{titulo}</div>}
                      {lista.length === 0 && !bCargando && (
                        <div style={{ fontSize: 13, color: C.tenue, textAlign: 'center', padding: '20px 16px', lineHeight: 1.5 }}>
                          {usarBusqueda ? 'Nadie con ese nombre o MC-ID.' : 'Todavía no sigues a nadie. Busca por nombre o MC-ID arriba.'}
                        </div>
                      )}
                      {lista.map((p) => {
                        const yaEsta = idUsado(p.id)
                        return (
                        <button key={p.id} disabled={yaEsta} onClick={() => asignarPerfil(p)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', background: 'transparent', border: 'none', borderRadius: 12, padding: '10px 8px', cursor: yaEsta ? 'default' : 'pointer', opacity: yaEsta ? 0.45 : 1 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: p.foto_url ? `url(${p.foto_url}) center/cover` : colorAvatar(p.nombre), display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>{!p.foto_url && inicialesDe(p.nombre, p.apellido)}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14.5, fontWeight: 700, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${p.nombre || ''} ${p.apellido || ''}`.trim()}</div>
                            <div style={{ fontSize: 11.5, color: C.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.municipio ? `${p.municipio} · ` : ''}{p.codigo_unico || ''}</div>
                          </div>
                          {yaEsta ? <span style={{ color: C.tenue, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>Ya está</span> : <span style={{ color: T.acento, fontSize: 20, flexShrink: 0 }}>＋</span>}
                        </button>
                        )
                      })}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Elegir quinteto abridor (sale solo cuando hay banca) */}
      {eligiendoQuinteto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: T.esClaro ? 'rgba(30,26,18,0.55)' : 'rgba(4,5,7,0.88)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: esEscritorio ? 'center' : 'flex-end', justifyContent: 'center', padding: esEscritorio ? 20 : 0 }}>
          <div style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '20px 20px 0 0', padding: 1.5, background: T.borde }}>
            <div style={{ borderRadius: '19px 19px 0 0', background: T.esClaro ? '#f3eee3' : 'linear-gradient(180deg, #14161a, #0c0e12)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <div style={{ padding: '16px 18px 6px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', ...ORO }}>Quinteto abridor</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: T.textoFuerte, fontFamily: C.fontDisp || C.font, letterSpacing: 0.3 }}>¿Quiénes empiezan en cancha?</div>
                <div style={{ fontSize: 13, color: C.tenue, marginTop: 4 }}>Elige {minimo} por equipo. Los demás quedan en banca y entran por cambio.</div>
              </div>
              <div style={{ overflowY: 'auto', padding: '8px 16px 12px', minHeight: 0 }}>
                {[0, 1].map((eq) => {
                  const lista = llenosCon(eq === 0 ? jugA : jugB)
                  const sel = eq === 0 ? titA : titB
                  const nombreEq = (eq === 0 ? nombreA : nombreB) || (eq === 0 ? 'Equipo A' : 'Equipo B')
                  return (
                    <div key={eq} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                        <span style={{ fontSize: 14.5, fontWeight: 800, color: T.textoFuerte, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreEq}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: sel.length === minimo ? T.acento : '#e0563f', flexShrink: 0 }}>{sel.length} / {minimo}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {lista.map(({ j, idx }) => {
                          const on = sel.includes(idx)
                          const lleno = sel.length >= minimo
                          return (
                            <button key={idx} onClick={() => toggleTit(eq, idx)} disabled={!on && lleno} style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 11, padding: '9px 12px', fontSize: 13.5, fontWeight: 700, cursor: (!on && lleno) ? 'default' : 'pointer', border: on ? 'none' : `1px solid ${T.inputBorde}`, background: on ? T.boton : 'transparent', color: on ? '#1a1205' : (lleno ? C.tenue : T.textoFuerte), opacity: (!on && lleno) ? 0.4 : 1 }}>
                              {j.numero ? <span style={{ fontWeight: 900, opacity: 0.85 }}>#{j.numero}</span> : null}
                              <span style={{ maxWidth: 130, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombre || ('#' + j.numero)}</span>
                              {on && <span style={{ fontSize: 12 }}>✓</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, padding: '10px 16px 22px', borderTop: `1px solid ${T.bordeTenue || T.inputBorde}` }}>
                <button onClick={() => setEligiendoQuinteto(false)} style={{ flex: 1, border: `1px solid ${T.inputBorde}`, borderRadius: 13, padding: 15, background: 'transparent', color: C.tenue, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Atrás</button>
                <button onClick={confirmarQuinteto} disabled={titA.length !== minimo || titB.length !== minimo} style={{ flex: 2, border: 'none', borderRadius: 13, padding: 15, background: (titA.length === minimo && titB.length === minimo) ? T.boton : T.inputBorde, color: '#1a1205', fontWeight: 800, fontSize: 16, cursor: (titA.length === minimo && titB.length === minimo) ? 'pointer' : 'default', opacity: (titA.length === minimo && titB.length === minimo) ? 1 : 0.6 }}>
                  Empezar el juego →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}