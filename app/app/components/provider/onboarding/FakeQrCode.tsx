import { cn } from "@/lib/utils";

/**
 * A decorative QR code for the prototype MFA flow. The module builds the matrix
 * once from a fixed seed, so it renders identically on the server and client and
 * carries no render-time work. It does not encode anything scannable.
 */
const N = 29;

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CELLS: { x: number; y: number }[] = (() => {
  const rng = mulberry32(0x50524d44); // "PRMD"
  const near = (x: number, y: number, cx: number, cy: number) =>
    x >= cx && x < cx + 7 && y >= cy && y < cy + 7;
  const inFinder = (x: number, y: number) =>
    near(x, y, 0, 0) || near(x, y, N - 7, 0) || near(x, y, 0, N - 7);
  const inCenter = (x: number, y: number) => {
    const c = N / 2;
    return Math.abs(x - c) < 5 && Math.abs(y - c) < 5;
  };
  const out: { x: number; y: number }[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (inFinder(x, y) || inCenter(x, y)) continue;
      if (rng() > 0.52) out.push({ x, y });
    }
  }
  return out;
})();

const FINDERS = [
  { x: 0, y: 0 },
  { x: N - 7, y: 0 },
  { x: 0, y: N - 7 },
];

export function FakeQrCode({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`-1 -1 ${N + 2} ${N + 2}`}
      className={cn("text-navy-900", className)}
      role="img"
      aria-label="QR code"
    >
      <rect x={-1} y={-1} width={N + 2} height={N + 2} fill="#fff" />
      {CELLS.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={1} height={1} fill="currentColor" />
      ))}
      {FINDERS.map((f, i) => (
        <g key={i}>
          <rect x={f.x} y={f.y} width={7} height={7} rx={1.4} fill="currentColor" />
          <rect x={f.x + 1} y={f.y + 1} width={5} height={5} rx={1} fill="#fff" />
          <rect x={f.x + 2} y={f.y + 2} width={3} height={3} rx={0.6} fill="currentColor" />
        </g>
      ))}
      <rect x={N / 2 - 4.5} y={N / 2 - 4.5} width={9} height={9} rx={2} fill="#fff" />
      <g
        transform={`translate(${N / 2 - 3.6} ${N / 2 - 2.6}) scale(0.16)`}
        fill="none"
        strokeWidth={4.6}
        strokeLinecap="round"
      >
        <path d="M22.2 12.2 A9 9 0 1 0 22.2 19.8" stroke="#03d3bf" />
        <path d="M21.8 12.2 A9 9 0 1 1 21.8 19.8" stroke="#002b61" />
      </g>
    </svg>
  );
}
