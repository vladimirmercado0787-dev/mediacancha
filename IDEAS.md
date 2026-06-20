# MEDIA CANCHA — Cuaderno Maestro
### Ideas · Reglas de Diseño · Lecciones Aprendidas
*Mantenido por Jarvis para Vladimir. Fuente única de la verdad del proyecto.*
*Este archivo reemplaza la versión simple anterior. Es UN solo archivo, vive en la raíz del proyecto.*

---

## 0. Cómo funciona este cuaderno

- Es el documento de referencia del proyecto Media Cancha. **No es una pantalla de la app** — vive en el proyecto como archivo.
- **Ideas:** cuando Vladimir diga *"vamos a guardar la idea"*, Jarvis la mete en el módulo que corresponda, con su estado.
- **Reglas de diseño:** todo lo que estamos siguiendo (template, capas, temas, colores, gestos) queda en la sección 1. Antes de programar cualquier pantalla, se consulta aquí.
- **Lo que NO funciona:** los errores ya cometidos quedan en la sección 2, pa' no repetirlos. Esto resuelve el problema de perder el hilo con el tiempo.
- **Consultar lo incorporado:** los ítems marcados `HECHO` son lo que ya construimos. Para ver "qué ideas hemos incorporado", se buscan los `HECHO`.
- Al empezar un chat nuevo, Vladimir pega este archivo (o Jarvis lo baja del repo cuando esté público) y el contexto se refresca al instante.

**Estados:** `PENDIENTE` · `EN PROGRESO` · `HECHO`

---

## 1. REGLAS DE DISEÑO — qué estamos siguiendo

### 1.1 Principio de consistencia (LA REGLA DE ORO)
> Si una técnica ya funciona en una pantalla, se **copia idéntica** en las demás.
> **No se reinventa** una solución nueva para un problema que ya está resuelto.
> Antes de inventar otra técnica para algo, primero se revisa este cuaderno.

### 1.2 Stack técnico
- React + Vite
- Supabase (backend, auth, realtime). URL del proyecto: `https://cbpuhfuojfvvkudapgki.supabase.co`
- Capacitor 8 (build nativo iOS)
- **Solo estilos en línea (`style={{}}`). NADA de Tailwind.**
- Repo GitHub: `vladimirmercado0787-dev/mediacancha` (privado)
- Carpeta local: `~/Desktop/proyectos andamio /mediacancha` *(ojo: hay un espacio antes del slash)*

### 1.3 Template oficial de pantalla — OBLIGATORIO EN TODAS
Toda pantalla arranca con este contenedor raíz. Si una pantalla no lo usa, **contamina a las demás al navegar** (ver sección 2.1).

```js
{
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}
```

### 1.4 Capas de fondo
Los fondos van por detrás, desbordando un poquito pa' que no se vea borde:

```js
{
  position: 'absolute',
  top: -2, left: -2, right: -2, bottom: -2
}
```

### 1.5 Barra inferior (bottom nav)
```js
{
  position: 'fixed',
  bottom: 0,
  zIndex: 40,
  paddingBottom: 'env(safe-area-inset-bottom)'
}
```

### 1.6 Área scrollable
El contenido que hace scroll va dentro del flex, NO la pantalla entera:

```js
{
  flex: 1,
  minHeight: 0,
  overflowY: 'auto'
}
```

### 1.7 Temas (4)
`dorado` · `azul` · `claro` · `larimar`

### 1.8 Marca y colores
- Base / charcoal: `#08090c`
- Acento: dorado-bronce metálico
- Ícono de app: balón con mapa mundial dorado + líneas de cancha (IMG_9419.PNG)
- Asesor de imagen/diseño: Gemini

### 1.9 Interacciones y gestos
- **Long-press:** 420ms
- **Fix del teclado:** en los inputs, `onMouseDown` con `preventDefault()` pa' que no se cierre el teclado / no se pierda el foco.
- **Borrado estilo WhatsApp:** regla de las 24 horas para poder eliminar.

