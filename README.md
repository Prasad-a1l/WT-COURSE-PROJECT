# Word Migration Visualizer

Next.js app that asks Gemini for an etymology chain, maps regions to coordinates, and animates migration on a D3 world map (TopoJSON → GeoJSON).

## Setup

1. Copy environment file:

   ```bash
   copy .env.local.example .env.local
   ```

   Set `GEMINI_API_KEY` to your [Google AI Studio](https://aistudio.google.com/apikey) key.

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000).

If you see **429 / quota** errors, limits are **per model**. The app defaults to **`gemini-2.5-flash-lite`**. Set `GEMINI_MODEL` in `.env.local` (e.g. `gemini-2.5-flash`) per [models](https://ai.google.dev/gemini-api/docs/models/gemini) and [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits). Older IDs like `gemini-1.5-flash` may return **404**.

## Stack

- Next.js (App Router), Tailwind CSS, D3.js, `@google/generative-ai`, `world-atlas` + `topojson-client`.

## Structure

- `app/` — pages, `globals.css`, API route `app/api/etymology/route.ts`
- `components/` — search, map, loading
- `lib/` — types, region → lat/lon, processing
- `styles/` — `theme.css`
