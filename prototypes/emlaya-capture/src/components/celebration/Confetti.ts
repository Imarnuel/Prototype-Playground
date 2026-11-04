/**
 * Canvas confetti that drops top to bottom (brief, Phase 4). Two waves — a burst, then
 * a lighter trickle — spawned across the full top edge just above the viewport, falling
 * through and off the bottom. Every constant is a token read at start().
 *
 * Only this canvas animates per frame; nothing in the DOM is touched by the loop.
 */
import { tokenColorList, tokenMs, tokenNumber, tokenRange } from '../../tokens/read';

type Shape = 'rect' | 'ribbon' | 'dot';

type Particle = {
  shape: Shape;
  color: string;
  w: number;
  h: number;
  x0: number;
  y: number;
  vy: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  angle: number;
  spin: number;
  flipFreq: number;
  born: number;
};

type Config = {
  max: number;
  burst: number;
  trickle: number;
  trickleMs: number;
  clearByMs: number;
  gravity: number;
  drag: number;
  terminal: number;
  burstVy: [number, number];
  trickleVy: [number, number];
  swayAmp: [number, number];
  swayFreq: [number, number];
  spin: [number, number];
  flipFreq: [number, number];
  rectW: [number, number];
  rectH: [number, number];
  ribbonW: [number, number];
  ribbonH: [number, number];
  dot: [number, number];
  above: number;
  palette: string[];
};

function readConfig(): Config {
  return {
    max: tokenNumber('--confetti-max-particles'),
    burst: tokenNumber('--confetti-burst-count'),
    trickle: tokenNumber('--confetti-trickle-count'),
    trickleMs: tokenMs('--confetti-trickle-duration'),
    clearByMs: tokenMs('--confetti-clear-by'),
    gravity: tokenNumber('--confetti-gravity'),
    drag: tokenNumber('--confetti-drag'),
    terminal: tokenNumber('--confetti-terminal-vy'),
    burstVy: [tokenNumber('--confetti-burst-vy-min'), tokenNumber('--confetti-burst-vy-max')],
    trickleVy: [tokenNumber('--confetti-trickle-vy-min'), tokenNumber('--confetti-trickle-vy-max')],
    swayAmp: tokenRange('--confetti-sway-amp'),
    swayFreq: tokenRange('--confetti-sway-freq'),
    spin: tokenRange('--confetti-spin'),
    flipFreq: tokenRange('--confetti-flip-freq'),
    rectW: tokenRange('--confetti-rect-w'),
    rectH: tokenRange('--confetti-rect-h'),
    ribbonW: tokenRange('--confetti-ribbon-w'),
    ribbonH: tokenRange('--confetti-ribbon-h'),
    dot: tokenRange('--confetti-dot'),
    above: tokenNumber('--confetti-spawn-above'),
    palette: tokenColorList('--gap-confetti-palette'),
  };
}

const rand = ([min, max]: [number, number]) => min + Math.random() * (max - min);
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const TAU = Math.PI * 2;

export type ConfettiStats = { spawned: number; alive: number; peak: number; elapsedMs: number; done: boolean };

export class Confetti {
  private ctx: CanvasRenderingContext2D;
  private cfg: Config;
  private particles: Particle[] = [];
  private raf = 0;
  /** Simulation clock, ms. Advances only while the tab is visible. */
  private clock = 0;
  private last = 0;
  private spawned = 0;
  private trickleSpawned = 0;
  private peak = 0;
  private width = 0;
  private height = 0;
  private running = false;

  constructor(private canvas: HTMLCanvasElement, private onDone?: () => void) {
    this.ctx = canvas.getContext('2d')!;
    this.cfg = readConfig();
  }

  start(): void {
    this.resize();
    this.running = true;
    this.clock = 0;
    this.spawnBurst();
    document.addEventListener('visibilitychange', this.onVisibility);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  /** For verification: what the system is doing right now. */
  stats(): ConfettiStats {
    return {
      spawned: this.spawned,
      alive: this.particles.length,
      peak: this.peak,
      elapsedMs: this.clock,
      done: !this.running,
    };
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    // Measured in the canvas's own CSS box; the device frame may be scaled.
    this.width = this.canvas.offsetWidth || rect.width;
    this.height = this.canvas.offsetHeight || rect.height;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private onVisibility = (): void => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
    } else if (this.running) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  };

  private spawn(vy: [number, number]): void {
    if (this.particles.length >= this.cfg.max) return;
    const shape = pick<Shape>(['rect', 'rect', 'ribbon', 'dot']);
    const [w, h] =
      shape === 'rect' ? [rand(this.cfg.rectW), rand(this.cfg.rectH)]
      : shape === 'ribbon' ? [rand(this.cfg.ribbonW), rand(this.cfg.ribbonH)]
      : (() => { const d = rand(this.cfg.dot); return [d, d]; })();
    this.particles.push({
      shape,
      color: pick(this.cfg.palette),
      w,
      h,
      x0: Math.random() * this.width,
      // Staggered just above the edge so the burst does not arrive as one line.
      y: -this.cfg.above - Math.random() * this.cfg.above * 4,
      vy: rand(vy),
      swayAmp: rand(this.cfg.swayAmp),
      swayFreq: rand(this.cfg.swayFreq),
      phase: Math.random() * TAU,
      angle: Math.random() * TAU,
      spin: rand(this.cfg.spin),
      flipFreq: rand(this.cfg.flipFreq),
      born: this.clock,
    });
    this.spawned += 1;
  }

  private spawnBurst(): void {
    for (let i = 0; i < this.cfg.burst; i++) this.spawn(this.cfg.burstVy);
  }

  private tick = (now: number): void => {
    // Clamp the step: a long frame (or a resumed tab) must not teleport pieces.
    const dt = Math.min((now - this.last) / 1000, 1 / 30);
    this.last = now;
    this.clock += dt * 1000;

    // Trickle: spread evenly over its window, so the count is exact.
    const due = Math.min(this.cfg.trickle, Math.floor((this.clock / this.cfg.trickleMs) * this.cfg.trickle));
    while (this.trickleSpawned < due) {
      this.spawn(this.cfg.trickleVy);
      this.trickleSpawned += 1;
    }

    const { gravity, drag, terminal } = this.cfg;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const next: Particle[] = [];
    for (const p of this.particles) {
      p.vy += (gravity - p.vy * drag) * dt;
      if (p.vy > terminal) p.vy = terminal;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
      const t = (this.clock - p.born) / 1000;
      const x = p.x0 + Math.sin(TAU * p.swayFreq * t + p.phase) * p.swayAmp;
      // Off the bottom: gone. Nothing piles up, nothing pops out mid-screen.
      if (p.y - p.w > this.height) continue;
      next.push(p);

      const flip = Math.cos(TAU * p.flipFreq * t + p.phase);
      ctx.save();
      ctx.translate(x, p.y);
      ctx.rotate(p.angle);
      // The 3D flutter: scaleY through zero reads as the piece turning edge-on, and
      // the face catches the light as it comes round.
      ctx.scale(1, p.shape === 'dot' ? 1 : flip);
      ctx.globalAlpha = 0.7 + 0.3 * Math.abs(flip);
      ctx.fillStyle = p.color;
      if (p.shape === 'dot') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    this.particles = next;
    this.peak = Math.max(this.peak, next.length);

    const finished = this.trickleSpawned >= this.cfg.trickle && next.length === 0;
    if (finished || this.clock > this.cfg.clearByMs * 2) {
      ctx.clearRect(0, 0, this.width, this.height);
      this.stop();
      this.onDone?.();
      return;
    }
    this.raf = requestAnimationFrame(this.tick);
  };
}
