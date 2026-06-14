import { useEffect, useState } from 'react'
import fondoCanchaMadera from '../assets/plantillas/plantilla_cancha_madera.png'

export default function IntroMediaCancha({ onComplete }) {
  const [saliendo, setSaliendo] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSaliendo(true), 6000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (saliendo) {
      const t = setTimeout(() => onComplete && onComplete(), 700)
      return () => clearTimeout(t)
    }
  }, [saliendo, onComplete])

  return (
    <div
      onClick={() => setSaliendo(true)}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: saliendo ? 0 : 1, transition: 'opacity .7s ease',
      }}
    >
      {/* Imagen de la cancha de madera de fondo */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `url(${fondoCanchaMadera})`,
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
      }} />
      {/* Capa oscura encima para que la animación resalte */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'radial-gradient(circle at 50% 42%, rgba(10,14,19,.55) 0%, rgba(8,11,15,.72) 45%, rgba(6,8,11,.88) 100%)',
      }} />

      <style>{`
        .mc-glow{position:absolute;top:45%;left:50%;width:120%;height:55%;transform:translate(-50%,-50%);
          background:radial-gradient(ellipse at center, rgba(232,169,75,.22) 0%, transparent 60%);opacity:0;
          animation:mcGlowIn 2.4s ease-out .3s forwards;z-index:1;}
        @keyframes mcGlowIn{0%{opacity:0;}60%{opacity:1;}100%{opacity:.9;}}

        .mc-stage{display:flex;flex-direction:column;align-items:center;position:relative;z-index:2;}

        .mc-ballbox{position:relative;
          width:clamp(200px, 30vh, 340px);
          height:clamp(200px, 30vh, 340px);
          display:flex;align-items:center;justify-content:center;}

        .mc-line{position:absolute;top:50%;left:50%;width:100vw;height:5px;
          transform:translate(-50%,-50%) scaleX(0);transform-origin:left center;
          background:linear-gradient(90deg,rgba(154,100,32,0) 0%, rgba(200,132,46,.9) 14%, #eeb45a 50%, rgba(200,132,46,.9) 86%, rgba(154,100,32,0) 100%);
          box-shadow:0 0 18px rgba(232,169,75,.6);z-index:1;
          animation:mcCruza 1.7s cubic-bezier(.45,.05,.25,1) .3s forwards;}
        @keyframes mcCruza{to{transform:translate(-50%,-50%) scaleX(1);}}

        .mc-spark{position:absolute;top:50%;left:0;width:70px;height:70px;border-radius:50%;
          transform:translate(-50%,-50%);opacity:0;z-index:4;pointer-events:none;
          background:radial-gradient(circle, rgba(255,250,232,.95) 0%, rgba(255,222,150,.4) 38%, transparent 70%);
          animation:mcSparkRun 1.7s cubic-bezier(.45,.05,.25,1) .3s forwards;}
        @keyframes mcSparkRun{0%{opacity:0;left:0;}10%{opacity:1;}90%{opacity:1;left:100%;}100%{opacity:0;left:100%;}}

        .mc-ball{position:relative;width:100%;height:100%;z-index:2;}
        .mc-ball svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 18px rgba(232,169,75,.45));}
        .mc-st{fill:none;stroke:url(#mcgrad);stroke-linecap:round;stroke-width:5.5;}
        .mc-ring{stroke-dasharray:491;stroke-dashoffset:491;animation:mcDraw 1.2s ease-out 1.05s forwards;}
        .mc-vseam{stroke-dasharray:120;stroke-dashoffset:120;animation:mcDraw .85s ease-out 1.65s forwards;}
        .mc-seamL{stroke-dasharray:150;stroke-dashoffset:150;animation:mcDraw .95s ease-out 1.85s forwards;}
        .mc-seamR{stroke-dasharray:150;stroke-dashoffset:150;animation:mcDraw .95s ease-out 2.05s forwards;}
        @keyframes mcDraw{to{stroke-dashoffset:0;}}

        .mc-wordmark{margin-top:clamp(20px, 4vh, 48px);text-align:center;opacity:0;transform:translateY(24px);z-index:2;
          animation:mcRise 1.1s cubic-bezier(.2,.8,.3,1) 2.5s forwards;}
        @keyframes mcRise{to{opacity:1;transform:translateY(0);}}
        .mc-nm{font-size:clamp(2.4rem, 7vw, 5rem);font-weight:800;letter-spacing:.04em;line-height:.95;
          display:flex;gap:.18em;justify-content:center;white-space:nowrap;text-shadow:0 2px 24px rgba(0,0,0,.7);}
        .mc-media{background:linear-gradient(180deg,#ffffff,#aeb7c2);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}
        .mc-cancha{background:linear-gradient(180deg,#f3cf63,#c8842e);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}
        .mc-tag{margin-top:clamp(12px, 2vh, 22px);font-size:clamp(.75rem, 1.4vw, 1.05rem);letter-spacing:.45em;
          text-transform:uppercase;color:#c3b89a;opacity:0;animation:mcGlowIn 1s ease-out 3.4s forwards;text-shadow:0 1px 12px rgba(0,0,0,.8);}
      `}</style>

      <div className="mc-glow"></div>
      <div className="mc-stage">
        <div className="mc-ballbox">
          <div className="mc-line"></div>
          <div className="mc-spark"></div>
          <div className="mc-ball">
            <svg viewBox="0 0 200 200">
              <defs>
                <linearGradient id="mcgrad" gradientUnits="userSpaceOnUse" x1="100" y1="22" x2="100" y2="178">
                  <stop offset="0%" stopColor="#f3cf63" />
                  <stop offset="50%" stopColor="#d18f33" />
                  <stop offset="100%" stopColor="#9a6420" />
                </linearGradient>
              </defs>
              <circle className="mc-st mc-ring" cx="100" cy="100" r="78" />
              <line className="mc-st mc-vseam" x1="100" y1="40" x2="100" y2="160" style={{ strokeWidth: 7 }} />
              <path className="mc-st mc-seamL" d="M58 50 Q90 100 58 150" />
              <path className="mc-st mc-seamR" d="M142 50 Q110 100 142 150" />
            </svg>
          </div>
        </div>
        <div className="mc-wordmark">
          <div className="mc-nm"><span className="mc-media">MEDIA</span><span className="mc-cancha">CANCHA</span></div>
        </div>
        <div className="mc-tag">Baloncesto dominicano</div>
      </div>
    </div>
  )
}