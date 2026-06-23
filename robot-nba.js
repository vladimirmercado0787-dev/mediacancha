// =====================================================================
//  ROBOT NBA · Media Cancha  (temporada actual)
//  Jala la data de la API pública de ESPN (sin clave) y la mete en Supabase.
//  Llena: nba_equipos, nba_jugadores, nba_stats_temporada (temporada actual),
//         nba_standing, nba_juegos, nba_juego_jugadores (box score).
//  De aquí sale el ADN MC (rating) de cada jugador.
//
//  CÓMO CORRERLO (todo en UNA línea, en la terminal, parado en mediacancha):
//      SUPABASE_SERVICE_KEY="PEGA_AQUI_TU_SERVICE_KEY" node robot-nba.js
//  Copia toda la salida y pásamela.
//
//  ⚠️ La SERVICE KEY es secreta. NUNCA la metas dentro de un archivo que
//     vayas a subir a GitHub. Por eso va por la terminal, no en el código.
//
//  La historia (2000 en adelante) la mete robot-nba-historico.js (va aparte,
//  se corre una sola vez). Este de aquí es el de la temporada actual.
// =====================================================================

const SUPABASE_URL = 'https://cbpuhfuojfvvkudapgki.supabase.co'; // mismo proyecto que la LNB
const KEY = process.env.SUPABASE_SERVICE_KEY;

if (!KEY) {
  console.log('ERROR: falta la service key. Corre así:');
  console.log('  SUPABASE_SERVICE_KEY="tu_key" node robot-nba.js');
  process.exit(1);
}

const TEMPORADA = 2026;   // año en que termina la temporada actual (2025-26)
const SEASONTYPE = 2;     // 2 = temporada regular

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';
const SITEV2 = 'https://site.api.espn.com/apis/v2/sports/basketball/nba';
const WEB = 'https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba';
const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh)', accept: 'application/json' } };

// siglas que ESPN escribe distinto a las nuestras
const NORM = { GS: 'GSW', NY: 'NYK', SA: 'SAS', NO: 'NOP', UTAH: 'UTA', UTH: 'UTA', WSH: 'WAS', PHO: 'PHX', NOR: 'NOP' };
const normAbv = (a) => { const x = (a || '').toUpperCase(); return NORM[x] || x; };

// conferencia por equipo (estable; los equipos no cambian de conferencia)
const CONF = {
  ATL: 'este', BOS: 'este', BKN: 'este', CHA: 'este', CHI: 'este', CLE: 'este', DET: 'este', IND: 'este',
  MIA: 'este', MIL: 'este', NYK: 'este', ORL: 'este', PHI: 'este', TOR: 'este', WAS: 'este',
  DAL: 'oeste', DEN: 'oeste', GSW: 'oeste', HOU: 'oeste', LAC: 'oeste', LAL: 'oeste', MEM: 'oeste',
  MIN: 'oeste', NOP: 'oeste', OKC: 'oeste', PHX: 'oeste', POR: 'oeste', SAC: 'oeste', SAS: 'oeste', UTA: 'oeste',
};

async function getJson(url) {
  const res = await fetch(url, UA);
  if (!res.ok) throw new Error(`HTTP ${res.status} → ${url.slice(0, 80)}`);
  return res.json();
}

async function upsert(table, rows, onConflict) {
  if (!rows || !rows.length) { console.log(`  · ${table}: 0 filas (nada que subir)`); return; }
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`${table}: HTTP ${res.status} → ${t}`); }
  console.log(`  ✓ ${table}: ${rows.length} filas`);
}

const num = (v) => { const n = Number(v); return isNaN(n) ? null : n; };

// ---------- EQUIPOS ----------
async function traerEquipos() {
  const data = await getJson(`${SITE}/teams`);
  const lista = data?.sports?.[0]?.leagues?.[0]?.teams || [];
  return lista.map(({ team }) => {
    const abv = normAbv(team?.abbreviation);
    return {
      abv,
      nombre: team?.shortDisplayName || team?.name || '',
      nombre_full: team?.displayName || '',
      conferencia: CONF[abv] || null,
      color: team?.color ? '#' + String(team.color).replace('#', '') : null,
      logo_url: null, // logos = marca registrada; los dejamos vacíos
    };
  }).filter((t) => t.abv);
}

