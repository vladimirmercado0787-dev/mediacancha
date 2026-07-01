// ============================================================================
//  LÓGICA DE FORMATO DEL TORNEO — Media Cancha  (T-012)
//  --------------------------------------------------------------------------
//  Calcula la ESTRUCTURA de un torneo a partir de su configuración:
//  cuántas jornadas tiene la fase regular, cuántos juegos, qué fases de
//  playoff, y cuál es la última jornada de la regular — que es la base para
//  abrir la votación del MVP.
//
//  Es lógica PURA: no toca Supabase y no necesita que existan los juegos.
//  Solo usa lo que ya guarda la tabla `torneos`: formato + cantidad_equipos.
//  Cuando existan las fechas de los juegos, se mapea cada jornada a su fecha.
// ============================================================================

// Nombre legible del formato
export function nombreFormato(formato) {
  return ({
    liga: 'Liga (todos contra todos)',
    copa: 'Copa (eliminación directa)',
    mixto: 'Mixto (grupos + llave)',
  })[formato] || 'Liga (todos contra todos)'
}

// Nombre de una ronda de copa según cuántos equipos quedan
export function nombreRonda(equiposEnRonda) {
  const n = Number(equiposEnRonda) || 0
  if (n <= 2) return 'Final'
  if (n <= 4) return 'Semifinal'
  if (n <= 8) return 'Cuartos de final'
  if (n <= 16) return 'Octavos de final'
  if (n <= 32) return 'Dieciseisavos de final'
  return `Ronda de ${n}`
}

// Round-robin: cuántas jornadas para que N equipos jueguen todos contra todos
function jornadasRoundRobin(n) {
  if (n < 2) return 0
  return n % 2 === 0 ? n - 1 : n // par: N-1 jornadas; impar: N (uno descansa cada jornada)
}
function juegosRoundRobin(n) {
  if (n < 2) return 0
  return (n * (n - 1)) / 2
}

// Construye las fases de una llave eliminatoria a partir de los que entran
function fasesEliminatoria(entran, mult = 1) {
  const fases = []
  let quedan = Math.max(1, Number(entran) || 0)
  while (quedan > 1) {
    fases.push({ ronda: nombreRonda(quedan), equipos: quedan, juegos: Math.floor(quedan / 2) * mult })
    quedan = Math.ceil(quedan / 2)
  }
  return fases
}

// ----------------------------------------------------------------------------
// La estructura completa del torneo. Devuelve todo lo que la pantalla y el
// MVP necesitan saber del formato.
// ----------------------------------------------------------------------------
export function estructuraTorneo(opciones = {}) {
  const {
    formato = 'liga',
    cantidadEquipos = 8,
    idaYVuelta = false,
    equiposPorGrupo = 4,
    clasificanPorGrupo = 2,
  } = opciones
  const N = Math.max(2, Number(cantidadEquipos) || 2)
  const mult = idaYVuelta ? 2 : 1

  // COPA: eliminación directa. No hay fase regular, todo es playoff.
  if (formato === 'copa') {
    const fases = fasesEliminatoria(N, mult)
    return {
      tipo: 'copa',
      nombre: nombreFormato('copa'),
      hayFaseRegular: false,
      jornadasRegular: 0,
      ultimaJornadaRegular: null,
      totalJuegosRegular: 0,
      fasesPlayoff: fases,
      totalJuegos: fases.reduce((s, f) => s + f.juegos, 0),
      nota: 'En copa el MVP se vota al final — no hay "última semana de la regular".',
    }
  }

  // MIXTO: fase de grupos (round-robin por grupo) -> llave con los que clasifican.
  if (formato === 'mixto') {
    const grupos = Math.max(1, Math.round(N / Math.max(2, equiposPorGrupo)))
    const eqPorGrupo = Math.max(2, Math.round(N / grupos))
    const jornadasGrupo = jornadasRoundRobin(eqPorGrupo) * mult
    const juegosGrupo = grupos * juegosRoundRobin(eqPorGrupo) * mult
    const clasifican = Math.min(N, grupos * clasificanPorGrupo)
    const fases = fasesEliminatoria(clasifican, 1)
    return {
      tipo: 'mixto',
      nombre: nombreFormato('mixto'),
      hayFaseRegular: true,
      grupos,
      equiposPorGrupo: eqPorGrupo,
      jornadasRegular: jornadasGrupo,
      ultimaJornadaRegular: jornadasGrupo,
      totalJuegosRegular: juegosGrupo,
      clasifican,
      fasesPlayoff: fases,
      totalJuegos: juegosGrupo + fases.reduce((s, f) => s + f.juegos, 0),
      nota: 'La votación del MVP abre en la última jornada de la fase de grupos.',
    }
  }

  // LIGA (por defecto): todos contra todos = la fase regular.
  const jornadas = jornadasRoundRobin(N) * mult
  const juegos = juegosRoundRobin(N) * mult
  return {
    tipo: 'liga',
    nombre: nombreFormato('liga'),
    hayFaseRegular: true,
    jornadasRegular: jornadas,
    ultimaJornadaRegular: jornadas,
    totalJuegosRegular: juegos,
    fasesPlayoff: [], // si la liga tiene playoff propio, se define aparte
    totalJuegos: juegos,
    nota: 'La votación del MVP abre en la última jornada de la temporada regular.',
  }
}

