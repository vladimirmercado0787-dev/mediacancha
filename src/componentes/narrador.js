// ============================================================
//  narrador.js  ·  Motor de narración de Media Cancha
//  Convierte cada jugada anotada en una frase con sabor dominicano.
//  No toca ningún otro archivo. Se usa así:
//
//    import { crearNarrador } from './narrador'
//    const narrador = crearNarrador({ nombreA, nombreB })
//    const linea = narrador.narrar(jugada, jugadores)   // -> { texto, tono, voz, momento }
//
//  'jugada' es exactamente el objeto que PantallaJuegoVivo mete en el historial:
//    { accionId, etiquetaJug, equipo, sub, suma, asistDe, asistA, jugId }
//  'jugadores' es el arreglo actual de jugadores (para sacar el marcador y los totales).
// ============================================================

// ---- utilidades ----
const elegir = (arr) => arr[Math.floor(Math.random() * arr.length)]
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

// rellena plantillas: "{j} la mojó" -> "Manuel la mojó"
const armar = (plantilla, datos) =>
  plantilla.replace(/\{(\w+)\}/g, (_, k) => (datos[k] != null ? datos[k] : ''))

// ---- bolsas de frases por tipo de jugada (sabor dominicano) ----
// {j} = jugador, {eq} = equipo, {as} = asistente
const FRASES = {
  p2: [
    '¡Canasta de {j}! Dos puntos.',
    '¡{j} la metió! Suma dos.',
    '¡Adentro! {j} anota dos.',
    '¡Bandeja de {j}! Y son dos.',
    '¡{j} no falla por dentro! Dos puntos.',
  ],
  p2_asist: [
    '¡{as} la sirve, {j} la mete! Dos puntos, asistencia bonita.',
    '¡Conexión {as} con {j}! Canasta de dos.',
    '¡Qué pase de {as}! {j} solo la deposita. Dos.',
  ],
  p3: [
    '¡TRIPLEEE de {j}! ¡La mojó!',
    '¡Desde la lejanía, {j}! ¡Tres puntos!',
    '¡Tabla y adentro! ¡Triple de {j}!',
    '¡{j} desde el centro de la ciudad! ¡TRES!',
    '¡Fuego de {j}! ¡La clavó de tres!',
  ],
  p3_asist: [
    '¡{as} encuentra a {j} en la esquina… TRIPLE! 🔥',
    '¡Pase de {as}, triple de {j}! ¡Tres puntos!',
    '¡Qué visión de {as}! {j} la entierra de tres.',
  ],
  p1: ['¡{j} suma uno!', '¡Punto de {j}!'],
  tlm: ['{j} desde la línea… ¡adentro! Tiro libre bueno.', '¡{j} no perdona en la línea! Punto.', 'Frío {j} en el libre. Lo metió.'],
  tlf: ['{j} falla el tiro libre…', 'Se le salió el libre a {j}.', '{j} no aprovecha desde la línea.'],
  reb: ['¡{j} se levanta y agarra el rebote!', '¡Rebote de {j}! Dominando el tablero.', '¡{j} pelea y se queda con la bola!'],
  ast: ['¡Tremendo pase de {j}!', '¡{j} reparte caramelos! Asistencia.', '¡La visión de {j}! Otra asistencia.'],
  rob: ['¡{j} le robó la bola! ¡Manos rápidas!', '¡Robo de {j}! Sale al contragolpe.', '¡{j} se la quitó! ¡Qué defensa!'],
  tap: ['¡TAPÓN de {j}! ¡Le borró el tiro!', '¡{j} dijo que no! ¡Bloqueo monumental!', '¡{j} lo mandó pa\' la grada! ¡Tapón!'],
  fal: ['Falta de {j}.', '{j} comete la falta.', 'Le pitan falta a {j}.'],
  per: ['Pérdida de {j}, regaló el balón.', '{j} pierde la bola. Cuidado con eso.', 'Mala de {j}, entrega el balón.'],
  fall: ['{j} lo intentó… no entró.', 'Se le salió el tiro a {j}.', '{j} falla, sigue el juego.', 'No quiso entrar esa de {j}.'],
  min: ['{j} entra a la cancha.', 'Cambio: {j} al juego.'],
}

