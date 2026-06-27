// techado.js
// Maneja toda la comunicación del Techado con Supabase:
// publicar, leer publicaciones, reaccionar (like/dislike) y comentar.

import { supabase } from './supabaseClient'

// ---------- PUBLICAR ----------

// Publica un texto normal en el Techado (publicación de la persona, no expira)
// Acepta una plantilla de fondo opcional (publicaciones tipo Facebook con imagen).
export async function publicarTexto({ texto, imagenUrl = null, imagenes = null, fondo = null }) {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) return { error: 'Debes iniciar sesión para publicar.' }

  const limpio = (texto || '').trim()
  // Lista de imágenes (1 a varias). Si viene imagenUrl suelto, lo metemos en la lista.
  let lista = Array.isArray(imagenes) ? imagenes.filter(Boolean) : []
  if (!lista.length && imagenUrl) lista = [imagenUrl]

  if (!limpio && !lista.length) return { error: 'Escribe algo o agrega una foto.' }

  const { data, error } = await supabase.from('publicaciones').insert({
    autor_id: user.id,
    tipo: 'manual',
    tag: null,
    tag_color: null,
    titulo: null,
    texto: limpio || null,
    datos: {
      plantilla: 'estilo_tema',
      imagen: lista[0] || null,       // compatibilidad con lo viejo (1 foto)
      imagenes: lista.length ? lista : null,  // lista completa (varias fotos)
      fondo: fondo || null,
    },
    expira_en: null,
  }).select().single()

  if (error) return { error: error.message }
  return { data }
}

// Publica un juego rápido en el Techado (expira a las 24h)
export async function publicarJuego(resultado) {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) return { error: 'Debes iniciar sesión para publicar.' }

  // Armar título y texto desde la estadística (inteligencia básica)
  const jugadores = resultado.jugadores || []
  const totalEq = (eq) => jugadores.filter((j) => j.equipo === eq).reduce((a, j) => a + (j.pts || 0), 0)
  // Si vienen totales oficiales (ej. la LNB), mandan esos; si no, se suman del box.
  const totalA = resultado.totalA != null ? Number(resultado.totalA) : totalEq(0)
  const totalB = resultado.totalB != null ? Number(resultado.totalB) : totalEq(1)
  const hayEmpate = totalA === totalB

  // destacado = más puntos
  let destacado = null
  jugadores.forEach((j) => { if (!destacado || (j.pts || 0) > (destacado.pts || 0)) destacado = j })

  let titulo, texto
  if (hayEmpate) {
    titulo = `${resultado.nombreA} y ${resultado.nombreB} empataron`
    texto = `Quedaron ${totalA}-${totalB}.`
  } else {
    const ganador = totalA > totalB ? resultado.nombreA : resultado.nombreB
    const perdedor = totalA > totalB ? resultado.nombreB : resultado.nombreA
    titulo = `${ganador} venció a ${perdedor}`
    texto = `Ganaron ${Math.max(totalA, totalB)}-${Math.min(totalA, totalB)}.`
    if (destacado) {
      const nombreDest = destacado.nombre || ('#' + destacado.numero)
      texto += ` Destacado: ${nombreDest} con ${destacado.pts || 0} pts.`
    }
  }

  // Guardar TODOS los jugadores con TODAS sus stats (para la tabla completa y el % de tiro)
  const jugadoresGuardar = jugadores.map((j) => ({
    nombre: j.nombre || ('#' + (j.numero || '')), numero: j.numero || '', equipo: j.equipo,
    perfilId: j.perfilId || null,
    pts: j.pts || 0, reb: j.reb || 0, ast: j.ast || 0, rob: j.rob || 0, tap: j.tap || 0,
    fal: j.fal || 0, per: j.per || 0, min: j.min || 0,
    m2: j.m2 || 0, m3: j.m3 || 0, fa2: j.fa2 || 0, fa3: j.fa3 || 0,
    tlm: j.tlm || 0, tlf: j.tlf || 0,
  }))

  // Momentos destacados (rachas, parciales, hitos, manuales) capturados durante el juego
  const momentos = (resultado.momentos || []).map((m) => ({
    tipo: m.tipo || 'momento',
    etiqueta: m.etiqueta || '',
    jugId: m.jugId || null,
    equipo: typeof m.equipo === 'number' ? m.equipo : null,
    valor: m.valor || null,
    manual: !!m.manual,
  }))

  // Historial narrado: guardamos las líneas de narración (jugada por jugada)
  // Solo lo esencial para revivir el juego, sin pesar de más.
  const historialNarrado = (resultado.historial || []).map((h) => ({
    equipo: h.equipo,
    sub: h.sub,
    narracion: h.narracion || null,
    tono: h.tono || null,
    asistDe: h.asistDe || null,
    asistA: h.asistA || null,
  }))

  const narracion = generarNarracion({ nombreA: resultado.nombreA, nombreB: resultado.nombreB, totalA, totalB, hayEmpate, jugadores: jugadoresGuardar, destacado })

  const expira = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  // Si el usuario escribió un comentario propio, va arriba del resumen automático
  const textoFinal = resultado.textoExtra ? `${resultado.textoExtra}\n\n${texto}` : texto

  const { data, error } = await supabase.from('publicaciones').insert({
    autor_id: user.id,
    tipo: 'juego_rapido',
    tag: 'JUEGO DEL DÍA',
    tag_color: '#2fbf71',
    titulo,
    texto: textoFinal,
    datos: {
      nombreA: resultado.nombreA, nombreB: resultado.nombreB,
      logoA: resultado.logoA || null, logoB: resultado.logoB || null,
      logoUrlA: resultado.logoUrlA || null, logoUrlB: resultado.logoUrlB || null,
      totalA, totalB, hayEmpate,
      jugadores: jugadoresGuardar,
      momentos,
      historialNarrado,
      narracion,
      plantilla: resultado.plantilla || 'estilo_tema',
      statsActivas: resultado.statsActivas || null,
      tipoJuego: resultado.tipo || resultado.tipoJuego || null,
      formato: resultado.jugadoresPorLado || null,
    },
    expira_en: expira,
  }).select().single()

  if (error) return { error: error.message }
  return { data }
}

