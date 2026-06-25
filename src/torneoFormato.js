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
  if (formato === 'copa') return fixturesCopaRonda1(ids)
  const vueltas = opciones.vueltas || (opciones.idaYVuelta ? 2 : 1) // compat con el toggle viejo
  return fixturesRoundRobin(ids, vueltas) // liga (y mixto por ahora)
}