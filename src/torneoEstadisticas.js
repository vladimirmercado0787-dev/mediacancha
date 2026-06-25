// ============================================================
//  torneoEstadisticas.js
//  Motor de ESTADÍSTICA del torneo — LÓGICA PURA (sin base de datos).
//  Toma datos en JavaScript y calcula: tabla de posiciones, líderes,
//  MC Rating, Top 10 y candidatos al MVP.
//
//  FORMAS DE DATOS QUE ESPERA (cuando se conecte a Supabase, se mapean
//  las filas de las tablas a estas formas):
//
//    equipo = { id, nombre, escudo? }
//
//    juego  = { id, jornada, fecha, estado:'final'|'vivo'|'proximo',
//               equipoA_id, equipoB_id, puntosA, puntosB,
//               parcialesA:[q1,q2,...], parcialesB:[...] }   // parciales = opcional
//
//    stat   = { juego_id, jornada, jugador_id, equipo_id, nombre, numero?,
//               puntos, rebotes, asistencias, robos, tapones, perdidas,
//               tcInt?,tcAnot?, tpInt?,tpAnot?, tlInt?,tlAnot? }  // 1 fila por jugador por juego
// ============================================================

// ----- Ajustes (se pueden tocar sin miedo) -----
export const PESO_RECORD_MVP = 15     // cuánto suma el récord del equipo al puntaje MVP (0 = no cuenta)
export const MIN_JUEGOS_MVP = 2       // juegos mínimos para entrar al ranking de MVP
export const EXPONENTE_RATING = 0.85  // levanta el medio (mismo criterio que NBA/LNB)

const num = (v) => (typeof v === 'number' && !isNaN(v) ? v : 0)

// ---------- TABLA DE POSICIONES ----------
export function calcularTabla(equipos = [], juegos = []) {
  const fila = {}
  equipos.forEach((e) => {
    fila[e.id] = {
      equipo_id: e.id, nombre: e.nombre || 'Equipo', escudo: e.escudo || null,
      jugados: 0, ganados: 0, perdidos: 0, puntosFavor: 0, puntosContra: 0,
    }
  })
  juegos.filter((j) => j.estado === 'final').forEach((j) => {
    const a = fila[j.equipoA_id], b = fila[j.equipoB_id]
    if (!a || !b) return
    const pa = num(j.puntosA), pb = num(j.puntosB)
    a.jugados++; b.jugados++
    a.puntosFavor += pa; a.puntosContra += pb
    b.puntosFavor += pb; b.puntosContra += pa
    if (pa > pb) { a.ganados++; b.perdidos++ }
    else if (pb > pa) { b.ganados++; a.perdidos++ }
  })
  const tabla = Object.values(fila).map((f) => ({
    ...f,
    pct: f.jugados ? f.ganados / f.jugados : 0,
    dif: f.puntosFavor - f.puntosContra,
    puntos: f.ganados * 2, // 2 por victoria (estándar; se puede cambiar)
  }))
  tabla.sort((x, y) => y.ganados - x.ganados || y.pct - x.pct || y.dif - x.dif || x.nombre.localeCompare(y.nombre))
  return tabla.map((f, i) => ({ ...f, posicion: i + 1 }))
}

export function pctVictorias(tabla, equipoId) {
  const e = tabla.find((t) => t.equipo_id === equipoId)
  return e ? e.pct : 0
}

// ---------- AGREGAR ESTADÍSTICA POR JUGADOR ----------
//  Junta todas las filas de un jugador y saca totales + promedios + %.
export function agregarJugadores(stats = []) {
  const m = {}
  stats.forEach((s) => {
    const id = s.jugador_id
    if (id == null) return
    if (!m[id]) {
      m[id] = {
        jugador_id: id, equipo_id: s.equipo_id, nombre: s.nombre || 'Jugador', numero: s.numero ?? null,
        juegos: 0,
        tot: { puntos: 0, rebotes: 0, asistencias: 0, robos: 0, tapones: 0, perdidas: 0,
               tcInt: 0, tcAnot: 0, tpInt: 0, tpAnot: 0, tlInt: 0, tlAnot: 0 },
      }
    }
    const t = m[id].tot
    m[id].juegos++
    t.puntos += num(s.puntos); t.rebotes += num(s.rebotes); t.asistencias += num(s.asistencias)
    t.robos += num(s.robos); t.tapones += num(s.tapones); t.perdidas += num(s.perdidas)
    t.tcInt += num(s.tcInt); t.tcAnot += num(s.tcAnot)
    t.tpInt += num(s.tpInt); t.tpAnot += num(s.tpAnot)
    t.tlInt += num(s.tlInt); t.tlAnot += num(s.tlAnot)
  })
  return Object.values(m).map((j) => {
    const g = j.juegos || 1
    const prom = {
      puntos: j.tot.puntos / g, rebotes: j.tot.rebotes / g, asistencias: j.tot.asistencias / g,
      robos: j.tot.robos / g, tapones: j.tot.tapones / g, perdidas: j.tot.perdidas / g,
    }
    const pct = {
      tc: j.tot.tcInt ? j.tot.tcAnot / j.tot.tcInt : null,
      tp: j.tot.tpInt ? j.tot.tpAnot / j.tot.tpInt : null,
      tl: j.tot.tlInt ? j.tot.tlAnot / j.tot.tlInt : null,
    }
    const efTotal = j.tot.puntos + j.tot.rebotes + j.tot.asistencias + j.tot.robos + j.tot.tapones - j.tot.perdidas
    return { ...j, prom, pct, efPorJuego: efTotal / g }
  })
}

