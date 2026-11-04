/**
 * A simulated live camera: a printed receipt on a counter, seen through a hand-held
 * phone. Not in Figma (the frames hold a still stock photo); built at the user's request
 * so the capture moment reads as real. CORRECTIONS.md, "Capture".
 *
 * The world (counter + paper + its shadow) is painted ONCE into an offscreen canvas.
 * Each frame only re-draws that image through the camera's transform — drift, a small
 * roll, a breathing zoom — then grain, vignette and the detected-document outline. So
 * the per-frame cost is one image blit and a few strokes.
 *
 * Every colour, size and motion constant is a token (tokens.gaps.css, "Live capture").
 */
import { colorResolver, tokenMs, tokenNumber, tokenString } from '../../tokens/read';
import type { PrintLine } from '../../data/receiptDocument';

type Config = ReturnType<typeof readConfig>;

function readConfig() {
  const { color: tokenColor, done } = colorResolver();
  const cfg = {
    surface: tokenColor('--capture-surface'),
    surfaceDeep: tokenColor('--capture-surface-deep'),
    grainDark: tokenColor('--capture-grain-dark'),
    grainLight: tokenColor('--capture-grain-light'),
    keyLight: tokenColor('--capture-key-light'),
    vignette: tokenColor('--capture-vignette'),
    noise: tokenColor('--capture-noise'),
    paper: tokenColor('--capture-paper'),
    paperShade: tokenColor('--capture-paper-shade'),
    paperShadow: tokenColor('--capture-paper-shadow'),
    ink: tokenColor('--capture-ink'),
    inkFaint: tokenColor('--capture-ink-faint'),
    quad: tokenColor('--capture-quad'),
    quadFill: tokenColor('--capture-quad-fill'),
    font: tokenString('--capture-font'),
    paperWidth: tokenNumber('--capture-paper-width'),
    pad: tokenNumber('--capture-paper-pad'),
    line: tokenNumber('--capture-paper-line'),
    text: tokenNumber('--capture-paper-text'),
    title: tokenNumber('--capture-paper-title'),
    tooth: tokenNumber('--capture-paper-tooth'),
    angle: (tokenNumber('--capture-paper-angle') * Math.PI) / 180,
    centreY: tokenNumber('--capture-paper-centre-y'),
    shadowBlur: tokenNumber('--capture-paper-shadow-blur'),
    shadowY: tokenNumber('--capture-paper-shadow-y'),
    overscan: tokenNumber('--capture-world-overscan'),
    grainSpacing: tokenNumber('--capture-grain-spacing'),
    quadStroke: tokenNumber('--capture-quad-stroke'),
    quadCorner: tokenNumber('--capture-quad-corner'),
    quadCornerStroke: tokenNumber('--capture-quad-corner-stroke'),
    driftX: tokenNumber('--capture-drift-x'),
    driftY: tokenNumber('--capture-drift-y'),
    driftAngle: (tokenNumber('--capture-drift-angle') * Math.PI) / 180,
    driftZoom: tokenNumber('--capture-drift-zoom'),
    driftHz: tokenNumber('--capture-drift-hz'),
    focusMs: tokenMs('--capture-focus-duration'),
    focusBlur: tokenNumber('--capture-focus-blur'),
    exposureFrom: tokenNumber('--capture-exposure-from'),
    detectDelay: tokenMs('--capture-detect-delay'),
    detectFade: tokenMs('--capture-detect-fade'),
    follow: tokenNumber('--capture-track-follow'),
    grainAlpha: tokenNumber('--capture-grain-alpha'),
    jpeg: tokenNumber('--capture-jpeg-quality'),
  };
  done();
  return cfg;
}

type Pt = { x: number; y: number };
const TAU = Math.PI * 2;

