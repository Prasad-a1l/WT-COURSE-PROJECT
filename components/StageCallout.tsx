import type { EtymologyStage } from "@/lib/types";
import { PinCard } from "@/components/PinCard";

type Props = {
  stage: EtymologyStage | undefined;
  step: number;
  total: number;
};

export function StageCallout({ stage, step, total }: Props) {
  if (!stage) return null;

  const pct = total > 0 ? Math.round((step / total) * 100) : 0;

  const visual = (
    <div className="pin-visual flex h-24 items-center justify-between gap-3 bg-gradient-to-r from-zinc-800 via-zinc-900 to-teal-950/80 px-5 sm:h-28 sm:px-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          Migration step
        </p>
        <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-white sm:text-4xl">
          {stage.word}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold uppercase tracking-wider text-teal-300/90">
          Progress
        </p>
        <p className="mt-0.5 font-mono text-xl font-semibold text-teal-400">{pct}%</p>
        <p className="text-[11px] text-zinc-500">
          {step} / {total}
        </p>
      </div>
    </div>
  );

  return (
    <PinCard visual={visual}>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-white/10"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${step} of ${total}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-black/25 px-4 py-3.5 ring-1 ring-white/10">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Year
          </dt>
          <dd className="mt-1.5 font-mono text-lg text-white">{stage.year || "—"}</dd>
        </div>
        <div className="rounded-2xl bg-black/25 px-4 py-3.5 ring-1 ring-white/10">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Language
          </dt>
          <dd className="mt-1.5 text-[15px] leading-snug text-zinc-100">
            {stage.language || "—"}
          </dd>
        </div>
        <div className="rounded-2xl bg-black/25 px-4 py-3.5 ring-1 ring-white/10 sm:col-span-2">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Region
          </dt>
          <dd className="mt-1.5 text-[15px] leading-relaxed text-zinc-100">
            {stage.region || "—"}
          </dd>
        </div>
      </dl>
    </PinCard>
  );
}
