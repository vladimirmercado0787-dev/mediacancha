import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Capacitor } from '@capacitor/core'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'

if (Capacitor.isNativePlatform()) {
  // El teclado EMPUJA la app hacia arriba (achica el Web View para que quepa
  // sobre el teclado): así la caja de escribir sube encima del teclado,
  // el header queda fijo y solo los mensajes corren por dentro.
  Keyboard.setResizeMode({ mode: KeyboardResize.Native })
  Keyboard.setAccessoryBarVisible({ isVisible: false })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)