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