// Publica un juego de LIGA en el Techado. A diferencia del juego rápido,
// NO expira (queda fijo, es actividad oficial de la liga) y lleva la
// etiqueta de la liga. Reusa la misma inteligencia de resumen.
export async function publicarJuegoLiga(resultado, contexto = {}) {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) return { error: 'Debes iniciar sesión para publicar.' }

  const { ligaId = null, ligaNombre = null, modo = null } = contexto

  const jugadores = resultado.jugadores || []
  const totalEq = (eq) => jugadores.filter((j) => j.equipo === eq).reduce((a, j) => a + (j.pts || 0), 0)
  const totalA = resultado.totalA != null ? Number(resultado.totalA) : totalEq(0)
  const totalB = resultado.totalB != null ? Number(resultado.totalB) : totalEq(1)
  const hayEmpate = totalA === totalB

  let destacado = null
  jugadores.forEach((j) => { if (!destacado || (j.pts || 0) > (destacado.pts || 0)) destacado = j })

  let titulo, texto
  if (hayEmpate) {
    titulo = `${resultado.nombreA} y ${resultado.nombreB} empataron`
    texto = `Quedaron ${totalA}-${totalB}.`
  } else {
    const ganador = totalA > totalB ? resultado.nombreA : resultado.nombreB
    const perdedor = totalA > totalB ? resultado.nombreB : resultado.nombreA
    titulo = `${ganador} venció a ${perdedor}`
    texto = `Ganaron ${Math.max(totalA, totalB)}-${Math.min(totalA, totalB)}.`
    if (destacado) {
      const nombreDest = destacado.nombre || ('#' + destacado.numero)
      texto += ` Destacado: ${nombreDest} con ${destacado.pts || 0} pts.`
    }
  }

  const jugadoresGuardar = jugadores.map((j) => ({
    nombre: j.nombre || ('#' + (j.numero || '')), numero: j.numero || '', equipo: j.equipo,
    perfilId: j.perfilId || null,
    pts: j.pts || 0, reb: j.reb || 0, ast: j.ast || 0, rob: j.rob || 0, tap: j.tap || 0,
    fal: j.fal || 0, per: j.per || 0, min: j.min || 0,
    m2: j.m2 || 0, m3: j.m3 || 0, fa2: j.fa2 || 0, fa3: j.fa3 || 0,
    tlm: j.tlm || 0, tlf: j.tlf || 0,
  }))

  const momentos = (resultado.momentos || []).map((m) => ({
    tipo: m.tipo || 'momento', etiqueta: m.etiqueta || '', jugId: m.jugId || null,
    equipo: typeof m.equipo === 'number' ? m.equipo : null, valor: m.valor || null, manual: !!m.manual,
  }))

  const historialNarrado = (resultado.historial || []).map((h) => ({
    equipo: h.equipo, sub: h.sub, narracion: h.narracion || null, tono: h.tono || null,
    asistDe: h.asistDe || null, asistA: h.asistA || null,
  }))

  const narracion = generarNarracion({ nombreA: resultado.nombreA, nombreB: resultado.nombreB, totalA, totalB, hayEmpate, jugadores: jugadoresGuardar, destacado })

  const etiqueta = (ligaNombre ? ligaNombre : 'Liga').toUpperCase()

  const { data, error } = await supabase.from('publicaciones').insert({
    autor_id: user.id,
    tipo: 'liga',
    tag: etiqueta,
    tag_color: '#27d3c2',
    titulo,
    texto,
    datos: {
      fuente: 'liga',
      ligaId, ligaNombre, modo,
      nombreA: resultado.nombreA, nombreB: resultado.nombreB,
      logoA: resultado.logoA || null, logoB: resultado.logoB || null,
      logoUrlA: resultado.logoUrlA || null, logoUrlB: resultado.logoUrlB || null,
      totalA, totalB, hayEmpate,
      jugadores: jugadoresGuardar,
      momentos,
      historialNarrado,
      narracion,
      plantilla: resultado.plantilla || 'estilo_tema',
      statsActivas: resultado.statsActivas || null,
      tipoJuego: modo || null,
    },
    expira_en: null, // los juegos de liga quedan fijos en el Techado
  }).select().single()

  if (error) return { error: error.message }
  return { data }
}
export function generarNarracion({ nombreA, nombreB, totalA, totalB, hayEmpate, jugadores, destacado }) {
  if (hayEmpate) {
    return `${nombreA} y ${nombreB} se fueron parejo de principio a fin y terminaron empatados ${totalA}-${totalB}. Un duelo que pudo caer para cualquier lado.`
  }
  const gana = totalA > totalB ? nombreA : nombreB
  const pierde = totalA > totalB ? nombreB : nombreA
  const margen = Math.abs(totalA - totalB)
  let intro
  if (margen >= 15) intro = `${gana} pasó por encima de ${pierde}`
  else if (margen >= 6) intro = `${gana} controló el juego ante ${pierde}`
  else intro = `${gana} se llevó un partido cerrado contra ${pierde}`

  let cronica = `${intro}, ganando ${Math.max(totalA, totalB)}-${Math.min(totalA, totalB)}.`

  if (destacado) {
    const nd = destacado.nombre || ('#' + destacado.numero)
    cronica += ` ${nd} fue la figura con ${destacado.pts || 0} puntos`
    if ((destacado.reb || 0) >= 5) cronica += ` y ${destacado.reb} rebotes`
    else if ((destacado.ast || 0) >= 3) cronica += ` y ${destacado.ast} asistencias`
    cronica += '.'
  }

  // Segundo jugador mencionable (del equipo perdedor o segundo en puntos)
  const ordenados = [...(jugadores || [])].sort((a, b) => (b.pts || 0) - (a.pts || 0))
  if (ordenados.length > 1 && (ordenados[1].pts || 0) > 0 && ordenados[1].nombre !== (destacado && destacado.nombre)) {
    cronica += ` ${ordenados[1].nombre} respondió con ${ordenados[1].pts} puntos.`
  }
  return cronica
}

