// ============================================================================
//  ESTADÍSTICAS DE LIGA — Media Cancha
//  --------------------------------------------------------------------------
//  Lógica PURA (no toca Supabase). A diferencia del torneo, la liga NO tiene
//  equipos registrados: cada juego guarda nombres de equipo libres
//  (nombre_a / nombre_b). Así que la tabla de posiciones se arma AGRUPANDO
//  por nombre de equipo a través de todos los juegos de la liga.
// ============================================================================

const norm = (s) => (s || '').toString().trim()
const clave = (s) => norm(s).toLowerCase()
const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0)

// ---------------------------------------------------------------------------
// TABLA DE POSICIONES — agrupa por nombre de equipo.
// Devuelve [{ nombre, jugados, ganados, perdidos, empates, pf, pc, dif, pct, posicion }]
// ---------------------------------------------------------------------------
export function calcularTablaLiga(juegos = []) {
  const mapa = {}
  const equipo = (nombre) => {
    const k = clave(nombre)
    if (!k) return null
    if (!mapa[k]) mapa[k] = { nombre: norm(nombre), jugados: 0, ganados: 0, perdidos: 0, empates: 0, pf: 0, pc: 0 }
    return mapa[k]
  }
  ;(juegos || []).forEach((j) => {
    const a = equipo(j.nombre_a)
    const b = equipo(j.nombre_b)
    if (!a || !b) return
    const pa = num(j.puntos_a), pb = num(j.puntos_b)
    a.jugados++; b.jugados++
    a.pf += pa; a.pc += pb
    b.pf += pb; b.pc += pa
    if (pa > pb) { a.ganados++; b.perdidos++ }
    else if (pb > pa) { b.ganados++; a.perdidos++ }
    else { a.empates++; b.empates++ }
  })
  const tabla = Object.values(mapa).map((e) => ({
    ...e,
    dif: e.pf - e.pc,
    pct: e.jugados ? e.ganados / e.jugados : 0,
  }))
  tabla.sort((x, y) => (y.ganados - x.ganados) || (y.pct - x.pct) || (y.dif - x.dif) || (y.pf - x.pf))
  tabla.forEach((e, i) => { e.posicion = i + 1 })
  return tabla
}

// ---------------------------------------------------------------------------
// LÍDERES — suma por jugador desde datos.jugadores de cada juego (si existe).
// Es defensivo con los nombres de campo porque el modo de anotar varía.
// Devuelve { puntos:[...], rebotes:[...], asistencias:[...] } cada uno ordenado.
// ---------------------------------------------------------------------------
function leerJugador(p) {
  if (!p || typeof p !== 'object') return null
  const nombre = norm(p.nombre || p.n || p.name || (p.numero != null ? ('#' + p.numero) : ''))
  if (!nombre) return null
  return {
    nombre,
    pts: num(p.pts ?? p.puntos ?? p.p),
    reb: num(p.reb ?? p.rebotes ?? p.r),
    ast: num(p.ast ?? p.asistencias ?? p.a),
  }
}

export function lideresLiga(juegos = []) {
  const acc = {}
  ;(juegos || []).forEach((j) => {
    const lista = (j.datos && Array.isArray(j.datos.jugadores)) ? j.datos.jugadores : []
    lista.forEach((raw) => {
      const p = leerJugador(raw)
      if (!p) return
      const k = clave(p.nombre)
      if (!acc[k]) acc[k] = { nombre: p.nombre, pts: 0, reb: 0, ast: 0, juegos: 0 }
      acc[k].pts += p.pts; acc[k].reb += p.reb; acc[k].ast += p.ast; acc[k].juegos++
    })
  })
  const arr = Object.values(acc)
  const top = (campo) => arr
    .filter((x) => x[campo] > 0)
    .map((x) => ({ nombre: x.nombre, total: x[campo], juegos: x.juegos, prom: x.juegos ? x[campo] / x.juegos : 0 }))
    .sort((a, b) => b.prom - a.prom || b.total - a.total)
  return { puntos: top('pts'), rebotes: top('reb'), asistencias: top('ast'), hayDatos: arr.length > 0 }
}

// ---------------------------------------------------------------------------
// DESTACADOS — el jugador del partido de cada juego (siempre disponible).
// Ranking por veces destacado + total de puntos en esos juegos.
// ---------------------------------------------------------------------------
export function destacadosLiga(juegos = []) {
  const acc = {}
  ;(juegos || []).forEach((j) => {
    const nombre = norm(j.destacado_nombre)
    if (!nombre) return
    const k = clave(nombre)
    if (!acc[k]) acc[k] = { nombre, veces: 0, pts: 0, reb: 0, ast: 0 }
    acc[k].veces++
    acc[k].pts += num(j.destacado_pts)
    acc[k].reb += num(j.destacado_reb)
    acc[k].ast += num(j.destacado_ast)
  })
  return Object.values(acc).sort((a, b) => b.veces - a.veces || b.pts - a.pts)
}

// ---------------------------------------------------------------------------
// RESUMEN — números grandes del encabezado.
// ---------------------------------------------------------------------------
export function resumenLiga(juegos = []) {
  const tabla = calcularTablaLiga(juegos)
  const puntosTotales = (juegos || []).reduce((s, j) => s + num(j.puntos_a) + num(j.puntos_b), 0)
  return {
    totalJuegos: (juegos || []).length,
    totalEquipos: tabla.length,
    puntosTotales,
    promedioPorJuego: juegos && juegos.length ? Math.round(puntosTotales / juegos.length) : 0,
  }
}