// ============================================================================
//  GRUPOS DE CHAT — el chat de dos personas (mensajes.js) sigue intacto.
//  Esto es un mundo aparte para chats de VARIOS: grupos manuales (los crea
//  cualquiera, a mano) y grupos AUTOMÁTICOS (uno por cada liga y cada torneo,
//  cuyos miembros entran y salen solos según quién está en la liga/torneo).
//  Tablas: grupos, grupo_miembros, mensajes_grupo.
// ============================================================================
import { supabase } from './supabaseClient'
import { miUsuarioId } from './social'

// ----------------------------------------------------------------------------
//  CREAR (manual) — el fundador de una conversación de varios.
// ----------------------------------------------------------------------------
export async function crearGrupoManual(nombre, miembroIds = []) {
  const yo = await miUsuarioId()
  if (!yo) return { error: 'Inicia sesión' }
  const limpio = (nombre || '').trim()
  if (!limpio) return { error: 'Ponle un nombre al grupo' }
  const { data: g, error } = await supabase
    .from('grupos')
    .insert({ nombre: limpio, tipo: 'manual', creado_por: yo })
    .select()
    .single()
  if (error) return { error: error.message }
  const todos = Array.from(new Set([yo, ...miembroIds.filter(Boolean)]))
  const filas = todos.map((pid) => ({ grupo_id: g.id, perfil_id: pid, rol: pid === yo ? 'admin' : 'miembro' }))
  const { error: e2 } = await supabase.from('grupo_miembros').insert(filas)
  if (e2) return { error: e2.message }
  return { grupo: g, error: null }
}

// ----------------------------------------------------------------------------
//  ASEGURAR — obtiene el grupo automático de una liga/torneo, creándolo la
//  primera vez que hace falta. Es seguro llamarlo muchas veces (no duplica).
// ----------------------------------------------------------------------------
async function asegurarGrupoAuto(tipo, origenId, nombre) {
  if (!origenId) return null
  const campoOrigen = tipo === 'liga' ? 'liga_id' : 'torneo_id'
  const { data: existente } = await supabase.from('grupos').select('id').eq('tipo', tipo).eq(campoOrigen, origenId).maybeSingle()
  if (existente) return existente.id
  const yo = await miUsuarioId()
  const { data: g, error } = await supabase
    .from('grupos')
    .insert({ nombre: nombre || (tipo === 'liga' ? 'Liga' : 'Torneo'), tipo, [campoOrigen]: origenId, creado_por: yo })
    .select('id')
    .single()
  if (error) return null
  return g.id
}
export async function asegurarGrupoLiga(ligaId, nombreLiga) { return asegurarGrupoAuto('liga', ligaId, nombreLiga) }
export async function asegurarGrupoTorneo(torneoId, nombreTorneo) { return asegurarGrupoAuto('torneo', torneoId, nombreTorneo) }

// ----------------------------------------------------------------------------
//  SINCRONIZAR — hace que los miembros del grupo sean EXACTAMENTE los que
//  están hoy en la liga/torneo (agrega a los nuevos, saca a los que ya no
//  están). Se llama cada vez que algo cambia en la membresía de origen.
// ----------------------------------------------------------------------------
export async function sincronizarGrupoLiga(ligaId, nombreLiga) {
  if (!ligaId) return null
  const grupoId = await asegurarGrupoLiga(ligaId, nombreLiga)
  if (!grupoId) return null
  const { data: miembros } = await supabase.from('liga_miembros').select('perfil_id').eq('liga_id', ligaId)
  await sincronizarMiembrosGrupo(grupoId, (miembros || []).map((m) => m.perfil_id).filter(Boolean))
  return grupoId
}

export async function sincronizarGrupoTorneo(torneoId, nombreTorneo) {
  if (!torneoId) return null
  const grupoId = await asegurarGrupoTorneo(torneoId, nombreTorneo)
  if (!grupoId) return null
  // Solo jugadores CONFIRMADOS y con MC-ID (los nombres sueltos no tienen cuenta que meter al chat).
  const { data: jug } = await supabase.from('torneo_jugadores').select('perfil_id').eq('torneo_id', torneoId).eq('estado', 'confirmado').not('perfil_id', 'is', null)
  const { data: dir } = await supabase.from('torneo_directiva').select('perfil_id').eq('torneo_id', torneoId).eq('estado', 'confirmado').not('perfil_id', 'is', null)
  const ids = [...(jug || []), ...(dir || [])].map((r) => r.perfil_id).filter(Boolean)
  await sincronizarMiembrosGrupo(grupoId, ids)
  return grupoId
}

// Motor interno: deja el grupo con EXACTAMENTE la lista de perfiles dada.
async function sincronizarMiembrosGrupo(grupoId, idsDeseados) {
  const deseados = new Set(idsDeseados)
  const { data: actuales } = await supabase.from('grupo_miembros').select('perfil_id').eq('grupo_id', grupoId)
  const actualesSet = new Set((actuales || []).map((m) => m.perfil_id))
  const aAgregar = [...deseados].filter((id) => !actualesSet.has(id))
  const aQuitar = [...actualesSet].filter((id) => !deseados.has(id))
  if (aAgregar.length) {
    await supabase.from('grupo_miembros').insert(aAgregar.map((pid) => ({ grupo_id: grupoId, perfil_id: pid, rol: 'miembro' })))
  }
  if (aQuitar.length) {
    await supabase.from('grupo_miembros').delete().eq('grupo_id', grupoId).in('perfil_id', aQuitar)
  }
}

