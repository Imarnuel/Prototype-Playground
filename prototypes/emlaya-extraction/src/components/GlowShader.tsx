import { useEffect, useRef } from 'react';
import { DURATION, EASING } from '@playground/shared';
import { easingFn } from '../lib/ease';

/**
 * Glow palettes. `reference` is sampled from the reference video's own pixels (3.0s
 * and 5.85s frames, 13×13px averages), not picked by eye. `amber` is the same shader
 * on the Emlaya library's brand variables — an adaptation offered for comparison, so
 * it is a switch rather than a replacement.
 */
export const GLOW_PALETTES = {
  reference: {
    edge: '#e07ae6', // magenta at the sides (#da71d7 right, #ef7ef4 bloom edge)
    mid: '#f597df', // pink between
    warm: '#f8b279', // orange low in the centre
    core: '#f9c96b', // yellow at the hottest point
  },
  amber: {
    // The library has three brand variables and no fourth; warm repeats one rather
    // than inventing a value in between.
    edge: '#feb007', // theme.colors.borderBrand
    mid: '#ffc412', // theme.colors.containerBrandBold
    warm: '#ffc412', // theme.colors.containerBrandBold
    core: '#fff9d1', // theme.colors.containerBrand
  },
} as const;

export type GlowPalette = keyof typeof GLOW_PALETTES;

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

/*
 * The glow is a band hugging the bottom edge whose soft top wobbles on noise. Inside it,
 * colour is a noise-warped blend: magenta at the sides, pink between, two warm blobs
 * (orange, yellow) drifting along the bottom, a magenta hot spot on the right — the
 * arrangement read off the reference frames. Film grain and white sparkles drifting
 * upward sit only where the glow is. `u_bloom` lifts the warm core towards the centre
 * and grows the band past the top edge, which is the reference's finish.
 */
