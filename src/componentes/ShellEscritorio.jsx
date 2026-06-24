import { useState } from 'react'

// Barra superior de COMPUTADORA, reutilizable para todo el armazón.
// Solo se muestra en escritorio (App decide cuándo). En teléfono no se usa.
// Lee el tema de localStorage (mc_tema) y replica el look de la barra de la
// pantalla Pública, para que la navegación se vea pareja en toda la app.

const TEMA_BARRA = {
  noche: { esClaro: false, fondo: '#070f26', headerBg: 'rgba(7,13,29,0.92)', textoFuerte: '#eef3fc', tenue: '#8a9bc0', acento: '#3e6bd6', navBg: 'rgba(62,107,214,.15)', navBorde: 'rgba(62,107,214,.4)', avatar: 'linear-gradient(150deg,#5a86e0,#274a9a)', avatarTexto: '#ffffff', boton: 'linear-gradient(150deg,#5a86e0,#3e6bd6)' },
  dia: { esClaro: true, fondo: '#eef2fa', headerBg: 'rgba(255,255,255,0.95)', textoFuerte: '#13224a', tenue: '#8b97b2', acento: '#1b3a8c', navBg: 'rgba(27,58,140,.10)', navBorde: 'rgba(27,58,140,.22)', avatar: 'linear-gradient(150deg,#3a63c8,#12285f)', avatarTexto: '#ffffff', boton: 'linear-gradient(150deg,#3a63c8,#1b3a8c)' },
  dorado: { esClaro: false, fondo: '#0e0b06', headerBg: 'rgba(20,16,9,0.94)', textoFuerte: '#f6efe1', tenue: '#a08e6f', acento: '#e8b65a', navBg: 'rgba(232,182,79,.14)', navBorde: 'rgba(232,182,79,.4)', avatar: 'linear-gradient(150deg,#e0b057,#9a6420)', avatarTexto: '#211705', boton: 'linear-gradient(150deg,#f3cf63,#caa24a)' },
  larimar: { esClaro: false, fondo: '#03121a', headerBg: 'rgba(4,24,31,0.94)', textoFuerte: '#e8fbff', tenue: '#79b4bd', acento: '#3fc1c9', navBg: 'rgba(63,193,201,.16)', navBorde: 'rgba(63,193,201,.42)', avatar: 'linear-gradient(150deg,#56d6dd,#1a6a8a)', avatarTexto: '#04222a', boton: 'linear-gradient(150deg,#56d6dd,#2ba6ae)' },
  negro: { esClaro: false, fondo: '#000000', headerBg: 'rgba(0,0,0,0.94)', textoFuerte: '#ffffff', tenue: '#7d818c', acento: '#4d7cf0', navBg: 'rgba(77,124,240,.16)', navBorde: 'rgba(77,124,240,.45)', avatar: 'linear-gradient(150deg,#6f95f3,#3a5fc0)', avatarTexto: '#ffffff', boton: 'linear-gradient(150deg,#6f95f3,#4d7cf0)' },
}

const NAV = [
  { id: 'inicio', txt: 'Inicio' },
  { id: 'ligas', txt: 'Ligas' },
  { id: 'torneos', txt: 'Torneos' },
  { id: 'buscar', txt: 'Buscar' },
  { id: 'mensajes', txt: 'Mensajes' },
]

// Qué vista del armazón resalta cuál botón del nav.
const ACTIVO_DE = { publica: 'inicio', ligas: 'ligas', lnb: 'ligas', nba: 'ligas', torneos: 'torneos', torneosAdmin: 'torneos', crearTorneo: 'torneos', buscar: 'buscar', chat: 'mensajes' }

export default function ShellEscritorio({ vista, sesion, onNav, children }) {
  const [tema] = useState(() => { try { return localStorage.getItem('mc_tema') || 'dorado' } catch (e) { return 'dorado' } })
  const T = TEMA_BARRA[tema] || TEMA_BARRA.dorado
  const activo = ACTIVO_DE[vista] || vista

  return (
    <div style={{ minHeight: '100dvh', background: T.fondo }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: T.headerBg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.navBorde}`, paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ maxWidth: 1700, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, padding: '11px 30px' }}>
          <div onClick={() => onNav('inicio')} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" style={{ width: 28, height: 28 }}>
              <circle cx="50" cy="50" r="44" fill="none" stroke={T.acento} strokeWidth="5" />
              <line x1="50" y1="6" x2="50" y2="94" stroke={T.acento} strokeWidth="5" />
              <line x1="6" y1="50" x2="94" y2="50" stroke={T.acento} strokeWidth="5" />
              <path d="M18 24 Q50 50 18 76" fill="none" stroke={T.acento} strokeWidth="5" />
              <path d="M82 24 Q50 50 82 76" fill="none" stroke={T.acento} strokeWidth="5" />
            </svg>
            <div style={{ fontFamily: '"Arial Narrow", Impact, system-ui, sans-serif', fontWeight: 900, fontSize: 23, letterSpacing: 0.5, lineHeight: 1, whiteSpace: 'nowrap', display: 'flex', gap: 6 }}>
              <span style={{ color: T.esClaro ? '#7a6e58' : '#dfe2e6' }}>MEDIA</span><span style={{ color: T.acento }}>CANCHA</span>
            </div>
          </div>
          <nav style={{ display: 'flex', gap: 4 }}>
            {NAV.map((n) => {
              const on = n.id === activo
              return (
                <button key={n.id} onClick={() => onNav(n.id)} style={{ fontSize: 13.5, fontWeight: 800, color: on ? T.acento : T.tenue, padding: '9px 15px', borderRadius: 11, cursor: 'pointer', border: on ? `1px solid ${T.navBorde}` : '1px solid transparent', background: on ? T.navBg : 'transparent', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{n.txt}</button>
              )
            })}
          </nav>
          <span style={{ marginLeft: 'auto' }} />
          {sesion ? (
            <button onClick={() => onNav('perfil')} title="Mi perfil" style={{ width: 40, height: 40, borderRadius: '50%', border: `1px solid ${T.navBorde}`, cursor: 'pointer', background: T.avatar, color: T.avatarTexto, fontWeight: 800, fontSize: 17, flexShrink: 0, display: 'grid', placeItems: 'center', padding: 0 }}>👤</button>
          ) : (
            <button onClick={() => onNav('entrar')} style={{ border: 'none', borderRadius: 11, padding: '9px 20px', background: T.boton, color: T.esClaro ? '#ffffff' : '#1a1205', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>Entrar</button>
          )}
        </div>
      </header>
      {children}
    </div>
  )
}