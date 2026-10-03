/**
 * The one mock API module, per CLAUDE.md section 4. Every fake network call in
 * every prototype goes through `request`, so latency, failure injection and the
 * dev-toolbar overrides all have a single place to live.
 *
 * Prototypes define their own endpoints on top of this; they do not call
 * setTimeout themselves.
 */

export type RequestState<T> =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; data: T };

type Controls = {
  /** Multiplies every latency. 0 resolves on the next microtask — the demo "skip waiting" lever. */
  latencyScale: number;
  /** When set, the next request rejects regardless of its own failure rate. */
  forceNextFailure: boolean;
  /** Baseline latency window, ms. */
  latencyRange: [number, number];
};

const controls: Controls = {
  latencyScale: 1,
  forceNextFailure: false,
  latencyRange: [280, 620],
};

/** Read-only view for the dev toolbar. */
export function getControls(): Readonly<Controls> {
  return controls;
}

export function setLatencyScale(scale: number): void {
  controls.latencyScale = Math.max(0, scale);
}

export function setLatencyRange(min: number, max: number): void {
  controls.latencyRange = [min, max];
}

/** CLAUDE.md:60 — anything that normally requires waiting needs a way to force it. */
export function failNextRequest(): void {
  controls.forceNextFailure = true;
}

function nextLatency(): number {
  const [min, max] = controls.latencyRange;
  return (min + Math.random() * (max - min)) * controls.latencyScale;
}

export class MockApiError extends Error {
  constructor(
    message: string,
    readonly endpoint: string,
  ) {
    super(message);
    this.name = 'MockApiError';
  }
}

export type RequestOptions = {
  /** Probability 0..1 that this endpoint fails on its own. Defaults to never. */
  failureRate?: number;
  /** Overrides the global latency window for a deliberately slow endpoint. */
  latency?: number;
};

/**
 * Resolves `produce()` after simulated latency, or rejects.
 *
 * `produce` is a thunk rather than a value so that a rejected request never
 * evaluates its payload — a request that fails should not also have done the
 * work, or state writes leak through failures.
 */
export async function request<T>(
  endpoint: string,
  produce: () => T,
  options: RequestOptions = {},
): Promise<T> {
  const latency = (options.latency ?? nextLatency()) * (options.latency ? controls.latencyScale : 1);
  await new Promise((resolve) => setTimeout(resolve, latency));

  const forced = controls.forceNextFailure;
  if (forced) controls.forceNextFailure = false;

  if (forced || Math.random() < (options.failureRate ?? 0)) {
    throw new MockApiError(`${endpoint} failed`, endpoint);
  }

  return produce();
}
