import { NextResponse } from "next/server";
import { fetchEtymologyJsonFromGemini } from "@/lib/gemini";
import type { EtymologyBrief, EtymologyStageRaw } from "@/lib/types";
import { processEtymologyChain } from "@/lib/processEtymology";

export const runtime = "nodejs";

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  const body = fence ? fence[1].trim() : trimmed;
  try {
    return JSON.parse(body);
  } catch {
    const startObj = body.indexOf("{");
    const endObj = body.lastIndexOf("}");
    if (startObj >= 0 && endObj > startObj) {
      return JSON.parse(body.slice(startObj, endObj + 1));
    }
    const startArr = body.indexOf("[");
    const endArr = body.lastIndexOf("]");
    if (startArr >= 0 && endArr > startArr) {
      return JSON.parse(body.slice(startArr, endArr + 1));
    }
    throw new Error("Invalid JSON");
  }
}

function isStage(x: unknown): x is EtymologyStageRaw {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.word === "string" &&
    typeof o.language === "string" &&
    typeof o.year === "string" &&
    typeof o.region === "string"
  );
}

function normalizeBrief(
  o: Record<string, unknown> | null,
  fallbackWord: string
): EtymologyBrief {
  const headword =
    o && typeof o.headword === "string" && o.headword.trim()
      ? o.headword.trim()
      : fallbackWord;
  const summary =
    o && typeof o.summary === "string" ? o.summary.trim() : "";
  const didYouKnow =
    o && typeof o.didYouKnow === "string" ? o.didYouKnow.trim() : "";
  return { headword, summary, didYouKnow };
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY in environment." },
      { status: 500 }
    );
  }

  let body: { word?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const word = typeof body.word === "string" ? body.word.trim() : "";
  if (!word || word.length > 120) {
    return NextResponse.json(
      { error: "Provide a non-empty word (max 120 characters)." },
      { status: 400 }
    );
  }

  try {
    const text = await fetchEtymologyJsonFromGemini(word, key);

    let parsed: unknown;
    try {
      parsed = extractJson(text);
    } catch {
      return NextResponse.json(
        { error: "Model returned invalid JSON.", raw: text.slice(0, 2000) },
        { status: 422 }
      );
    }

    let stagesInput: unknown[] = [];
    let briefSource: Record<string, unknown> | null = null;

    if (Array.isArray(parsed)) {
      stagesInput = parsed;
    } else if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>;
      if (Array.isArray(o.stages)) {
        stagesInput = o.stages;
        briefSource = o;
      }
    }

    if (!stagesInput.length) {
      return NextResponse.json(
        { error: "Expected a non-empty stages array." },
        { status: 422 }
      );
    }

    const rawStages: EtymologyStageRaw[] = [];
    for (const item of stagesInput) {
      if (!isStage(item)) {
        return NextResponse.json(
          { error: "Each stage must have word, language, year, region as strings." },
          { status: 422 }
        );
      }
      rawStages.push(item);
    }

    const stages = processEtymologyChain(rawStages);
    const brief = normalizeBrief(briefSource, word);

    return NextResponse.json({
      stages,
      brief,
      model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash-lite",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: message || "Gemini request failed." },
      { status: 502 }
    );
  }
}
