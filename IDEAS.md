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

---

### 3.2 LIGAS

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

---

*Fin del cuaderno. Las ideas nuevas se agregan en su módulo de la sección 3.*