// ¿Ya existe el grupo automático de esta liga/torneo? (sin crearlo)
async function idGrupoExistente(tipo, origenId) {
  if (!origenId) return null
  const campoOrigen = tipo === 'liga' ? 'liga_id' : 'torneo_id'
  const { data } = await supabase.from('grupos').select('id').eq('tipo', tipo).eq(campoOrigen, origenId).maybeSingle()
  return data ? data.id : null
}

// SOLO sincroniza si el organizador ya activó el grupo. Si todavía no existe,
// no lo crea — respeta que activar el chat es una decisión del organizador,
// no algo que pase solo. Se usa en cada entrada/salida de miembro.
export async function sincronizarGrupoLigaSiExiste(ligaId) {
  const grupoId = await idGrupoExistente('liga', ligaId)
  if (!grupoId) return
  const { data: miembros } = await supabase.from('liga_miembros').select('perfil_id').eq('liga_id', ligaId)
  await sincronizarMiembrosGrupo(grupoId, (miembros || []).map((m) => m.perfil_id).filter(Boolean))
}

export async function sincronizarGrupoTorneoSiExiste(torneoId) {
  const grupoId = await idGrupoExistente('torneo', torneoId)
  if (!grupoId) return
  const { data: jug } = await supabase.from('torneo_jugadores').select('perfil_id').eq('torneo_id', torneoId).eq('estado', 'confirmado').not('perfil_id', 'is', null)
  const { data: dir } = await supabase.from('torneo_directiva').select('perfil_id').eq('torneo_id', torneoId).eq('estado', 'confirmado').not('perfil_id', 'is', null)
  const ids = [...(jug || []), ...(dir || [])].map((r) => r.perfil_id).filter(Boolean)
  await sincronizarMiembrosGrupo(grupoId, ids)
}

// ----------------------------------------------------------------------------
//  ACTIVAR (a mano) — el organizador aprueba que su liga/torneo tenga chat
//  grupal. Sirve tanto para ligas/torneos nuevos como para los viejos.
// ----------------------------------------------------------------------------
export async function tieneGrupoActivo(tipo, origenId) { return !!(await idGrupoExistente(tipo, origenId)) }
export async function activarGrupoLiga(ligaId, nombreLiga) { return sincronizarGrupoLiga(ligaId, nombreLiga) }
export async function activarGrupoTorneo(torneoId, nombreTorneo) { return sincronizarGrupoTorneo(torneoId, nombreTorneo) }
export async function misGrupos() {
  const yo = await miUsuarioId()
  if (!yo) return { grupos: [], error: 'No hay sesión' }
  const { data: mis, error } = await supabase.from('grupo_miembros').select('grupo_id').eq('perfil_id', yo)
  if (error || !mis || !mis.length) return { grupos: [], error: error?.message || null }
  const ids = mis.map((m) => m.grupo_id)
  const { data: grupos } = await supabase.from('grupos').select('*').in('id', ids)
  // Último mensaje de cada grupo (para el orden y la vista previa del buzón).
  const { data: ultimos } = await supabase
    .from('mensajes_grupo')
    .select('grupo_id, texto, creado_en, de_id')
    .in('grupo_id', ids)
    .order('creado_en', { ascending: false })
  const ultimoPorGrupo = {}
  ;(ultimos || []).forEach((m) => { if (!ultimoPorGrupo[m.grupo_id]) ultimoPorGrupo[m.grupo_id] = m })
  const lista = (grupos || []).map((g) => ({ ...g, ultimo: ultimoPorGrupo[g.id] || null }))
  lista.sort((a, b) => {
    const ta = a.ultimo ? new Date(a.ultimo.creado_en).getTime() : new Date(a.creado_en).getTime()
    const tb = b.ultimo ? new Date(b.ultimo.creado_en).getTime() : new Date(b.creado_en).getTime()
    return tb - ta
  })
  return { grupos: lista, error: null }
}

// Miembros de un grupo (con su perfil, para mostrar nombre/foto).
export async function leerMiembrosGrupo(grupoId) {
  if (!grupoId) return { miembros: [], error: null }
  const { data, error } = await supabase
    .from('grupo_miembros')
    .select('perfil_id, rol, perfil:perfiles(id, nombre, apellido, foto_url, codigo_unico)')
    .eq('grupo_id', grupoId)
  return { miembros: data || [], error: error?.message || null }
}

// ----------------------------------------------------------------------------
//  MENSAJES DEL GRUPO
// ----------------------------------------------------------------------------
export async function enviarMensajeGrupo(grupoId, texto, extra = {}) {
  const yo = await miUsuarioId()
  if (!yo) return { error: 'Inicia sesión' }
  const limpio = (texto || '').trim()
  if (!limpio && !extra.adjunto_meta) return { error: 'Escribe algo' }
  const { data, error } = await supabase
    .from('mensajes_grupo')
    .insert({ grupo_id: grupoId, de_id: yo, texto: limpio || '🏀', tipo: extra.tipo || 'texto', adjunto_meta: extra.adjunto_meta || null })
    .select()
    .single()
  if (error) return { error: error.message }
  return { ok: true, mensaje: data }
}

export async function leerMensajesGrupo(grupoId) {
  if (!grupoId) return { mensajes: [], error: null }
  const { data, error } = await supabase
    .from('mensajes_grupo')
    .select('*, autor:perfiles(id, nombre, apellido, foto_url)')
    .eq('grupo_id', grupoId)
    .order('creado_en', { ascending: true })
  return { mensajes: data || [], error: error?.message || null }
}

export async function salirDeGrupo(grupoId) {
  const yo = await miUsuarioId()
  if (!yo || !grupoId) return { error: 'Faltan datos' }
  const { error } = await supabase.from('grupo_miembros').delete().eq('grupo_id', grupoId).eq('perfil_id', yo)
  return { error: error?.message || null }
}