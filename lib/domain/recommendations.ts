import type {
  DomainSlug,
  LearnerSignal,
  RecommendationCandidate,
} from "@/lib/domain/types";

export interface RankedRecommendation extends RecommendationCandidate {
  score: number;
  reasons: string[];
}

function signalFor(
  signals: LearnerSignal[],
  domain: DomainSlug,
): LearnerSignal {
  return (
    signals.find((signal) => signal.domain === domain) ?? {
      domain,
      focusRank: null,
      mastery: 0,
      confidence: 0,
      accuracy: 0,
    }
  );
}

export function rankRecommendations(
  candidates: RecommendationCandidate[],
  signals: LearnerSignal[],
  availableMinutes: number,
): RankedRecommendation[] {
  const masteryByDomain = new Map(
    signals.map((signal) => [signal.domain, signal.mastery]),
  );

  return candidates
    .filter((candidate) =>
      candidate.prerequisites.every(
        (prerequisite) => (masteryByDomain.get(prerequisite) ?? 0) >= 30,
      ),
    )
    .map((candidate) => {
      const signal = signalFor(signals, candidate.domain);
      const reasons: string[] = [];
      let score = candidate.priority * 5;

      if (signal.focusRank !== null) {
        score += Math.max(0, 45 - signal.focusRank * 8);
        reasons.push("Matches a selected focus area");
      }
      if (signal.mastery < 50) {
        score += (50 - signal.mastery) * 0.7;
        reasons.push("Builds a current skill gap");
      }
      if (signal.confidence < 50) {
        score += (50 - signal.confidence) * 0.4;
        reasons.push("Strengthens low-confidence knowledge");
      }
      if (signal.accuracy > 0 && signal.accuracy < 70) {
        score += (70 - signal.accuracy) * 0.6;
        reasons.push("Remediates recent quiz performance");
      }

      const durationDelta = availableMinutes - candidate.durationMinutes;
      if (durationDelta >= 0) {
        score += Math.max(0, 20 - durationDelta * 0.3);
        reasons.push(`Fits the ${availableMinutes}-minute study window`);
      } else {
        score -= Math.abs(durationDelta) * 2;
      }

      const idealDifficulty = Math.max(1, Math.ceil(signal.mastery / 25));
      score -= Math.abs(candidate.difficulty - idealDifficulty) * 6;

      return {
        ...candidate,
        score: Math.round(score * 10) / 10,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