// Devuelve el id del usuario actual (o null si no hay sesión)
export async function miUsuarioId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id || null
}

// Trae el perfil completo del miembro logueado (para la barra superior)
export async function miPerfilCompleto() {
  const { data: sesion } = await supabase.auth.getUser()
  const user = sesion?.user
  if (!user) return null
  const { data, error } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
  if (error) return null
  return data
}

// ---------- LEER ----------

// Lee las publicaciones vigentes (no expiradas), más recientes primero
export async function leerTechado() {
  const ahora = new Date().toISOString()
  const { data, error } = await supabase
    .from('publicaciones_completas')
    .select('*')
    .or(`expira_en.is.null,expira_en.gt.${ahora}`)
    .order('creado_en', { ascending: false })
    .limit(50)

  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

// Lee la reacción del usuario actual a un conjunto de publicaciones
export async function misReacciones(idsPublicaciones) {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user || !idsPublicaciones.length) return {}

  const { data, error } = await supabase
    .from('reacciones')
    .select('publicacion_id, tipo')
    .eq('usuario_id', user.id)
    .in('publicacion_id', idsPublicaciones)

  if (error) return {}
  const mapa = {}
  ;(data || []).forEach((r) => { mapa[r.publicacion_id] = r.tipo })
  return mapa
}

