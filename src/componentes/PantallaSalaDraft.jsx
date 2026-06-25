import { useState, useMemo, useEffect } from 'react'

// ============================================================
//  SALA DE DRAFT — Fantasy NBA 9-cat (dentro del Centro de Comando)
//  Tablero en vivo: motor de valor por z-scores, perfil por categoria,
//  seguimiento de draft serpiente y recomendacion del mejor pick.
//  Numeros de baseline (temporada pasada) — se refrescan en octubre.
// ============================================================

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const C = {
  fondo: '#070d1d',
  panel: 'rgba(255,255,255,0.045)',
  card: 'rgba(255,255,255,0.05)',
  line: 'rgba(150,172,228,0.16)',
  line2: 'rgba(150,172,228,0.30)',
  txt: '#eef3fc',
  txt2: '#aab6d4',
  txt3: '#7f8cae',
  green: '#16E68A',
  red: '#FF5A5F',
  gold: '#F5B82E',
  blue: '#5AA9FF',
}

// stats: pts reb ast stl blk tpm | fgp/fga | ftp/fta | to  (por juego)
const RAW = [
  { n: 'Nikola Jokić', pos: 'C', id: '3112335', pts: 27, reb: 12, ast: 10, stl: 1.4, blk: 0.7, tpm: 1.1, fgp: .58, fga: 17, ftp: .82, fta: 6, to: 3.0 },
  { n: 'Shai Gilgeous-Alexander', pos: 'G', id: null, pts: 31, reb: 5.5, ast: 6, stl: 2.0, blk: 0.9, tpm: 1.0, fgp: .53, fga: 21, ftp: .87, fta: 8.5, to: 2.4 },
  { n: 'Luka Dončić', pos: 'G', id: '3945274', pts: 28, reb: 8.5, ast: 8, stl: 1.4, blk: 0.5, tpm: 3.4, fgp: .47, fga: 21, ftp: .78, fta: 8, to: 3.6 },
  { n: 'Victor Wembanyama', pos: 'C', id: null, pts: 24, reb: 11, ast: 4, stl: 1.2, blk: 3.6, tpm: 2.0, fgp: .47, fga: 18, ftp: .83, fta: 6, to: 3.2 },
  { n: 'Giannis Antetokounmpo', pos: 'F', id: '3032977', pts: 30, reb: 11.5, ast: 6, stl: 1.1, blk: 1.1, tpm: 0.5, fgp: .60, fga: 19, ftp: .65, fta: 10, to: 3.4 },
  { n: 'Anthony Davis', pos: 'F/C', id: '6583', pts: 25, reb: 12, ast: 3.5, stl: 1.2, blk: 2.3, tpm: 0.4, fgp: .55, fga: 18, ftp: .79, fta: 7, to: 2.1 },
  { n: 'Tyrese Haliburton', pos: 'G', id: null, pts: 19, reb: 4, ast: 11, stl: 1.3, blk: 0.6, tpm: 2.8, fgp: .47, fga: 14, ftp: .85, fta: 3, to: 2.4 },
  { n: 'Stephen Curry', pos: 'G', id: '3975', pts: 26, reb: 4.5, ast: 6, stl: 1.1, blk: 0.4, tpm: 4.5, fgp: .45, fga: 20, ftp: .92, fta: 5, to: 3.0 },
  { n: 'Domantas Sabonis', pos: 'F/C', id: null, pts: 19, reb: 13, ast: 7, stl: 0.9, blk: 0.6, tpm: 0.6, fgp: .59, fga: 13, ftp: .73, fta: 5, to: 3.2 },
  { n: 'Kevin Durant', pos: 'F', id: '3202', pts: 27, reb: 6, ast: 4.5, stl: 0.8, blk: 1.2, tpm: 2.2, fgp: .52, fga: 18, ftp: .85, fta: 6, to: 3.3 },
  { n: 'Jayson Tatum', pos: 'F', id: null, pts: 27, reb: 8.5, ast: 5, stl: 1.0, blk: 0.6, tpm: 3.2, fgp: .46, fga: 20, ftp: .83, fta: 7, to: 2.9 },
  { n: 'Anthony Edwards', pos: 'G', id: '4594268', pts: 27, reb: 5.5, ast: 4.5, stl: 1.3, blk: 0.6, tpm: 3.9, fgp: .45, fga: 21, ftp: .83, fta: 7, to: 3.2 },
  { n: 'Karl-Anthony Towns', pos: 'C', id: null, pts: 24, reb: 13, ast: 3, stl: 0.9, blk: 0.7, tpm: 2.0, fgp: .53, fga: 17, ftp: .85, fta: 6, to: 2.8 },
  { n: 'Jalen Brunson', pos: 'G', id: null, pts: 26, reb: 3.5, ast: 7.5, stl: 0.9, blk: 0.2, tpm: 2.3, fgp: .48, fga: 20, ftp: .85, fta: 6, to: 2.4 },
  { n: 'Cade Cunningham', pos: 'G', id: null, pts: 22, reb: 6.5, ast: 9, stl: 1.0, blk: 0.6, tpm: 2.0, fgp: .46, fga: 18, ftp: .83, fta: 6, to: 3.6 },
  { n: 'Devin Booker', pos: 'G', id: null, pts: 25, reb: 4.5, ast: 7, stl: 0.9, blk: 0.3, tpm: 2.5, fgp: .47, fga: 19, ftp: .87, fta: 6, to: 2.8 },
  { n: 'Donovan Mitchell', pos: 'G', id: null, pts: 26, reb: 5, ast: 5, stl: 1.4, blk: 0.4, tpm: 3.5, fgp: .46, fga: 20, ftp: .85, fta: 5, to: 2.6 },
  { n: 'Bam Adebayo', pos: 'C', id: null, pts: 18, reb: 10, ast: 4, stl: 1.1, blk: 0.8, tpm: 0.4, fgp: .52, fga: 14, ftp: .78, fta: 5, to: 2.4 },
  { n: 'Evan Mobley', pos: 'F/C', id: null, pts: 18.5, reb: 9.5, ast: 3, stl: 0.9, blk: 1.6, tpm: 0.5, fgp: .55, fga: 13, ftp: .72, fta: 4, to: 1.8 },
  { n: 'Jaren Jackson Jr.', pos: 'F/C', id: null, pts: 22, reb: 6, ast: 2, stl: 1.1, blk: 1.6, tpm: 2.0, fgp: .49, fga: 16, ftp: .80, fta: 5, to: 2.0 },
  { n: 'Tyrese Maxey', pos: 'G', id: null, pts: 26, reb: 4, ast: 6.5, stl: 1.2, blk: 0.4, tpm: 3.2, fgp: .45, fga: 21, ftp: .88, fta: 5, to: 1.8 },
  { n: 'LaMelo Ball', pos: 'G', id: null, pts: 24, reb: 5, ast: 8, stl: 1.4, blk: 0.3, tpm: 3.6, fgp: .43, fga: 21, ftp: .85, fta: 5, to: 3.6 },
  { n: 'Paolo Banchero', pos: 'F', id: null, pts: 25, reb: 7.5, ast: 5, stl: 0.9, blk: 0.6, tpm: 1.8, fgp: .46, fga: 20, ftp: .73, fta: 8, to: 3.0 },
  { n: 'Franz Wagner', pos: 'F', id: null, pts: 24, reb: 5.5, ast: 5.5, stl: 1.1, blk: 0.4, tpm: 1.8, fgp: .48, fga: 18, ftp: .83, fta: 6, to: 2.6 },
  { n: "De'Aaron Fox", pos: 'G', id: null, pts: 25, reb: 4.5, ast: 6, stl: 1.7, blk: 0.4, tpm: 2.2, fgp: .46, fga: 20, ftp: .78, fta: 6, to: 2.6 },
  { n: 'Pascal Siakam', pos: 'F', id: null, pts: 21, reb: 7, ast: 4, stl: 0.9, blk: 0.5, tpm: 1.5, fgp: .52, fga: 16, ftp: .77, fta: 5, to: 2.2 },
  { n: 'Alperen Şengün', pos: 'C', id: null, pts: 20, reb: 10, ast: 6, stl: 1.2, blk: 0.8, tpm: 0.5, fgp: .53, fga: 15, ftp: .70, fta: 5, to: 2.8 },
  { n: 'Trae Young', pos: 'G', id: null, pts: 23, reb: 3, ast: 11, stl: 1.2, blk: 0.2, tpm: 2.8, fgp: .42, fga: 18, ftp: .87, fta: 7, to: 4.0 },
  { n: 'Kyrie Irving', pos: 'G', id: null, pts: 24, reb: 4.5, ast: 5, stl: 1.3, blk: 0.5, tpm: 3.0, fgp: .49, fga: 18, ftp: .90, fta: 4, to: 2.0 },
  { n: 'Scottie Barnes', pos: 'F', id: null, pts: 20, reb: 8, ast: 6, stl: 1.3, blk: 0.9, tpm: 1.5, fgp: .47, fga: 16, ftp: .77, fta: 5, to: 2.6 },
]