// ---------- MC RATING (0 a 100) ----------
export function mcRating(efPorJuego, maxEf) {
  if (!maxEf || maxEf <= 0) return 0
  const base = Math.max(0, efPorJuego) / maxEf
  return Math.round(100 * Math.pow(base, EXPONENTE_RATING))
}

export function conRating(jugadores = []) {
  const maxEf = jugadores.reduce((mx, j) => Math.max(mx, j.efPorJuego || 0), 0)
  return jugadores.map((j) => ({ ...j, mcRating: mcRating(j.efPorJuego, maxEf) }))
}

// ---------- RANKING / TOP 10 / CANDIDATOS AL MVP ----------
//  Mezcla el MC Rating individual con un BONO por el récord del equipo,
//  para que el MVP casi siempre salga de los equipos de arriba.
export function rankingTorneo(jugadores = [], tabla = []) {
  const conR = conRating(jugadores)
  const rank = conR.map((j) => {
    const pv = pctVictorias(tabla, j.equipo_id) // 0..1
    const bonoRecord = Math.round(pv * PESO_RECORD_MVP)
    return { ...j, bonoRecord, puntajeMVP: (j.mcRating || 0) + bonoRecord }
  })
  rank.sort((a, b) => b.puntajeMVP - a.puntajeMVP || (b.mcRating || 0) - (a.mcRating || 0) || b.prom.puntos - a.prom.puntos)
  return rank.map((j, i) => ({ ...j, posicion: i + 1 }))
}

export function top10(jugadores = [], tabla = []) {
  return rankingTorneo(jugadores, tabla).slice(0, 10)
}

//  Los 3 primeros (con juegos suficientes) entran a la votación del MVP.
export function candidatosMVP(jugadores = [], tabla = []) {
  return rankingTorneo(jugadores, tabla)
    .filter((j) => j.juegos >= MIN_JUEGOS_MVP)
    .slice(0, 3)
}

// ---------- LÍDERES POR CATEGORÍA (top 5) ----------
//  `config` = el objeto estadisticas del torneo (pts/reb/ast/rob/tap/tri/per/pct_tc/pct_tp/pct_tl/ef).
//  Si se pasa, solo se incluyen las categorías activadas en ese torneo. Sin config, se incluyen todas.
const CATEGORIAS = [
  { id: 'puntos',      stat: 'pts',    titulo: 'Puntos',           sub: 'por juego', tipo: 'prom',    campo: 'puntos' },
  { id: 'rebotes',     stat: 'reb',    titulo: 'Rebotes',          sub: 'por juego', tipo: 'prom',    campo: 'rebotes' },
  { id: 'asistencias', stat: 'ast',    titulo: 'Asistencias',      sub: 'por juego', tipo: 'prom',    campo: 'asistencias' },
  { id: 'robos',       stat: 'rob',    titulo: 'Robos',            sub: 'por juego', tipo: 'prom',    campo: 'robos' },
  { id: 'tapones',     stat: 'tap',    titulo: 'Tapones',          sub: 'por juego', tipo: 'prom',    campo: 'tapones' },
  { id: 'triples',     stat: 'tri',    titulo: 'Triples',          sub: 'por juego', tipo: 'totProm', campo: 'tpAnot' },
  { id: 'perdidas',    stat: 'per',    titulo: 'Pérdidas',         sub: 'por juego', tipo: 'prom',    campo: 'perdidas' },
  { id: 'pct_tc',      stat: 'pct_tc', titulo: '% Tiros de campo', sub: 'de acierto', tipo: 'pct', esPct: true, campo: 'tc', intCampo: 'tcInt', min: 10 },
  { id: 'pct_tp',      stat: 'pct_tp', titulo: '% Triples',        sub: 'de acierto', tipo: 'pct', esPct: true, campo: 'tp', intCampo: 'tpInt', min: 5 },
  { id: 'pct_tl',      stat: 'pct_tl', titulo: '% Tiros libres',   sub: 'de acierto', tipo: 'pct', esPct: true, campo: 'tl', intCampo: 'tlInt', min: 5 },
  { id: 'eficiencia',  stat: 'ef',     titulo: 'Eficiencia',       sub: 'por juego', tipo: 'ef' },
]
export function lideres(jugadores = [], cuantos = 5, config = null) {
  const r1 = (n) => Math.round((n || 0) * 10) / 10
  const cats = config ? CATEGORIAS.filter((c) => config[c.stat]) : CATEGORIAS
  return cats.map((c) => {
    let elegibles = [...jugadores].filter((j) => j.juegos > 0)
    let valorDe
    if (c.tipo === 'totProm') valorDe = (j) => (j.tot[c.campo] || 0) / (j.juegos || 1)
    else if (c.tipo === 'ef') valorDe = (j) => j.efPorJuego || 0
    else if (c.tipo === 'pct') {
      elegibles = elegibles.filter((j) => j.pct[c.campo] != null && (j.tot[c.intCampo] || 0) >= c.min)
      valorDe = (j) => (j.pct[c.campo] || 0) * 100
    } else valorDe = (j) => j.prom[c.campo] || 0 // 'prom'
    const filas = elegibles
      .sort((a, b) => valorDe(b) - valorDe(a))
      .slice(0, cuantos)
      .map((j) => ({ jugador_id: j.jugador_id, nombre: j.nombre, equipo_id: j.equipo_id, valor: r1(valorDe(j)) }))
    return { id: c.id, titulo: c.titulo, sub: c.sub, esPct: !!c.esPct, filas }
  })
}