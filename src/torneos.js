import { supabase } from './supabaseClient'

// ============================================================================
//  HELPER DE TORNEOS — Media Cancha
//  Funciones para crear, leer y administrar torneos.
//  Habla con las tablas: torneos, torneo_equipos, torneo_jugadores,
//  torneo_directiva, torneo_invitaciones.
// ============================================================================

// Mi id de usuario
export async function miUsuarioId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id || null
}

// ---------- CREAR TORNEO ----------
// datos: { nombre, emoji, lugar, descripcion, formato, cantidad_equipos,
//          estadisticas, inscripcion, costo_inscripcion }
// Crea el torneo Y mete al creador como presidente de la directiva.
export async function crearTorneo(datos) {
  const uid = await miUsuarioId()
  if (!uid) return { error: 'No hay sesión activa' }

  // 1) crear el torneo (queda en estado 'borrador')
  const { data: torneo, error } = await supabase
    .from('torneos')
    .insert({
      creador_id: uid,
      nombre: datos.nombre,
      emoji: datos.emoji || '🏆',
      logo_url: datos.logo_url || null,
      nivel: datos.nivel || 'libre',
      categoria: datos.categoria || 'superior',
      rama: datos.rama || 'masculino',
      lugar: datos.lugar || null,
      descripcion: datos.descripcion || null,
      formato: datos.formato || 'copa',
      cantidad_equipos: datos.cantidad_equipos || 8,
      estadisticas: datos.estadisticas || { pts: true, reb: true, ast: true },
      inscripcion: datos.inscripcion || 'invitacion',
      costo_inscripcion: datos.costo_inscripcion || 0,
      estado: 'borrador',
      fase: 'Inscripción',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // 2) meter al creador como presidente (confirmado, porque es él mismo)
  try {
    const { data: perfil } = await supabase.from('perfiles').select('nombre, apellido').eq('id', uid).single()
    const nombre = perfil ? `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim() : 'Presidente'
    await supabase.from('torneo_directiva').insert({
      torneo_id: torneo.id, perfil_id: uid, nombre, rol: 'presidente', estado: 'confirmado',
    })
  } catch (e) {}

  return { torneo, error: null }
}

// ---------- LEER TORNEOS ----------
// Lista todos los torneos (los más nuevos primero).
export async function leerTorneos() {
  const { data, error } = await supabase
    .from('torneos')
    .select('*')
    .order('creado_en', { ascending: false })
  return { torneos: data || [], error: error?.message || null }
}

// Mis torneos (los que yo creé).
export async function misTorneos() {
  const uid = await miUsuarioId()
  if (!uid) return { torneos: [], error: 'No hay sesión' }
  const { data, error } = await supabase
    .from('torneos')
    .select('*')
    .eq('creador_id', uid)
    .order('creado_en', { ascending: false })
  return { torneos: data || [], error: error?.message || null }
}

// Un torneo con TODO: equipos, jugadores, directiva.
export async function leerTorneoCompleto(torneoId) {
  const [t, equipos, jugadores, directiva] = await Promise.all([
    supabase.from('torneos').select('*').eq('id', torneoId).single(),
    supabase.from('torneo_equipos').select('*').eq('torneo_id', torneoId).order('puntos', { ascending: false }),
    supabase.from('torneo_jugadores').select('*').eq('torneo_id', torneoId),
    supabase.from('torneo_directiva').select('*').eq('torneo_id', torneoId),
  ])
  if (t.error) return { error: t.error.message }
  return {
    torneo: t.data,
    equipos: equipos.data || [],
    jugadores: jugadores.data || [],
    directiva: directiva.data || [],
    error: null,
  }
}

// ---------- EQUIPOS ----------
export async function crearEquipo(torneoId, datos) {
  const { data, error } = await supabase
    .from('torneo_equipos')
    .insert({
      torneo_id: torneoId,
      nombre: datos.nombre,
      codigo: datos.codigo || (datos.nombre || '').slice(0, 3).toUpperCase(),
      color: datos.color || '#e8b65a',
      zona: datos.zona || null,
      capitan_id: datos.capitan_id || null,
      dt_nombre: datos.dt_nombre || null,
    })
    .select()
    .single()
  return { equipo: data, error: error?.message || null }
}

// ---------- JUGADORES ----------
// Agrega un jugador a un equipo (queda 'pendiente' hasta que confirme).
export async function agregarJugador(torneoId, equipoId, datos) {
  const { data, error } = await supabase
    .from('torneo_jugadores')
    .insert({
      torneo_id: torneoId,
      equipo_id: equipoId,
      perfil_id: datos.perfil_id || null,
      nombre: datos.nombre,
      numero: datos.numero || null,
      posicion: datos.posicion || null,
      es_capitan: datos.es_capitan || false,
      es_refuerzo: datos.es_refuerzo || false,
      estado: datos.estado || 'pendiente',
    })
    .select()
    .single()
  return { jugador: data, error: error?.message || null }
}

// ---------- INVITACIONES ----------
// Envía una invitación (a un capitán, jugador o miembro de directiva).
export async function invitar(torneoId, datos) {
  const uid = await miUsuarioId()
  const { data, error } = await supabase
    .from('torneo_invitaciones')
    .insert({
      torneo_id: torneoId,
      invitado_id: datos.invitado_id,
      invitador_id: uid,
      tipo: datos.tipo,           // 'capitan' | 'jugador' | 'directiva'
      equipo_id: datos.equipo_id || null,
      rol: datos.rol || null,
      mensaje: datos.mensaje || null,
      estado: 'pendiente',
    })
    .select()
    .single()
  return { invitacion: data, error: error?.message || null }
}

// Mis invitaciones pendientes (las que me llegaron).
export async function misInvitaciones() {
  const uid = await miUsuarioId()
  if (!uid) return { invitaciones: [], error: 'No hay sesión' }
  const { data, error } = await supabase
    .from('torneo_invitaciones')
    .select('*, torneos(nombre, emoji), torneo_equipos(nombre)')
    .eq('invitado_id', uid)
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: false })
  return { invitaciones: data || [], error: error?.message || null }
}

// Responder una invitación: acepta ('aceptada') o rechaza ('rechazada').
// Si acepta, confirma al jugador/directivo correspondiente.
export async function responderInvitacion(invitacionId, aceptar) {
  const nuevoEstado = aceptar ? 'aceptada' : 'rechazada'
  const { data: inv, error } = await supabase
    .from('torneo_invitaciones')
    .update({ estado: nuevoEstado })
    .eq('id', invitacionId)
    .select()
    .single()
  if (error) return { error: error.message }

  // Si aceptó, confirmar en la tabla que corresponda
  if (aceptar && inv) {
    try {
      if (inv.tipo === 'jugador' || inv.tipo === 'capitan') {
        await supabase.from('torneo_jugadores')
          .update({ estado: 'confirmado' })
          .eq('torneo_id', inv.torneo_id)
          .eq('perfil_id', inv.invitado_id)
      } else if (inv.tipo === 'directiva') {
        await supabase.from('torneo_directiva')
          .update({ estado: 'confirmado' })
          .eq('torneo_id', inv.torneo_id)
          .eq('perfil_id', inv.invitado_id)
      }
    } catch (e) {}
  }
  return { invitacion: inv, error: null }
}

// ---------- DIRECTIVA ----------
export async function agregarDirectiva(torneoId, datos) {
  const { data, error } = await supabase
    .from('torneo_directiva')
    .insert({
      torneo_id: torneoId,
      perfil_id: datos.perfil_id || null,
      nombre: datos.nombre,
      rol: datos.rol || 'vocal',
      estado: datos.estado || 'pendiente',
    })
    .select()
    .single()
  return { miembro: data, error: error?.message || null }
}

// Lee la directiva del torneo, con la foto de cada miembro (si tiene cuenta).
export async function leerDirectiva(torneoId) {
  const { data, error } = await supabase
    .from('torneo_directiva')
    .select('*')
    .eq('torneo_id', torneoId)
  if (error) return { directiva: [], error: error.message }
  const filas = data || []
  const ids = [...new Set(filas.map((d) => d.perfil_id).filter(Boolean))]
  const fotos = {}
  if (ids.length) {
    const { data: perfiles } = await supabase.from('perfiles').select('id, foto_url').in('id', ids)
    ;(perfiles || []).forEach((p) => { fotos[p.id] = p.foto_url || null })
  }
  return { directiva: filas.map((d) => ({ ...d, foto: d.perfil_id ? (fotos[d.perfil_id] || null) : null })), error: null }
}

// Da o quita el permiso de administrar a un miembro de la directiva.
export async function cambiarPermiso(miembroId, puede) {
  const { error } = await supabase
    .from('torneo_directiva')
    .update({ puede_administrar: !!puede })
    .eq('id', miembroId)
  return { error: error?.message || null }
}

// ---------- BITÁCORA (historial) ----------
// Deja una huella de una acción importante. La base sella sola quién la hizo.
export async function registrarBitacora(torneoId, datos) {
  const { error } = await supabase
    .from('torneo_bitacora')
    .insert({
      torneo_id: torneoId,
      actor_nombre: datos.actor_nombre || null,
      accion: datos.accion,
      detalle: datos.detalle || null,
      objeto_tipo: datos.objeto_tipo || null,
      objeto_id: datos.objeto_id || null,
    })
  return { error: error?.message || null }
}

// Lee el historial del torneo (lo más nuevo primero).
export async function leerBitacora(torneoId, limite = 20) {
  const { data, error } = await supabase
    .from('torneo_bitacora')
    .select('*')
    .eq('torneo_id', torneoId)
    .order('creado_en', { ascending: false })
    .limit(limite)
  return { bitacora: data || [], error: error?.message || null }
}

// ---------- CAJA (ingresos y gastos del torneo) ----------
// Lee todos los movimientos del torneo (lo más nuevo primero).
export async function leerCaja(torneoId) {
  const { data, error } = await supabase
    .from('torneo_caja')
    .select('*')
    .eq('torneo_id', torneoId)
    .order('creado_en', { ascending: false })
  return { caja: data || [], error: error?.message || null }
}

// Registra un movimiento (ingreso o gasto). La base sella solo quién fue.
export async function agregarMovimiento(torneoId, datos) {
  const { data, error } = await supabase
    .from('torneo_caja')
    .insert({
      torneo_id: torneoId,
      tipo: datos.tipo,
      categoria: datos.categoria || null,
      concepto: datos.concepto,
      monto: datos.monto,
      registrado_nombre: datos.registrado_nombre || null,
    })
    .select()
    .single()
  return { movimiento: data, error: error?.message || null }
}

// Borra un movimiento (para corregir un error).
export async function eliminarMovimiento(id) {
  const { error } = await supabase.from('torneo_caja').delete().eq('id', id)
  return { error: error?.message || null }
}

// ---------- BUSCAR PERSONAS (para invitar) ----------
// Busca perfiles por nombre/apellido/código. Reusa el patrón del juego rápido.
export async function buscarPersonas(termino) {
  const t = (termino || '').trim()
  if (t.length < 2) return { personas: [], error: null }
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, apellido, codigo_unico, foto_url, municipio')
    .or(`nombre.ilike.%${t}%,apellido.ilike.%${t}%,codigo_unico.ilike.%${t}%`)
    .limit(12)
  return { personas: data || [], error: error?.message || null }
}