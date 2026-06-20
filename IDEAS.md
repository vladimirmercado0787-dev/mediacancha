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

---

### 3.2 LIGAS
*(Sin ideas guardadas todavía. Aquí van las ideas de ligas.)*

---

### 3.3 EL TECHADO — feed social / blog
*(Lo que llamamos "el techado": el muro social / blog de la app. Aquí van sus ideas.)*

*(Sin ideas guardadas todavía.)*

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