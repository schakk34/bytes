export type RankingInput = {
  headcount: number;
  maxCommuteMinutes: number;
  eventStyle: "seated" | "reception" | "either";
};

export type RankingCandidate = {
  seatedCapacity: number | null;
  receptionCapacity: number | null;
  commuteMinutes: number;
  capacityTrust: "verified" | "likely" | "unverified";
  priceTrust: "verified" | "likely" | "unverified";
  dietaryCount: number;
  hasDirectContact: boolean;
};

const trustScore = { verified: 1, likely: 0.65, unverified: 0.25 } as const;

export function rankCandidate(candidate: RankingCandidate, input: RankingInput) {
  const capacity = input.eventStyle === "reception"
    ? candidate.receptionCapacity
    : input.eventStyle === "seated"
      ? candidate.seatedCapacity
      : Math.max(candidate.seatedCapacity ?? 0, candidate.receptionCapacity ?? 0);

  if (!capacity || capacity < input.headcount || candidate.commuteMinutes > input.maxCommuteMinutes) {
    return { score: 0, eligible: false, reasons: ["Does not meet a hard capacity or commute constraint"] };
  }

  const capacityFit = Math.max(0.55, 1 - (capacity - input.headcount) / Math.max(capacity, input.headcount * 3));
  const commuteFit = 1 - candidate.commuteMinutes / Math.max(input.maxCommuteMinutes * 1.5, 1);
  const evidence = trustScore[candidate.capacityTrust];
  const pricing = trustScore[candidate.priceTrust];
  const dietary = Math.min(candidate.dietaryCount / 4, 1);
  const contact = candidate.hasDirectContact ? 1 : 0;

  const score = Math.round(100 * (
    capacityFit * 0.32 +
    commuteFit * 0.28 +
    evidence * 0.18 +
    pricing * 0.1 +
    dietary * 0.07 +
    contact * 0.05
  ));

  return {
    score: Math.max(1, Math.min(100, score)),
    eligible: true,
    reasons: [
      `${capacity}-guest space fits ${input.headcount}`,
      `${candidate.commuteMinutes} min is within the commute limit`,
      `${candidate.capacityTrust} capacity evidence`,
    ],
  };
}