---

## 2. LO QUE NO FUNCIONA — no repetir estos errores

### 2.1 Pantallas sin el template oficial se contaminan entre sí
**Síntoma:** al navegar y volver atrás, una pantalla "ensucia" el layout de otra.
**Causa:** no usar el template oficial de la sección 1.3.
**Regla:** TODAS las pantallas usan el template oficial. Sin excepción.

### 2.2 Espacio negro debajo de la barra de luz (bottom nav)
**Síntoma:** queda un espacio negro debajo de la barra inferior, por debajo de la "barra de luz".
**Estado:** `PENDIENTE DE RESOLVER`
**Pista:** revisar el layering del fondo vs. la bottom nav y el `env(safe-area-inset-bottom)`.

### 2.3 Conflicto del botón Publicar (zIndex)
**Síntoma:** el botón Publicar queda tapado o no responde.
**Causa:** el composer y la bottom bar pelean por el zIndex.
**Regla de zIndex:** jerarquía clara — bottom nav en `zIndex: 40`; cuando el composer está abierto, va por encima de la bottom nav. Definir y respetar siempre el mismo orden.

---

## 3. IDEAS POR MÓDULO

### 3.1 TORNEOS

**Idea T-001 — Perfil propio del torneo con inteligencia automática** · `PENDIENTE`

Cada torneo tiene su **propio perfil, independiente y cerrado**. Adentro solo vive lo del torneo — nada de un tres-versus-tres suelto jugado en otro lugar. Todo lo que aparece ahí es del torneo y nada más.

El perfil **se construye solo** según se van jugando los partidos. La lógica detecta y publica automáticamente:
- **Remontadas** — un equipo venía perdiendo y le dio la vuelta.
- **Rachas** — equipos o jugadores en racha (victorias, buenas actuaciones).
- **Explosiones de jugadores** — actuaciones individuales fuera de lo normal (juegos rotos, números altos).

Toda esa inteligencia se reproduce sola en el perfil del torneo, sin meter nada a mano.

*Por definir:* umbrales que disparan cada detección (¿de cuántos abajo cuenta como remontada?, ¿cuántos juegos hacen una racha?, ¿qué número es una explosión?) y cómo se ve en el perfil (timeline, tarjetas, destacados).

---

### 3.2 LIGAS
*(Sin ideas guardadas todavía. Aquí van las ideas de ligas.)*

---

### 3.3 EL TECHADO — feed social / blog
*(Lo que llamamos "el techado": el muro social / blog de la app. Aquí van sus ideas.)*

*(Sin ideas guardadas todavía.)*

---

### 3.4 CHAT
*(Sin ideas nuevas guardadas. Lo ya construido está en la sección 4.)*

---

### 3.5 PERFIL
*(Sin ideas nuevas guardadas. Lo ya construido está en la sección 4.)*

---

### 3.6 APLICACIÓN EN GENERAL
*(Ideas que cruzan toda la app — navegación, rendimiento, etc. Sin ideas guardadas todavía.)*

---

## 4. REGISTRO DE LO YA CONSTRUIDO  (`HECHO`)
*Esto es "qué hemos incorporado". Cuando una idea de arriba se construye, se anota aquí.*

- **Logos:** 40 logos de equipos en SVG + componente `LogoEquipo.jsx`
- **Sistema social seguir/dejar de seguir:** tabla `seguidores`
- **Buscar:** `PantallaBuscar` + buscador en línea con dropdown en vivo
- **Perfil ajeno:** `PantallaPerfilAjeno` con seguir/dejar de seguir + estadísticas
- **MC ID:** oculto de la vista pero buscable
- **Chat privado en tiempo real:** `PantallaChat.jsx` estilo WhatsApp (borrado 24h, long-press 420ms, fijar/pin, fix de teclado)
- **Detalle de publicación:** modal `DetallePublicacion` con compartir nativo

---

*Fin del cuaderno. Las ideas nuevas se agregan en su módulo de la sección 3.*
