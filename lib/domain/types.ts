export const DOMAIN_SLUGS = [
  "github-fundamentals",
  "github-administration",
  "github-actions",
  "github-advanced-security",
  "github-copilot",
  "azure-ai-foundry",
  "ai-engineering",
  "ai-security",
  "responsible-ai",
  "microsoft-security-ai",
] as const;

export type DomainSlug = (typeof DOMAIN_SLUGS)[number];
export type UserRole = "learner" | "content_reviewer" | "administrator";
export type QuestCadence = "daily" | "weekly" | "monthly";
export type QuestStepType =
  | "reading"
  | "lab"
  | "quiz"
  | "challenge"
  | "boss_battle"
  | "raid"
  | "certification"
  | "streak";

export interface QuestStep {
  id: string;
  type: QuestStepType;
  title: string;
  instructions: string;
  resourceUrl?: string;
  resourceLabel?: string;
  xpKey: string;
  guide?: {
    introduction: string;
    checkpoints: Array<{
      id: string;
      title: string;
      instructions: string;
      successCriteria: string;
      hint?: string;
      completed?: boolean;
    }>;
  };
  quiz?: {
    prompt: string;
    options: string[];
    answer: number;
    explanation: string;
  };
}

export interface QuestTemplate {
  id: string;
  domain: DomainSlug;
  cadence: QuestCadence;
  title: string;
  summary: string;
  durationMinutes: number;
  difficulty: number;
  challengeMode: "guided" | "semi-guided" | "expert";
  prerequisites: DomainSlug[];
  steps: QuestStep[];
}

export interface CertificationDefinition {
  code: string;
  name: string;
  provider: "Microsoft" | "GitHub";
  description: string;
  recommendedOrder: number;
  domains: DomainSlug[];
  officialUrl: string;
}

export type ExamQuestionType =
  | "multiple_choice"
  | "scenario"
  | "case_study";

export interface ExamQuestionDefinition {
  id: string;
  certificationCode: string;
  type: ExamQuestionType;
  difficulty: number;
  domain: DomainSlug;
  caseContext?: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface RecommendationCandidate {
  id: string;
  domain: DomainSlug;
  difficulty: number;
  durationMinutes: number;
  prerequisites: DomainSlug[];
  priority: number;
}

export interface LearnerSignal {
  domain: DomainSlug;
  focusRank: number | null;
  mastery: number;
  confidence: number;
  accuracy: number;
}
