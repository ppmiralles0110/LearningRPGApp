import type {
  CertificationDefinition,
  DomainSlug,
  QuestTemplate,
} from "@/lib/domain/types";
export { examQuestions } from "@/lib/domain/question-bank";

export const domains: Array<{
  slug: DomainSlug;
  name: string;
  priority: number;
  description: string;
}> = [
  {
    slug: "github-fundamentals",
    name: "GitHub Fundamentals",
    priority: 1,
    description: "Repositories, collaboration, pull requests, and Git foundations.",
  },
  {
    slug: "github-administration",
    name: "GitHub Administration",
    priority: 2,
    description: "Enterprise governance, identity, policy, and repository administration.",
  },
  {
    slug: "github-actions",
    name: "GitHub Actions",
    priority: 3,
    description: "Secure, reusable automation and continuous delivery workflows.",
  },
  {
    slug: "github-advanced-security",
    name: "GitHub Advanced Security",
    priority: 4,
    description: "Code scanning, secret scanning, dependency security, and remediation.",
  },
  {
    slug: "github-copilot",
    name: "GitHub Copilot",
    priority: 5,
    description: "Effective, responsible AI-assisted software delivery.",
  },
  {
    slug: "azure-ai-foundry",
    name: "Azure AI Foundry",
    priority: 6,
    description: "Model selection, evaluation, prompt flows, agents, and operations.",
  },
  {
    slug: "ai-engineering",
    name: "AI Engineering",
    priority: 7,
    description: "Production AI application design, retrieval, evaluation, and observability.",
  },
  {
    slug: "ai-security",
    name: "AI Security",
    priority: 8,
    description: "Threat modeling and defenses for generative AI systems.",
  },
  {
    slug: "responsible-ai",
    name: "Responsible AI",
    priority: 9,
    description: "Fairness, reliability, transparency, privacy, and accountability.",
  },
  {
    slug: "microsoft-security-ai",
    name: "Microsoft Security for AI Workloads",
    priority: 10,
    description: "Microsoft security controls for AI identities, data, platforms, and apps.",
  },
];

export const xpDefaults = {
  reading: 10,
  lab: 25,
  quiz: 15,
  challenge: 50,
  certification: 1000,
  boss_battle: 150,
  raid: 500,
  streak: 10,
} as const;

function dailyQuest(input: {
  id: string;
  domain: DomainSlug;
  title: string;
  summary: string;
  readingTitle: string;
  readingUrl: string;
  lab: string;
  quiz: { prompt: string; options: string[]; answer: number; explanation: string };
  difficulty?: number;
  prerequisites?: DomainSlug[];
  challengeMode?: "guided" | "semi-guided" | "expert";
}): QuestTemplate {
  return {
    id: input.id,
    domain: input.domain,
    cadence: "daily",
    title: input.title,
    summary: input.summary,
    durationMinutes: 45,
    difficulty: input.difficulty ?? 1,
    challengeMode: input.challengeMode ?? "guided",
    prerequisites: input.prerequisites ?? [],
    steps: [
      {
        id: "read",
        type: "reading",
        title: input.readingTitle,
        instructions: "Read the official resource and capture three design takeaways.",
        resourceUrl: input.readingUrl,
        resourceLabel: "Open official resource",
        xpKey: "reading",
      },
      {
        id: "lab",
        type: "lab",
        title: "Hands-on challenge",
        instructions: input.lab,
        xpKey: "lab",
      },
      {
        id: "quiz",
        type: "quiz",
        title: "Knowledge check",
        instructions: "Choose the best answer before reviewing the explanation.",
        xpKey: "quiz",
        quiz: input.quiz,
      },
    ],
  };
}

