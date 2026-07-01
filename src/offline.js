// ============================================================================
//  MODO OFFLINE — el "buzón" (cola de espera) y el "cartero" (sincronizador).
//  Cuando no hay señal, las acciones se guardan aquí en el teléfono en vez de
//  perderse. En cuanto vuelve el internet (o se abre la app), el cartero las
//  manda solas, en el orden en que se hicieron.
//
//  Cómo se usa desde cualquier parte de la app:
//    1) Registrar el "cartero" de un tipo de acción, una vez, al arrancar:
//         registrarCartero('juego_liga', async (payload) => { ... })
//    2) Para guardar algo que puede fallar por falta de señal:
//         await intentarOEncolar('juego_liga', payload)
//       Si hay señal, lo manda de una vez. Si no, lo guarda en el buzón y
//       lo intenta después, sin que la persona pierda su juego.
// ============================================================================

const CLAVE = 'mc_buzon_pendientes'
const carteros = {}       // tipo -> función que sabe mandar ese tipo de acción
const oyentes = new Set() // funciones que quieren enterarse cuando cambia la cola

function leerCola() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || '[]') } catch (e) { return [] }
}
function guardarCola(cola) {
  try { localStorage.setItem(CLAVE, JSON.stringify(cola)) } catch (e) {}
  oyentes.forEach((fn) => { try { fn(cola) } catch (e) {} })
}

// Un componente puede "suscribirse" para pintar el avisito de pendientes.
export function alCambiarCola(fn) {
  oyentes.add(fn)
  fn(leerCola())
  return () => oyentes.delete(fn)
}

export function contarPendientes() { return leerCola().length }
export function hayConexion() { return typeof navigator === 'undefined' ? true : navigator.onLine }

// Cada pantalla que guarda algo importante registra aquí SU forma de mandarlo.
export function registrarCartero(tipo, fn) { carteros[tipo] = fn }

// Punto de entrada principal: intenta mandar de una vez; si falla (sin señal
// o error de red), lo guarda en el buzón para reintentar después.
export async function intentarOEncolar(tipo, payload, etiqueta) {
  if (hayConexion()) {
    try {
      const fn = carteros[tipo]
      if (fn) { await fn(payload); return { ok: true, encolado: false } }
    } catch (e) {
      // Falló aunque "había señal" (ej. wifi conectado pero sin datos reales) → encolar igual.
    }
  }
  const cola = leerCola()
  cola.push({ id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), tipo, payload, etiqueta: etiqueta || null, creado_en: new Date().toISOString(), intentos: 0 })
  guardarCola(cola)
  return { ok: true, encolado: true }
}

// El "cartero": intenta mandar todo lo pendiente, en orden. Se llama solo
// cuando vuelve el internet, y también se puede llamar a mano.
let procesando = false
export async function procesarCola() {
  if (procesando) return
  procesando = true
  try {
    let cola = leerCola()
    if (!cola.length) return
    const restantes = []
    for (const item of cola) {
      const fn = carteros[item.tipo]
      if (!fn) { restantes.push(item); continue }
      try {
        await fn(item.payload)
        // se mandó bien: no se vuelve a agregar a "restantes" (queda fuera de la cola)
      } catch (e) {
        item.intentos = (item.intentos || 0) + 1
        restantes.push(item)
      }
    }
    guardarCola(restantes)
  } finally {
    procesando = false
  }
}

// Arranca el "cartero automático": cada vez que vuelve la señal, o cada
// cierto tiempo por si acaso, intenta vaciar el buzón. Llamar UNA vez al
// iniciar la app (en App.jsx).
let arrancado = false
export function iniciarCartero() {
  if (arrancado) return
  arrancado = true
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => procesarCola())
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') procesarCola() })
  }
  procesarCola()
  setInterval(procesarCola, 20000) // por si el evento "online" no dispara bien en el teléfono
}