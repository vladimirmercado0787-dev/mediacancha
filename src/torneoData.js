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
import { generarFixtures } from './torneoFormato'

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
    .select('id, equipo_id, nombre, numero, posicion, es_capitan, es_refuerzo, perfil_id')
    .eq('torneo_id', torneoId)
  return (data || []).map((j) => ({
    jugador_id: j.id,
    equipo_id: j.equipo_id,
    nombre: j.nombre || 'Jugador',
    numero: j.numero ?? null,
    posicion: j.posicion || null,
    esCapitan: !!j.es_capitan,
    esRefuerzo: !!j.es_refuerzo,
    perfilId: j.perfil_id || null, // código único que lo vincula a su cuenta de Media Cancha
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
    fecha: null,
    estado: 'proximo',
    equipo_a: f.equipoA_id,
    equipo_b: f.equipoB_id,
    puntos_a: 0,
    puntos_b: 0,
    parciales_a: [],
    parciales_b: [],
  }))
  const { data, error } = await supabase.from('torneo_juegos').insert(filas).select()
  return { fixtures: data || [], error: error?.message || null }
}