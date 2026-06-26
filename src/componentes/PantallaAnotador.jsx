import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { leerEquiposTorneo, leerJuegosTorneo, anotarResultado } from '../torneoData'

// ============================================================
//  ANOTADOR DE TORNEO
//  Toma un juego del calendario ('proximo'), le mete el marcador
//  y lo cierra ('final'). La tabla y los momentos se actualizan solos.
//  Pensado para iPad/computadora en la mesa de la cancha.
// ============================================================

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const C = {
  bg: '#0a0e1a',
  panel: 'rgba(255,255,255,0.04)',
  card: 'rgba(255,255,255,0.05)',
  borde: 'rgba(150,172,228,0.16)',
  borde2: 'rgba(150,172,228,0.30)',
  txt: '#eef3fc',
  tenue: '#8a9bc0',
  tenue2: '#5d6c8c',
  oro: '#F5B82E',
  verde: '#16E68A',
  rojo: '#FF5A5F',
}

function Badge({ eq, size = 34 }) {
  if (!eq) return <div style={{ width: size, height: size, borderRadius: 9, background: C.card, flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: 9, flexShrink: 0, display: 'grid', placeItems: 'center', background: eq.color, color: '#0a0e1a', fontSize: size * 0.32, fontWeight: 900, letterSpacing: 0.3 }}>
      {eq.codigo}
    </div>
  )
}

