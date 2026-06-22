// =====================================================================
//  ROBOT LNB · Media Cancha  (Fase 1 + Fase 4 jugadores + Fase 5 box score)
//  Jala la data de lnb.do (JSON limpio) y la mete en Supabase.
//  Sólido: busca el buildId fresco cada vez, así nunca se rompe
//  cuando la liga actualiza su sitio.
//
//  FASE 4: róster de cada equipo → TODOS los jugadores (lnb_jugadores).
//  FASE 5 (NUEVO): box score por jugador por partido (lnb_juego_jugadores).
//     Ruta del detalle: /_next/data/${buildId}/partido/x/${id}.json
//     Las líneas viven en match.teams[].players[].statistics
//     (Primero corre el SQL lnb_juego_jugadores.sql en Supabase.)
//
//  CÓMO CORRERLO:
//    1. En la terminal, pega tu service key y corre (todo en una línea):
//         SUPABASE_SERVICE_KEY="PEGA_AQUI_TU_SERVICE_KEY" node robot-lnb.js
//    2. Copia toda la salida y pásamela.
//
//  ⚠️ La SERVICE KEY es secreta. NUNCA la pongas dentro de un archivo
//     que vayas a subir a GitHub. Por eso va por la terminal, no en el código.
// =====================================================================

const SUPABASE_URL = 'https://cbpuhfuojfvvkudapgki.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_KEY;

const BASE = 'https://lnb.do';
const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh)' } };

if (!KEY) {
  console.log('ERROR: falta la service key. Corre así:');
  console.log('  SUPABASE_SERVICE_KEY="tu_key" node robot-lnb.js');
  process.exit(1);
}

// ---------- helpers ----------
function stripHtml(s) {
  if (!s) return null;
  return s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240);
}
// algunos campos de lnb.do vienen envueltos en { error, value }
function unwrap(x) {
  return (x && typeof x === 'object' && !Array.isArray(x) && 'value' in x) ? x.value : x;
}

