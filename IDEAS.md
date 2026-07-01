# MEDIA CANCHA — Cuaderno Maestro
### Ideas · Reglas de Diseño · Lecciones Aprendidas
*Mantenido por Jarvis para Vladimir. Fuente única de la verdad del proyecto.*
*Es UN solo archivo, vive en la raíz del proyecto.*

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
- Entorno: Mac (macOS, zsh, Homebrew, Git, Node, VS Code, Xcode instalado)

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
`dorado` · `azul` · `claro` · `larimar`. Guardados en `localStorage('mc_tema')`. Default: `dorado`.

### 1.8 Marca y colores
- Base / charcoal: `#08090c`
- Acento: dorado-bronce metálico
- Ícono de app: balón con mapa mundial dorado + líneas de cancha (IMG_9419.PNG)
- Asesor de imagen/diseño: Gemini (verificar, no aplicar a ciegas)

### 1.9 Interacciones y gestos
- **Long-press:** 420ms
- **Fix del teclado:** en los inputs, `onMouseDown` con `preventDefault()` pa' que no se cierre el teclado / no se pierda el foco.
- **Borrado estilo WhatsApp:** regla de las 24 horas para poder eliminar.

### 1.10 LA FÓRMULA OFICIAL DEL TECLADO (candado) — para CUALQUIER pantalla con input
Dos piezas que se combinan y SÍ funcionan juntas:

**A) El candado body-freeze** (lo que de verdad detiene el fondo de moverse):
```js
useEffect(() => {
  const scrollY = window.scrollY
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollY}px`
  document.body.style.left = '0'; document.body.style.right = '0'; document.body.style.width = '100%'
  return () => {
    document.body.style.position=''; document.body.style.top=''; document.body.style.left=''
    document.body.style.right=''; document.body.style.width=''; window.scrollTo(0, scrollY)
  }
}, [])
```

**B) El motor del teclado** (la raíz sube con el teclado):
- `Keyboard.setResizeMode({ mode: KeyboardResize.None })` al montar; restaurar `Native` al desmontar.
- Listeners `keyboardWillShow` / `keyboardWillHide` que guardan `kbAlto`.
- Altura raíz: `kbAlto > 0 ? calc(100dvh - max(0, kbAlto-30)px) : 100dvh`. El ajuste es 30.

**C) Estructura de 3 capas:** Header (`flexShrink:0`) · Contenido (`flex:1, minHeight:0, overflowY:auto`, solo esto scrollea) · Footer (`flexShrink:0`).

**REGLA DE ORO DEL TECLADO:** si una pantalla con teclado se porta mal → hacerla **pantalla independiente** (como Chat o Publicar), NO un overlay dentro de otra.

### 1.11 Responsive — TRES niveles (no dos)
Hay que pensar SIEMPRE en los tres, no solo celular:
- **Celular** (< 820px): una columna.
- **iPad / tablet** (820–1180px): dos columnas, ancho medio.
- **Computadora** (≥ 1180px): usa casi toda la pantalla (hasta ~1600px), columnas anchas.

Detección por `window.innerWidth` + listener de `resize`.

### 1.12 Modales: móvil vs computadora
- En **celular**: los modales van pegados abajo (`alignItems: 'flex-end'`) — natural en móvil.
- En **computadora**: los modales van **centrados** (`alignItems: 'center'` + padding). Si se dejan pegados abajo en compu, dejan media pantalla en blanco (ver 2.4).

### 1.13 Probar en computadora de VERDAD (no el modo iPad de Xcode)
- Xcode con "My Mac (Designed for iPad)" corre la app **como iPad**, NO como computadora. Por eso se ve rara.
- Para ver la versión computadora real: `npm run dev` y abrir el link (`localhost:5173`) en Safari/Chrome. Ahí se actualiza solo al guardar.
- Comando para cargar al celular (un solo tiro): `npm run build && npx cap sync ios`, luego en Xcode elegir el iPhone y Play.

### 1.13b FLUJO DE PRUEBA DOBLE — regla de trabajo
Cada vez que terminemos un archivo/cambio que ya esté en la app, Jarvis le da a Vladimir el comando para cargar al celular (`npm run build && npx cap sync ios` + Xcode Play). Así Vladimir chequea **en computadora** (con `npm run dev`) **y en el celular**, para ver cómo queda en ambos. Doble verificación siempre.

### 1.14 Workflow de archivos grandes con Jarvis
- Para que Jarvis lea/edite archivos del repo: poner el repo **público** un momento → Jarvis baja con `curl` → edita → devuelve → Vladimir hace push → vuelve a **privado**.
- Jarvis valida con esbuild antes de entregar. Entrega archivos completos (nunca parches parciales): Cmd+A → Cmd+V → Cmd+S en VS Code.

### 1.15 COBERTURA DE PANTALLA COMPLETA (safe-area) — el candado del shell rígido
**Qué resuelve:** el espacio negro arriba (notch) o abajo (home indicator) que no toma el color del tema, y el efecto **"columpio"** (la app baila al navegar y solo se arregla cerrando/reabriendo). **Causa raíz:** la capa nativa de iOS calculaba los márgenes por su cuenta y peleaba con el CSS. **La cura es quitarle el control al nativo y dárselo TODO al CSS.** Son cuatro piezas que van JUNTAS (si pones una sola, se rompe):

**1) Config nativa — `capacitor.config.json`:** `ios.contentInset: "never"` (NUNCA `"always"`). Con `"always"` iOS añade márgenes nativos que pelean con `viewport-fit=cover` y causan el columpio. Con `"never"`, el WebView usa el 100% de la pantalla física y el CSS manda.

**2) Barra de estado — plugin `@capacitor/status-bar`:** al usar `"never"` hay que decirle al nativo que dibuje el HTML POR DEBAJO del notch. En `App.jsx`, un `useEffect([])` de arranque: `StatusBar.setOverlaysWebView({ overlay: true })` + `StatusBar.setStyle({ style: tema==='dia' ? Style.Dark : Style.Light })` (texto claro en temas oscuros, oscuro en el tema día). Envolver en try/catch (en la web el plugin no existe).

**3) Shell rígido global — `index.css`:** el `body` se clava al borde y NO se desplaza nunca:
```css
html, body { position: fixed; top:0; left:0; right:0; bottom:0;
  width:100%; height:100dvh; min-height:100dvh; overflow:hidden; background:#04060c; }
#root { width:100%; height:100%; display:flex; flex-direction:column;
  overflow-y:auto; position:relative; }   /* SIN max-width: rompería la vista de computadora */
```
SIEMPRE `100dvh`, **NUNCA `100vh`** (en iPhone `100vh` se queda corto y asoma el negro). El `#root` queda en `overflow-y:auto` mientras existan pantallas viejas (pa' que deslicen y no se corten); cuando TODAS usen la plantilla, se aprieta a `overflow:hidden`.

**4) Cada pantalla = la plantilla (1.3) con el safe-area DENTRO:** contenedor `inset:0` flex column overflow hidden; **header con `paddingTop: env(safe-area-inset-top)` + `flexShrink:0`** (absorbe el notch); **área de contenido `flex:1; overflowY:'auto'; WebkitOverflowScrolling:'touch'`** = el ÚNICO lugar con scroll; **barra inferior con `paddingBottom: env(safe-area-inset-bottom)` + `flexShrink:0`** (absorbe el home indicator).

**Refuerzo en `App.jsx`:** como navegamos por estado `vista` (no React Router), un `useEffect([vista])` resetea el scroll en cada cambio: `window.scrollTo(0,0)` + `documentElement/body/#root .scrollTop = 0` + `requestAnimationFrame`.

**LA REGLA DE ORO de cobertura:** el scroll vive SOLO dentro del área de contenido, NUNCA en el body/página. Si una pantalla deja scrollear el body, contamina a las demás.

**Dato nativo:** el appId real es **`com.andamio.mediacancha`** — si una IA externa te da config, verifica que no lo cambie (a Gemini se le escapó una vez).

### 1.16 Diseño nuevo de la pantalla pública (red social) — pase visual en curso
Look de red social deportiva moderna, columna única centrada (máx ~480px, centrada en pantallas grandes — NO va en `#root`, cada pantalla centra su propio contenido). Piezas: header (logo + tricolor, buscador, botón de tema discreto, mensajes, menú); fila de historias **"En la cancha"** (bolitas estilo stories); tarjeta **Jugador de la Semana** (depende del rating P-004 → datos de MUESTRA por ahora); feed (resultados con logos vía `TarjetaResultado` **SE QUEDAN**, fotos, texto); **barra inferior:** Inicio · Ligas · **Anotar** (centro) · Ranking · Perfil.
- **Botón "+" rojo flotante = PUBLICAR** (el composer ya NO va en línea en el feed; es discreto, se abre con el "+").
- **"Anotar" central = marcar juegos/torneos** (son cosas DISTINTAS al "+").
- **Temas (5)** — actualiza la regla 1.7: **noche** (azul dominicano, default) · **día** (claro) · **dorado** · **larimar** (azul-verde oscuro) · **negro**. Selector discreto (botón en el header que los cicla). En `localStorage('mc_tema')`.

### 1.17 REGLA DE PRESERVACIÓN — NO BORRAR FUNCIONALIDAD (candado de proceso)
> **El problema que esto resuelve:** al cambiar de sesión/ventana, Jarvis a veces edita encima de una versión vieja y se PIERDE funcionalidad que ya estaba construida (tabs, módulos, ratings). Esto frustra y nos hace retroceder.

**Reglas obligatorias para Jarvis en CADA sesión nueva:**
1. **Antes de tocar una pantalla, leerla completa y hacer inventario** de lo que YA tiene (tabs, módulos, botones, lógica). No asumir; verificar en el archivo real.
2. **NO se cambia, quita, ni "mejora" NADA que no se haya pedido.** Si Vladimir no dio la orden de cambiar algo, ese algo se queda **idéntico**. Solo se toca lo que él ordena en esta sesión.
3. **Siempre bajar la versión fresca del repo antes de editar.** Vladimir hace `git push` de su local antes de que Jarvis edite. **El repo manda.**
4. **Entregar el archivo COMPLETO** y verificar el conteo de líneas / que las piezas viejas siguen presentes antes de entregar.
5. **Anotar TODO en este cuaderno**, hasta lo más mínimo que hablemos, y **consultarlo siempre** al empezar y antes de cada cambio.
6. **Auditoría periódica:** cada cierto tiempo, revisar archivo por archivo contra este cuaderno (Vladimir da acceso a su GitHub para esto). No es cada sesión; es de control.

**Frase ancla:** *"Si no se pidió, no se toca. Si ya funcionaba, se preserva."*

---

## 2. LO QUE NO FUNCIONA — no repetir estos errores

### 2.1 Pantallas sin el template oficial se contaminan entre sí (efecto "columpio")
**Síntoma:** al navegar y volver atrás, una pantalla "ensucia" el layout de otra; la app baila y solo se arregla cerrando/reabriendo.
**Causa raíz (descubierta):** la pantalla vieja usaba scroll de página / `100vh` y activaba el rebote elástico de iOS; al volver, el WebView quedaba desfasado. Lo AGRAVABA el `contentInset: "always"` de la config nativa (márgenes nativos peleando con el CSS).
**Cura:** el candado del shell rígido completo — ver **regla 1.15** (`contentInset:"never"` + status-bar overlay + body fijo + cada pantalla con su plantilla y scroll interno). Un solo candado a medias (solo `position:fixed` en el body, con `contentInset:"always"` todavía puesto) ROMPE el notch — hay que poner las cuatro piezas juntas.
**Regla:** TODAS las pantallas usan el template oficial (1.3) con safe-area interno (1.15). Sin excepción.
**Estado:** base `RESUELTA` (1.15 aplicada). Falta pasar pantalla por pantalla las viejas a la plantilla.

