import { supabase } from './supabaseClient'
import { sincronizarGrupoLigaSiExiste } from './grupos'

// ============================================================================
//  HELPER DE LIGAS — Media Cancha
//  Crear, leer y administrar ligas de la comunidad.
//  Habla con la tabla: ligas
// ============================================================================

// Mi id de usuario
export async function miUsuarioId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id || null
}

// ---------- CREAR LIGA ----------
// datos: { nombre, emoji, logo_url, rama, lugar, dias, modos,
//          estadisticas, comite, descripcion }
// El creador queda como dueño (presidente) de la liga.
export async function crearLiga(datos) {
  const uid = await miUsuarioId()
  if (!uid) return { error: 'No hay sesión activa' }

  const { data: liga, error } = await supabase
    .from('ligas')
    .insert({
      creador_id: uid,
      nombre: datos.nombre,
      emoji: datos.emoji || '🤝',
      logo_url: datos.logo_url || null,
      rama: datos.rama || 'masculino',
      lugar: datos.lugar || null,
      pais: datos.pais || null,
      region: datos.region || null,
      ciudad: datos.ciudad || null,
      paraje: datos.paraje || null,
      dias: datos.dias || [],
      modos: datos.modos || [],
      estadisticas: datos.estadisticas || { pts: true, reb: true, ast: true },
      comite: datos.comite || {},
      descripcion: datos.descripcion || null,
      estado: 'activa',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // El creador queda como miembro (admin) de su propia liga.
  // No es fatal si falla (ej. si aún no corriste el SQL de miembros).
  try {
    await supabase
      .from('liga_miembros')
      .upsert({ liga_id: liga.id, perfil_id: uid, rol: 'admin', agregado_por: uid }, { onConflict: 'liga_id,perfil_id', ignoreDuplicates: true })
  } catch (e) { /* ignorar */ }

  return { liga, error: null }
}

// ---------- MIS LIGAS ----------
// Las ligas que YO creé (las más nuevas primero).
export async function misLigas() {
  const uid = await miUsuarioId()
  if (!uid) return { ligas: [], error: null }
  const { data, error } = await supabase
    .from('ligas')
    .select('*')
    .eq('creador_id', uid)
    .order('creado_en', { ascending: false })
  return { ligas: data || [], error: error?.message || null }
}

// ---------- TODAS LAS LIGAS ----------
export async function leerLigas() {
  const { data, error } = await supabase
    .from('ligas')
    .select('*')
    .order('creado_en', { ascending: false })
  return { ligas: data || [], error: error?.message || null }
}

// ---------- LEER UNA LIGA ----------
export async function leerLiga(id) {
  if (!id) return { liga: null, error: null }
  const { data, error } = await supabase
    .from('ligas')
    .select('*')
    .eq('id', id)
    .single()
  return { liga: data || null, error: error?.message || null }
}

// ---------- CAMBIAR ESTADO ----------
export async function cambiarEstadoLiga(ligaId, estado) {
  const { error } = await supabase.from('ligas').update({ estado }).eq('id', ligaId)
  return { error: error?.message || null }
}

// ============================================================================
//  JUEGOS DE LIGA — guardar y leer
// ============================================================================

// Resume un juego terminado: totales, ganador y jugador destacado.
function resumirJuegoLiga(res) {
  const jugadores = res?.jugadores || []
  const totalEq = (eq) => jugadores.filter((j) => j.equipo === eq).reduce((a, j) => a + (j.pts || 0), 0)
  const totalA = totalEq(0)
  const totalB = totalEq(1)
  const empate = totalA === totalB
  const ganadorEq = empate ? null : (totalA > totalB ? 0 : 1)
  const nombreGanador = ganadorEq === null ? null : (ganadorEq === 0 ? res.nombreA : res.nombreB)
  let dest = null
  jugadores.forEach((j) => {
    if (!dest) { dest = j; return }
    const mejor = (j.pts || 0) > (dest.pts || 0) ||
      ((j.pts || 0) === (dest.pts || 0) && (j.reb || 0) > (dest.reb || 0)) ||
      ((j.pts || 0) === (dest.pts || 0) && (j.reb || 0) === (dest.reb || 0) && (j.ast || 0) > (dest.ast || 0))
    if (mejor) dest = j
  })
  return { totalA, totalB, nombreGanador, dest }
}

// ---------- GUARDAR JUEGO DE LIGA ----------
// ligaId: uuid de la liga; modo: 'fogueo'|'rapido'|'normal'|'1v1'|'3v3'|'5v5'
// res: el objeto que devuelve PantallaJuegoVivo al terminar (config + jugadores)
export async function guardarJuegoLiga(ligaId, modo, res) {
  const uid = await miUsuarioId()
  if (!uid) return { error: 'No hay sesión activa' }
  const r = resumirJuegoLiga(res)
  const { data: juego, error } = await supabase
    .from('liga_juegos')
    .insert({
      liga_id: ligaId,
      creador_id: uid,
      modo: modo || 'normal',
      nombre_a: res.nombreA || 'Equipo A',
      nombre_b: res.nombreB || 'Equipo B',
      puntos_a: r.totalA,
      puntos_b: r.totalB,
      ganador: r.nombreGanador,
      destacado_nombre: r.dest ? (r.dest.nombre || ('#' + (r.dest.numero || ''))) : null,
      destacado_pts: r.dest ? (r.dest.pts || 0) : 0,
      destacado_reb: r.dest ? (r.dest.reb || 0) : 0,
      destacado_ast: r.dest ? (r.dest.ast || 0) : 0,
      datos: { jugadores: res.jugadores || [], modoAnotacion: res.modoAnotacion, statsActivas: res.statsActivas },
    })
    .select()
    .single()
  if (error) return { error: error.message }
  return { juego, error: null }
}

// ---------- LEER JUEGOS DE UNA LIGA ----------
export async function leerJuegosLiga(ligaId) {
  if (!ligaId) return { juegos: [], error: null }
  const { data, error } = await supabase
    .from('liga_juegos')
    .select('*')
    .eq('liga_id', ligaId)
    .order('creado_en', { ascending: false })
  return { juegos: data || [], error: error?.message || null }
}

// ============================================================================
//  MIEMBROS DE LIGA — agregar, leer, quitar
// ============================================================================

// ---------- LEER MIEMBROS (con su perfil) ----------
export async function leerMiembrosLiga(ligaId) {
  if (!ligaId) return { miembros: [], error: null }
  const { data, error } = await supabase
    .from('liga_miembros')
    .select('id, rol, creado_en, perfil_id, perfil:perfiles(id, nombre, apellido, foto_url, codigo_unico, municipio)')
    .eq('liga_id', ligaId)
    .order('creado_en', { ascending: true })
  return { miembros: data || [], error: error?.message || null }
}

// ---------- AGREGAR MIEMBRO ----------
export async function agregarMiembroLiga(ligaId, perfilId, rol = 'miembro') {
  const uid = await miUsuarioId()
  if (!uid) return { error: 'No hay sesión activa' }
  if (!ligaId || !perfilId) return { error: 'Faltan datos' }
  const { error } = await supabase
    .from('liga_miembros')
    .upsert({ liga_id: ligaId, perfil_id: perfilId, rol, agregado_por: uid }, { onConflict: 'liga_id,perfil_id', ignoreDuplicates: true })
  if (!error) { try { await sincronizarGrupoLigaSiExiste(ligaId) } catch (e) {} }
  return { error: error?.message || null }
}

// ---------- QUITAR MIEMBRO ----------
export async function quitarMiembroLiga(ligaId, perfilId) {
  if (!ligaId || !perfilId) return { error: 'Faltan datos' }
  const { error } = await supabase
    .from('liga_miembros')
    .delete()
    .eq('liga_id', ligaId)
    .eq('perfil_id', perfilId)
  if (!error) { try { await sincronizarGrupoLigaSiExiste(ligaId) } catch (e) {} }
  return { error: error?.message || null }
}

// ============================================================================
//  INVITACIONES DE LIGA — igual que los torneos (pendiente → aceptar/rechazar)
// ============================================================================

// ---------- INVITAR (deja la invitación PENDIENTE; NO agrega de una) ----------
export async function invitarMiembroLiga(ligaId, perfilId, rol = 'miembro', mensaje = null) {
  const uid = await miUsuarioId()
  if (!uid) return { error: 'No hay sesión activa' }
  if (!ligaId || !perfilId) return { error: 'Faltan datos' }
  const { error } = await supabase
    .from('liga_invitaciones')
    .upsert(
      { liga_id: ligaId, invitado_id: perfilId, invitador_id: uid, rol, mensaje, estado: 'pendiente' },
      { onConflict: 'liga_id,invitado_id' }
    )
  return { error: error?.message || null }
}

// ---------- MIS INVITACIONES PENDIENTES (las que me llegaron) ----------
export async function misInvitacionesLiga() {
  const uid = await miUsuarioId()
  if (!uid) return { invitaciones: [], error: 'No hay sesión' }
  const { data, error } = await supabase
    .from('liga_invitaciones')
    .select('*, ligas(nombre, emoji, logo_url, lugar)')
    .eq('invitado_id', uid)
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: false })
  return { invitaciones: data || [], error: error?.message || null }
}

