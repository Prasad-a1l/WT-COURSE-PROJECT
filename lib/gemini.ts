import { GoogleGenerativeAI } from "@google/generative-ai";

/** `gemini-1.5-flash` was removed from the API; use a current model (see ai.google.dev/gemini-api/docs/models). */
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

export async function fetchEtymologyJsonFromGemini(
  word: string,
  apiKey: string,
  model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL
): Promise<string> {
  const prompt = `You write like an experienced historical linguist explaining etymology to curious adults.

For the English word or lemma "${word}", return ONLY valid JSON (no markdown, no prose outside JSON) with this exact shape:
{
  "headword": "the conventional dictionary form in modern English",
  "summary": "Three to five sentences: what the word means in contemporary use; the broad arc of how it entered English (languages and pathways, not every guess); why the journey matters for vocabulary or culture. Use a precise, calm, authoritative tone. Mention that dates and routes are approximate when relevant.",
  "didYouKnow": "One short sentence with a vivid detail, cognate, or semantic shift—or an empty string if nothing crisp fits.",
  "stages": [
    { "word": "", "language": "", "year": "", "region": "" }
  ]
}

Rules for "stages":
- Chronological chain from oldest relevant ancestor toward the modern form (oldest first in the array before sorting; years may be approximate).
- "region" names a geographic or linguistic area (e.g. Sanskrit / South Asia, Latin / Italy, Old French / France).
- "year" may be like "1200", "c. 1400", "500 BCE".
- Each field must be a string.`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      temperature: 0.35,
      responseMimeType: "application/json",
    },
  });

  const result = await genModel.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error("Empty response from Gemini.");
  return text;
}
