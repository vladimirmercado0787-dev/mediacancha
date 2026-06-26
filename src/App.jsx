import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import IntroMediaCancha from './componentes/IntroMediaCancha'
import PantallaPublica from './componentes/PantallaPublica'
import PantallaRegistro from './componentes/PantallaRegistro'
import PantallaLogin from './componentes/PantallaLogin'
import PantallaPerfil from './componentes/PantallaPerfil'
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
import PantallaNoticiasCrudas from './componentes/PantallaNoticiasCrudas'
import PantallaCrearTorneo from './componentes/PantallaCrearTorneo'
import { guardarJuegoDelDia } from './historialDia'
import { leerRosterTorneo, guardarAnotacionTorneo } from './torneoData'
import PantallaLigas from './componentes/PantallaLigas'
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
    else if (id === 'torneos') setVista('torneoPublico')
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
    return <PantallaPerfil onVolver={() => setVista('publica')} onSalir={() => setVista('publica')} />
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
        onVolver={() => setVista('publica')}
        onVerPerfil={(id) => { if (id && sesion?.user?.id === id) { setVista('perfil') } else { setPerfilViendo(id); setVista('perfilAjeno') } }}
        onAnotar={(id) => { setTorneoEnJuego(id); setVista('torneoConfig') }}
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

  if (vista === 'torneosAdmin') {
    return (
      <PantallaTorneos
        esAdmin={true}
        onVolver={() => setVista('publica')}
        onAccion={() => {}}
        onVerPerfil={(id) => { if (id && sesion?.user?.id === id) { setVista('perfil') } else { setPerfilViendo(id); setVista('perfilAjeno') } }}
        onAnotarJuego={(juego) => { setJuegoTorneoCtx(juego); setTorneoEnJuego(juego.torneoId); setVista('torneoConfig') }}
      />
    )
  }

  if (vista === 'crearTorneo') {
    return (
      <PantallaCrearTorneo
        onVolver={() => setVista('publica')}
        onCreado={(torneo) => setVista('torneosAdmin')}
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
          if (res?.juegoTorneo) {
            await guardarAnotacionTorneo(res.juegoTorneo, res)
            setConfigJuego(null)
            setVista('torneosAdmin')
          } else {
            guardarJuegoDelDia(res); setResultadoJuego(res); setVista('juegoResultado')
          }
        }}
        onVolver={() => { if (configJuego?.juegoTorneo) { setConfigJuego(null); setVista('torneosAdmin') } else { setVista('publica') } }}
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

  if (vista === 'ligas') {
    return (
      <PantallaLigas
        onVolver={() => setVista('publica')}
        onAccion={(id) => { if (id === 'lnb') setVista('lnb'); else if (id === 'nba') setVista('nba'); else if (id === 'noticias') setVista('noticias'); else if (id === 'rosters') setVista('rosters'); else if (id === 'comando') setVista('comando') }}
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
          setVista('torneoPublico')
        } else if (id === 'misTorneos' || id === 'dondeJuego') {
          setVista('torneosAdmin')
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