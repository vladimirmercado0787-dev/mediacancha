import { supabase } from './supabaseClient'

// ============================================================================
//  HELPER DE HISTORIAS — Media Cancha
//  Videos cortos (máx. 20s) que viven 24 horas y luego se vencen.
//  Habla con la tabla: historias  ·  Storage: bucket "fotos", carpeta historias/
// ============================================================================

const BUCKET = 'fotos'

export async function miUsuarioId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id || null
}

// ---------- SUBIR EL VIDEO AL STORAGE ----------
// Sube el archivo tal cual (sin recomprimir todavía — eso es una mejora aparte).
// Devuelve { url, ruta, error }.
async function subirVideo(archivo, carpeta) {
  try {
    if (!archivo) return { url: null, ruta: null, error: 'No hay archivo' }
    const uid = await miUsuarioId()
    if (!uid) return { url: null, ruta: null, error: 'No hay sesión activa' }

    const tipo = archivo.type || 'video/mp4'
    const ext = tipo.includes('quicktime') ? 'mov' : (tipo.includes('webm') ? 'webm' : 'mp4')
    const sello = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const ruta = `${carpeta}/${uid}/${sello}.${ext}`

    const { error: errSubida } = await supabase.storage
      .from(BUCKET)
      .upload(ruta, archivo, { contentType: tipo, upsert: false })
    if (errSubida) return { url: null, ruta: null, error: errSubida.message }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta)
    return { url: data?.publicUrl || null, ruta, error: null }
  } catch (err) {
    return { url: null, ruta: null, error: err.message || 'Error al subir el video' }
  }
}

// Historia (carpeta historias/) y publicación del Techado (carpeta techado/)
export async function subirVideoHistoria(archivo) { return subirVideo(archivo, 'historias') }
export async function subirVideoTechado(archivo) { return subirVideo(archivo, 'techado') }
export async function subirVideoAlbum(archivo) { return subirVideo(archivo, 'albumes') }

// ---------- CREAR LA HISTORIA (fila en la tabla) ----------
// datos: { video_url, ruta, duracion, lugar }
// expira_en lo pone solo la base de datos (24 horas).
export async function crearHistoria(datos) {
  const uid = await miUsuarioId()
  if (!uid) return { historia: null, error: 'No hay sesión activa' }
  const { data, error } = await supabase
    .from('historias')
    .insert({
      autor_id: uid,
      video_url: datos.video_url,
      ruta: datos.ruta || null,
      duracion: datos.duracion != null ? Math.round(datos.duracion) : null,
      lugar: datos.lugar || null,
      texto: datos.texto || null,
      texto_pos: datos.texto_pos || null,
      texto_color: datos.texto_color || null,
      inicio: datos.inicio != null ? Math.round(datos.inicio * 10) / 10 : 0,
    })
    .select()
    .single()
  return { historia: data || null, error: error?.message || null }
}

// ---------- LEER HISTORIAS VIGENTES ----------
// Solo las que NO se han vencido. Las más nuevas primero, con su autor.
export async function leerHistorias() {
  const { data, error } = await supabase
    .from('historias')
    .select('id, autor_id, video_url, duracion, inicio, texto, texto_pos, texto_color, creado_en, expira_en, autor:perfiles(id, nombre, apellido, foto_url, codigo_unico)')
    .gt('expira_en', new Date().toISOString())
    .order('creado_en', { ascending: false })
  return { historias: data || [], error: error?.message || null }
}

// ---------- BORRAR UNA HISTORIA (autor) ----------
export async function borrarHistoria(id, ruta) {
  if (!id) return { ok: false, error: 'Falta el id' }
  try {
    if (ruta) { try { await supabase.storage.from(BUCKET).remove([ruta]) } catch (e) { /* no fatal */ } }
    const { error } = await supabase.from('historias').delete().eq('id', id)
    return { ok: !error, error: error?.message || null }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}