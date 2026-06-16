import { logoPorId } from '../logosEquipos'

// Dibuja el logo de un equipo por su id. Si no hay logo, devuelve null (el llamador
// puede caer al color/inicial de siempre para compatibilidad).
export default function LogoEquipo({ id, size = 56, style }) {
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