export default function PantallaAnotador({ torneoId = null, onVolver }) {
  const [torneoRow, setTorneoRow] = useState(null)
  const [equipos, setEquipos] = useState([])
  const [juegos, setJuegos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [sel, setSel] = useState(null)
  const [pa, setPa] = useState(0)
  const [pb, setPb] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState(null)
  const [esEscritorio, setEsEscritorio] = useState(false)

  useEffect(() => {
    const ver = () => setEsEscritorio(window.innerWidth >= 820)
    ver(); window.addEventListener('resize', ver)
    return () => window.removeEventListener('resize', ver)
  }, [])

  async function cargar() {
    setCargando(true)
    let t = null
    if (torneoId) {
      const { data } = await supabase.from('torneos').select('*').eq('id', torneoId).single()
      t = data
    } else {
      const { data } = await supabase.from('torneos').select('*').order('creado_en', { ascending: false }).limit(1)
      t = (data || [])[0]
    }
    if (!t) { setCargando(false); return }
    setTorneoRow(t)
    const [eq, jg] = await Promise.all([leerEquiposTorneo(t.id), leerJuegosTorneo(t.id)])
    setEquipos(eq); setJuegos(jg); setCargando(false)
  }
  useEffect(() => { cargar() }, [torneoId])

  const eqPorId = {}
  equipos.forEach((e) => { eqPorId[e.id] = e })
  const proximos = juegos.filter((j) => j.estado === 'proximo')
  const finales = juegos.filter((j) => j.estado === 'final')

  const seleccionar = (j) => { setSel(j); setPa(j.puntosA || 0); setPb(j.puntosB || 0); setMsg(null) }

  async function guardar() {
    if (!sel || guardando) return
    setGuardando(true)
    const { error } = await anotarResultado(sel.id, { puntosA: Number(pa) || 0, puntosB: Number(pb) || 0 })
    setGuardando(false)
    if (error) { setMsg({ tipo: 'error', txt: error }); return }
    setSel(null)
    setMsg({ tipo: 'ok', txt: 'Resultado guardado. La tabla se actualizó sola.' })
    await cargar()
    setTimeout(() => setMsg(null), 3500)
  }

  const ANCHO = esEscritorio ? 720 : '100%'

  // ---- panel de marcador (un equipo) ----
  const LadoEquipo = ({ eq, valor, setValor }) => (
    <div style={{ flex: 1, minWidth: 0, background: C.card, border: `1px solid ${C.borde}`, borderRadius: 16, padding: '16px 14px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
        <Badge eq={eq} size={30} />
        <span style={{ fontSize: 14.5, fontWeight: 800, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eq?.nombre || 'Equipo'}</span>
      </div>
      <input
        type="number" inputMode="numeric" value={valor}
        onChange={(e) => setValor(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
        style={{ width: '100%', textAlign: 'center', background: 'rgba(0,0,0,0.25)', border: `1px solid ${C.borde2}`, borderRadius: 12, color: C.txt, fontSize: 42, fontWeight: 900, padding: '6px 0', outline: 'none', fontVariantNumeric: 'tabular-nums' }}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'center' }}>
        {[1, 2, 3].map((n) => (
          <button key={n} onClick={() => setValor((Number(valor) || 0) + n)} style={{ flex: 1, border: `1px solid ${C.borde2}`, background: 'rgba(245,184,46,0.10)', color: C.oro, borderRadius: 10, padding: '9px 0', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>+{n}</button>
        ))}
        <button onClick={() => setValor(Math.max(0, (Number(valor) || 0) - 1))} style={{ width: 42, border: `1px solid ${C.borde2}`, background: 'transparent', color: C.tenue, borderRadius: 10, padding: '9px 0', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>−</button>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: FONT }}>
      {/* HEADER */}
      <div style={{ flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: 'rgba(10,14,26,0.92)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: `1px solid ${C.borde}` }}>
        <div style={{ maxWidth: ANCHO, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px' }}>
          <button onClick={onVolver} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 11, border: `1px solid ${C.borde}`, background: C.card, color: C.txt, fontSize: 19, cursor: 'pointer', flexShrink: 0 }}>‹</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: C.txt }}>Anotar juego</div>
            <div style={{ fontSize: 11.5, color: C.tenue, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{torneoRow?.nombre || ''}</div>
          </div>
        </div>
      </div>

      {/* CUERPO */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: ANCHO, margin: '0 auto', padding: '16px 16px calc(env(safe-area-inset-bottom) + 40px)' }}>

          {msg && (
            <div style={{ fontSize: 12.5, fontWeight: 700, borderRadius: 12, padding: '11px 13px', marginBottom: 14, color: msg.tipo === 'ok' ? C.verde : C.rojo, background: msg.tipo === 'ok' ? 'rgba(22,230,138,0.10)' : 'rgba(255,90,95,0.10)', border: `1px solid ${msg.tipo === 'ok' ? 'rgba(22,230,138,0.3)' : 'rgba(255,90,95,0.3)'}` }}>
              {msg.txt}
            </div>
          )}

          {cargando && <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, padding: '40px 0' }}>Cargando…</div>}
          {!cargando && !torneoRow && <div style={{ textAlign: 'center', color: C.tenue, fontSize: 13, padding: '40px 16px' }}>No se encontró un torneo. Crea uno primero.</div>}

          {/* PANEL DE MARCADOR (juego seleccionado) */}
          {!cargando && sel && (
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: C.tenue, marginBottom: 10 }}>
                {sel.jornada ? `Jornada ${sel.jornada}` : 'Juego'} · marcador final
              </div>
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
                <LadoEquipo eq={eqPorId[sel.equipoA_id]} valor={pa} setValor={setPa} />
                <div style={{ display: 'flex', alignItems: 'center', color: C.tenue2, fontSize: 13, fontWeight: 800 }}>VS</div>
                <LadoEquipo eq={eqPorId[sel.equipoB_id]} valor={pb} setValor={setPb} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => setSel(null)} style={{ flex: '0 0 auto', border: `1px solid ${C.borde2}`, background: 'transparent', color: C.tenue, borderRadius: 13, padding: '14px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={guardar} disabled={guardando} style={{ flex: 1, border: 'none', background: C.verde, color: '#04140C', borderRadius: 13, padding: '14px 0', fontSize: 15, fontWeight: 900, cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? 'Guardando…' : 'Guardar resultado'}
                </button>
              </div>
            </div>
          )}

          {/* LISTA DE JUEGOS (sin seleccionar) */}
          {!cargando && torneoRow && !sel && (
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: C.tenue, marginBottom: 10 }}>
                Por jugar ({proximos.length})
              </div>
              {proximos.length === 0 && <div style={{ fontSize: 12.5, color: C.tenue2, padding: '8px 0 18px' }}>No hay juegos pendientes. Genera el calendario o ya anotaste todo.</div>}
              {proximos.map((j) => {
                const a = eqPorId[j.equipoA_id], b = eqPorId[j.equipoB_id]
                return (
                  <button key={j.id} onClick={() => seleccionar(j)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `1px solid ${C.borde}`, borderRadius: 13, padding: '11px 13px', marginBottom: 8, cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.tenue2, width: 26, flexShrink: 0 }}>{j.jornada ? `J${j.jornada}` : ''}</span>
                    <Badge eq={a} size={30} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a?.nombre || '?'}</span>
                    <span style={{ fontSize: 11, color: C.tenue2, fontWeight: 800 }}>vs</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: C.txt, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b?.nombre || '?'}</span>
                    <Badge eq={b} size={30} />
                    <span style={{ fontSize: 16, color: C.oro, flexShrink: 0 }}>✎</span>
                  </button>
                )
              })}

              {finales.length > 0 && (
                <>
                  <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: C.tenue, margin: '22px 0 10px' }}>
                    Ya jugados ({finales.length})
                  </div>
                  {finales.map((j) => {
                    const a = eqPorId[j.equipoA_id], b = eqPorId[j.equipoB_id]
                    const ganaA = j.puntosA > j.puntosB, ganaB = j.puntosB > j.puntosA
                    return (
                      <button key={j.id} onClick={() => seleccionar(j)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: C.panel, border: `1px solid ${C.borde}`, borderRadius: 13, padding: '10px 13px', marginBottom: 7, cursor: 'pointer', textAlign: 'left', opacity: 0.92 }}>
                        <Badge eq={a} size={26} />
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: ganaA ? 800 : 600, color: ganaA ? C.txt : C.tenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a?.nombre || '?'}</span>
                        <span style={{ fontSize: 15, fontWeight: 900, color: C.txt, fontVariantNumeric: 'tabular-nums' }}>{j.puntosA} - {j.puntosB}</span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: ganaB ? 800 : 600, color: ganaB ? C.txt : C.tenue, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b?.nombre || '?'}</span>
                        <Badge eq={b} size={26} />
                      </button>
                    )
                  })}
                  <div style={{ fontSize: 10.5, color: C.tenue2, textAlign: 'center', marginTop: 8 }}>Toca un juego ya jugado para corregir su marcador.</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}