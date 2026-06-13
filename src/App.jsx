import { useState } from 'react'
import IntroMediaCancha from './componentes/IntroMediaCancha'
import PantallaPublica from './componentes/PantallaPublica'

function App() {
  const [mostrarIntro, setMostrarIntro] = useState(true)

  if (mostrarIntro) {
    return <IntroMediaCancha onComplete={() => setMostrarIntro(false)} />
  }

  return (
    <PantallaPublica
      onAccion={(id) => alert('Módulo "' + id + '" — aquí irá su pantalla (próximamente)')}
    />
  )
}

export default App