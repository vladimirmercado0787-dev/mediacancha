import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { statsSociales, alternarSeguir } from '../social'
import { haceCuanto } from '../techado'
import TarjetaResultado from './TarjetaResultado'
import fondoCancha from '../assets/fondo-cancha.png'

const TEMAS = {
  dorado: { esClaro: false, acento: '#e8b65a', fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', subTexto: '#c3ccd4', borde: 'linear-gradient(140deg,#f7d785,#b9802c 40%,#5e4318 70%,#caa050)', boton: 'linear-gradient(150deg, #f3cf63, #c8842e)', avatar: 'linear-gradient(150deg, #e0b057, #9a6420)', avatarTexto: '#241a07', texto: 'linear-gradient(120deg,#fbe08a,#c8842e)', tarjetaBg: 'rgba(20,22,26,.72)', tarjetaBorde: 'rgba(255,255,255,.08)', glow: 'rgba(190,135,55,0.18)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.84), rgba(8,9,12,0.92))' },
  azul: { esClaro: false, acento: '#6fb0ec', fondo: '#08090c', textoFuerte: '#f4f7f9', textoBody: '#eef3f6', tenue: '#9aa7b2', subTexto: '#c3ccd4', borde: 'linear-gradient(140deg,#9fd4fb,#3b7fcf 40%,#1d3a63 70%,#6fb0ec)', boton: 'linear-gradient(150deg, #6fb0ec, #2f6fc8)', avatar: 'linear-gradient(150deg, #5aa0e0, #1d4a80)', avatarTexto: '#08151f', texto: 'linear-gradient(120deg,#8fccfb,#2f6fc8)', tarjetaBg: 'rgba(20,22,26,.72)', tarjetaBorde: 'rgba(255,255,255,.08)', glow: 'rgba(55,120,190,0.2)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(8,9,12,0.84), rgba(8,9,12,0.92))' },
  claro: { esClaro: true, acento: '#b07a26', fondo: '#e6dcc8', textoFuerte: '#2a2014', textoBody: '#3a2f20', tenue: '#7a6e58', subTexto: '#5b5040', borde: 'linear-gradient(140deg,#f0d79a,#c79a45 40%,#9a7530 70%,#e3c578)', boton: 'linear-gradient(150deg, #e7c069, #b07a26)', avatar: 'linear-gradient(150deg, #e7c069, #a9741f)', avatarTexto: '#3a2806', texto: 'linear-gradient(120deg,#c8902f,#9a6420)', tarjetaBg: '#fff', tarjetaBorde: '#e0e3e8', glow: 'rgba(190,135,55,0.10)', navDorada: 'linear-gradient(180deg,#eab64f,#c8842e 55%,#9c6518)', veloGrad: 'linear-gradient(180deg, rgba(235,228,212,0.86), rgba(228,220,200,0.92))' },
  larimar: { esClaro: true, acento: '#2a8fb8', fondo: '#d6e7e8', textoFuerte: '#1c2624', textoBody: '#2c3a3a', tenue: '#5f7375', subTexto: '#48595a', borde: 'linear-gradient(140deg,#8fd4e8,#2a8fb8 45%,#1a6a8a 75%,#6ac0d8)', boton: 'linear-gradient(150deg, #4aafc8, #2a8fb8)', avatar: 'linear-gradient(150deg, #4aafc8, #1a6a8a)', avatarTexto: '#04121f', texto: 'linear-gradient(120deg,#2a8fb8,#1a6a8a)', tarjetaBg: '#fff', tarjetaBorde: '#cfe0e2', glow: 'rgba(42,143,184,0.12)', navDorada: 'linear-gradient(180deg,#6ac0d8,#2a8fb8 55%,#1a6a8a)', veloGrad: 'linear-gradient(180deg, rgba(214,231,232,0.86), rgba(214,231,232,0.92))' },
}

function edadDe(fecha) {
  if (!fecha) return null
  const n = new Date(fecha), h = new Date()
  let e = h.getFullYear() - n.getFullYear()
  const m = h.getMonth() - n.getMonth()
  if (m < 0 || (m === 0 && h.getDate() < n.getDate())) e--
  return e
}

export default function PantallaPerfilAjeno({ usuarioId, onVolver, onMensaje }) {
  const [tema] = useState(() => {
    const validos = ['dorado', 'azul', 'claro', 'larimar']
    if (typeof window !== 'undefined') {
      const g = localStorage.getItem('mc_tema')
      return validos.includes(g) ? g : 'dorado'
    }
    return 'dorado'
  })
  const T = TEMAS[tema] || TEMAS.dorado
  const ORO = { background: T.texto, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }
  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ seguidores: 0, siguiendo: 0, sigo: false })
  const [procesando, setProcesando] = useState(false)
  const [publicaciones, setPublicaciones] = useState([])
  const [tema2] = useState(() => (typeof window !== 'undefined' ? (localStorage.getItem('mc_tema') || 'dorado') : 'dorado'))

  useEffect(() => {
    (async () => {
      setCargando(true)
      try {
        const { data, error: err } = await supabase.from('perfiles').select('*').eq('id', usuarioId).single()
        if (err) throw err
        setPerfil(data)
        setStats(await statsSociales(usuarioId))
        // sus publicaciones públicas
        const { data: pubs } = await supabase
          .from('publicaciones_completas')
          .select('*')
          .eq('autor_id', usuarioId)
          .order('creado_en', { ascending: false })
          .limit(20)
        if (pubs) setPublicaciones(pubs)
      } catch (e) {
        setError('No se pudo cargar el perfil.')
      }
      setCargando(false)
    })()
  }, [usuarioId])

  const onSeguir = async () => {
    setProcesando(true)
    const r = await alternarSeguir(usuarioId)
    if (r.error) alert(r.error)
    else setStats((s) => ({ ...s, sigo: r.siguiendo, seguidores: s.seguidores + (r.siguiendo ? 1 : -1) }))
    setProcesando(false)
  }

  const wrap = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: font, color: T.textoBody, background: T.fondo }
  const scrollArea = { flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', zIndex: 1 }
  const Velo = () => (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${fondoCancha})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: T.veloGrad }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: `radial-gradient(ellipse 55% 40% at 50% 15%, ${T.glow}, transparent 70%)` }} />
    </>
  )

  if (cargando) return (<div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Velo /><div style={{ position: 'relative', zIndex: 1, color: T.tenue }}>Cargando perfil…</div></div>)
  if (error || !perfil) return (
    <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Velo />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: T.tenue, marginBottom: 16 }}>{error || 'Perfil no encontrado.'}</div>
        <button onClick={() => onVolver && onVolver()} style={{ border: 'none', borderRadius: 12, padding: '11px 22px', background: T.boton, color: '#1a1205', fontWeight: 800, cursor: 'pointer' }}>Volver</button>
      </div>
    </div>
  )

  const esJugador = perfil.modo === 'jugador'
  const edad = edadDe(perfil.fecha_nacimiento)
  const nombreCompleto = `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim() || 'Jugador'
  const iniciales = `${(perfil.nombre || '?')[0] || ''}${(perfil.apellido || '')[0] || ''}`.toUpperCase()
  const posiciones = perfil.posiciones || []
  const ubicacion = [perfil.municipio, perfil.provincia].filter(Boolean).join(', ')

  const Stat = ({ valor, etiqueta }) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: T.textoFuerte }}>{valor}</div>
      <div style={{ fontSize: 11, color: T.tenue, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{etiqueta}</div>
    </div>
  )

  return (
    <div style={wrap}>
      <Velo />
      <div style={scrollArea}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '16px 16px 50px' }}>
        {/* nav */}
        <div style={{ background: T.navDorada, borderRadius: 14, padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, boxShadow: '0 6px 18px rgba(156,101,24,.3)' }}>
          <span onClick={() => onVolver && onVolver()} style={{ color: '#2a1c08', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Volver</span>
          <span style={{ color: '#2a1c08', fontWeight: 800, fontSize: 14 }}>Perfil</span>
          <span style={{ width: 40 }} />
        </div>

        {/* tarjeta principal */}
        <div style={{ borderRadius: 20, padding: 1.5, background: T.borde, marginBottom: 16 }}>
          <div style={{ borderRadius: 19, padding: 20, background: T.tarjetaBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 18 }}>
              <div style={{ width: 76, height: 76, borderRadius: '50%', background: perfil.foto_url ? `url(${perfil.foto_url}) center/cover` : T.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: T.avatarTexto, flexShrink: 0, boxShadow: `0 0 0 2px ${T.esClaro ? '#15110b' : '#0c0e12'}, 0 0 0 4px ${T.acento}` }}>{!perfil.foto_url && iniciales}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 21, fontWeight: 800, color: T.textoFuerte, lineHeight: 1.1 }}>{nombreCompleto}</div>
                <div style={{ fontSize: 12.5, color: T.tenue, marginTop: 3 }}>{esJugador ? '🏀 Jugador' : '👤 Fanático'}{edad ? ` · ${edad} años` : ''}</div>
              </div>
            </div>

            {/* contadores */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderTop: `1px solid ${T.tarjetaBorde}`, borderBottom: `1px solid ${T.tarjetaBorde}`, marginBottom: 16 }}>
              <Stat valor={perfil?.juegos_jugados != null ? perfil.juegos_jugados : 0} etiqueta="Juegos" />
              <div style={{ width: 1, height: 30, background: T.tarjetaBorde }} />
              <Stat valor={stats.seguidores} etiqueta="Seguidores" />
              <div style={{ width: 1, height: 30, background: T.tarjetaBorde }} />
              <Stat valor={stats.siguiendo} etiqueta="Siguiendo" />
            </div>

            {/* botones seguir + mensaje */}
            <div style={{ display: 'flex', gap: 9 }}>
              <button onClick={onSeguir} disabled={procesando} style={{ flex: 1, border: stats.sigo ? `1px solid ${T.tarjetaBorde}` : 'none', borderRadius: 12, padding: 13, fontSize: 14.5, fontWeight: 800, cursor: 'pointer', background: stats.sigo ? 'transparent' : T.boton, color: stats.sigo ? T.textoFuerte : '#1a1205', opacity: procesando ? 0.6 : 1 }}>
                {procesando ? '…' : (stats.sigo ? '✓ Siguiendo' : '+ Seguir')}
              </button>
              <button onClick={() => onMensaje && onMensaje(usuarioId)} style={{ flex: 1, border: `1px solid ${T.acento}`, borderRadius: 12, padding: 13, fontSize: 14.5, fontWeight: 800, cursor: 'pointer', background: 'transparent', color: T.acento, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                💬 Mensaje
              </button>
            </div>
          </div>
        </div>

        {/* detalles */}
        <div style={{ borderRadius: 18, padding: 1.5, background: T.borde }}>
          <div style={{ borderRadius: 17, padding: 18, background: T.tarjetaBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, ...ORO, marginBottom: 14 }}>Información</div>
            {ubicacion && <Fila T={T} et="Ubicación" val={ubicacion} />}
            {esJugador && perfil.estatura_pies && <Fila T={T} et="Estatura" val={`${perfil.estatura_pies}'${perfil.estatura_pulgadas || 0}"`} />}
            {esJugador && posiciones.length > 0 && <Fila T={T} et="Posiciones" val={posiciones.join(', ')} />}
            {perfil.sexo && <Fila T={T} et="Sexo" val={perfil.sexo === 'M' ? 'Masculino' : perfil.sexo === 'F' ? 'Femenino' : perfil.sexo} />}
            {perfil.bio && <div style={{ fontSize: 13.5, color: T.textoBody, lineHeight: 1.55, marginTop: 10, paddingTop: 12, borderTop: `1px solid ${T.tarjetaBorde}` }}>{perfil.bio}</div>}
            {!ubicacion && !perfil.bio && (!esJugador || (!perfil.estatura_pies && posiciones.length === 0)) && (
              <div style={{ fontSize: 13, color: T.tenue }}>Este jugador todavía no completó su información.</div>
            )}
          </div>
        </div>

        {/* SUS PUBLICACIONES */}
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, ...ORO, marginBottom: 14, paddingLeft: 2 }}>Publicaciones de {perfil.nombre || 'este jugador'}</div>
          {publicaciones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '34px 20px', color: T.tenue, background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 16 }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>🏀</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>Todavía no ha publicado nada.</div>
            </div>
          ) : (
            publicaciones.map((p) => {
              let datos = p.datos || {}
              if (typeof datos === 'string') { try { datos = JSON.parse(datos) } catch (e) { datos = {} } }
              const esJuego = datos && datos.nombreA && datos.nombreB && (datos.totalA != null || (datos.jugadores && datos.jugadores.length))
              if (esJuego) {
                const fuenteJuego = datos.fuente || (p.tipo === 'torneo' ? 'torneo' : p.tipo === 'liga' ? 'liga' : 'rapido')
                return (
                  <div key={p.id} style={{ marginBottom: 14 }}>
                    <TarjetaResultado
                      datos={datos}
                      fuente={fuenteJuego}
                      tiempo={haceCuanto(p.creado_en)}
                      comentario={p.texto && !p.texto.startsWith('Ganaron') && !p.texto.startsWith('Quedaron') ? p.texto.split('\n')[0] : null}
                      temaForzado={tema2}
                    />
                  </div>
                )
              }
              // publicación de texto simple
              return (
                <div key={p.id} style={{ background: T.tarjetaBg, border: `1px solid ${T.tarjetaBorde}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
                  {p.titulo && <div style={{ fontSize: 16, fontWeight: 800, color: T.textoFuerte, marginBottom: 6 }}>{p.titulo}</div>}
                  {p.texto && <div style={{ fontSize: 14, color: T.textoBody, lineHeight: 1.55 }}>{p.texto}</div>}
                  <div style={{ fontSize: 11, color: T.tenue, marginTop: 8 }}>{haceCuanto(p.creado_en)}</div>
                </div>
              )
            })
          )}
        </div>
        </div>
      </div>
    </div>
  )
}

function Fila({ T, et, val }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5, padding: '7px 0' }}>
      <span style={{ color: T.tenue }}>{et}</span>
      <span style={{ color: T.textoFuerte, fontWeight: 600, textAlign: 'right', maxWidth: '65%' }}>{val}</span>
    </div>
  )
}