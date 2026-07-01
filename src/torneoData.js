// ============================================================
//  torneoData.js
//  PUENTE entre Supabase y los motores del torneo.
//  Lee los equipos, juegos y estadística de un torneo, los
//  normaliza a las formas que esperan torneoEstadisticas.js y
//  torneoMomentos.js, y devuelve TODO ya calculado para la
//  pantalla pública (tabla, líderes, Top 10, MVP, momentos).
// ============================================================
import { supabase } from './supabaseClient'
import { calcularTabla, agregarJugadores, rankingTorneo, top10, candidatosMVP, lideres } from './torneoEstadisticas'
import { generarMomentos } from './torneoMomentos'
import { generarFixtures, siguienteRondaCopa, nombreRonda } from './torneoFormato'

// ---------- LECTURAS CRUDAS (ya mapeadas a las formas de los motores) ----------

export async function leerEquiposTorneo(torneoId) {
  const { data } = await supabase
    .from('torneo_equipos')
    .select('*')
    .eq('torneo_id', torneoId)
  return (data || []).map((e) => ({
    id: e.id,
    nombre: e.nombre || 'Equipo',
    codigo: e.codigo || (e.nombre || '').slice(0, 3).toUpperCase(),
    color: e.color || '#e8b65a',
    escudo: e.logo_url || e.escudo_url || null, // por si más adelante se agrega (T-007)
  }))
}

export async function leerJuegosTorneo(torneoId) {
  const { data } = await supabase
    .from('torneo_juegos')
    .select('*')
    .eq('torneo_id', torneoId)
    .order('jornada', { ascending: true })
    .order('fecha', { ascending: true })
  return (data || []).map((j) => ({
    id: j.id,
    jornada: j.jornada,
    fecha: j.fecha,
    estado: j.estado,
    llave_pos: j.llave_pos,
    equipoA_id: j.equipo_a,
    equipoB_id: j.equipo_b,
    puntosA: j.puntos_a,
    puntosB: j.puntos_b,
    parcialesA: j.parciales_a || [],
    parcialesB: j.parciales_b || [],
  }))
}

export async function leerStatsTorneo(torneoId) {
  const { data } = await supabase
    .from('torneo_juego_jugadores')
    .select('*')
    .eq('torneo_id', torneoId)
  return (data || []).map((s) => ({
    juego_id: s.juego_id,
    jornada: s.jornada,
    jugador_id: s.jugador_id,
    equipo_id: s.equipo_id,
    nombre: s.nombre,
    numero: s.numero,
    puntos: s.puntos, rebotes: s.rebotes, asistencias: s.asistencias,
    robos: s.robos, tapones: s.tapones, perdidas: s.perdidas,
    tcInt: s.tc_int, tcAnot: s.tc_anot,
    tpInt: s.tp_int, tpAnot: s.tp_anot,
    tlInt: s.tl_int, tlAnot: s.tl_anot,
  }))
}

// Roster completo del torneo (todos los jugadores inscritos, jueguen o no)
export async function leerRosterTorneo(torneoId) {
  const { data } = await supabase
    .from('torneo_jugadores')
    .select('id, equipo_id, nombre, numero, posicion, es_capitan, es_refuerzo, perfil_id, estado')
    .eq('torneo_id', torneoId)
  const filas = data || []

  // Traer la foto de perfil de cada jugador que tenga cuenta vinculada (una sola consulta)
  const ids = [...new Set(filas.map((j) => j.perfil_id).filter(Boolean))]
  const fotos = {}
  if (ids.length) {
    const { data: perfiles } = await supabase
      .from('perfiles')
      .select('id, foto_url')
      .in('id', ids)
    ;(perfiles || []).forEach((p) => { fotos[p.id] = p.foto_url || null })
  }

  return filas.map((j) => ({
    jugador_id: j.id,
    equipo_id: j.equipo_id,
    nombre: j.nombre || 'Jugador',
    numero: j.numero ?? null,
    posicion: j.posicion || null,
    esCapitan: !!j.es_capitan,
    esRefuerzo: !!j.es_refuerzo,
    estado: j.estado || 'confirmado',
    perfilId: j.perfil_id || null, // código único que lo vincula a su cuenta de Media Cancha
    foto: j.perfil_id ? (fotos[j.perfil_id] || null) : null, // foto de perfil (por ahora; luego será la foto de jugador)
  }))
}

// ---------- TODO JUNTO (lo que la pantalla pública necesita) ----------
//  Devuelve { equipos, juegos, tabla, roster, jugadores, lideres, top10, candidatosMVP, momentos }.
//  - jugadores: lista RANKEADA con promedios + rating de cada jugador con estadística.
//  - roster: todos los jugadores inscritos (para mostrar la plantilla completa).
export async function cargarTorneoPublico(torneoId, config = null) {
  const [equipos, juegos, stats, roster] = await Promise.all([
    leerEquiposTorneo(torneoId),
    leerJuegosTorneo(torneoId),
    leerStatsTorneo(torneoId),
    leerRosterTorneo(torneoId),
  ])
  const jugadoresAgg = agregarJugadores(stats)
  const tabla = calcularTabla(equipos, juegos)
  return {
    equipos,
    juegos,
    tabla,
    roster,
    estadisticas: stats,
    jugadores: rankingTorneo(jugadoresAgg, tabla),
    lideres: lideres(jugadoresAgg, 5, config),
    top10: top10(jugadoresAgg, tabla),
    candidatosMVP: candidatosMVP(jugadoresAgg, tabla),
    momentos: generarMomentos(juegos, equipos, stats),
  }
}

