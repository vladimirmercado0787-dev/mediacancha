// ====== nbaApi.js ======
// Trae datos en vivo de la NBA desde la API pública de ESPN (gratis, sin clave).
// Mapea todo a las MISMAS formas que usa PantallaNBA (JUEGOS / NOTICIAS),
// para que la pantalla solo cambie el estado y se pinte igual.
//
// Puertas de ESPN abiertas al teléfono (CORS *): scoreboard y news.
// En el teléfono usamos HTTP NATIVO (CapacitorHttp), que sale por código
// nativo y NO lo frena el CORS del WebView. Así el teléfono también puede
// pedir clasificación, líderes y el RSS de NBAManiacs directo (sin proxy).
// En web (la compu) se usa el fetch normal de siempre.

import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { supabase } from '../supabaseClient'

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'

// ESPN usa algunas siglas distintas a las nuestras. Las normalizamos.
const NORM = {
  GS: 'GSW', NY: 'NYK', SA: 'SAS', NO: 'NOP',
  UTAH: 'UTA', UTH: 'UTA', WSH: 'WAS', PHO: 'PHX', NOR: 'NOP',
}
const normAbv = (a) => {
  const x = (a || '').toUpperCase()
  return NORM[x] || x
}

// fetch con tope de tiempo, para que nunca se quede colgado.
// En el teléfono va por HTTP nativo (salta el CORS del WebView).
async function getJson(url, ms = 10000) {
  if (Capacitor.isNativePlatform()) {
    const resp = await CapacitorHttp.get({
      url,
      headers: { accept: 'application/json' },
      connectTimeout: ms,
      readTimeout: ms,
    })
    if (resp.status < 200 || resp.status >= 300) throw new Error('HTTP ' + resp.status)
    return typeof resp.data === 'string' ? JSON.parse(resp.data) : resp.data
  }
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    return await r.json()
  } finally {
    clearTimeout(t)
  }
}

// "hace X" sencillo en español
function tiempoRel(iso) {
  try {
    const d = new Date(iso).getTime()
    if (!d) return ''
    const min = Math.round((Date.now() - d) / 60000)
    if (min < 1) return 'ahora'
    if (min < 60) return 'hace ' + min + ' min'
    const h = Math.round(min / 60)
    if (h < 24) return 'hace ' + h + ' h'
    const dias = Math.round(h / 24)
    if (dias === 1) return 'ayer'
    return 'hace ' + dias + ' d'
  } catch { return '' }
}

function horaLocal(iso) {
  try {
    return new Date(iso).toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit' })
  } catch { return '' }
}

// ====== MARCADORES ======
// Devuelve un arreglo con la forma de JUEGOS de PantallaNBA.
// dateStr opcional: 'YYYYMMDD' para un día específico. Sin él, trae el día de hoy.
export async function getScoreboard(dateStr) {
  try {
    const url = BASE + '/scoreboard' + (dateStr ? '?dates=' + dateStr : '')
    const data = await getJson(url)
    const events = Array.isArray(data?.events) ? data.events : []
    return events.map((ev) => {
      const comp = ev?.competitions?.[0] || {}
      const cs = comp?.status || ev?.status || {}
      const state = cs?.type?.state || 'pre' // pre | in | post
      const competidores = Array.isArray(comp?.competitors) ? comp.competitors : []
      const lado = (ha) => {
        const c = competidores.find((x) => x?.homeAway === ha) || {}
        const o = {
          abv: normAbv(c?.team?.abbreviation),
          rec: c?.records?.[0]?.summary || '',
        }
        if (c?.score != null && c.score !== '') o.score = Number(c.score)
        if (c?.winner === true) o.gana = true
        return o
      }
      const j = {
        id: ev?.id,
        local: lado('home'),
        visita: lado('away'),
      }
      if (state === 'in') {
        j.estado = 'vivo'
        const per = Number(cs?.period) || 0
        j.periodo = per > 4 ? 'PR' : (per ? per + 'C' : 'EN VIVO')
        j.reloj = cs?.displayClock || ''
      } else if (state === 'post') {
        j.estado = 'final'
      } else {
        j.estado = 'previa'
        j.hora = horaLocal(ev?.date)
      }
      return j
    })
  } catch (e) {
    return [] // si algo falla, la pantalla se queda con sus datos de muestra
  }
}

