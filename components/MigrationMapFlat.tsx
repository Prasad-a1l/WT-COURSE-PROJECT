"use client";

import * as d3 from "d3";
import { feature } from "topojson-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EtymologyStage } from "@/lib/types";
import countries110m from "world-atlas/countries-110m.json";

const DURATION = 900;

type TooltipState = {
  x: number;
  y: number;
  word: string;
  language: string;
  year: string;
  region: string;
} | null;

type ProjectedStage = EtymologyStage & { x: number; y: number };

type Props = {
  stages: EtymologyStage[];
  highlightIndex: number;
  embedded?: boolean;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function MigrationMapFlat({ stages, highlightIndex, embedded }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 440 });
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const land = useMemo(() => {
    const topo = countries110m as unknown as import("topojson-specification").Topology;
    return feature(topo, topo.objects.countries) as unknown as GeoJSON.FeatureCollection;
  }, []);

  const projection = useMemo(() => {
    const { w, h } = dims;
    const m = 12;
    return d3
      .geoNaturalEarth1()
      .fitExtent(
        [
          [m, m],
          [w - m, h - m],
        ],
        land
      );
  }, [dims.w, dims.h, land]);

  const projected = useMemo<ProjectedStage[]>(() => {
    return stages.map((s) => {
      const xy = projection([s.lon, s.lat]);
      return { ...s, x: xy?.[0] ?? 0, y: xy?.[1] ?? 0 };
    });
  }, [stages, projection]);

  const hi = Math.max(0, Math.min(highlightIndex, Math.max(0, projected.length - 1)));
  const current = projected[hi];

  const resize = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const w = el.clientWidth || 800;
    const h = Math.min(520, Math.max(320, Math.round(w * 0.52)));
    setDims({ w, h });
  }, []);

  useEffect(() => {
    resize();
    const ro = new ResizeObserver(resize);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", resize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [resize]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.node() || projected.length === 0) return;

    const { w, h } = dims;
    const m = 12;
    svg.attr("width", w).attr("height", h).attr("viewBox", `0 0 ${w} ${h}`);

    const path = d3.geoPath(projection);

    let root = svg.select<SVGGElement>("g.root");
    if (root.empty()) {
      root = svg.append("g").attr("class", "root");
      root.append("rect").attr("class", "ocean");
      const viewport = root.append("g").attr("class", "viewport");
      viewport.append("g").attr("class", "countries");
      viewport.append("path").attr("class", "route-muted");
      viewport.append("path").attr("class", "route-active");
      viewport.append("g").attr("class", "nodes");
    }

    root
      .select("rect.ocean")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", w)
      .attr("height", h)
      .attr("fill", "#0a1628");

    const viewport = root.select<SVGGElement>("g.viewport");

    viewport
      .select("g.countries")
      .selectAll<SVGPathElement, GeoJSON.Feature>("path.land")
      .data(land.features)
      .join("path")
      .attr("class", "land")
      .attr("d", (d) => path(d) ?? "")
      .attr("fill", "#6b7280")
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 0.62)
      .attr("opacity", 0.96);

    const lineGen = d3
      .line<ProjectedStage>()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveMonotoneX);
    const visited = projected.slice(0, hi + 1);
    const pathD = visited.length >= 2 ? lineGen(visited) : null;

    viewport
      .select<SVGPathElement>("path.route-muted")
      .datum(pathD)
      .interrupt()
      .transition()
      .duration(DURATION)
      .ease(d3.easeCubicInOut)
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1.35)
      .attr("stroke-dasharray", "6 8")
      .attr("opacity", 0.55)
      .attr("d", (d) => d ?? "");

    viewport
      .select<SVGPathElement>("path.route-active")
      .datum(pathD)
      .interrupt()
      .attr("fill", "none")
      .attr("stroke", "#2dd4bf")
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("opacity", 0.98)
      .attr("stroke-dasharray", "none")
      .transition()
      .duration(DURATION)
      .ease(d3.easeCubicInOut)
      .attr("d", (d) => d ?? "");

    const nodes = viewport.select("g.nodes");
    const circles = nodes
      .selectAll<SVGCircleElement, ProjectedStage>("circle.node")
      .data(projected, (d, i) => `${i}-${d.word}-${d.language}-${d.region}`);

    circles
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("class", "node")
            .attr("r", 0)
            .attr("fill", "#64748b")
            .attr("stroke", "#0f172a")
            .attr("stroke-width", 2),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .each(function (d, i) {
        const activeNode = i <= hi;
        const isCurrent = i === hi;
        d3.select(this)
          .transition()
          .duration(DURATION)
          .ease(d3.easeCubicOut)
          .attr("opacity", activeNode ? 1 : 0.24)
          .attr("r", isCurrent ? 11 : i < hi ? 7 : 5.5)
          .attr("fill", isCurrent ? "#5eead4" : i < hi ? "#14b8a6" : "#64748b")
          .attr("stroke", isCurrent ? "#ffffff" : "#0f172a")
          .attr("stroke-width", isCurrent ? 3 : 2);
      })
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        const [px, py] = d3.pointer(event, wrapRef.current);
        setTooltip({
          x: px,
          y: py,
          word: d.word,
          language: d.language,
          year: d.year,
          region: d.region,
        });
      })
      .on("mousemove", function (event) {
        const [px, py] = d3.pointer(event, wrapRef.current);
        setTooltip((t) => (t ? { ...t, x: px, y: py } : null));
      })
      .on("mouseleave", () => setTooltip(null));

    nodes
      .selectAll<SVGCircleElement, ProjectedStage>("circle.current-halo")
      .data(current ? [current] : [])
      .join("circle")
      .attr("class", "current-halo")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("fill", "none")
      .attr("stroke", "#5eead4")
      .attr("stroke-width", 1.8)
      .attr("opacity", 0.14)
      .attr("r", 18);

    // Flat-map camera pan/zoom toward active stage.
    const s = current ? 1.55 : 1;
    const txCenter = current ? w / 2 - current.x * s : 0;
    const tyCenter = current ? h / 2 - current.y * s : 0;

    const xMin = m;
    const xMax = w - m;
    const yMin = m;
    const yMax = h - m;

    const minTx = (w - 20) - xMax * s;
    const maxTx = 20 - xMin * s;
    const minTy = (h - 20) - yMax * s;
    const maxTy = 20 - yMin * s;

    const tx = clamp(txCenter, minTx, maxTx);
    const ty = clamp(tyCenter, minTy, maxTy);

    viewport
      .interrupt()
      .transition()
      .duration(DURATION)
      .ease(d3.easeCubicInOut)
      .attr("transform", `translate(${tx},${ty}) scale(${s})`);
  }, [dims, land, projection, projected, hi, current]);

  const frame =
    embedded
      ? "relative w-full overflow-hidden rounded-none border-0 bg-[#0a1628] ring-0"
      : "relative w-full overflow-hidden rounded-2xl border border-white/[0.14] bg-[#0a1628] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/[0.1]";

  if (projected.length === 0) {
    return (
      <div className={`flex min-h-[280px] items-center justify-center text-zinc-500 ${frame}`}>
        No stages to display.
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={frame}>
      <svg ref={svgRef} className="block w-full select-none" />

      {current && (
        <div className="pointer-events-none absolute left-3 top-3 z-20 w-[min(320px,calc(100%-24px))]">
          <div className="lift-fade rounded-xl border border-teal-300/50 bg-zinc-950/95 px-4 py-3.5 shadow-2xl shadow-black/50 ring-2 ring-teal-500/20 backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
              Current stage
            </p>
            <p className="mt-1 text-lg font-bold leading-tight text-white">{current.word}</p>
            <p className="mt-1.5 font-mono text-sm text-zinc-200">{current.year}</p>
            <p className="mt-1 line-clamp-3 text-sm leading-snug text-zinc-200">{current.region}</p>
            <p className="mt-1.5 text-sm font-medium text-teal-200/90">{current.language}</p>
          </div>
        </div>
      )}

      {tooltip && (
        <div
          className="pointer-events-none absolute z-30 max-w-xs rounded-xl border border-white/20 bg-zinc-900/98 px-3.5 py-3 text-sm text-zinc-100 shadow-2xl backdrop-blur"
          style={{
            left: Math.min(dims.w - 220, Math.max(8, tooltip.x + 12)),
            top: Math.min(dims.h - 110, Math.max(8, tooltip.y - 8)),
          }}
        >
          <div className="text-base font-bold text-teal-300">{tooltip.word}</div>
          <div className="mt-1 font-mono text-sm text-zinc-200">{tooltip.year}</div>
          <div className="mt-1 text-sm text-zinc-200">{tooltip.region}</div>
          <div className="mt-1 text-sm font-medium text-teal-200/80">{tooltip.language}</div>
        </div>
      )}
    </div>
  );
}
