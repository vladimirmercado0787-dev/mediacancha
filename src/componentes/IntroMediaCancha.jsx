import React, { useEffect, useMemo, useState } from "react";

/**
 * IntroMediaCancha
 * Intro de arranque de la app: balón de cuero con costuras de oro que cae,
 * rebota con onda dorada, el cuero llena la pantalla y sube la marca
 * "MEDIA CANCHA" con brillo metálico + lema.
 *
 * Uso en App.jsx:
 *   const [intro, setIntro] = useState(true);
 *   ...
 *   {intro && <IntroMediaCancha onFinish={() => setIntro(false)} />}
 *
 * Props:
 *   onFinish   -> se llama cuando termina (para ocultar el intro)
 *   duracion   -> ms que dura antes de desvanecer (default 4500)
 */
export default function IntroMediaCancha({ onFinish, duracion = 4500 }) {
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setSaliendo(true), duracion);
    const t2 = setTimeout(() => onFinish && onFinish(), duracion + 650);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [duracion, onFinish]);

  // posiciones de las chispas en círculo
  const chispas = useMemo(() => {
    const arr = [];
    const N = 8;
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2;
      const d = 130;
      arr.push({ dx: Math.cos(ang) * d, dy: Math.sin(ang) * d });
    }
    return arr;
  }, []);

  const disp =
    '"Arial Narrow", Impact, "Haettenschweiler", system-ui, sans-serif';
  const gold =
    "linear-gradient(120deg,#9c6518 0%,#e8b65a 38%,#fbe08a 50%,#e8b65a 62%,#9c6518 100%)";
  const plata =
    "linear-gradient(120deg,#8a929a 0%,#e7edf2 45%,#ffffff 52%,#cdd6dd 60%,#8a929a 100%)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#040303",
        overflow: "hidden",
        opacity: saliendo ? 0 : 1,
        transition: "opacity .6s ease",
        pointerEvents: saliendo ? "none" : "auto",
      }}
    >
      <style>{CSS_INTRO}</style>

      {/* fondo "cuero" por CSS (sin imagen) que se revela */}
      <div className="mc-leather" />
      <div className="mc-vign" />

      {/* destello inicial */}
      <div className="mc-spark0" />

      {/* sombra del balón */}
      <div className="mc-shadow" />

      {/* balón de cuero con costuras de oro */}
      <div className="mc-ballwrap">
        <div className="mc-ball">
          <svg viewBox="0 0 128 128" width="100%" height="100%">
            <defs>
              <radialGradient id="mcLea" cx="38%" cy="32%" r="75%">
                <stop offset="0%" stopColor="#3a2a18" />
                <stop offset="55%" stopColor="#241810" />
                <stop offset="100%" stopColor="#0f0a06" />
              </radialGradient>
              <linearGradient id="mcSeam" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#9c6518" />
                <stop offset="50%" stopColor="#fbe08a" />
                <stop offset="100%" stopColor="#c8842e" />
              </linearGradient>
            </defs>
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="url(#mcLea)"
              stroke="url(#mcSeam)"
              strokeWidth="2.5"
            />
            <circle cx="48" cy="44" r="26" fill="rgba(255,255,255,.06)" />
            <g fill="none" stroke="url(#mcSeam)" strokeWidth="3">
              <line x1="64" y1="6" x2="64" y2="122" />
              <line x1="6" y1="64" x2="122" y2="64" />
              <path d="M24 18 Q64 64 24 110" />
              <path d="M104 18 Q64 64 104 110" />
            </g>
          </svg>
        </div>
      </div>

      {/* onda de impacto + flash */}
      <div className="mc-shock" />
      <div className="mc-flash" />

      {/* chispas */}
      {chispas.map((c, i) => (
        <div
          key={i}
          className="mc-spark"
          style={{ "--dx": `${c.dx}px`, "--dy": `${c.dy}px` }}
        />
      ))}

      {/* marca */}
      <div className="mc-brand">
        <div className="mc-word">
          <span
            className="mc-l1"
            style={{
              fontFamily: disp,
              backgroundImage: plata,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            MEDIA
          </span>
          <span
            className="mc-l2"
            style={{
              fontFamily: disp,
              backgroundImage: gold,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            CANCHA
          </span>
          <span className="mc-gleam" />
        </div>
        <div className="mc-rule" />
        <div
          className="mc-tag"
          style={{
            backgroundImage: gold,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Tu cancha · Tu liga · Tu leyenda
        </div>
      </div>

      <div className="mc-by">
        by <b style={{ color: "#e8b65a" }}>Andamio</b>
      </div>
    </div>
  );
}

const CSS_INTRO = `
.mc-leather{position:absolute;inset:0;opacity:0;transform:scale(1.25);
  background:
    radial-gradient(60% 45% at 32% 28%, rgba(120,84,40,.55), transparent 60%),
    radial-gradient(80% 60% at 75% 80%, rgba(70,46,22,.5), transparent 65%),
    linear-gradient(180deg,#1c130a,#0b0703);
  animation:mcReveal 1.1s ease-out 1.35s forwards}
.mc-vign{position:absolute;inset:0;opacity:0;
  background:radial-gradient(120% 90% at 50% 42%, transparent 38%, rgba(0,0,0,.72) 100%);
  animation:mcFade .8s ease-out 1.6s forwards}
.mc-spark0{position:absolute;left:50%;top:16%;width:8px;height:8px;border-radius:50%;
  transform:translate(-50%,-50%) scale(0);background:#fff;
  box-shadow:0 0 24px 8px #fbe08a,0 0 60px 18px rgba(232,182,79,.6);
  animation:mcSpark0 .5s ease-out .25s forwards}
.mc-ballwrap{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);width:128px;height:128px;
  animation:mcBallOut .7s ease-in 1.4s forwards}
.mc-ball{width:100%;height:100%;transform:translateY(-60vh) rotate(-90deg);
  animation:mcDrop 1s cubic-bezier(.5,.05,.6,1) .3s forwards, mcSpin 1.3s linear .3s forwards}
.mc-shadow{position:absolute;left:50%;top:calc(42% + 78px);width:120px;height:20px;border-radius:50%;
  transform:translate(-50%,-50%) scaleX(0);opacity:0;
  background:radial-gradient(closest-side, rgba(0,0,0,.6), transparent);
  animation:mcShadow 1s cubic-bezier(.5,.05,.6,1) .3s forwards}
.mc-shock{position:absolute;left:50%;top:42%;width:40px;height:40px;border-radius:50%;
  transform:translate(-50%,-50%) scale(0);opacity:0;border:3px solid #fbe08a;
  box-shadow:0 0 30px rgba(232,182,79,.7);animation:mcShock .7s ease-out 1.25s forwards}
.mc-flash{position:absolute;inset:0;opacity:0;
  background:radial-gradient(60% 50% at 50% 42%, rgba(251,224,138,.5), transparent 70%);
  animation:mcFlash .5s ease-out 1.25s forwards}
.mc-spark{position:absolute;left:50%;top:42%;width:6px;height:6px;border-radius:50%;background:#fbe08a;opacity:0;
  box-shadow:0 0 10px #fbe08a;animation:mcFly .7s ease-out 1.3s forwards}
.mc-brand{position:absolute;left:0;right:0;top:39%;text-align:center;opacity:0;transform:translateY(26px);
  animation:mcBrandIn .9s cubic-bezier(.2,.8,.25,1) 1.75s forwards}
.mc-word{display:inline-block;position:relative;overflow:hidden;padding:0 6px}
.mc-l1,.mc-l2{display:block;font-weight:900;font-size:62px;line-height:.86;letter-spacing:1px}
.mc-l2{filter:drop-shadow(0 2px 10px rgba(232,182,79,.35))}
.mc-gleam{position:absolute;top:-10%;left:-40%;width:34%;height:120%;transform:skewX(-18deg);opacity:0;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);mix-blend-mode:overlay;
  animation:mcGleam 1s ease-in-out 2.55s forwards}
.mc-rule{width:0;height:2px;margin:13px auto 0;background:linear-gradient(120deg,#9c6518,#fbe08a,#9c6518);
  border-radius:2px;box-shadow:0 0 12px rgba(232,182,79,.6);animation:mcRule .7s ease-out 2.55s forwards}
.mc-tag{margin-top:14px;font-size:13.5px;letter-spacing:3px;text-transform:uppercase;font-weight:800;
  opacity:0;transform:translateY(10px);animation:mcTagIn .8s ease-out 2.95s forwards}
.mc-by{position:absolute;left:0;right:0;bottom:34px;text-align:center;font-size:11px;letter-spacing:2px;
  color:#6a5a3a;font-weight:700;opacity:0;animation:mcFade .8s ease-out 3.2s forwards}

@keyframes mcSpark0{0%{transform:translate(-50%,-50%) scale(0);opacity:1}60%{opacity:1}100%{transform:translate(-50%,-50%) scale(2.4);opacity:0}}
@keyframes mcDrop{0%{transform:translateY(-60vh)}70%{transform:translateY(0)}82%{transform:translateY(-46px) scaleY(.96)}100%{transform:translateY(0) scaleY(1)}}
@keyframes mcSpin{to{transform:rotate(360deg)}}
@keyframes mcShadow{0%{transform:translate(-50%,-50%) scaleX(0);opacity:0}70%{transform:translate(-50%,-50%) scaleX(1);opacity:.7}100%{transform:translate(-50%,-50%) scaleX(.9);opacity:.5}}
@keyframes mcShock{0%{transform:translate(-50%,-50%) scale(0);opacity:.9}100%{transform:translate(-50%,-50%) scale(7);opacity:0}}
@keyframes mcFlash{0%{opacity:0}30%{opacity:1}100%{opacity:0}}
@keyframes mcFly{0%{opacity:1;transform:translate(-50%,-50%)}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy)))}}
@keyframes mcReveal{0%{opacity:0;transform:scale(1.25)}100%{opacity:1;transform:scale(1)}}
@keyframes mcFade{to{opacity:1}}
@keyframes mcBallOut{to{opacity:0;transform:translate(-50%,-50%) scale(2.3)}}
@keyframes mcBrandIn{0%{opacity:0;transform:translateY(26px)}100%{opacity:1;transform:translateY(0)}}
@keyframes mcGleam{0%{left:-40%;opacity:0}20%{opacity:1}80%{opacity:1}100%{left:130%;opacity:0}}
@keyframes mcRule{to{width:128px}}
@keyframes mcTagIn{to{opacity:1;transform:translateY(0)}}
`;