const questTemplateDefinitions: QuestTemplate[] = [
  dailyQuest({
    id: "github-collaboration-basics",
    domain: "github-fundamentals",
    title: "Ship a change through pull requests",
    summary: "Practice the branch, commit, pull request, and review collaboration loop.",
    readingTitle: "GitHub flow",
    readingUrl: "https://docs.github.com/en/get-started/using-github/github-flow",
    lab: "Create a repository, open a feature branch, commit a small change, and merge it through a reviewed pull request.",
    quiz: {
      prompt: "Why should a change be proposed from a branch?",
      options: [
        "It isolates reviewable work from the default branch",
        "It disables repository permissions",
        "It removes the need for commits",
        "It automatically deploys every change",
      ],
      answer: 0,
      explanation: "Branches isolate work so it can be reviewed and tested before merge.",
    },
  }),
  dailyQuest({
    id: "github-governance-foundations",
    domain: "github-administration",
    title: "Design a repository governance baseline",
    summary: "Translate governance needs into roles, rulesets, and repository settings.",
    readingTitle: "Repository roles for an organization",
    readingUrl: "https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/repository-roles-for-an-organization",
    lab: "Draft a governance matrix for owners, maintainers, contributors, and outside collaborators, then map each role to least privilege.",
    difficulty: 2,
    prerequisites: ["github-fundamentals"],
    quiz: {
      prompt: "Which principle best guides repository role assignment?",
      options: [
        "Grant every contributor maintain access",
        "Grant the least privilege needed for the task",
        "Use one shared administrator account",
        "Disable branch protections for trusted users",
      ],
      answer: 1,
      explanation: "Least privilege reduces blast radius while preserving required access.",
    },
  }),
  dailyQuest({
    id: "actions-secure-workflow",
    domain: "github-actions",
    title: "Build a secure CI workflow",
    summary: "Create a least-privilege workflow with deterministic dependencies.",
    readingTitle: "Security hardening for GitHub Actions",
    readingUrl: "https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions",
    lab: "Create a workflow that lints a sample project, pins third-party actions to a full commit SHA, and declares read-only default permissions.",
    difficulty: 2,
    prerequisites: ["github-fundamentals"],
    quiz: {
      prompt: "What is the safest default for GITHUB_TOKEN permissions?",
      options: [
        "write-all",
        "read-all with targeted write grants per job",
        "administrator",
        "No permissions declaration",
      ],
      answer: 1,
      explanation: "Start with read-only and grant narrowly scoped write permissions only where needed.",
    },
  }),
  dailyQuest({
    id: "ghas-code-scanning",
    domain: "github-advanced-security",
    title: "Triage a code scanning alert",
    summary: "Understand CodeQL alerts and document risk-based remediation.",
    readingTitle: "About code scanning with CodeQL",
    readingUrl: "https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql",
    lab: "Review a public CodeQL alert example, record source-to-sink data flow, and propose a fix plus regression test.",
    difficulty: 2,
    prerequisites: ["github-fundamentals"],
    quiz: {
      prompt: "What does a CodeQL path explanation primarily show?",
      options: [
        "The repository billing plan",
        "How data flows from a source to a vulnerable sink",
        "Which user created the repository",
        "The deployment region",
      ],
      answer: 1,
      explanation: "Path explanations help developers understand the data flow that creates the vulnerability.",
    },
  }),
  dailyQuest({
    id: "copilot-instructions",
    domain: "github-copilot",
    title: "Create effective Copilot instructions",
    summary: "Ground AI assistance in repository conventions and validation expectations.",
    readingTitle: "Adding repository custom instructions for GitHub Copilot",
    readingUrl: "https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot",
    lab: "Write a copilot-instructions.md file for a sample TypeScript service covering architecture, tests, security, and response style.",
    difficulty: 2,
    prerequisites: ["github-fundamentals"],
    quiz: {
      prompt: "What makes custom instructions most useful?",
      options: [
        "Broad slogans without examples",
        "Specific repository conventions and verification steps",
        "Secrets copied from environment files",
        "Instructions to skip testing",
      ],
      answer: 1,
      explanation: "Concrete conventions and validation steps give Copilot actionable context.",
    },
  }),
  dailyQuest({
    id: "foundry-model-selection",
    domain: "azure-ai-foundry",
    title: "Choose a model with evidence",
    summary: "Compare models using task quality, safety, latency, and cost criteria.",
    readingTitle: "Azure AI Foundry model catalog",
    readingUrl: "https://learn.microsoft.com/en-us/azure/ai-foundry/how-to/model-catalog-overview",
    lab: "Create a decision matrix for three model candidates using quality, safety, latency, context, regional availability, and cost.",
    difficulty: 2,
    quiz: {
      prompt: "Which model-selection approach is most reliable?",
      options: [
        "Always choose the largest model",
        "Evaluate representative tasks against measurable criteria",
        "Choose only by benchmark popularity",
        "Ignore latency until production",
      ],
      answer: 1,
      explanation: "Representative evaluations connect model choice to actual workload requirements.",
    },
  }),
  dailyQuest({
    id: "ai-engineering-evaluation",
    domain: "ai-engineering",
    title: "Design an AI evaluation set",
    summary: "Turn expected application behavior into repeatable quality checks.",
    readingTitle: "Evaluate generative AI applications",
    readingUrl: "https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/evaluation-approach-gen-ai",
    lab: "Create ten representative prompts with expected outcomes, failure labels, and a rubric for groundedness and task completion.",
    difficulty: 3,
    prerequisites: ["azure-ai-foundry"],
    challengeMode: "semi-guided",
    quiz: {
      prompt: "Why include adversarial and edge cases in an evaluation set?",
      options: [
        "To make every score lower",
        "To expose failure modes hidden by happy-path examples",
        "To eliminate human review",
        "To increase model context length",
      ],
      answer: 1,
      explanation: "Edge and adversarial cases reveal reliability and safety gaps before production.",
    },
  }),
  dailyQuest({
    id: "ai-security-threat-model",
    domain: "ai-security",
    title: "Threat-model a generative AI feature",
    summary: "Identify trust boundaries, prompt attacks, data exposure, and mitigations.",
    readingTitle: "AI security posture management",
    readingUrl: "https://learn.microsoft.com/en-us/azure/defender-for-cloud/ai-security-posture",
    lab: "Draw a data-flow diagram for a RAG assistant and document threats for prompts, retrieval, tools, model output, and telemetry.",
    difficulty: 3,
    prerequisites: ["ai-engineering"],
    challengeMode: "semi-guided",
    quiz: {
      prompt: "Which control most directly limits prompt-injected tool abuse?",
      options: [
        "Larger font sizes",
        "Explicit tool authorization and least-privilege scopes",
        "Longer prompts",
        "Public storage containers",
      ],
      answer: 1,
      explanation: "Authorization and narrow scopes constrain what a compromised interaction can do.",
    },
  }),
  dailyQuest({
    id: "responsible-ai-impact",
    domain: "responsible-ai",
    title: "Assess responsible AI impacts",
    summary: "Identify stakeholders, harms, measurements, and human oversight.",
    readingTitle: "Microsoft Responsible AI Standard",
    readingUrl: "https://www.microsoft.com/en-us/ai/principles-and-approach",
    lab: "Create an impact assessment for an AI support assistant, including affected stakeholders, failure severity, monitoring, and escalation.",
    difficulty: 2,
    quiz: {
      prompt: "When should responsible AI assessment begin?",
      options: [
        "Only after a production incident",
        "During initial design and throughout the lifecycle",
        "After model retirement",
        "Only for regulated industries",
      ],
      answer: 1,
      explanation: "Responsible AI is a lifecycle practice, starting with design decisions.",
    },
  }),
  dailyQuest({
    id: "microsoft-ai-security-controls",
    domain: "microsoft-security-ai",
    title: "Map controls to an AI workload",
    summary: "Apply identity, network, data, and monitoring controls to an AI architecture.",
    readingTitle: "Security for AI services",
    readingUrl: "https://learn.microsoft.com/en-us/security/ai-red-team/",
    lab: "Build a control matrix for managed identities, private networking, Key Vault, content safety, logging, and incident response.",
    difficulty: 3,
    prerequisites: ["ai-security"],
    challengeMode: "semi-guided",
    quiz: {
      prompt: "Why prefer managed identities for Azure-hosted AI workloads?",
      options: [
        "They remove all authorization checks",
        "They avoid long-lived application secrets and support scoped access",
        "They make resources public",
        "They disable audit logs",
      ],
      answer: 1,
      explanation: "Managed identities reduce secret handling and integrate with scoped Azure RBAC.",
    },
  }),
  {
    id: "boss-secure-actions-pipeline",
    domain: "github-actions",
    cadence: "weekly",
    title: "Boss Battle: Secure delivery pipeline",
    summary: "Combine workflow design, reusable automation, permissions, and supply-chain controls.",
    durationMinutes: 120,
    difficulty: 3,
    challengeMode: "semi-guided",
    prerequisites: ["github-fundamentals", "github-actions"],
    steps: [
      {
        id: "brief",
        type: "reading",
        title: "Review the secure-use reference",
        instructions: "Identify the five controls most relevant to the target repository.",
        resourceUrl: "https://docs.github.com/en/actions/security-for-github-actions/security-guides/secure-use-reference",
        resourceLabel: "Open secure-use reference",
        xpKey: "reading",
      },
      {
        id: "build",
        type: "boss_battle",
        title: "Build and defend the workflow",
        instructions: "Deliver CI with least-privilege permissions, pinned actions, dependency caching, artifacts, environments, and a concise threat model.",
        xpKey: "boss_battle",
      },
    ],
  },
  {
    id: "boss-enterprise-governance",
    domain: "github-administration",
    cadence: "weekly",
    title: "Boss Battle: Enterprise governance",
    summary: "Design organization policy, repository rulesets, identity, and audit practices.",
    durationMinutes: 150,
    difficulty: 4,
    challengeMode: "expert",
    prerequisites: ["github-administration", "github-advanced-security"],
    steps: [
      {
        id: "research",
        type: "reading",
        title: "Review enterprise best practices",
        instructions: "Capture policy decisions that belong at enterprise, organization, and repository scope.",
        resourceUrl: "https://docs.github.com/en/enterprise-cloud@latest/admin",
        resourceLabel: "Open GitHub Enterprise administration",
        xpKey: "reading",
      },
      {
        id: "design",
        type: "boss_battle",
        title: "Defend a governance architecture",
        instructions: "Produce a governance design covering identity, roles, rulesets, Actions policy, security enablement, audit, and exceptions.",
        xpKey: "boss_battle",
      },
    ],
  },
  {
    id: "boss-foundry-rag",
    domain: "azure-ai-foundry",
    cadence: "weekly",
    title: "Boss Battle: Evaluated RAG solution",
    summary: "Design retrieval, grounding, evaluation, safety, and monitoring as one system.",
    durationMinutes: 180,
    difficulty: 4,
    challengeMode: "expert",
    prerequisites: ["azure-ai-foundry", "ai-engineering"],
    steps: [
      {
        id: "reference",
        type: "reading",
        title: "Review RAG architecture guidance",
        instructions: "Identify data, retrieval, orchestration, and evaluation responsibilities.",
        resourceUrl: "https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-solution-design-and-evaluation-guide",
        resourceLabel: "Open RAG design guidance",
        xpKey: "reading",
      },
      {
        id: "solution",
        type: "boss_battle",
        title: "Produce the solution design",
        instructions: "Deliver an architecture, retrieval strategy, evaluation set, safety controls, operational SLOs, and cost assumptions.",
        xpKey: "boss_battle",
      },
    ],
  },
  {
    id: "boss-ai-security-review",
    domain: "ai-security",
    cadence: "weekly",
    title: "Boss Battle: AI security assessment",
    summary: "Review a reference AI application across identity, data, model, tools, and operations.",
    durationMinutes: 150,
    difficulty: 4,
    challengeMode: "expert",
    prerequisites: ["ai-security", "responsible-ai"],
    steps: [
      {
        id: "framework",
        type: "reading",
        title: "Review AI red-team guidance",
        instructions: "Select threat categories appropriate to the scenario.",
        resourceUrl: "https://learn.microsoft.com/en-us/security/ai-red-team/",
        resourceLabel: "Open Microsoft AI red-team guidance",
        xpKey: "reading",
      },
      {
        id: "assessment",
        type: "boss_battle",
        title: "Complete the assessment",
        instructions: "Deliver prioritized findings, evidence, exploit preconditions, recommended controls, and a validation plan.",
        xpKey: "boss_battle",
      },
    ],
  },
  {
    id: "raid-ai-application",
    domain: "ai-engineering",
    cadence: "monthly",
    title: "Raid: Production-ready AI application",
    summary: "Deliver a working AI application design with evaluation and operational evidence.",
    durationMinutes: 480,
    difficulty: 5,
    challengeMode: "expert",
    prerequisites: ["azure-ai-foundry", "ai-engineering", "responsible-ai"],
    steps: [
      {
        id: "plan",
        type: "reading",
        title: "Choose the reference architecture",
        instructions: "Review Azure Architecture Center guidance and record key quality attributes.",
        resourceUrl: "https://learn.microsoft.com/en-us/azure/architecture/ai-ml/",
        resourceLabel: "Open Azure AI architecture guidance",
        xpKey: "reading",
      },
      {
        id: "deliver",
        type: "raid",
        title: "Submit the working deliverable",
        instructions: "Provide source, architecture, threat model, evaluation results, runbook, and cost assumptions. External review is a future integration; completion here records learner attestation.",
        xpKey: "raid",
      },
    ],
  },
  {
    id: "raid-secure-cicd",
    domain: "github-advanced-security",
    cadence: "monthly",
    title: "Raid: Secure CI/CD platform",
    summary: "Deliver a reusable secure delivery foundation for multiple repositories.",
    durationMinutes: 480,
    difficulty: 5,
    challengeMode: "expert",
    prerequisites: ["github-actions", "github-advanced-security", "github-administration"],
    steps: [
      {
        id: "standard",
        type: "reading",
        title: "Review supply-chain security guidance",
        instructions: "Define the required controls and evidence for the platform.",
        resourceUrl: "https://docs.github.com/en/code-security/supply-chain-security",
        resourceLabel: "Open supply-chain security guidance",
        xpKey: "reading",
      },
      {
        id: "platform",
        type: "raid",
        title: "Deliver the platform",
        instructions: "Create reusable workflows, rulesets, security defaults, onboarding guidance, metrics, and an exception process.",
        xpKey: "raid",
      },
    ],
  },
  {
    id: "raid-enterprise-governance",
    domain: "github-administration",
    cadence: "monthly",
    title: "Raid: GitHub Enterprise governance design",
    summary: "Deliver an enterprise operating model with controls, ownership, and rollout.",
    durationMinutes: 420,
    difficulty: 5,
    challengeMode: "expert",
    prerequisites: ["github-administration", "github-advanced-security"],
    steps: [
      {
        id: "discover",
        type: "reading",
        title: "Review enterprise administration scope",
        instructions: "Map available controls to organizational responsibilities.",
        resourceUrl: "https://docs.github.com/en/enterprise-cloud@latest/admin",
        resourceLabel: "Open enterprise administration",
        xpKey: "reading",
      },
      {
        id: "governance",
        type: "raid",
        title: "Deliver the governance package",
        instructions: "Produce target state, policy catalog, RACI, rollout waves, audit measures, exception handling, and adoption metrics.",
        xpKey: "raid",
      },
    ],
  },
  {
    id: "raid-ai-security-program",
    domain: "microsoft-security-ai",
    cadence: "monthly",
    title: "Raid: AI security program",
    summary: "Deliver a repeatable security assessment and control program for AI workloads.",
    durationMinutes: 480,
    difficulty: 5,
    challengeMode: "expert",
    prerequisites: ["ai-security", "responsible-ai", "microsoft-security-ai"],
    steps: [
      {
        id: "baseline",
        type: "reading",
        title: "Review security posture guidance",
        instructions: "Identify preventive, detective, and responsive controls.",
        resourceUrl: "https://learn.microsoft.com/en-us/azure/defender-for-cloud/ai-security-posture",
        resourceLabel: "Open AI security posture guidance",
        xpKey: "reading",
      },
      {
        id: "program",
        type: "raid",
        title: "Deliver the security program",
        instructions: "Provide a threat model template, control baseline, assessment rubric, monitoring plan, incident playbook, and executive scorecard.",
        xpKey: "raid",
      },
    ],
  },
];

