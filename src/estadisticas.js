// ============================================================================
//  ESTADÍSTICAS POR MODO — la "libreta de récords" de cada jugador.
//  Cada vez que termina un juego, por cada jugador REGISTRADO (con MC-ID) se
//  guarda una línea: su formato (1v1, 2v2...), si ganó, sus puntos y las demás
//  estadísticas QUE SE MIDIERON en ese juego (las que no se midieron quedan en
//  blanco, y el promedio las ignora). Así cada dato es real.
//  Tabla: jugador_stats.
// ============================================================================
import { supabase } from './supabaseClient'

// Estadísticas promediables además de los puntos (que siempre se miden).
const STATS_NUM = ['reb', 'ast', 'rob', 'tap', 'per', 'tl', 'min', 'fall']

// Orden bonito de los modos al mostrarlos.
const ORDEN_MODO = ['1v1', '2v2', '3v3', '4v4', '5v5']

// ---------------------------------------------------------------------------
//  GUARDAR la línea de cada jugador registrado al terminar un juego.
//  Se llama desde los tres tipos de juego (rápido, liga, torneo).
//    formato:      '1v1' | '2v2' | '3v3' | '4v4' | '5v5'
//    jugadores:    [{ equipo: 0|1, perfilId, pts, reb, ast, rob, tap, ... }]
//    statsActivas: ['pts','reb',...]  -> qué se midió en ESTE juego
//    origen:       'rapido' | 'liga' | 'torneo'  (DE DÓNDE viene)
//    ligaId:       uuid de la liga (si origen es 'liga'), si no null
//    torneoId:     uuid del torneo (si origen es 'torneo'), si no null
//
//  La regla: lo PERSONAL del perfil suma rápido + liga + fogueo. Los TORNEOS
//  van aparte (se reconocen porque llevan torneo_id).
// ---------------------------------------------------------------------------
export async function registrarStatsJugadores({ formato, jugadores = [], statsActivas = ['pts'], origen = 'rapido', ligaId = null, torneoId = null }) {
  try {
    if (!formato || !jugadores.length) return { ok: false, guardadas: 0 }

    // ¿Quién ganó? Por el total de puntos de cada equipo (0 = A, 1 = B).
    const totalEq = (eq) => jugadores.filter((j) => j.equipo === eq).reduce((a, j) => a + (Number(j.pts) || 0), 0)
    const tA = totalEq(0), tB = totalEq(1)
    const ganadorEq = tA === tB ? null : (tA > tB ? 0 : 1)

    const filas = []
    jugadores.forEach((j) => {
      if (!j || !j.perfilId) return  // SOLO jugadores con MC-ID (los nombres sueltos no acumulan)
      const fila = {
        perfil_id: j.perfilId,
        formato,
        origen,
        liga_id: ligaId || null,
        torneo_id: torneoId || null,
        gano: ganadorEq !== null && j.equipo === ganadorEq,
        pts: Number(j.pts) || 0,
      }
      // Cada stat: si se midió en este juego, se guarda su valor; si no, queda null
      // (y el promedio la ignora — exactamente la lógica correcta).
      STATS_NUM.forEach((s) => {
        fila[s] = statsActivas.includes(s) ? (Number(j[s]) || 0) : null
      })
      filas.push(fila)
    })

    if (!filas.length) return { ok: true, guardadas: 0 }
    const { error } = await supabase.from('jugador_stats').insert(filas)
    return { ok: !error, error: error ? error.message : null, guardadas: error ? 0 : filas.length }
  } catch (e) {
    return { ok: false, error: e.message, guardadas: 0 }
  }
}

// ---------------------------------------------------------------------------
//  Agrupador interno: toma filas y las agrupa por modo, sacando promedios
//  (ignorando los juegos donde no se midió cada estadística).
// ---------------------------------------------------------------------------
function agruparPorModo(filas) {
  const porModo = {}
  filas.forEach((r) => {
    const m = porModo[r.formato] || (porModo[r.formato] = { formato: r.formato, juegos: 0, ganados: 0, sum: {}, cnt: {} })
    m.juegos += 1
    if (r.gano) m.ganados += 1
    ;['pts', ...STATS_NUM].forEach((s) => {
      if (r[s] != null) {
        m.sum[s] = (m.sum[s] || 0) + Number(r[s])
        m.cnt[s] = (m.cnt[s] || 0) + 1
      }
    })
  })

  const prom = (m, s) => (m.cnt[s] ? m.sum[s] / m.cnt[s] : null)
  const lista = Object.values(porModo).map((m) => {
    const o = {
      formato: m.formato,
      juegos: m.juegos,
      winPct: m.juegos ? Math.round((m.ganados / m.juegos) * 100) : 0,
    }
    ;['pts', ...STATS_NUM].forEach((s) => { o[s] = prom(m, s) })
    return o
  })
  lista.sort((a, b) => {
    const ia = ORDEN_MODO.indexOf(a.formato), ib = ORDEN_MODO.indexOf(b.formato)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
  return lista
}

// ---------------------------------------------------------------------------
//  PROMEDIOS PERSONALES por modo (para el perfil).
//  Suma rápido + liga + fogueo. Los TORNEOS NO entran aquí (van aparte).
// ---------------------------------------------------------------------------
export async function promediosPorModo(perfilId) {
  if (!perfilId) return []
  const { data, error } = await supabase
    .from('jugador_stats')
    .select('*')
    .eq('perfil_id', perfilId)
    .is('torneo_id', null)   // <- excluye torneos: lo personal es suelto + liga + fogueo
  if (error || !data) return []
  return agruparPorModo(data)
}

// ---------------------------------------------------------------------------
//  PROMEDIOS DE UN JUGADOR DENTRO DE UN TORNEO (aparte de lo personal).
// ---------------------------------------------------------------------------
export async function promediosEnTorneo(perfilId, torneoId) {
  if (!perfilId || !torneoId) return []
  const { data, error } = await supabase
    .from('jugador_stats')
    .select('*')
    .eq('perfil_id', perfilId)
    .eq('torneo_id', torneoId)
  if (error || !data) return []
  return agruparPorModo(data)
}

// ---------------------------------------------------------------------------
//  PROMEDIOS DE UN JUGADOR DENTRO DE UNA LIGA (la liga como su propio mundo).
// ---------------------------------------------------------------------------
export async function promediosEnLiga(perfilId, ligaId) {
  if (!perfilId || !ligaId) return []
  const { data, error } = await supabase
    .from('jugador_stats')
    .select('*')
    .eq('perfil_id', perfilId)
    .eq('liga_id', ligaId)
  if (error || !data) return []
  return agruparPorModo(data)
}