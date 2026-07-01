import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import IntroMediaCancha from './componentes/IntroMediaCancha'
import PantallaPublica from './componentes/PantallaPublica'
import PantallaRegistro from './componentes/PantallaRegistro'
import PantallaLogin from './componentes/PantallaLogin'
import PantallaPerfil from './componentes/PantallaPerfil'
import PantallaComando from './componentes/PantallaComando'
import PantallaSiguiendo from './componentes/PantallaSiguiendo'
import PantallaConfiguracion from './componentes/PantallaConfiguracion'
import PantallaJuegoConfig from './componentes/PantallaJuegoConfig'
import PantallaJuegoJugadores from './componentes/PantallaJuegoJugadores'
import PantallaJuegoVivo from './componentes/PantallaJuegoVivo'
import PantallaJuegoResultado from './componentes/PantallaJuegoResultado'
import PantallaResultados from './componentes/PantallaResultados'
import PantallaBuscar from './componentes/PantallaBuscar'
import PantallaPerfilAjeno from './componentes/PantallaPerfilAjeno'
import PantallaChat from './componentes/PantallaChat'
import PantallaGrupo from './componentes/PantallaGrupo'
import PantallaCrearGrupo from './componentes/PantallaCrearGrupo'
import PantallaPublicar from './componentes/PantallaPublicar'
import PantallaTorneos from './componentes/PantallaTorneos'
import PantallaTorneoPublico from './componentes/PantallaTorneoPublico'
import PantallaInvitaciones from './componentes/PantallaInvitaciones'
import PantallaTorneoConfig from './componentes/PantallaTorneoConfig'
import PantallaConfigTorneo from './componentes/PantallaConfigTorneo'
import PantallaMisTorneos from './componentes/PantallaMisTorneos'
import PantallaNoticiasCrudas from './componentes/PantallaNoticiasCrudas'
import PantallaCrearTorneo from './componentes/PantallaCrearTorneo'
import { guardarJuegoDelDia } from './historialDia'
import { registrarCartero, intentarOEncolar, iniciarCartero, alCambiarCola } from './offline'
import { leerRosterTorneo, guardarAnotacionTorneo, marcarJuegoVivo } from './torneoData'
import PantallaLigas from './componentes/PantallaLigas'
import PantallaLiga from './componentes/PantallaLiga'
import PantallaLigaPublica from './componentes/PantallaLigaPublica'
import PantallaInvitarLiga from './componentes/PantallaInvitarLiga'
import PantallaCrearLiga from './componentes/PantallaCrearLiga'
import { leerLiga, guardarJuegoLiga } from './ligas'
import { registrarStatsJugadores } from './estadisticas'
import { publicarJuegoLiga } from './techado'
import PantallaLNB from './componentes/PantallaLNB'
import PantallaNBA from './componentes/PantallaNBA'
import PantallaNoticias from './componentes/PantallaNoticias'
import PantallaRosters from './componentes/PantallaRosters'
import PantallaCentroComando from './componentes/PantallaCentroComando'
import PantallaSalaDraft from './componentes/PantallaSalaDraft'
import ShellEscritorio from './componentes/ShellEscritorio'
import { StatusBar, Style } from '@capacitor/status-bar'

// Convierte el roster de dos equipos en los jugadores que el anotador espera.
// Los primeros cinco de cada equipo entran en cancha; el resto, a la banca.
function jugadoresDesdeRoster(roster, equipoA_id, equipoB_id) {
  const construir = (eq, equipoId) =>
    (roster || [])
      .filter((p) => p.equipo_id === equipoId)
      .map((p, k) => ({
        id: 'j' + eq + '_' + k,
        nombre: p.nombre || ('#' + (p.numero ?? '')),
        numero: p.numero != null ? String(p.numero) : '',
        equipo: eq,
        perfilId: p.perfilId || null,
        jugadorId: p.jugador_id || null, // clave única del jugador para guardar sus stats
        foto: p.foto || null,
        etiqueta: p.nombre || ('#' + (p.numero ?? '')),
        enCancha: k < 5,
        pts: 0, reb: 0, ast: 0, rob: 0,
      }))
  return [...construir(0, equipoA_id), ...construir(1, equipoB_id)]
}

