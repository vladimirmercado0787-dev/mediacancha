import { supabase } from './supabaseClient'
import { miUsuarioId } from './social'

// Enviar un mensaje a otra persona
export async function enviarMensaje(paraId, texto) {
  const yo = await miUsuarioId()
  if (!yo) return { error: 'Inicia sesión' }
  const limpio = (texto || '').trim()
  if (!limpio) return { error: 'Escribe algo' }
  if (yo === paraId) return { error: 'No puedes enviarte mensajes a ti mismo' }
  const { data, error } = await supabase
    .from('mensajes')
    .insert({ de_id: yo, para_id: paraId, texto: limpio })
    .select()
    .single()
  if (error) return { error: error.message }
  return { ok: true, mensaje: data }
}

// Leer toda la conversación con una persona (ordenada por fecha)
export async function leerConversacion(otroId) {
  const yo = await miUsuarioId()
  if (!yo) return []
  const { data, error } = await supabase
    .from('mensajes')
    .select('*')
    .or(`and(de_id.eq.${yo},para_id.eq.${otroId}),and(de_id.eq.${otroId},para_id.eq.${yo})`)
    .order('creado_en', { ascending: true })
  if (error || !data) return []
  return data
}

// Marcar como leídos los mensajes que me mandó esa persona
export async function marcarLeido(otroId) {
  const yo = await miUsuarioId()
  if (!yo) return
  await supabase
    .from('mensajes')
    .update({ leido: true })
    .eq('de_id', otroId)
    .eq('para_id', yo)
    .eq('leido', false)
}

// Cuántos mensajes sin leer tengo en total
export async function contarNoLeidos() {
  const yo = await miUsuarioId()
  if (!yo) return 0
  const { count, error } = await supabase
    .from('mensajes')
    .select('id', { count: 'exact', head: true })
    .eq('para_id', yo)
    .eq('leido', false)
  if (error) return 0
  return count || 0
}

// Lista de conversaciones (últimas por persona) para el inbox.
// Devuelve [{ otroId, ultimo, noLeidos }] ordenado por fecha del último mensaje.
export async function listaConversaciones() {
  const yo = await miUsuarioId()
  if (!yo) return []
  const { data, error } = await supabase
    .from('mensajes')
    .select('*')
    .or(`de_id.eq.${yo},para_id.eq.${yo}`)
    .order('creado_en', { ascending: false })
    .limit(300)
  if (error || !data) return []

  const porPersona = {}
  for (const m of data) {
    const otroId = m.de_id === yo ? m.para_id : m.de_id
    if (!porPersona[otroId]) {
      porPersona[otroId] = { otroId, ultimo: m, noLeidos: 0 }
    }
    // contar no leídos (que me los mandaron a mí y no he leído)
    if (m.para_id === yo && !m.leido) porPersona[otroId].noLeidos++
  }
  // ya viene ordenado desc, así que el primer mensaje de cada persona es el último
  return Object.values(porPersona)
}

// Traer los perfiles (nombre, foto) de una lista de ids — para pintar el inbox
export async function perfilesDe(ids) {
  if (!ids || ids.length === 0) return {}
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, apellido, foto_url')
    .in('id', ids)
  if (error || !data) return {}
  const mapa = {}
  data.forEach((p) => { mapa[p.id] = p })
  return mapa
}