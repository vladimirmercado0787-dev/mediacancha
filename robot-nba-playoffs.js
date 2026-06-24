// =====================================================================
//  ROBOT NBA PLAYOFFS · Media Cancha
//  Recorre las fechas de la postemporada 2025-26 en la API pública de ESPN
//  y mete los juegos de playoffs (con su ronda) y el box score de cada uno.
//  Llena: nba_juegos (fase='playoffs', ronda=...) y nba_juego_jugadores.
//
//  ⚠️ ANTES de correrlo, corre el paso3_juegos_ronda.sql en Supabase
//     (le agrega las columnas fase y ronda a nba_juegos).
//
//  CÓMO CORRERLO (todo en UNA línea, parado en la carpeta mediacancha):
//      SUPABASE_SERVICE_KEY="PEGA_AQUI_TU_SERVICE_KEY" node robot-nba-playoffs.js
//  Copia TODA la salida y pásamela — sobre todo la lista de "Rondas
//  encontradas", que con eso afino las etiquetas y luego conecto la pantalla.
//
//  ⚠️ La SERVICE KEY es secreta. NUNCA la metas dentro del archivo.
//  Se corre una sola vez (cuando termina la temporada). Es aparte del
//  robot-nba.js (temporada regular).
// =====================================================================

const SUPABASE_URL = 'https://cbpuhfuojfvvkudapgki.supabase.co'; // mismo proyecto que la LNB
const KEY = process.env.SUPABASE_SERVICE_KEY;

if (!KEY) {
  console.log('ERROR: falta la service key. Corre así:');
  console.log('  SUPABASE_SERVICE_KEY="tu_key" node robot-nba-playoffs.js');
  process.exit(1);
}

const TEMPORADA = 2026; // año en que termina la temporada (2025-26)

// ventana de la postemporada (incluye el play-in). Los días sin juego se
// saltan solos, así que no pasa nada si sobran fechas por los bordes.
const INICIO = '2026-04-14';
const FIN = '2026-06-22';

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';
const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh)', accept: 'application/json' } };

const NORM = { GS: 'GSW', NY: 'NYK', SA: 'SAS', NO: 'NOP', UTAH: 'UTA', UTH: 'UTA', WSH: 'WAS', PHO: 'PHX', NOR: 'NOP' };
const normAbv = (a) => { const x = (a || '').toUpperCase(); return NORM[x] || x; };

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

// genera las fechas YYYYMMDD entre dos fechas (inclusive)
function* rangoFechas(a, b) {
  const d = new Date(a + 'T12:00:00Z');
  const fin = new Date(b + 'T12:00:00Z');
  while (d <= fin) {
    yield d.toISOString().slice(0, 10).replace(/-/g, '');
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

async function traerPlayoffs() {
  const juegos = [];
  const box = [];
  let dias = 0, conJuegos = 0;
  for (const f of rangoFechas(INICIO, FIN)) {
    dias++;
    let data;
    try { data = await getJson(`${SITE}/scoreboard?dates=${f}&seasontype=3`); } catch (e) { continue; }
    const evs = data?.events || [];
    if (evs.length) conJuegos++;
    for (const ev of evs) {
      // solo playoffs (seasontype 3); si ESPN no lo marca, lo dejamos pasar
      if (ev?.season?.type != null && Number(ev.season.type) !== 3) continue;
      const comp = ev?.competitions?.[0] || {};
      const cs = comp?.status || ev?.status || {};
      const state = cs?.type?.state || 'pre';
      const lado = (ha) => (comp?.competitors || []).find((x) => x?.homeAway === ha) || {};
      const h = lado('home'), a = lado('away');
      const habv = normAbv(h?.team?.abbreviation), aabv = normAbv(a?.team?.abbreviation);
      const hs = (h?.score != null && h.score !== '') ? Number(h.score) : null;
      const as = (a?.score != null && a.score !== '') ? Number(a.score) : null;
      // etiqueta de la ronda: ESPN suele ponerla en notes[0].headline
      const nota = (comp?.notes && comp.notes[0]) ? comp.notes[0] : null;
      const ronda = (nota && (nota.headline || nota.text)) ? String(nota.headline || nota.text).trim() : 'Playoffs';
      juegos.push({
        id: String(ev?.id), temporada: TEMPORADA, fecha: ev?.date || null,
        estado: state === 'in' ? 'vivo' : state === 'post' ? 'final' : 'previa',
        local_abv: habv, visita_abv: aabv, local_score: hs, visita_score: as,
        ganador_abv: h?.winner ? habv : a?.winner ? aabv : null,
        fase: 'playoffs', ronda,
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
        } catch (e) { /* si un box falla, seguimos */ }
        await new Promise((r) => setTimeout(r, 120));
      }
    }
    await new Promise((r) => setTimeout(r, 60));
  }
  return { juegos, box, dias, conJuegos };
}

async function main() {
  console.log('========== ROBOT NBA PLAYOFFS — arrancando ==========');
  console.log(`Playoffs ${TEMPORADA} · ventana ${INICIO} a ${FIN}`);
  const { juegos, box, dias, conJuegos } = await traerPlayoffs();
  console.log('');
  console.log(`Días revisados: ${dias} · días con juegos: ${conJuegos}`);
  console.log(`Juegos de playoffs: ${juegos.length} · líneas de box score: ${box.length}`);
  console.log('');
  await upsert('nba_juegos', juegos, 'id');
  await upsert('nba_juego_jugadores', box, 'juego_id,jugador_id');
  console.log('');
  const rondas = {};
  for (const j of juegos) rondas[j.ronda] = (rondas[j.ronda] || 0) + 1;
  console.log('Rondas encontradas (pásame esta lista):');
  const claves = Object.keys(rondas).sort();
  if (!claves.length) console.log('  (ninguna — revisa las fechas o si ya pasaron los playoffs)');
  for (const r of claves) console.log(`  · ${r}: ${rondas[r]} juegos`);
  console.log('========== LISTO ==========');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