const CATS = ['pts', 'reb', 'ast', 'stl', 'blk', 'tpm', 'fg', 'ft', 'to']
const LAB = { pts: 'PTS', reb: 'REB', ast: 'AST', stl: 'STL', blk: 'BLK', tpm: '3PM', fg: 'FG%', ft: 'FT%', to: 'TO' }

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length
const sd = (a, m) => Math.sqrt(mean(a.map((x) => (x - m) ** 2))) || 1

function computeValues(pool) {
  const count = ['pts', 'reb', 'ast', 'stl', 'blk', 'tpm']
  const stats = {}
  count.forEach((c) => { const arr = pool.map((p) => p[c]); const m = mean(arr); stats[c] = { m, s: sd(arr, m) } })
  const lgFG = pool.reduce((s, p) => s + p.fgp * p.fga, 0) / pool.reduce((s, p) => s + p.fga, 0)
  const lgFT = pool.reduce((s, p) => s + p.ftp * p.fta, 0) / pool.reduce((s, p) => s + p.fta, 0)
  const fgImp = pool.map((p) => p.fga * (p.fgp - lgFG))
  const ftImp = pool.map((p) => p.fta * (p.ftp - lgFT))
  const mFG = mean(fgImp), sFG = sd(fgImp, mFG), mFT = mean(ftImp), sFT = sd(ftImp, mFT)
  const arrTO = pool.map((p) => p.to); const mTO = mean(arrTO), sTO = sd(arrTO, mTO)
  return pool.map((p, i) => {
    const z = {}
    count.forEach((c) => { z[c] = (p[c] - stats[c].m) / stats[c].s })
    z.fg = (fgImp[i] - mFG) / sFG
    z.ft = (ftImp[i] - mFT) / sFT
    z.to = (mTO - p.to) / sTO // menos perdidas = mejor
    const total = CATS.reduce((s, c) => s + z[c], 0)
    return { ...p, z, total }
  }).sort((a, b) => b.total - a.total)
}