// ---------- REACCIONAR ----------

// Pone o cambia una reacción ('like' | 'dislike'). Si ya tenía la misma, la quita.
export async function reaccionar(publicacionId, tipo) {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) return { error: 'Inicia sesión para reaccionar.' }

  // ¿Ya tiene reacción?
  const { data: existente } = await supabase
    .from('reacciones')
    .select('id, tipo')
    .eq('usuario_id', user.id)
    .eq('publicacion_id', publicacionId)
    .maybeSingle()

  if (existente) {
    if (existente.tipo === tipo) {
      // misma reacción -> quitarla (toggle)
      await supabase.from('reacciones').delete().eq('id', existente.id)
      return { quitado: true }
    } else {
      // cambiar de like a dislike o viceversa
      await supabase.from('reacciones').update({ tipo }).eq('id', existente.id)
      return { cambiado: tipo }
    }
  } else {
    await supabase.from('reacciones').insert({ publicacion_id: publicacionId, usuario_id: user.id, tipo })
    return { puesto: tipo }
  }
}

// Borra una publicación propia del Techado
export async function borrarPublicacion(publicacionId) {
  const { error } = await supabase.from('publicaciones').delete().eq('id', publicacionId)
  if (error) return { error: error.message }
  return { ok: true }
}

// ---------- COMENTAR ----------

// Lee los comentarios de una publicación (con nombre del autor)
export async function leerComentarios(publicacionId) {
  const { data, error } = await supabase
    .from('comentarios')
    .select('id, texto, creado_en, autor_id, perfiles(nombre, apellido, foto_url)')
    .eq('publicacion_id', publicacionId)
    .order('creado_en', { ascending: true })

  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

// Escribe un comentario
export async function comentar(publicacionId, texto) {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) return { error: 'Inicia sesión para comentar.' }
  const limpio = (texto || '').trim()
  if (!limpio) return { error: 'Escribe algo.' }

  const { data, error } = await supabase
    .from('comentarios')
    .insert({ publicacion_id: publicacionId, autor_id: user.id, texto: limpio })
    .select('id, texto, creado_en, autor_id, perfiles(nombre, apellido, foto_url)')
    .single()

  if (error) return { error: error.message }
  return { data }
}

// Borra un comentario propio
export async function borrarComentario(comentarioId) {
  const { error } = await supabase.from('comentarios').delete().eq('id', comentarioId)
  if (error) return { error: error.message }
  return { ok: true }
}

// ---------- UTILIDAD ----------

export function haceCuanto(fechaIso) {
  const ts = new Date(fechaIso).getTime()
  const min = Math.floor((Date.now() - ts) / 60000)
  if (min < 1) return 'ahora mismo'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} d`
}