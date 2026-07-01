// ============================================================================
//  MEMORIA LOCAL (caché) — para que la app se sienta fluida como Instagram.
//  Guarda lo último que se cargó en el teléfono y lo muestra al instante;
//  mientras tanto, la app refresca lo nuevo por detrás y actualiza.
//  Es solo para LECTURA rápida (no reemplaza el internet, lo adelanta).
// ============================================================================

const PREFIJO = 'mc_cache_'

// Lee lo último guardado para una clave. Si no hay nada, devuelve `porDefecto`.
export function cacheGet(clave, porDefecto = null) {
  try {
    const v = localStorage.getItem(PREFIJO + clave)
    return v ? JSON.parse(v) : porDefecto
  } catch (e) {
    return porDefecto
  }
}

// Guarda el valor más reciente para una clave (lo que se mostrará al instante
// la próxima vez que se abra la pantalla).
export function cacheSet(clave, valor) {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor))
  } catch (e) {
    // Si el almacenamiento está lleno o falla, no pasa nada: solo no se cachea.
  }
}

// Borra una clave (por si alguna vez hace falta limpiar).
export function cacheDel(clave) {
  try { localStorage.removeItem(PREFIJO + clave) } catch (e) {}
}