/** A deterministic PRNG, so the counter's grain and the barcode are the same every load. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Paints the receipt, flat — the scanned document, and the paper in the scene. */
export function paintPaper(lines: PrintLine[], cfg: Config, scale: number): HTMLCanvasElement {
  const { paperWidth: w, pad, line, text, title, tooth } = cfg;
  const heightOf = (l: PrintLine) => (l.kind === 'title' ? title * 1.5 : l.kind === 'gap' ? line * 0.5 : l.kind === 'barcode' ? line * 2.6 : line);
  const h = pad * 2 + lines.reduce((a, l) => a + heightOf(l), 0) + tooth;
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  const g = c.getContext('2d')!;
  g.scale(scale, scale);
  const rand = seeded(816);

  // Paper, with a torn zigzag along the bottom where it left the printer.
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(w, 0);
  g.lineTo(w, h - tooth);
  for (let x = w; x > 0; x -= tooth * 2) {
    g.lineTo(x - tooth, h);
    g.lineTo(Math.max(0, x - tooth * 2), h - tooth);
  }
  g.closePath();
  g.fillStyle = cfg.paper;
  g.fill();
  g.save();
  g.clip();
  // The curl: thermal paper bows, so its edges fall into shade.
  const curl = g.createLinearGradient(0, 0, w, 0);
  curl.addColorStop(0, cfg.paperShade);
  curl.addColorStop(0.18, 'transparent');
  curl.addColorStop(0.82, 'transparent');
  curl.addColorStop(1, cfg.paperShade);
  g.fillStyle = curl;
  g.fillRect(0, 0, w, h);

  let y = pad;
  const left = pad;
  const right = w - pad;
  const font = (size: number, weight: number) => `${weight} ${size}px ${cfg.font}`;
  g.textBaseline = 'middle';
  for (const l of lines) {
    const mid = y + heightOf(l) / 2;
    // Thermal print is never perfectly even.
    g.globalAlpha = 0.82 + rand() * 0.18;
    g.fillStyle = cfg.ink;
    if (l.kind === 'title') {
      g.font = font(title, 700);
      g.textAlign = 'center';
      g.fillText(l.text, w / 2, mid, right - left);
    } else if (l.kind === 'text') {
      g.font = font(text, 500);
      g.fillStyle = l.faint ? cfg.inkFaint : cfg.ink;
      g.textAlign = l.centre ? 'center' : 'left';
      g.fillText(l.text, l.centre ? w / 2 : left, mid);
    } else if (l.kind === 'pair') {
      g.font = font(l.bold ? text * 1.15 : text, l.bold ? 700 : 500);
      g.textAlign = 'left';
      g.fillText(l.left, left + (l.indent ? text : 0), mid);
      g.textAlign = 'right';
      g.fillText(l.right, right, mid);
    } else if (l.kind === 'rule') {
      g.font = font(text, 500);
      g.textAlign = 'left';
      g.fillStyle = cfg.inkFaint;
      const dashes = '-'.repeat(Math.floor((right - left) / (text * 0.6)));
      g.fillText(dashes, left, mid, right - left);
    } else if (l.kind === 'barcode') {
      const r = seeded([...l.seed].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
      const bh = heightOf(l) * 0.8;
      let x = left + text * 2;
      while (x < right - text * 2) {
        const bw = 0.8 + Math.floor(r() * 3) * 0.8;
        if (r() > 0.4) g.fillRect(x, mid - bh / 2, bw, bh);
        x += bw + 0.8;
      }
    }
    y += heightOf(l);
  }
  g.globalAlpha = 1;
  // Fibre speckle.
  g.fillStyle = cfg.paperShade;
  for (let i = 0; i < 220; i++) g.fillRect(rand() * w, rand() * h, 0.6, 0.6);
  g.restore();
  return c;
}

function flatten(paper: HTMLCanvasElement, cfg: Config): { src: string; bytes: number } {
  const flat = document.createElement('canvas');
  flat.width = paper.width;
  flat.height = paper.height;
  const g = flat.getContext('2d')!;
  g.fillStyle = cfg.paper;
  g.fillRect(0, 0, flat.width, flat.height);
  g.drawImage(paper, 0, 0);
  const src = flat.toDataURL('image/jpeg', cfg.jpeg);
  return { src, bytes: Math.round(((src.length - src.indexOf(',') - 1) * 3) / 4) };
}

/** The scanned document without a camera — for a dev-toolbar jump straight to Review. */
export function scanDocument(lines: PrintLine[]): { src: string; bytes: number } {
  const cfg = readConfig();
  return flatten(paintPaper(lines, cfg, Math.max(2, window.devicePixelRatio || 1)), cfg);
}

export class CaptureScene {
  private ctx: CanvasRenderingContext2D;
  private cfg: Config;
  private paper: HTMLCanvasElement;
  private world: HTMLCanvasElement | null = null;
  private vignette: HTMLCanvasElement | null = null;
  private noise: HTMLCanvasElement;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private raf = 0;
  private clock = 0;
  private last = 0;
  private openedAt = 0;
  private running = false;
  private live = true;
  private still: boolean;
  /** The paper's corners in world coordinates (world origin = view centre). */
  private corners: Pt[] = [];
  private shownQuad: Pt[] | null = null;

  constructor(private canvas: HTMLCanvasElement, lines: PrintLine[], still: boolean) {
    this.ctx = canvas.getContext('2d')!;
    this.cfg = readConfig();
    this.still = still;
    this.paper = paintPaper(lines, this.cfg, Math.max(2, window.devicePixelRatio || 1));
    this.noise = this.paintNoise();
  }

  /** Lays out for the canvas's current CSS box. Call on mount and on resize. */
  resize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.w = w;
    this.h = h;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.world = this.paintWorld();
    this.vignette = this.paintVignette();
    this.shownQuad = null;
    this.draw();
  }

  start(): void {
    this.running = true;
    this.live = true;
    this.openedAt = this.clock;
    this.shownQuad = null;
    document.addEventListener('visibilitychange', this.onVisibility);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  /** The shutter: the frame freezes as it is, sharp and without the outline. */
  freeze(): void {
    this.live = false;
    this.stop();
    this.draw();
  }

  /** Retake: back to live, refocusing as the camera would. */
  resume(): void {
    this.start();
  }

  /** The scanned document: the paper, flattened and cropped, as a scanner app saves it. */
  documentImage(): { src: string; bytes: number } {
    return flatten(this.paper, this.cfg);
  }

  private onVisibility = (): void => {
    if (document.hidden) cancelAnimationFrame(this.raf);
    else if (this.running) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  };

  private tick = (now: number): void => {
    this.clock += Math.min(now - this.last, 50);
    this.last = now;
    this.draw();
    if (this.running) this.raf = requestAnimationFrame(this.tick);
  };

  /** The camera's pose at the current clock: where the hand has drifted to. */
  private pose(): { x: number; y: number; a: number; s: number } {
    if (this.still) return { x: 0, y: 0, a: 0, s: 1 };
    const t = this.clock / 1000;
    const f = this.cfg.driftHz;
    // Two incommensurate sines per axis read as a hand, not a pendulum.
    const wave = (k: number, p: number) => Math.sin(TAU * f * k * t + p);
    return {
      x: this.cfg.driftX * (wave(1, 0) * 0.7 + wave(2.3, 1.1) * 0.3),
      y: this.cfg.driftY * (wave(0.8, 2) * 0.7 + wave(1.9, 0.4) * 0.3),
      a: this.cfg.driftAngle * wave(0.6, 2.6),
      s: 1 + this.cfg.driftZoom * wave(0.45, 0.9),
    };
  }

  private draw(): void {
    if (!this.world || !this.vignette) return;
    const { ctx, w, h, dpr, cfg } = this;
    const since = this.clock - this.openedAt;
    const pose = this.pose();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Autofocus hunts (blur falls, overshoots a touch, settles); exposure settles with it.
    let filter = 'none';
    if (this.live && !this.still && since < cfg.focusMs) {
      const p = since / cfg.focusMs;
      const blur = cfg.focusBlur * (Math.pow(1 - p, 2) + 0.35 * Math.sin(Math.PI * Math.min(1, Math.max(0, (p - 0.45) / 0.4))));
      const bright = 1 + (cfg.exposureFrom - 1) * Math.pow(1 - p, 1.5);
      filter = `blur(${blur.toFixed(2)}px) brightness(${bright.toFixed(3)})`;
    }
    ctx.filter = filter;
    ctx.save();
    ctx.translate(w / 2 + pose.x, h / 2 + pose.y);
    ctx.rotate(pose.a);
    ctx.scale(pose.s, pose.s);
    ctx.drawImage(this.world, -this.world.width / dpr / 2, -this.world.height / dpr / 2, this.world.width / dpr, this.world.height / dpr);
    ctx.restore();
    ctx.filter = 'none';

    // Sensor grain: one tile, shifted every frame.
    if (this.live && !this.still) {
      ctx.save();
      ctx.globalAlpha = cfg.grainAlpha;
      const pattern = ctx.createPattern(this.noise, 'repeat')!;
      const r = seeded(Math.floor(this.clock / 16));
      ctx.translate(-r() * this.noise.width, -r() * this.noise.height);
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, w + this.noise.width, h + this.noise.height);
      ctx.restore();
    }
    ctx.drawImage(this.vignette, 0, 0, w, h);

    if (this.live) this.drawQuad(pose, since);
  }

  /** The detected-document outline: finds the paper, then follows it with a slight lag. */
  private drawQuad(pose: { x: number; y: number; a: number; s: number }, since: number): void {
    const { cfg, ctx } = this;
    if (since < cfg.detectDelay) return;
    const cos = Math.cos(pose.a);
    const sin = Math.sin(pose.a);
    const target = this.corners.map(({ x, y }) => ({
      x: this.w / 2 + pose.x + (x * cos - y * sin) * pose.s,
      y: this.h / 2 + pose.y + (x * sin + y * cos) * pose.s,
    }));
    if (!this.shownQuad || this.still) {
      this.shownQuad = target.map((p) => ({ ...p }));
    } else {
      this.shownQuad = this.shownQuad.map((p, i) => ({
        x: p.x + (target[i].x - p.x) * cfg.follow,
        y: p.y + (target[i].y - p.y) * cfg.follow,
      }));
    }
    const q = this.shownQuad;
    const alpha = Math.min(1, (since - cfg.detectDelay) / cfg.detectFade);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    q.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = cfg.quadFill;
    ctx.fill();
    ctx.lineWidth = cfg.quadStroke;
    ctx.strokeStyle = cfg.quad;
    ctx.lineJoin = 'round';
    ctx.stroke();
    // Corner brackets, heavier, along each edge from the corner.
    ctx.lineWidth = cfg.quadCornerStroke;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const p = q[i];
      for (const n of [q[(i + 1) % 4], q[(i + 3) % 4]]) {
        const dx = n.x - p.x;
        const dy = n.y - p.y;
        const len = Math.hypot(dx, dy) || 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + (dx / len) * cfg.quadCorner, p.y + (dy / len) * cfg.quadCorner);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** The counter with the receipt on it, larger than the view so drift never shows an edge. */
  private paintWorld(): HTMLCanvasElement {
    const { cfg, dpr } = this;
    const ww = Math.ceil(this.w * cfg.overscan);
    const wh = Math.ceil(this.h * cfg.overscan);
    const c = document.createElement('canvas');
    c.width = Math.round(ww * dpr);
    c.height = Math.round(wh * dpr);
    const g = c.getContext('2d')!;
    g.scale(dpr, dpr);
    const rand = seeded(2026);

    // Oiled wood: a warm base, darker toward the far edge, with long wavy grain.
    const base = g.createLinearGradient(0, 0, 0, wh);
    base.addColorStop(0, cfg.surfaceDeep);
    base.addColorStop(0.55, cfg.surface);
    base.addColorStop(1, cfg.surfaceDeep);
    g.fillStyle = base;
    g.fillRect(0, 0, ww, wh);
    for (let y = -cfg.grainSpacing; y < wh + cfg.grainSpacing; y += cfg.grainSpacing * (0.5 + rand())) {
      const amp = 2 + rand() * 6;
      const freq = 0.004 + rand() * 0.01;
      const phase = rand() * TAU;
      g.beginPath();
      for (let x = 0; x <= ww; x += 8) {
        const yy = y + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1 + phase) * amp * 0.25;
        if (x === 0) g.moveTo(x, yy);
        else g.lineTo(x, yy);
      }
      g.strokeStyle = rand() > 0.3 ? cfg.grainDark : cfg.grainLight;
      g.lineWidth = 0.6 + rand() * 1.8;
      g.stroke();
    }
    // The key light falls from the top left.
    const light = g.createRadialGradient(ww * 0.28, wh * 0.18, 0, ww * 0.28, wh * 0.18, ww * 0.9);
    light.addColorStop(0, cfg.keyLight);
    light.addColorStop(1, 'transparent');
    g.fillStyle = light;
    g.fillRect(0, 0, ww, wh);

    // The receipt, rotated on the counter, with its contact shadow.
    const pw = cfg.paperWidth;
    const ph = (this.paper.height / this.paper.width) * pw;
    const cx = ww / 2;
    const cy = wh / 2 + (cfg.centreY - 0.5) * this.h;
    g.save();
    g.translate(cx, cy);
    g.rotate(cfg.angle);
    g.shadowColor = cfg.paperShadow;
    g.shadowBlur = cfg.shadowBlur;
    g.shadowOffsetY = cfg.shadowY;
    g.drawImage(this.paper, -pw / 2, -ph / 2, pw, ph);
    g.restore();

    // Corners relative to the view centre (= world centre), for the outline.
    const cos = Math.cos(cfg.angle);
    const sin = Math.sin(cfg.angle);
    const oy = (cfg.centreY - 0.5) * this.h;
    this.corners = [
      [-pw / 2, -ph / 2],
      [pw / 2, -ph / 2],
      [pw / 2, ph / 2],
      [-pw / 2, ph / 2],
    ].map(([x, y]) => ({ x: x * cos - y * sin, y: oy + x * sin + y * cos }));
    return c;
  }

  private paintVignette(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = Math.round(this.w * this.dpr);
    c.height = Math.round(this.h * this.dpr);
    const g = c.getContext('2d')!;
    const r = Math.hypot(c.width, c.height) / 2;
    const v = g.createRadialGradient(c.width / 2, c.height / 2, r * 0.45, c.width / 2, c.height / 2, r);
    v.addColorStop(0, 'transparent');
    v.addColorStop(1, this.cfg.vignette);
    g.fillStyle = v;
    g.fillRect(0, 0, c.width, c.height);
    return c;
  }

  private paintNoise(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 96;
    const g = c.getContext('2d')!;
    const rand = seeded(7);
    g.fillStyle = this.cfg.noise;
    for (let i = 0; i < 1400; i++) g.fillRect(rand() * c.width, rand() * c.height, 1, 1);
    return c;
  }
}