// ====== NOTICIAS DE ESPN ======
// Devuelve un arreglo con la forma de NOTICIAS de PantallaNBA.
// Sin fotos (foto: null) para mantenernos del lado legal.
export async function getNews(limite = 12) {
  try {
    const data = await getJson(BASE + '/news')
    const arts = Array.isArray(data?.articles) ? data.articles : []
    return arts.slice(0, limite).map((a, i) => ({
      id: a?.id || i,
      titulo: a?.headline || a?.title || '',
      fuente: 'ESPN',
      tiempo: tiempoRel(a?.published),
      foto: null,
      enlace: a?.links?.web?.href || '',
    })).filter((n) => n.titulo)
  } catch (e) {
    return []
  }
}

// ====== CLASIFICACIÓN (ambas conferencias) ======
// OJO: la clasificación usa /apis/v2/ (no /apis/site/v2/).
const BASE_V2 = 'https://site.api.espn.com/apis/v2/sports/basketball/nba'

function statVal(stats, nombre) {
  const s = (stats || []).find((x) => x?.name === nombre || x?.type === nombre)
  if (!s) return undefined
  return s.displayValue != null ? s.displayValue : s.value
}

export async function getStandings() {
  try {
    const data = await getJson(BASE_V2 + '/standings?region=us&lang=en&contentorigin=espn&type=0&level=3&sort=playoffseed:asc')
    // la data puede venir como children[] (conferencias) o standings.entries
    const grupos = Array.isArray(data?.children) ? data.children
      : Array.isArray(data?.standings?.groups) ? data.standings.groups : []
    const out = { este: [], oeste: [] }
    // junta entries de un grupo, aunque tenga divisiones adentro
    const recogerEntries = (g) => {
      let e = g?.standings?.entries || g?.entries || []
      if ((!e || !e.length) && Array.isArray(g?.children)) {
        e = g.children.flatMap((d) => d?.standings?.entries || d?.entries || [])
      }
      return e || []
    }
    grupos.forEach((g, idx) => {
      const nm = (g?.abbreviation || g?.name || '').toLowerCase()
      let lado = nm.includes('east') || nm.includes('este') ? 'este'
        : nm.includes('west') || nm.includes('oeste') ? 'oeste'
        : (idx === 0 ? 'este' : 'oeste')
      const entries = recogerEntries(g)
      let filas = entries.map((e) => {
        const t = e?.team || {}
        const st = e?.stats || []
        const w = Number(statVal(st, 'wins')) || 0
        const l = Number(statVal(st, 'losses')) || 0
        return {
          abv: normAbv(t?.abbreviation),
          nombre: t?.shortDisplayName || t?.name || t?.displayName || '',
          w, l,
          racha: statVal(st, 'streak') || '',
        }
      })
      if (!filas.length) return
      // ordenar por victorias y calcular juegos detrás POR conferencia
      filas.sort((a, b) => (b.w - a.w) || (a.l - b.l))
      const lider = filas[0]
      filas = filas.map((f, k) => {
        const gb = ((lider.w - f.w) + (f.l - lider.l)) / 2
        return { ...f, pos: k + 1, gb: gb > 0 ? String(gb) : '—' }
      })
      out[lado] = filas // cada conferencia es un hijo entero: se asigna, no se acumula
    })
    // si no se pudo separar por conferencia, no devolvemos nada (se queda la muestra)
    if (!out.este.length && !out.oeste.length) return null
    return out
  } catch (e) {
    return null
  }
}

// ====== EQUIPOS (los 30) ======
export async function getTeams() {
  try {
    const data = await getJson(BASE + '/teams')
    const lista = data?.sports?.[0]?.leagues?.[0]?.teams || []
    const abvs = lista.map((x) => normAbv(x?.team?.abbreviation)).filter(Boolean)
    return abvs.length ? abvs : null
  } catch (e) {
    return null
  }
}

// ====== LÍDERES (todas las categorías) ======
// Etiquetas y unidades en español por categoría de ESPN.
const CAT_MAP = {
  points: { cat: 'Puntos', unidad: 'PPP' },
  rebounds: { cat: 'Rebotes', unidad: 'RPP' },
  assists: { cat: 'Asistencias', unidad: 'APP' },
  steals: { cat: 'Robos', unidad: 'RBP' },
  blocks: { cat: 'Tapones', unidad: 'TPP' },
  fieldGoalPct: { cat: '% de Campo', unidad: 'FG%' },
  threePointFieldGoalPct: { cat: '% de Triples', unidad: '3P%' },
  threePointPct: { cat: '% de Triples', unidad: '3P%' },
  freeThrowPct: { cat: '% T. Libres', unidad: 'FT%' },
  minutes: { cat: 'Minutos', unidad: 'MPP' },
  PER: { cat: 'Eficiencia', unidad: 'EFF' },
  efficiency: { cat: 'Eficiencia', unidad: 'EFF' },
  doubleDouble: { cat: 'Doble-dobles', unidad: 'DD' },
  tripleDouble: { cat: 'Triple-dobles', unidad: 'TD' },
}
// orden bonito de presentación
const CAT_ORDEN = ['points', 'rebounds', 'assists', 'steals', 'blocks', 'PER', 'efficiency', 'fieldGoalPct', 'threePointFieldGoalPct', 'threePointPct', 'freeThrowPct', 'minutes', 'doubleDouble', 'tripleDouble']