const guideProfiles: Record<
  DomainSlug,
  {
    prepare: string;
    validate: string;
    evidence: string;
  }
> = {
  "github-fundamentals": {
    prepare: "Use a disposable practice repository and confirm you can create branches and pull requests without changing production code.",
    validate: "Inspect the commit history and pull request timeline; confirm the change was reviewed on a branch before merge.",
    evidence: "Capture the repository URL and summarize the branch, commit, review, and merge sequence.",
  },
  "github-administration": {
    prepare: "Create a worksheet with separate enterprise, organization, repository, team, and external-collaborator scopes.",
    validate: "Test each proposed role or policy against least privilege, emergency bypass, ownership, and audit requirements.",
    evidence: "Record the decision matrix, assumptions, exceptions, and the person responsible for periodic review.",
  },
  "github-actions": {
    prepare: "Use a disposable repository, inspect the current default-branch rules, and create the workflow on a feature branch.",
    validate: "Run the workflow, inspect every job, verify declared token permissions, and confirm third-party actions use immutable references.",
    evidence: "Save the workflow run URL and note the permissions, dependency controls, artifacts, and any failed run you corrected.",
  },
  "github-advanced-security": {
    prepare: "Choose a public sample or disposable repository and identify the alert, dependency, secret, or data flow being assessed.",
    validate: "Confirm the finding and remediation with the relevant scan, path explanation, dependency review, or regression test.",
    evidence: "Capture the finding, affected path, risk, remediation, verification result, and any justified residual risk.",
  },
  "github-copilot": {
    prepare: "Choose a sample repository, inventory its architecture and validation commands, and exclude secrets or sensitive data.",
    validate: "Use the instructions in a realistic Copilot request, inspect the response against repository conventions, and run the stated checks.",
    evidence: "Save the instruction file plus one before-and-after prompt example showing what became more accurate or actionable.",
  },
  "azure-ai-foundry": {
    prepare: "Define the workload, representative inputs, required regions, quality threshold, safety boundary, latency target, and cost ceiling.",
    validate: "Compare candidates using the same evaluation set and record quality, safety, latency, availability, and cost evidence.",
    evidence: "Publish the scored decision matrix, evaluation assumptions, selected option, rejected options, and reevaluation trigger.",
  },
  "ai-engineering": {
    prepare: "Define users, expected behavior, representative data, measurable acceptance criteria, and failure categories before building.",
    validate: "Run happy-path, edge, and adversarial cases; record groundedness, task completion, latency, errors, and operational gaps.",
    evidence: "Package the implementation or design with evaluation results, architecture decisions, known limitations, and next actions.",
  },
  "ai-security": {
    prepare: "Draw the data flow and mark identities, data stores, retrieval sources, models, tools, external systems, and trust boundaries.",
    validate: "Exercise realistic abuse cases for prompt injection, data disclosure, excessive agency, unsafe output, and monitoring gaps.",
    evidence: "Record each threat, exploit preconditions, impact, existing control, recommended control, owner, and verification method.",
  },
  "responsible-ai": {
    prepare: "Identify intended users, affected stakeholders, high-impact decisions, foreseeable misuse, and groups requiring separate evaluation.",
    validate: "Assess fairness, reliability, privacy, transparency, accessibility, human oversight, and escalation with measurable evidence.",
    evidence: "Document harms, severity, mitigations, accountable owners, monitoring signals, user communication, and review cadence.",
  },
  "microsoft-security-ai": {
    prepare: "Inventory workload identities, data classifications, network paths, secrets, model endpoints, tools, logs, and administrative roles.",
    validate: "Check least privilege, managed identity, private connectivity, key management, content safety, detection, and incident-response coverage.",
    evidence: "Produce a control matrix with control owner, implementation state, evidence source, validation frequency, and open risk.",
  },
};

