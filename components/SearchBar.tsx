"use client";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function SearchBar({ value, onChange, onSubmit, disabled }: Props) {
  return (
    <form
      className="mx-auto flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-stretch"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="relative min-h-[3.5rem] min-w-0 flex-1">
        <span className="sr-only">Word to explore</span>
        <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Try coffee, algebra, night…"
          className="h-full min-h-[3.5rem] w-full rounded-2xl border border-white/[0.14] bg-[#1c1c1f] py-3.5 pl-14 pr-5 text-base text-white shadow-lg shadow-black/30 placeholder:text-zinc-500 outline-none transition focus:border-teal-400/50 focus:ring-2 focus:ring-teal-500/25 disabled:opacity-50"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="pin-card min-h-[3.5rem] shrink-0 rounded-2xl border border-teal-400/30 bg-gradient-to-b from-teal-500 to-teal-600 px-10 text-base font-bold text-white shadow-lg shadow-black/40 transition hover:from-teal-400 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        Trace
      </button>
    </form>
  );
}