// ---------- ESCRITURA (para cuando el anotador guarde juegos) ----------
//  Helper opcional: guardar un juego final con su marcador.
export async function guardarJuego(torneoId, datos) {
  const { data, error } = await supabase
    .from('torneo_juegos')
    .insert({
      torneo_id: torneoId,
      jornada: datos.jornada ?? null,
      fecha: datos.fecha ?? new Date().toISOString(),
      estado: datos.estado || 'final',
      equipo_a: datos.equipoA_id,
      equipo_b: datos.equipoB_id,
      puntos_a: datos.puntosA ?? 0,
      puntos_b: datos.puntosB ?? 0,
      parciales_a: datos.parcialesA || [],
      parciales_b: datos.parcialesB || [],
    })
    .select()
    .single()
  return { juego: data, error: error?.message || null }
}

// ---------- ANOTAR: cerrar un partido EXISTENTE con su marcador ----------
//  El calendario ya creó el juego como 'proximo'. Esto lo pasa a 'final' con su marcador.
export async function anotarResultado(juegoId, datos) {
  const { data, error } = await supabase
    .from('torneo_juegos')
    .update({
      estado: 'final',
      puntos_a: datos.puntosA ?? 0,
      puntos_b: datos.puntosB ?? 0,
      parciales_a: datos.parcialesA || [],
      parciales_b: datos.parcialesB || [],
      fecha: datos.fecha || new Date().toISOString(),
    })
    .eq('id', juegoId)
    .select()
    .single()
  return { juego: data, error: error?.message || null }
}

// ---------- MARCADOR EN VIVO ----------
//  Mientras se anota un juego del torneo, escribe el marcador actual y lo deja
//  en estado 'vivo' para que la pantalla pública lo muestre en "En vivo ahora".
//  Solo toca el marcador y el estado; NO cierra el juego (eso lo hace guardarAnotacionTorneo).
export async function marcarJuegoVivo(juegoId, puntosA, puntosB) {
  if (!juegoId) return { error: 'Falta el juego.' }
  const { error } = await supabase
    .from('torneo_juegos')
    .update({ estado: 'vivo', puntos_a: puntosA ?? 0, puntos_b: puntosB ?? 0 })
    .eq('id', juegoId)
    .neq('estado', 'final')
  return { error: error?.message || null }
}
//  Recibe el 'res' que entrega el anotador (PantallaJuegoVivo) al terminar y lo
//  guarda DONDE VA: cierra el partido del calendario con su marcador y guarda las
//  estadísticas de cada jugador. ctx lleva la info del partido del torneo.
//  ctx = { juegoId, torneoId, jornada, equipoA_id, equipoB_id }
//  Cada jugador en res.jugadores trae: equipo (0|1), nombre, numero, pts, reb, ast,
//  rob, tap, per, y jugadorId (el id real del roster, inyectado al cargar el juego).
export async function guardarAnotacionTorneo(ctx, res) {
  if (!ctx || !ctx.juegoId) return { error: 'Falta el juego que se va a anotar.' }
  const jugadores = (res && res.jugadores) || []
  const puntosA = jugadores.filter((j) => j.equipo === 0).reduce((s, j) => s + (j.pts || 0), 0)
  const puntosB = jugadores.filter((j) => j.equipo === 1).reduce((s, j) => s + (j.pts || 0), 0)

  // 1) cerrar el partido del calendario con su marcador (proximo/vivo -> final)
  const { error: e1 } = await anotarResultado(ctx.juegoId, {
    puntosA, puntosB,
    parcialesA: res.parcialesA || [],
    parcialesB: res.parcialesB || [],
  })
  if (e1) return { error: e1 }

  // 2) guardar las estadísticas por jugador (borra las viejas por si se re-anota)
  await supabase.from('torneo_juego_jugadores').delete().eq('juego_id', ctx.juegoId)
  const filas = jugadores
    .filter((j) => ((j.pts || 0) + (j.reb || 0) + (j.ast || 0) + (j.rob || 0) + (j.tap || 0) + (j.per || 0)) > 0)
    .map((j) => ({
      torneo_id: ctx.torneoId,
      juego_id: ctx.juegoId,
      jornada: ctx.jornada ?? null,
      jugador_id: j.jugadorId || null,
      equipo_id: j.equipo === 0 ? ctx.equipoA_id : ctx.equipoB_id,
      nombre: j.nombre || 'Jugador',
      numero: j.numero ?? null,
      puntos: j.pts || 0, rebotes: j.reb || 0, asistencias: j.ast || 0,
      robos: j.rob || 0, tapones: j.tap || 0, perdidas: j.per || 0,
      tc_int: j.tcInt || 0, tc_anot: j.tcAnot || 0,
      tp_int: j.tpInt || 0, tp_anot: j.tpAnot || 0,
      tl_int: j.tlInt || 0, tl_anot: j.tlAnot || 0,
    }))
  if (filas.length) {
    const { error: e2 } = await supabase.from('torneo_juego_jugadores').insert(filas)
    if (e2) return { error: e2 }
  }
  return { error: null }
}

