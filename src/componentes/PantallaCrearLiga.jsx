import { useState, useEffect, useRef } from 'react'
import { aviso } from './Avisos'
import { crearLiga } from '../ligas'
import { buscarPersonas } from '../torneos'
import { subirFoto } from '../fotos'
import { MUNICIPIOS_RD } from '../data/municipiosRD'
import { ESTADOS_USA } from '../data/estadosUSA'

// Catálogo de divisiones por país (igual que crear torneo):
// RD = provincias/municipios, USA = estados/ciudades.
const PAISES = {
  rd: { nombre: 'República Dominicana', datos: MUNICIPIOS_RD, etiquetaRegion: 'Provincia', etiquetaCiudad: 'Municipio' },
  usa: { nombre: 'Estados Unidos', datos: ESTADOS_USA, etiquetaRegion: 'Estado', etiquetaCiudad: 'Ciudad' },
}
function regionesDe(paisLlave) {
  const pais = PAISES[paisLlave]
  if (!pais) return []
  return Object.keys(pais.datos)
    .map((k) => ({ llave: k, nombre: pais.datos[k].provincia }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
}
function ciudadesDe(paisLlave, llaveRegion) {
  const pais = PAISES[paisLlave]
  if (!pais || !llaveRegion || !pais.datos[llaveRegion]) return []
  return [...pais.datos[llaveRegion].municipios].sort((a, b) => a.nombre.localeCompare(b.nombre))
}

// ============================================================
//  CREAR LIGA — Media Cancha
//  Cuatro pasos, identidad turquesa de las ligas de comunidad.
//  1) Identidad: nombre, emoji, ubicación, género (rama).
//  2) Comité: presidente, vice y tesorero — buscando cuentas registradas.
//  3) Días que juega (libres). El modo y las estadísticas se eligen por juego.
//  4) Resumen y crear.
//  El logo se sube DESPUÉS, en la configuración de la liga.
// ============================================================

const C = {
  fondo: '#04161a',
  panel: 'rgba(8,30,33,0.93)',
  tarjeta: 'rgba(12,38,40,0.7)',
  teal: '#27d3c2',
  tealBtn: 'linear-gradient(150deg, #36e3d2, #0e9c90)',
  texto: '#eaf6f5',
  texto2: '#cfe7e4',
  tenue: '#8aacaa',
  muyTenue: '#5f817e',
  borde: 'rgba(39,211,194,0.24)',
  bordeSuave: 'rgba(255,255,255,0.08)',
  input: 'rgba(255,255,255,0.05)',
}
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const EMOJIS = ['🤝', '🏀', '🔥', '⭐', '👑', '⚡', '🏆', '🎯', '💪', '🌴']

const RAMAS = [
  { id: 'masculino', nombre: 'Masculino', emoji: '♂' },
  { id: 'femenino', nombre: 'Femenino', emoji: '♀' },
  { id: 'mixto', nombre: 'Mixto', emoji: '⚥' },
]

const DIAS = [
  { id: 'lun', nombre: 'Lun' },
  { id: 'mar', nombre: 'Mar' },
  { id: 'mie', nombre: 'Mié' },
  { id: 'jue', nombre: 'Jue' },
  { id: 'vie', nombre: 'Vie' },
  { id: 'sab', nombre: 'Sáb' },
  { id: 'dom', nombre: 'Dom' },
]

// --------- Buscador de una persona registrada (para los cargos del comité) ---------
function BuscadorPersona({ C, label, seleccionado, onElegir, onQuitar, inputStyle, labelStyle }) {
  const [buscar, setBuscar] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    let vivo = true
    const t = buscar.trim()
    if (t.length < 2) { setResultados([]); setBuscando(false); return }
    setBuscando(true)
    const id = setTimeout(() => {
      buscarPersonas(t)
        .then(({ personas }) => { if (vivo) setResultados(personas || []) })
        .catch(() => { if (vivo) setResultados([]) })
        .finally(() => { if (vivo) setBuscando(false) })
    }, 300)
    return () => { vivo = false; clearTimeout(id) }
  }, [buscar])

  const nombreCompleto = (p) => `${p.nombre || ''} ${p.apellido || ''}`.trim()

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={labelStyle}>{label}</label>

      {seleccionado ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: `${C.teal}14`, border: `1px solid ${C.borde}`, borderRadius: 12, padding: '11px 13px' }}>
          <span style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: seleccionado.foto_url ? `url(${seleccionado.foto_url}) center/cover` : C.tealBtn }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: C.texto, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreCompleto(seleccionado)}</div>
            <div style={{ color: C.tenue, fontSize: 11 }}>Cuenta Media Cancha{seleccionado.codigo_unico ? ` · ${seleccionado.codigo_unico}` : ''}</div>
          </div>
          <button onClick={onQuitar} style={{ border: 'none', background: 'transparent', color: C.muyTenue, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>✕</button>
        </div>
      ) : (
        <>
          <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Escribe el nombre o el código…" style={inputStyle} />
          {buscando && <div style={{ color: C.muyTenue, fontSize: 11.5, marginTop: 6 }}>Buscando…</div>}
          {resultados.length > 0 && (
            <div style={{ background: C.input, border: `1px solid ${C.bordeSuave}`, borderRadius: 12, overflow: 'hidden', marginTop: 8 }}>
              {resultados.map((p) => (
                <button key={p.id} onClick={() => { onElegir(p); setBuscar(''); setResultados([]) }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '10px 12px', cursor: 'pointer', borderBottom: `0.5px solid ${C.bordeSuave}` }}>
                  <span style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: p.foto_url ? `url(${p.foto_url}) center/cover` : C.tealBtn }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.texto, fontSize: 13, fontWeight: 600 }}>{nombreCompleto(p)}</div>
                    <div style={{ color: C.muyTenue, fontSize: 11 }}>{p.codigo_unico || ''}{p.municipio ? ` · ${p.municipio}` : ''}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {buscar.trim().length >= 2 && !buscando && resultados.length === 0 && (
            <div style={{ color: C.muyTenue, fontSize: 11.5, marginTop: 6 }}>No se encontró ninguna cuenta con ese nombre o código.</div>
          )}
        </>
      )}
    </div>
  )
}