// ---------- INVITACIONES ENVIADAS DE UNA LIGA (pendientes) ----------
export async function leerInvitacionesLiga(ligaId) {
  if (!ligaId) return { invitaciones: [], error: null }
  const { data, error } = await supabase
    .from('liga_invitaciones')
    .select('id, estado, creado_en, invitado_id, perfil:perfiles(id, nombre, apellido, foto_url, codigo_unico)')
    .eq('liga_id', ligaId)
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: false })
  return { invitaciones: data || [], error: error?.message || null }
}

// ---------- RESPONDER UNA INVITACIÓN: aceptar o rechazar ----------
export async function responderInvitacionLiga(invitacionId, aceptar) {
  const nuevoEstado = aceptar ? 'aceptada' : 'rechazada'
  const { data: inv, error } = await supabase
    .from('liga_invitaciones')
    .update({ estado: nuevoEstado })
    .eq('id', invitacionId)
    .select()
    .single()
  if (error) return { error: error.message }
  // Si aceptó, ahora SÍ se agrega como miembro
  if (aceptar && inv) {
    await agregarMiembroLiga(inv.liga_id, inv.invitado_id, inv.rol || 'miembro')
  }
  return { invitacion: inv, error: null }
}

// ---------- CONFIRMAR EN PERSONA CON EL PIN DEL JUGADOR ----------
// La persona escribe SU código secreto de 4 dígitos en el teléfono de quien
// la invita, y queda confirmada al instante (igual que en los torneos).
export async function confirmarMiembroLigaConCodigo(ligaId, perfilId, pin) {
  const cod = String(pin || '').trim()
  if (!ligaId || !perfilId) return { ok: false, error: 'Faltan datos' }
  if (!/^[0-9]{4}$/.test(cod)) return { ok: false, error: 'El código es de cuatro dígitos' }
  const { data, error } = await supabase.rpc('confirmar_miembro_liga_con_codigo', {
    p_liga_id: ligaId, p_perfil_id: perfilId, p_pin: cod,
  })
  if (error) return { ok: false, error: error.message }
  if (data !== true) return { ok: false, error: 'Código incorrecto' }
  return { ok: true, error: null }
}
// ============================================================================
//  CAJA DE LA LIGA — saldo, movimientos y cuotas de los miembros
//  Tabla: liga_caja  ·  tipo: 'ingreso' | 'egreso'  ·  categoria: cuota,
//  inscripcion, arbitros, equipo, otro. Para cobrar la cuota de un miembro
//  se guarda miembro_id + miembro_nombre.
// ============================================================================

export async function leerCajaLiga(ligaId) {
  if (!ligaId) return { caja: [], error: null }
  const { data, error } = await supabase
    .from('liga_caja')
    .select('*')
    .eq('liga_id', ligaId)
    .order('creado_en', { ascending: false })
  return { caja: data || [], error: error?.message || null }
}

export async function agregarMovimientoLiga(ligaId, datos) {
  const uid = await miUsuarioId()
  if (!ligaId) return { movimiento: null, error: 'Falta la liga' }
  const { data, error } = await supabase
    .from('liga_caja')
    .insert({
      liga_id: ligaId,
      tipo: datos.tipo === 'egreso' ? 'egreso' : 'ingreso',
      categoria: datos.categoria || null,
      concepto: datos.concepto || null,
      monto: Number(datos.monto) || 0,
      miembro_id: datos.miembro_id || null,
      miembro_nombre: datos.miembro_nombre || null,
      registrado_por: uid || null,
    })
    .select()
    .single()
  return { movimiento: data || null, error: error?.message || null }
}

export async function eliminarMovimientoLiga(id) {
  if (!id) return { error: 'Falta el id' }
  const { error } = await supabase.from('liga_caja').delete().eq('id', id)
  return { error: error?.message || null }
}