// ¿Es esta jornada la última de la temporada regular? (para abrir el MVP)
export function esUltimaSemanaRegular(jornadaActual, estructura) {
  if (!estructura || !estructura.hayFaseRegular || !estructura.ultimaJornadaRegular) return false
  return Number(jornadaActual) >= estructura.ultimaJornadaRegular
}

// ¿En qué jornada abre la votación del MVP? (null si el formato no tiene regular)
export function jornadaAbreMVP(estructura) {
  return estructura && estructura.hayFaseRegular ? estructura.ultimaJornadaRegular : null
}

// Atajo: construye la estructura directamente desde una fila `torneos`.
export function estructuraDesdeTorneo(torneo) {
  if (!torneo) return estructuraTorneo()
  return estructuraTorneo({
    formato: torneo.formato || 'liga',
    cantidadEquipos: torneo.cantidad_equipos || 8,
    idaYVuelta: !!torneo.ida_y_vuelta,
  })
}

// ============================================================================
//  GENERACIÓN DE ENFRENTAMIENTOS (el calendario real: quién juega vs quién)
//  Devuelve lista plana: { jornada, ronda?, equipoA_id, equipoB_id }
//  - liga: round-robin (todos contra todos) por el método del círculo.
//  - copa: primera ronda de la llave con siembra estándar (1vN, 2v(N-1)...).
//          Los mejor sembrados reciben "bye" si el total no es potencia de dos.
// ============================================================================

// Round-robin por método del círculo. Alterna A/B por jornada (cosmético).
function fixturesRoundRobin(ids, vueltas = 1) {
  const equipos = [...ids]
  if (equipos.length % 2 !== 0) equipos.push(null) // uno descansa si son impares
  const n = equipos.length
  const rondas = n - 1
  const mitad = n / 2
  // jornadas base de UNA vuelta (método del círculo)
  let arr = [...equipos]
  const base = []
  for (let r = 0; r < rondas; r++) {
    const juegos = []
    for (let i = 0; i < mitad; i++) {
      const a = arr[i], b = arr[n - 1 - i]
      if (a !== null && b !== null) juegos.push({ a, b })
    }
    base.push(juegos)
    const resto = arr.slice(1)
    resto.unshift(resto.pop()) // rota fijando el primero
    arr = [arr[0], ...resto]
  }
  // repite según la cantidad de vueltas; alterna local/visita por vuelta (cosmético)
  const V = Math.max(1, Math.round(Number(vueltas) || 1))
  const fixtures = []
  let jornada = 0
  for (let v = 0; v < V; v++) {
    base.forEach((juegos) => {
      jornada++
      juegos.forEach((g) => {
        const a = v % 2 === 0 ? g.a : g.b
        const b = v % 2 === 0 ? g.b : g.a
        fixtures.push({ jornada, equipoA_id: a, equipoB_id: b })
      })
    })
  }
  return fixtures
}

// Primera ronda de una llave de eliminación, con siembra estándar.
function fixturesCopaRonda1(ids) {
  const n = ids.length
  let bracket = 1
  while (bracket < n) bracket *= 2
  const byes = bracket - n // los mejor sembrados pasan directo
  const juegan = ids.slice(byes) // el resto juega la primera ronda
  const ronda = nombreRonda(n)
  const fixtures = []
  let i = 0, j = juegan.length - 1
  while (i < j) {
    fixtures.push({ jornada: 1, ronda, equipoA_id: juegan[i], equipoB_id: juegan[j] })
    i++; j--
  }
  return fixtures
}

