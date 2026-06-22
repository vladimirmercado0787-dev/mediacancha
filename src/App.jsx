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
import PantallaCrearTorneo from './componentes/PantallaCrearTorneo'
import { guardarJuegoDelDia } from './historialDia'
import PantallaLigas from './componentes/PantallaLigas'
import PantallaLNB from './componentes/PantallaLNB'
import { StatusBar, Style } from '@capacitor/status-bar'

function App() {
  const [mostrarIntro, setMostrarIntro] = useState(true)
  const [vista, setVista] = useState('publica')
  const [sesion, setSesion] = useState(null)
  const [configJuego, setConfigJuego] = useState(null)
  const [resultadoJuego, setResultadoJuego] = useState(null)
  const [destinoTrasLogin, setDestinoTrasLogin] = useState('perfil')
  const [perfilViendo, setPerfilViendo] = useState(null)
  const [chatCon, setChatCon] = useState(null)

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
    return (
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

  if (vista === 'torneosAdmin') {
    return (
      <PantallaTorneos
        esAdmin={true}
        onVolver={() => setVista('publica')}
        onAccion={() => {}}
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
    return (
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
        onTerminar={(res) => { guardarJuegoDelDia(res); setResultadoJuego(res); setVista('juegoResultado') }}
        onVolver={() => setVista('publica')}
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
        onAccion={(id) => { if (id === 'lnb') setVista('lnb') }}
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
          setVista('torneosAdmin')
        } else if (id === 'misTorneos' || id === 'dondeJuego') {
          setVista('torneosAdmin')
        } else if (id === 'crearTorneo') {
          setVista(sesion ? 'crearTorneo' : 'login')
        } else if (id === 'publicar') {
          setDestinoTrasLogin('publicar')
          setVista(sesion ? 'publicar' : 'login')
        } else if (id === 'ligas') {
          setVista('ligas')
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