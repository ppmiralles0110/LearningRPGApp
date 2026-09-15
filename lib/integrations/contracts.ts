import type { DomainSlug } from "@/lib/domain/types";

export interface VerificationRequest {
  learnerId: string;
  challengeId: string;
  evidenceUrl: string;
  expectedSignals: Array<
    "repository" | "commit" | "pull_request" | "issue" | "workflow_run"
  >;
}

export interface VerificationResult {
  verified: boolean;
  checkedAt: string;
  summary: string;
  evidence: Array<{ kind: string; url: string; observedAt: string }>;
}

export interface ActivityVerificationProvider {
  readonly id: string;
  verify(request: VerificationRequest): Promise<VerificationResult>;
}

export interface ExternalLearningResource {
  externalId: string;
  title: string;
  url: string;
  provider: string;
  domain: DomainSlug;
  durationMinutes: number | null;
  lastReviewedAt: string;
}

export interface LearningCatalogProvider {
  readonly id: string;
  search(query: {
    domains: DomainSlug[];
    limit: number;
  }): Promise<ExternalLearningResource[]>;
}

export interface SubmissionReview {
  outcome: "meets_expectations" | "changes_requested" | "manual_review";
  summary: string;
  findings: Array<{
    severity: "info" | "warning" | "blocking";
    title: string;
    explanation: string;
    location?: string;
  }>;
}

export interface SubmissionReviewProvider {
  readonly id: string;
  review(input: {
    learnerId: string;
    challengeId: string;
    evidenceUrl: string;
    rubricId: string;
  }): Promise<SubmissionReview>;
}

export interface OrganizationAnalyticsSink {
  readonly id: string;
  publish(event: {
    organizationId: string;
    eventType: string;
    occurredAt: string;
    payload: Record<string, string | number | boolean | null>;
  }): Promise<void>;
}

export class IntegrationNotConfiguredError extends Error {
  constructor(integrationId: string) {
    super(`Integration "${integrationId}" is not configured.`);
    this.name = "IntegrationNotConfiguredError";
  }
}
