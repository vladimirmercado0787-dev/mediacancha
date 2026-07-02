// ============================================================================
//  ENCUESTAS — el motor de datos.
//  crearEncuesta   → guarda la pregunta y sus opciones
//  votarEncuesta   → un voto por persona (si vota otra vez, cambia su voto)
//  resultadosEncuesta → conteos por opción, total y mi voto
//  suscribirVotos  → las barras se mueven EN VIVO cuando alguien vota
// ============================================================================
import { supabase } from './supabaseClient'

async function miId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id || null
}

export async function crearEncuesta({ pregunta, opciones }) {
  const yo = await miId()
  if (!yo) return { error: 'Inicia sesión' }
  const preg = (pregunta || '').trim()
  const ops = (Array.isArray(opciones) ? opciones : [])
    .map((o) => (o || '').trim())
    .filter(Boolean)
  if (!preg) return { error: 'Escribe la pregunta' }
  if (ops.length < 2) return { error: 'Se necesitan al menos dos opciones' }
  if (ops.length > 6) return { error: 'Máximo seis opciones' }
  const { data, error } = await supabase
    .from('encuestas')
    .insert({ autor_id: yo, pregunta: preg, opciones: ops })
    .select()
    .single()
  if (error) return { error: error.message }
  return { ok: true, encuesta: data }
}

export async function votarEncuesta(encuestaId, opcion) {
  const yo = await miId()
  if (!yo) return { error: 'Inicia sesión' }
  const { error } = await supabase
    .from('encuesta_votos')
    .upsert(
      { encuesta_id: encuestaId, perfil_id: yo, opcion, votado_en: new Date().toISOString() },
      { onConflict: 'encuesta_id,perfil_id' }
    )
  if (error) return { error: error.message }
  return { ok: true }
}

export async function resultadosEncuesta(encuestaId, numOpciones = 0) {
  const yo = await miId()
  const { data, error } = await supabase
    .from('encuesta_votos')
    .select('perfil_id, opcion')
    .eq('encuesta_id', encuestaId)
  if (error) return { conteos: [], total: 0, miVoto: null, error: error.message }
  const conteos = []
  let miVoto = null
  ;(data || []).forEach((v) => {
    conteos[v.opcion] = (conteos[v.opcion] || 0) + 1
    if (yo && v.perfil_id === yo) miVoto = v.opcion
  })
  for (let i = 0; i < Math.max(numOpciones, conteos.length); i++) conteos[i] = conteos[i] || 0
  return { conteos, total: (data || []).length, miVoto, error: null }
}

// Cada vez que alguien vota (o cambia su voto), avisa para refrescar las barras.
// Devuelve la función para desconectarse (llamarla al desmontar).
export function suscribirVotos(encuestaId, alCambiar) {
  const canal = supabase
    .channel('encuesta-' + encuestaId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'encuesta_votos', filter: `encuesta_id=eq.${encuestaId}` },
      () => { try { alCambiar() } catch (e) {} }
    )
    .subscribe()
  return () => { try { supabase.removeChannel(canal) } catch (e) {} }
}