// frases de "color" (el analista / los momentos que enganchan)
const COLOR = {
  racha: [
    '¡{j} está ENCENDIDO! 🔥 Lleva {n} canastas seguidas.',
    '¡Nadie puede con {j}! {n} seguidas, está intratable.',
    '¡{j} entró en modo candela! {n} canastas al hilo.',
  ],
  mejorJuego: [
    '¡Ojo con {j}! Va camino a su mejor noche, ya lleva {pts} puntos.',
    '¡{j} está teniendo un juegazo! {pts} puntos y subiendo.',
  ],
  parcial: [
    '¡PARCIAL de {n} a 0 para {eq}! ¡Se está volteando esto!',
    '¡{eq} pisó el acelerador! Corrida de {n} sin respuesta.',
    '¡Se calentó {eq}! {n} puntos seguidos, time-out cantado.',
  ],
  empate: ['¡EMPATE a {m}! Esto se puso bueno. 🤝', '¡Iguales a {m}! Juego nuevo.'],
  ventaja: ['¡{eq} pasa al frente! {a} a {b}.', '¡Se voltea! {eq} arriba {a}-{b}.'],
  milestone: ['¡{n} PUNTOS para {j}! 👏', '¡{j} llega a {n}! Qué noche.'],
  marcador: ['{ea} {a}, {eb} {b}.', 'Va {ea} {a}, {eb} {b}.', 'Marcador: {ea} {a} — {eb} {b}.'],
  clutchAbre: ['Últimos minutos y esto está al rojo vivo…', 'Se define el juego, atención…'],
}

