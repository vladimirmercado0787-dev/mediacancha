// =====================================================================
//  ROBOT NBA HISTÓRICO · Media Cancha  (temporadas 2000 → 2025)
//  Trae los PROMEDIOS de temporada de cada jugador, año por año, desde la
//  API pública de ESPN, y los guarda en nba_stats_temporada.
//  Es BARATO (solo promedios, no box scores). Con esto el ADN MC y las
//  fichas pueden mostrar la carrera completa de cada jugador.
//
//  SE CORRE UNA SOLA VEZ (o de vez en cuando). El robot-nba.js normal sigue
//  encargándose de la temporada actual y los juegos.
//
//  CÓMO CORRERLO (UNA línea, en la terminal, parado en mediacancha):
//      SUPABASE_SERVICE_KEY="PEGA_AQUI_TU_SERVICE_KEY" node robot-nba-historico.js
//  Tarda uno o dos minutos (son 26 temporadas). Copia la salida y pásamela.
//
//  ⚠️ La SERVICE KEY es secreta. Nunca la metas dentro del archivo.
// =====================================================================

const SUPABASE_URL = 'https://cbpuhfuojfvvkudapgki.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_KEY;

if (!KEY) {
  console.log('ERROR: falta la service key. Corre así:');
  console.log('  SUPABASE_SERVICE_KEY="tu_key" node robot-nba-historico.js');
  process.exit(1);
}

const DESDE = 2000;   // primera temporada (año en que termina)
const HASTA = 2025;   // última (la actual, 2026, la lleva el robot normal)
const SEASONTYPE = 2; // temporada regular

const WEB = 'https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba';
const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh)', accept: 'application/json' } };

const NORM = { GS: 'GSW', NY: 'NYK', SA: 'SAS', NO: 'NOP', UTAH: 'UTA', UTH: 'UTA', WSH: 'WAS', PHO: 'PHX', NOR: 'NOP' };
const normAbv = (a) => { const x = (a || '').toUpperCase(); return NORM[x] || x; };
const num = (v) => { const n = Number(v); return isNaN(n) ? null : n; };

async function getJson(url) {
  const res = await fetch(url, UA);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// upsert normal (actualiza si ya existe)
async function upsert(table, rows, onConflict) {
  if (!rows || !rows.length) return 0;
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`${table}: HTTP ${res.status} → ${t}`); }
  return rows.length;
}

// upsert que IGNORA duplicados: agrega jugadores retirados nuevos SIN pisar
// el equipo actual de los jugadores activos (que ya puso el robot normal).
async function upsertIgnore(table, rows, onConflict) {
  if (!rows || !rows.length) return 0;
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`${table}: HTTP ${res.status} → ${t}`); }
  return rows.length;
}

function hazExtractor(data) {
  const topCats = data?.categories || [];
  return (item, statName) => {
    const athCats = item?.categories || [];
    for (let i = 0; i < topCats.length; i++) {
      const names = topCats[i]?.names || [];
      const idx = names.indexOf(statName);
      if (idx < 0) continue;
      let ac = athCats[i];
      if (!ac || !(ac.totals || ac.values)) ac = athCats.find((a) => a?.name === topCats[i]?.name) || ac;
      const vals = ac?.totals || ac?.values || [];
      if (vals[idx] != null) return num(vals[idx]);
    }
    return null;
  };
}

// trae TODOS los jugadores + promedios de UNA temporada
async function traerTemporada(temp) {
  const jugadores = new Map();
  const stats = [];
  const limit = 50;
  for (let page = 1; page <= 20; page++) {
    const url = `${WEB}/statistics/byathlete?region=us&lang=en&contentorigin=espn&isqualified=false`
      + `&page=${page}&limit=${limit}&sort=offensive.avgPoints:desc&season=${temp}&seasontype=${SEASONTYPE}`;
    let data;
    try { data = await getJson(url); } catch (e) { break; }
    const arr = data?.athletes || [];
    if (!arr.length) break;
    const val = hazExtractor(data);
    for (const item of arr) {
      const at = item?.athlete || {};
      const id = String(at?.id || '');
      if (!id) continue;
      const abv = normAbv(at?.teams?.[0]?.abbreviation || at?.team?.abbreviation || at?.teamShortName);
      jugadores.set(id, {
        id,
        nombre: at?.displayName || '',
        equipo_abv: abv || null,
        posicion: at?.position?.abbreviation || at?.position?.name || null,
        dorsal: at?.jersey != null ? String(at.jersey) : null,
        foto_url: null,
      });
      stats.push({
        jugador_id: id,
        temporada: temp,
        equipo_abv: abv || null,
        juegos: val(item, 'gamesPlayed'),
        minutos: val(item, 'avgMinutes'),
        puntos: val(item, 'avgPoints'),
        rebotes: val(item, 'avgRebounds'),
        asistencias: val(item, 'avgAssists'),
        robos: val(item, 'avgSteals'),
        tapones: val(item, 'avgBlocks'),
        perdidas: val(item, 'avgTurnovers'),
        fg_pct: val(item, 'fieldGoalPct'),
        tp_pct: val(item, 'threePointFieldGoalPct'),
        ft_pct: val(item, 'freeThrowPct'),
        efficiency: null,
      });
    }
    if (arr.length < limit) break;
    await new Promise((r) => setTimeout(r, 150));
  }
  return { jugadores: [...jugadores.values()], stats };
}

async function main() {
  console.log('===== ROBOT NBA HISTÓRICO — arrancando =====');
  console.log(`Temporadas ${DESDE} a ${HASTA} (de la más nueva a la más vieja)\n`);

  let totalStats = 0;
  let totalJug = 0;

  // de la más nueva a la más vieja: así el equipo guardado del retirado es el de su último año
  for (let temp = HASTA; temp >= DESDE; temp--) {
    let res;
    try {
      const { jugadores, stats } = await traerTemporada(temp);
      const nj = await upsertIgnore('nba_jugadores', jugadores, 'id');
      const ns = await upsert('nba_stats_temporada', stats, 'jugador_id,temporada');
      totalJug += jugadores.length;
      totalStats += ns;
      console.log(`  ${temp}: ${stats.length} stats subidas (jugadores vistos: ${jugadores.length})`);
    } catch (e) {
      console.log(`  ${temp}: ⚠️ ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 300)); // cortesía con ESPN
  }

  console.log(`\nTotal de líneas de stats subidas: ${totalStats}`);
  console.log('===== ROBOT NBA HISTÓRICO — TERMINÓ ✓ =====');
  console.log('Copia toda esta salida y pásamela.');
}

main().catch((e) => { console.log('\n💥 ERROR:', e.message); process.exit(1); });
