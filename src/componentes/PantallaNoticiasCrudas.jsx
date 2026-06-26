import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

// ============================================================
//  NOTICIAS COMPLETAS  (feed privado, crudo, con foto)
//  Lee la tabla noticias_crudas que llena el robot SIN Gemini.
//  Solo vive en la zona privada — por eso van fotos y todo.
// ============================================================

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const C = {
  fondo: '#070d1d',
  panel: 'rgba(255,255,255,0.045)',
  card: 'rgba(255,255,255,0.05)',
  borde: 'rgba(150,172,228,0.16)',
  txt: '#eef3fc',
  tenue: '#aab6d4',
  tenue2: '#7f8cae',
  oro: '#F5B82E',
  azul: '#5AA9FF',
}

function haceCuanto(fechaISO) {
  if (!fechaISO) return ''
  const d = new Date(fechaISO)
  if (isNaN(+d)) return ''
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'ahora'
  const m = Math.floor(s / 60); if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60); if (h < 24) return `hace ${h} h`
  const dias = Math.floor(h / 24); if (dias < 7) return `hace ${dias} d`
  return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })
}

function Tarjeta({ n }) {
  const [errImg, setErrImg] = useState(false)
  return (
    <article style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
      {n.imagen && !errImg && (
        <img src={n.imagen} alt="" loading="lazy" onError={() => setErrImg(true)} style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block', background: '#10162a' }} />
      )}
      <div style={{ padding: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, color: C.oro, textTransform: 'uppercase' }}>{n.fuente || 'Noticia'}</span>
          <span style={{ fontSize: 10.5, color: C.tenue2 }}>· {haceCuanto(n.fecha)}</span>
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: C.txt, margin: '0 0 8px', lineHeight: 1.3 }}>{n.titulo}</h2>
        {n.resumen && <p style={{ fontSize: 13.5, color: C.tenue, margin: '0 0 12px', lineHeight: 1.55 }}>{n.resumen}</p>}
        {n.enlace && (
          <a href={n.enlace} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: C.azul, textDecoration: 'none' }}>
            Leer en la fuente <span style={{ fontSize: 14 }}>↗</span>
          </a>
        )}
      </div>
    </article>
  )
}

export default function PantallaNoticiasCrudas({ onVolver }) {
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const { data } = await supabase.from('noticias_crudas').select('*').order('fecha', { ascending: false }).limit(60)
        if (!vivo) return
        setItems(data || []); setCargando(false)
      } catch (e) { if (vivo) setCargando(false) }
    })()
    return () => { vivo = false }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.fondo, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: FONT }}>
      {/* HEADER */}
      <div style={{ flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: 'rgba(7,13,29,0.92)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: `1px solid ${C.borde}` }}>
        <div style={{ maxWidth: 620, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px' }}>
          <button onClick={onVolver} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 11, border: `1px solid ${C.borde}`, background: C.card, color: C.txt, fontSize: 19, cursor: 'pointer', flexShrink: 0 }}>‹</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: C.txt }}>Noticias completas</div>
            <div style={{ fontSize: 11, color: C.tenue2, marginTop: 1 }}>Feed directo, sin filtrar · con foto</div>
          </div>
        </div>
      </div>

      {/* CUERPO */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '14px 14px calc(env(safe-area-inset-bottom) + 40px)' }}>
          {cargando && <div style={{ textAlign: 'center', color: C.tenue2, fontSize: 13, padding: '40px 0' }}>Cargando…</div>}
          {!cargando && items.length === 0 && (
            <div style={{ textAlign: 'center', color: C.tenue2, fontSize: 13, padding: '40px 16px', lineHeight: 1.6 }}>
              Todavía no hay noticias guardadas. El robot las va llenando solo cada quince minutos.
            </div>
          )}
          {items.map((n) => <Tarjeta key={n.id} n={n} />)}
        </div>
      </div>
    </div>
  )
}