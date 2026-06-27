import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import IntroMediaCancha from './componentes/IntroMediaCancha'
import PantallaPublica from './componentes/PantallaPublica'
import PantallaRegistro from './componentes/PantallaRegistro'
import PantallaLogin from './componentes/PantallaLogin'
import PantallaPerfil from './componentes/PantallaPerfil'
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
import { leerRosterTorneo, guardarAnotacionTorneo, marcarJuegoVivo } from './torneoData'
import PantallaLigas from './componentes/PantallaLigas'
import PantallaLiga from './componentes/PantallaLiga'
import PantallaInvitarLiga from './componentes/PantallaInvitarLiga'
import PantallaCrearLiga from './componentes/PantallaCrearLiga'
import { leerLiga, guardarJuegoLiga } from './ligas'
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
  const [sesion, setSesion] = useState(null)
  const [configJuego, setConfigJuego] = useState(null)
  const [resultadoJuego, setResultadoJuego] = useState(null)
  const [destinoTrasLogin, setDestinoTrasLogin] = useState('perfil')
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
    return <PantallaRegistro onListo={() => setVista(destinoTrasLogin)} onIrLogin={() => setVista('login')} onVolver={() => setVista('publica')} />
  }

  if (vista === 'login') {
    return <PantallaLogin onListo={() => setVista(destinoTrasLogin)} onIrRegistro={() => setVista('registro')} onVolver={() => setVista('publica')} />
  }

  if (vista === 'perfil') {
    return <PantallaPerfil onVolver={() => setVista('publica')} onSalir={() => setVista('publica')} onSiguiendo={() => setVista('siguiendo')} onConfig={() => setVista('configuracion')} />
  }

  if (vista === 'configuracion') {
    return <PantallaConfiguracion onVolver={() => setVista('perfil')} onSalir={() => setVista('publica')} />
  }

  if (vista === 'siguiendo') {
    return (
      <PantallaSiguiendo
        onVolver={() => setVista('perfil')}
        onVerPerfil={(id) => { if (id && sesion?.user?.id === id) { setVista('perfil') } else { setPerfilViendo(id); setVista('perfilAjeno') } }}
        onVerTorneo={(id) => { setTorneoPublicoId(id); setVista('torneoPublico') }}
      />
    )
  }

  if (vista === 'buscar') {
    return conBarra(
      <PantallaBuscar
        onVolver={() => setVista('publica')}
        onVerPerfil={(id) => { if (id && sesion?.user?.id === id) { setVista('perfil') } else { setPerfilViendo(id); setVista('perfilAjeno') } }}
      />
    )
  }

  if (vista === 'chat') {
    return (
      <PantallaChat
        abrirCon={chatCon}
        onVolver={() => { setChatCon(null); setVista('publica') }}
        onVerPerfil={(id) => { if (id && sesion?.user?.id === id) { setVista('perfil') } else { setPerfilViendo(id); setVista('perfilAjeno') } }}
      />
    )
  }

  if (vista === 'publicar') {
    return (
      <PantallaPublicar
        onVolver={() => setVista('publica')}
        onPublicado={() => setVista('publica')}
        onResultado={() => { setDestinoTrasLogin('juegoConfig'); setVista(sesion ? 'juegoConfig' : 'login') }}
      />
    )
  }

  if (vista === 'torneos') {
    return (
      <PantallaTorneos
        esAdmin={false}
        onVolver={() => setVista('publica')}
        onAccion={(id) => { if (id === 'admin') setVista('torneosAdmin') }}
      />
    )
  }

  if (vista === 'invitaciones') {
    return (
      <PantallaInvitaciones onVolver={() => setVista('publica')} />
    )
  }

  if (vista === 'torneoPublico') {
    return (
      <PantallaTorneoPublico
        torneoId={torneoPublicoId}
        onVolver={() => setVista('publica')}
        onVerPerfil={(id) => { if (id && sesion?.user?.id === id) { setVista('perfil') } else { setPerfilViendo(id); setVista('perfilAjeno') } }}
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
        onVolver={() => setVista('publica')}
      />
    )
  }

  if (vista === 'torneosAdmin') {
    return (
      <PantallaTorneos
        esAdmin={true}
        torneoId={torneoAdminId}
        onVolver={() => setVista('misTorneos')}
        onAccion={(id) => { if (typeof id === 'string' && id.startsWith('verPublico:')) { setTorneoPublicoId(id.slice('verPublico:'.length)); setVista('torneoPublico') } }}
        onVerPerfil={(id) => { if (id && sesion?.user?.id === id) { setVista('perfil') } else { setPerfilViendo(id); setVista('perfilAjeno') } }}
        onAnotarJuego={(juego) => { setJuegoTorneoCtx(juego); setTorneoEnJuego(juego.torneoId); setVista('torneoConfig') }}
        onConfigurar={(id) => { setTorneoConfigId(id); setVista('configTorneo') }}
      />
    )
  }

  if (vista === 'configTorneo') {
    return (
      <PantallaConfigTorneo
        torneoId={torneoConfigId}
        onVolver={() => setVista('torneosAdmin')}
      />
    )
  }

  if (vista === 'crearTorneo') {
    return (
      <PantallaCrearTorneo
        onVolver={() => setVista('misTorneos')}
        onCreado={(torneo) => { if (torneo?.id) setTorneoAdminId(torneo.id); setVista('torneosAdmin') }}
      />
    )
  }

  if (vista === 'perfilAjeno') {
    return conBarra(
      <PantallaPerfilAjeno
        usuarioId={perfilViendo}
        onVolver={() => setVista('publica')}
        onMensaje={(id) => { setChatCon(id); setVista('chat') }}
      />
    )
  }

  if (vista === 'resultados') {
    return (
      <PantallaResultados
        onVolver={() => setVista('publica')}
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
        onVolver={() => setVista('publica')}
      />
    )
  }

  if (vista === 'juegoJugadores') {
    return (
      <PantallaJuegoJugadores
        config={configJuego}
        onListo={(configCompleta) => { setConfigJuego(configCompleta); setVista('juegoVivo') }}
        onVolver={() => setVista('juegoConfig')}
      />
    )
  }

  if (vista === 'juegoVivo') {
    return (
      <PantallaJuegoVivo
        config={configJuego}
        onTerminar={async (res) => {
          if (juegoLigaCtx) {
            await guardarJuegoLiga(juegoLigaCtx.ligaId, juegoLigaCtx.modo, res)
            try { await publicarJuegoLiga(res, { ligaId: juegoLigaCtx.ligaId, ligaNombre: ligaActiva?.nombre || null, modo: juegoLigaCtx.modo }) } catch (e) { /* el juego ya quedó guardado aunque falle el Techado */ }
            setJuegoLigaCtx(null)
            setConfigJuego(null)
            setVista('liga')
          } else if (res?.juegoTorneo) {
            await guardarAnotacionTorneo(res.juegoTorneo, res)
            setConfigJuego(null)
            setVista('torneosAdmin')
          } else {
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
    )
  }

  if (vista === 'liga') {
    return (
      <PantallaLiga
        liga={ligaActiva}
        onVolver={() => setVista('ligas')}
        onInvitar={() => { setDestinoTrasLogin('ligaInvitar'); setVista(sesion ? 'ligaInvitar' : 'login') }}
        onAnotar={(modo) => {
          setJuegoLigaCtx({ ligaId: ligaActivaId, modo: modo || 'normal' })
          setDestinoTrasLogin('juegoConfig')
          setVista(sesion ? 'juegoConfig' : 'login')
        }}
      />
    )
  }

  if (vista === 'ligaInvitar') {
    return (
      <PantallaInvitarLiga
        liga={ligaActiva}
        onVolver={() => setVista('liga')}
      />
    )
  }

  if (vista === 'crearLiga') {
    return (
      <PantallaCrearLiga
        onVolver={() => setVista('ligas')}
        onCreada={(liga) => { setLigaActivaId(liga?.id || null); setLigaActiva(liga || null); setVista('liga') }}
      />
    )
  }

  if (vista === 'ligas') {
    return (
      <PantallaLigas
        onVolver={() => setVista('publica')}
        onAccion={(id) => { if (id === 'lnb') setVista('lnb'); else if (id === 'nba') setVista('nba'); else if (id === 'noticias') setVista('noticias'); else if (id === 'rosters') setVista('rosters'); else if (id === 'comando') setVista('comando'); else if (id === 'crearLiga') setVista(sesion ? 'crearLiga' : 'login'); else if (id && id.indexOf('abrirLiga:') === 0) { setLigaActivaId(id.slice('abrirLiga:'.length)); setVista('liga') } }}
      />
    )
  }

  if (vista === 'lnb') {
    return (
      <PantallaLNB
        onVolver={() => setVista('ligas')}
        onAccion={(id) => {
          if (id === 'buscar') setVista(sesion ? 'buscar' : 'login')
          else if (id === 'perfil') { setDestinoTrasLogin('perfil'); setVista(sesion ? 'perfil' : 'login') }
        }}
      />
    )
  }

  if (vista === 'nba') {
    return (
      <PantallaNBA onVolver={() => setVista('ligas')} />
    )
  }

  if (vista === 'noticias') {
    return (
      <PantallaNoticias onVolver={() => setVista('ligas')} />
    )
  }

  if (vista === 'rosters') {
    return (
      <PantallaRosters onVolver={() => setVista('ligas')} />
    )
  }

  if (vista === 'comando') {
    return (
      <PantallaCentroComando onVolver={() => setVista('ligas')} onAbrirDraft={() => setVista('draft')} onAbrirNoticias={() => setVista('noticiasCrudas')} />
    )
  }

  if (vista === 'noticiasCrudas') {
    return (
      <PantallaNoticiasCrudas onVolver={() => setVista('comando')} />
    )
  }

  if (vista === 'draft') {
    return (
      <PantallaSalaDraft onVolver={() => setVista('comando')} />
    )
  }

  return (
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
        } else {
          alert('Módulo "' + id + '" — aquí irá su pantalla (próximamente)')
        }
      }}
    />
  )
}

export default App