const POOL = computeValues(RAW)

function myPicks(s) { const a = []; for (let r = 1; r <= 13; r++) { a.push(r % 2 === 1 ? (r - 1) * 12 + s : r * 12 - s + 1) } return a }

function heatColor(z) {
  if (z >= 1) return '#16E68A'
  if (z >= .35) return 'rgba(22,230,138,.55)'
  if (z > -.35) return 'rgba(150,172,228,.18)'
  if (z > -1) return 'rgba(255,90,95,.5)'
  return '#FF5A5F'
}

function avatarUrl(id) { return id ? `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${id}.png&w=90&h=90&scale=crop&cquality=85` : null }
function iniciales(n) { return n.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase() }

function weakCats(mine) {
  const sum = {}; CATS.forEach((c) => { sum[c] = mine.reduce((s, p) => s + p.z[c], 0) })
  const punted = []
  if (mine.length >= 4) CATS.forEach((c) => { if (sum[c] <= -4) punted.push(c) })
  const needs = CATS.filter((c) => !punted.includes(c)).sort((a, b) => sum[a] - sum[b]).slice(0, 3)
  return { sum, needs, punted }
}

function Avatar({ p, size = 38 }) {
  const [err, setErr] = useState(false)
  const url = avatarUrl(p.id)
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size, borderRadius: 9, overflow: 'hidden', border: `1px solid ${C.line2}`, background: '#161827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {url && !err
        ? <img src={url} alt="" loading="lazy" onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
        : <span style={{ color: C.txt2, fontWeight: 800, fontSize: size * 0.34 }}>{iniciales(p.n)}</span>}
    </div>
  )
}

