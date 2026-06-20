import { supabase } from './supabaseClient'

// ============================================================================
//  HELPER CENTRAL DE FOTOS — Media Cancha
//  Un solo motor para subir imágenes a Supabase Storage (bucket "fotos").
//  Se reusa en TODA la app: perfil, publicaciones, equipos, torneos, etc.
//
//  Uso típico:
//    const { url, error } = await subirFotoPerfil(archivo)
//    if (url) { ...guardar url en la tabla... }
// ============================================================================

const BUCKET = 'fotos'

// Comprime y redimensiona la imagen ANTES de subir (ahorra datos y espacio).
async function comprimirImagen(archivo, maxLado = 1280, calidad = 0.82) {
  return new Promise((resolve) => {
    try {
      const lector = new FileReader()
      lector.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          let { width, height } = img
          if (width > height && width > maxLado) {
            height = Math.round((height * maxLado) / width); width = maxLado
          } else if (height >= width && height > maxLado) {
            width = Math.round((width * maxLado) / height); height = maxLado
          }
          const canvas = document.createElement('canvas')
          canvas.width = width; canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob((blob) => resolve(blob || archivo), 'image/jpeg', calidad)
        }
        img.onerror = () => resolve(archivo)
        img.src = e.target.result
      }
      lector.onerror = () => resolve(archivo)
      lector.readAsDataURL(archivo)
    } catch (err) {
      resolve(archivo)
    }
  })
}

// Sube un archivo al bucket en la carpeta indicada. Devuelve { url, ruta, error }.
async function subirArchivo(archivo, carpeta, opciones = {}) {
  try {
    if (!archivo) return { url: null, error: 'No hay archivo' }

    const { data: sesion } = await supabase.auth.getUser()
    const uid = sesion?.user?.id || 'anon'

    const maxLado = opciones.maxLado || 1280
    const calidad = opciones.calidad || 0.82
    const blob = await comprimirImagen(archivo, maxLado, calidad)

    const sello = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const ruta = `${carpeta}/${uid}/${sello}.jpg`

    const { error: errSubida } = await supabase.storage
      .from(BUCKET)
      .upload(ruta, blob, { contentType: 'image/jpeg', upsert: false })

    if (errSubida) return { url: null, error: errSubida.message }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta)
    return { url: data?.publicUrl || null, ruta, error: null }
  } catch (err) {
    return { url: null, error: err.message || 'Error al subir' }
  }
}

// ---------- Funciones específicas (todas usan el mismo motor) ----------

export async function subirFotoPerfil(archivo) {
  return subirArchivo(archivo, 'perfiles', { maxLado: 800, calidad: 0.85 })
}

export async function subirFotoPublicacion(archivo) {
  return subirArchivo(archivo, 'publicaciones', { maxLado: 1440, calidad: 0.82 })
}

export async function subirFotoEquipo(archivo) {
  return subirArchivo(archivo, 'equipos', { maxLado: 600, calidad: 0.9 })
}

export async function subirFotoTorneo(archivo) {
  return subirArchivo(archivo, 'torneos', { maxLado: 1200, calidad: 0.85 })
}

export async function subirFoto(archivo, carpeta = 'varios', opciones = {}) {
  return subirArchivo(archivo, carpeta, opciones)
}

// ---------- Borrar una foto (cuando se reemplaza o elimina) ----------
export async function borrarFoto(ruta) {
  try {
    if (!ruta) return { ok: false, error: 'No hay ruta' }
    const { error } = await supabase.storage.from(BUCKET).remove([ruta])
    return { ok: !error, error: error?.message || null }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}