import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import IntroMediaCancha from './componentes/IntroMediaCancha'
import PantallaPublica from './componentes/PantallaPublica'
import PantallaRegistro from './componentes/PantallaRegistro'
import PantallaLogin from './componentes/PantallaLogin'
import PantallaPerfil from './componentes/PantallaPerfil'

function App() {
  const [mostrarIntro, setMostrarIntro] = useState(true)
  const [vista, setVista] = useState('publica') // 'publica' | 'registro' | 'login' | 'perfil'
  const [sesion, setSesion] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, ses) => setSesion(ses))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (mostrarIntro) {
    return <IntroMediaCancha onComplete={() => setMostrarIntro(false)} />
  }

  if (vista === 'registro') {
    return (
      <PantallaRegistro
        onListo={() => setVista('perfil')}
        onIrLogin={() => setVista('login')}
        onVolver={() => setVista('publica')}
      />
    )
  }

  if (vista === 'login') {
    return (
      <PantallaLogin
        onListo={() => setVista('perfil')}
        onIrRegistro={() => setVista('registro')}
        onVolver={() => setVista('publica')}
      />
    )
  }

  if (vista === 'perfil') {
    return (
      <PantallaPerfil
        onVolver={() => setVista('publica')}
        onSalir={() => setVista('publica')}
      />
    )
  }

  return (
    <PantallaPublica
      haySesion={!!sesion}
      onAccion={(id) => {
        if (id === 'perfil') {
          setVista(sesion ? 'perfil' : 'login')
        } else if (id === 'registro') {
          setVista('registro')
        } else if (id === 'entrar') {
          setVista('login')
        } else {
          alert('Módulo "' + id + '" — aquí irá su pantalla (próximamente)')
        }
      }}
    />
  )
}

export default App