// ---------- CALENDARIO: generar los partidos (fixtures) de un torneo ----------
//  Toma los equipos del torneo + su formato y crea los partidos "próximos".
//  opciones.vueltas: cuántas veces se enfrenta cada par (liga). 1=sencilla, 2=ida y vuelta, 3=triple...
//  opciones.reemplazar: si es true, borra los partidos NO jugados antes de crear los nuevos.
//  NUNCA toca partidos ya jugados ('final') ni en vivo: solo borra los 'proximo'.
export async function generarCalendario(torneoId, equipos = [], formato = 'liga', opciones = {}) {
  const ids = (equipos || []).map((e) => e.id).filter(Boolean)
  if (ids.length < 2) return { fixtures: [], error: 'Se necesitan al menos dos equipos para generar el calendario.' }
  if (opciones.reemplazar) {
    const { error: errDel } = await supabase
      .from('torneo_juegos')
      .delete()
      .eq('torneo_id', torneoId)
      .eq('estado', 'proximo')
    if (errDel) return { fixtures: [], error: 'No se pudieron borrar los partidos anteriores: ' + errDel.message }
  }
  const fixtures = generarFixtures(ids, formato, opciones)
  if (!fixtures.length) return { fixtures: [], error: 'No se pudo generar el calendario.' }
  const filas = fixtures.map((f) => ({
    torneo_id: torneoId,
    jornada: f.jornada ?? null,
    llave_pos: f.llave_pos != null ? f.llave_pos : null,
    fecha: null,
    estado: f.bye ? 'final' : 'proximo',
    equipo_a: f.equipoA_id,
    equipo_b: f.equipoB_id != null ? f.equipoB_id : null,
    puntos_a: f.bye ? 1 : 0,
    puntos_b: 0,
    parciales_a: [],
    parciales_b: [],
  }))
  const { data, error } = await supabase.from('torneo_juegos').insert(filas).select()
  return { fixtures: data || [], error: error?.message || null }
}

// ----------------------------------------------------------------------------
//  AVANZAR LA LLAVE DE COPA
//  Si la ronda actual está completa, crea la siguiente ronda con los ganadores
//  en su posición correcta del árbol. Si solo queda un ganador, es el campeón.
//  Devuelve { generada, ronda, campeonNombre, faltan, pendientes, error }
// ----------------------------------------------------------------------------
export async function avanzarRondaCopa(torneoId) {
  if (!torneoId) return { error: 'Falta el torneo' }
  const { data: juegos, error } = await supabase
    .from('torneo_juegos')
    .select('id, jornada, llave_pos, estado, equipo_a, equipo_b, puntos_a, puntos_b')
    .eq('torneo_id', torneoId)
  if (error) return { error: error.message }
  if (!juegos || !juegos.length) return { error: 'Esta copa no tiene partidos generados todavía.' }

  const maxJornada = juegos.reduce((m, j) => Math.max(m, Number(j.jornada) || 0), 0)
  const ronda = juegos.filter((j) => (Number(j.jornada) || 0) === maxJornada)

  const pendientes = ronda.filter((j) => j.estado !== 'final')
  if (pendientes.length) return { faltan: true, pendientes: pendientes.length, error: null }

  const { fixtures, campeonId } = siguienteRondaCopa(ronda, maxJornada)

  const nombreEquipo = async (id) => {
    if (!id) return null
    const { data } = await supabase.from('torneo_equipos').select('nombre').eq('id', id).maybeSingle()
    return data?.nombre || null
  }

  if (campeonId) {
    const nombre = await nombreEquipo(campeonId)
    try { await supabase.from('torneos').update({ estado: 'finalizado', fase: 'Campeón' }).eq('id', torneoId) } catch (e) {}
    return { campeonId, campeonNombre: nombre, generada: false, error: null }
  }

  if (!fixtures.length) return { error: 'No se pudo calcular la siguiente ronda.' }

  const filas = fixtures.map((f) => ({
    torneo_id: torneoId,
    jornada: f.jornada,
    llave_pos: f.llave_pos,
    fecha: null,
    estado: 'proximo',
    equipo_a: f.equipoA_id,
    equipo_b: f.equipoB_id,
    puntos_a: 0,
    puntos_b: 0,
    parciales_a: [],
    parciales_b: [],
  }))
  const { error: errIns } = await supabase.from('torneo_juegos').insert(filas)
  if (errIns) return { error: errIns.message }

  const nuevaRonda = nombreRonda(fixtures.length * 2)
  try { await supabase.from('torneos').update({ fase: nuevaRonda }).eq('id', torneoId) } catch (e) {}
  return { generada: true, ronda: nuevaRonda, error: null }
}