// ---- el motor ----
export function crearNarrador({ nombreA = 'Equipo A', nombreB = 'Equipo B', metaPuntos = null } = {}) {
  const nombreEq = (eq) => (eq === 0 ? nombreA : nombreB)

  // memoria del narrador (estado entre jugadas)
  const st = {
    rachaJug: null, rachaN: 0,          // canastas seguidas del mismo jugador
    corridaEq: null, corridaPts: 0,     // parcial: puntos seguidos de un equipo
    liderPrevio: null,                  // quién iba ganando (para detectar empate / cambio de mando)
    hitosDados: {},                     // { jugId: [20,30] } hitos ya cantados
    jugadasDesdeMarcador: 0,            // para soltar el marcador cada cierto rato
    ultimaFrase: '',                    // evita repetir la misma frase pegada
  }

  const primerNombre = (etq) => (etq || 'el jugador').split(' ')[0]
  const total = (jugadores, eq) => jugadores.filter((j) => j.equipo === eq).reduce((a, j) => a + (j.pts || 0), 0)
  const ptsDe = (jugadores, jugId) => { const j = jugadores.find((x) => x.id === jugId); return j ? (j.pts || 0) : 0 }

  const sinRepetir = (arr) => {
    let f = elegir(arr)
    if (f === st.ultimaFrase && arr.length > 1) f = elegir(arr.filter((x) => x !== st.ultimaFrase))
    st.ultimaFrase = f
    return f
  }

  // ¿cuántos puntos sumó esta jugada?
  const puntosJugada = (jugada) => (jugada.suma && jugada.suma.pts) ? jugada.suma.pts : 0

  function narrar(jugada, jugadores) {
    const eq = jugada.equipo
    const jNom = primerNombre(jugada.etiquetaJug)
    const datos = { j: jNom, eq: nombreEq(eq), as: primerNombre(jugada.asistDe), m: 0 }
    const pts = puntosJugada(jugada)
    const esCanasta = pts > 0 && jugada.accionId !== 'tl' // tiro de campo
    const aId = jugada.accionId

    // ----- línea principal (play-by-play) -----
    let bolsa
    if (aId === 'p3') bolsa = jugada.asistDe ? FRASES.p3_asist : FRASES.p3
    else if (aId === 'p2') bolsa = jugada.asistDe ? FRASES.p2_asist : FRASES.p2
    else if (aId === 'p1') bolsa = FRASES.p1
    else if (aId === 'tl') bolsa = (jugada.suma && jugada.suma.tlm) ? FRASES.tlm : FRASES.tlf
    else if (aId === 'fall') bolsa = FRASES.fall
    else bolsa = FRASES[aId] || ['{j} · ' + (jugada.sub || 'jugada')]

    let texto = armar(sinRepetir(bolsa), datos)
    let tono = esCanasta ? (pts === 3 ? 'fuego' : 'positivo') : 'neutro'
    let momento = null
    const extras = [] // frases de color que se anexan

    // ----- actualizar memoria + detectar momentos -----
    if (esCanasta) {
      // racha del jugador
      if (st.rachaJug === jugada.jugId) st.rachaN += 1
      else { st.rachaJug = jugada.jugId; st.rachaN = 1 }
      // parcial del equipo
      if (st.corridaEq === eq) st.corridaPts += pts
      else { st.corridaEq = eq; st.corridaPts = pts }
    } else {
      // una jugada del otro equipo que anota rompe el parcial; faltas/pérdidas no
      st.rachaJug = jugada.jugId === st.rachaJug ? st.rachaJug : st.rachaJug
    }

    // racha caliente (3+ canastas seguidas del mismo)
    if (esCanasta && st.rachaN >= 3) {
      extras.push({ voz: 'analista', texto: armar(sinRepetir(COLOR.racha), { j: jNom, n: st.rachaN }) })
      momento = { tipo: 'racha', jugId: jugada.jugId, valor: st.rachaN, etiqueta: `Racha de ${jNom} (${st.rachaN})` }
      tono = 'fuego'
    }

    // parcial decisivo (8+ seguidos del equipo)
    if (esCanasta && st.corridaPts >= 8) {
      extras.push({ voz: 'analista', texto: armar(sinRepetir(COLOR.parcial), { eq: nombreEq(eq), n: st.corridaPts }) })
      if (!momento) momento = { tipo: 'parcial', equipo: eq, valor: st.corridaPts, etiqueta: `Parcial ${st.corridaPts}-0 de ${nombreEq(eq)}` }
      tono = 'fuego'
    }

    // hito de puntos del jugador (20, 30, 40)
    if (esCanasta) {
      const tot = ptsDe(jugadores, jugada.jugId)
      const hitos = [40, 30, 20]
      for (const h of hitos) {
        const dados = st.hitosDados[jugada.jugId] || []
        if (tot >= h && !dados.includes(h)) {
          st.hitosDados[jugada.jugId] = [...dados, h]
          extras.push({ voz: 'analista', texto: armar(sinRepetir(COLOR.milestone), { j: jNom, n: h }) })
          if (!momento) momento = { tipo: 'mejorJuego', jugId: jugada.jugId, valor: h, etiqueta: `${jNom} llegó a ${h}` }
          tono = 'fuego'
          break
        }
      }
    }

    // empate / cambio de mando (después de una canasta)
    if (esCanasta) {
      const a = total(jugadores, 0), b = total(jugadores, 1)
      const liderAhora = a === b ? 'empate' : (a > b ? 0 : 1)
      if (liderAhora === 'empate' && st.liderPrevio !== 'empate') {
        extras.push({ voz: 'analista', texto: armar(sinRepetir(COLOR.empate), { m: a }) })
        if (!momento) momento = { tipo: 'empate', valor: a, etiqueta: `Empate a ${a}` }
      } else if (liderAhora !== 'empate' && st.liderPrevio != null && st.liderPrevio !== 'empate' && liderAhora !== st.liderPrevio) {
        extras.push({ voz: 'analista', texto: armar(sinRepetir(COLOR.ventaja), { eq: nombreEq(liderAhora), a: Math.max(a, b), b: Math.min(a, b) }) })
        if (!momento) momento = { tipo: 'cambioMando', equipo: liderAhora, etiqueta: `${nombreEq(liderAhora)} pasa al frente` }
      }
      st.liderPrevio = liderAhora
    }

    // ancla de marcador: cada 4 canastas suelta el marcador
    if (esCanasta) {
      st.jugadasDesdeMarcador += 1
      if (st.jugadasDesdeMarcador >= 4) {
        st.jugadasDesdeMarcador = 0
        const a = total(jugadores, 0), b = total(jugadores, 1)
        extras.push({ voz: 'narrador', texto: armar(elegir(COLOR.marcador), { ea: nombreA, a, eb: nombreB, b }) })
      }
    }

    return {
      texto,                 // línea principal (play-by-play)
      tono,                  // 'neutro' | 'positivo' | 'fuego'  -> el diseño decide color/tamaño
      voz: 'narrador',
      extras,                // arreglo de líneas de color { voz, texto } (el analista)
      momento,               // null o el momento destacado detectado (para guardar/resaltar)
      equipo: eq,
    }
  }

  // reinicia memoria (por si empieza otro cuarto y quieres limpiar rachas)
  function reiniciarRachas() { st.rachaJug = null; st.rachaN = 0; st.corridaEq = null; st.corridaPts = 0 }

  return { narrar, reiniciarRachas }
}

// ============================================================
//  Helper opcional: narración "seca" sin memoria (para el historial
//  de una jugada suelta, sin contexto). Devuelve solo el texto.
// ============================================================
export function narrarSimple(jugada) {
  const jNom = (jugada.etiquetaJug || 'el jugador').split(' ')[0]
  const aId = jugada.accionId
  let bolsa
  if (aId === 'p3') bolsa = jugada.asistDe ? FRASES.p3_asist : FRASES.p3
  else if (aId === 'p2') bolsa = jugada.asistDe ? FRASES.p2_asist : FRASES.p2
  else if (aId === 'p1') bolsa = FRASES.p1
  else if (aId === 'tl') bolsa = (jugada.suma && jugada.suma.tlm) ? FRASES.tlm : FRASES.tlf
  else if (aId === 'fall') bolsa = FRASES.fall
  else bolsa = FRASES[aId] || ['{j} · ' + (jugada.sub || 'jugada')]
  return armar(elegir(bolsa), { j: jNom, as: (jugada.asistDe || '').split(' ')[0] })
}