function iniciales(nombre) {
  const p = (nombre || '').trim().split(/\s+/)
  if (!p.length) return '?'
  if (p.length === 1) return p[0].slice(0, 3).toUpperCase()
  return (p[0][0] + p[p.length - 1].slice(0, 2)).toUpperCase()
}

export async function getLeaders() {
  const BYA = 'https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete'
  // categorías con su clave de orden de ESPN (grupo.stat) y etiqueta en español
  const CATS = [
    { sort: 'offensive.avgPoints', stat: 'avgPoints', cat: 'Puntos', unidad: 'PPP' },
    { sort: 'general.avgRebounds', stat: 'avgRebounds', cat: 'Rebotes', unidad: 'RPP' },
    { sort: 'offensive.avgAssists', stat: 'avgAssists', cat: 'Asistencias', unidad: 'APP' },
    { sort: 'defensive.avgSteals', stat: 'avgSteals', cat: 'Robos', unidad: 'RBP' },
    { sort: 'defensive.avgBlocks', stat: 'avgBlocks', cat: 'Tapones', unidad: 'TPP' },
    { sort: 'offensive.fieldGoalPct', stat: 'fieldGoalPct', cat: '% de Campo', unidad: 'FG%' },
    { sort: 'offensive.threePointFieldGoalPct', stat: 'threePointFieldGoalPct', cat: '% de Triples', unidad: '3P%' },
    { sort: 'offensive.freeThrowPct', stat: 'freeThrowPct', cat: '% T. Libres', unidad: 'FT%' },
    { sort: 'offensive.avgFieldGoalsMade', stat: 'avgFieldGoalsMade', cat: 'Canastas', unidad: 'CPP' },
    { sort: 'offensive.avgThreePointFieldGoalsMade', stat: 'avgThreePointFieldGoalsMade', cat: 'Triples', unidad: 'TPP' },
    { sort: 'general.avgMinutes', stat: 'avgMinutes', cat: 'Minutos', unidad: 'MPP' },
  ]
  // redondea decimales largos (32.5806 -> 32.6); deja porcentajes y enteros igual
  const fmt = (v) => {
    const s = String(v)
    const n = Number(v)
    if (!isNaN(n) && /\.\d{2,}/.test(s)) return n.toFixed(1)
    return s
  }
  // El valor vive alineado: los NOMBRES de stats están en data.categories[].names
  // y los VALORES en item.categories[].totals (mismo índice, misma categoría).
  const valorDe = (data, item, statName) => {
    const topCats = data?.categories || []
    const athCats = item?.categories || []
    for (let i = 0; i < topCats.length; i++) {
      const names = topCats[i]?.names || []
      const idx = names.indexOf(statName)
      if (idx < 0) continue
      let ac = athCats[i]
      if (!ac || !(ac.totals || ac.values)) ac = athCats.find((a) => a?.name === topCats[i]?.name) || ac
      const vals = ac?.totals || ac?.values || ac?.displayValues || []
      if (vals[idx] != null) return fmt(vals[idx])
    }
    // respaldo: por si el atleta trae sus propios nombres+valores
    for (const c of athCats) {
      const names = c?.names || []
      const vals = c?.totals || c?.values || []
      const idx = names.indexOf(statName)
      if (idx >= 0 && vals[idx] != null) return fmt(vals[idx])
    }
    return ''
  }
  const pedir = async (c) => {
    try {
      const url = BYA + '?region=us&lang=en&contentorigin=espn&isqualified=true&page=1&limit=1'
        + '&sort=' + c.sort + ':desc&season=2026&seasontype=2'
      const data = await getJson(url)
      const item = data?.athletes?.[0]
      const at = item?.athlete || {}
      if (!at.displayName) return null
      return {
        cat: c.cat,
        abv: iniciales(at.displayName),
        nombre: at.displayName,
        equipo: normAbv(at?.teams?.[0]?.abbreviation || at?.team?.abbreviation || at?.teamShortName),
        pos: at?.position?.abbreviation || '',
        valor: valorDe(data, item, c.stat),
        unidad: c.unidad,
        foto: null,
      }
    } catch (e) { return null }
  }
  try {
    const res = await Promise.all(CATS.map(pedir))
    const out = res.filter((x) => x && x.nombre)
    return out.length ? out : null
  } catch (e) {
    return null
  }
}

