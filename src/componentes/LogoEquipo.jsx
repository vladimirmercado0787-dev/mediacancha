import { logoPorId } from '../logosEquipos'

// Dibuja el logo de un equipo. Dos modos:
//  • url  → una imagen (ej. los escudos oficiales de la LNB en el CDN).
//  • id   → un logo SVG propio de la app (logosEquipos).
// Si no hay ni uno ni otro, devuelve null (el llamador cae al color/inicial).
export default function LogoEquipo({ id, url, size = 56, style }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain', display: 'block', ...(style || {}) }}
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
    )
  }
  const logo = logoPorId(id)
  if (!logo) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={style}
      dangerouslySetInnerHTML={{ __html: logo.svg }}
    />
  )
}