// ---------- JUGADORES + STATS DE TEMPORADA (byathlete) ----------
// El valor vive alineado: los NOMBRES están en data.categories[].names y los
// VALORES en item.categories[].totals (mismo índice, misma categoría).
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

async function traerJugadoresYStats() {
  const jugadores = new Map();
  const stats = [];
  const limit = 50;
  for (let page = 1; page <= 20; page++) {
    const url = `${WEB}/statistics/byathlete?region=us&lang=en&contentorigin=espn&isqualified=false`
      + `&page=${page}&limit=${limit}&sort=offensive.avgPoints:desc&season=${TEMPORADA}&seasontype=${SEASONTYPE}`;
    let data;
    try { data = await getJson(url); } catch (e) { console.log(`  · byathlete page ${page}: ${e.message}`); break; }
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
        temporada: TEMPORADA,
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
    if (arr.length < limit) break; // última página
    await new Promise((r) => setTimeout(r, 150));
  }
  return { jugadores: [...jugadores.values()], stats };
}

// ---------- CLASIFICACIÓN ----------
async function traerStanding() {
  const data = await getJson(`${SITEV2}/standings?region=us&lang=en&contentorigin=espn&type=0&level=3&sort=playoffseed:asc`);
  const grupos = Array.isArray(data?.children) ? data.children
    : Array.isArray(data?.standings?.groups) ? data.standings.groups : [];
  const out = [];
  const recoger = (g) => {
    let e = g?.standings?.entries || g?.entries || [];
    if ((!e || !e.length) && Array.isArray(g?.children)) e = g.children.flatMap((d) => d?.standings?.entries || d?.entries || []);
    return e || [];
  };
  const statVal = (st, name) => { const s = (st || []).find((x) => x?.name === name || x?.type === name); return s ? (s.value ?? s.displayValue) : undefined; };
  grupos.forEach((g, idx) => {
    const nm = (g?.abbreviation || g?.name || '').toLowerCase();
    const lado = nm.includes('east') ? 'este' : nm.includes('west') ? 'oeste' : (idx === 0 ? 'este' : 'oeste');
    let filas = recoger(g).map((e) => {
      const t = e?.team || {}; const st = e?.stats || [];
      return { abv: normAbv(t?.abbreviation), w: Number(statVal(st, 'wins')) || 0, l: Number(statVal(st, 'losses')) || 0, racha: String(statVal(st, 'streak') ?? '') };
    }).filter((f) => f.abv);
    filas.sort((a, b) => (b.w - a.w) || (a.l - b.l));
    const lider = filas[0];
    filas.forEach((f, k) => {
      const gb = lider ? ((lider.w - f.w) + (f.l - lider.l)) / 2 : 0;
      out.push({ temporada: TEMPORADA, conferencia: lado, equipo_abv: f.abv, pos: k + 1, w: f.w, l: f.l, gb: gb > 0 ? String(gb) : '—', racha: f.racha });
    });
  });
  return out;
}