export default function PantallaCrearLiga({ onVolver, onCreada }) {
  const [paso, setPaso] = useState(1)
  const TOTAL = 4

  const [nombre, setNombre] = useState('')
  const [emoji, setEmoji] = useState('🤝')
  const [logoUrl, setLogoUrl] = useState(null)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const inputLogoRef = useRef(null)
  const [pais, setPais] = useState('rd')
  const [provincia, setProvincia] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [paraje, setParaje] = useState('')
  const [rama, setRama] = useState('masculino')

  const [pres, setPres] = useState(null)
  const [vice, setVice] = useState(null)
  const [teso, setTeso] = useState(null)

  const [dias, setDias] = useState([])

  const [guardando, setGuardando] = useState(false)

  // -------- helpers de selección múltiple --------
  const toggleDia = (id) => setDias((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]))
  const todosLosDias = () => setDias(DIAS.map((d) => d.id))
  const limpiarDias = () => setDias([])

  const puedeAvanzar = () => {
    if (paso === 1) return nombre.trim().length >= 2
    if (paso === 3) return dias.length >= 1
    return true
  }

  const avanzar = () => { if (puedeAvanzar() && paso < TOTAL) setPaso(paso + 1) }
  const retroceder = () => { if (paso > 1) setPaso(paso - 1); else onVolver && onVolver() }

  const alElegirLogo = async (e) => {
    const archivo = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!archivo) return
    setSubiendoLogo(true)
    try {
      const { url, error } = await subirFoto(archivo, 'ligas', { maxLado: 800, calidad: 0.9 })
      if (error || !url) aviso('No se pudo subir el logo: ' + (error || 'intenta de nuevo'))
      else setLogoUrl(url)
    } catch (err) {
      aviso('Error al subir el logo: ' + (err.message || err))
    }
    setSubiendoLogo(false)
  }

  const finalizar = async () => {
    if (guardando) return
    setGuardando(true)
    try {
      const { liga, error } = await crearLiga({
        nombre: nombre.trim(),
        emoji,
        logo_url: logoUrl,
        lugar: lugar || null,
        pais,
        region: nombreProvincia || null,
        ciudad: municipio || null,
        paraje: paraje.trim() || null,
        rama,
        dias,
        comite: {
          presidente: pres ? `${pres.nombre || ''} ${pres.apellido || ''}`.trim() : null,
          presidente_id: pres?.id || null,
          vicepresidente: vice ? `${vice.nombre || ''} ${vice.apellido || ''}`.trim() : null,
          vicepresidente_id: vice?.id || null,
          tesorero: teso ? `${teso.nombre || ''} ${teso.apellido || ''}`.trim() : null,
          tesorero_id: teso?.id || null,
        },
      })
      if (error) {
        aviso('No se pudo crear la liga: ' + error)
        setGuardando(false)
        return
      }
      onCreada && onCreada(liga)
    } catch (e) {
      aviso('Error: ' + (e.message || e))
      setGuardando(false)
    }
  }

  const inputStyle = { width: '100%', boxSizing: 'border-box', background: C.input, border: `1px solid ${C.bordeSuave}`, borderRadius: 12, padding: '13px 14px', color: C.texto, fontSize: 15, outline: 'none', fontFamily: 'inherit' }
  const label = { color: C.tenue, fontSize: 12.5, fontWeight: 700, marginBottom: 8, display: 'block' }
  const seccion = { color: C.texto, fontSize: 20, fontWeight: 800, marginBottom: 6 }
  const subtitulo = { color: C.tenue, fontSize: 13, marginBottom: 22, lineHeight: 1.5 }

  // chip genérico
  const Chip = ({ activo, children, onClick }) => (
    <button onClick={onClick} style={{ border: activo ? `1.5px solid ${C.teal}` : `1px solid ${C.bordeSuave}`, background: activo ? `${C.teal}1f` : C.input, color: activo ? C.teal : C.texto2, fontSize: 13, fontWeight: activo ? 800 : 600, padding: '9px 14px', borderRadius: 20, cursor: 'pointer' }}>{children}</button>
  )

  const ramaNombre = (RAMAS.find((r) => r.id === rama) || {}).nombre
  const paisActual = PAISES[pais] || PAISES.rd
  const regionLista = regionesDe(pais)
  const muniLista = ciudadesDe(pais, provincia)
  const nombreProvincia = paisActual.datos[provincia]?.provincia || ''
  const optionBg = '#0a2024'
  const lugar = [paraje.trim(), municipio, nombreProvincia].filter(Boolean).join(', ')
  const diasNombre = dias.length === 0 ? '—' : (dias.length === 7 ? 'Todos los días' : DIAS.filter((d) => dias.includes(d.id)).map((d) => d.nombre).join(', '))

  return (
    <div style={{ fontFamily: FONT, color: C.texto2, background: C.fondo, position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 36% at 50% 0%, rgba(39,211,194,0.16), transparent 72%)' }} />

      {/* HEADER con progreso */}
      <div style={{ position: 'relative', zIndex: 3, flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: C.panel, borderBottom: `0.5px solid ${C.borde}`, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px' }}>
          <button onClick={retroceder} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,.06)', color: C.texto, fontSize: 22, cursor: 'pointer' }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: C.texto, fontSize: 15.5, fontWeight: 800 }}>Crear liga</div>
            <div style={{ color: C.teal, fontSize: 11, fontWeight: 700 }}>Paso {paso} de {TOTAL}</div>
          </div>
          <div style={{ width: 40, flexShrink: 0 }} />
        </div>
        <div style={{ height: 3, background: C.bordeSuave }}>
          <div style={{ width: `${(paso / TOTAL) * 100}%`, height: '100%', background: C.tealBtn, transition: 'width .3s' }} />
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px 34px' }}>

          {/* ---------- PASO 1: IDENTIDAD ---------- */}
          {paso === 1 && (
            <>
              <div style={seccion}>¿Cómo se llama tu liga?</div>
              <div style={subtitulo}>El nombre con que la gente la reconoce en el barrio.</div>

              <label style={label}>Nombre de la liga</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Liga Jícome" style={{ ...inputStyle, marginBottom: 20 }} />

              <label style={label}>Logo de la liga (opcional)</label>
              {logoUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 84, height: 84, borderRadius: 18, flexShrink: 0, background: `url(${logoUrl}) center/cover`, border: `2px solid ${C.teal}`, opacity: subiendoLogo ? 0.5 : 1 }} />
                  <div style={{ flex: 1 }}>
                    <button onClick={() => inputLogoRef.current && inputLogoRef.current.click()} style={{ border: `1px solid ${C.borde}`, borderRadius: 11, padding: '9px 16px', background: 'transparent', color: C.teal, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cambiar</button>
                    <button onClick={() => setLogoUrl(null)} style={{ border: 'none', borderRadius: 11, padding: '9px 12px', background: 'transparent', color: C.muyTenue, fontSize: 13, cursor: 'pointer', marginLeft: 4 }}>Quitar</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                  <div onClick={() => !subiendoLogo && inputLogoRef.current && inputLogoRef.current.click()} style={{ width: 72, height: 72, borderRadius: 16, flexShrink: 0, cursor: 'pointer', background: C.input, border: `1.5px dashed ${C.borde}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: C.tenue, opacity: subiendoLogo ? 0.5 : 1 }}>{subiendoLogo ? '…' : '📷'}</div>
                  <div style={{ flex: 1 }}>
                    <button onClick={() => inputLogoRef.current && inputLogoRef.current.click()} disabled={subiendoLogo} style={{ border: `1px solid ${C.borde}`, borderRadius: 11, padding: '10px 16px', background: 'transparent', color: C.teal, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{subiendoLogo ? 'Subiendo…' : 'Subir logo'}</button>
                    <div style={{ color: C.muyTenue, fontSize: 11.5, marginTop: 6 }}>Sube el logo de la liga, o usa un emoji abajo.</div>
                  </div>
                </div>
              )}
              <input ref={inputLogoRef} type="file" accept="image/*" onChange={alElegirLogo} style={{ display: 'none' }} />

              <label style={label}>{logoUrl ? 'O usa un emoji' : 'Elige un emoji'}</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, opacity: logoUrl ? 0.5 : 1 }}>
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setEmoji(e)} style={{ width: 46, height: 46, borderRadius: 12, border: emoji === e ? `2px solid ${C.teal}` : `1px solid ${C.bordeSuave}`, background: emoji === e ? `${C.teal}1f` : C.input, fontSize: 22, cursor: 'pointer' }}>{e}</button>
                ))}
              </div>
              <div style={{ color: C.muyTenue, fontSize: 11.5, marginBottom: 20, lineHeight: 1.5 }}>El logo también lo puedes cambiar después en la configuración de la liga.</div>

              <label style={label}>Ubicación de la liga (opcional)</label>
              <select value={pais} onChange={(e) => { setPais(e.target.value); setProvincia(''); setMunicipio('') }} style={{ ...inputStyle, marginBottom: 10 }}>
                <option value="rd" style={{ background: optionBg }}>🇩🇴 República Dominicana</option>
                <option value="usa" style={{ background: optionBg }}>🇺🇸 Estados Unidos</option>
              </select>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <select value={provincia} onChange={(e) => { setProvincia(e.target.value); setMunicipio('') }} style={{ ...inputStyle, flex: 1, minWidth: 0 }}>
                  <option value="" style={{ background: optionBg }}>{paisActual.etiquetaRegion}…</option>
                  {regionLista.map((r) => (
                    <option key={r.llave} value={r.llave} style={{ background: optionBg }}>{r.nombre}</option>
                  ))}
                </select>
                <select value={municipio} onChange={(e) => setMunicipio(e.target.value)} disabled={!provincia} style={{ ...inputStyle, flex: 1, minWidth: 0, opacity: provincia ? 1 : 0.5 }}>
                  <option value="" style={{ background: optionBg }}>{provincia ? `${paisActual.etiquetaCiudad}…` : `Elige ${paisActual.etiquetaRegion.toLowerCase()}`}</option>
                  {muniLista.map((m) => (
                    <option key={m.nombre} value={m.nombre} style={{ background: optionBg }}>{m.nombre}</option>
                  ))}
                </select>
              </div>
              <input value={paraje} onChange={(e) => setParaje(e.target.value)} placeholder={pais === 'rd' ? 'Paraje, sector o barrio (opcional)' : 'Neighborhood or area (optional)'} style={{ ...inputStyle, marginBottom: 20 }} />
              {lugar && <div style={{ color: C.teal, fontSize: 12, fontWeight: 600, marginBottom: 20, marginTop: -8 }}>📍 {lugar}</div>}

              <label style={label}>Género de la liga</label>
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                {RAMAS.map((r) => (
                  <button key={r.id} onClick={() => setRama(r.id)} style={{ flex: 1, minWidth: 95, border: rama === r.id ? `1.5px solid ${C.teal}` : `1px solid ${C.bordeSuave}`, background: rama === r.id ? `${C.teal}1f` : C.input, color: rama === r.id ? C.teal : C.texto2, fontSize: 13.5, fontWeight: rama === r.id ? 800 : 600, padding: '13px 10px', borderRadius: 14, cursor: 'pointer' }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{r.emoji}</div>{r.nombre}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ---------- PASO 2: COMITÉ ---------- */}
          {paso === 2 && (
            <>
              <div style={seccion}>El comité de la liga</div>
              <div style={subtitulo}>Búscalos por su nombre o su código. Deben tener cuenta en Media Cancha. No tienes que ser tú.</div>

              <BuscadorPersona C={C} label="Presidente" seleccionado={pres} onElegir={setPres} onQuitar={() => setPres(null)} inputStyle={inputStyle} labelStyle={label} />
              <BuscadorPersona C={C} label="Vicepresidente (opcional)" seleccionado={vice} onElegir={setVice} onQuitar={() => setVice(null)} inputStyle={inputStyle} labelStyle={label} />
              <BuscadorPersona C={C} label="Tesorero (opcional)" seleccionado={teso} onElegir={setTeso} onQuitar={() => setTeso(null)} inputStyle={inputStyle} labelStyle={label} />

              <div style={{ background: `${C.teal}10`, border: `0.5px solid ${C.borde}`, borderRadius: 13, padding: 14, color: C.texto2, fontSize: 12.5, lineHeight: 1.5, marginTop: 6 }}>
                💡 Solo aparecen personas ya registradas. Si alguien aún no tiene cuenta, lo puedes agregar después. Puedes dejar el comité vacío y completarlo más adelante.
              </div>
            </>
          )}

          {/* ---------- PASO 3: DÍAS ---------- */}
          {paso === 3 && (
            <>
              <div style={seccion}>¿Qué días juega?</div>
              <div style={subtitulo}>Los días son libres: una diaria, fines de semana, o los días que ustedes quieran.</div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ ...label, marginBottom: 0 }}>Días que juega</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={todosLosDias} style={{ border: 'none', background: 'transparent', color: C.teal, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Todos</button>
                  <button onClick={limpiarDias} style={{ border: 'none', background: 'transparent', color: C.muyTenue, fontSize: 12, cursor: 'pointer' }}>Limpiar</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 24 }}>
                {DIAS.map((d) => (
                  <Chip key={d.id} activo={dias.includes(d.id)} onClick={() => toggleDia(d.id)}>{d.nombre}</Chip>
                ))}
              </div>

              <div style={{ background: `${C.teal}10`, border: `0.5px solid ${C.borde}`, borderRadius: 13, padding: 15, color: C.texto2, fontSize: 12.5, lineHeight: 1.6 }}>
                🏀 Esta liga puede jugar <strong style={{ color: C.texto }}>cualquier modo</strong> — fogueo, juego rápido, normal, uno contra uno, tres contra tres, cinco contra cinco. El modo y las estadísticas se eligen <strong style={{ color: C.texto }}>cuando empiezas cada juego</strong>, y ahí mismo se pueden editar. No quedan fijos aquí.
              </div>
            </>
          )}

          {/* ---------- PASO 4: RESUMEN ---------- */}
          {paso === 4 && (
            <>
              <div style={seccion}>Todo listo</div>
              <div style={subtitulo}>Revisa antes de crear. Después puedes editar todo en la configuración.</div>

              <div style={{ background: C.tarjeta, border: `0.5px solid ${C.borde}`, borderRadius: 18, padding: 18, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
                  <div style={{ width: 54, height: 54, borderRadius: 14, background: logoUrl ? `url(${logoUrl}) center/cover` : 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', fontSize: 28 }}>{!logoUrl && emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.texto, fontSize: 17, fontWeight: 800 }}>{nombre || 'Sin nombre'}</div>
                    {lugar && <div style={{ color: C.tenue, fontSize: 12.5, marginTop: 2 }}>📍 {lugar}</div>}
                  </div>
                </div>
                {[
                  { l: 'Género', v: ramaNombre },
                  { l: 'Presidente', v: pres ? `${pres.nombre || ''} ${pres.apellido || ''}`.trim() : 'Sin asignar' },
                  { l: 'Días', v: diasNombre },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '8px 0', fontSize: 13.5, borderTop: i === 0 ? 'none' : `0.5px solid ${C.bordeSuave}` }}>
                    <span style={{ color: C.tenue, flexShrink: 0 }}>{r.l}</span>
                    <span style={{ color: C.texto, fontWeight: 600, textAlign: 'right' }}>{r.v}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: `${C.teal}10`, border: `0.5px solid ${C.borde}`, borderRadius: 13, padding: 14, color: C.texto2, fontSize: 12.5, lineHeight: 1.5 }}>
                💡 Tú quedas como <span style={{ color: C.teal, fontWeight: 700 }}>dueño</span> de la liga (la administras). El presidente puede ser otra persona. El logo, los miembros y los juegos los agregas después.
              </div>
            </>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ position: 'relative', zIndex: 3, flexShrink: 0, borderTop: `0.5px solid ${C.borde}`, background: C.panel, padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
        {paso < TOTAL ? (
          <button onClick={avanzar} disabled={!puedeAvanzar()} style={{ width: '100%', border: 'none', borderRadius: 14, padding: 15, background: puedeAvanzar() ? C.tealBtn : 'rgba(255,255,255,.08)', color: puedeAvanzar() ? '#04161a' : C.tenue, fontSize: 15, fontWeight: 800, cursor: puedeAvanzar() ? 'pointer' : 'default' }}>Siguiente →</button>
        ) : (
          <button onClick={finalizar} disabled={guardando} style={{ width: '100%', border: 'none', borderRadius: 14, padding: 15, background: C.tealBtn, color: '#04161a', fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: guardando ? 0.6 : 1 }}>{guardando ? 'Creando…' : '🤝 Crear liga'}</button>
        )}
      </div>
    </div>
  )
}