async function getBuildIdYHome() {
  const res = await fetch(BASE + '/', UA);
  const html = await res.text();
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('No se encontró __NEXT_DATA__ en la portada de lnb.do');
  const nd = JSON.parse(m[1]);
  return { buildId: nd.buildId, home: (nd.props && nd.props.pageProps) || {} };
}

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, UA);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  const data = await res.json();
  return data.pageProps || data;
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
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${table}: HTTP ${res.status} → ${t}`);
  }
  console.log(`  ✓ ${table}: ${rows.length} filas`);
}

// ---------- main ----------
async function main() {
  console.log('========== ROBOT LNB — arrancando ==========');

  const { buildId, home } = await getBuildIdYHome();
  console.log('buildId:', buildId);

  const est = await getJson(`/_next/data/${buildId}/estadisticas.json`);
  const cal = await getJson(`/_next/data/${buildId}/calendario.json`);

  // temporada actual
  const seasons = est.competition || [];
  const current = seasons.find(s => s.current) || est.currentCompetition || {};
  const tempId = current.id;
  console.log(`Temporada actual: ${current.year} (id ${tempId}) · ${seasons.length} temporadas en total`);

  // ----- recolectar equipos de todas partes -----
  const teamMap = new Map();
  const addTeam = (t) => { if (t && t.id != null) teamMap.set(t.id, { id: t.id, name: t.name, image_url: t.image_url ?? null }); };

  // ----- TEMPORADAS -----
  const temporadas = seasons.map(s => ({
    id: s.id, year: s.year, status: s.status,
    start_date: s.start_date || null, end_date: s.end_date || null,
    current: !!s.current,
  }));

  // ----- STANDING -----
  const standingData = home?.standingData?.standing?.data || [];
  const standing = standingData.map(s => {
    addTeam(s.team);
    return {
      temporada_id: tempId, equipo_id: s.team?.id,
      position: s.position, won: s.won, lost: s.lost,
      total_games: s.total_games, points: s.points, last5_games: s.last5_games,
    };
  });

  // ----- LÍDERES -----
  const CATS = [
    ['points', est.points], ['assists', est.assits], ['rebounds', est.rebounds],
    ['blocks', est.blocks], ['steals', est.steals], ['threes', est.threes],
    ['efficiency', est.efficiency],
  ];
  const lideres = [];
  for (const [cat, arr] of CATS) {
    (arr || []).forEach((p, i) => {
      addTeam(p.team);
      lideres.push({
        temporada_id: tempId, categoria: cat, rank: i + 1,
        jugador_id: p.id, nombre: p.name, apellido: p.last_name,
        image_url: p.image_url ?? null, equipo_id: p.team?.id,
        total: p.total, average: p.average,
      });
    });
  }

  // ----- JUEGOS (calendar + lastMatches, sin duplicar) -----
  const juegosRaw = [...(cal.calendar || []), ...(cal.lastMatches || [])];
  const juegosMap = new Map();
  for (const g of juegosRaw) if (g && g.id != null) juegosMap.set(g.id, g);
  const juegos = [];
  const juegoEquipos = [];
  for (const g of juegosMap.values()) {
    juegos.push({
      id: g.id, temporada_id: tempId, type: g.type, status: g.status,
      date: g.date, period: g.period, elimination: g.elimination,
      home_location_name: g.home_location?.name ?? null,
    });
    (g.teams || []).forEach(t => {
      addTeam(t);
      juegoEquipos.push({
        juego_id: g.id, equipo_id: t.id, nombre: t.name,
        es_visitante: t.visitor, es_ganador: t.winner,
        period_1: t.period_1, period_2: t.period_2, period_3: t.period_3, period_4: t.period_4,
        total_score: t.total_score,
      });
    });
  }

  // ----- NOTICIAS -----
  const posts = home?.postsData?.posts || [];
  const noticias = posts.map(p => ({
    id: p.id, title: p.title, excerpt: stripHtml(p.detail),
    image_url: p.image_url ?? null, source_url: null,
    created_at: p.created_at,
  }));

  // ----- JUGADOR DE LA SEMANA -----
  const wp = home?.weeklyPlayer?.data?.[0];
  if (wp) addTeam(wp.team);
  const jugadorSemana = wp ? [{
    id: wp.id, nombre: wp.name, apellido: wp.last_name, shirt_number: wp.shirt_number,
    image_url: wp.image_url ?? null, label: wp.label,
    posicion_nombre: wp.position?.name ?? null, posicion_alias: wp.position?.alias ?? null,
    equipo_id: wp.team?.id ?? null, equipo_nombre: wp.team?.name ?? null,
  }] : [];

  // ===== FASE 4: JUGADORES (róster de cada equipo) =====
  console.log('\nHalando los rósters de cada equipo (todos los jugadores)...');
  const jugMap = new Map();
  for (const t of teamMap.values()) {
    try {
      const ed = await getJson(`/_next/data/${buildId}/equipo/x/${t.id}.json`);
      const roster = unwrap(ed.roster) || [];
      for (const p of roster) {
        if (!p || p.id == null) continue;
        const st = p.statistics || {};
        jugMap.set(p.id, {
          id: p.id, temporada_id: tempId, equipo_id: t.id,
          nombre: p.name, apellido: p.last_name, shirt_number: p.shirt_number ?? null,
          image_url: p.image_url ?? null,
          posicion_nombre: p.position?.name ?? null, posicion_alias: p.position?.alias ?? null,
          birth_date: p.birth_date ?? null, feets: p.feets ?? null, inches: p.inches ?? null,
          count_matches: st.count_matches ?? null,
          points: st.points ?? null, rebounds: st.rebounds ?? null, assists: st.assists ?? null,
          minutes: st.minutes ?? null, steals: st.steals ?? null, blocks: st.blocks ?? null,
          personal_fouls: st.personal_fouls ?? null, turnovers: st.turnovers ?? null,
          fg_att: st.field_goals_attempted ?? null, fg_made: st.field_goals_made ?? null, fg_pct: st.field_goals_percent ?? null,
          three_att: st.three_points_attempted ?? null, three_made: st.three_points_made ?? null, three_pct: st.three_points_percent ?? null,
          ft_att: st.free_throw_attempted ?? null, ft_made: st.free_throw_made ?? null, ft_pct: st.free_throw_percent ?? null,
          efficiency: st.efficiency ?? null,
        });
      }
      console.log(`  · ${t.name}: ${roster.length} jugadores`);
    } catch (e) {
      console.log(`  · ${t.name}: error (${e.message})`);
    }
  }
  const jugadores = [...jugMap.values()];
  console.log(`Total de jugadores recogidos: ${jugadores.length}`);

  // ===== FASE 5: BOX SCORE por jugador por partido =====
  // Ruta descubierta: /_next/data/${buildId}/partido/x/${id}.json
  // Las líneas viven en match.teams[].players[].statistics (mismos nombres que el róster).
  console.log('\nHalando el box score de cada juego (minutos, %, líneas individuales)...');
  const boxRows = [];
  const STATUS_CON_STATS = new Set(['finished', 'playing', 'live', 'in_progress']);
  const juegosConStats = juegos.filter(j => STATUS_CON_STATS.has(String(j.status)));
  console.log(`  juegos a procesar: ${juegosConStats.length}`);
  for (const j of juegosConStats) {
    try {
      const det = await getJson(`/_next/data/${buildId}/partido/x/${j.id}.json`);
      const teams = (det.match && det.match.teams) || [];
      let cuenta = 0;
      for (const tm of teams) {
        const players = tm.players || [];
        for (const pl of players) {
          if (!pl || pl.id == null) continue;
          const s = pl.statistics || {};
          boxRows.push({
            juego_id: j.id,
            jugador_id: pl.id,
            equipo_id: tm.id ?? null,
            minutes: s.minutes != null ? String(Math.round(Number(s.minutes))) : null,
            points: s.points ?? null,
            rebounds: s.rebounds ?? null,
            assists: s.assists ?? null,
            steals: s.steals ?? null,
            blocks: s.blocks ?? null,
            turnovers: s.turnovers ?? null,
            personal_fouls: s.personal_fouls ?? null,
            fg_made: s.field_goals_made ?? null,
            fg_att: s.field_goals_attempted ?? null,
            fg_pct: s.field_goals_percent ?? null,
            three_made: s.three_points_made ?? null,
            three_att: s.three_points_attempted ?? null,
            three_pct: s.three_points_percent ?? null,
            ft_made: s.free_throw_made ?? null,
            ft_att: s.free_throw_attempted ?? null,
            ft_pct: s.free_throw_percent ?? null,
            efficiency: s.efficiency ?? null,
          });
          cuenta++;
        }
      }
      console.log(`  · juego ${j.id}: ${cuenta} líneas`);
    } catch (e) {
      console.log(`  · juego ${j.id}: error (${e.message})`);
    }
    await new Promise(r => setTimeout(r, 120)); // cortesía con el servidor
  }
  console.log(`Total de líneas de box score: ${boxRows.length}`);

  // ----- SUBIR TODO (en orden por las llaves foráneas) -----
  console.log('\nSubiendo a Supabase...');
  await upsert('lnb_equipos', [...teamMap.values()], 'id');
  await upsert('lnb_temporadas', temporadas, 'id');
  await upsert('lnb_jugadores', jugadores, 'id');
  await upsert('lnb_standing', standing, 'temporada_id,equipo_id');
  await upsert('lnb_lideres', lideres, 'temporada_id,categoria,rank');
  await upsert('lnb_juegos', juegos, 'id');
  await upsert('lnb_juego_equipos', juegoEquipos, 'juego_id,equipo_id');
  await upsert('lnb_juego_jugadores', boxRows, 'juego_id,jugador_id');
  await upsert('lnb_noticias', noticias, 'id');
  await upsert('lnb_jugador_semana', jugadorSemana, 'id');

  console.log('\n========== ROBOT LNB — TERMINÓ ✓ ==========');
  console.log('Copia toda esta salida y pásamela.');
}

main().catch(e => { console.log('\n❌ ERROR:', e.message); process.exit(1); });