// Punto de entrada: genera el calendario según el formato del torneo.
export function generarFixtures(idsEquipos = [], formato = 'liga', opciones = {}) {
  const ids = (idsEquipos || []).filter(Boolean)
  if (ids.length < 2) return []
  if (formato === 'copa') return generarLlaveCopaCompleta(ids)
  const vueltas = opciones.vueltas || (opciones.idaYVuelta ? 2 : 1) // compat con el toggle viejo
  return fixturesRoundRobin(ids, vueltas) // liga (y mixto por ahora)
}

// ============================================================================
//  MOTOR DE LLAVE DE COPA (eliminación directa, bien hecho)
//  - Bracket de potencia de dos con siembra estándar (1vN, 2v(N-1)...).
//  - Los mejor sembrados reciben BYE si los equipos no son potencia de dos.
//  - Cada juego lleva su "llave_pos" para que los ganadores siempre pasen al
//    lugar correcto del árbol, ronda tras ronda.
// ============================================================================

// Orden de siembra estándar para un bracket de tamaño B (potencia de dos).
// Devuelve los números de siembra 1..B en el orden de los espacios del árbol.
function ordenSiembra(B) {
  let seeds = [1, 2]
  while (seeds.length < B) {
    const n = seeds.length * 2
    const next = []
    for (const s of seeds) { next.push(s); next.push(n + 1 - s) }
    seeds = next
  }
  return seeds
}

// Primera ronda COMPLETA de la llave (con byes incluidos como pase directo).
// ids = equipos en orden de siembra (el primero es el sembrado #1).
// Devuelve: [{ jornada:1, llave_pos, equipoA_id, equipoB_id|null, bye:bool }]
export function generarLlaveCopaCompleta(ids) {
  const N = ids.length
  if (N < 2) return []
  let B = 1; while (B < N) B *= 2
  const seeds = ordenSiembra(B)
  const equipoDeSeed = (s) => (s <= N ? ids[s - 1] : null) // seed > N = BYE
  const fixtures = []
  for (let k = 0; k < B / 2; k++) {
    const a = equipoDeSeed(seeds[2 * k])
    const b = equipoDeSeed(seeds[2 * k + 1])
    if (a && b) fixtures.push({ jornada: 1, llave_pos: k, equipoA_id: a, equipoB_id: b, bye: false })
    else if (a || b) fixtures.push({ jornada: 1, llave_pos: k, equipoA_id: a || b, equipoB_id: null, bye: true })
  }
  return fixtures
}

// Dado los juegos de la ronda actual (ya terminados), calcula la SIGUIENTE ronda.
// Cada juego: { llave_pos, equipo_a, equipo_b, puntos_a, puntos_b }.
// equipo_b null = bye (gana equipo_a). Empate = sin ganador (no se puede avanzar).
// Devuelve { fixtures:[{jornada, llave_pos, equipoA_id, equipoB_id}], campeonId, faltan:bool }
export function siguienteRondaCopa(juegosRonda, jornadaActual) {
  const orden = [...(juegosRonda || [])].sort((x, y) => (x.llave_pos ?? 0) - (y.llave_pos ?? 0))
  const ganadores = []
  for (const j of orden) {
    if (j.equipo_b == null) { ganadores.push(j.equipo_a); continue } // bye
    const pa = Number(j.puntos_a) || 0, pb = Number(j.puntos_b) || 0
    if (pa === pb) return { fixtures: [], campeonId: null, faltan: true } // empate sin resolver
    ganadores.push(pa > pb ? j.equipo_a : j.equipo_b)
  }
  if (ganadores.length <= 1) return { fixtures: [], campeonId: ganadores[0] || null, faltan: false }
  const fixtures = []
  for (let k = 0; k < Math.floor(ganadores.length / 2); k++) {
    fixtures.push({ jornada: (jornadaActual || 1) + 1, llave_pos: k, equipoA_id: ganadores[2 * k], equipoB_id: ganadores[2 * k + 1] })
  }
  return { fixtures, campeonId: null, faltan: false }
}