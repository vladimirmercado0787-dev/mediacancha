// ============================================================================
//  CENTRO DE COMANDO — métricas privadas para el fundador.
//  Solo cuenta datos GLOBALES y reales (nada inventado). Lo que está protegido
//  por seguridad (ej. mensajes) no se cuenta, para no dar números engañosos.
// ============================================================================
import { supabase } from './supabaseClient'

// ¿La cuenta actual es admin? (marca es_admin en su perfil)
export async function soyAdmin() {
  try {
    const { data: u } = await supabase.auth.getUser()
    const id = u && u.user && u.user.id
    if (!id) return false
    const { data } = await supabase.from('perfiles').select('es_admin').eq('id', id).single()
    return !!(data && data.es_admin)
  } catch (e) { return false }
}

// Cuenta una tabla (devuelve null si falla, para mostrar "—" sin romper nada).
async function contar(tabla, filtro) {
  try {
    let q = supabase.from(tabla).select('*', { count: 'exact', head: true })
    if (filtro) q = filtro(q)
    const { count, error } = await q
    return error ? null : (count || 0)
  } catch (e) { return null }
}

// Todas las métricas principales, en paralelo.
export async function cargarMetricas() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const hace7 = new Date(Date.now() - 7 * 24 * 3600 * 1000)
  const hace30 = new Date(Date.now() - 30 * 24 * 3600 * 1000)

  const [usuarios, usuHoy, usu7, usu30, torneos, ligas, publicaciones, jLiga, jTorneo, album] = await Promise.all([
    contar('perfiles'),
    contar('perfiles', (q) => q.gte('creado_en', hoy.toISOString())),
    contar('perfiles', (q) => q.gte('creado_en', hace7.toISOString())),
    contar('perfiles', (q) => q.gte('creado_en', hace30.toISOString())),
    contar('torneos'),
    contar('ligas'),
    contar('publicaciones'),
    contar('liga_juegos'),
    contar('torneo_juegos'),
    contar('torneo_album'),
  ])

  return {
    usuarios, usuHoy, usu7, usu30,
    torneos, ligas, publicaciones, album,
    juegos: (jLiga || 0) + (jTorneo || 0),
  }
}

// Crecimiento: registros por día en los últimos `dias` días.
export async function crecimientoUsuarios(dias = 14) {
  try {
    const desde = new Date(Date.now() - (dias - 1) * 24 * 3600 * 1000); desde.setHours(0, 0, 0, 0)
    const { data, error } = await supabase.from('perfiles').select('creado_en').gte('creado_en', desde.toISOString())
    if (error || !data) return []
    const buckets = {}
    for (let i = 0; i < dias; i++) {
      const d = new Date(desde.getTime() + i * 24 * 3600 * 1000)
      buckets[d.toISOString().slice(0, 10)] = 0
    }
    data.forEach((r) => { const k = (r.creado_en || '').slice(0, 10); if (k in buckets) buckets[k]++ })
    return Object.entries(buckets).map(([dia, n]) => ({ dia, n }))
  } catch (e) { return [] }
}

// Geografía: usuarios por provincia (de mayor a menor).
export async function usuariosPorProvincia() {
  try {
    const { data, error } = await supabase.from('perfiles').select('provincia')
    if (error || !data) return []
    const m = {}
    data.forEach((r) => { const p = (r.provincia || 'Sin provincia').trim() || 'Sin provincia'; m[p] = (m[p] || 0) + 1 })
    return Object.entries(m).map(([provincia, n]) => ({ provincia, n })).sort((a, b) => b.n - a.n)
  } catch (e) { return [] }
}

// Demografía: sexo, edad y país — todo de una sola consulta.
export async function demografia() {
  const vacio = { sexo: [], edad: [], pais: [] }
  try {
    const { data, error } = await supabase.from('perfiles').select('sexo, fecha_nacimiento, pais')
    if (error || !data) return vacio

    const sx = { hombre: 0, mujer: 0, otro: 0 }
    const ps = {}
    const rangos = { '13-17': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0, 'Sin dato': 0 }
    const hoy = new Date()

    data.forEach((r) => {
      // sexo
      const s = (r.sexo || '').toLowerCase()
      if (s === 'hombre') sx.hombre++
      else if (s === 'mujer') sx.mujer++
      else sx.otro++
      // país
      const p = (r.pais || 'Sin dato').trim() || 'Sin dato'
      ps[p] = (ps[p] || 0) + 1
      // edad (calculada de la fecha de nacimiento)
      if (r.fecha_nacimiento) {
        const n = new Date(r.fecha_nacimiento)
        if (!isNaN(n.getTime())) {
          let e = hoy.getFullYear() - n.getFullYear()
          const mm = hoy.getMonth() - n.getMonth()
          if (mm < 0 || (mm === 0 && hoy.getDate() < n.getDate())) e--
          if (e < 18) rangos['13-17']++
          else if (e < 25) rangos['18-24']++
          else if (e < 35) rangos['25-34']++
          else if (e < 45) rangos['35-44']++
          else rangos['45+']++
        } else rangos['Sin dato']++
      } else rangos['Sin dato']++
    })

    const sexo = [{ etiqueta: 'Hombres', n: sx.hombre }, { etiqueta: 'Mujeres', n: sx.mujer }]
    if (sx.otro) sexo.push({ etiqueta: 'Otro / sin dato', n: sx.otro })
    const edad = Object.entries(rangos).filter(([, v]) => v > 0).map(([etiqueta, n]) => ({ etiqueta, n }))
    const pais = Object.entries(ps).map(([etiqueta, n]) => ({ etiqueta, n })).sort((a, b) => b.n - a.n)
    return { sexo, edad, pais }
  } catch (e) { return vacio }
}