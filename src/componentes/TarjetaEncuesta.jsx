// ============================================================================
//  TARJETA DE ENCUESTA — la estrella del show. 📊
//  Antes de votar: opciones tocables con su circulito.
//  Después de votar: BARRAS ANIMADAS con porcentajes que se mueven EN VIVO
//  cuando cualquier persona vota (Realtime). Se puede cambiar el voto tocando
//  otra opción. Respeta el tema activo (dorado/azul/claro/larimar).
//  Se usa igual en el Techado, el chat privado y los grupos.
// ============================================================================
import { useEffect, useState, useRef } from 'react'
import { resultadosEncuesta, votarEncuesta, suscribirVotos } from '../encuestas'
import { aviso } from './Avisos'

const TEMAS = {
  dorado:  { panel: 'rgba(16,19,24,.97)', borde: 'rgba(202,162,74,.4)',  texto: '#f4f7f9', tenue: '#9aa1ad', acento: '#caa24a', acentoTexto: '#15120a', pista: 'rgba(255,255,255,.07)', barraOtra: 'rgba(202,162,74,.22)' },
  azul:    { panel: 'rgba(13,18,28,.97)', borde: 'rgba(96,156,224,.4)',  texto: '#f4f7f9', tenue: '#9aa1ad', acento: '#609ce0', acentoTexto: '#0a1220', pista: 'rgba(255,255,255,.07)', barraOtra: 'rgba(96,156,224,.22)' },
  claro:   { panel: '#ffffff',            borde: '#e3e6ea',              texto: '#15181d', tenue: '#5b6270', acento: '#c8842e', acentoTexto: '#fff8ec', pista: '#f0f2f5',               barraOtra: 'rgba(200,132,46,.18)' },
  larimar: { panel: 'rgba(12,22,26,.97)', borde: 'rgba(94,200,216,.4)',  texto: '#f4f7f9', tenue: '#9aa1ad', acento: '#5ec8d8', acentoTexto: '#062026', pista: 'rgba(255,255,255,.07)', barraOtra: 'rgba(94,200,216,.22)' },
}

export default function TarjetaEncuesta({ encuestaId, pregunta, opciones, temaForzado = null }) {
  let tema = temaForzado
  if (!tema) { try { tema = localStorage.getItem('mc_tema') || 'dorado' } catch (e) { tema = 'dorado' } }
  const C = TEMAS[tema] || TEMAS.dorado

  const ops = Array.isArray(opciones) ? opciones : []
  const [conteos, setConteos] = useState(ops.map(() => 0))
  const [total, setTotal] = useState(0)
  const [miVoto, setMiVoto] = useState(null)
  const [cargado, setCargado] = useState(false)
  const votandoRef = useRef(false)

  const refrescar = async () => {
    if (!encuestaId) return
    const r = await resultadosEncuesta(encuestaId, ops.length)
    if (!r.error) { setConteos(r.conteos); setTotal(r.total); setMiVoto(r.miVoto) }
    setCargado(true)
  }

  useEffect(() => {
    refrescar()
    if (!encuestaId) return
    const soltar = suscribirVotos(encuestaId, refrescar)
    return soltar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encuestaId])

  const votar = async (i) => {
    if (votandoRef.current || miVoto === i || !encuestaId) return
    votandoRef.current = true
    // Optimista: la barra se mueve al instante, sin esperar al servidor.
    const previo = { conteos: [...conteos], total, miVoto }
    const nuevos = [...conteos]
    if (miVoto == null) { nuevos[i] = (nuevos[i] || 0) + 1; setTotal(total + 1) }
    else { nuevos[miVoto] = Math.max(0, (nuevos[miVoto] || 0) - 1); nuevos[i] = (nuevos[i] || 0) + 1 }
    setConteos(nuevos)
    setMiVoto(i)
    const r = await votarEncuesta(encuestaId, i)
    if (r.error) {
      setConteos(previo.conteos); setTotal(previo.total); setMiVoto(previo.miVoto)
      aviso('No se pudo registrar tu voto: ' + r.error)
    }
    votandoRef.current = false
  }

  const haVotado = miVoto != null
  const totalSeguro = Math.max(total, 1)

  return (
    <div style={{ background: C.panel, border: `1.5px solid ${C.borde}`, borderRadius: 16, padding: '14px 14px 12px', minWidth: 0 }}>
      {/* Chip + pregunta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0.8, color: C.acentoTexto, background: C.acento, borderRadius: 6, padding: '3px 8px' }}>📊 ENCUESTA</span>
      </div>
      <div style={{ color: C.texto, fontWeight: 800, fontSize: 15, lineHeight: 1.35, marginBottom: 12, wordBreak: 'break-word' }}>
        {pregunta}
      </div>

      {/* Opciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ops.map((op, i) => {
          const n = conteos[i] || 0
          const pct = haVotado ? Math.round((n / totalSeguro) * 100) : 0
          const elegida = miVoto === i
          return (
            <button
              key={i}
              onClick={() => votar(i)}
              style={{
                position: 'relative', overflow: 'hidden', textAlign: 'left',
                border: `1.5px solid ${elegida ? C.acento : C.borde}`,
                borderRadius: 11, background: C.pista, cursor: 'pointer',
                padding: 0, minHeight: 42, fontFamily: 'inherit', width: '100%',
              }}
            >
              {/* La barra que crece */}
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                width: cargado ? `${pct}%` : 0,
                background: elegida ? C.acento : C.barraOtra,
                transition: 'width .65s cubic-bezier(.22,1,.36,1)',
              }} />
              {/* El contenido encima de la barra */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                {!haVotado && (
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${C.tenue}`, flexShrink: 0 }} />
                )}
                <span style={{
                  flex: 1, fontSize: 13.5, fontWeight: elegida ? 900 : 600, minWidth: 0,
                  color: elegida ? C.acentoTexto : C.texto, wordBreak: 'break-word',
                }}>
                  {op}{elegida ? '  ✓' : ''}
                </span>
                {haVotado && (
                  <span style={{ fontSize: 13, fontWeight: 900, flexShrink: 0, color: elegida ? C.acentoTexto : C.tenue }}>
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Pie */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: C.tenue }}>
          {total} {total === 1 ? 'voto' : 'votos'}{haVotado ? ' · en vivo 🟢' : ''}
        </span>
        <span style={{ fontSize: 10.5, color: C.tenue }}>
          {haVotado ? 'Toca otra opción para cambiar tu voto' : 'Toca una opción para votar'}
        </span>
      </div>
    </div>
  )
}