function withGuidedSteps(template: QuestTemplate): QuestTemplate {
  const profile = guideProfiles[template.domain];
  return {
    ...template,
    steps: template.steps.map((step) => {
      if (
        !["lab", "challenge", "boss_battle", "raid"].includes(step.type)
      ) {
        return step;
      }
      return {
        ...step,
        guide: {
          introduction: `Complete each checkpoint in order. This ${template.challengeMode} guide records progress locally; external repository or cloud verification remains an explicit future integration.`,
          checkpoints: [
            {
              id: "prepare",
              title: "Prepare a safe workspace",
              instructions: profile.prepare,
              successCriteria:
                "The workspace, scope, constraints, and acceptance criteria are written down before implementation begins.",
              hint: "Prefer a disposable repository, sample tenant, or architecture worksheet when production access is unnecessary.",
            },
            {
              id: "execute",
              title: "Build the required artifact",
              instructions: step.instructions,
              successCriteria:
                "The requested artifact exists and addresses every noun and control named in the task.",
              hint: "Work in small increments and keep assumptions beside the artifact rather than relying on memory.",
            },
            {
              id: "validate",
              title: "Validate the outcome",
              instructions: profile.validate,
              successCriteria:
                "Validation evidence demonstrates both the expected behavior and at least one relevant failure or edge case.",
              hint: "A successful command, scan, evaluation table, or peer-review checklist is stronger than visual inspection alone.",
            },
            {
              id: "document",
              title: "Capture evidence and reflection",
              instructions: profile.evidence,
              successCriteria:
                "The evidence is reviewable by another architect and includes one lesson or next improvement.",
              hint: "Remove secrets and sensitive tenant data before linking evidence.",
            },
          ],
        },
      };
    }),
  };
}