const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_rise;
uniform float u_bloom;
uniform float u_band;
uniform float u_dpr;
uniform vec3 u_edge;
uniform vec3 u_mid;
uniform vec3 u_warm;
uniform vec3 u_core;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
float blob(vec2 uv, vec2 c, vec2 r) {
  vec2 d = (uv - c) / r;
  return exp(-dot(d, d));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / u_res;              // y up, 0 at the bottom edge
  float aspect = u_res.x / u_res.y;
  float t = u_time;

  // Soft top edge of the band, wobbling on noise; the bloom pushes it off the screen.
  float wob = (fbm(vec2(uv.x * 2.4 + t * 0.13, t * 0.21)) - 0.5) * 0.12;
  float top = (u_band + wob) * u_rise;
  top = mix(top, 1.35, u_bloom);
  float mask = 1.0 - smoothstep(top * 0.30, top, uv.y);

  // Base: pink in the middle, magenta towards both sides, warped by noise.
  vec2 q = vec2(uv.x * aspect, uv.y);
  float n = fbm(q * 1.7 + vec2(t * 0.11, -t * 0.07));
  float side = smoothstep(0.30, 0.0, uv.x) + smoothstep(0.70, 1.0, uv.x);
  vec3 col = mix(u_mid, u_edge, clamp(side * 0.95 + (n - 0.5) * 0.9, 0.0, 1.0));

  // Warm blobs drifting along the bottom; the bloom lifts them to the centre.
  float lift = mix(0.0, 0.46, u_bloom);
  float h = max(top, 0.001);
  vec2 rW = vec2(0.30 / aspect + 0.25 * u_bloom, h * 0.55 + 0.12 * u_bloom);
  vec2 rC = vec2(0.20 / aspect + 0.18 * u_bloom, h * 0.38 + 0.10 * u_bloom);
  float w1 = blob(uv, vec2(0.48 + 0.17 * sin(t * 0.37), lift * 0.85), rW);
  float w2 = blob(uv, vec2(0.52 - 0.20 * sin(t * 0.29 + 1.3), lift), rC);
  col = mix(col, u_warm, clamp(w1 * 1.15, 0.0, 1.0));
  col = mix(col, u_core, clamp(w2 * 1.05, 0.0, 1.0));

  // Magenta hot spot, low on the right, wandering a little.
  float m = blob(uv, vec2(0.86 + 0.06 * sin(t * 0.41), 0.06 + lift * 0.4), vec2(0.16 / aspect, h * 0.42));
  col = mix(col, u_edge * 0.94, m * 0.55 * (1.0 - u_bloom * 0.5));

  // Film grain, re-seeded every frame.
  col += (hash(frag + fract(t * 7.1) * 97.0) - 0.5) * 0.045;

  // Sparkles: one candidate per 16pt cell, drifting up and twinkling.
  float cellPt = 16.0;
  vec2 g = frag / u_dpr / cellPt;
  g.y -= t * 0.55;
  vec2 id = floor(g);
  vec2 f = fract(g);
  float r = hash(id);
  vec2 at = vec2(0.15 + 0.7 * hash(id + 3.1), 0.15 + 0.7 * hash(id + 7.7));
  float d = length((f - at) * cellPt);
  float size = mix(0.55, 1.25, hash(id + 11.3));
  float twinkle = 0.45 + 0.55 * sin(t * (2.0 + 2.5 * r) + r * 6.2831);
  float spark = step(0.58, r) * (1.0 - smoothstep(size * 0.35, size, d)) * twinkle;
  float sparkZone = smoothstep(0.35, 0.8, mask);
  col = mix(col, vec3(1.0), spark * sparkZone * 0.9);

  float a = clamp(mask, 0.0, 1.0) * 0.96;
  gl_FragColor = vec4(col * a, a);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

type Tween = { from: number; to: number; start: number; ms: number; ease: (t: number) => number };

const easeOut = easingFn(EASING.out);
const easeInOut = easingFn(EASING.inOut);
const easeIn = easingFn(EASING.in);

type GlowShaderProps = {
  /** Band rises from the bottom edge while on, sinks back when off. */
  on: boolean;
  /** The finish: the glow lifts over the whole screen. */
  bloom: boolean;
  palette: GlowPalette;
  /** Fraction of the screen's height the band reaches at rest. */
  band?: number;
  reducedMotion: boolean;
};

/**
 * The reference's "shader": a WebGL fragment shader rendered into a canvas the size of
 * the screen. It stops drawing whenever it is fully down, so a resolved screen costs
 * nothing. Under reduced motion it draws single still frames at each state change and
 * never runs a loop.
 */
export function GlowShader({ on, bloom, palette, band = 0.36, reducedMotion }: GlowShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    rise: 0,
    bloom: 0,
    riseTween: null as Tween | null,
    bloomTween: null as Tween | null,
    draw: null as null | (() => void),
    kick: null as null | (() => void),
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false });
    if (!gl) {
      canvas.dataset.webgl = 'unavailable';
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uni = {
      res: u('u_res'), time: u('u_time'), rise: u('u_rise'), bloom: u('u_bloom'), band: u('u_band'),
      dpr: u('u_dpr'), edge: u('u_edge'), mid: u('u_mid'), warm: u('u_warm'), core: u('u_core'),
    };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      // offsetWidth, not getBoundingClientRect: the device frame may be scaled.
      canvas.width = Math.round(canvas.offsetWidth * dpr);
      canvas.height = Math.round(canvas.offsetHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const t0 = performance.now();
    let raf = 0;
    const s = state.current;

    const step = (tw: Tween | null, now: number) => {
      if (!tw) return null;
      const p = tw.ms <= 0 ? 1 : Math.min(1, (now - tw.start) / tw.ms);
      return { value: tw.from + (tw.to - tw.from) * tw.ease(p), done: p >= 1 };
    };

    const draw = () => {
      const now = performance.now();
      const r = step(s.riseTween, now);
      if (r) { s.rise = r.value; if (r.done) s.riseTween = null; }
      const b = step(s.bloomTween, now);
      if (b) { s.bloom = b.value; if (b.done) s.bloomTween = null; }

      const pal = GLOW_PALETTES[(canvas.dataset.palette as GlowPalette) ?? 'reference'];
      gl.uniform2f(uni.res, canvas.width, canvas.height);
      // Reduced motion freezes time: the glow is a still picture of itself.
      gl.uniform1f(uni.time, reducedMotion ? 4.2 : (now - t0) / 1000);
      gl.uniform1f(uni.rise, s.rise);
      gl.uniform1f(uni.bloom, s.bloom);
      gl.uniform1f(uni.band, Number(canvas.dataset.band));
      gl.uniform1f(uni.dpr, dpr);
      gl.uniform3fv(uni.edge, hexToRgb(pal.edge));
      gl.uniform3fv(uni.mid, hexToRgb(pal.mid));
      gl.uniform3fv(uni.warm, hexToRgb(pal.warm));
      gl.uniform3fv(uni.core, hexToRgb(pal.core));
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      canvas.dataset.rise = s.rise.toFixed(3);
      canvas.dataset.bloomLevel = s.bloom.toFixed(3);
    };

    const loop = () => {
      draw();
      const idle = s.rise === 0 && s.bloom === 0 && !s.riseTween && !s.bloomTween;
      const settled = !s.riseTween && !s.bloomTween;
      if (idle || (reducedMotion && settled)) {
        raf = 0;
        canvas.dataset.running = 'off';
        return;
      }
      canvas.dataset.running = 'on';
      raf = requestAnimationFrame(loop);
    };

    s.draw = draw;
    s.kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    s.kick();

    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      s.draw = null;
      s.kick = null;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [reducedMotion]);

  // Targets → tweens on the shared curves. Rising decelerates in; sinking accelerates out.
  useEffect(() => {
    const s = state.current;
    const now = performance.now();
    const target = on || bloom ? 1 : 0;
    if (s.rise !== target || s.riseTween) {
      s.riseTween = {
        from: s.rise, to: target, start: now,
        ms: reducedMotion ? 0 : target ? DURATION.slow : DURATION.base,
        ease: target ? easeOut : easeIn,
      };
    }
    const bTarget = bloom ? 1 : 0;
    if (s.bloom !== bTarget || s.bloomTween) {
      s.bloomTween = {
        from: s.bloom, to: bTarget, start: now,
        // Off is instant: the bloom never sinks back — the layer fades out over it (CSS).
        ms: reducedMotion || !bTarget ? 0 : DURATION.slow,
        ease: easeInOut,
      };
    }
    s.kick?.();
  }, [on, bloom, reducedMotion]);

  useEffect(() => {
    const c = canvasRef.current!;
    c.dataset.palette = palette;
    c.dataset.band = String(band);
    state.current.kick?.();
  }, [palette, band]);

  return <canvas ref={canvasRef} className="glow" aria-hidden="true" data-palette={palette} data-band={band} />;
}