function App() {
  const [mostrarIntro, setMostrarIntro] = useState(true)
  const [vista, setVista] = useState('publica')
  const [pendientesOffline, setPendientesOffline] = useState(0)

  // --- Modo offline: registra CÓMO se manda cada tipo de juego, una sola vez ---
  useEffect(() => {
    registrarCartero('juego_liga', async (p) => {
      await guardarJuegoLiga(p.ligaId, p.modo, p.res)
      try { await registrarStatsJugadores({ formato: p.res.formato, jugadores: p.res.jugadores, statsActivas: p.res.statsActivas, origen: 'liga', ligaId: p.ligaId }) } catch (e) {}
      try { await publicarJuegoLiga(p.res, { ligaId: p.ligaId, ligaNombre: p.ligaNombre, modo: p.modo }) } catch (e) {}
    })
    registrarCartero('juego_torneo', async (p) => {
      await guardarAnotacionTorneo(p.juegoTorneo, p.res)
      try { await registrarStatsJugadores({ formato: p.res.formato, jugadores: p.res.jugadores, statsActivas: p.res.statsActivas, origen: 'torneo', torneoId: p.juegoTorneo.torneoId }) } catch (e) {}
    })
    registrarCartero('stats_rapido', async (p) => { await registrarStatsJugadores(p) })
    iniciarCartero()
    return alCambiarCola((cola) => setPendientesOffline(cola.length))
  }, [])

  // Avisito flotante: "Modo offline · X juegos por enviar" — se pinta encima
  // de cualquier pantalla mientras haya algo esperando en el buzón.
  const AvisoOffline = pendientesOffline > 0 ? (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(env(safe-area-inset-bottom) + 12px)', zIndex: 999, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(20,16,6,.95)', border: '1px solid rgba(232,182,90,.4)', borderRadius: 20, padding: '9px 16px', boxShadow: '0 8px 24px rgba(0,0,0,.4)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e8b65a' }} />
        <span style={{ color: '#f4e6c8', fontSize: 12.5, fontWeight: 700 }}>Modo offline · {pendientesOffline} {pendientesOffline === 1 ? 'juego' : 'juegos'} por enviar</span>
      </div>
    </div>
  ) : null

  // --- Historial de navegación: "Volver" regresa al lugar real de donde viniste ---
  const historialNav = useRef([])
  const volviendoNav = useRef(false)
  const vistaPrevNav = useRef('publica')
  // Pantallas que nunca son un buen destino de "Volver" (configuración, formularios,
  // pasos de anotar un juego, login). El historial las salta al regresar.
  const TRANSIENTES_NAV = ['login', 'registro', 'juegoConfig', 'juegoJugadores', 'juegoVivo', 'juegoResultado', 'crearTorneo', 'crearLiga', 'crearGrupo', 'configTorneo', 'configuracion', 'ligaInvitar', 'publicar']
  useEffect(() => {
    if (volviendoNav.current) { volviendoNav.current = false }
    else if (vistaPrevNav.current !== vista) {
      historialNav.current.push(vistaPrevNav.current)
      if (historialNav.current.length > 50) historialNav.current.shift()
    }
    vistaPrevNav.current = vista
  }, [vista])
  const volver = (fallback = 'publica') => {
    const h = historialNav.current
    let dest = null
    while (h.length) { const d = h.pop(); if (!TRANSIENTES_NAV.includes(d) && d !== vista) { dest = d; break } }
    volviendoNav.current = true
    setVista(dest || fallback)
  }

  const [sesion, setSesion] = useState(null)
  const [configJuego, setConfigJuego] = useState(null)
  const [resultadoJuego, setResultadoJuego] = useState(null)
  const [destinoTrasLogin, setDestinoTrasLogin] = useState('perfil')
  const [configOrigen, setConfigOrigen] = useState('perfil')
  const [perfilViendo, setPerfilViendo] = useState(null)
  const [torneoEnJuego, setTorneoEnJuego] = useState(null)
  const [torneoConfigId, setTorneoConfigId] = useState(null)
  const [torneoPublicoId, setTorneoPublicoId] = useState(null)
  const [torneoAdminId, setTorneoAdminId] = useState(null)
  const [ligaActivaId, setLigaActivaId] = useState(null)
  const [ligaActiva, setLigaActiva] = useState(null)
  const [juegoLigaCtx, setJuegoLigaCtx] = useState(null)

  useEffect(() => {
    if (!ligaActivaId) { setLigaActiva(null); return }
    let vivo = true
    leerLiga(ligaActivaId).then(({ liga }) => { if (vivo) setLigaActiva(liga) }).catch(() => {})
    return () => { vivo = false }
  }, [ligaActivaId])
  const [juegoTorneoCtx, setJuegoTorneoCtx] = useState(null)
  const [chatCon, setChatCon] = useState(null)
  const [grupoActivo, setGrupoActivo] = useState(null)
  const [esEscritorio, setEsEscritorio] = useState(typeof window !== 'undefined' ? window.innerWidth >= 900 : false)

  useEffect(() => {
    const onResize = () => setEsEscritorio(window.innerWidth >= 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, ses) => setSesion(ses))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Resetea el scroll cada vez que cambia de pantalla: mata la "contaminación"
  // del WebView de iOS (el columpio) que dejaba la vista desfasada al volver
  // atrás desde una pantalla vieja que todavía usa scroll de página.
  useEffect(() => {
    const reset = () => {
      try {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
        const r = document.getElementById('root')
        if (r) r.scrollTop = 0
      } catch (e) {}
    }
    reset()
    requestAnimationFrame(reset)
  }, [vista])

  // Barra de estado nativa (iOS): el WebView se dibuja POR DEBAJO del notch
  // (pantalla completa real) y el color del texto se adapta al tema.
  useEffect(() => {
    const initBarra = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true })
        let temaGuardado = null
        try { temaGuardado = localStorage.getItem('mc_tema') } catch (e) {}
        await StatusBar.setStyle({ style: temaGuardado === 'dia' ? Style.Dark : Style.Light })
      } catch (e) {
        // En la web (no nativo) el plugin no existe; se ignora sin romper nada.
      }
    }
    initBarra()
  }, [])

  // Navegación de la barra de escritorio (mismos destinos que la barra de la Pública).
  const navegar = (id) => {
    if (id === 'inicio') setVista('publica')
    else if (id === 'ligas') setVista('ligas')
    else if (id === 'nba') setVista('nba')
    else if (id === 'lnb') setVista('lnb')
    else if (id === 'noticias') setVista('noticias')
    else if (id === 'rosters') setVista('rosters')
    else if (id === 'comando') setVista('comando')
    else if (id === 'torneos') { setTorneoPublicoId(null); setVista('torneoPublico') }
    else if (id && id.startsWith && id.startsWith('torneoPublico:')) { setTorneoPublicoId(id.slice('torneoPublico:'.length)); setVista('torneoPublico') }
    else if (id === 'buscar') setVista(sesion ? 'buscar' : 'login')
    else if (id === 'mensajes') { setChatCon(null); setVista(sesion ? 'chat' : 'login') }
    else if (id === 'perfil') { setDestinoTrasLogin('perfil'); setVista(sesion ? 'perfil' : 'login') }
    else if (id === 'panelAdmin') setVista(sesion ? 'panelAdmin' : 'login')
    else if (id === 'entrar') { setDestinoTrasLogin('perfil'); setVista('login') }
  }

  // En computadora, envuelve una pantalla con la barra superior del armazón.
  // En teléfono devuelve la pantalla tal cual (la barra no se usa).
  const conBarra = (nodo) => esEscritorio
    ? <ShellEscritorio vista={vista} sesion={sesion} onNav={navegar}>{nodo}</ShellEscritorio>
    : nodo

  if (mostrarIntro) {
    return <IntroMediaCancha onFinish={() => setMostrarIntro(false)} />
  }

  if (vista === 'registro') {
    return <PantallaRegistro onListo={() => setVista(destinoTrasLogin)} onIrLogin={() => setVista('login')} onVolver={() => volver()} />
  }

  if (vista === 'login') {
    return <PantallaLogin onListo={() => setVista(destinoTrasLogin)} onIrRegistro={() => setVista('registro')} onVolver={() => volver()} />
  }

  if (vista === 'perfil') {
    return <PantallaPerfil onVolver={() => volver()} onSalir={() => setVista('publica')} onSiguiendo={() => setVista('siguiendo')} onConfig={() => { setConfigOrigen('perfil'); setVista('configuracion') }} onAccion={(id) => { if (id === 'panelAdmin') setVista('panelAdmin') }} />
  }

  if (vista === 'configuracion') {
    return <PantallaConfiguracion onVolver={() => setVista(configOrigen)} onSalir={() => setVista('publica')} />
  }

  if (vista === 'siguiendo') {
    return (
      <PantallaSiguiendo
        onVolver={() => volver()}
        onVerPerfil={(id) => { if (id && sesion?.user?.id === id) { setVista('perfil') } else { setPerfilViendo(id); setVista('perfilAjeno') } }}
        onVerTorneo={(id) => { setTorneoPublicoId(id); setVista('torneoPublico') }}
      />
    )
  }

  if (vista === 'panelAdmin') {
    return <PantallaComando onVolver={() => volver()} />
  }

  if (vista === 'buscar') {
    return conBarra(
      <PantallaBuscar
        onVolver={() => volver()}
        onVerPerfil={(id) => { if (id && sesion?.user?.id === id) { setVista('perfil') } else { setPerfilViendo(id); setVista('perfilAjeno') } }}
      />
    )
  }

  if (vista === 'chat') {
    return (
      <PantallaChat
        abrirCon={chatCon}
        onVolver={() => { setChatCon(null); volver() }}
        onVerPerfil={(id) => { if (id && sesion?.user?.id === id) { setVista('perfil') } else { setPerfilViendo(id); setVista('perfilAjeno') } }}
        onAbrirGrupo={(g) => { setGrupoActivo(g); setVista('grupo') }}
        onCrearGrupo={() => setVista('crearGrupo')}
      />
    )
  }

  if (vista === 'grupo') {
    return (
      <PantallaGrupo
        grupoId={grupoActivo?.id}
        grupoNombre={grupoActivo?.nombre}
        grupoTipo={grupoActivo?.tipo}
        onVolver={() => { setGrupoActivo(null); volver() }}
        onVerPerfil={(id) => { if (id && sesion?.user?.id === id) { setVista('perfil') } else { setPerfilViendo(id); setVista('perfilAjeno') } }}
      />
    )
  }

  if (vista === 'crearGrupo') {
    return (
      <PantallaCrearGrupo
        onVolver={() => setVista('chat')}
        onCreado={(grupoId) => { setGrupoActivo({ id: grupoId, nombre: 'Grupo', tipo: 'manual' }); setVista('grupo') }}
      />
    )
  }

  if (vista === 'publicar') {
    return (
      <PantallaPublicar
        onVolver={() => volver()}
        onPublicado={() => setVista('publica')}
        onResultado={() => { setDestinoTrasLogin('juegoConfig'); setVista(sesion ? 'juegoConfig' : 'login') }}
      />
    )
  }

  if (vista === 'torneos') {
    return (
      <PantallaTorneos
        esAdmin={false}
        onVolver={() => volver()}
        onAccion={(id) => { if (id === 'admin') setVista('torneosAdmin') }}
      />
    )
  }

  if (vista === 'invitaciones') {
    return (
      <PantallaInvitaciones onVolver={() => volver()} />
    )
  }

  if (vista === 'torneoPublico') {
    return (
      <PantallaTorneoPublico
        torneoId={torneoPublicoId}
        onVolver={() => volver()}
        onVerPerfil={(id) => { if (id && sesion?.user?.id === id) { setVista('perfil') } else { setPerfilViendo(id); setVista('perfilAjeno') } }}
        onGestionar={(id) => { setTorneoAdminId(id); setVista('torneosAdmin') }}
      />
    )
  }

  if (vista === 'torneoConfig') {
    return (
      <PantallaTorneoConfig
        torneoId={torneoEnJuego}
        onListo={async (config) => {
          if (juegoTorneoCtx) {
            const roster = await leerRosterTorneo(juegoTorneoCtx.torneoId)
            const jugadores = jugadoresDesdeRoster(roster, juegoTorneoCtx.equipoA_id, juegoTorneoCtx.equipoB_id)
            setConfigJuego({ ...config, nombreA: juegoTorneoCtx.nombreA, nombreB: juegoTorneoCtx.nombreB, jugadores, juegoTorneo: juegoTorneoCtx })
            setJuegoTorneoCtx(null)
            setVista('juegoVivo')
          } else {
            setConfigJuego(config); setVista('juegoJugadores')
          }
        }}
        onVolver={() => { if (juegoTorneoCtx) { setJuegoTorneoCtx(null); setVista('torneosAdmin') } else { setVista('torneoPublico') } }}
      />
    )
  }

  if (vista === 'misTorneos') {
    return (
      <PantallaMisTorneos
        onElegir={(id) => { setTorneoAdminId(id); setVista('torneosAdmin') }}
        onCrear={() => setVista(sesion ? 'crearTorneo' : 'login')}
        onVolver={() => volver()}
      />
    )
  }

  if (vista === 'torneosAdmin') {
    return (
      <>
      <PantallaTorneos
        esAdmin={true}
        torneoId={torneoAdminId}
        onVolver={() => volver()}
        onAccion={(id) => { if (typeof id === 'string' && id.startsWith('verPublico:')) { setTorneoPublicoId(id.slice('verPublico:'.length)); setVista('torneoPublico') } }}
        onVerPerfil={(id) => { if (id && sesion?.user?.id === id) { setVista('perfil') } else { setPerfilViendo(id); setVista('perfilAjeno') } }}
        onAnotarJuego={(juego) => { setJuegoTorneoCtx(juego); setTorneoEnJuego(juego.torneoId); setVista('torneoConfig') }}
        onConfigurar={(id) => { setTorneoConfigId(id); setVista('configTorneo') }}
        onAbrirGrupo={(g) => { setGrupoActivo(g); setVista('grupo') }}
      />
      {AvisoOffline}
      </>
    )
  }

  if (vista === 'configTorneo') {
    return (
      <PantallaConfigTorneo
        torneoId={torneoConfigId}
        onVolver={() => volver()}
      />
    )
  }

  if (vista === 'crearTorneo') {
    return (
      <PantallaCrearTorneo
        onVolver={() => volver()}
        onCreado={(torneo) => { if (torneo?.id) setTorneoAdminId(torneo.id); setVista('torneosAdmin') }}
      />
    )
  }

  if (vista === 'perfilAjeno') {
    return conBarra(
      <PantallaPerfilAjeno
        usuarioId={perfilViendo}
        onVolver={() => volver()}
        onMensaje={(id) => { setChatCon(id); setVista('chat') }}
      />
    )
  }

  if (vista === 'resultados') {
    return (
      <PantallaResultados
        onVolver={() => volver()}
        onNuevoJuego={() => { setDestinoTrasLogin('juegoConfig'); setVista(sesion ? 'juegoConfig' : 'login') }}
        onAccion={(id) => {
          if (id === 'perfil') { setDestinoTrasLogin('perfil'); setVista(sesion ? 'perfil' : 'login') }
          else if (id === 'publicarJuego') { /* se maneja dentro de Resultados próximamente */ }
        }}
      />
    )
  }

  if (vista === 'juegoConfig') {
    return (
      <PantallaJuegoConfig
        onListo={(config) => { setConfigJuego(config); setVista('juegoJugadores') }}
        onVolver={() => volver()}
      />
    )
  }

  if (vista === 'juegoJugadores') {
    return (
      <PantallaJuegoJugadores
        config={configJuego}
        onListo={(configCompleta) => { setConfigJuego(configCompleta); setVista('juegoVivo') }}
        onVolver={() => volver()}
      />
    )
  }

  if (vista === 'juegoVivo') {
    return (
      <PantallaJuegoVivo
        config={configJuego}
        onTerminar={async (res) => {
          if (juegoLigaCtx) {
            await intentarOEncolar('juego_liga', { ligaId: juegoLigaCtx.ligaId, modo: juegoLigaCtx.modo, ligaNombre: ligaActiva?.nombre || null, res }, `Juego de liga · ${res.nombreA} vs ${res.nombreB}`)
            setJuegoLigaCtx(null)
            setConfigJuego(null)
            setVista('liga')
          } else if (res?.juegoTorneo) {
            await intentarOEncolar('juego_torneo', { juegoTorneo: res.juegoTorneo, res }, `Juego de torneo · ${res.nombreA} vs ${res.nombreB}`)
            setConfigJuego(null)
            setVista('torneosAdmin')
          } else {
            // Juego suelto / rápido / fogueo: el resultado ya se guarda LOCAL (guardarJuegoDelDia);
            // solo la estadística necesita internet, así que esa sí pasa por la cola.
            intentarOEncolar('stats_rapido', { formato: res.formato, jugadores: res.jugadores, statsActivas: res.statsActivas, origen: 'rapido' })
            guardarJuegoDelDia(res); setResultadoJuego(res); setVista('juegoResultado')
          }
        }}
        onVolver={() => { if (juegoLigaCtx) { setJuegoLigaCtx(null); setConfigJuego(null); setVista('liga') } else if (configJuego?.juegoTorneo) { setConfigJuego(null); setVista('torneosAdmin') } else { setVista('publica') } }}
        onMarcadorVivo={(a, b) => { const jt = configJuego?.juegoTorneo; if (jt?.juegoId) marcarJuegoVivo(jt.juegoId, a, b) }}
      />
    )
  }

  if (vista === 'juegoResultado') {
    return (
      <>
      <PantallaJuegoResultado
        resultado={resultadoJuego}
        onNuevo={() => { setConfigJuego(null); setResultadoJuego(null); setVista('juegoConfig') }}
        onInicio={() => { setConfigJuego(null); setResultadoJuego(null); setVista('publica') }}
        onRepetir={() => {
          // Mismos equipos, mismas reglas: solo resetea stats y marcador
          const jugadoresLimpios = (resultadoJuego.jugadores || []).map((j) => ({ ...j, pts: 0, reb: 0, ast: 0, rob: 0, tap: 0 }))
          setConfigJuego({ ...resultadoJuego, jugadores: jugadoresLimpios })
          setResultadoJuego(null)
          setVista('juegoVivo')
        }}
        onSustituirPerdedor={(ganadorEq) => {
          // El ganador se queda (stats reseteadas), se va a editar el perdedor
          const ganadores = (resultadoJuego.jugadores || []).filter((j) => j.equipo === ganadorEq).map((j) => ({ ...j, pts: 0, reb: 0, ast: 0, rob: 0, tap: 0 }))
          const nombreGanador = ganadorEq === 0 ? resultadoJuego.nombreA : resultadoJuego.nombreB
          setConfigJuego({
            ...resultadoJuego,
            equipoFijo: ganadorEq,
            nombreEquipoFijo: nombreGanador,
            jugadoresFijos: ganadores,
          })
          setResultadoJuego(null)
          setVista('juegoJugadores')
        }}
      />
      {AvisoOffline}
      </>
    )
  }

  if (vista === 'ligaPublica') {
    return (
      <PantallaLigaPublica
        liga={ligaActiva}
        onVolver={() => volver()}
        onGestionar={() => setVista('liga')}
        onVerPerfil={(id) => { if (id && sesion?.user?.id === id) { setVista('perfil') } else { setPerfilViendo(id); setVista('perfilAjeno') } }}
      />
    )
  }

  if (vista === 'liga') {
    return (
      <>
      <PantallaLiga
        liga={ligaActiva}
        onVolver={() => volver()}
        onInvitar={() => { setDestinoTrasLogin('ligaInvitar'); setVista(sesion ? 'ligaInvitar' : 'login') }}
        onAnotar={(modo) => {
          setJuegoLigaCtx({ ligaId: ligaActivaId, modo: modo || 'normal' })
          setDestinoTrasLogin('juegoConfig')
          setVista(sesion ? 'juegoConfig' : 'login')
        }}
        onAbrirGrupo={(g) => { setGrupoActivo(g); setVista('grupo') }}
      />
      {AvisoOffline}
      </>
    )
  }

  if (vista === 'ligaInvitar') {
    return (
      <PantallaInvitarLiga
        liga={ligaActiva}
        onVolver={() => volver()}
      />
    )
  }

  if (vista === 'crearLiga') {
    return (
      <PantallaCrearLiga
        onVolver={() => volver()}
        onCreada={(liga) => { setLigaActivaId(liga?.id || null); setLigaActiva(liga || null); setVista('ligaPublica') }}
      />
    )
  }

  if (vista === 'ligas') {
    return (
      <PantallaLigas
        onVolver={() => volver()}
        onAccion={(id) => { if (id === 'lnb') setVista('lnb'); else if (id === 'nba') setVista('nba'); else if (id === 'noticias') setVista('noticias'); else if (id === 'rosters') setVista('rosters'); else if (id === 'comando') setVista('comando'); else if (id === 'crearLiga') setVista(sesion ? 'crearLiga' : 'login'); else if (id && id.indexOf('abrirLiga:') === 0) { setLigaActivaId(id.slice('abrirLiga:'.length)); setVista('ligaPublica') } }}
      />
    )
  }

  if (vista === 'lnb') {
    return (
      <PantallaLNB
        onVolver={() => volver()}
        onAccion={(id) => {
          if (id === 'buscar') setVista(sesion ? 'buscar' : 'login')
          else if (id === 'perfil') { setDestinoTrasLogin('perfil'); setVista(sesion ? 'perfil' : 'login') }
        }}
      />
    )
  }

  if (vista === 'nba') {
    return (
      <PantallaNBA onVolver={() => volver()} />
    )
  }

  if (vista === 'noticias') {
    return (
      <PantallaNoticias onVolver={() => volver()} />
    )
  }

  if (vista === 'rosters') {
    return (
      <PantallaRosters onVolver={() => volver()} />
    )
  }

  if (vista === 'comando') {
    return (
      <PantallaCentroComando onVolver={() => volver()} onAbrirDraft={() => setVista('draft')} onAbrirNoticias={() => setVista('noticiasCrudas')} />
    )
  }

  if (vista === 'noticiasCrudas') {
    return (
      <PantallaNoticiasCrudas onVolver={() => volver()} />
    )
  }

  if (vista === 'draft') {
    return (
      <PantallaSalaDraft onVolver={() => volver()} />
    )
  }

  return (
    <>
    <PantallaPublica
      haySesion={!!sesion}
      onAccion={(id) => {
        if (id === 'perfil') {
          setDestinoTrasLogin('perfil')
          setVista(sesion ? 'perfil' : 'login')
        } else if (id === 'registro') {
          setDestinoTrasLogin('perfil')
          setVista('registro')
        } else if (id === 'entrar') {
          setDestinoTrasLogin('perfil')
          setVista('login')
        } else if (id === 'cerrarSesion') {
          supabase.auth.signOut()
        } else if (id === 'juego') {
          setDestinoTrasLogin('juegoConfig')
          setVista(sesion ? 'juegoConfig' : 'login')
        } else if (id === 'resultados') {
          setVista('resultados')
        } else if (id === 'torneos') {
          setTorneoPublicoId(null)
          setVista('torneoPublico')
        } else if (id.startsWith && id.startsWith('torneoPublico:')) {
          setTorneoPublicoId(id.slice('torneoPublico:'.length))
          setVista('torneoPublico')
        } else if (id === 'misTorneos' || id === 'dondeJuego') {
          setVista('misTorneos')
        } else if (id === 'crearLiga') {
          setVista(sesion ? 'crearLiga' : 'login')
        } else if (id === 'misLigas') {
          setVista('ligas')
        } else if (id === 'invitaciones') {
          setVista(sesion ? 'invitaciones' : 'login')
        } else if (id === 'crearTorneo') {
          setVista(sesion ? 'crearTorneo' : 'login')
        } else if (id === 'publicar') {
          setDestinoTrasLogin('publicar')
          setVista(sesion ? 'publicar' : 'login')
        } else if (id === 'ligas') {
          setVista('ligas')
        } else if (id === 'rankings' || id === 'nba') {
          setVista('nba')
        } else if (id === 'buscar') {
          setVista(sesion ? 'buscar' : 'login')
        } else if (id === 'mensajes') {
          setVista(sesion ? 'chat' : 'login')
        } else if (id.startsWith && id.startsWith('chatCon:')) {
          setChatCon(id.slice('chatCon:'.length))
          setVista(sesion ? 'chat' : 'login')
        } else if (id.startsWith && id.startsWith('verPerfil:')) {
          const idPerfil = id.slice('verPerfil:'.length)
          if (idPerfil && sesion?.user?.id === idPerfil) {
            // Es mi propia foto → mi perfil propio (no el ajeno, así no me sigo a mí mismo)
            setVista('perfil')
          } else {
            setPerfilViendo(idPerfil)
            setVista('perfilAjeno')
          }
        } else if (id === 'configuracion') {
          setConfigOrigen('publica')
          setDestinoTrasLogin('configuracion')
          setVista(sesion ? 'configuracion' : 'login')
        } else {
          // Destino sin pantalla todavía: no hacemos nada (sin alert, que contamina el WebView).
          if (typeof console !== 'undefined') console.warn('Acción sin destino:', id)
        }
      }}
    />
    {AvisoOffline}
    </>
  )
}

export default App