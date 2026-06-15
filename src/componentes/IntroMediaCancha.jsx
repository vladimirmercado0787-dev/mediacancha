import { useEffect, useState } from 'react'
import texturaCueroClara from '../assets/textura-cuero-clara.png'

export default function IntroMediaCancha({ onComplete }) {
  const [saliendo, setSaliendo] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSaliendo(true), 5200)
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
        position: 'fixed', inset: 0, zIndex: 9999, overflow: 'hidden', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: saliendo ? 0 : 1, transition: 'opacity .7s ease',
        background: '#ece5d6',
      }}
    >
      {/* textura de cuero clara sutil de fondo (misma identidad que el tema claro) */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `url(${texturaCueroClara})`,
        backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5,
      }} />
      {/* lavado crema encima para suavizar */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 70% 60% at 50% 42%, rgba(250,245,235,.55) 0%, rgba(240,232,216,.78) 55%, rgba(228,218,198,.92) 100%)',
      }} />

      <style>{`
        .mc-halo{position:absolute;top:44%;left:50%;width:120%;height:60%;transform:translate(-50%,-50%);
          background:radial-gradient(ellipse at center, rgba(200,132,46,.16) 0%, transparent 62%);opacity:0;
          animation:mcHaloIn 2.2s ease-out .3s forwards;z-index:1;}
        @keyframes mcHaloIn{0%{opacity:0;}100%{opacity:1;}}

        .mc-stage{display:flex;flex-direction:column;align-items:center;position:relative;z-index:2;}

        .mc-ballbox{position:relative;
          width:clamp(190px, 28vh, 320px);
          height:clamp(190px, 28vh, 320px);
          display:flex;align-items:center;justify-content:center;}

        .mc-line{position:absolute;top:50%;left:50%;width:100vw;height:4px;
          transform:translate(-50%,-50%) scaleX(0);transform-origin:left center;
          background:linear-gradient(90deg,rgba(154,100,32,0) 0%, rgba(200,132,46,.85) 14%, #c8842e 50%, rgba(200,132,46,.85) 86%, rgba(154,100,32,0) 100%);
          box-shadow:0 0 16px rgba(200,132,46,.5);z-index:1;
          animation:mcCruza 1.6s cubic-bezier(.45,.05,.25,1) .3s forwards;}
        @keyframes mcCruza{to{transform:translate(-50%,-50%) scaleX(1);}}

        .mc-spark{position:absolute;top:50%;left:0;width:64px;height:64px;border-radius:50%;
          transform:translate(-50%,-50%);opacity:0;z-index:4;pointer-events:none;
          background:radial-gradient(circle, rgba(255,252,244,.95) 0%, rgba(243,207,99,.45) 38%, transparent 70%);
          animation:mcSparkRun 1.6s cubic-bezier(.45,.05,.25,1) .3s forwards;}
        @keyframes mcSparkRun{0%{opacity:0;left:0;}10%{opacity:1;}90%{opacity:1;left:100%;}100%{opacity:0;left:100%;}}

        .mc-ball{position:relative;width:100%;height:100%;z-index:2;}
        .mc-ball svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 6px 16px rgba(154,100,32,.3));}
        .mc-st{fill:none;stroke:url(#mcgrad);stroke-linecap:round;stroke-width:5.5;}
        .mc-ring{stroke-dasharray:491;stroke-dashoffset:491;animation:mcDraw 1.2s ease-out 1.0s forwards;}
        .mc-vseam{stroke-dasharray:120;stroke-dashoffset:120;animation:mcDraw .85s ease-out 1.55s forwards;}
        .mc-seamL{stroke-dasharray:150;stroke-dashoffset:150;animation:mcDraw .95s ease-out 1.75s forwards;}
        .mc-seamR{stroke-dasharray:150;stroke-dashoffset:150;animation:mcDraw .95s ease-out 1.95s forwards;}
        @keyframes mcDraw{to{stroke-dashoffset:0;}}

        .mc-wordmark{margin-top:clamp(18px, 3.5vh, 42px);text-align:center;opacity:0;transform:translateY(22px);z-index:2;
          animation:mcRise 1.1s cubic-bezier(.2,.8,.3,1) 2.4s forwards;}
        @keyframes mcRise{to{opacity:1;transform:translateY(0);}}
        .mc-nm{font-size:clamp(2.4rem, 7vw, 5rem);font-weight:800;letter-spacing:.04em;line-height:.95;
          display:flex;gap:.18em;justify-content:center;white-space:nowrap;}
        .mc-media{background:linear-gradient(180deg,#3a4654,#1c2530);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}
        .mc-cancha{background:linear-gradient(180deg,#e0a83f,#9a6420);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}
        .mc-rule{margin-top:clamp(14px, 2vh, 22px);height:3px;width:0;border-radius:3px;
          background:linear-gradient(90deg,#e7c069,#c8842e 55%,#9a6518);
          animation:mcRule 1s cubic-bezier(.2,.8,.3,1) 3.1s forwards;box-shadow:0 1px 8px rgba(200,132,46,.4);}
        @keyframes mcRule{to{width:clamp(120px, 22vw, 210px);}}
      `}</style>

      <div className="mc-halo"></div>
      <div className="mc-stage">
        <div className="mc-ballbox">
          <div className="mc-line"></div>
          <div className="mc-spark"></div>
          <div className="mc-ball">
            <svg viewBox="0 0 200 200">
              <defs>
                <linearGradient id="mcgrad" gradientUnits="userSpaceOnUse" x1="100" y1="22" x2="100" y2="178">
                  <stop offset="0%" stopColor="#e7c069" />
                  <stop offset="50%" stopColor="#c8842e" />
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
        <div className="mc-rule"></div>
      </div>
    </div>
  )
}