"use client";

// Mã QR giả lập (deterministic từ seed) - chỉ để demo giao diện thanh toán
export default function FakeQR({ seed, size = 160 }: { seed: string; size?: number }) {
  const n = 21;
  // Sinh số giả ngẫu nhiên cố định từ seed
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = (i: number) => {
    const x = Math.sin(h + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  const cells = [];
  for (let i = 0; i < n * n; i++) {
    const r = Math.floor(i / n);
    const c = i % n;
    // Ô định vị ở 3 góc như QR thật
    const corner =
      (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    const on = corner
      ? (r < 1 || r > 5 || c < 1 || c > 5) && !(r === 0 || c === 0 || r === 6 || c === 6)
        ? rand(i) > 0.5
        : (r === 0 || r === 6 || c === 0 || c === 6) && r <= 6 && c <= 6
        ? true
        : false
      : rand(i) > 0.5;
    cells.push(on);
  }
  return (
    <div
      className="rounded-lg bg-white p-2 shadow-inner"
      style={{ width: size, height: size }}
    >
      <div
        className="grid h-full w-full"
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
      >
        {cells.map((on, i) => (
          <div key={i} style={{ background: on ? "#1f2937" : "transparent" }} />
        ))}
      </div>
    </div>
  );
}
