export type EtymologyStageRaw = {
  word: string;
  language: string;
  year: string;
  region: string;
};

export type EtymologyStage = EtymologyStageRaw & {
  lon: number;
  lat: number;
  sortYear: number;
};

/** Scholarly framing returned with the chain (AI-generated; interpretive). */
export type EtymologyBrief = {
  headword: string;
  summary: string;
  didYouKnow: string;
};
