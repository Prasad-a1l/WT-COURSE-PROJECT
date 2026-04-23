import type { EtymologyBrief } from "@/lib/types";
import { PinCard } from "@/components/PinCard";

type Props = {
  brief: EtymologyBrief;
  queryLabel: string;
};

export function WordBrief({ brief, queryLabel }: Props) {
  const visual = (
    <div className="pin-visual relative h-32 overflow-hidden bg-gradient-to-br from-teal-500/35 via-indigo-500/20 to-fuchsia-500/25 sm:h-36">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23fff' fill-opacity='.08' d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute bottom-4 left-5 right-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
          Lexical portrait
        </p>
        <h2 className="mt-1 font-mono text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {brief.headword}
        </h2>
      </div>
    </div>
  );

  return (
    <PinCard visual={visual}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
          Search: <span className="ml-1.5 font-mono normal-case text-white">{queryLabel}</span>
        </span>
      </div>

      {brief.summary ? (
        <div className="prose-brief mt-5 space-y-4 text-base leading-[1.65] text-zinc-200">
          {brief.summary.split(/\n+/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-base leading-relaxed text-zinc-400">
          No narrative summary was returned; use the timeline and map for the chain.
        </p>
      )}

      {brief.didYouKnow ? (
        <aside className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-950/40 px-4 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
            Did you know
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-amber-50/95">
            {brief.didYouKnow}
          </p>
        </aside>
      ) : null}

      <p className="mt-6 border-t border-white/10 pt-5 text-[12px] leading-relaxed text-zinc-400">
        <span className="font-semibold text-zinc-300">Method note.</span> Model-generated
        chain; dates and map pins are illustrative. For scholarship, use historical
        dictionaries and primary sources.
      </p>
    </PinCard>
  );
}
