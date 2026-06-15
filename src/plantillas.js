// plantillas.js
// Catálogo de plantillas (fondos) para las publicaciones del Techado.
// El default es el "estilo del tema" (limpio, sin imagen).
// Luego 5 fondos gratis con imagen + 10 de pago. Las de pago se desbloquean con cualquier pago.

import monumentoSantiago from './assets/plantillas/plantilla_monumento_santiago.png'
import canchaBarrioNoche from './assets/plantillas/plantilla_cancha_barrio_noche.png'
import balonDorado from './assets/plantillas/plantilla_balon_dorado.png'
import aroAtardecer from './assets/plantillas/plantilla_aro_atardecer.png'
import canchaMadera from './assets/plantillas/plantilla_cancha_madera.png'

// Las 10 de pago todavía no tienen imagen (las generará Vladimir).
// Cuando estén, se importan y se les pone la img.

export const PLANTILLAS = [
  // ----- DEFAULT: banner blanco limpio (sin imagen) -----
  { id: 'estilo_tema', nombre: 'Blanco limpio', img: null, gratis: true, zonaTexto: 'centro', esTema: true },

  // ----- Cuero/crema (estilo credencial, sin imagen PNG, se dibuja con CSS) -----
  { id: 'cuero_credencial', nombre: 'Cuero credencial', img: null, gratis: true, zonaTexto: 'centro', esCuero: true },

  // ----- GRATIS (con imagen) -----
  { id: 'monumento_santiago', nombre: 'Monumento de Santiago', img: monumentoSantiago, gratis: true, zonaTexto: 'arriba' },
  { id: 'cancha_barrio_noche', nombre: 'Cancha de barrio', img: canchaBarrioNoche, gratis: true, zonaTexto: 'arriba' },
  { id: 'balon_dorado', nombre: 'Balón dorado', img: balonDorado, gratis: true, zonaTexto: 'arriba' },
  { id: 'aro_atardecer', nombre: 'Aro al atardecer', img: aroAtardecer, gratis: true, zonaTexto: 'centro' },
  { id: 'cancha_madera', nombre: 'Cancha de madera', img: canchaMadera, gratis: true, zonaTexto: 'arriba' },

  // ----- DE PAGO — sin imagen aún -----
  { id: 'tablero_cristal', nombre: 'Tablero de cristal', img: null, gratis: false, zonaTexto: 'abajo' },
  { id: 'gradas_llenas', nombre: 'Gradas llenas', img: null, gratis: false, zonaTexto: 'abajo' },
  { id: 'santo_domingo_skyline', nombre: 'Skyline de Santo Domingo', img: null, gratis: false, zonaTexto: 'arriba' },
  { id: 'manos_balon', nombre: 'Manos en el balón', img: null, gratis: false, zonaTexto: 'arriba' },
  { id: 'silueta_clavada', nombre: 'Silueta de clavada', img: null, gratis: false, zonaTexto: 'centro' },
  { id: 'malecon_noche', nombre: 'Malecón de noche', img: null, gratis: false, zonaTexto: 'arriba' },
  { id: 'abstracto_dorado', nombre: 'Abstracto dorado', img: null, gratis: false, zonaTexto: 'centro' },
  { id: 'cancha_aerea', nombre: 'Cancha aérea', img: null, gratis: false, zonaTexto: 'centro' },
  { id: 'humo_neon', nombre: 'Humo neón', img: null, gratis: false, zonaTexto: 'centro' },
  { id: 'estadio_luces', nombre: 'Estadio con luces', img: null, gratis: false, zonaTexto: 'abajo' },
]

// Busca una plantilla por su id
export function plantillaPorId(id) {
  return PLANTILLAS.find((p) => p.id === id) || null
}

// La plantilla por defecto: el estilo limpio del tema (sin imagen)
export const PLANTILLA_DEFAULT = 'estilo_tema'

// ¿El usuario puede usar esta plantilla? (gratis siempre; de pago solo si pagó)
export function puedeUsar(plantilla, usuarioPago) {
  if (!plantilla) return false
  return plantilla.gratis || !!usuarioPago
}