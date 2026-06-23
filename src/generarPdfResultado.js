import { jsPDF } from 'jspdf'

// ── Genera y comparte el resultado de CUALQUIER juego (rápido, fogueo o torneo)
// como un PDF bien diseñado, listo para abrir, imprimir o compartir.

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const fmtFecha = (d) => `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`

const NAVY = [11, 18, 32]
const ORO = [200, 138, 46]
const GRIS = [110, 116, 124]
const GRIS_CLARO = [232, 234, 238]
const TINTA = [34, 36, 42]
const AZUL_DR = [0, 45, 114]
const ROJO_DR = [206, 17, 38]

export function construirPdfResultado(resultado) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, H = 297, M = 14
  const ancho = W - 2 * M

  const jugadores = resultado?.jugadores || []
  const statsActivas = resultado?.statsActivas || ['pts']
  const nombreA = resultado?.nombreA || 'Equipo A'
  const nombreB = resultado?.nombreB || 'Equipo B'
  const historial = resultado?.historial || []
  const totalCuartos = resultado?.cuartos || 1

  const totalEq = (eq) => jugadores.filter((j) => j.equipo === eq).reduce((a, j) => a + (j.pts || 0), 0)
  const totalA = totalEq(0), totalB = totalEq(1)
  const ganador = totalA === totalB ? null : (totalA > totalB ? 0 : 1)

  // ===== ENCABEZADO =====
  doc.setFillColor(...NAVY); doc.rect(0, 0, W, 34, 'F')
  doc.setFillColor(...AZUL_DR); doc.rect(0, 34, W / 2, 1.8, 'F')
  doc.setFillColor(...ROJO_DR); doc.rect(W / 2, 34, W / 2, 1.8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.text('MEDIA CANCHA', M, 16)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(196, 206, 216)
  doc.text('Resultado del juego', M, 23)
  doc.setFontSize(9); doc.setTextColor(220, 226, 232)
  doc.text(fmtFecha(new Date()), W - M, 15, { align: 'right' })
  const tipoTxt = resultado?.tipo === 'fogueo' ? 'Fogueo' : (resultado?.tipo === 'torneo' ? 'Torneo' : 'Juego rápido')
  doc.text(tipoTxt, W - M, 21, { align: 'right' })

  let y = 47

  if (resultado?.nombreJuego) {
    doc.setTextColor(...GRIS); doc.setFont('helvetica', 'italic'); doc.setFontSize(11)
    doc.text(doc.splitTextToSize(resultado.nombreJuego, ancho)[0], M, y); y += 8
  }

  // ===== MARCADOR =====
  doc.setDrawColor(...GRIS_CLARO); doc.setFillColor(249, 249, 251); doc.setLineWidth(0.4)
  doc.roundedRect(M, y, ancho, 30, 3, 3, 'FD')
  const cy = y + 13
  // Equipo A
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
  doc.setTextColor(...(ganador === 0 ? ORO : TINTA))
  doc.text(doc.splitTextToSize(nombreA, ancho * 0.33)[0], M + 6, cy, { align: 'left' })
  // Equipo B
  doc.setTextColor(...(ganador === 1 ? ORO : TINTA))
  doc.text(doc.splitTextToSize(nombreB, ancho * 0.33)[0], W - M - 6, cy, { align: 'right' })
  // Marcador centro
  doc.setFontSize(30); doc.setTextColor(...(ganador === 0 ? ORO : TINTA))
  doc.text(String(totalA), W / 2 - 12, cy + 4, { align: 'right' })
  doc.setTextColor(...GRIS); doc.setFontSize(18); doc.text('–', W / 2, cy + 3.5, { align: 'center' })
  doc.setFontSize(30); doc.setTextColor(...(ganador === 1 ? ORO : TINTA))
  doc.text(String(totalB), W / 2 + 12, cy + 4, { align: 'left' })
  // ganador
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...GRIS)
  const pie = ganador == null ? 'Empate' : `Ganó ${ganador === 0 ? nombreA : nombreB}`
  doc.text(pie, W / 2, y + 26, { align: 'center' })
  y += 30 + 9

  // ===== COLUMNAS DE ESTADÍSTICA (según lo que se llevó) =====
  const cols = [{ k: 'pts', t: 'PTS' }]
  if (statsActivas.includes('reb')) cols.push({ k: 'reb', t: 'REB' })
  if (statsActivas.includes('ast')) cols.push({ k: 'ast', t: 'AST' })
  if (statsActivas.includes('rob')) cols.push({ k: 'rob', t: 'ROB' })
  if (statsActivas.includes('tap')) cols.push({ k: 'tap', t: 'TAP' })
  if (statsActivas.includes('per')) cols.push({ k: 'per', t: 'PER' })
  if (statsActivas.includes('fal')) cols.push({ k: 'fal', t: 'FAL' })
  const hayFallados = jugadores.some((j) => (j.fa2 || 0) + (j.fa3 || 0) > 0)
  const hayLibres = jugadores.some((j) => (j.tlm || 0) + (j.tlf || 0) > 0)
  if (hayFallados) cols.push({ k: 'tc', t: 'TC%', porc: true })
  if (hayLibres) cols.push({ k: 'tl', t: 'TL%', porc: true })

  const pct = (hechos, intentos) => intentos > 0 ? Math.round((hechos / intentos) * 100) + '%' : '—'
  const celda = (j, c) => {
    if (c.k === 'tc') return pct((j.m2 || 0) + (j.m3 || 0), (j.m2 || 0) + (j.m3 || 0) + (j.fa2 || 0) + (j.fa3 || 0))
    if (c.k === 'tl') return pct(j.tlm || 0, (j.tlm || 0) + (j.tlf || 0))
    return String(j[c.k] || 0)
  }

  const anchoNom = 56
  const anchoStat = (ancho - anchoNom) / cols.length

  const saltoSiHaceFalta = (necesita) => {
    if (y + necesita > H - 18) { doc.addPage(); y = 20 }
  }

  const tablaEquipo = (eq) => {
    const lista = jugadores.filter((j) => j.equipo === eq)
    if (!lista.length) return
    saltoSiHaceFalta(16 + lista.length * 7)
    // título equipo
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...TINTA)
    doc.text((eq === 0 ? nombreA : nombreB) + (ganador === eq ? '  ·  Ganador' : ''), M, y)
    y += 5
    // header
    doc.setFillColor(...NAVY); doc.rect(M, y, ancho, 7, 'F')
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.text('JUGADOR', M + 2, y + 4.8)
    cols.forEach((c, i) => doc.text(c.t, M + anchoNom + anchoStat * i + anchoStat / 2, y + 4.8, { align: 'center' }))
    y += 7
    // filas
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    lista.forEach((j, idx) => {
      if (idx % 2 === 1) { doc.setFillColor(245, 246, 248); doc.rect(M, y, ancho, 7, 'F') }
      doc.setTextColor(...TINTA)
      const etq = (j.numero ? '#' + j.numero + '  ' : '') + (j.nombre || ('#' + j.numero) || '—')
      doc.text(doc.splitTextToSize(etq, anchoNom - 3)[0], M + 2, y + 4.8)
      cols.forEach((c, i) => {
        const esPts = c.k === 'pts'
        doc.setFont('helvetica', esPts ? 'bold' : 'normal')
        doc.setTextColor(...(esPts ? ORO : TINTA))
        doc.text(celda(j, c), M + anchoNom + anchoStat * i + anchoStat / 2, y + 4.8, { align: 'center' })
      })
      doc.setFont('helvetica', 'normal')
      doc.setDrawColor(...GRIS_CLARO); doc.setLineWidth(0.2); doc.line(M, y + 7, M + ancho, y + 7)
      y += 7
    })
    y += 6
  }

  tablaEquipo(0)
  tablaEquipo(1)

  // ===== PARCIALES POR CUARTO (si aplica) =====
  const hayCuartos = totalCuartos > 1 && historial.some((h) => h.cuarto)
  if (hayCuartos) {
    saltoSiHaceFalta(28)
    const ptsCuartoEq = (q, eq) => historial.filter((h) => h.cuarto === q && h.equipo === eq).reduce((a, h) => a + ((h.suma && h.suma.pts) || 0), 0)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...TINTA)
    doc.text('Puntos por cuarto', M, y); y += 5
    const colsQ = totalCuartos + 1
    const anchoQ = (ancho - 50) / colsQ
    doc.setFillColor(...NAVY); doc.rect(M, y, ancho, 7, 'F')
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.text('EQUIPO', M + 2, y + 4.8)
    for (let q = 1; q <= totalCuartos; q++) doc.text(q + 'º', M + 50 + anchoQ * (q - 1) + anchoQ / 2, y + 4.8, { align: 'center' })
    doc.text('TOT', M + 50 + anchoQ * totalCuartos + anchoQ / 2, y + 4.8, { align: 'center' })
    y += 7
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    ;[0, 1].forEach((eq) => {
      doc.setTextColor(...TINTA)
      doc.text(doc.splitTextToSize(eq === 0 ? nombreA : nombreB, 48)[0], M + 2, y + 4.8)
      for (let q = 1; q <= totalCuartos; q++) doc.text(String(ptsCuartoEq(q, eq)), M + 50 + anchoQ * (q - 1) + anchoQ / 2, y + 4.8, { align: 'center' })
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...ORO)
      doc.text(String(totalEq(eq)), M + 50 + anchoQ * totalCuartos + anchoQ / 2, y + 4.8, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setDrawColor(...GRIS_CLARO); doc.line(M, y + 7, M + ancho, y + 7)
      y += 7
    })
    y += 6
  }

  // ===== PIE DE PÁGINA (en cada página) =====
  const paginas = doc.getNumberOfPages()
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p)
    doc.setDrawColor(...GRIS_CLARO); doc.setLineWidth(0.3); doc.line(M, H - 14, W - M, H - 14)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRIS)
    doc.text('Generado por Media Cancha  ·  by Andamio', M, H - 9)
    doc.text(`${p} / ${paginas}`, W - M, H - 9, { align: 'right' })
  }

  return doc
}

// Genera el PDF y lo comparte con el menú nativo (o lo abre/descarga como respaldo).
export async function compartirPdfResultado(resultado) {
  const doc = construirPdfResultado(resultado)
  const nombreA = (resultado?.nombreA || 'EquipoA')
  const nombreB = (resultado?.nombreB || 'EquipoB')
  const fileName = `MediaCancha_${nombreA}_vs_${nombreB}.pdf`.replace(/[^\w.\-]+/g, '_')
  const blob = doc.output('blob')

  // 1) Compartir nativo (AirDrop, Mail, Guardar en Archivos, Imprimir)
  try {
    const file = new File([blob], fileName, { type: 'application/pdf' })
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Resultado del juego', text: 'Resultado · Media Cancha' })
      return { ok: true, via: 'share' }
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok: true, via: 'cancelado' }
  }

  // 2) Respaldo: abrir el PDF en visor (desde ahí se imprime/guarda)
  try {
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) { setTimeout(() => URL.revokeObjectURL(url), 20000); return { ok: true, via: 'abrir' } }
    URL.revokeObjectURL(url)
  } catch (e) {}

  // 3) Último respaldo: descargar
  try { doc.save(fileName); return { ok: true, via: 'descargar' } } catch (e) {}
  return { ok: false }
}