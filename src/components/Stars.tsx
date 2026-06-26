"use client";

export function StarsDisplay({ value, size = "text-base" }: { value: number; size?: string }) {
  const full = Math.round(value);
  return (
    <span className={`text-amber-500 ${size}`} title={value.toFixed(1)}>
      {"★".repeat(full)}
      <span className="text-gray-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}

export function StarsInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1 text-3xl">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={n <= value ? "text-amber-500" : "text-gray-300"}
          aria-label={`${n} sao`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