export default function PantallaSalaDraft({ onVolver }) {
  const [slot, setSlot] = useState(8)
  const [pickNo, setPickNo] = useState(1)
  const [taken, setTaken] = useState(() => new Set())
  const [mine, setMine] = useState([])
  const [query, setQuery] = useState('')
  const [esEscritorio, setEsEscritorio] = useState(false)

  useEffect(() => {
    const ver = () => setEsEscritorio(window.innerWidth >= 900)
    ver(); window.addEventListener('resize', ver)
    return () => window.removeEventListener('resize', ver)
  }, [])

  const dispoAll = useMemo(() => POOL.filter((p) => !taken.has(p.n)), [taken])
  const dispo = useMemo(() => {
    const q = query.trim().toLowerCase()
    return dispoAll.filter((p) => !q || p.n.toLowerCase().includes(q))
  }, [dispoAll, query])
  const weak = useMemo(() => weakCats(mine), [mine])

  // mejor pick para ti: valor + ajuste a categorias debiles
  const recPara = useMemo(() => {
    if (!dispoAll.length) return null
    if (mine.length === 0) return dispoAll[0]
    let best = dispoAll[0], bestScore = -1e9
    dispoAll.slice(0, 14).forEach((p) => {
      const fit = weak.needs.reduce((s, c) => s + p.z[c], 0)
      const score = p.total + 0.6 * fit
      if (score > bestScore) { bestScore = score; best = p }
    })
    return best
  }, [dispoAll, mine, weak])

  const bpa = dispoAll[0] || null
  const recName = recPara ? recPara.n : null
  const mp = myPicks(slot)
  const esMiTurno = mp.includes(pickNo)
  const proximo = mp.find((x) => x > pickNo)
  const ronda = Math.ceil(pickNo / 12)
  const profSum = useMemo(() => { const s = {}; CATS.forEach((c) => { s[c] = mine.reduce((a, p) => a + p.z[c], 0) }); return s }, [mine])

  const draft = (name, toMe) => {
    if (taken.has(name)) return
    const ns = new Set(taken); ns.add(name); setTaken(ns)
    if (toMe) { const p = POOL.find((x) => x.n === name); if (p && mine.length < 13) setMine([...mine, p]) }
    setPickNo((n) => n + 1)
  }
  const reset = () => { setTaken(new Set()); setMine([]); setPickNo(1); setQuery('') }
  const cambiarLiga = (s) => { setSlot(s); setTaken(new Set()); setMine([]); setPickNo(1); setQuery('') }

  const ANCHO = esEscritorio ? 1120 : '100%'

  const Pill = ({ valor, etq }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <b style={{ fontSize: 16, fontWeight: 900, color: C.txt }}>{valor}</b>
      <span style={{ fontSize: 9.5, letterSpacing: 1.2, color: C.txt3 }}>{etq}</span>
    </div>
  )

  // ---- tarjeta de recomendacion ----
  const RecCard = ({ p, tag, tagC }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${tagC}33`, borderRadius: 11, background: C.card, padding: 10, marginBottom: 8 }}>
      <Avatar p={p} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.n}</div>
        <div style={{ fontSize: 10.5, color: C.txt3, marginTop: 2 }}><span style={{ color: C.green, fontWeight: 800 }}>{p.total.toFixed(1)}</span> valor · {p.pos}</div>
      </div>
      <span style={{ fontSize: 9, fontWeight: 900, borderRadius: 5, padding: '3px 7px', background: `${tagC}22`, color: tagC, whiteSpace: 'nowrap' }}>{tag}</span>
    </div>
  )

  const recomendacion = () => {
    if (!recPara) return <div style={{ fontSize: 11, color: C.txt2 }}>No quedan jugadores en esta lista de baseline.</div>
    if (mine.length === 0) {
      return (<>
        <RecCard p={recPara} tag="MEJOR" tagC={C.green} />
        <div style={{ fontSize: 11, color: C.txt2, lineHeight: 1.45, marginTop: 8 }}>Ronda temprana: agarra el mejor valor disponible y construye una base equilibrada antes de pensar en puntear.</div>
      </>)
    }
    const needTxt = weak.needs.map((c) => LAB[c]).join(', ')
    const apellido = recPara.n.split(' ').slice(-1)[0]
    return (<>
      <RecCard p={recPara} tag="PARA TI" tagC={C.green} />
      {bpa && bpa.n !== recPara.n && <RecCard p={bpa} tag="MEJOR VALOR" tagC={C.blue} />}
      <div style={{ fontSize: 11, color: C.txt2, lineHeight: 1.45, marginTop: 8 }}>Tu equipo está flojo en <b style={{ color: C.txt }}>{needTxt}</b>. {apellido} ayuda ahí sin botar valor.</div>
      {weak.punted.length > 0 && (
        <div style={{ fontSize: 11, color: C.gold, background: 'rgba(245,184,46,0.10)', borderRadius: 8, padding: '7px 10px', marginTop: 8, lineHeight: 1.45 }}>
          Parece que estás punteando <b>{weak.punted.map((c) => LAB[c]).join(', ')}</b>. La herramienta dejó de contarla como necesidad y prioriza dominar el resto.
        </div>
      )}
    </>)
  }

  const Sidebar = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* RECOMENDACION */}
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 14, background: C.panel, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.6, color: C.green, marginBottom: 10 }}>⚡ RECOMENDACIÓN</div>
        {recomendacion()}
      </div>
      {/* TU EQUIPO */}
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 14, background: C.panel, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.6, color: C.txt2 }}>TU EQUIPO</span>
          <span style={{ fontSize: 11, color: C.txt3 }}>{mine.length} / 13</span>
        </div>
        {Array.from({ length: 13 }).map((_, i) => {
          const p = mine[i]
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', borderBottom: i === 12 ? 'none' : `1px solid ${C.line}` }}>
              <div style={{ width: 18, fontSize: 10, color: C.txt3, textAlign: 'center' }}>{i + 1}</div>
              {p
                ? <><div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.n}</div><div style={{ fontSize: 11, color: C.green, fontWeight: 800 }}>{p.total.toFixed(1)}</div></>
                : <div style={{ flex: 1, fontSize: 12, color: C.txt3 }}>—</div>}
            </div>
          )
        })}
      </div>
      {/* PERFIL POR CATEGORIA */}
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 14, background: C.panel, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.6, color: C.txt2, marginBottom: 10 }}>PERFIL POR CATEGORÍA</div>
        {CATS.map((c) => {
          const v = profSum[c]
          const pct = Math.max(-1, Math.min(1, v / 8))
          const w = Math.abs(pct) * 50
          const left = v >= 0 ? 50 : 50 - w
          const col = v >= 0 ? C.green : C.red
          return (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{ width: 34, fontSize: 10, fontWeight: 800, color: C.txt2 }}>{LAB[c]}</div>
              <div style={{ flex: 1, height: 8, background: 'rgba(150,172,228,0.10)', borderRadius: 99, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(150,172,228,0.3)' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, borderRadius: 99, left: `${left}%`, width: `${w}%`, background: col }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const Board = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2px 0 10px' }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, color: C.txt2 }}>MEJORES DISPONIBLES</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar jugador…" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.txt, borderRadius: 9, padding: '8px 11px', fontSize: 13, width: 160, outline: 'none' }} />
      </div>
      {dispo.length === 0 && <div style={{ fontSize: 12, color: C.txt3, padding: 12 }}>Sin resultados.</div>}
      {dispo.map((p, i) => (
        <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${p.n === recName ? 'rgba(22,230,138,.4)' : C.line}`, borderRadius: 12, background: C.card, padding: '9px 11px', marginBottom: 7 }}>
          <div style={{ width: 22, textAlign: 'center', fontSize: 12, fontWeight: 800, color: C.txt3, flexShrink: 0 }}>{i + 1}</div>
          <Avatar p={p} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.n}</div>
            <div style={{ fontSize: 10, color: C.txt3, marginTop: 2 }}>{p.pos} · <span style={{ color: C.green, fontWeight: 800 }}>{p.total.toFixed(1)}</span> valor 9-cat</div>
            <div style={{ display: 'flex', gap: 2, marginTop: 5 }}>
              {CATS.map((c) => (
                <span key={c} style={{ fontSize: 7.5, fontWeight: 800, color: '#06121f', borderRadius: 3, padding: '2px 0', width: 23, textAlign: 'center', background: heatColor(p.z[c]) }}>{LAB[c]}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
            <button onClick={() => draft(p.n, true)} style={{ border: 'none', borderRadius: 7, padding: '5px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', background: C.green, color: '#04140C' }}>Yo lo cojo</button>
            <button onClick={() => draft(p.n, false)} style={{ border: `1px solid ${C.line2}`, borderRadius: 7, padding: '5px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', background: 'transparent', color: C.txt3 }}>Lo cogieron</button>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.fondo, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: FONT }}>
      {/* HEADER */}
      <div style={{ flexShrink: 0, paddingTop: 'env(safe-area-inset-top)', background: 'rgba(7,13,29,0.92)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: ANCHO, margin: '0 auto', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={onVolver} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, color: C.txt, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>‹</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.txt, letterSpacing: 0.3 }}>Sala de Draft</div>
              <div style={{ fontSize: 9.5, letterSpacing: 2, color: C.txt3, marginTop: 1 }}>FANTASY NBA · 9-CAT · SERPIENTE</div>
            </div>
            <div style={{ display: 'flex', border: `1px solid ${C.line2}`, borderRadius: 9, overflow: 'hidden' }}>
              {[{ s: 8, t: 'Liga 1 · Pick 8' }, { s: 6, t: 'Liga 2 · Pick 6' }].map((b) => (
                <button key={b.s} onClick={() => cambiarLiga(b.s)} style={{ background: slot === b.s ? C.txt : 'transparent', color: slot === b.s ? '#000' : C.txt2, border: 'none', padding: '7px 11px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>{b.t}</button>
              ))}
            </div>
            <button onClick={reset} style={{ background: 'transparent', border: `1px solid ${C.line2}`, color: C.txt2, borderRadius: 9, padding: '7px 11px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Reiniciar</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>
            <Pill valor={pickNo} etq="PICK GENERAL" />
            <Pill valor={ronda} etq="RONDA" />
            <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 0.6, borderRadius: 7, padding: '5px 11px', background: esMiTurno ? C.green : 'rgba(150,172,228,0.10)', color: esMiTurno ? '#04140C' : C.txt2 }}>
              {esMiTurno ? '¡TE TOCA AHORA!' : (proximo ? `PRÓXIMO TUYO: #${proximo}` : 'DRAFT COMPLETO')}
            </div>
            <Pill valor={mine.length} etq="EN TU EQUIPO / 13" />
          </div>
        </div>
      </div>

      {/* CUERPO */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: ANCHO, margin: '0 auto', padding: '14px 14px calc(env(safe-area-inset-bottom) + 50px)' }}>
          <div style={{ background: 'rgba(245,184,46,0.10)', border: '1px solid rgba(245,184,46,0.28)', color: C.gold, borderRadius: 10, padding: '9px 12px', fontSize: 11.5, lineHeight: 1.5, marginBottom: 14 }}>
            Números de baseline (temporada pasada) para que veas el motor funcionando. En octubre los refrescamos con proyecciones reales y se amplía la lista a todos los jugadores. El cerebro — el valor por categoría y las recomendaciones — ya es el de verdad.
          </div>
          {esEscritorio
            ? <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, alignItems: 'start' }}>{Board}{Sidebar}</div>
            : <div>{Sidebar}<div style={{ height: 16 }} />{Board}</div>}
        </div>
      </div>
    </div>
  )
}