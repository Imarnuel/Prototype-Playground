import { useEffect, useRef } from 'react';
import { colorResolver, tokenMs, tokenNumber, tokenString } from '../../tokens/read';
import { easingFn } from './ease';

/** `reference`: the video's sampled colours. `amber`: Emlaya's brand ramp (a comparison). */
export type GlowPalette = 'reference' | 'amber';

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
  vec2 uv = frag / u_res;
  float aspect = u_res.x / u_res.y;
  float t = u_time;

  float wob = (fbm(vec2(uv.x * 2.4 + t * 0.13, t * 0.21)) - 0.5) * 0.12;
  float top = (u_band + wob) * u_rise;
  top = mix(top, 1.35, u_bloom);
  float mask = 1.0 - smoothstep(top * 0.30, top, uv.y);

  vec2 q = vec2(uv.x * aspect, uv.y);
  float n = fbm(q * 1.7 + vec2(t * 0.11, -t * 0.07));
  // The bloom keeps magenta at the sides and gains it along the top, ringing the warm core.
  float side = smoothstep(0.30, 0.0, uv.x) + smoothstep(0.70, 1.0, uv.x) + smoothstep(0.62, 1.0, uv.y) * u_bloom;
  vec3 col = mix(u_mid, u_edge, clamp(side * 0.95 + (n - 0.5) * 0.9, 0.0, 1.0));

  // The bloom lifts the warm core to a little above centre (the reference's 5.85s frame)
  // and grows it only so far: the magenta ring must survive around it.
  float lift = mix(0.0, 0.58, u_bloom);
  float h = max(top, 0.001);
  vec2 rW = vec2(0.30 / aspect + 0.12 * u_bloom, mix(h * 0.55, 0.30, u_bloom));
  vec2 rC = vec2(0.20 / aspect + 0.07 * u_bloom, mix(h * 0.38, 0.17, u_bloom));
  float w1 = blob(uv, vec2(0.48 + 0.17 * sin(t * 0.37), lift * 0.85), rW);
  float w2 = blob(uv, vec2(0.52 - 0.20 * sin(t * 0.29 + 1.3), lift), rC);
  col = mix(col, u_warm, clamp(w1 * 1.15, 0.0, 1.0));
  col = mix(col, u_core, clamp(w2 * 1.05, 0.0, 1.0));

  float m = blob(uv, vec2(0.86 + 0.06 * sin(t * 0.41), 0.06 + lift * 0.4), vec2(0.16 / aspect, h * 0.42));
  col = mix(col, u_edge * 0.94, m * 0.55 * (1.0 - u_bloom * 0.5));

  col += (hash(frag + fract(t * 7.1) * 97.0) - 0.5) * 0.045;

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

  // Translucent at full bloom: the blurred content shows through it, as in the reference.
  float a = clamp(mask, 0.0, 1.0) * mix(0.96, 0.8, u_bloom);
  gl_FragColor = vec4(col * a, a);
}
`;

type Rgb = [number, number, number];
type Colours = { edge: Rgb; mid: Rgb; warm: Rgb; core: Rgb };

/** The palette's four tokens, resolved once per palette (never per frame). */
function readPalette(palette: GlowPalette): Colours {
  const r = colorResolver();
  const channels = (part: string): Rgb => {
    const [x, y, z] = (r.color(`--processing-glow-${palette}-${part}`).match(/[\d.]+/g) ?? []).map(Number);
    return [x / 255, y / 255, z / 255];
  };
  const out = { edge: channels('edge'), mid: channels('mid'), warm: channels('warm'), core: channels('core') };
  r.done();
  return out;
}

type Tween = { from: number; to: number; start: number; ms: number; ease: (t: number) => number };

type GlowShaderProps = {
  /** The band rises from the bottom edge while on, and sinks back when off. */
  on: boolean;
  /** The finish: the glow lifts over the whole screen. */
  bloom: boolean;
  palette: GlowPalette;
  reduced: boolean;
};

/**
 * The reference's "shader": a WebGL fragment shader in a canvas the size of the screen.
 * It stops drawing whenever it is fully down, so a resolved screen costs nothing. Under
 * reduced motion time is frozen: the glow is a still picture that fades, never a loop.
 * Rise and bloom travel on the same curves as everything CSS animates (the shared set).
 */
export function GlowShader({ on, bloom, palette, reduced }: GlowShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    rise: 0,
    bloom: 0,
    riseTween: null as Tween | null,
    bloomTween: null as Tween | null,
    colours: null as Colours | null,
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
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader');
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uni = {
      res: u('u_res'), time: u('u_time'), rise: u('u_rise'), bloom: u('u_bloom'), band: u('u_band'),
      dpr: u('u_dpr'), edge: u('u_edge'), mid: u('u_mid'), warm: u('u_warm'), core: u('u_core'),
    };
    const band = tokenNumber('--processing-glow-band');

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
      const c = s.colours;
      if (!c) return;

      gl.uniform2f(uni.res, canvas.width, canvas.height);
      // Reduced motion freezes time at a representative moment of the drift.
      gl.uniform1f(uni.time, reduced ? 4.2 : (now - t0) / 1000);
      gl.uniform1f(uni.rise, s.rise);
      gl.uniform1f(uni.bloom, s.bloom);
      gl.uniform1f(uni.band, band);
      gl.uniform1f(uni.dpr, dpr);
      gl.uniform3fv(uni.edge, c.edge);
      gl.uniform3fv(uni.mid, c.mid);
      gl.uniform3fv(uni.warm, c.warm);
      gl.uniform3fv(uni.core, c.core);
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
      if (idle || (reduced && settled)) {
        raf = 0;
        canvas.dataset.running = 'off';
        return;
      }
      canvas.dataset.running = 'on';
      raf = requestAnimationFrame(loop);
    };

    s.kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    s.kick();

    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      s.kick = null;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [reduced]);

  useEffect(() => {
    state.current.colours = readPalette(palette);
    canvasRef.current!.dataset.palette = palette;
    state.current.kick?.();
  }, [palette]);

  // Targets → tweens. Rising decelerates in (out curve); sinking accelerates away (in curve).
  useEffect(() => {
    const s = state.current;
    const now = performance.now();
    const ease = (name: string) => easingFn(tokenString(`--motion-ease-${name}`));
    const target = on || bloom ? 1 : 0;
    if (s.rise !== target || s.riseTween) {
      s.riseTween = {
        from: s.rise, to: target, start: now,
        ms: reduced ? 0 : tokenMs(target ? '--motion-duration-slow' : '--motion-duration-base'),
        ease: ease(target ? 'out' : 'in'),
      };
    }
    const bTarget = bloom ? 1 : 0;
    if (s.bloom !== bTarget || s.bloomTween) {
      s.bloomTween = {
        from: s.bloom, to: bTarget, start: now,
        // Off is instant: the bloom never sinks back. Its layer fades out over it (CSS).
        ms: reduced || !bTarget ? 0 : tokenMs('--motion-duration-slow'),
        ease: ease('inOut'),
      };
    }
    s.kick?.();
  }, [on, bloom, reduced]);

  return <canvas ref={canvasRef} className="processing__canvas" aria-hidden="true" />;
}
