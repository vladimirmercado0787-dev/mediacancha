import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

// ============================================================
//  NOTICIAS RÁPIDAS — Media Cancha
//  Lee la tabla micro_news (la que llena el robot) y muestra las
//  "Portadas Atómicas" en un feed que se actualiza solo.
//
//  FOTOS: igual que la pantalla NBA — por ahora van las INICIALES
//  del jugador (silueta por ley). El espn_id ya viene guardado;
//  el día que haya licencia, se enciende la foto sin rehacer nada.
//
//  EN VIVO: se suscribe a Supabase Realtime (las nuevas caen solas y
//  parpadean). Por si Realtime no está activo, además refresca cada minuto.
// ============================================================

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const C = {
  fondo: '#070d1d',
  glow1: 'rgba(62,107,214,0.16)',
  glow2: 'rgba(47,191,113,0.10)',
  panel: 'rgba(255,255,255,0.045)',
  panelAlt: 'rgba(255,255,255,0.07)',
  borde: 'rgba(150,172,228,0.18)',
  texto: '#eef3fc',
  texto2: '#c2cce0',
  tenue: '#8a9bc0',
  tenue2: '#5d6c8c',
}

// Categorías: etiqueta + color (mismos cuatro que produce el robot)
const CAT = {
  LESION:   { lbl: 'Lesión',   c: '#FF5A5F' },
  QUINTETO: { lbl: 'Quinteto', c: '#2FBF71' },
  TRASPASO: { lbl: 'Traspaso', c: '#5AA9FF' },
  RUMOR:    { lbl: 'Rumor',    c: '#F5B82E' },
}
const catMeta = (k) => CAT[k] || { lbl: k || '—', c: '#8a9bc0' }

// Limpia el nombre de la fuente para mostrarlo ("Rotowire RSS" -> "Rotowire")
const fuenteLabel = (s) => String(s || '').replace(/\s*RSS$/i, '').trim() || 'Fuente'

const FILTROS = [
  { id: 'TODAS', lbl: 'Todas' },
  { id: 'LESION', lbl: 'Lesiones' },
  { id: 'QUINTETO', lbl: 'Quinteto' },
  { id: 'TRASPASO', lbl: 'Traspasos' },
  { id: 'RUMOR', lbl: 'Rumores' },
]

function iniciales(nombre) {
  const p = (nombre || '').trim().split(/\s+/)
  if (!p.length || !p[0]) return '?'
  if (p.length === 1) return p[0].slice(0, 3).toUpperCase()
  return (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

// Avatar del jugador. En modo PRIVADO (pro) y si hay espn_id, muestra la foto
// de ESPN; si no hay foto o falla, cae a las iniciales. La pantalla pública
// siempre va con iniciales.
function AvatarJugador({ it, color, pro }) {
  const [fallo, setFallo] = useState(false)
  const usaFoto = pro && it.espn_id && !fallo
  const base = { flexShrink: 0, width: 50, height: 50, borderRadius: 14, marginLeft: 6, border: `1.5px solid ${color}66`, overflow: 'hidden' }
  if (usaFoto) {
    const url = `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${it.espn_id}.png&w=120&h=120&scale=crop&cquality=80`
    return (
      <div style={{ ...base, background: '#0d1426' }}>
        <img src={url} alt="" loading="lazy" onError={() => setFallo(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
      </div>
    )
  }
  return <div style={{ ...base, display: 'grid', placeItems: 'center', background: `${color}1f`, color, fontWeight: 900, fontSize: 16 }}>{iniciales(it.player_name)}</div>
}

// "hace 5 min", "hace 2 h", "ayer", o la fecha
function hace(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(+d)) return ''
  const seg = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seg < 60) return 'ahora'
  const min = Math.floor(seg / 60)
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const dias = Math.floor(h / 24)
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })
}

