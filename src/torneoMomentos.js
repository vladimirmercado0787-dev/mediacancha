// ============================================================
//  torneoMomentos.js
//  INTELIGENCIA AUTOMÁTICA del torneo — LÓGICA PURA (T-001).
//  Detecta solo y arma las "tarjetas de momento" para la portada
//  y el feed: REMONTADAS, RACHAS y EXPLOSIONES.
//  Usa las mismas formas de datos que torneoEstadisticas.js
//  (equipo, juego con parciales, stat por jugador por juego).
// ============================================================

// ----- UMBRALES (AJUSTABLES — falta decidir los finales con Vladimir) -----
export const UMBRAL_REMONTADA = 10        // puntos abajo que hay que voltear para que cuente
export const UMBRAL_RACHA = 3             // victorias seguidas para que sea racha
export const UMBRAL_EXPLOSION_PTS = 35    // puntos en un solo juego para que sea explosión
export const CONTAR_TRIPLE_DOBLE = true   // contar un triple-doble como momento

const num = (v) => (typeof v === 'number' && !isNaN(v) ? v : 0)
const buscarEq = (equipos, id) => equipos.find((e) => e.id === id || String(e.id) === String(id))
const nombreEq = (equipos, id) => { const e = buscarEq(equipos, id); return e ? (e.nombre || 'Equipo') : 'Equipo' }

// ---------- REMONTADAS ----------
//  Usa los parciales por cuarto para ver el mayor déficit que el GANADOR volteó.
export function detectarRemontadas(juegos = [], equipos = []) {
  const out = []
  juegos.filter((j) => j.estado === 'final' && Array.isArray(j.parcialesA) && Array.isArray(j.parcialesB)).forEach((j) => {
    const A = j.parcialesA, B = j.parcialesB
    const n = Math.min(A.length, B.length)
    let cumA = 0, cumB = 0, defA = 0, defB = 0 // máximo déficit que llegó a tener cada uno
    for (let k = 0; k < n; k++) {
      cumA += num(A[k]); cumB += num(B[k])
      defA = Math.max(defA, cumB - cumA)
      defB = Math.max(defB, cumA - cumB)
    }
    const ganoA = num(j.puntosA) > num(j.puntosB)
    const ganoB = num(j.puntosB) > num(j.puntosA)
    let deficit = 0, ganador = null
    if (ganoA && defA >= UMBRAL_REMONTADA) { deficit = defA; ganador = j.equipoA_id }
    else if (ganoB && defB >= UMBRAL_REMONTADA) { deficit = defB; ganador = j.equipoB_id }
    if (ganador != null) {
      out.push({
        tipo: 'remontada', juego_id: j.id, jornada: j.jornada, fecha: j.fecha,
        equipo_id: ganador, valor: deficit,
        titulo: `${nombreEq(equipos, ganador)} venía ${deficit} abajo y lo volteó`,
        detalle: `${nombreEq(equipos, j.equipoA_id)} ${num(j.puntosA)} — ${num(j.puntosB)} ${nombreEq(equipos, j.equipoB_id)}`,
      })
    }
  })
  return out
}

// ---------- RACHAS ----------
//  Cuenta la racha de victorias ACTUAL de cada equipo (juegos finales en orden).
export function detectarRachas(juegos = [], equipos = []) {
  const finales = juegos.filter((j) => j.estado === 'final')
    .slice()
    .sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0) || num(a.jornada) - num(b.jornada))
  const racha = {} // clave = String(equipo_id)
  finales.forEach((j) => {
    const ganoA = num(j.puntosA) > num(j.puntosB)
    const ganoB = num(j.puntosB) > num(j.puntosA)
    const gid = ganoA ? j.equipoA_id : (ganoB ? j.equipoB_id : null)
    const pid = gid == null ? null : (gid === j.equipoA_id ? j.equipoB_id : j.equipoA_id)
    if (gid != null) {
      racha[String(gid)] = (racha[String(gid)] || 0) + 1
      if (pid != null) racha[String(pid)] = 0
    }
  })
  return Object.keys(racha)
    .filter((k) => racha[k] >= UMBRAL_RACHA)
    .map((k) => {
      const eq = buscarEq(equipos, k)
      const eid = eq ? eq.id : k
      const n = racha[k]
      return {
        tipo: 'racha', equipo_id: eid, valor: n,
        titulo: `${nombreEq(equipos, eid)} llega a ${n} victorias seguidas`,
        detalle: 'Racha más larga activa del torneo',
      }
    })
    .sort((a, b) => b.valor - a.valor)
}

// ---------- EXPLOSIONES ----------
//  Actuaciones individuales fuera de lo normal en un solo juego.
export function detectarExplosiones(stats = [], equipos = []) {
  const out = []
  stats.forEach((s) => {
    const pts = num(s.puntos)
    const dobles = [num(s.puntos) >= 10, num(s.rebotes) >= 10, num(s.asistencias) >= 10, num(s.robos) >= 10, num(s.tapones) >= 10].filter(Boolean).length
    if (pts >= UMBRAL_EXPLOSION_PTS) {
      out.push({
        tipo: 'explosion', juego_id: s.juego_id, jornada: s.jornada, jugador_id: s.jugador_id,
        equipo_id: s.equipo_id, valor: pts,
        titulo: `${s.nombre || 'Un jugador'} explotó con ${pts} puntos`,
        detalle: nombreEq(equipos, s.equipo_id),
      })
    } else if (CONTAR_TRIPLE_DOBLE && dobles >= 3) {
      out.push({
        tipo: 'explosion', juego_id: s.juego_id, jornada: s.jornada, jugador_id: s.jugador_id,
        equipo_id: s.equipo_id, valor: 30, // peso medio para ordenar
        titulo: `${s.nombre || 'Un jugador'} firmó un triple-doble`,
        detalle: `${num(s.puntos)} pts · ${num(s.rebotes)} reb · ${num(s.asistencias)} ast`,
      })
    }
  })
  return out.sort((a, b) => b.valor - a.valor)
}

// ---------- TODO JUNTO ----------
//  Lista de momentos lista para la portada / feed: lo más nuevo y relevante primero.
export function generarMomentos(juegos = [], equipos = [], stats = []) {
  const todos = [
    ...detectarRemontadas(juegos, equipos),
    ...detectarRachas(juegos, equipos),
    ...detectarExplosiones(stats, equipos),
  ]
  return todos.sort((a, b) => (num(b.jornada) - num(a.jornada)) || (b.valor - a.valor))
}