import { supabase } from './supabaseClient'

// Devuelve el id del usuario actual (o null si no hay sesión)
export async function miUsuarioId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id || null
}

// ¿Sigo a esta persona? -> true / false
export async function sigoA(seguidoId) {
  const yo = await miUsuarioId()
  if (!yo || !seguidoId) return false
  const { data, error } = await supabase
    .from('seguidores')
    .select('id')
    .eq('seguidor_id', yo)
    .eq('seguido_id', seguidoId)
    .maybeSingle()
  if (error) return false
  return !!data
}

// Seguir a una persona
export async function seguir(seguidoId) {
  const yo = await miUsuarioId()
  if (!yo) return { error: 'Inicia sesión para seguir' }
  if (yo === seguidoId) return { error: 'No puedes seguirte a ti mismo' }
  const { error } = await supabase
    .from('seguidores')
    .insert({ seguidor_id: yo, seguido_id: seguidoId })
  // si ya lo seguía (unique), no es un error real
  if (error && !String(error.message || '').includes('duplicate')) return { error: error.message }
  return { ok: true }
}

// Dejar de seguir
export async function dejarDeSeguir(seguidoId) {
  const yo = await miUsuarioId()
  if (!yo) return { error: 'Inicia sesión' }
  const { error } = await supabase
    .from('seguidores')
    .delete()
    .eq('seguidor_id', yo)
    .eq('seguido_id', seguidoId)
  if (error) return { error: error.message }
  return { ok: true }
}

// Alterna seguir/dejar de seguir. Devuelve el nuevo estado: { siguiendo: true/false }
export async function alternarSeguir(seguidoId) {
  const yaSigo = await sigoA(seguidoId)
  if (yaSigo) {
    const r = await dejarDeSeguir(seguidoId)
    return r.error ? { error: r.error } : { siguiendo: false }
  } else {
    const r = await seguir(seguidoId)
    return r.error ? { error: r.error } : { siguiendo: true }
  }
}

// Cuántos seguidores tiene una persona (cuántos la siguen)
export async function contarSeguidores(usuarioId) {
  const { count, error } = await supabase
    .from('seguidores')
    .select('id', { count: 'exact', head: true })
    .eq('seguido_id', usuarioId)
  if (error) return 0
  return count || 0
}

// A cuántas personas sigue (siguiendo)
export async function contarSiguiendo(usuarioId) {
  const { count, error } = await supabase
    .from('seguidores')
    .select('id', { count: 'exact', head: true })
    .eq('seguidor_id', usuarioId)
  if (error) return 0
  return count || 0
}

// Lista de ids a los que sigo (para filtrar el feed "Siguiendo")
export async function idsQueSigo() {
  const yo = await miUsuarioId()
  if (!yo) return []
  const { data, error } = await supabase
    .from('seguidores')
    .select('seguido_id')
    .eq('seguidor_id', yo)
  if (error || !data) return []
  return data.map((r) => r.seguido_id)
}

// Trae varios contadores de una sola vez para un perfil
export async function statsSociales(usuarioId) {
  const [seguidores, siguiendo, sigo] = await Promise.all([
    contarSeguidores(usuarioId),
    contarSiguiendo(usuarioId),
    sigoA(usuarioId),
  ])
  return { seguidores, siguiendo, sigo }
}
// ============================================================================
//  JUEGOS JUGADOS — cuenta real (los juegos donde la persona aparece vinculada)
//  Antes el perfil leía una columna 'juegos_jugados' que nadie actualizaba (0).
//  Ahora contamos de verdad: publicaciones de juego cuyo box score incluye
//  el perfilId de la persona.
// ============================================================================
export async function contarJuegosJugador(perfilId) {
  if (!perfilId) return 0
  const { count, error } = await supabase
    .from('publicaciones')
    .select('id', { count: 'exact', head: true })
    .contains('datos', { jugadores: [{ perfilId }] })
  if (error) return 0
  return count || 0
}

// Personas que sigo (lista con su perfil), para la pantalla "Siguiendo".
export async function aQuienesSigo() {
  const yo = await miUsuarioId()
  if (!yo) return { personas: [], error: 'No hay sesión' }
  const { data: rel, error } = await supabase
    .from('seguidores')
    .select('seguido_id, creado_en')
    .eq('seguidor_id', yo)
    .order('creado_en', { ascending: false })
  if (error) return { personas: [], error: error.message }
  const ids = (rel || []).map((r) => r.seguido_id).filter(Boolean)
  if (!ids.length) return { personas: [], error: null }
  const { data: perfiles } = await supabase
    .from('perfiles')
    .select('id, nombre, apellido, foto_url, codigo_unico, municipio')
    .in('id', ids)
  return { personas: perfiles || [], error: null }
}

// ============================================================================
//  MI PERFIL — cargar y guardar (para la pantalla de Configuración)
// ============================================================================
export async function cargarMiPerfil() {
  const yo = await miUsuarioId()
  if (!yo) return { perfil: null, error: 'No hay sesión' }
  const { data, error } = await supabase.from('perfiles').select('*').eq('id', yo).single()
  return { perfil: data || null, error: error?.message || null }
}

export async function guardarMiPerfil(cambios) {
  const yo = await miUsuarioId()
  if (!yo) return { error: 'No hay sesión' }
  const { error } = await supabase.from('perfiles').update(cambios).eq('id', yo)
  return { error: error?.message || null }
}

// Cambiar el código secreto de jugador (PIN de 4 dígitos)
export async function cambiarMiPin(nuevoPin) {
  const pin = String(nuevoPin || '').trim()
  if (!/^[0-9]{4}$/.test(pin)) return { error: 'El código es de cuatro dígitos' }
  const { error } = await supabase.rpc('set_pin', { nuevo_pin: pin })
  return { error: error?.message || null }
}