import { useState } from 'react'
import { buscarPersonas } from '../torneos'
import { crearGrupoManual } from '../grupos'

const C = {
  bg: '#0e0f12', card: '#16181d', card2: '#1c1f26',
  borde: 'rgba(255,255,255,.08)', oro: '#e8b65a',
  txt: '#f4f7f9', body: '#c3cad3', tenue: '#828a95',
}

// Pantalla para crear un grupo de chat a mano: nombre + a quién metes.
export default function PantallaCrearGrupo({ onVolver, onCreado }) {
  const [nombre, setNombre] = useState('')
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [elegidos, setElegidos] = useState([]) // [{id, nombre, foto_url}]
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState(null)

  const buscar = async (v) => {
    setBusca(v)
    if (v.trim().length < 2) { setResultados([]); return }
    setBuscando(true)
    const { personas } = await buscarPersonas(v)
    setResultados(personas || [])
    setBuscando(false)
  }

  const toggle = (p) => {
    setElegidos((prev) => prev.some((e) => e.id === p.id) ? prev.filter((e) => e.id !== p.id) : [...prev, p])
  }

  const crear = async () => {
    if (!nombre.trim()) { setError('Ponle un nombre al grupo'); return }
    if (elegidos.length === 0) { setError('Agrega al menos una persona'); return }
    setCreando(true); setError(null)
    const { grupo, error: err } = await crearGrupoManual(nombre, elegidos.map((e) => e.id))
    setCreando(false)
    if (err) { setError(err); return }
    onCreado && onCreado(grupo.id)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.txt, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(14,15,18,.92)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${C.borde}`, padding: 'calc(env(safe-area-inset-top) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onVolver} style={{ background: 'none', border: 'none', color: C.txt, fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
        <div style={{ fontSize: 17, fontWeight: 800 }}>Crear grupo</div>
      </div>

      <div style={{ maxWidth: 560, width: '100%', margin: '0 auto', padding: '16px 16px 20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del grupo"
          style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.borde}`, borderRadius: 12, padding: '13px 14px', color: C.txt, fontSize: 15, fontWeight: 700, outline: 'none', marginBottom: 12 }}
        />

        {elegidos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {elegidos.map((p) => (
              <div key={p.id} onClick={() => toggle(p)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(232,182,90,.12)', border: '1px solid rgba(232,182,90,.35)', borderRadius: 20, padding: '5px 10px 5px 6px', cursor: 'pointer' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: p.foto_url ? `url(${p.foto_url}) center/cover` : C.card2, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800 }}>{!p.foto_url && (p.nombre || '?').slice(0, 1).toUpperCase()}</div>
                <span style={{ fontSize: 12.5, color: C.oro, fontWeight: 700 }}>{p.nombre}</span>
                <span style={{ fontSize: 13, color: C.oro }}>×</span>
              </div>
            ))}
          </div>
        )}

        <input
          value={busca}
          onChange={(e) => buscar(e.target.value)}
          placeholder="🔍 Buscar por nombre o MC-ID"
          style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.borde}`, borderRadius: 12, padding: '11px 14px', color: C.txt, fontSize: 14, outline: 'none', marginBottom: 10 }}
        />

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {buscando ? (
            <div style={{ color: C.tenue, fontSize: 13, padding: 10 }}>Buscando…</div>
          ) : resultados.length === 0 && busca.trim().length >= 2 ? (
            <div style={{ color: C.tenue, fontSize: 13, padding: 10 }}>Nadie con ese nombre.</div>
          ) : (
            resultados.map((p) => {
              const on = elegidos.some((e) => e.id === p.id)
              return (
                <div key={p.id} onClick={() => toggle(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 12, cursor: 'pointer', background: on ? 'rgba(232,182,90,.08)' : 'transparent' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: p.foto_url ? `url(${p.foto_url}) center/cover` : C.card2, display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800, border: `1px solid ${C.borde}` }}>{!p.foto_url && (p.nombre || '?').slice(0, 1).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>{p.nombre} {p.apellido || ''}</div>
                    <div style={{ fontSize: 11.5, color: C.tenue }}>{p.municipio || 'Media Cancha'}</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${on ? C.oro : C.borde}`, background: on ? C.oro : 'transparent', display: 'grid', placeItems: 'center', fontSize: 12, color: '#1a1205', fontWeight: 900 }}>{on ? '✓' : ''}</div>
                </div>
              )
            })
          )}
        </div>

        {error && <div style={{ color: '#e0563f', fontSize: 13, fontWeight: 600, marginTop: 10 }}>{error}</div>}

        <button onClick={crear} disabled={creando} style={{ width: '100%', marginTop: 14, border: 'none', borderRadius: 12, padding: 14, background: C.oro, color: '#1a1205', fontSize: 15, fontWeight: 800, cursor: creando ? 'default' : 'pointer', opacity: creando ? 0.7 : 1 }}>
          {creando ? 'Creando…' : `Crear grupo${elegidos.length ? ` (${elegidos.length + 1})` : ''}`}
        </button>
      </div>
    </div>
  )
}