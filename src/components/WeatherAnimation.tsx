import { useEffect, useRef, useCallback } from 'react';

export type AnimationType = 'matrix' | 'rain' | 'snow' | 'sunny' | 'storm' | 'fog' | 'cloudy' | 'clear-night' | null;

interface WeatherAnimationProps {
  type: AnimationType;
  onExit?: () => void;
  fullscreen?: boolean; // true for cmatrix command
}

interface Particle {
  x: number;
  y: number;
  speed: number;
  char?: string;
  opacity: number;
  size?: number;
  trail?: number[];
  angle?: number;
  life?: number;
}

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

export const WeatherAnimation = ({ type, onExit, fullscreen = false }: WeatherAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    switch (type) {
      case 'matrix':
        drawMatrix(ctx, w, h);
        break;
      case 'rain':
        drawRain(ctx, w, h);
        break;
      case 'snow':
        drawSnow(ctx, w, h);
        break;
      case 'sunny':
        drawSunny(ctx, w, h);
        break;
      case 'storm':
        drawStorm(ctx, w, h);
        break;
      case 'fog':
        drawFog(ctx, w, h);
        break;
      case 'cloudy':
        drawCloudy(ctx, w, h);
        break;
      case 'clear-night':
        drawNight(ctx, w, h);
        break;
    }
  }, [type]);

  useEffect(() => {
    if (!type) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles(canvas.width, canvas.height);
    };

    const initParticles = (w: number, h: number) => {
      const particles: Particle[] = [];
      const count = type === 'matrix' ? Math.floor(w / 14) :
                    type === 'rain' ? 200 :
                    type === 'snow' ? 100 :
                    type === 'storm' ? 250 :
                    type === 'fog' ? 30 :
                    type === 'cloudy' ? 15 :
                    type === 'clear-night' ? 80 :
                    type === 'sunny' ? 40 : 50;

      for (let i = 0; i < count; i++) {
        particles.push(createParticle(w, h));
      }
      particlesRef.current = particles;
    };

    const createParticle = (w: number, h: number): Particle => {
      switch (type) {
        case 'matrix':
          return {
            x: Math.random() * w,
            y: Math.random() * h - h,
            speed: 2 + Math.random() * 8,
            char: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
            opacity: 0.3 + Math.random() * 0.7,
            trail: Array.from({ length: 15 + Math.floor(Math.random() * 15) }, () =>
              Math.random() > 0.5 ? MATRIX_CHARS.charCodeAt(Math.floor(Math.random() * MATRIX_CHARS.length)) : 0
            ),
          };
        case 'rain':
          return { x: Math.random() * w, y: Math.random() * h - h, speed: 10 + Math.random() * 15, opacity: 0.3 + Math.random() * 0.5, size: 1 + Math.random() };
        case 'storm':
          return { x: Math.random() * w, y: Math.random() * h - h, speed: 15 + Math.random() * 20, opacity: 0.4 + Math.random() * 0.6, size: 1 + Math.random() * 2, angle: 0.2 + Math.random() * 0.3 };
        case 'snow':
          return { x: Math.random() * w, y: Math.random() * h - h, speed: 0.5 + Math.random() * 2, opacity: 0.4 + Math.random() * 0.6, size: 2 + Math.random() * 4, angle: Math.random() * Math.PI * 2 };
        case 'sunny':
          return { x: Math.random() * w, y: Math.random() * h, speed: 0.2 + Math.random() * 0.5, opacity: 0.05 + Math.random() * 0.1, size: 50 + Math.random() * 150, life: Math.random() * 100 };
        case 'fog':
          return { x: Math.random() * w - w * 0.5, y: Math.random() * h, speed: 0.3 + Math.random() * 0.7, opacity: 0.02 + Math.random() * 0.06, size: 200 + Math.random() * 400 };
        case 'cloudy':
          return { x: Math.random() * w * 2 - w * 0.5, y: Math.random() * h * 0.6, speed: 0.1 + Math.random() * 0.3, opacity: 0.03 + Math.random() * 0.05, size: 150 + Math.random() * 300 };
        case 'clear-night':
          return { x: Math.random() * w, y: Math.random() * h, speed: 0, opacity: 0.2 + Math.random() * 0.8, size: 1 + Math.random() * 2, life: Math.random() * 200 };
        default:
          return { x: 0, y: 0, speed: 0, opacity: 0 };
      }
    };

    resize();
    window.addEventListener('resize', resize);

    let frameCount = 0;
    const animate = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw(ctx, canvas.width, canvas.height);

      // Update particles
      particlesRef.current.forEach((p, i) => {
        switch (type) {
          case 'matrix':
            p.y += p.speed;
            if (frameCount % 3 === 0) p.char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
            if (p.y > canvas.height + 200) { p.y = -200; p.x = Math.random() * canvas.width; }
            break;
          case 'rain':
            p.y += p.speed;
            if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
            break;
          case 'storm':
            p.y += p.speed;
            p.x += (p.angle || 0.2) * p.speed;
            if (p.y > canvas.height || p.x > canvas.width + 50) { p.y = -10; p.x = Math.random() * canvas.width; }
            break;
          case 'snow':
            p.y += p.speed;
            p.angle = (p.angle || 0) + 0.02;
            p.x += Math.sin(p.angle) * 0.5;
            if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
            break;
          case 'sunny':
            p.life = (p.life || 0) + 1;
            p.opacity = 0.03 + Math.sin((p.life || 0) * 0.02) * 0.04;
            break;
          case 'fog':
            p.x += p.speed;
            if (p.x > canvas.width + (p.size || 200)) { p.x = -(p.size || 200); }
            break;
          case 'cloudy':
            p.x += p.speed;
            if (p.x > canvas.width + (p.size || 150)) { p.x = -(p.size || 150); p.y = Math.random() * canvas.height * 0.6; }
            break;
          case 'clear-night':
            p.life = (p.life || 0) + 1;
            p.opacity = 0.2 + Math.sin((p.life || 0) * 0.03 + i) * 0.4;
            break;
        }
      });

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    // Keyboard exit for fullscreen cmatrix
    const handleKey = (e: KeyboardEvent) => {
      if (fullscreen && (e.key === 'q' || e.key === 'Escape')) {
        onExit?.();
      }
    };
    if (fullscreen) window.addEventListener('keydown', handleKey);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      if (fullscreen) window.removeEventListener('keydown', handleKey);
    };
  }, [type, draw, fullscreen, onExit]);

  // Drawing functions
  const drawMatrix = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, w, h);
    particlesRef.current.forEach(p => {
      const fontSize = 14;
      // Draw trail
      if (p.trail) {
        for (let j = 0; j < p.trail.length; j++) {
          const trailY = p.y - j * fontSize;
          if (trailY < 0 || trailY > h) continue;
          const alpha = j === 0 ? 1 : (1 - j / p.trail.length) * 0.6;
          const green = j === 0 ? 255 : 100 + Math.floor((1 - j / p.trail.length) * 155);
          ctx.fillStyle = `rgba(0, ${green}, 0, ${alpha * p.opacity})`;
          ctx.font = `${fontSize}px monospace`;
          const ch = j === 0 ? (p.char || '0') : String.fromCharCode(p.trail[j] || 48);
          ctx.fillText(ch, p.x, trailY);
        }
      }
    });
  };

  const drawRain = (ctx: CanvasRenderingContext2D, _w: number, _h: number) => {
    particlesRef.current.forEach(p => {
      ctx.strokeStyle = `rgba(120, 180, 255, ${p.opacity})`;
      ctx.lineWidth = p.size || 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y + 15 + (p.speed || 10));
      ctx.stroke();
    });
  };

  const drawSnow = (ctx: CanvasRenderingContext2D, _w: number, _h: number) => {
    particlesRef.current.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230, 240, 255, ${p.opacity})`;
      ctx.fill();
    });
  };

  const drawSunny = (ctx: CanvasRenderingContext2D, _w: number, _h: number) => {
    particlesRef.current.forEach(p => {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size || 100);
      gradient.addColorStop(0, `rgba(255, 200, 50, ${p.opacity})`);
      gradient.addColorStop(1, 'rgba(255, 200, 50, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(p.x - (p.size || 100), p.y - (p.size || 100), (p.size || 100) * 2, (p.size || 100) * 2);
    });
  };

  const drawStorm = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Rain
    particlesRef.current.forEach(p => {
      ctx.strokeStyle = `rgba(150, 180, 220, ${p.opacity})`;
      ctx.lineWidth = p.size || 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + (p.angle || 0.2) * 20, p.y + 20);
      ctx.stroke();
    });
    // Occasional lightning flash
    if (Math.random() < 0.003) {
      ctx.fillStyle = 'rgba(200, 200, 255, 0.15)';
      ctx.fillRect(0, 0, w, h);
      // Lightning bolt
      ctx.strokeStyle = 'rgba(200, 200, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let lx = Math.random() * w;
      let ly = 0;
      ctx.moveTo(lx, ly);
      while (ly < h * 0.7) {
        lx += (Math.random() - 0.5) * 60;
        ly += 20 + Math.random() * 40;
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();
    }
  };

  const drawFog = (ctx: CanvasRenderingContext2D, _w: number, _h: number) => {
    particlesRef.current.forEach(p => {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size || 200);
      gradient.addColorStop(0, `rgba(180, 190, 200, ${p.opacity})`);
      gradient.addColorStop(1, 'rgba(180, 190, 200, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(p.x - (p.size || 200), p.y - (p.size || 200), (p.size || 200) * 2, (p.size || 200) * 2);
    });
  };

  const drawCloudy = (ctx: CanvasRenderingContext2D, _w: number, _h: number) => {
    particlesRef.current.forEach(p => {
      const s = p.size || 150;
      ctx.fillStyle = `rgba(160, 170, 180, ${p.opacity})`;
      // Draw cloud shape with overlapping circles
      for (let j = 0; j < 5; j++) {
        ctx.beginPath();
        ctx.arc(p.x + j * s * 0.3, p.y + Math.sin(j * 1.2) * s * 0.15, s * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const drawNight = (ctx: CanvasRenderingContext2D, _w: number, _h: number) => {
    particlesRef.current.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size || 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 220, 255, ${Math.max(0, p.opacity)})`;
      ctx.fill();
      // Subtle glow
      if ((p.size || 1) > 1.5) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, (p.size || 1) * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${Math.max(0, p.opacity * 0.1)})`;
        ctx.fill();
      }
    });
  };

  if (!type) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`${fullscreen ? 'fixed inset-0 z-50 bg-black' : 'absolute inset-0 pointer-events-none z-0'}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// Map weather codes to animation types
export const weatherCodeToAnimation = (code: number, isDay: boolean): AnimationType => {
  if (code <= 1) return isDay ? 'sunny' : 'clear-night';
  if (code <= 3) return 'cloudy';
  if (code <= 48) return 'fog';
  if (code <= 67) return 'rain';
  if (code <= 86) return 'snow';
  return 'storm';
};
