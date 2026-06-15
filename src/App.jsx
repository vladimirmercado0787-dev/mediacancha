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
import { guardarJuegoDelDia } from './historialDia'

function App() {
  const [mostrarIntro, setMostrarIntro] = useState(true)
  const [vista, setVista] = useState('publica')
  const [sesion, setSesion] = useState(null)
  const [configJuego, setConfigJuego] = useState(null)
  const [resultadoJuego, setResultadoJuego] = useState(null)
  const [destinoTrasLogin, setDestinoTrasLogin] = useState('perfil')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, ses) => setSesion(ses))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (mostrarIntro) {
    return <IntroMediaCancha onComplete={() => setMostrarIntro(false)} />
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
        } else {
          alert('Módulo "' + id + '" — aquí irá su pantalla (próximamente)')
        }
      }}
    />
  )
}

export default App