// ====== NOTICIAS NBAManiacs (español, vía RSS) ======
// El teléfono no puede leer RSS directo (lo bloquea por seguridad), así que
// pasamos por un convertidor público gratis. Saltamos lo patrocinado.
// Trae foto, resumen y cuerpo para leerla DENTRO de la app (estilo LNB).
function quitarHtml(h) {
  return (h || '')
    .replace(/<\/(p|div|h\d|li|tr)>/gi, '\n')
    .replace(/<br\s*\/?>(?=)/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/gi, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n').trim()
}
function hijoTexto(item, nombre) {
  const kids = item.childNodes || []
  for (let i = 0; i < kids.length; i++) {
    const k = kids[i]
    if (k.nodeName === nombre || k.localName === nombre) return k.textContent || ''
  }
  return ''
}
function imagenDe(item, html) {
  const kids = item.childNodes || []
  for (let i = 0; i < kids.length; i++) {
    const k = kids[i]
    const nn = k.nodeName
    if ((nn === 'media:content' || nn === 'media:thumbnail' || nn === 'enclosure') && k.getAttribute) {
      const u = k.getAttribute('url')
      if (u && /\.(jpe?g|png|webp)/i.test(u)) return u
    }
  }
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html || '')
  return m ? m[1] : ''
}
// Convierte el XML del RSS en nuestra forma de NOTICIAS (compartido).
function parseRssNoticias(xml, limite, patro) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const items = Array.from(doc.querySelectorAll('item'))
  const out = []
  for (const it of items) {
    const titulo = (it.querySelector('title')?.textContent || '').trim()
    const enlace = (it.querySelector('link')?.textContent || '').trim()
    const fecha = it.querySelector('pubDate')?.textContent || ''
    const desc = it.querySelector('description')?.textContent || ''
    const full = hijoTexto(it, 'content:encoded') || desc
    const catArr = Array.from(it.querySelectorAll('category')).map((c) => (c.textContent || '').trim()).filter(Boolean)
    const cats = catArr.join(' ')
    const tag = catArr[0] || 'NBA'
    if (!titulo) continue
    if (patro.test(titulo) || patro.test(desc) || patro.test(cats)) continue
    const cuerpo = quitarHtml(full)
    const resumen = quitarHtml(desc).slice(0, 180)
    out.push({
      id: enlace || String(out.length),
      titulo,
      tag,
      fuente: 'NBAManiacs',
      tiempo: tiempoRel(fecha),
      imagen: imagenDe(it, full),
      resumen,
      cuerpo,
      foto: null,
      enlace,
    })
    if (out.length >= limite) break
  }
  return out
}

export async function getNoticias(limite = 24) {
  const RSS = 'https://www.nbamaniacs.com/feed/'
  const patro = /patrocinad|colaboraci[oó]n|sponsored|in collaboration|publicidad/i

  // 1) EL ROBOT (Edge Function en nuestra nube): la vía oficial.
  //    Busca el RSS desde el servidor, con caché de 10 minutos y memoria
  //    de la última copia buena. Sin CORS y sin proxies ajenos.
  try {
    const { data, error } = await supabase.functions.invoke('robot-noticias')
    if (!error && data && data.xml) {
      const out = parseRssNoticias(data.xml, limite, patro)
      if (out.length) return out
    }
  } catch (e) { /* si el robot no responde, caen los respaldos de abajo */ }

  // 2) RESPALDO EN TELÉFONO: pide el RSS directo por HTTP nativo.
  if (Capacitor.isNativePlatform()) {
    try {
      const resp = await CapacitorHttp.get({
        url: RSS,
        headers: {
          accept: 'application/rss+xml, application/xml, text/xml',
          // Muchos feeds de WordPress/Cloudflare bloquean el pedido si no
          // parece un navegador. Nos presentamos como Safari de iPhone.
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        },
        connectTimeout: 15000,
        readTimeout: 15000,
      })
      const xml = typeof resp.data === 'string' ? resp.data : ''
      const out = parseRssNoticias(xml, limite, patro)
      if (out.length) return out
    } catch (e) { /* si el directo falla, cae a los convertidores de abajo */ }
  }

  // 3) ÚLTIMO RESPALDO (web): proxies públicos. Solo si todo lo demás falló.
  const proxies = [
    (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
    (u) => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
  ]
  for (const mk of proxies) {
    try {
      const r = await fetch(mk(RSS))
      if (!r.ok) continue
      const xml = await r.text()
      const out = parseRssNoticias(xml, limite, patro)
      if (out.length) return out
    } catch (e) { /* probar el siguiente convertidor */ }
  }
  return []
}