### 2.2 Espacio negro arriba (notch) y abajo (home indicator)
**Síntoma:** banda negra que no toma el color del tema, arriba o abajo.
**Causa raíz (descubierta):** `100vh` en `html/body` (se queda corto en iPhone) + `contentInset: "always"` empujando el WebView. Faltaba que el CSS tomara el control del safe-area.
**Cura:** `100dvh` (NUNCA `100vh`) + el candado del shell rígido — ver **regla 1.15**.
**Estado:** `RESUELTO` (victoria en equipo con Gemini: él dio el diagnóstico del `contentInset`; se ajustó el appId real, se quitó su `max-width:480` que rompía escritorio, y se dejó el `#root` en `overflow-y:auto` pa' la transición).

### 2.3 Conflicto del botón Publicar (zIndex)
**Síntoma:** el botón Publicar queda tapado o no responde.
**Causa:** el composer y la bottom bar pelean por el zIndex.
**Regla de zIndex:** jerarquía clara — bottom nav en `zIndex: 40`; cuando el composer está abierto, va por encima de la bottom nav. Definir y respetar siempre el mismo orden.
**Estado:** `HECHO` (se resolvió haciendo Publicar pantalla independiente + candado body-freeze).

### 2.4 Media pantalla en blanco al escribir (en computadora)
**Síntoma:** en la computadora, al escribir en un modal pegado abajo, se sube media pantalla en blanco.
**Causa:** modal con `alignItems: 'flex-end'` en pantalla grande.
**Solución:** en computadora, centrar el modal (ver regla 1.12).
**Estado:** `HECHO` en PantallaJuegoJugadores.

### 2.5 Modificar la barra equivocada
**Síntoma:** se hace un cambio en "la barra" y no aparece.
**Causa:** hay DOS barras de navegación en escritorio — la barra dorada (dentro del carnet, `NAV_PRINCIPAL`) y la **barra superior blanca** (MEDIA CANCHA · Inicio · El Techado · Torneos · Rankings · Mapa). La que el usuario ve y usa en compu es la **superior blanca**.
**Regla:** confirmar con captura cuál barra es antes de tocar.

### 2.6 Consejo de Gemini sobre teclado que no resolvió todo
`KeyboardResize.Body` + `scrollTo(0,0)` + `position:absolute` hacía aparecer el botón pero NO detenía el scroll suelto. La pieza que faltaba era el **candado body-freeze** (1.10 A). Lección: verificar los consejos externos, no aplicarlos a ciegas.

### 2.7 DOS pantallas de publicar — no confundirlas
**Síntoma:** se activa el botón de foto y "no hace nada".
**Causa:** hay DOS lugares para publicar: (1) `PantallaPublicar.jsx` (con R al final) — la pantalla COMPLETA/separada que el usuario abre para publicar; y (2) el composer dentro de `PantallaPublica.jsx` (el techado). Vladimir usa **PantallaPublicar** (la separada). Si solo se activa el botón en una, la otra sigue muerta.
**Regla:** cuando se trabaje en "publicar", confirmar en CUÁL de las dos pantallas, y mantener las dos consistentes. Lo que MUESTRA las publicaciones (carrusel de fotos) vive en PantallaPublica (el feed).

### 2.8 Tabla nueva en Supabase: el robot da 403 "permission denied"
**Síntoma:** el robot (service key) sube todo bien menos la tabla nueva → `HTTP 403 · 42501 · permission denied for table X`.
**Causa:** crear la tabla y ponerle RLS con política de `SELECT` NO le da permiso de **escritura** al `service_role`. Falta el GRANT a nivel de tabla.
**Cura:** después de crear cualquier tabla nueva, correr en el SQL Editor:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.NOMBRE_TABLA TO service_role;
GRANT SELECT ON public.NOMBRE_TABLA TO anon, authenticated;
```
**Regla:** toda tabla nueva = crear + RLS/política de lectura + estos dos GRANT. Los tres pasos juntos.

### 2.9 Cargar datos de un sitio Next.js (lecciones del robot histórico LNB)
Tres tropiezos que ya resolvimos al raspar `lnb.do`. Aplican a cualquier scraping futuro (NBA, BSN):
1. **Los JSON de `/_next/data/...` IGNORAN los query params.** Probamos `?competition=4`, `?season=4`, etc. y siempre devolvía el año actual. → Para datos por temporada/filtro hay que usar la **API REST de verdad** (en LNB: `https://lnb.do/api`). Cómo se encontró: husmeando los chunks JS del sitio (las "linternas" de descubrimiento).
2. **PostgREST: `PGRST102 "All object keys must match"`.** Al subir un array, TODAS las filas deben tener exactamente las mismas columnas. Si un campo viene `undefined`, `JSON.stringify` lo borra y rompe el lote. → **Cura:** normalizar antes de subir — sacar la unión de llaves de todas las filas y rellenar las que falten con `null` (y `undefined`→`null`). Se metió ese normalizador en la función `upsert`.
3. **`23502 null value in column "id"`.** Un juego "fantasma" venía sin id desde la API. → **Cura:** saltar (`continue`) cualquier registro sin id antes de empujarlo (`if (!m || m.id == null) continue;` y `if (tm.id == null) continue;`).
**Regla:** al raspar, siempre (a) confirmar la ruta real antes de codificar — no adivinar, usar una linterna desechable; (b) normalizar filas antes del upsert; (c) saltar registros sin clave primaria.

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

**Idea T-002 — Asistente Crear Torneo (wizard por pasos)** · `EN PROGRESO`

Wizard de 5 pasos ya construido: (1) Identidad — nombre, logo oficial o emoji, lugar. (2) Formato — copa/liga/mixto + cantidad de equipos. (3) Nivel y categoría. (4) Estadísticas que se llevan. (5) Revisar y crear. El creador queda como presidente automáticamente.
**Falta:** paso de capitanes (asignar un capitán por equipo buscándolo en el sistema) y el sistema de invitaciones (ver T-004).

**Idea T-003 — Niveles y categorías dominicanas** · `HECHO`

- **Nivel:** Interbarrial · Intermedio · Superior · Empresarial · Libre.
- **Categoría (edad):** Mini · U15 · U17 · U21 · Superior.
- **Rama:** Masculino · Femenino.

**Idea T-004 — Equipos por capitán + invitaciones con confirmación** · `PENDIENTE`

Para no complicar la creación: el organizador define cantidad de equipos y le asigna **un capitán** a cada uno (buscándolo por nombre en el sistema; no hace falta el MC ID). Después **cada capitán agrega a sus propios jugadores** desde su cuenta. Reparte el trabajo.

**Sistema de invitaciones:** al agregar a alguien (capitán, jugador o directivo) se le manda una **invitación**. La persona la ve en su bandeja "Mis invitaciones" y debe **aceptar**. Hasta que acepte, sale como **"por confirmar"**. Solo los confirmados pueden jugar. Esto evita torneos falsos. Mismo motor de invitaciones para jugadores Y directiva.

- **Auto-elegirse siempre:** el creador puede ponerse a sí mismo como capitán o presidente (no aparece en la búsqueda pero se auto-agrega), igual que en juego rápido.
- **Buscar personas:** primero la lista de amigos (a quién sigues), luego todo el sistema. Si está registrado, se puede agregar; el MC ID viaja con el jugador.

**Idea T-005 — Directiva con mínimo presidente** · `PENDIENTE`

Roles: presidente (OBLIGATORIO, por defecto el creador, auto-confirmado), vicepresidente, tesorero, vocal, secretario (todos opcionales). Mínimo: solo el presidente.

**Idea T-006 — Refuerzos** · `PENDIENTE`

Un jugador se puede marcar como **refuerzo** (badge "Refuerzo"). Importante en el baloncesto dominicano (límite de refuerzos por equipo, refuerzos nacionales vs locales). Ya existe la columna `es_refuerzo` en la tabla.

**Idea T-007 — Logo de equipo opcional y editable por autorizados** · `PENDIENTE`

Al poner los equipos, botón para **subir el logo del equipo** — opcional. Solo lo puede cambiar quien esté **autorizado**: el director del torneo o el capitán de ese equipo. Usar el helper `fotos.js` (`subirFotoEquipo`). También se puede ofrecer un menú con los 40 escudos que ya existen.

**Idea T-008 — iPad/computadora para anotar** · `PENDIENTE`

El día a día del fan es en celular, pero las **anotaciones y la organización** se harán en iPad/computadora (pantalla grande, el organizador en la mesa de la cancha). Por eso el responsive de torneos es clave. Futuro: menú lateral vertical en pantalla ancha en vez de pestañas arriba.

**Idea T-009 — Rating del torneo (algoritmo de calificación, escala 0–100)** · `PENDIENTE`

El torneo se califica solo con un **número de 0 a 100**. Como la app sabe en qué nivel juega cada jugador, el dato ya está pa' calcularlo.

**DECISIÓN (formato): número 0–100, NO estrellas ni solo categoría.** Razón de Vladimir: el número **diferencia fino**. Con estrellas, dos torneos de 5 estrellas se ven iguales aunque uno sea mucho mejor. Con el rating, un 95 al lado de un 88 dice al instante cuál es superior. (La categoría tipo "Élite/A/B" se puede mostrar ADEMÁS, como etiqueta encima del número, pero el corazón es el número.)

**El algoritmo NO es un promedio pelao.** Es una mezcla de tres cosas:
1. **Base por nivel declarado del torneo** — un Superior arranca más alto que un Interbarrial.
2. **Nivel promedio de los que de verdad participaron.**
3. **Bono por estrellas (la salsa)** — mientras más jugadores de alto nivel haya y más alto el techo, más sube. Así un solo jugador de Superior entre interbarriales SÍ mueve la aguja (no se diluye), y diez de Superior la mueven muchísimo. La presencia de alto nivel tiene que NOTARSE.

**Dependencia / orden de construcción:** este rating se apoya en el rating de los jugadores, que depende de contar los juegos por jugador (`juegos_jugados` existe pero no se llena todavía). Orden: (1) contar juegos → (2) rating de jugadores → (3) rating del torneo. **Versión de arranque:** usar la clasificación con que entra cada jugador (su nivel declarado) como atajo, y afinar cuando el rating fino esté listo.

**Dónde vive:** en el perfil del torneo, como parte de la inteligencia de T-001.

**Idea T-010 — Ediciones / temporadas con reactivación** · `PENDIENTE`

Un torneo **no muere cuando termina**: queda **congelado** con todo registrado (juegos terminados, stats, todo), pero se puede **reactivar** pal próximo año o dentro de unos meses, **manteniendo la configuración** y dejando hacer cambios (reasignar equipos, jugadores, directiva, etc.).

Esto significa que un torneo en realidad tiene **ediciones (temporadas)**. Implicaciones:
- **Rating por edición:** cada edición tiene su propio rating según quién jugó esa vez (se conecta con T-009).
- **Prestigio histórico:** el torneo como tal va acumulando reputación con el tiempo. Muchas ediciones fuertes = torneo de renombre. Si una edición viene más floja, el rating de ESA edición baja, pero la historia muestra que el año pasado estuvo fuerte. **Nada se pierde — todo queda guardado por edición.**
- Se conecta con T-001 (vive en el perfil/inteligencia del torneo).

*Por definir:* cómo se muestra la línea de ediciones (timeline de años), y si el "rating del torneo" que se ve por fuera es el de la última edición o un promedio histórico ponderado.

**Idea T-011 — Popularidad del torneo (por tráfico)** · `PENDIENTE`

Métrica **SEPARADA del rating**. El **rating** mide NIVEL/calidad (qué tan fuerte es). La **popularidad** mide ATENCIÓN/tráfico (cuánta gente lo mira). Son dos ejes distintos y se muestran **distinto** pa' no confundirlos.

**Base:** el tráfico de la página del torneo. Más tráfico = más popular.

**Cómo se mide bien (que no se pueda inflar):**
- **Visitantes únicos** al perfil del torneo — NO visitas crudas (pa' que uno refrescando 100 veces no infle un torneo falso). Las visitas repetidas se usan aparte como señal de engagement.
- Señales que la hacen más real y difícil de fingir: **seguidores del torneo** (si se pueden seguir) y **compartidas** (cuántas veces se compartió el torneo o sus resultados a chats — eso es viralidad pura).

**Dos tipos de popularidad:**
- **En racha (trending):** tráfico de los **últimos 7 días** — lo que está caliente AHORA.
- **Histórica:** tráfico de toda la vida. Un torneo viejo puede tener muchas visitas acumuladas pero no estar caliente hoy; uno nuevo puede estar ardiendo.

**Cómo se muestra:** diferente al rating. El rating es número 0–100 (calidad). La popularidad = conteo de visitas/seguidores + un **badge de "en racha"** (llama) cuando está trending. Sirve pa' ordenar el **"Explorar"** y subir arriba los torneos calientes.

**Mecánica (Supabase):** tabla tipo `torneo_visitas` (`torneo_id`, `usuario_id`, `fecha`). Únicos = distinct `usuario_id`; en racha = visitas de los últimos 7 días. (O un contador + log.)

*Por definir:* pesos si se mezclan (visitas + seguidores + compartidas), y si la "popularidad" que se ve por fuera es el número crudo o un índice.

**Idea T-012 — PANTALLA PÚBLICA DEL TORNEO + votación del MVP + seguir/álbumes** · `DISEÑO APROBADO ✅ (jun 2026)`

*Diseño completo y maqueta aprobados por Vladimir. Detalle largo en el documento aparte `TORNEO_pantalla_publica_diseno.md` y la maqueta `maqueta_pantalla_publica_torneo.html`. Resumen del acuerdo:*

**Concepto:** cada torneo es una **mini-liga con personalidad** — su propia pantalla pública, igual que la pantalla de la NBA, pero del torneo. El fanático entra y vive TODO. El objetivo es **provocar tráfico**: el torneo genera momentos → se comparten al Techado/chats → traen gente → sube la popularidad → los calientes suben en Explorar → entra más gente. La rueda gira sola. (La investigación confirma: lo interactivo —votos/predicciones/encuestas— es el segundo formato más importante para los fanáticos, por encima de stats y marcadores; las predicciones son lo que MÁS hace volver.)

**SECCIONES (pestañas: Portada · Juegos · Tabla · Líderes · Votos · Álbumes):**
- **Portada:** encabezado del torneo (logo, nombre, edición, nivel/categoría/rama) con DOS sellos — **Rating** (cero a cien = calidad, T-009) y **Popularidad** (visitas/seguidores + llama 🔥 si está en racha = tráfico, T-011); botones **Seguir** y **Compartir**; **carrusel de momentos automáticos** (rota solo) + cinta de **en vivo / próximo**.
- **Juegos:** marcador **agrupado por día** (hora RD), en vivo → próximos → finales. Cada juego abre detalle (marcador, parciales, line-up, **narración automática** del anotador, stats, head-to-head) + compartir resultado.
- **Tabla / Llave:** liga = tabla de posiciones; copa = **bracket interactivo**; mixto = las dos.
- **Líderes + Carrera por el MVP:** carrusel de categorías (top cinco, cliqueable) con MC Rating; módulo de los **tres candidatos al MVP**, el #1 coronado.
- **Votos** y **Álbumes** (ver abajo). También **Equipos/Jugadores** (logo de equipo T-007, badge de refuerzo T-006).

**SISTEMA DE VOTACIÓN DEL MVP (lo central, aprobado):**
- El MVP **no se elige a ciegas**: el sistema filtra con números, el fanático decide entre los mejores.
- **Paso 1:** el sistema saca el **Top diez** con un puntaje que mezcla **estadísticas individuales** (MC Rating del torneo) + **récord del equipo** (un jugador de equipo ganador pesa más; el MVP casi siempre sale de arriba) + **impacto/consistencia**.
- **Paso 2:** los **tres primeros** de ese Top diez entran a votación.
- **Paso 3:** la votación **abre sola en la última semana de la temporada regular**. Un voto por persona, resultado en vivo.
- **Paso 4:** se corona el MVP al cerrar, con tarjeta compartible.
- **REQUISITO:** para saber cuándo es "la última semana de la regular", la app calcula el **calendario y las fases** desde el formato (**cantidad de equipos + cantidad de juegos + tipo de eliminatoria**). Ese **motor de calendario/fases es pieza base** — sin él no hay "última semana".
- Mostrar **dos MVP que conversan:** el **MVP por números** (#1 del Top diez) y el **MVP del fanático** (ganador de la votación); la diferencia genera discusión = tráfico.

**OTRAS VOTACIONES Y ENGANCHE:**
- **Jugador de la jornada** (MVP del fanático por jornada).
- **Predicción del próximo juego** ("¿quién gana?") → aciertos suman puntos → **ranking de predictores** (lo que más hace volver).
- **Califica la actuación** (nota del fanático al jugador).
- **Encuestas** del organizador (preguntas sueltas) · **reacciones en vivo** (emojis).
- **Anti-trampa:** un voto por usuario registrado + límite de frecuencia (popularidad real, conecta con T-011).

**SEGUIR + DISTRIBUCIÓN (el feed del torneo):** al dar **Seguir**, al fanático le llega TODO lo del torneo a su feed e historias — noticias, publicaciones, resultados, momentos automáticos, **historias** (lo del día) y **álbumes nuevos**. El torneo también **publica al Techado** (de ahí salen seguidores nuevos).

**ESPACIO PROPIO:** el torneo tiene su **muro/publicaciones** (anuncios, noticias + los momentos automáticos) y su **espacio de álbumes de fotos** (jornadas, premiación, equipos). Historias = lo del momento; álbumes = pa' guardar. Suben el organizador y quizás los capitanes.

**INTELIGENCIA AUTOMÁTICA (conecta con T-001):** los momentos se escriben solos (remontadas, rachas, explosiones, récords) y alimentan portada, feed y lo compartible.

**TABLAS NUEVAS (Supabase):** `torneo_juegos` (si no existe), `torneo_encuestas` (tipo mvp/prediccion/rating/libre), `torneo_votos` (único: encuesta_id + usuario_id), `torneo_predicciones` (+ puntos), `torneo_calificaciones`, `torneo_seguidores`, `torneo_visitas` (únicos + trending siete días), `torneo_momentos`, `torneo_publicaciones`, `torneo_albumes`, `torneo_fotos`. **Recordar grants/RLS (error 2.8).**

**PLAN POR FASES:** (1) esqueleto público (portada + juegos por día + tabla/llave + líderes), responsive desde el principio. (2) compartir + seguir + visitas (popularidad básica). (3) capa de enganche (encuestas + predicciones + ranking de predictores + MVP del fanático + calificación). (4) inteligencia automática (T-001). (5) rating y popularidad finos (T-009/T-011) + ediciones (T-010). Transversal: completar el asistente (capitanes/invitaciones/directiva/enganche, T-004/T-005) y el modo de anotación (L-007), de donde sale la data.

**CONFIG NUEVA (amplía el wizard T-002):** agregar pasos de **equipos+capitanes** (T-004, con logo T-007), **directiva** (T-005), **modo de anotación** (Rápido/Fogueo/Torneo, L-007) y **enganche** (interruptores: predicciones, MVP, calificación, encuestas, público/privado, seguir). A futuro: **edición/temporada** (T-010).

*Decisiones por definir antes de codear:* (1) umbrales de la inteligencia (de cuántos abajo = remontada, cuántos juegos = racha, qué número = explosión); (2) predicción solo "¿quién gana?" o también marcador/margen; (3) calificación en estrellas o nota uno a diez; (4) torneos públicos por defecto o el organizador decide.

**Idea T-013 — ANOTACIÓN EN VIVO DEL TORNEO (arquitectura completa)** · `DISEÑO APROBADO ✅ (jun 2026)`

Reutiliza el anotador que YA existe (`PantallaJuegoVivo`: puntos, faltas, asistencias encadenadas, rebotes en cascada, tiros libres, expulsiones, narrador). NO se reinventa — se CONECTA a los torneos. (Error pasado a NO repetir: se construyó un anotador pelado nuevo Y se puso un botón "Anotar" en la pantalla PÚBLICA. Ambas cosas se borran.)

**Dos mundos que NO se mezclan:** el administrador OPERA; el público solo MIRA.

**Las CUATRO superficies donde vive un juego de torneo:**
1. **Centro de Comando (admin)** — el calendario con los juegos; por cada juego: *asignar anotador* + botón *Iniciar*. Aquí se opera todo.
2. **Anotador en vivo (`PantallaJuegoVivo`)** — el anotador asignado mete todo, con las reglas de seguridad.
3. **Pantalla Pública (espejo, solo lectura)** — la portada muestra los juegos EN VIVO con el marcador corriendo, y los resultados + estadísticas al terminar. CERO botones de anotar.
4. **Techado + perfil de cada involucrado** — mientras se juega, el juego sale EN VIVO en el techado de cada participante; al terminar le queda el resultado y sus estadísticas. Aplica a TODOS los inscritos: jugadores, directiva y anotador.

**Reglas del anotador (seguridad en la cancha):**
- **Quién NO puede anotar:** ningún jugador, capitán ni manager de ESE juego específico (NO del torneo entero — solo de ese partido).
- **Quién SÍ puede:** cualquier fanático o miembro de la directiva (gente neutral al juego).
- **Al salir (hacia atrás):** confirma "¿seguro?" y GUARDA — no se pierde lo anotado.
- **Al terminar (hacia adelante):** confirma "¿el juego terminó?" — no se finaliza de un solo toque.
- **Cambio de anotador en medio del juego:** se puede pasar a OTRO anotador, en otro teléfono, sin perder nada. El juego sigue por donde iba.

**LA COLUMNA QUE UNE TODO:** el juego en vivo vive en la BASE DE DATOS mientras se juega (no en el teléfono del anotador). De ahí beben la pública y los techados, se logra el cambio de anotador, y nada se pierde. Una sola pieza resuelve tres cosas: el en vivo, el techado y el handoff.

**Dependencia:** las estadísticas por jugador exigen que los equipos tengan jugadores → **capitanes e invitaciones (T-004) va PRIMERO.**

**Base que ya existe para conectar:** `techado.js` ya publica un juego (`publicarJuego`, expira 24h); el perfil ya guarda stats de juego con fuente `torneo`/`liga`/`rapido`. Falta estirarlo a TODOS los involucrados y meterle el en vivo.

**ORDEN DE CONSTRUCCIÓN:**
1. Borrar la basura (mi `PantallaAnotador`, el botón "Anotar" de la pública, su ruta en App).
2. Capitanes e invitaciones (T-004): meter jugadores a los equipos. El cimiento.
3. La columna: el juego en vivo guardándose en la base.
4. Centro de Comando del admin: calendario + asignar anotador + Iniciar.
5. Conectar `PantallaJuegoVivo` al juego del torneo (config desde equipos+rosters) + reglas de seguridad + cambio de anotador.
6. La pública en vivo (portada con el juego corriendo).
7. El techado + el perfil, en vivo y con resultados, para cada involucrado.

**El reloj — decisión:** por ahora **MANUAL y por fuera** (no se complica para arrancar).
**FUTURO (T-013b) — cronometrista aparte:** un usuario asignado SOLO al reloj, sincronizado con la pantalla y el sistema. Permite contar los **minutos jugados por cada jugador** y por cuarto, como la mesa de control del baloncesto real (separado del anotador).

**PENDIENTES de arreglo (estado jun 2026):** ya existe `PantallaTorneoConfig` (config formal del juego de torneo: cuartos, minutos, faltas, bonus, stats, reloj) que cae en el flujo de siempre (Jugadores → JuegoVivo → Resultado). FALTA: (1) **quitar la entrada "Anotar" de la pantalla PÚBLICA** — es provisional; va en el Centro de Comando del organizador (paso 4); (2) **conectar el resultado a las tablas del torneo** (`torneo_juegos` + `torneo_juego_jugadores`) para que mueva la tabla y salga en la pública — ahora solo guarda en el día/perfil; (3) aplicar las reglas de seguridad y el cambio de anotador (paso 5).

---

### 3.2 LIGAS

**Idea L-005 — Box score por jugador por partido** · `HECHO ✅ (jun 2026)`
Ruta del detalle: `/_next/data/${buildId}/partido/x/${id}.json` → líneas en `match.teams[].players[].statistics` (mismos nombres que el róster). Robot Fase 5 las carga a la tabla `lnb_juego_jugadores` (2,420 líneas, 101 juegos). La app las muestra en el detalle del juego; si faltan, cae al respaldo de promedios. Pendiente futuro: NBA con el mismo patrón (robot → tabla `*_juego_jugadores`).

---

### 🏀 L-006 — LNB: DOCUMENTACIÓN TÉCNICA MAESTRA (la fuente de datos completa) · `HECHO ✅ (jun 2026)`

> Esta es la referencia única de cómo entra la data de la LNB. Si algo se rompe o se va a replicar (NBA, BSN), se lee esto primero. Molde reutilizable.

**DE DÓNDE SALE LA DATA — dos caminos, ambos GRATIS:**
`lnb.do` es un sitio **Next.js**. Hay dos formas de leerlo:
1. **JSON de Next** (`/_next/data/${buildId}/...json`). El `buildId` se saca fresco de la portada (`<script id="__NEXT_DATA__">`), así nunca se rompe cuando la liga actualiza. Lo usa **`robot-lnb.js`** (año actual): `estadisticas.json`, `calendario.json`, `equipo/x/{id}.json`, `partido/x/{id}.json`.
2. **API REST pública** — base **`https://lnb.do/api`**. Lo usa **`robot-lnb-historico.js`** (todos los años). Es la única forma de pedir años viejos (ver lección 2.9).

**LOS ENDPOINTS DE LA API (`https://lnb.do/api`):** todos devuelven `{ok, data, pagination?}`.
- `/public/competition` → todas las temporadas. **IDs: 2022=1, 2023=2, 2024=3, 2025=4, 2026=5.**
- `/public/competition/current` → temporada actual.
- `/public/match?competition_id={id}&page={p}` → juegos de un año (PAGINADO; leer `pagination.pages`).
- `/public/match/{id}` → **detalle del juego CON box score**: `data.teams[].players[].statistics`.
- `/public/competition/{id}/match/dates` → fechas con juegos de un año (`{date, count}`).
- `/public/standing/last/competition/{id}` → tabla (¡SOLO la actual tiene datos; años viejos = `[]`!).
- `/public/standing/bracket/competition/{id}` → los playoffs (stages/series) del año.
- `/public/player/{id}/statistics` → **estadísticas del jugador SEPARADAS POR AÑO** (array, una entrada por temporada). De aquí sale el promedio por año.
- `/public/player/leaders?competition_id={id}&type={t}` → líderes por año. `type` = points · assists · rebounds · blocks · steals · efficiency · threes.
- `/public/player/team/{teamId}` → róster actual de un equipo.

**NOMBRES DE LOS CAMPOS de `statistics` (iguales en TODOS lados):** `points, rebounds, assists, minutes, steals, blocks, personal_fouls, turnovers, field_goals_attempted/made/percent, three_points_attempted/made/percent, free_throw_attempted/made/percent`. (`efficiency` solo en algunos.) En Supabase los guardamos como `fg_*`, `three_*`, `ft_*`.

**TABLAS EN SUPABASE (todas con lectura pública + GRANT, ver 2.8):**
- `lnb_temporadas` (id) · `lnb_equipos` (id) · `lnb_jugadores` (id; identidad + stats del año actual).
- `lnb_standing` (temporada_id, equipo_id) · `lnb_lideres` (temporada_id, categoria, rank).
- `lnb_juegos` (id) · `lnb_juego_equipos` (juego_id, equipo_id).
- `lnb_juego_jugadores` (juego_id, jugador_id) → **box score por partido**.
- `lnb_jugador_temporada` (jugador_id, temporada_id) → **promedios por año** (rating por año se calcula en la app).
- `lnb_noticias` (id) · `lnb_jugador_semana` (id).

**LOS DOS ROBOTS:**
- **`robot-lnb.js`** — año ACTUAL. Vía JSON de Next. Fases 1+4 (data + rósters) + Fase 5 (box score vía `partido/x/{id}`). Se corre seguido (idealmente diario/2x al día) con la service key por terminal.
- **`robot-lnb-historico.js`** — TODOS los años viejos (2022–2025) vía la API REST. Trae juegos, box scores (~9,000 líneas), líderes, tabla W-L calculada, y los promedios por año de cada jugador (679 jugadores, 857 filas). Se corre una vez (o de vez en cuando). NO toca el robot normal.
- **Las "linternas"** (`robot-lnb-*-descubrir*.js`) son DESECHABLES: solo sirvieron para descubrir rutas/estructura. No son robots; se botan.

**EL MC RATING (cómo se calcula):** la app NO lo guarda; lo **recalcula en vivo** cada vez que se abre la pantalla, con los stats que haya en Supabase. Fórmula: `100 * pow(eff / maxEff_liga, 0.85)`, donde `eff = points + rebounds + assists + steals + blocks − turnovers` (o la columna `efficiency` si viene). Relativo al mejor de esa liga/año. → **se actualiza solo** con cada corrida del robot. Misma fórmula en Líderes y en el badge del perfil (helper compartido `mcRatingDe`).

**ESTRUCTURA DE LA PANTALLA `PantallaLNB.jsx`:** tabs Juegos · Tabla · Equipos · Líderes · Noticias. Líderes arranca en MC Rating (1ra categoría). Detalle del juego muestra box score real si existe (si no, promedios). Perfil del jugador con badge de rating arriba-derecha (zIndex 80, por encima de todo). Modales: DetalleJuego z60 · DetalleEquipo z65 · PerfilJugador z80.

**PENDIENTE (lo único que falta para cerrar la LNB):** el **selector de año** en la pantalla, para cambiar entre 2022–2026 y ver juegos+box score, líderes, equipos y rating de cada temporada (usando `lnb_jugador_temporada`, `lnb_lideres` y `lnb_standing` filtrados por `temporada_id`).

---

**Idea L-001 — Integración de la LNB (robot de datos, GRATIS)** · `FASE 1 HECHA ✅ (faltan fases 2 y 3)`

Meta: traer la **LNB** (la liga pro dominicana, la más importante del país) dentro de Media Cancha — calendario, resultados, standing, estadísticas y noticias. Un **robot que hace al menos 2 consultas al día** y refresca todo (ej.: una en la mañana, con los juegos de la noche anterior ya finales, y una de noche tras los partidos del día). Flexible: en noches de muchos juegos se le puede subir la frecuencia cambiando solo el reloj.

**HALLAZGO CLAVE (investigado):** el sitio oficial `lnb.do` está hecho en **Next.js**, renderiza la data en el HTML (no es JS pesado escondido), y tiene URLs predecibles → **se puede leer GRATIS, sin API de pago.**
- URLs: `/calendario`, `/estadisticas`, `/blog` (noticias), `/jugador/{Nombre}/{id}`, `/equipo/{Nombre}/{id}`.
- Equipos (con ID): Soles(1), Metros(2), Leones(3), Reales(4), Marineros(5), Cañeros(6), Gigantes(7), Titanes(8), Heroes(9).
- Estadísticas disponibles (top 10 c/u): Puntos, Asistencias, Rebotes, Bloqueos, Robos, Triples, Eficiencia.
- Temporadas: 2022–2026, fases Regular / Playoff / Final.
- Fotos de jugadores en CDN (DigitalOcean Spaces).

**Arquitectura:** temporizador Supabase (al menos 2x/día) → robot lee las páginas de `lnb.do` → extrae y organiza → (para NOTICIAS, una IA reescribe el titular en español con crédito) → guarda en tablas Supabase (`lnb_calendario`, `lnb_estadisticas`, `lnb_equipos`, `lnb_jugadores`, `lnb_noticias`) → la app lo muestra en su sección LNB / El Techado.

**Investigar primero:** si hay una **API JSON escondida** detrás del Next.js (suele haber un endpoint tipo `/api` o un CMS). Si se halla, leer JSON es más limpio y robusto que leer el HTML.

**Advertencias honestas:**
- Leer el sitio (scraping) es **frágil**: si rediseñan `lnb.do`, el lector se rompe y hay que arreglarlo. Mantenimiento.
- Revisar los términos de "Uso aceptable" del sitio.
- Para NOTICIAS aplica la regla de copyright: reportar el **hecho** + dar crédito ("según LNB") + enlace; NO copiar artículos completos textuales. Los datos (marcadores, stats, calendario) son hechos, no tienen copyright.

**Costo:** GRATIS (sin API de pago).

**Estilo:** la pantalla LNB debe tener MUCHO estilo, con sabor dominicano bien visible (puede jugar con motivos/identidad dominicana), pero siempre coherente con la marca (charcoal `#08090c` + dorado-bronce metálico). Que se vea distinta y con orgullo, sin desentonar.

**Fases:** (1) robot de datos factuales (calendario, resultados, standing, líderes) — primera versión, la rápida; (2) noticias con IA + crédito; (3) pantalla LNB dentro de la app.

**✅ FASE 1 — CONSTRUIDA Y CORRIENDO (jun 2026):**
- **Confirmado:** `lnb.do` es Next.js Pages Router. El robot busca el **buildId fresco** cada vez (así nunca se rompe cuando la liga actualiza). Endpoints:
  - Portada `/` (en `__NEXT_DATA__.props.pageProps`): `standingData.standing.data` (tabla, 9 equipos), `postsData.posts` (noticias), `weeklyPlayer.data` (jugador de la semana).
  - `/_next/data/{buildId}/estadisticas.json`: líderes en 7 categorías (`points`, `assits`(sic)=assists, `rebounds`, `blocks`, `steals`, `threes`, `efficiency`) + `competition` (5 temporadas: ids 1→5 = años 2022→2026).
  - `/_next/data/{buildId}/calendario.json`: `calendar` + `lastMatches` (juegos con marcadores por cuarto, `teams[]` con `winner`/`visitor`/`total_score`).
- **Imágenes (CONFIRMADO):** base = `https://lnb-media.sfo3.cdn.digitaloceanspaces.com/` + el campo `image_url`. Así se muestran escudos de equipos y fotos de jugadores.
- **Tablas Supabase creadas (8):** `lnb_equipos`, `lnb_temporadas`, `lnb_standing`, `lnb_lideres`, `lnb_juegos`, `lnb_juego_equipos`, `lnb_noticias`, `lnb_jugador_semana` (todas con lectura pública / RLS select=true).
- **Permisos (clave):** las tablas nuevas necesitan `GRANT select,insert,update,delete ... to service_role;` y `GRANT select ... to anon, authenticated;`. Sin eso, el robot da error 403.
- **Robot:** archivo `robot-lnb.js` (sin dependencias, usa `fetch` nativo de Node). Lee la service key por **variable de entorno** (NUNCA dentro de un archivo subido a Git). Primera corrida subió: 9 equipos · 5 temporadas · 9 standing · 70 líderes · 101 juegos · 202 juego_equipos · 4 noticias · 1 jugador semana.
- **FALTA:** **Fase 2** = automatizar al menos 2x/día en la nube (Supabase cron / Edge Function — hoy corre a mano con el comando). **Fase 3** = pantalla LNB en la app (la del mockup, con sabor dominicano). Pendientes menores: confirmar `source_url` de las noticias (patrón de URL del post en lnb.do) y, a futuro, reescribir noticias con IA + crédito.

**DISEÑO FASE 2 — automatización con auto-monitoreo (decidido):**
- **La LNB SÍ se lleva en vivo** (confirmado: agregadores muestran juegos en el 4º cuarto con reloj corriendo). FALTA confirmar que `lnb.do` mismo actualice en vivo en su sitio (su data tiene `period` + parciales, casi seguro sí) → **prueba:** correr el robot DURANTE un juego y ver si los marcadores se mueven (hay juego 21-jun: Metros vs Gigantes).
- **El robot se auto-monitorea — Vladimir NO activa nada a diario.** Dos modos:
  - **Completo:** 2x/día, jala todo (líderes, standing, noticias, calendario).
  - **Latido en vivo:** un chequeo chiquito cada pocos minutos (Supabase cron), todo el día, casi sin costo. Lee el calendario (que el robot ya tiene) → "¿hay juego corriendo ahora?". Si NO → se duerme al instante. Si SÍ → modo en vivo: refresca solo los juegos activos. Al terminar los juegos, se apaga solo. **Él lee el horario y se activa; nadie lo toca.**
- **Eficiencia clave:** en modo en vivo, el robot **solo ESCRIBE cuando un marcador cambió de verdad**. Así, aunque mire cada minuto, solo trabaja cuando hay algo nuevo (y nos dice cada cuánto se mueve la liga).
- Futuro (opcional): en vez de latido fijo, el run diario podría programar crons exactos por hora de juego (pg_cron permite agregar/quitar jobs). Pero el latido fijo barato es más simple y robusto pa' empezar.

**Idea L-003 — Rediseño premium de la pantalla LNB + MC Rating de jugadores** · `CONSTRUIDO ✅ (jun 2026)`

Tratar la LNB como página deportiva de gran escala (estilo ESPN/NBA.com) pero con identidad dominicana. Tema propio en `mc_tema_lnb` (default "dominicana"), NO pisa el tema global. Construido encima de las tablas que ya llena el robot (`lnb_jugadores`, `lnb_juegos`, `lnb_standing`, etc.).
- **Encabezado (decidido por Vladimir):** wordmark "LNB" en fuente Anton (blanca, inclinada) + barra tricolor + "La Súper Liga" en dorado (Oswald). La fuente se carga sola vía `<link>` inyectado (no hay que tocar index.html). NO colorear cada letra de un color distinto (se veía genérico). El long-press sobre el wordmark sigue ciclando los 5 temas. El círculo de la derecha = botón de PERFIL (lleva su foto si se le pasa `usuario`/`avatarUrl` desde App.jsx; si no, cae al iconito).
- **Portada tipo revista:** jugador de la semana con foto a sangre, número gigante de fondo (watermark) y stats abajo.
- **Marcador agrupado POR DÍA** (la queja principal): adiós lista plana. Encabezados Hoy / Ayer / Mañana / "Sábado 20 jun", calculados en hora de RD (`America/Santo_Domingo`); dentro de cada día: en vivo → próximos → finales.
- **Pestaña Equipos (plantillas):** tarjeta de cada equipo con su escudo de fondo (ilustración fantasma) → roster → cada jugador cliqueable → perfil con stats (reusa `PerfilJugador`).
- **MC RATING (idea P-004, versión de arranque single-temporada):** número 0–100 (NO estrellas; el número diferencia fino). Motor = eficiencia por juego de la LNB (o producción simple si falta), escala relativa a la liga (el mejor ~100), exponente 0.85 pa' levantar el medio. Tiers: Élite 90+ · Estrella 80+ · Titular 70+ · Rotación 60+ · Reserva. **Se recalcula solo** desde la data del robot — no se guarda aparte. Pestaña "Rating" con la lista completa (todos), el **#1 coronado** (👑 + dorado), un **Top 10 en la pantalla principal** (link "Ver todos"), y badge de MC Rating dentro del perfil del jugador. **PENDIENTE (cuando el robot traiga varias temporadas):** pasar a la fórmula ponderada por recencia [4,3,2,1] de P-004 y mostrar historial por temporada.

---

### 3.3 EL TECHADO — feed social / blog
*(Lo que llamamos "el techado": el muro social / blog de la app.)*

**Idea TE-001 — Robot vigilante de noticias NBA ("listener")** · `FUTURO (de pago, no ahora)`

Robot que **monitorea las cuentas de los periodistas insiders** (hoy el rey es Shams Charania de ESPN; Woj se retiró en 2024) y las redes donde publican. Las revisa cada cierto rato; cuando capta una noticia importante (trade, lesión), una **IA decide si es relevante y la reescribe** como noticia en español con crédito → sale en El Techado.

**Estado: FUTURO.** Razón: necesita una **fuente de tuits de pago**. La API oficial de X es pago por uso (~medio centavo por lectura, sin capa gratis, tope 2 millones/mes); hay revendedores de terceros más baratos (~5–15 centavos por cada mil tuits). Vladimir no quiere gastos ahora → se anota para después.

**Mecánica:** temporizador frecuente → fuente de tuits → IA clasifica + reescribe → tabla de noticias → El Techado.
**Copyright:** reportar el hecho + crédito + enlace; NUNCA copiar palabras textuales.
**Nota:** este mismo robot aplica todavía MEJOR a los periodistas dominicanos de la LNB — menos volumen, más fácil, y nadie lo está automatizando aún. (Pero la fuente de redes sigue siendo el costo a resolver.)

---

### 3.4 CHAT

**Idea C-001 — Resultado de juego compartible al chat (tarjeta desplegable)** · `EN PROGRESO`

Un resultado de juego se puede **compartir a cualquier chat** desde donde esté (techado, resultados). Llega como una **tarjeta especial** (componente `ResultadoEnChat.jsx`), no como texto. Reusa los DATOS del juego (igual que el techado) pero con diseño propio pensado para la columna angosta del chat.
- **Cerrada:** titular dorado ("X aplastó a Y"), marcador grande con logos, figura del partido.
- **Desplegada (en el mismo chat, un toque):** toda la estadística apilada — tabla de jugadores por equipo con sus stats (pts/reb/ast/rob/tap según lo que se llevó), y acciones Fijar / Ver juego / Ocultar.
- **Un toque** despliega; **dejar pisado** (long-press) abre el menú del chat (responder/copiar/fijar). NO chocan (handlersSoloPresion para la tarjeta).
- **Fijar:** el banner de arriba muestra el marcador real ("🏀 Tigres 82-76 Lobos") y al tocarlo SALTA al mensaje con resaltado.
- Motor: tipo de mensaje `resultado` con los datos en `adjunto_meta` (la columna texto no admite null → se guarda un resumen de respaldo). Helper `enviarResultado` en mensajes.js. Hoja de selección de destino `CompartirAlChat.jsx`.
**Hecho:** tarjeta, compartir al chat, desplegar stats, fijar con marcador + salto. **Falta:** botón "Ver juego" (detalle completo con gráficos), foto de jugador (carnet) en la figura del partido, compartir desde la pantalla de Resultados (al terminar el juego), grupos.

*(El resto de ideas de chat van aquí.)*

---

### 3.5 PERFIL

**Idea P-001 — Perfil estilo red social con pestañas** · `HECHO (Bloque 1)`

Carnet limpio (foto, nombre, datos, MC ID) con el fondo del balón según el tema, botón volver arriba-izquierda, botón tema arriba-derecha. Pestañas **Datos** / **Publicaciones**. Números sociales: Juegos · Siguiendo · Seguidores.

**Idea P-002 — Feed de publicaciones por persona** · `PENDIENTE (Bloque 2)`

La pestaña "Publicaciones" debe mostrar las publicaciones de esa persona (filtrar el techado por autor). Hoy muestra "muy pronto".

**Idea P-003 — Rating, ranking y promedios del jugador** · `PENDIENTE`

Dependen de contar los **juegos por jugador** (la columna `juegos_jugados` existe pero no se llena todavía). Cuando se cuente, se llenan rating, ranking nacional y promedios de carrera.

**Idea P-004 — Rating de jugadores + emparejamiento de datos CERTIFICADOS (claim de perfil)** · `PENDIENTE`

Dos partes que van pegadas. (Nota: Vladimir dijo "NBA" pero por contexto es la **LNB**, nuestra liga — confirmar.)

**PARTE A — Rating del jugador (la "inteligencia"):**
- Al acumular las stats de TODOS los juegos de un jugador (de torneos en Media Cancha y, para profesionales, de la LNB vía el robot), hay mucho número y mucho dato. De ahí un algoritmo le calcula su **rating / niveles** — mismo concepto de inteligencia que el rating del torneo (T-009).
- Salida: nivel del jugador (interbarrial/intermedio/superior/etc.), rating por estadística (puntos, rebotes, asistencias…), número general, ranking nacional, percentiles, promedios de carrera.
- Depende de contar los juegos por jugador (ver P-003). **Orden:** contar juegos → rating del jugador → alimenta el rating del torneo (T-009). Todo encaja.

**FÓRMULA DEL RATING (cómo se calcula — NO se suma):**
1. **Puntaje por temporada (0-100):** de los promedios por juego de esa temporada → un puntaje de impacto, dándole más peso a lo más valioso. Ej.: `Impacto = PTS + 1.2·REB + 1.5·AST + 2·ROB + 2·BLK (+ bono triples)`, normalizado a escala 0-100 contra la liga. (Pesos a calibrar.) Cada año tiene su propia nota.
2. **Combinar las temporadas en el RATING ACTUAL — promedio PONDERADO por recencia, NO suma ni promedio plano.** La temporada más nueva pesa más. Pesos [más nueva→más vieja] = [4,3,2,1] → `Rating actual = Σ(nota·peso) / Σpesos`. Así el rating sube/baja con la forma reciente (lo reciente manda).
3. **Mostrar ADEMÁS, aparte:** **PICO** (mejor temporada de la carrera = su techo), **TENDENCIA** (↑ subiendo / → estable / ↓ bajando), y nº de temporadas (veteranía/confiabilidad).
- **Lógica clave (ejemplo real de la dinámica):** un veterano con pico 88 hace años pero en declive (notas 88·84·80·78) → su rating ACTUAL baja a ~81 porque lo reciente manda, pero el pico 88 queda visible en su historia. **No inflar el presente con el pasado.** Un jugador en ascenso (80·85·88·93) → rating ~89, pegado a su pico, flecha ↑.

**PROFUNDIDAD DE DATOS (hasta dónde llega el historial):**
- **LNB (fuente limpia):** el sitio expone stats desde **~2022 hasta hoy = ~4-5 temporadas** (suficiente pa' un buen rating e historial). La liga tiene más historia (juega desde 2005) y las fichas de jugador podrían tener carreras más largas guardadas por dentro → **confirmar el alcance exacto del archivo al construir el robot.** Lo seguro/limpio hoy: esas 4-5 temporadas.
- `basket.do`: también guarda por año, pero es plataforma más nueva.
- Torneos **declarados**: sin historial estructurado (solo la palabra del jugador hasta certificar).
- **Diseño (igual que en torneos):** pesar lo RECIENTE más fuerte pa'l rating de AHORA (la temporada actual manda, lo viejo cuenta menos); y mostrar el historial completo temporada por temporada aparte, pa' la carrera entera.

**PARTE B — Emparejamiento de datos certificados (la joya):**
- El sistema tiene **fichas de jugadores** con stats y rating que NO están ligadas a una cuenta (perfiles "sin reclamar"). Ej.: Yeison Yan Colomé ya está con sus números de la LNB aunque no se haya registrado él mismo.
- Cuando la persona real se registra en Media Cancha, puede **enviar una solicitud de emparejamiento** para reclamar su ficha y ligar sus stats certificadas a su cuenta.
- Flujo: al registrarse (o en su perfil) se le pregunta *"¿Juegas en la LNB / en algún torneo registrado?"* → busca su ficha → manda **solicitud de emparejamiento** → se aprueba → las stats certificadas se ligan a su cuenta, con **sello de "verificado / certificado".**
- **Por qué importa:** son DATOS CERTIFICADOS (oficiales de la LNB / de torneos llevados por la app). Una vez ligados, el perfil muestra números reales verificados + rating con sello. **Foso enorme: data que no se puede inventar.**

**PUNTO CRÍTICO — Verificación de identidad (con CÉDULA):** ¿cómo confirmamos que la persona SÍ es ese jugador? (Pa' que nadie reclame las stats de Yeison sin serlo.)
- **La cédula sola NO basta:** el número no es secreto (aparece en muchos documentos); cualquiera podría escribir el de otro. Tener el número ≠ probar identidad.
- **Validar que la cédula es real y de quién es:** el gobierno tiene un portal oficial de APIs (OGTIC — `developer.digital.gob.do`) con validación de cédula, y la DGII tiene consulta por cédula. Confirma que el número existe y a qué nombre pertenece. (Por la Ley de Protección de Datos NO hay buscador público libre; acceso controlado/autorizado por la JCE, lo usan bancos y notarías → hay que registrarse y revisar términos. La entidad **Andamio** puede ayudar a calificar.)
- **Probar que la persona ES esa cédula:** atar persona↔documento con **foto de la cédula + selfie que coincida** con la foto del carnet.
- **PLAN (escala LNB = pocos, ~100–200 pros):** arrancar **a mano** — el jugador sube cédula + selfie, un admin compara la cara con la foto del documento y verifica que el nombre cuadra con su ficha LNB → aprueba. GRATIS y fuerte. Luego sumar la API oficial pa' auto-validar número+nombre. KYC automático full (de pago) queda pa' escala futura (todos los amateurs).
- **Responsabilidad de datos:** guardar cédulas y fotos = datos personales sensibles bajo la **Ley 172-13** de protección de datos (RD). Consentimiento + guardado seguro + trato serio. Hacerlo bien desde el principio = confianza.

**DOS FUENTES, UN RATING:** stats de torneos (de la app) + stats de la LNB (del robot). Mostrarlas distinguidas en el perfil ("LNB · oficial" vs "Torneos Media Cancha"); el rating general puede ponderar ambas.

**FUENTES DE DATOS / TORNEOS RECONOCIDOS (más allá de la LNB):**
- Existen muchos torneos serios. Los grandes regionales ("Torneo Superior"): **Distrito Nacional** (TBS Distrito / ABADINA, versión 48 en 2026; equipos: Mauricio Báez, San Carlos, El Millón, Huellas del Siglo, San Lázaro, Rafael Barias, Bameso, Los Prados), **Santiago** (TBS Santiago / ABASACA, desde 1981), **La Vega** — los tres más prestigiosos. Cada provincia tiene su asociación y torneo; + torneos juveniles (LND-U22, etc.).
- **Disponibilidad de data:** los regionales se cubren sobre todo por Facebook / Instagram / YouTube y prensa — NO tienen sitios de stats limpios propios. Raspar cada uno por separado = revolú.
- **Hallazgo: `basket.do`** — plataforma que agrega varios torneos dominicanos con stats por jugador, **perfiles que marcan en qué ligas jugó cada quien**, promedios por torneo, líderes, standings. Tiene API por debajo (data dinámica).
- **⚠️ OJO — `basket.do` es prácticamente un COMPETIDOR:** hace mucho de lo que Media Cancha quiere (gestión de torneos, anotación en vivo jugada por jugada, perfiles, stats, comparar jugadores, noticias). Útil: (a) confirma que la data es rastreable; (b) referencia pa' diferenciarnos (red social, app nativa, temas, chat, ecosistema). **NO depender de raspar su data** (es de ellos, ToS) — preferir fuentes oficiales/de liga.

**DOS NIVELES DE DATOS EN EL PERFIL:**
- **CERTIFICADO:** donde nosotros traemos la data oficial (arrancar con la LNB, la fuente oficial más limpia). Las stats se ligan solas, con sello.
- **DECLARADO:** el jugador lista un torneo donde jugó; identidad verificada por cédula, pero stats auto-declaradas / pendientes. Se marca "declarado" hasta poder certificar.
- La cédula resuelve **QUIÉN** es; la lista de torneos resuelve **DÓNDE** jugó; el sistema marca qué es certificado vs declarado.

**NOTA EN REGISTRO:** al registrarse, preguntar *"¿Has jugado en alguno de estos torneos?"* con la lista (LNB, TBS Distrito, TBS Santiago, La Vega…) → si sí, solicita emparejamiento → verificar identidad (cédula) → marcar certificado/declarado.

**UX — DÓNDE SE PIDE EL EMPAREJAMIENTO (dos lugares):**
1. **Al registrarse:** se pregunta "¿Jugaste en alguno de estos torneos?" → si dice que sí, ofrecer ahí mismo el emparejamiento (solicitar emparejar todo).
2. **En Configuración del jugador (SIEMPRE disponible):** un botón **"Solicitar emparejamiento"** que el jugador pueda usar CUANDO QUIERA (si no lo hizo al registrarse, o pa' agregar otro torneo después).

**PANTALLA "¿QUÉ ES EL EMPAREJAMIENTO?" (explicación antes de solicitar):** explicar en cristiano:
- **Qué es:** ligar tu ficha real de jugador (la que tiene tus stats certificadas de los torneos donde jugaste) a tu cuenta de Media Cancha.
- **Qué pasa al aprobarse:** tu perfil recibe TUS estadísticas y TU nivel/rating (nuestra inteligencia), con sello de **verificado**. Eso es lo que te va a aparecer.
- **Qué hace falta:** verificar tu identidad con la **cédula** (+ selfie); la solicitud **se revisa**, no es automática al instante.
- **Estado visible de la solicitud:** `solicitada → en revisión → verificada` (o rechazada), pa' que el jugador siempre sepa en qué va. Gratis, se pide cuando quiera.

**ESTRATEGIA — Ranking nacional como GANCHO DE CRECIMIENTO (flywheel):**
- **Meta:** registrar a TODOS los jugadores posibles con su rating, juntando data oficial de torneo en torneo (LNB primero, es lo más cubierto; luego regionales). La data existe aunque sea presencial (ej.: computadora de la liga de Santiago) — a futuro se consigue, incluso yendo en persona.
- **La rueda que se mueve sola:** con los ratings se arma el **TOP nacional** de jugadores y sus posiciones. El jugador NO registrado igual aparece con su rating y su puesto (perfil sin reclamar). Al verse rankeado ("eres #15 del país") → se motiva a reclamar → se registra + pide emparejamiento → su rating queda en su cuenta → más jugadores → más data → ranking más completo → atrae más jugadores. **No le pides que empiece de cero; le dices "ven a buscar lo que ya es tuyo."**
- **Adquisición de data (2 caminos):** (a) **ALIANZAS** con las asociaciones (ABADINA, ABASACA, etc.) → data oficial y casi exclusiva, mejor que raspar; (b) **herramienta de admin** pa' importar/entrar data obtenida a mano (hojas, presencial). Hay que construir esa herramienta.
- **Marketing (el producto se promociona solo):** el ranking es COMPARTIBLE → el jugador comparte "soy #8 del país" en sus redes = publicidad gratis y viral. Canales: redes (IG/FB/TikTok), alianzas con ligas/equipos, y los propios jugadores. Si hay que pagar algo de publicidad o que alguien ayude, se hace. **Meta: llegarle a TODITO.**
- **POSICIONAMIENTO:** la app NO se vende como "una app de la LNB" sino como **"Baloncesto de República Dominicana"** (la LNB es la joya de la corona, pero la identidad es TODO el baloncesto dominicano: torneos, jugadores, ranking nacional). Que al entrar la gente se dé cuenta del alcance — esto es la casa de todo, no el rincón de una liga.
- **PROMOCIÓN DEL EMPAREJAMIENTO DENTRO DE LA APP (muy importante):** no basta el botón en Config. (a) Al inscribirse, un paso de **onboarding** que promueve el emparejamiento ("¿Eres jugador? Reclama tu rating"). (b) **Banner/tarjeta persistente** ("Reclama tu perfil de jugador") pa' los que no han emparejado, en inicio/perfil, hasta que lo hagan. El prompt es ACTIVO y se repite, no escondido. Cada usuario nuevo se entera sí o sí.
- **BOCA A BOCA / INVITAR JUGADORES (el crecimiento más fuerte):** los mismos jugadores se dicen "vete a emparejar tus datos." Convertirlo en FUNCIÓN: un usuario registrado busca a un compañero que conoce, lo encuentra con su perfil sin reclamar, y le sale botón **"avísale" / "invítalo a reclamar"** → le comparte el perfil ("mira, aquí está tu rating, ven a buscarlo"). **Cada usuario = un reclutador.** La voz se riega sola por la comunidad.
- **⚠️ Integridad del ranking:** NO es justo mezclar crudo data certificada (LNB completa) con declarada/parcial (regional) — es comparar mangos con limones. Hacer **rankings separados** o **marcar transparente la fuente** de cada quien. La credibilidad es lo que hace que la gente quiera estar ahí.
- **Privacidad:** el ranking usa stats PÚBLICAS de competencia (OK, como cualquier sitio de stats). La data personal / cédula solo se pide al emparejar, con consentimiento.

---

### 3.6 APLICACIÓN EN GENERAL

**Idea G-001 — Ecosistema conectado (FILOSOFÍA CENTRAL)** · `PENDIENTE / continuo`

Media Cancha es un **ecosistema conectado**: un dato que entras en un lado aparece donde tenga que aparecer.
- Los **resultados de un juego** salen en la cuenta de CADA participante.
- Los torneos que juegas salen en tu perfil.
- Las **imágenes** (logo del torneo, logos de equipos) se usan donde la lógica lo requiera.
- Todo **compartible** — resultados, torneos, etc., con su contenido (marcador, figura, etc.).

**Idea G-002 — Fotos en toda la app (motor central)** · `EN PROGRESO`

Helper `fotos.js` ya hecho (sube a Supabase Storage bucket `fotos`, comprime, devuelve URL). Funciones: `subirFotoPerfil`, `subirFotoPublicacion`, `subirFotoEquipo`, `subirFotoTorneo`. Ya enchufado en: foto de perfil (`HECHO`), logo de torneo (`HECHO`). Falta enchufar en: publicaciones, equipos, y donde aparezca foto. Las fotos de autor en el techado ya llevan al perfil (`HECHO`).

**Idea G-003 — Fotos de perfil tappables en todos lados** · `EN PROGRESO`

Donde aparezca una foto de perfil, tocarla lleva al perfil de esa persona. Hecho en: techado (publicaciones) y barra inferior. Falta: comentarios, avatares de chat.

**Idea G-004 — Recortador de fotos central (TODA foto pasa por él)** · `EN PROGRESO`

Componente `RecortadorFoto.jsx` reutilizable: zoom (slider + pellizco), arrastre para encuadrar, recorte con canvas. Funciona táctil y mouse. Formas: cuadrado / círculo / ancho (16:9).
**REGLA:** cada vez que se sube una foto en CUALQUIER lugar de la app (perfil, equipos, torneos, publicaciones), pasa primero por el recortador. La experiencia debe ser consistente y profesional en todos lados.
Hecho en: logo de torneo, foto de perfil (forma círculo). Falta enchufar en: equipos, publicaciones.

---

### 3.7 FANTASY NBA Y NOTICIAS

*El asistente de Fantasy y el ecosistema de noticias de la NBA. Todo vive DENTRO de Media Cancha (mismo Supabase). Regla: nada de pago sin aprobación de Vladimir.*

**MODELO DE ACCESO — PÚBLICO vs. PERSONAL (¡clave, NO confundir!):** esto **NO es una función pública** de Media Cancha. El Fantasy es **personal de Vladimir**. Vive dentro de Media Cancha solo para ahorrar montar otra app aparte, pero los demás usuarios no lo usan ni se enteran. La separación correcta:
- **PÚBLICO (lo ve todo el mundo):** **Plantillas NBA** (rosters de los 30 equipos — quién juega y quién no) y **Noticias Rápidas**. Son datos de la NBA, no son personales → se quedan públicos.
- **PERSONAL DE VLADIMIR (solo él, amarrado a su cuenta):** el **Centro de Comando** y todo lo de su Fantasy (su liga, su roster, su estrategia, sus movimientos). Se amarra a su cuenta de Media Cancha **igual que en Cocina PAE** (allá el Centro de Comando solo lo ve él al entrar con su correo). Aparece en la zona de **Mis Ligas** y solo sale cuando Vladimir entra con su correo y clave.

**OBJETIVO DE VLADIMIR (la regla de oro del Fantasy):** ganar la semana asegurando **mínimo 5 de las 9 categorías**. NO se busca ganar las 9. Habrá categorías que se pierden a propósito. El cerebro tiene que **puntear**: rendir lo perdido para asegurar lo ganable.

**Config de la liga (confirmada):** 9 categorías (FG%, FT%, 3PM, REB, AST, STL, BLK, TO [al revés: menos es mejor], PTS) · 12 equipos · draft serpiente · 2 ligas, casi la misma gente (Liga 1 pick 8 · Liga 2 pick 6) · roster 10 + 3 banca + 2 IR (IR solo acepta lesionado) · 1 cambio por día (6 la primera semana, 7 las normales).

**LOS 4 ROBOTS:**
1. **Cazador de noticias** — lee Rotowire + RotoBaller (RSS gratis) cada 15 min. `HECHO ✅`
2. **Analista** — Gemini gratis convierte la noticia cruda en portada y la clasifica (LESION/QUINTETO/TRASPASO/RUMOR). `HECHO ✅`
3. **Lector de tu roster** — entra a ESPN Fantasy y lee tu equipo + agentes libres. Solo lectura. `PENDIENTE (octubre · necesita cookies)`
4. **Estratega / Recomendador** — junta noticias + tu roster + el rival y traza el plan. `PENDIENTE (octubre)`

**PRINCIPIO CLAVE:** el robot PIENSA, tú EJECUTAS. ESPN no deja que un robot de afuera mueva tu equipo; automatizar el clic es frágil y arriesga la cuenta → **descartado**. El máximo es: avisos y recordatorios; Vladimir da el toque final en ESPN.

**LA ESTRATEGIA (ideas de Vladimir):** `PENDIENTE (octubre)`
- **Predicción antes del round:** compara tu equipo vs. el rival, categoría por categoría, con los números, y pronostica cuántas son ganables ("de las 9, te veo ganables 7"). Marca ganables / peleadas / perdidas.
- **Plan a la medida del rival:** la estrategia CAMBIA según a quién enfrentas. Asegura las ganables, mete toda la energía en las peleadas (ahí se decide la semana), y **suelta las perdidas a propósito** (ni un movimiento gastado ahí).
- **Plan que Vladimir aprueba:** se presenta en pantalla ("pelear estas, soltar estas, ¿apruebas?"). Él da el visto bueno o pide cambios. Tú mandas, él calcula.
- **Movimientos con horario de cierre:** el robot sabe la hora del 1er juego del día (cuando se cierra el lineup). Avisa "esto cierra hoy a las 7:10" o "ya cerró, va para mañana". **Recordatorio programado** a la hora que Vladimir elija antes del cierre.
- **Detección de calendario:** marca qué equipos juegan 4 veces esa semana y cuáles 1-2 → recoger jugadores de los que más juegan (streaming).

**LA SALA DE DRAFT:** `HECHO ✅ (dormida hasta octubre)`. Motor de valor por categoría (z-scores, TO al revés, % pesados por volumen), detección de punteo, recomendación de mejor pick / pick para tu equipo. Cerca del draft: refrescar números con proyecciones reales y ampliar el pool. Ese mismo cerebro alimenta la predicción de temporada.

**EL CENTRO DE COMANDO (pantalla):** `EN PROGRESO`. Es el hogar **PERSONAL** del Fantasy de Vladimir. Adentro va todo lo suyo: su plan de la semana, su roster, sus movimientos, su radar de noticias. **Va amarrado a su cuenta (como Cocina PAE) y vive en la zona de Mis Ligas**, visible SOLO cuando él entra con su correo. Orden de trabajo: **construir primero, amarrar a la cuenta después** (no urge mientras se prueba). Hoy, temporal para pruebas, hay un botón en Ligas; ese botón se quita cuando se amarre a la cuenta.

**LA TARJETA DE ACCIÓN (contrato del recomendador):** JSON con tipo (lesión/oportunidad/traspaso/rotación), prioridad, jugador afectado, beneficiados (y si están libres en tu liga), acción sugerida (agregar/soltar), categorías afectadas, confianza, fuente. La UI solo la pinta; el robot la produce.

**FUENTES (todas gratis):**
- **ESPN API pública:** stats, scores, rosters de los 30 equipos, estado de lesión. Gratis y ordenado.
- **Rotowire + RotoBaller (RSS):** noticias rápidas. Gratis.
- **Sleeper API:** puente nombre → espn_id + tendencias de agregados/soltados. Gratis. **Hueco conocido:** el espn_id de Sleeper falta en algunos jugadores → para FOTOS, los rosters de ESPN son mejor puente (pendiente cambiarlo).
- **Rotowire lineups diarios:** la mejor fuente editorial del quinteto proyectado, pero NO es gratis en formato máquina (su API es de pago). Plan: en temporada, bajar la página y que **Gemini la interprete** (raspado inteligente), o quedarnos con el estado de lesión de ESPN (gratis y estable).
- **X/Twitter:** la más rápida, pero de PAGO. Mejora opcional de fase 2.

**⚠️ ACCESO PERSONAL (candado) — CORRECCIÓN IMPORTANTE:** versión anterior estaba MAL (decía que Plantillas y Noticias también eran secretas). Lo correcto: el **Centro de Comando** y todo lo personal del Fantasy van **amarrados a la cuenta de Vladimir, igual que el Centro de Comando de Cocina PAE** — solo le aparecen a él al entrar con su correo y clave, en la zona de **Mis Ligas**. NO es un "modo secreto para todos"; es un **módulo por cuenta**. Las **Plantillas** y las **Noticias** se quedan **PÚBLICAS** (datos de la NBA, no personales). Orden: **se construye ahora, se amarra a la cuenta después** (mientras se prueba puede quedar visible).

**Notas técnicas:**
- Robot `robot-noticias` (Edge Function), corre cada 15 min (pg_cron), ritmo 1 llamada / ~4 s (límite gratis Gemini = 15/min), con reintentos si se satura (429/503). Tope 8 por corrida.
- Tabla `micro_news` en Media Cancha. Grant `select` a anon/authenticated; escritura solo service_role.
- Modo privado de fotos por dispositivo: 5 toques al "X hoy" (guardado en localStorage `mc_noticias_pro`). Foto = headshot de ESPN vía espn_id; si no hay, iniciales.
- Conexión ESPN Fantasy (octubre): cookies `espn_s2` + `SWID` + IDs de liga como secretos. Solo lectura.

---

### 3.8 CENTRO DE RANKINGS — el producto principal

**LA VISIÓN (definida por Vladimir, jun 2026):** el **Ranking General es la joya y el producto principal.** La NBA y la LNB cualquiera las baja de internet — son vitrina y referencia de alto nivel. El ranking que sale de NUESTRA materia prima (los torneos del baloncesto dominicano de barrio) **no lo tiene nadie más en el mundo.** Cuando exista el General, se presenta como el ranking PRINCIPAL; NBA y LNB quedan como referencia.

**ESTADO ACTUAL — ✅ HECHO (jun 2026):** vista de Rankings dentro de `PantallaPublica`, se abre con el botón ★ de la barra inferior (ya NO va a la pantalla NBA completa). Tres pestañas: **NBA / LNB / General**. Reusa los componentes que ya existían: `RankingsNBA` (data real de `nba_stats_temporada` + rating "ADN MC") y `RankingsLNB` (data real de `lnb_lideres`). General = cartel "Próximamente". El ★ se pone dorado cuando está activo; la casa 🏠 (Inicio) regresa al feed.

**R-001 — Ranking General (MC) · `PENDIENTE` · PRIORIDAD ALTA (es el producto)**
El ranking que junta TODOS los torneos y ligas de Media Cancha. Sale de los juegos anotados → depende de que la anotación del torneo escriba en las tablas (ver T-013). Se presenta como el ranking principal de la app.

**R-002 — Torneos élite certificados · `PENDIENTE`**
El organizador puede tener un torneo **certificado como élite**, y un torneo élite **cuenta más** para el Ranking General. Crea una rueda que se alimenta sola: mejores torneos → mejor data → ranking más creíble → más jugadores quieren entrar → más organizadores buscan el sello. El sello tiene valor.

**R-003 — Jugador certificado / perfil dorado · `PENDIENTE`**
Estatus visible: un **perfil dorado verificado** que marca al jugador como de **más alto nivel** (ej. "alto nivel de República Dominicana"). La gente persigue estatus. A futuro: emparejar a los jugadores inscritos con su data de la NBA/ligas y darles un certificado/badge especial.

**🔒 CANDADO DE CREDIBILIDAD (lo más importante):** todo esto se sostiene en que la certificación sea **creíble**. El día que se certifique un torneo (o jugador) que no lo merece, **se cae la confianza del ranking entero.** Los criterios de qué hace élite a un torneo y certificado a un jugador hay que definirlos con cuidado ANTES de lanzar la certificación.

---

## 4. REGISTRO DE LO YA CONSTRUIDO  (`HECHO`)
*Esto es "qué hemos incorporado". Cuando una idea de arriba se construye, se anota aquí.*

**Social / Perfil**
- 40 logos de equipos en SVG + componente `LogoEquipo.jsx`
- Sistema social seguir/dejar de seguir: tabla `seguidores`
- `PantallaBuscar` + buscador en línea con dropdown en vivo
- `PantallaPerfilAjeno` con seguir/dejar de seguir + estadísticas + Juegos/Seguidores/Siguiendo
- MC ID oculto de la vista pero buscable
- Chat privado en tiempo real `PantallaChat.jsx` estilo WhatsApp (borrado 24h, long-press 420ms, fijar/pin, fix de teclado)
- Detalle de publicación: modal `DetallePublicacion` con compartir nativo
- Perfil rediseñado red-social con pestañas Datos/Publicaciones + números sociales
- Barra inferior: Ranking→Buscar (lupa), Perfil→foto de perfil del usuario

**Fotos**
- Helper central `fotos.js` (Supabase Storage, bucket `fotos`, compresión automática)
- Subir foto de perfil (con ícono cámara en el avatar)
- Subir logo oficial del torneo en el wizard

**Torneos**
- 5 tablas en Supabase: `torneos`, `torneo_equipos`, `torneo_jugadores`, `torneo_directiva`, `torneo_invitaciones` (+ índices + RLS)
- Columnas nivel/categoría/rama en `torneos`
- Helper `torneos.js` (crear, leer, equipos, jugadores, invitaciones, buscar personas)
- `PantallaTorneos.jsx`: vista pública y admin, módulos (Resumen, Tabla, Líderes, Top 10, MVP, Equipos con plantillas, Jugadores, Directiva, Contabilidad grande + módulo pequeño en Resumen), responsive 3 niveles
- `PantallaCrearTorneo.jsx`: wizard 5 pasos, guarda en Supabase, creador = presidente
- Menú desplegable "Torneos" en la barra superior de escritorio (Crear / Mis torneos / Donde juego / Explorar)

**Publicar**
- `PantallaPublicar.jsx`: pantalla independiente con candado de teclado, plantillas de fondo, panel de emojis

**Teclado / Layout**
- Fórmula oficial del teclado aplicada a Login, Registro, JuegoConfig, JuegoJugadores, JuegoVivo, Resultados, Publicar
- Modales centrados en computadora (JuegoJugadores)
- Responsive de torneos a 3 niveles

### L-007 · Modos de anotación, cascadas, ratings y reloj  `PENDIENTE`

*Decidido con Vladimir (sesión del anotador). Es la arquitectura COMPLETA de la pizarra. El motor actual `PantallaJuegoVivo.jsx` ya tiene la base (dos modos jugada/jugador, cascada de asistencia, deshacer/corregir, sustituciones, reloj, narrador) — esto lo COMPLETA sin romperlo.*

**Filosofía:** anotar en vivo tiene que ser RÁPIDO. Tocar un punto exacto en la cancha por cada tiro pide demasiada puntería/memoria muscular para el día a día → el mapa de tiros es OPCIONAL, no el principal. El modo de dos toques manda.

**TRES MODOS (se eligen en la config del juego):**

1. **Rápido** — liviano, el de todos los días.
   - Lleva SOLO: los puntos y **quién los metió**. Nada más. (Igual se elige el jugador, no es solo marcador de equipo.)
   - Dos sabores: **Normal (liga)** = dobles y triples, SIN botón de "1 punto"… *a menos* que se prendan **faltas acumulativas**, y ahí aparece el **tiro libre de 1 punto**. **Americano** = uno y dos.
   - El tiro libre de 1 punto (con faltas acumulativas) aplica a normal y americano.
   - **SIN rating.** Solo historial: ganados/perdidos, contra quién, %. (perfil de liga normal)
   - Nota en la UI: *"Ideal para juegos informales en cancha."*

2. **Fogueo** — la pizarra COMPLETA (todas las cascadas + estadística final). **CON rating de fogueo.**

3. **Torneo** — la MISMA pizarra que fogueo, idéntica. Lo único distinto: **dónde/cómo se guarda el rating** (rating de torneo). El **torneo profesional** se mide **aparte**.

**RATINGS:** rápido NO · fogueo SÍ · torneo SÍ · profesional aparte.

**CASCADAS (fogueo/torneo). Flujo = elegir jugador → opción:**
- **Tiro fallado:** jugador → "Tiro fallado" → **¿de dos o de tres?** (para los %) → **¿quién cogió el rebote?**. El rebote vive DENTRO del tiro fallado (NO botón suelto — el rebote solo existe cuando hay un fallo). En el paso del rebote: jugadores de **ambos equipos** + salida **"Outside / se fue afuera"**. **Ofensivo/defensivo sale solo** comparando el equipo del tirador vs. el del reboteador.
- **Asistencia** (como ya está): quién la dio → a quién → de cuántos puntos.
- **Tiro libre:** botón **"Va a la línea de tiro libre"**.
  - **Seguro anti-error:** si marcan tiro libre SIN falta previa, pregunta **"¿de quién fue la falta / técnica?"** y la registra → nunca queda un tiro libre huérfano (pizarra 100% cuadrada).
  - → **¿cuántos tiros?** (1/2/3) → **¿quién tira?** (mismo jugador si es falta normal; **cualquiera del equipo contrario** si es técnica) → marcar cada tiro **encestó (+1)/falló**, uno por uno.
  - **REBOTE SOLO EN EL ÚLTIMO TIRO LIBRE.** Los anteriores no tienen rebote (bola muerta, se la devuelven al tirador). Si falla el último → engancha rebote + outside, igual que el de cancha.
- **Deshacer / Corregir** en TODA la cadena (ya existe; asegurar que cada eslabón nuevo se pueda deshacer).

**ESTADÍSTICA FINAL (fogueo/torneo):** todo el cuadro — tiros tirados, fallados (equipo y jugador), cuántos de dos, cuántos de tres, **% por jugador**, etc.

**MAPA DE TIROS (opcional, modos detallados):**
- Media cancha **VERTICAL** (canasto arriba), imagen de fondo. Componente `MapaTiros.jsx` (captura por % + pintado de puntos). Asset: `src/assets/media_cancha_half_vertical.png`. (La imagen subida es de baja resolución → conviene regenerarla en alta.)
- El **2 o 3 sale de la ZONA** donde se toca (dentro del arco = 2, detrás = 3), con botón **corregir** por si cae en la raya (la cancha es artística, el arco no es reglamentario exacto).
- Puntos por color de equipo; relleno = encestó, aro = falló. Filtrable por equipo/jugador. Alimenta resultado, perfil y **PDF**.
- Es una capa que se prende/apaga; NO estorba al modo rápido.

**RELOJ:**
- **Manual / externo:** la app NO ofrece minutos por jugador (no tiene de dónde sacarlos). Al final → Finalizar juego.
- **Sincronizado:** se le **asigna a un usuario registrado** (su pantalla de reloj: cronómetro grande, cuartos, iniciar/pausar, marcador espejo). Usa **Supabase Realtime** (ÚNICO paso que no es copiar/pegar: prender Realtime en el panel de Supabase). El reloj manda "corriendo/pausado/cuarto"; el anotador manda "quién está en cancha". Cruzando los dos → **minutos jugados** = (reloj corriendo) × (jugadores enCancha); el cambio ajusta quién acumula.
- **Razón:** el reloj sincronizado es la ÚNICA forma de llevar los **minutos jugados por jugador** (un reloj externo nunca te los da). Por eso: minutos SOLO con reloj sincronizado, y solo en fogueo/torneo. Manual = sin minutos. La config lo decide sola.

**TODO va en la CONFIGURACIÓN DEL JUEGO** (modo, normal/americano, faltas acumulativas, mapa sí/no, reloj manual/sincronizado + a quién).

**Respetar siempre los chequeos:** template oficial (1.3), safe-area (1.15), preservación — no borrar lo que sirve (1.17), grants de tablas nuevas (2.8).

**PENDIENTE — orden sugerido de implementación:** (1) cascada de rebote en tiro fallado → (2) tiro libre con falta-respaldo → (3) estadística final completa → (4) mapa de tiros opcional → (5) reloj sincronizado (Realtime). Cada pieza es un archivo que Vladimir pega; velocidad NO es el cuello de botella.

---

*Fin del cuaderno. Las ideas nuevas se agregan en su módulo de la sección 3.*### L-008 · Vista de escritorio (computadora) — auditoría + pendientes  `PRIORIDAD 2`

*Anotado por Vladimir tras notar que el desarrollo se enfocó casi todo en teléfono y el escritorio quedó inconsistente. Auditoría hecha el 23 jun 2026 sobre 21 pantallas/componentes del repo. **Esto hay que arreglarlo (prioridad 2).***

**REGLA NUEVA (a partir de ahora):** toda pantalla nueva o editada se entrega **responsive desde el principio** (teléfono + escritorio) en el mismo momento, con el patrón `esEscritorio`. No dejarlo para después — eso fue lo que se dejó de hacer y generó toda esta inconsistencia.

**PATRÓN OFICIAL DE ESCRITORIO (el que YA existe y hay que aplicar parejo en todas):**
- Detección por JS: `const [esEscritorio, setEsEscritorio] = useState(window.innerWidth >= 900)` + listener `resize`. (Ninguna pantalla usa `@media` CSS; todo es JS `innerWidth`. Mantener ese patrón parejo.)
- En escritorio: ensanchar el contenedor (maxWidth mayor, p.ej. 720–980), agrandar fuentes y paddings, quitar `paddingTop: env(safe-area-inset-top)`, y convertir las hojas que suben desde abajo (bottom-sheets) en **modales centrados** (`alignItems: center`, `padding: 20`, bordes redondeados completos).

**ESTADO ACTUAL — ✅ YA adaptadas a escritorio:**
- `PantallaPublica` (hasta ~1700px, modales centrados) · `PantallaLNB` (980/820) · `PantallaResultados` (760) · `PantallaPerfil` (perfil propio) · `PantallaTorneos` · `PantallaLigas` (720) · `PantallaJuegoJugadores` (parcial) · `TarjetaResultado` · `BottomSheet` (se centra en desktop).

**ESTADO ACTUAL — ❌ SIN adaptar (se ven como columna de teléfono o "teléfono flotando" en monitor grande):**
- **Flujo de anotar juego:** `PantallaJuegoConfig`, `PantallaJuegoVivo` (está `position: fixed` a 480px → en pantalla grande se ve un teléfono en el centro), `PantallaJuegoResultado`.
- `PantallaPerfilAjeno` — **inconsistencia fea:** el perfil PROPIO sí tiene escritorio, el AJENO no. Se ven distintos.
- `PantallaBuscar` — resultados en una sola columna angosta; en desktop pedirían rejilla/grid.
- `PantallaLogin`, `PantallaRegistro`, `PantallaCrearTorneo`, `PantallaPublicar` — formularios sin trato de escritorio.
- `App.jsx` (el armazón) — sin layout de escritorio; la navegación es estilo teléfono (no hay barra lateral/superior de computadora). Verificar dónde vive la nav y darle versión desktop.

**FALTANTES DE FUNCIONALIDAD (no solo estética) — observación de Vladimir:**
- En la **Pantalla Pública** faltan cosas que debieron ponerse según se avanzaba: el **carrusel** de pantalla NO está, **no se cargaron los datos de la LNB**, y "muchas cosas más". Hay que revisar la Pantalla Pública a fondo y completar lo que falta (carrusel + datos LNB + secciones faltantes). Auditar exactamente qué módulos faltan cuando se trabaje.

**DECISIÓN DE VLADIMIR (resuelta):**
- **Día a día = teléfono** (en la cancha, en la mano). **Anotar un TORNEO = computadora o iPad** — más cómodo, en mesa, con calma. Por eso el flujo de juego (Config/Vivo/Resultado) **SÍ debe adaptarse a escritorio Y a tablet**, no se deja phone-only.
- Las **TRES vistas tienen que estar bien sincronizadas**: teléfono, **iPad (tablet)** y computadora. Esto es requisito, no opcional.

**TRES NIVELES (no dos):** el patrón actual `esEscritorio` (≥900px) es binario (teléfono/escritorio) y deja al **iPad en tierra de nadie** (iPad vertical ≈768px, horizontal ≈1024px). Hay que pasar a **3 niveles**: teléfono / **tablet (iPad)** / escritorio. Alinear los cortes con los **3 niveles que ya usa `PantallaTorneos`** (mantener parejo en toda la app). El iPad debe verse cómodo para anotar — botones grandes, dos columnas donde quepan, nada de "teléfono estirado" ni "teléfono flotando".

**QUÉ SE DEBE HACER — plan en orden sugerido:**
1. **Armazón / App + navegación de escritorio** (barra superior o lateral; contenedor consistente para toda la app).
2. **Inconsistencias rápidas:** `PerfilAjeno` (espejar `Perfil`), `Login`, `Registro`, `Buscar` (con grid), `CrearTorneo`, `Publicar` — aplicarles el patrón `esEscritorio`.
3. **Pantalla Pública:** completar la funcionalidad faltante (carrusel, datos LNB, secciones) y revisar su escritorio.
4. **Flujo de juego (Config/Vivo/Resultado):** adaptarlo a **iPad y escritorio** (confirmado — es donde se anotarán los torneos), con botones cómodos para anotar en tablet. Las tres vistas sincronizadas.
5. Dejar todas con un patrón parejo de **3 niveles** (teléfono / tablet / escritorio); a futuro evaluar `@media` CSS si conviene.

**Respetar siempre los chequeos:** template oficial (1.3), safe-area (1.15), preservación — no borrar lo que sirve (1.17), grants de tablas nuevas (2.8).

---
---

## SESIÓN — jun 26, 2026 · Pulido de la Pantalla Pública (iOS) + Rankings

**Lo que se hizo y subió (commit `5649239`):**
1. **Barra superior que se esconde al leer** — al subir el contenido se esconde, al bajar reaparece. Método de raíz (tras 4 rondas con Gemini): la barra flota fija arriba y se esconde con `transform: translateY` (corre en GPU, **no** reajusta el layout). El primer intento usaba `margin-top` (reflow) y se "alocaba" por un bucle de scroll que se retroalimentaba.
2. **Botón Inicio = casa dorada** (sin texto), sube al tope con animación cuadro por cuadro (rAF). El salto seco `scrollTop=0` y el `behavior:'smooth'` los ignora WKWebView; la animación rAF sí pega.
3. **Estructura iOS anti-glitch del armazón:** raíz con coordenadas absolutas (NO flex), área de scroll con `position:absolute` y `bottom` clavado al alto MEDIDO de la barra inferior, `contain:'content'`, `translate3d(0,0,0)` + `backface-visibility:hidden` en el contenido, `overscroll-behavior:'none'`. La barra inferior dejó de flotar (`position:fixed`) y pasó a estar **clavada abajo** (`position:absolute bottom:0`); así el rebote de iOS frena justo encima y no glitchea.
4. **Torneos populares con DATA REAL** (`leerTorneos`): se quitaron los 3 torneos demo; aparece el torneo de verdad (Copa Jícome), tocarlo abre `torneoPublico`.
5. **Inicio más limpio:** solo historias + techado + destacados + torneos reales. Se quitó la sección Rankings del feed.
6. **Vista de Rankings** (ver 3.8): botón ★ → pestañas NBA/LNB/General.

**LA CAUSA REAL del glitch del final (lección):** eran DOS cosas juntas — (a) el componente pesado `RankingsNBA` al final de un scroll largo, y (b) **doble scroll anidado** (el `#root` global tiene su propio `-webkit-overflow-scrolling:touch` + el scroll interno de la pantalla). Al quitar Rankings del fondo, el glitch desapareció. En móvil ahora se apaga el scroll del `#root` mientras esta pantalla está montada (se restaura al salir).

**LECCIONES iOS / WKWebView (candado — NO repetir):**
- `padding` directo en un contenedor con `-webkit-overflow-scrolling:touch` **recorta/distorsiona el fondo** al rebotar. Mover el espacio a un `<div>` espaciador interno.
- `scrollTo({behavior:'smooth'})` en un div con overflow **se ignora en silencio** en WKWebView. Usar `scrollTop` directo o animación rAF.
- **Dos scrolls con inercia, uno dentro del otro, glitchean.** Un solo dueño del scroll.
- Un **componente pesado al final** de un scroll largo glitchea el rebote inferior.
- Una **alerta nativa (`alert()`) de relleno contamina el WebView** al cerrarse (la pantalla "se va para atrás"). Toda acción de la barra que NO esté conectada en el `onAccion` del móvil cae en el `alert` de `App.jsx` (línea ~393). Conectar las acciones o no llamarlas.

**PRÓXIMO PASO (acordado):** arrancar el torneo DE VERDAD por el **paso 1 de T-013: capitanes + invitaciones (T-004)** — meter jugadores a los equipos. Sin nómina real, la tabla de puntuación y los rankings de jugadores no tienen de dónde salir. El plan completo del torneo (7 pasos) está en **T-013**.

**PENDIENTES NUEVOS (mencionados por Vladimir, fuera de T-013):**
- **Crear la Liga** — ACLARAR qué significa: ¿que la gente cree sus propias ligas (formato liga larga, distinto al torneo de copa)? Definir antes de construir.
- **Historias / videos** — sistema para que la gente suba fotos y videos a las historias del inicio.
- **Por-torneo:** que cada torneo abra el SUYO (hoy abre el más reciente).
- **Cerrar inscripción** (el organizador cierra la nómina y arranca formal) + **notificaciones** (te invitan a un equipo, tu juego está en vivo, salió un resultado).
- **Tabla de puntuación:** quitar la entrada de anotar de la PÚBLICA y que la tabla se llene desde el lado del organizador y se transmita a la pública (esto es el paso 2 de T-013, ya documentado).
---

## SESIÓN — jun 26, 2026 · Anotación conectada + Transmisión en vivo + Panel de Configuración del Torneo

**HECHO en esta sesión:**

1. **EL BUG QUE LO TENÍA TODO TRABADO (resuelto):** la anotación de torneo nunca guardaba nada. Causa: el botón "Anotar este juego" mandaba el id del juego con la etiqueta `id`, pero `guardarAnotacionTorneo`/`marcarJuegoVivo` lo buscan como `juegoId`. No se encontraban → la función se devolvía con "Falta el juego" sin guardar. **Arreglo:** `PantallaTorneos` ahora manda `juegoId: j.id`. (Lección: cuando algo "no guarda y no da error visible", revisar que los nombres de los campos del contexto coincidan punta a punta.)

2. **Anotación conectada de verdad:** Mis Torneos → torneo → Calendario → "✎ Anotar este juego" → config → anotar → al terminar guarda marcador final + estadísticas por jugador en `torneo_juegos` y `torneo_juego_jugadores`. Llena Tabla y Líderes con datos reales.

3. **Transmisión EN VIVO** (era el paso 2 de T-013, ya HECHO):
   - `torneoData.marcarJuegoVivo(juegoId, puntosA, puntosB)` — escribe el marcador y deja el juego en estado `'vivo'` (no lo cierra; `.neq('estado','final')` para no pisar uno ya terminado).
   - `PantallaJuegoVivo` recibe `onMarcadorVivo` y avisa el marcador cada vez que cambia (con retardo de 600ms y solo si cambió; solo en juegos de torneo).
   - `App.jsx` conecta `onMarcadorVivo` → `marcarJuegoVivo`.
   - `PantallaTorneoPublico` se **refresca sola cada 12s** (setInterval, sin mostrar "cargando" en los refrescos) → el juego sube solito en la sección "En vivo ahora" que ya existía.

4. **Quitada la entrada de anotar de la PÚBLICA** (era el otro pedazo del paso 2 de T-013): se eliminó el botón "✎ Anotar" de la barra superior de `PantallaTorneoPublico` y su `onAnotar` en `App.jsx`. Anotar es SOLO desde el calendario del lado del organizador.

5. **PANEL DE CONFIGURACIÓN DEL TORNEO (nuevo):** `PantallaConfigTorneo.jsx`. Se llega desde la pantalla de admin con el botón **⚙️** en la cabecera. Tiene dos partes:
   - **Reglas por defecto** (cuartos, minutos, faltas para expulsión, bonus, modo de anotar) → se guardan en el torneo (`torneos.reglas`, columna nueva JSONB). `PantallaTorneoConfig` las carga al anotar un juego, así no hay que reconfigurar cada vez (afinación pedida por Vladimir).
   - **Estado del torneo: Terminar / Reactivar.** Usa la columna `estado` que ya existía (`activo`/`finalizado`). **Regla de oro: terminar NUNCA borra nada** — los juegos y las estadísticas se quedan guardados, y se reactiva cuando se quiera. Es prender/apagar un interruptor.
   - Funciones nuevas en `torneos.js`: `guardarReglasTorneo`, `cambiarEstadoTorneo`.

**⚠️ HAY QUE CORRER EL SQL:** `configuracion_torneo.sql` (agrega la columna `reglas` a `torneos`). Sin eso, guardar reglas no funciona.

**Archivos tocados:** `torneoData.js`, `PantallaJuegoVivo.jsx`, `App.jsx`, `PantallaTorneoPublico.jsx`, `PantallaTorneos.jsx`, `torneos.js`, `PantallaTorneoConfig.jsx`, y NUEVO `PantallaConfigTorneo.jsx`.

**PENDIENTES DEL TORNEO — lista viva (lo que falta para que esté redondo):**

- `PENDIENTE` **Motor de playoffs** (el grande): de la tabla salen los clasificados → #1 a la final, #2 vs #3 semifinal → series al mejor de 5 o 3. Hoy `torneoFormato.js` solo hace liga (todos contra todos) y copa (juego único), NO series. Es lo que corona campeón.
- `PENDIENTE` **Pantalla de pirámide** (versión React de la maqueta aprobada) en pública y admin.
- `PENDIENTE` **Capitanes + invitaciones (T-004):** el capitán arma su equipo invitando jugadores. Depende de tener gente registrada. El cableado de cargar el roster al anotar YA está; falta probarlo con usuarios reales.
- `PENDIENTE` **Link de invitación por WhatsApp** + página para unirse.
- `PENDIENTE` **Permiso de quién puede anotar** (gate con `torneo_directiva.puede_administrar` — la variable `puedeAdministrar` ya existe en `PantallaTorneos`).
- `PENDIENTE` **Bitácora:** registrar `juego_creado` y `marcador_cambiado` (y terminar/reactivar el torneo) en `torneo_bitacora`.
- `PENDIENTE` **Cantidad de juegos editable desde el panel** (hoy se hace en el Calendario con "Regenerar", que ya respeta los juegos jugados — solo borra los `proximo`). Evaluar moverlo/enlazarlo desde el panel de Configuración.
- `PENDIENTE` **Cerrar inscripción** (el organizador cierra la nómina y arranca formal) + **notificaciones** (te invitan a un equipo, tu juego está en vivo, salió un resultado).
- `HECHO` **Por-torneo:** cada torneo abre el SUYO. Las tarjetas de torneo en el feed mandan `torneoPublico:<id>` (antes mandaban la orden genérica y abría el más reciente). El botón "Vista pública" del admin abre la pública de ESE torneo (`verPublico:<id>`). La orden genérica "Torneos / Ver todos" sigue abriendo el más reciente. `PantallaTorneoPublico` ya sabía cargar por `torneoId`; solo faltaba pasárselo. (jun 26, 2026)
- `HECHO` **Selector "Mis Torneos" (admin):** antes "Mis torneos" metía directo al torneo más reciente (la pantalla de admin cargaba `limit(1)` sin importar de quién). Ahora "Mis torneos"/"Donde juego" abren `PantallaMisTorneos.jsx` (NUEVO) — lista los torneos que el usuario organiza (`misTorneos()`, con su estado activo/finalizado) para elegir en cuál entrar. Una persona puede administrar varios torneos a la vez. `PantallaTorneos` ahora recibe `torneoId` y carga ESE; Volver regresa al selector; crear un torneo entra directo a administrarlo. (jun 26, 2026)
- `PENDIENTE` **Centro de Comando** completo (panel del dueño que junta todo).
- `PENDIENTE (sin Tailwind / 3 niveles)` adaptar el flujo de anotar (Config/Vivo/Resultado) a iPad y escritorio — ver L-008.

---

## SESIÓN — jun 26, 2026 · Ligas de usuario (diseño) + pendiente de Configuración de la app

**HECHO:**
- `HECHO (diseño)` **Pantalla de Liga** (`PantallaLiga.jsx`, NUEVO). Concepto: una liga es un grupo MENOS formal que el torneo — gente que se reúne un día fijo a jugar. Lleva estadística igual, pero el modo de anotar es LIBRE (fogueo, rápido, 1v1, 3v3, 5v5 — todo cuenta). Tiene inscripciones, invitaciones en nombre de la liga (con logo), sirve para escuelas de baloncesto, y su pequeña contabilidad como el torneo.
  - **IDENTIDAD DE COLOR (decisión):** el torneo es DORADO; la liga es TURQUESA/TEAL (`#27d3c2`), mismo tema oscuro pero acento distinto + franja turquesa en vez del tricolor, para diferenciar de un vistazo. (Regla: torneo = dorado, liga = turquesa.)
  - Pestañas: Resumen · Miembros · Juegos (con modos libres) · Líderes · Invitar · Caja.
  - Por AHORA con DATOS DE EJEMPLO (es el diseño). Botones "Crear liga" / "Mis ligas" del menú ya abren esta pantalla (antes no hacían nada → caían en el alert de relleno que contamina el WebView; de paso se arregló eso).

**PENDIENTE — LIGAS (para hacerla real, después del diseño):**
- `PENDIENTE` Backend de ligas: tabla `ligas` (+ `liga_miembros`, `liga_juegos`, `liga_caja`, etc.), RLS, y funciones (`crearLiga`, `misLigas`, etc.) — espejo de lo del torneo pero más flexible.
- `PENDIENTE` Flujo "Crear liga" (como `PantallaCrearTorneo` pero para liga: nombre, logo, día de reunión, modo de inscripción).
- `PENDIENTE` Separar "Mis ligas" (selector, como hicimos con Mis Torneos) de "Crear liga".
- `PENDIENTE` Motor de anotación LIBRE: que el anotador acepte fogueo / rápido / 1v1 / 3v3 / 5v5 y todo guarde estadística para los líderes de la liga.
- `PENDIENTE` Invitaciones en nombre de la liga (con logo) + inscripciones.
- `PENDIENTE` Caja de la liga real (espejo de la caja del torneo).
- `PENDIENTE` Pensada también para ESCUELAS de baloncesto (todo anotado, invitaciones, miembros).

**PENDIENTE — CONFIGURACIÓN DE LA APP (lo apuntó Vladimir):**
- `PENDIENTE` **Configuración de la app / del perfil donde se suban las FOTOS** — el logo y la foto del jugador — para conectarlas con todo (perfil, equipos, carnet, tarjetas de resultado). Hoy no existe ese sitio central. Relacionado con el "plan de tres fotos" (perfil / logo / carnet) que ya estaba apuntado. Construir un lugar claro para subir y administrar esas imágenes.

---

# ============================================================
# SESIÓN 27-JUN-2026 — LIGAS REALES + MIEMBROS + PERFIL + CONFIGURACIÓN
# (Resumen para retomar en una conversación nueva. Jarvis: leer esto primero.)
# ============================================================

## ⚠️ BUG ABIERTO — PRIMERO ESTO AL RETOMAR
- **El botón ⚙️ de Configuración NO aparece en el iPhone de Vladimir.** Ya se subieron todos los archivos y se reconstruyó, pero no se ve.
  - Se agregó el engranaje en `PantallaPerfil.jsx`, en la barra superior de portada (junto a `<BotonTema/>`, ~línea 310-313), con prop `onConfig`.
  - SOSPECHA: `PantallaPerfil` tiene DOS cabeceras — la de PORTADA (móvil, donde se puso el ⚙️) y una STICKY (~línea 516-517) que quizá es la que se ve en su iPhone. Hay que revisar cuál renderiza en móvil y poner el ⚙️ también ahí. Ver el flag `esEscritorio` / `esJugador`.
  - App ya tiene la vista `configuracion` y pasa `onConfig={() => setVista('configuracion')}`. Falta solo que el botón se vea.

## QUÉ SE COMPLETÓ ESTA SESIÓN (todo validado con esbuild y entregado)
1. **LIGA — anotar juego (reusa el motor general):** `juegoLigaCtx` en App. Botón "Anotar un juego" en `PantallaLiga` abre selector de modo (fogueo/rápido/normal/1v1/3v3/5v5) → entra al anotador de siempre → al terminar `guardarJuegoLiga(ligaId,modo,res)` y vuelve a la liga. Tabla `liga_juegos`. Historial real en pestaña Juegos + Resumen.
2. **LIGA — compartir en Techado:** `publicarJuegoLiga(res,{ligaId,ligaNombre,modo})` en `techado.js` (tipo `'liga'`, etiqueta turquesa, NO expira). App lo llama al terminar el juego de liga.
3. **LIGA — miembros:** tabla `liga_miembros` (creador queda admin al crear). `PantallaInvitarLiga.jsx`: buscar cuentas → INVITAR (queda pendiente, NO agrega de una) o CONFIRMAR EN PERSONA con el PIN del jugador. Compartir invitación (WhatsApp) a los que no están en la app. Pestaña Miembros real.
4. **LIGA — invitaciones (igual que torneos):** tabla `liga_invitaciones` (pendiente/aceptada/rechazada). Llegan a "Mis invitaciones" (`PantallaInvitaciones.jsx` ahora muestra Ligas turquesa + Torneos dorado, aceptar/rechazar). RPC `confirmar_miembro_liga_con_codigo(p_liga_id,p_perfil_id,p_pin)` para confirmar en persona con el PIN secreto del jugador.
   - ⚠️ Ese RPC ASUME que el PIN está en `perfiles.pin_hash` con pgcrypto (`crypt`). Si al confirmar da error, hay que pegar la definición de `confirmar_jugador_con_codigo` (la de torneos) y calcar el método exacto.
   - (Se quitó un concepto equivocado de "código de la liga" que se había puesto por error.)
5. **FIX — seguir torneo no se guardaba:** el botón solo cambiaba color (`setSiguiendo(s=>!s)`), nunca persistía. Ahora tabla `torneo_seguidores` + funciones (`sigoTorneo`, `contarSeguidoresTorneo`, `alternarSeguirTorneo`) en `torneos.js`. `PantallaTorneoPublico.jsx` lee el estado real al cargar + cuenta seguidores real + toggle optimista.
6. **FIX — perfil decía 0 juegos:** la columna `juegos_jugados` no la actualizaba nadie (muerta). Ahora `contarJuegosJugador(perfilId)` en `social.js` cuenta de verdad: `publicaciones` cuyo `datos.jugadores` contiene el `perfilId` (jsonb `.contains`). Cableado en `PantallaPerfil` y `PantallaPerfilAjeno`. OJO: solo cuenta si el jugador estaba VINCULADO a su cuenta al anotar.
7. **SIGUIENDO — pantalla:** `PantallaSiguiendo.jsx` (pestañas Personas + Torneos, cliqueables). Se abre tocando "Siguiendo N" en el perfil. Funciones `aQuienesSigo()` (social.js) y `torneosQueSigo()` (torneos.js). Las ligas se sumarán cuando exista el seguir de ligas.
8. **APODO:** columna `perfiles.apodo`. Campo en el registro. Se muestra en ambos perfiles (dorado, cursiva, comillas). `buscarPersonas` busca y devuelve apodo.
9. **CONFIGURACIÓN:** `PantallaConfiguracion.jsx` (NUEVO). Sección "Mi identidad" editable: foto + logo personal (se suben y guardan de una) + nombre/apellido/apodo/número/altura/posiciones/frase → `guardarMiPerfil`. Sección "Seguridad": cambiar PIN (`cambiarMiPin` → rpc `set_pin`) + cerrar sesión. Placeholders "Pronto": Apariencia, Notificaciones, Privacidad, Mis equipos y logos. Se entra desde el ⚙️ del perfil (BUG: no se ve, ver arriba). Funciones nuevas en social.js: `cargarMiPerfil`, `guardarMiPerfil`, `cambiarMiPin`.

## SQL A CORRER EN SUPABASE (todos idempotentes)
- `liga_juegos_schema.sql`, `liga_miembros_schema.sql`, `liga_invitaciones_schema.sql`, `liga_confirmar_codigo_rpc.sql`
- `torneo_seguidores_schema.sql`
- `perfil_apodo.sql` (columna apodo), `perfil_config.sql` (columnas logo_url, numero, frase)

## TABLAS NUEVAS: liga_juegos, liga_miembros, liga_invitaciones, torneo_seguidores
## COLUMNAS NUEVAS en perfiles: apodo, logo_url, numero, frase
## RPC NUEVO: confirmar_miembro_liga_con_codigo

## PENDIENTE — LIGAS (lo que falta, en orden recomendado)
1. `PENDIENTE` **Pantalla pública de la liga** (esmerada, cliqueable, con SEGUIR liga). Necesita tabla `liga_seguidores` + funciones (espejo de `torneo_seguidores`). Mostrar escudo grande, miembros, juegos, líderes. Vladimir la pidió bonita ("que quede pegado").
2. `PENDIENTE` **Líderes reales** de la liga (de los `liga_juegos`): más puntos/reb/ast.
3. `PENDIENTE` **Detalle de un juego de liga** (box score completo; la data ya se guarda en `liga_juegos.datos`, falta la pantalla) + editar/borrar un juego.
4. `PENDIENTE` **Repartir el juego en los perfiles de los miembros** (que salga en el perfil de cada jugador vinculado — ya cuenta para `contarJuegosJugador`, falta surfacearlo como lista).
5. `PENDIENTE` **Caja** de la liga (real) + pestaña Invitar ya enlaza a PantallaInvitarLiga.
6. `OPCIONAL` Equipos fijos + tabla de posiciones.

## PENDIENTE — CONFIGURACIÓN (siguientes secciones)
- Apariencia (tema claro/oscuro + tamaño de letra), Notificaciones, Privacidad, "Mis equipos y logos" (editar logo de cada equipo).

## NOTAS TÉCNICAS
- Clon de trabajo de Jarvis: `/home/claude/mc-fresh` (NO es el repo de Vladimir; él pega los archivos a mano en su Mac).
- Validación esbuild: `--jsx=automatic --format=esm --bundle --external:react` + externals (`../ligas`, `../torneos`, `@supabase/supabase-js`); pantallas con imágenes `.png/.jpg/.svg` → `--loader:.png=dataurl` o syntax-only.
- Reglas de siempre: inline styles, números como PALABRAS en prosa (TTS iPhone), archivos NUEVOS se crean con clic derecho → New File (pegar adentro, no dentro de otro archivo). Identidad: torneo=dorado, liga=turquesa (#27d3c2).