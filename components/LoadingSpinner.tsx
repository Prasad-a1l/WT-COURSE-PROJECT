import { PinCard } from "@/components/PinCard";

export function LoadingSpinner() {
  return (
    <PinCard
      className="mx-auto w-full max-w-md"
      visual={
        <div className="pin-visual flex h-24 items-center justify-center bg-gradient-to-br from-teal-900/40 to-slate-900/80">
          <span
            className="h-12 w-12 animate-spin rounded-full border-[3px] border-zinc-600 border-t-teal-400"
            aria-hidden
          />
        </div>
      }
    >
      <div className="text-center" role="status" aria-live="polite">
        <p className="text-base font-semibold text-white">Analyzing etymology</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Generating the narrative summary, chronological stages, and map coordinates.
          This usually takes a few seconds.
        </p>
      </div>
    </PinCard>
  );
}