// ---------- JUEGOS + BOX SCORE (ventana de días recientes) ----------
function ymd(d) { return d.toISOString().slice(0, 10).replace(/-/g, ''); }
async function traerJuegosYBox(dias = 3) {
  const juegos = [];
  const box = [];
  const hoy = new Date();
  const fechas = [];
  for (let i = dias; i >= 0; i--) { const d = new Date(hoy); d.setDate(hoy.getDate() - i); fechas.push(ymd(d)); }
  for (const f of fechas) {
    let data;
    try { data = await getJson(`${SITE}/scoreboard?dates=${f}`); } catch (e) { continue; }
    for (const ev of (data?.events || [])) {
      const comp = ev?.competitions?.[0] || {};
      const cs = comp?.status || ev?.status || {};
      const state = cs?.type?.state || 'pre';
      const lado = (ha) => (comp?.competitors || []).find((x) => x?.homeAway === ha) || {};
      const h = lado('home'), a = lado('away');
      const habv = normAbv(h?.team?.abbreviation), aabv = normAbv(a?.team?.abbreviation);
      const hs = (h?.score != null && h.score !== '') ? Number(h.score) : null;
      const as = (a?.score != null && a.score !== '') ? Number(a.score) : null;
      juegos.push({
        id: String(ev?.id), temporada: TEMPORADA, fecha: ev?.date || null,
        estado: state === 'in' ? 'vivo' : state === 'post' ? 'final' : 'previa',
        local_abv: habv, visita_abv: aabv, local_score: hs, visita_score: as,
        ganador_abv: h?.winner ? habv : a?.winner ? aabv : null,
      });
      if (state === 'post') {
        try {
          const sum = await getJson(`${SITE}/summary?event=${ev?.id}`);
          for (const tb of (sum?.boxscore?.players || [])) {
            const abv = normAbv(tb?.team?.abbreviation);
            const grp = (tb?.statistics || [])[0] || {};
            const labels = grp?.names || grp?.keys || grp?.labels || [];
            const idxOf = (k) => labels.findIndex((x) => String(x).toUpperCase() === k);
            const iMin = idxOf('MIN'), iPts = idxOf('PTS'), iReb = idxOf('REB'), iAst = idxOf('AST'), iStl = idxOf('STL'), iBlk = idxOf('BLK'), iTo = idxOf('TO');
            for (const ath of (grp?.athletes || [])) {
              const pid = String(ath?.athlete?.id || '');
              const st = ath?.stats || [];
              if (!pid || !st.length) continue;
              box.push({
                juego_id: String(ev?.id), jugador_id: pid, equipo_abv: abv,
                minutos: iMin >= 0 ? num(st[iMin]) : null, puntos: iPts >= 0 ? num(st[iPts]) : null,
                rebotes: iReb >= 0 ? num(st[iReb]) : null, asistencias: iAst >= 0 ? num(st[iAst]) : null,
                robos: iStl >= 0 ? num(st[iStl]) : null, tapones: iBlk >= 0 ? num(st[iBlk]) : null, perdidas: iTo >= 0 ? num(st[iTo]) : null,
              });
            }
          }
        } catch (e) { /* si un box falla, seguimos con los demás */ }
        await new Promise((r) => setTimeout(r, 120));
      }
    }
  }
  return { juegos, box };
}

async function main() {
  console.log('========== ROBOT NBA — arrancando ==========');
  console.log(`Temporada ${TEMPORADA}`);
  const safe = async (label, fn, def) => { try { return await fn(); } catch (e) { console.log(`  ⚠️ ${label}: ${e.message}`); return def; } };

  console.log('\nTrayendo de ESPN...');
  const equipos = await safe('equipos', traerEquipos, []);
  console.log(`  equipos: ${equipos.length}`);
  const js = await safe('jugadores/stats', traerJugadoresYStats, { jugadores: [], stats: [] });
  console.log(`  jugadores: ${js.jugadores.length} · líneas de stats: ${js.stats.length}`);
  const standing = await safe('standing', traerStanding, []);
  console.log(`  standing: ${standing.length} filas`);
  const jb = await safe('juegos/box', () => traerJuegosYBox(3), { juegos: [], box: [] });
  console.log(`  juegos: ${jb.juegos.length} · box score: ${jb.box.length} líneas`);

  console.log('\nSubiendo a Supabase...');
  await upsert('nba_equipos', equipos, 'abv');
  await upsert('nba_jugadores', js.jugadores, 'id');
  await upsert('nba_stats_temporada', js.stats, 'jugador_id,temporada');
  await upsert('nba_standing', standing, 'temporada,conferencia,equipo_abv');
  await upsert('nba_juegos', jb.juegos, 'id');
  await upsert('nba_juego_jugadores', jb.box, 'juego_id,jugador_id');

  console.log('\n========== ROBOT NBA — TERMINÓ ✓ ==========');
  console.log('Copia toda esta salida y pásamela.');
}

main().catch((e) => { console.log('\n💥 ERROR:', e.message); process.exit(1); });