export const questTemplates = questTemplateDefinitions.map(withGuidedSteps);

export const achievements = [
  {
    code: "first-lab",
    title: "First Lab",
    description: "Complete your first hands-on lab.",
    icon: "FlaskConical",
  },
  {
    code: "github-explorer",
    title: "GitHub Explorer",
    description: "Complete three GitHub-domain quest steps.",
    icon: "GitBranch",
  },
  {
    code: "copilot-champion",
    title: "Copilot Champion",
    description: "Complete a GitHub Copilot quest.",
    icon: "Sparkles",
  },
  {
    code: "foundry-builder",
    title: "Foundry Builder",
    description: "Complete an Azure AI Foundry challenge.",
    icon: "Blocks",
  },
  {
    code: "ai-security-defender",
    title: "AI Security Defender",
    description: "Complete an AI Security boss battle.",
    icon: "ShieldCheck",
  },
  {
    code: "certification-warrior",
    title: "Certification Warrior",
    description: "Pass a practice exam with at least 70 percent.",
    icon: "Medal",
  },
] as const;

export const certifications: CertificationDefinition[] = [
  {
    code: "AZ-900",
    name: "Microsoft Azure Fundamentals",
    provider: "Microsoft",
    description: "Cloud concepts, Azure architecture, services, management, and governance.",
    recommendedOrder: 1,
    domains: ["ai-engineering"],
    officialUrl: "https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/",
  },
  {
    code: "GH-FOUNDATIONS",
    name: "GitHub Foundations",
    provider: "GitHub",
    description: "Foundational GitHub collaboration, project management, and modern development.",
    recommendedOrder: 2,
    domains: ["github-fundamentals"],
    officialUrl: "https://resources.github.com/learn/certifications/",
  },
  {
    code: "AI-900",
    name: "Microsoft Azure AI Fundamentals",
    provider: "Microsoft",
    description: "AI workloads, machine learning, computer vision, NLP, and generative AI.",
    recommendedOrder: 3,
    domains: ["azure-ai-foundry", "responsible-ai"],
    officialUrl: "https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/",
  },
  {
    code: "SC-900",
    name: "Microsoft Security, Compliance, and Identity Fundamentals",
    provider: "Microsoft",
    description: "Security, compliance, identity concepts, and Microsoft capabilities.",
    recommendedOrder: 4,
    domains: ["microsoft-security-ai", "ai-security"],
    officialUrl: "https://learn.microsoft.com/en-us/credentials/certifications/security-compliance-and-identity-fundamentals/",
  },
  {
    code: "GH-ADMIN",
    name: "GitHub Administration",
    provider: "GitHub",
    description: "Enterprise support, user and repository management, and governance.",
    recommendedOrder: 5,
    domains: ["github-administration"],
    officialUrl: "https://resources.github.com/learn/certifications/",
  },
  {
    code: "GH-COPILOT",
    name: "GitHub Copilot",
    provider: "GitHub",
    description: "Responsible use, plans, features, prompting, productivity, and privacy.",
    recommendedOrder: 6,
    domains: ["github-copilot", "responsible-ai"],
    officialUrl: "https://resources.github.com/learn/certifications/",
  },
  {
    code: "AZ-204",
    name: "Developing Solutions for Microsoft Azure",
    provider: "Microsoft",
    description: "Azure compute, storage, security, monitoring, and service integration.",
    recommendedOrder: 7,
    domains: ["ai-engineering"],
    officialUrl: "https://learn.microsoft.com/en-us/credentials/certifications/azure-developer/",
  },
  {
    code: "AI-102",
    name: "Azure AI Engineer Associate",
    provider: "Microsoft",
    description: "Plan, implement, deploy, integrate, monitor, and secure Azure AI solutions.",
    recommendedOrder: 8,
    domains: ["azure-ai-foundry", "ai-engineering", "responsible-ai"],
    officialUrl: "https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-engineer/",
  },
  {
    code: "GH-ADV-SECURITY",
    name: "GitHub Advanced Security",
    provider: "GitHub",
    description: "Secret scanning, dependency management, code scanning, and remediation.",
    recommendedOrder: 9,
    domains: ["github-advanced-security", "github-actions"],
    officialUrl: "https://resources.github.com/learn/certifications/",
  },
  {
    code: "AZ-305",
    name: "Azure Solutions Architect Expert",
    provider: "Microsoft",
    description: "Design identity, governance, monitoring, data, business continuity, and infrastructure.",
    recommendedOrder: 10,
    domains: ["ai-engineering", "microsoft-security-ai"],
    officialUrl: "https://learn.microsoft.com/en-us/credentials/certifications/azure-solutions-architect/",
  },
];
