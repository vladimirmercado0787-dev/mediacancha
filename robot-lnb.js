// =====================================================================
//  ROBOT LNB · Media Cancha  (Fase 1)
//  Jala la data de lnb.do (JSON limpio) y la mete en Supabase.
//  Sólido: busca el buildId fresco cada vez, así nunca se rompe
//  cuando la liga actualiza su sitio.
//
//  CÓMO CORRERLO (después de haber creado las tablas con el SQL):
//    1. Guárdalo en una carpeta (ej.: Desktop).
//    2. En la terminal, pega tu service key y corre (todo en una línea):
//
//       SUPABASE_SERVICE_KEY="PEGA_AQUI_TU_SERVICE_KEY" node robot-lnb.js
//
//    3. Copia toda la salida y pásamela.
//
//  ⚠️ La SERVICE KEY es secreta. NUNCA la pongas dentro de un archivo
//     que vayas a subir a GitHub. Por eso va por la terminal, no en el código.
//     (La sacas de: Supabase → Project Settings → API → service_role.)
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

  // ----- SUBIR TODO (en orden por las llaves foráneas) -----
  console.log('\nSubiendo a Supabase...');
  await upsert('lnb_equipos', [...teamMap.values()], 'id');
  await upsert('lnb_temporadas', temporadas, 'id');
  await upsert('lnb_standing', standing, 'temporada_id,equipo_id');
  await upsert('lnb_lideres', lideres, 'temporada_id,categoria,rank');
  await upsert('lnb_juegos', juegos, 'id');
  await upsert('lnb_juego_equipos', juegoEquipos, 'juego_id,equipo_id');
  await upsert('lnb_noticias', noticias, 'id');
  await upsert('lnb_jugador_semana', jugadorSemana, 'id');

  // ----- BONUS: averiguar la base de las imágenes -----
  console.log('\nProbando de dónde salen las imágenes...');
  const sampleImg = [...teamMap.values()].find(t => t.image_url)?.image_url;
  if (sampleImg) {
    const bases = [
      'https://lnb-media.sfo3.cdn.digitaloceanspaces.com/',
      'https://lnb.do/',
      'https://lnb.do/api/media/',
    ];
    for (const b of bases) {
      try {
        const r = await fetch(b + sampleImg, { method: 'HEAD' });
        console.log(`  ${r.status === 200 ? '✓ SIRVE' : r.status} → ${b}`);
      } catch (e) { console.log(`  error → ${b}`); }
    }
    console.log(`  (ruta de ejemplo: ${sampleImg})`);
  }

  console.log('\n========== ROBOT LNB — TERMINÓ ✓ ==========');
  console.log('Copia toda esta salida y pásamela.');
}

main().catch(e => { console.log('\n❌ ERROR:', e.message); process.exit(1); });
