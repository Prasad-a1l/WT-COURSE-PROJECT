"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EtymologyBrief, EtymologyStage } from "@/lib/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MigrationMap } from "@/components/MigrationMap";
import { PinCard } from "@/components/PinCard";
import { SearchBar } from "@/components/SearchBar";
import { StageCallout } from "@/components/StageCallout";
import { WordBrief } from "@/components/WordBrief";

/** Pause after each step so D3 (~900ms) can finish before the next index. */
const STEP_MS = 1450;

const emptyBrief = (w: string): EtymologyBrief => ({
  headword: w,
  summary: "",
  didYouKnow: "",
});

export default function Home() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [stages, setStages] = useState<EtymologyStage[] | null>(null);
  const [brief, setBrief] = useState<EtymologyBrief | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replayNonce, setReplayNonce] = useState(0);
  const fetchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => fetchAbortRef.current?.abort();
  }, []);

  const fetchEtymology = useCallback(async () => {
    const word = query.trim();
    if (!word) return;
    fetchAbortRef.current?.abort();
    const ac = new AbortController();
    fetchAbortRef.current = ac;
    setLoading(true);
    setError(null);
    setStages(null);
    setBrief(null);
    setSubmittedQuery(word);
    setPlaying(false);
    try {
      const res = await fetch("/api/etymology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
        signal: ac.signal,
      });
      if (ac.signal.aborted) return;
      const data = await res.json().catch(() => ({}));
      if (ac.signal.aborted) return;
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Request failed.");
        return;
      }
      const list = data.stages as EtymologyStage[] | undefined;
      if (!Array.isArray(list) || list.length === 0) {
        setError("No etymology data returned.");
        return;
      }
      const b = data.brief as EtymologyBrief | undefined;
      setBrief(
        b && typeof b.headword === "string"
          ? {
              headword: b.headword,
              summary: typeof b.summary === "string" ? b.summary : "",
              didYouKnow: typeof b.didYouKnow === "string" ? b.didYouKnow : "",
            }
          : emptyBrief(word)
      );
      setStages(list);
      setHighlightIndex(0);
      setPlaying(true);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError("Network error — try again.");
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (!playing || !stages?.length) return;
    if (highlightIndex >= stages.length - 1) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => {
      setHighlightIndex((i) => i + 1);
    }, STEP_MS);
    return () => window.clearTimeout(t);
  }, [playing, highlightIndex, stages, replayNonce]);

  const maxIdx = stages && stages.length ? stages.length - 1 : 0;

  const replay = () => {
    if (!stages?.length) return;
    setHighlightIndex(0);
    setReplayNonce((n) => n + 1);
    setPlaying(true);
  };

  const mapSectionVisual = (
    <div className="pin-visual flex h-28 flex-col justify-end bg-gradient-to-br from-slate-600/30 via-slate-800/80 to-teal-950/60 px-5 pb-4 sm:h-32 sm:px-6 sm:pb-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-200">
        Geographic trace
      </p>
      <p className="mt-1 max-w-xl text-sm leading-snug text-zinc-300">
        Approximate locations from a fixed region index—not historical frontiers. Use
        the timeline to step through the reconstructed chain.
      </p>
    </div>
  );

  return (
    <div className="page-backdrop relative flex min-h-screen flex-col text-zinc-100">
      <div className="page-grid pointer-events-none absolute inset-0 z-0" aria-hidden />

      <header className="relative z-10 border-b border-white/[0.08]">
        <div className="shell flex flex-col items-center py-12 text-center sm:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-teal-300">
            <span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.7)]" />
            Word Migration Visualizer
          </p>
          <h1 className="mx-auto mt-8 max-w-3xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.5rem] md:leading-[1.18]">
            Explore word history through language and place
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-zinc-400">
            Reconstructed etymology from AI: a narrative overview, a chronological
            stage-by-stage breakdown, and an animated map. Treat outputs as
            educational approximations—verify with standard reference works.
          </p>
        </div>
      </header>

      <main className="relative z-10 flex-1 pb-20 pt-8">
        <div className="shell flex flex-col items-stretch gap-8">
          <div className="flex flex-col items-center gap-6">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={fetchEtymology}
              disabled={loading}
            />
            {loading && <LoadingSpinner />}
            {error && (
              <div
                className="pin-card w-full max-w-xl overflow-hidden border-red-500/35 bg-red-950/50 px-6 py-5 text-center text-base leading-relaxed text-red-100"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>

          {!stages?.length && !loading && !error && (
            <div className="mx-auto w-full max-w-xl">
              <PinCard
                visual={
                  <div className="pin-visual h-28 bg-gradient-to-br from-teal-600/25 via-zinc-800 to-indigo-900/40" />
                }
              >
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">Begin an inquiry</p>
                  <p className="mt-3 text-base leading-relaxed text-zinc-400">
                    Enter a word above. Examples with rich histories:{" "}
                    <span className="font-medium text-zinc-200">coffee</span>,{" "}
                    <span className="font-medium text-zinc-200">algebra</span>,{" "}
                    <span className="font-medium text-zinc-200">night</span>,{" "}
                    <span className="font-medium text-zinc-200">mother</span>.
                  </p>
                </div>
              </PinCard>
            </div>
          )}

          {stages && stages.length > 0 && brief && (
            <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
                <WordBrief brief={brief} queryLabel={submittedQuery} />
                <StageCallout
                  stage={stages[Math.min(highlightIndex, stages.length - 1)]}
                  step={Math.min(highlightIndex, stages.length - 1) + 1}
                  total={stages.length}
                />
                <button
                  type="button"
                  onClick={replay}
                  className="pin-card w-full py-4 text-center text-base font-bold text-white transition hover:border-teal-400/40"
                >
                  Replay timeline
                </button>
              </div>
              <div className="lg:col-span-7 xl:col-span-8">
                <PinCard visual={mapSectionVisual}>
                  <label className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                      Timeline
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={maxIdx}
                      value={Math.min(highlightIndex, maxIdx)}
                      onChange={(e) => {
                        setPlaying(false);
                        setHighlightIndex(Number(e.target.value));
                      }}
                      className="w-full"
                    />
                  </label>
                  <div className="-mx-5 mt-5 border-t border-white/10 sm:-mx-6">
                    <MigrationMap
                      stages={stages}
                      highlightIndex={highlightIndex}
                      embedded
                    />
                  </div>
                </PinCard>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/[0.08] py-10">
        <div className="shell text-center text-sm text-zinc-500">
          Word Migration Visualizer · Next.js · Tailwind · D3 · Gemini
        </div>
      </footer>
    </div>
  );
}
