import { supabase } from './supabaseClient'
import { sincronizarGrupoTorneoSiExiste } from './grupos'

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

// ---------- CONFIGURACIÓN DEL TORNEO ----------
//  Guarda las reglas por defecto del torneo (cuartos, minutos, faltas, bonus,
//  modo de anotar, estadísticas). Cada vez que se anota un juego, estas reglas
//  son el punto de partida, así no hay que configurarlas una y otra vez.
export async function guardarReglasTorneo(torneoId, reglas) {
  if (!torneoId) return { error: 'Falta el torneo.' }
  const { error } = await supabase.from('torneos').update({ reglas }).eq('id', torneoId)
  return { error: error?.message || null }
}

//  Cambia el estado del torneo (activo / finalizado). NO borra absolutamente
//  nada: los juegos, los marcadores y las estadísticas se quedan guardados.
//  Terminar y reactivar es solo prender o apagar un interruptor.
export async function cambiarEstadoTorneo(torneoId, estado) {
  if (!torneoId) return { error: 'Falta el torneo.' }
  const { error } = await supabase.from('torneos').update({ estado }).eq('id', torneoId)
  return { error: error?.message || null }
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
      await sincronizarGrupoTorneoSiExiste(inv.torneo_id)
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
    .select('id, nombre, apellido, apodo, codigo_unico, foto_url, municipio')
    .or(`nombre.ilike.%${t}%,apellido.ilike.%${t}%,apodo.ilike.%${t}%,codigo_unico.ilike.%${t}%`)
    .limit(12)
  return { personas: data || [], error: error?.message || null }
}
// ============================================================================
//  SEGUIR TORNEOS — guardado de verdad (arregla el botón que no se quedaba)
// ============================================================================

// ¿Sigo este torneo?
export async function sigoTorneo(torneoId) {
  const yo = await miUsuarioId()
  if (!yo || !torneoId) return false
  const { data, error } = await supabase
    .from('torneo_seguidores')
    .select('id')
    .eq('torneo_id', torneoId)
    .eq('seguidor_id', yo)
    .maybeSingle()
  if (error) return false
  return !!data
}

// Cuántos siguen este torneo
export async function contarSeguidoresTorneo(torneoId) {
  if (!torneoId) return 0
  const { count, error } = await supabase
    .from('torneo_seguidores')
    .select('id', { count: 'exact', head: true })
    .eq('torneo_id', torneoId)
  if (error) return 0
  return count || 0
}

// Alterna seguir / dejar de seguir. Devuelve { siguiendo: true/false }.
export async function alternarSeguirTorneo(torneoId) {
  const yo = await miUsuarioId()
  if (!yo) return { error: 'Inicia sesión para seguir' }
  if (!torneoId) return { error: 'Falta el torneo' }
  const yaSigo = await sigoTorneo(torneoId)
  if (yaSigo) {
    const { error } = await supabase
      .from('torneo_seguidores')
      .delete()
      .eq('torneo_id', torneoId)
      .eq('seguidor_id', yo)
    if (error) return { error: error.message }
    return { siguiendo: false }
  } else {
    const { error } = await supabase
      .from('torneo_seguidores')
      .insert({ torneo_id: torneoId, seguidor_id: yo })
    if (error && !String(error.message || '').includes('duplicate')) return { error: error.message }
    return { siguiendo: true }
  }
}

// Torneos que sigo (lista), para la pantalla "Siguiendo".
export async function torneosQueSigo() {
  const yo = await miUsuarioId()
  if (!yo) return { torneos: [], error: 'No hay sesión' }
  const { data: rel, error } = await supabase
    .from('torneo_seguidores')
    .select('torneo_id, creado_en')
    .eq('seguidor_id', yo)
    .order('creado_en', { ascending: false })
  if (error) return { torneos: [], error: error.message }
  const ids = (rel || []).map((r) => r.torneo_id).filter(Boolean)
  if (!ids.length) return { torneos: [], error: null }
  const { data: torneos } = await supabase
    .from('torneos')
    .select('id, nombre, emoji, logo_url, lugar, estado')
    .in('id', ids)
  return { torneos: torneos || [], error: null }
}
// ============================================================================
//  ÁRBITROS DEL TORNEO — roster de árbitros (nombre, teléfono, tarifa por juego)
//  Tabla: torneo_arbitros. El pago se registra en la Caja (categoría árbitros).
// ============================================================================
export async function leerArbitros(torneoId) {
  if (!torneoId) return { arbitros: [], error: null }
  const { data, error } = await supabase
    .from('torneo_arbitros')
    .select('*')
    .eq('torneo_id', torneoId)
    .order('creado_en', { ascending: true })
  return { arbitros: data || [], error: error?.message || null }
}

export async function agregarArbitro(torneoId, datos) {
  if (!torneoId || !datos?.nombre) return { arbitro: null, error: 'Falta el nombre del árbitro' }
  const { data, error } = await supabase
    .from('torneo_arbitros')
    .insert({
      torneo_id: torneoId,
      nombre: datos.nombre.trim(),
      telefono: datos.telefono ? String(datos.telefono).trim() : null,
      tarifa: Number(datos.tarifa) || 0,
    })
    .select()
    .single()
  return { arbitro: data || null, error: error?.message || null }
}

export async function eliminarArbitro(id) {
  if (!id) return { error: 'Falta el id' }
  const { error } = await supabase.from('torneo_arbitros').delete().eq('id', id)
  return { error: error?.message || null }
}

// ============================================================================
//  ÁLBUM DEL TORNEO — fotos y videos que sube la comunidad.
//  Tabla: torneo_album. Archivos en Storage (bucket "fotos", carpeta albumes/).
// ============================================================================
export async function leerAlbumTorneo(torneoId) {
  if (!torneoId) return { items: [], error: null }
  const { data, error } = await supabase
    .from('torneo_album')
    .select('*, autor:perfiles(id, nombre, apellido, foto_url)')
    .eq('torneo_id', torneoId)
    .order('creado_en', { ascending: false })
  return { items: data || [], error: error?.message || null }
}

export async function agregarItemAlbum(torneoId, autorId, item) {
  if (!torneoId || !item?.url) return { item: null, error: 'Falta el archivo' }
  const { data, error } = await supabase
    .from('torneo_album')
    .insert({ torneo_id: torneoId, autor_id: autorId || null, tipo: item.tipo || 'foto', url: item.url, ruta: item.ruta || null })
    .select()
    .single()
  return { item: data || null, error: error?.message || null }
}

export async function eliminarItemAlbum(id) {
  if (!id) return { error: 'Falta el id' }
  const { error } = await supabase.from('torneo_album').delete().eq('id', id)
  return { error: error?.message || null }
}