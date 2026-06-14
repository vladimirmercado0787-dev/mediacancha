// historialDia.js
// Maneja el "historial del día" de juegos rápidos (versión gratis).
// Se guarda en el teléfono (localStorage) y se borra solo a las 24 horas.
// También genera la noticia automática para El Techado.

const CLAVE = 'mc_historial_dia'
const VENTANA_MS = 24 * 60 * 60 * 1000 // 24 horas

// Lee el historial, descartando lo que ya pasó de 24h (limpieza automática)
export function leerHistorialDia() {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return []
    const lista = JSON.parse(crudo)
    const ahora = Date.now()
    const vigentes = lista.filter((j) => ahora - j.ts < VENTANA_MS)
    // si se limpió algo, reescribir
    if (vigentes.length !== lista.length) {
      localStorage.setItem(CLAVE, JSON.stringify(vigentes))
    }
    return vigentes
  } catch (e) {
    return []
  }
}

// Calcula totales, ganador y jugador destacado de un juego
function resumirJuego(resultado) {
  const jugadores = resultado.jugadores || []
  const totalEq = (eq) => jugadores.filter((j) => j.equipo === eq).reduce((a, j) => a + (j.pts || 0), 0)
  const totalA = totalEq(0)
  const totalB = totalEq(1)
  const hayEmpate = totalA === totalB
  const ganadorEq = hayEmpate ? null : (totalA > totalB ? 0 : 1)
  const nombreGanador = ganadorEq === null ? null : (ganadorEq === 0 ? resultado.nombreA : resultado.nombreB)
  // destacado = más puntos (desempate: más rebotes, luego asistencias)
  let destacado = null
  jugadores.forEach((j) => {
    if (!destacado) { destacado = j; return }
    const mejor = (j.pts || 0) > (destacado.pts || 0) ||
      ((j.pts || 0) === (destacado.pts || 0) && (j.reb || 0) > (destacado.reb || 0)) ||
      ((j.pts || 0) === (destacado.pts || 0) && (j.reb || 0) === (destacado.reb || 0) && (j.ast || 0) > (destacado.ast || 0))
    if (mejor) destacado = j
  })
  return { totalA, totalB, hayEmpate, ganadorEq, nombreGanador, destacado }
}

// Guarda un juego terminado en el historial del día
export function guardarJuegoDelDia(resultado) {
  try {
    const lista = leerHistorialDia()
    const r = resumirJuego(resultado)
    const juego = {
      id: 'jd' + Date.now() + Math.random().toString(36).slice(2, 6),
      ts: Date.now(),
      nombreJuego: resultado.nombreJuego || 'Juego rápido',
      nombreA: resultado.nombreA,
      nombreB: resultado.nombreB,
      totalA: r.totalA,
      totalB: r.totalB,
      hayEmpate: r.hayEmpate,
      nombreGanador: r.nombreGanador,
      destacadoNombre: r.destacado ? (r.destacado.nombre || ('#' + r.destacado.numero)) : null,
      destacadoPts: r.destacado ? (r.destacado.pts || 0) : 0,
      destacadoReb: r.destacado ? (r.destacado.reb || 0) : 0,
      destacadoAst: r.destacado ? (r.destacado.ast || 0) : 0,
      // equipos completos para poder "repetir" desde el historial
      jugadores: resultado.jugadores || [],
      publicado: false, // NO se publica en el Techado hasta que la persona lo elija
      config: { tipoFin: resultado.tipoFin, puntosMeta: resultado.puntosMeta, minutos: resultado.minutos, statsActivas: resultado.statsActivas, formato: resultado.formato, modoAnotacion: resultado.modoAnotacion, jugadoresPorLado: resultado.jugadoresPorLado, porDif2: resultado.porDif2 },
    }
    const nueva = [juego, ...lista]
    localStorage.setItem(CLAVE, JSON.stringify(nueva))
    return juego
  } catch (e) {
    return null
  }
}

// Texto de "hace cuánto" a partir de un timestamp
export function haceCuanto(ts) {
  const min = Math.floor((Date.now() - ts) / 60000)
  if (min < 1) return 'ahora mismo'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return 'hace 1 día'
}

// Marca un juego del día como publicado en El Techado (lo elige la persona)
export function publicarEnTechado(id) {
  try {
    const lista = leerHistorialDia()
    const nueva = lista.map((j) => j.id === id ? { ...j, publicado: true } : j)
    localStorage.setItem(CLAVE, JSON.stringify(nueva))
    return true
  } catch (e) {
    return false
  }
}

// Quita un juego del Techado (deshacer publicación)
export function quitarDelTechado(id) {
  try {
    const lista = leerHistorialDia()
    const nueva = lista.map((j) => j.id === id ? { ...j, publicado: false } : j)
    localStorage.setItem(CLAVE, JSON.stringify(nueva))
    return true
  } catch (e) {
    return false
  }
}

// Convierte SOLO los juegos PUBLICADOS del día en noticias para El Techado
export function juegosComoNoticias() {
  const lista = leerHistorialDia().filter((j) => j.publicado)
  return lista.map((j) => {
    let titulo, texto
    if (j.hayEmpate) {
      titulo = `${j.nombreA} y ${j.nombreB} empataron`
      texto = `Quedaron ${j.totalA}-${j.totalB} en ${j.nombreJuego}.`
    } else {
      const perdedor = j.nombreGanador === j.nombreA ? j.nombreB : j.nombreA
      const marcadorGanador = Math.max(j.totalA, j.totalB)
      const marcadorPerdedor = Math.min(j.totalA, j.totalB)
      titulo = `${j.nombreGanador} venció a ${perdedor}`
      texto = `Ganaron ${marcadorGanador}-${marcadorPerdedor}.`
      if (j.destacadoNombre) {
        texto += ` Destacado: ${j.destacadoNombre} con ${j.destacadoPts} pts.`
      }
    }
    return {
      id: j.id,
      tag: 'JUEGO DEL DÍA',
      tagColor: '#2fbf71',
      titulo,
      texto,
      tiempo: haceCuanto(j.ts),
      likes: 0,
      esJuegoDia: true,
    }
  })
}

// Borra todo el historial del día (por si se quiere resetear manualmente)
export function limpiarHistorialDia() {
  try { localStorage.removeItem(CLAVE) } catch (e) {}
}