const esHoy = (iso) => {
  const d = new Date(iso); const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

export default function PantallaNoticias({ onVolver }) {
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('TODAS')
  const [nuevos, setNuevos] = useState(() => new Set()) // ids que acaban de entrar → parpadean
  const [esEscritorio, setEsEscritorio] = useState(false)
  const idsRef = useRef(new Set())

  // Modo PRIVADO (fotos). Se prende con un gesto secreto y queda guardado en
  // ESTE dispositivo nada más. La pantalla pública nunca muestra fotos.
  const [pro, setPro] = useState(() => { try { return localStorage.getItem('mc_noticias_pro') === '1' } catch (e) { return false } })
  const tapsRef = useRef({ n: 0, t: 0 })
  const golpeSecreto = () => {
    const ahora = Date.now()
    const r = tapsRef.current
    if (ahora - r.t > 2500) r.n = 0
    r.n += 1; r.t = ahora
    if (r.n >= 5) {
      r.n = 0
      setPro((p) => { const np = !p; try { localStorage.setItem('mc_noticias_pro', np ? '1' : '0') } catch (e) {} return np })
    }
  }

  useEffect(() => {
    const ver = () => setEsEscritorio(window.innerWidth >= 900)
    ver(); window.addEventListener('resize', ver)
    return () => window.removeEventListener('resize', ver)
  }, [])

  // Carga inicial + refresco periódico (red de seguridad si Realtime no está activo)
  async function cargar(marcarNuevos) {
    try {
      const { data, error } = await supabase
        .from('micro_news')
        .select('*')
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(60)
      if (error) throw error
      const filas = data || []
      if (marcarNuevos) {
        const frescos = filas.filter((f) => !idsRef.current.has(f.id)).map((f) => f.id)
        if (frescos.length) {
          setNuevos((prev) => { const s = new Set(prev); frescos.forEach((id) => s.add(id)); return s })
          frescos.forEach((id) => setTimeout(() => setNuevos((prev) => { const s = new Set(prev); s.delete(id); return s }), 7000))
        }
      }
      idsRef.current = new Set(filas.map((f) => f.id))
      setItems(filas)
      setError(null)
    } catch (e) {
      setError(String(e?.message || e))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar(false)
    // Realtime: cada inserto nuevo cae solo y parpadea
    const canal = supabase
      .channel('micro_news_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'micro_news' }, (payload) => {
        const fila = payload.new
        if (!fila || idsRef.current.has(fila.id)) return
        idsRef.current.add(fila.id)
        setItems((prev) => [fila, ...prev].slice(0, 80))
        setNuevos((prev) => { const s = new Set(prev); s.add(fila.id); return s })
        setTimeout(() => setNuevos((prev) => { const s = new Set(prev); s.delete(fila.id); return s }), 7000)
      })
      .subscribe()
    // Red de seguridad: refresca cada 60 s
    const reloj = setInterval(() => cargar(true), 60000)
    return () => { supabase.removeChannel(canal); clearInterval(reloj) }
  }, [])

  const visibles = filtro === 'TODAS' ? items : items.filter((it) => it.category === filtro)
  const conteoHoy = items.filter((it) => esHoy(it.published_at)).length

  // ---------- una portada ----------
  const Portada = (it) => {
    const m = catMeta(it.category)
    const fresco = nuevos.has(it.id)
    return (
      <div key={it.id} style={{
        position: 'relative', display: 'flex', gap: 13, alignItems: 'flex-start',
        borderRadius: 18, border: `1px solid ${fresco ? m.c + '88' : C.borde}`,
        background: fresco ? `linear-gradient(120deg, ${m.c}22, ${C.panel})` : C.panel,
        padding: '14px 14px', marginBottom: 12,
        boxShadow: fresco ? `0 0 22px ${m.c}33` : '0 6px 18px rgba(8,16,40,0.30)',
        transition: 'all .5s ease',
      }}>
        {/* franja de color de la categoría */}
        <span style={{ position: 'absolute', top: 12, bottom: 12, left: 0, width: 3, borderRadius: 3, background: m.c }} />

        {/* avatar: iniciales en público; foto de ESPN en modo privado */}
        <AvatarJugador it={it} color={m.c} pro={pro} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: C.texto, lineHeight: 1.2 }}>{it.headline}</span>
            {fresco && <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1, color: '#04140c', background: m.c, borderRadius: 20, padding: '2px 7px', flexShrink: 0 }}>NUEVO</span>}
          </div>
          <div style={{ fontSize: 13, color: C.texto2, lineHeight: 1.45 }}>{it.bullet_point}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: m.c, background: `${m.c}1a`, border: `1px solid ${m.c}40`, borderRadius: 20, padding: '3px 9px' }}>{m.lbl}</span>
            {it.player_name && <span style={{ fontSize: 11.5, color: C.tenue, fontWeight: 600 }}>{it.player_name}</span>}
            <span style={{ fontSize: 11, color: C.tenue2 }}>· {hace(it.published_at)}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.tenue, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.borde}`, borderRadius: 6, padding: '2px 7px' }}>vía {fuenteLabel(it.source)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.fondo, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: FONT }}>
      <div style={{ position: 'absolute', top: -120, left: -80, width: 360, height: 360, borderRadius: '50%', background: C.glow1, filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -140, right: -100, width: 400, height: 400, borderRadius: '50%', background: C.glow2, filter: 'blur(90px)', pointerEvents: 'none' }} />

      {/* HEADER */}
      <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: 'rgba(7,13,29,0.86)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.borde}` }}>
        <div style={{ maxWidth: esEscritorio ? 720 : '100%', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
          <button onClick={onVolver} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 11, border: `1px solid ${C.borde}`, background: C.panel, color: C.texto, fontSize: 19, cursor: 'pointer', flexShrink: 0 }}>‹</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.texto, letterSpacing: 0.2 }}>Noticias Rápidas</div>
            <div style={{ fontSize: 11.5, color: pro ? '#F5B82E' : C.tenue, marginTop: 1 }}>{pro ? 'Modo privado · con fotos 📸' : 'Lo último de la NBA, al instante'}</div>
          </div>
          <button onClick={golpeSecreto} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer', background: pro ? 'rgba(245,184,46,0.12)' : C.panel, border: `1px solid ${pro ? 'rgba(245,184,46,0.45)' : C.borde}`, borderRadius: 11, padding: '6px 10px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: pro ? '#F5B82E' : '#2FBF71', boxShadow: `0 0 8px ${pro ? '#F5B82E' : '#2FBF71'}` }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: pro ? '#F5B82E' : C.texto2 }}>{pro ? '📸 ' : ''}{conteoHoy} hoy</span>
          </button>
        </div>

        {/* CHIPS de categoría */}
        <div style={{ maxWidth: esEscritorio ? 720 : '100%', margin: '0 auto', display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {FILTROS.map((f) => {
            const on = filtro === f.id
            const col = f.id === 'TODAS' ? '#9fb2dc' : catMeta(f.id).c
            return (
              <button key={f.id} onClick={() => setFiltro(f.id)} style={{
                flexShrink: 0, cursor: 'pointer', fontSize: 12, fontWeight: 800, borderRadius: 20, padding: '7px 14px',
                border: `1px solid ${on ? col : C.borde}`,
                background: on ? `${col}22` : 'transparent',
                color: on ? col : C.tenue,
              }}>{f.lbl}</button>
            )
          })}
        </div>
      </div>

      {/* CUERPO */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: esEscritorio ? 720 : '100%', margin: '0 auto', padding: '16px 16px calc(env(safe-area-inset-bottom) + 40px)' }}>

          {cargando && (
            <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, padding: '60px 0' }}>Cargando noticias…</div>
          )}

          {!cargando && error && (
            <div style={{ textAlign: 'center', color: '#FF8A8E', fontSize: 13, padding: '40px 16px', lineHeight: 1.5, background: 'rgba(255,90,95,0.08)', border: '1px solid rgba(255,90,95,0.25)', borderRadius: 14 }}>
              No se pudieron cargar las noticias.<br /><span style={{ fontSize: 11, color: C.tenue }}>{error}</span>
            </div>
          )}

          {!cargando && !error && visibles.length === 0 && (
            <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, padding: '60px 16px', lineHeight: 1.6 }}>
              {items.length === 0
                ? 'Todavía no hay noticias guardadas. En cuanto el robot corra, aparecerán aquí.'
                : 'No hay noticias en esta categoría por ahora.'}
            </div>
          )}

          {!cargando && !error && visibles.map((it) => Portada(it))}

          {!cargando && !error && visibles.length > 0 && (
            <div style={{ textAlign: 'center', fontSize: 11, color: C.tenue2, marginTop: 10 }}>
              Se actualiza solo · {conteoHoy} de hoy
            </div>
          )}
        </div>
      </div>
    </div>
  )
}