import type {
  DomainSlug,
  ExamQuestionDefinition,
  ExamQuestionType,
} from "@/lib/domain/types";

export const ASSESSMENT_QUESTION_COUNT = 60;
export const QUESTIONS_PER_CERTIFICATION = 100;

type ObjectiveTuple = readonly [
  slug: string,
  domain: DomainSlug,
  prompt: string,
  correct: string,
  distractor1: string,
  distractor2: string,
  distractor3: string,
  explanation: string,
];

const objectives: Record<string, readonly ObjectiveTuple[]> = {
  "AZ-900": [
    ["consumption", "ai-engineering", "Which cloud pricing idea charges for the resources actually consumed?", "Consumption-based pricing", "Capital expenditure", "Perpetual licensing", "Fixed hardware depreciation", "Consumption pricing aligns cost with measured usage instead of owned capacity."],
    ["elasticity", "ai-engineering", "Which cloud capability automatically adds or removes resources as demand changes?", "Elasticity", "Governance", "Single tenancy", "Manual provisioning", "Elasticity adjusts available capacity in response to changing demand."],
    ["availability-zones", "ai-engineering", "Which Azure feature places resources in physically separate datacenters within one region?", "Availability Zones", "Resource groups", "Management groups", "Azure Policy", "Availability Zones provide datacenter-level isolation inside a supported region."],
    ["resource-groups", "ai-engineering", "Which Azure scope is a logical container for resources managed through a shared lifecycle?", "Resource group", "Availability set", "Tenant root group", "Subscription invoice", "A resource group organizes resources that are commonly deployed, managed, and removed together."],
    ["rbac", "microsoft-security-ai", "Which service controls who can perform specific actions on Azure resources?", "Azure role-based access control", "Azure Advisor", "Azure Cost Management", "Azure DNS", "Azure RBAC assigns scoped permissions to identities."],
    ["policy", "microsoft-security-ai", "Which Azure service evaluates resources against organizational standards?", "Azure Policy", "Azure Monitor", "Azure DevOps", "Azure Bastion", "Azure Policy audits and enforces resource configuration standards."],
    ["opex", "ai-engineering", "Which expenditure model treats cloud service charges as ongoing operating costs?", "Operational expenditure", "Capital expenditure", "Asset depreciation", "Hardware amortization", "Cloud consumption is generally categorized as operational expenditure."],
    ["sla", "ai-engineering", "Which document states a provider's availability commitment for a service?", "Service-level agreement", "Resource lock", "Support ticket", "Architecture diagram", "An SLA defines service commitments and applicable service credits."],
    ["shared-responsibility", "microsoft-security-ai", "In cloud security, what remains a customer responsibility in every service model?", "Protecting identities and data", "Securing the provider's physical datacenters", "Replacing failed provider disks", "Operating the provider backbone", "Customers always retain responsibility for their identities, data, and access decisions."],
    ["service-health", "ai-engineering", "Which Azure service reports active incidents and planned maintenance affecting subscribed services?", "Azure Service Health", "Azure Advisor", "Microsoft Purview", "Azure Policy", "Azure Service Health provides personalized service-impact notifications."],
  ],
  "GH-FOUNDATIONS": [
    ["repository", "github-fundamentals", "What is the primary purpose of a GitHub repository?", "Store and collaborate on a versioned project", "Replace all local development tools", "Grant every user administrative access", "Run only production workloads", "Repositories hold versioned content and collaboration history."],
    ["branch", "github-fundamentals", "Why should a contributor create a branch for a change?", "Isolate reviewable work from the default branch", "Remove the need for commits", "Bypass repository rules", "Delete previous history", "Branches isolate changes until they are reviewed and merged."],
    ["pull-request", "github-fundamentals", "Which GitHub feature proposes, discusses, and reviews a set of changes before merge?", "Pull request", "Release asset", "Project field", "Repository topic", "Pull requests provide the review and merge workflow for changes."],
    ["fork", "github-fundamentals", "When is a fork most appropriate?", "Contributing through an independent copy when direct branch access is unavailable", "Renaming a branch", "Resolving every merge conflict", "Storing encrypted secrets", "A fork is an independent repository copy commonly used for external contribution."],
    ["issues", "github-fundamentals", "Which GitHub feature is designed to track work, bugs, and feature discussions?", "Issues", "Deploy keys", "Commit signatures", "Release binaries", "Issues track actionable work and related conversation."],
    ["markdown", "github-fundamentals", "Which format is commonly used for GitHub README files and issue descriptions?", "Markdown", "Binary XML", "YAML-only markup", "Compiled CSS", "GitHub renders Markdown across repositories and collaboration features."],
    ["commit", "github-fundamentals", "What does a commit represent in Git history?", "A versioned snapshot with metadata and parent history", "A temporary browser session", "A repository permission", "An untracked file only", "A commit records a project snapshot and its relationship to prior history."],
    ["merge-conflict", "github-fundamentals", "What causes a merge conflict?", "Competing changes cannot be combined automatically", "A repository has no stars", "A branch has only one commit", "An issue has no assignee", "Conflicts occur when Git cannot determine how overlapping changes should combine."],
    ["actions", "github-actions", "What is GitHub Actions primarily used for?", "Automating workflows triggered by repository events", "Replacing Git version control", "Editing billing invoices", "Creating local operating-system users", "GitHub Actions runs event-driven automation such as CI and deployment."],
    ["permissions", "github-fundamentals", "Which principle should guide repository access?", "Grant the least privilege needed", "Give every contributor admin access", "Use one shared account", "Disable audit history", "Least privilege limits accidental and malicious impact."],
  ],
  "AI-900": [
    ["classification", "ai-engineering", "Which machine-learning task predicts one of several labeled categories?", "Classification", "Regression", "Clustering", "Dimensional storage", "Classification predicts categorical labels."],
    ["regression", "ai-engineering", "Which machine-learning task predicts a numeric value such as price?", "Regression", "Classification", "Clustering", "Tokenization", "Regression estimates continuous numeric values."],
    ["clustering", "ai-engineering", "Which learning technique groups similar observations without predefined labels?", "Clustering", "Classification", "Regression", "Optical character recognition", "Clustering discovers natural groupings in unlabeled data."],
    ["ocr", "azure-ai-foundry", "Which computer-vision capability extracts printed or handwritten text from images?", "Optical character recognition", "Object detection", "Speech synthesis", "Anomaly detection", "OCR converts visual text into machine-readable text."],
    ["object-detection", "azure-ai-foundry", "Which vision task identifies objects and their locations in an image?", "Object detection", "Sentiment analysis", "Regression", "Text translation", "Object detection returns labels and spatial locations."],
    ["sentiment", "azure-ai-foundry", "Which language capability determines whether text expresses positive or negative opinion?", "Sentiment analysis", "Object detection", "Image classification", "Speech synthesis", "Sentiment analysis estimates opinion polarity in text."],
    ["generative-ai", "azure-ai-foundry", "What distinguishes generative AI from traditional predictive models?", "It creates new content based on learned patterns", "It only stores database rows", "It cannot process natural language", "It requires no evaluation", "Generative models produce new text, images, code, or other content."],
    ["fairness", "responsible-ai", "Which Responsible AI principle addresses unequal quality across relevant user groups?", "Fairness", "Elasticity", "Availability", "Throughput", "Fairness focuses on equitable system performance and impact."],
    ["transparency", "responsible-ai", "Which Responsible AI principle helps people understand system capabilities and limitations?", "Transparency", "Caching", "Autoscaling", "Compression", "Transparency communicates how an AI system should and should not be used."],
    ["evaluation", "responsible-ai", "What is the most reliable way to compare generative AI model options?", "Evaluate representative tasks with defined quality and safety metrics", "Always choose the largest model", "Use only one happy-path prompt", "Ignore latency and cost", "Representative evaluation connects model choice to workload requirements."],
  ],
  "SC-900": [
    ["zero-trust", "microsoft-security-ai", "Which security model assumes breach and verifies every access request explicitly?", "Zero Trust", "Implicit trust", "Perimeter-only security", "Anonymous administration", "Zero Trust verifies explicitly, uses least privilege, and assumes breach."],
    ["defense-depth", "microsoft-security-ai", "Which strategy uses multiple independent protective layers?", "Defense in depth", "Single control dependency", "Public-by-default access", "Shared administrator passwords", "Defense in depth reduces reliance on any one control."],
    ["least-privilege", "microsoft-security-ai", "Which principle grants only the access required for a task?", "Least privilege", "Maximum standing access", "Anonymous authorization", "Global administration", "Least privilege minimizes permissions and exposure."],
    ["authentication", "microsoft-security-ai", "What does authentication establish?", "The identity of a user or workload", "The price of a subscription", "The location of a datacenter", "The retention period of a backup", "Authentication verifies identity before authorization decisions."],
    ["authorization", "microsoft-security-ai", "What does authorization determine?", "Which actions an authenticated identity may perform", "Whether a password is spelled correctly", "The physical server location", "The invoice currency", "Authorization evaluates permissions after identity is known."],
    ["mfa", "microsoft-security-ai", "Which control requires more than one form of verification at sign-in?", "Multifactor authentication", "Single sign-on alone", "Anonymous access", "Password reuse", "MFA reduces dependence on one compromised credential."],
    ["conditional-access", "microsoft-security-ai", "Which Microsoft Entra capability applies access policy using signals such as user, device, and risk?", "Conditional Access", "Azure DNS", "Microsoft Purview labels", "Resource locks", "Conditional Access evaluates identity and context signals before granting access."],
    ["purview", "microsoft-security-ai", "Which Microsoft solution focuses on data governance, compliance, and information protection?", "Microsoft Purview", "Azure Load Balancer", "GitHub Actions", "Azure Front Door", "Microsoft Purview provides data governance and compliance capabilities."],
    ["defender", "microsoft-security-ai", "Which Microsoft product family provides cloud security posture and workload protection?", "Microsoft Defender for Cloud", "Microsoft Forms", "Azure DevTest Labs", "Power BI Desktop", "Defender for Cloud evaluates posture and protects cloud workloads."],
    ["sentinel", "microsoft-security-ai", "Which Microsoft service is a cloud-native SIEM and security orchestration platform?", "Microsoft Sentinel", "Azure Advisor", "Microsoft Planner", "Azure Files", "Microsoft Sentinel centralizes security analytics, detection, and response."],
  ],
  "GH-ADMIN": [
    ["enterprise-policy", "github-administration", "Where should a policy be applied when it must govern every organization in an enterprise?", "At enterprise scope", "In each contributor profile", "In one local clone", "In an issue comment", "Enterprise policies provide the broadest consistent governance scope."],
    ["rulesets", "github-administration", "Which GitHub feature enforces branch and tag policy across repositories?", "Rulesets", "Repository topics", "Gists", "Discussions", "Rulesets define enforceable branch and tag protections with controlled bypass."],
    ["saml", "github-administration", "Which capability connects GitHub Enterprise Cloud authentication to an identity provider?", "SAML single sign-on", "GitHub Pages", "Dependabot alerts", "Release notes", "SAML SSO federates enterprise authentication to an identity provider."],
    ["scim", "github-administration", "Which standard automates user provisioning and deprovisioning?", "SCIM", "SARIF", "Markdown", "Webhooks only", "SCIM synchronizes identity lifecycle information with an identity provider."],
    ["audit-log", "github-administration", "Which feature records organization and enterprise administrative activity?", "Audit log", "README history only", "Repository stars", "Issue reactions", "The audit log records security and administrative events."],
    ["actions-policy", "github-administration", "How should an enterprise restrict which third-party actions may run?", "Configure an Actions allow policy", "Delete all workflow files manually", "Give workflows admin tokens", "Disable audit logging", "Actions policy can allow selected actions and reusable workflows."],
    ["teams", "github-administration", "What is the scalable way to grant the same repository access to a group of people?", "Assign access through an organization team", "Share one personal account", "Add credentials to a README", "Use anonymous access", "Teams centralize group membership and repository permissions."],
    ["outside-collaborator", "github-administration", "How should access for a person outside the organization be managed?", "Grant narrowly scoped outside-collaborator access and review it regularly", "Make them enterprise owner", "Share an administrator password", "Disable SSO", "Outside collaborators should receive explicit least-privilege access."],
    ["archive", "github-administration", "What should an administrator do with a repository that must remain readable but no longer accepts changes?", "Archive the repository", "Delete its entire history", "Make every user admin", "Remove all documentation", "Archiving preserves a read-only repository and its history."],
    ["repository-transfer", "github-administration", "Before transferring a repository, what should an administrator evaluate?", "Ownership, policy, permissions, integrations, and name conflicts", "Only the repository star count", "Only local Git aliases", "The browser theme", "A transfer affects ownership, access, URLs, policies, and integrations."],
  ],
  "GH-COPILOT": [
    ["suggestions", "github-copilot", "How should a developer treat code suggested by GitHub Copilot?", "Review, test, and secure it like any other code", "Merge it without inspection", "Assume it is always licensed and correct", "Disable all normal validation", "Copilot suggestions require developer review and normal engineering controls."],
    ["chat-context", "github-copilot", "What most improves the relevance of a Copilot Chat response?", "Specific goals and relevant repository context", "A one-word prompt with no context", "Including production secrets", "Asking it to skip constraints", "Clear intent and relevant context help the model produce useful responses."],
    ["custom-instructions", "github-copilot", "How can a team persist repository-specific guidance for Copilot?", "Add concise repository custom instructions", "Store guidance in an untracked local file only", "Put secrets in every prompt", "Disable code review", "Custom instructions communicate repository conventions and validation expectations."],
    ["prompt-structure", "github-copilot", "Which prompt is most likely to produce a useful implementation?", "A prompt with objective, context, constraints, and acceptance criteria", "A vague request with no desired outcome", "A prompt containing credentials", "A request to ignore tests", "Structured prompts make the expected result and boundaries explicit."],
    ["responsibility", "responsible-ai", "Who remains accountable for software created with Copilot assistance?", "The human and organization delivering the software", "The suggestion engine alone", "No one after generation", "The repository host only", "People and organizations remain responsible for reviewing and operating delivered software."],
    ["content-exclusion", "github-copilot", "What is the purpose of Copilot content exclusion controls?", "Prevent designated content from informing supported Copilot experiences", "Encrypt every repository automatically", "Replace branch protection", "Publish private code", "Content exclusions help organizations control which code Copilot can reference."],
    ["code-referencing", "github-copilot", "What should a developer do when Copilot identifies a suggestion matching public code?", "Review the reference and applicable license before use", "Ignore the match", "Delete repository history", "Publish proprietary credentials", "Code referencing supports informed review of matching public code."],
    ["policies", "github-copilot", "Where should an enterprise control Copilot feature availability?", "Organization or enterprise Copilot policies", "A personal README", "A local Git alias", "Issue labels", "Administrative policies control feature access consistently."],
    ["privacy", "responsible-ai", "What information should never be placed in a Copilot prompt without authorization?", "Secrets and sensitive personal or organizational data", "Public API documentation", "A sanitized error message", "A generic code example", "Prompts should follow data-handling policy and exclude unauthorized sensitive information."],
    ["validation", "github-copilot", "Which workflow best validates an AI-assisted change?", "Run tests and analysis, inspect the diff, and obtain normal review", "Trust a successful generation response", "Skip the build", "Remove security scanning", "AI assistance does not replace deterministic validation and peer review."],
  ],
  "AZ-204": [
    ["app-service", "ai-engineering", "Which Azure service is designed to host managed web applications and APIs?", "Azure App Service", "Azure DNS", "Azure Policy", "Microsoft Purview", "App Service provides managed hosting for web apps and APIs."],
    ["functions", "ai-engineering", "Which Azure compute option runs event-driven code without managing servers?", "Azure Functions", "Azure Virtual Network", "Azure Files", "Azure Monitor workbooks", "Azure Functions is a serverless event-driven compute service."],
    ["blob-storage", "ai-engineering", "Which Azure storage service is optimized for large unstructured objects?", "Azure Blob Storage", "Azure Queue Storage only", "Azure Table Storage only", "Azure DNS zones", "Blob Storage stores unstructured object data such as documents and media."],
    ["cosmos-db", "ai-engineering", "Which Azure database provides globally distributed NoSQL capabilities?", "Azure Cosmos DB", "Azure Bastion", "Azure Policy", "Azure DevTest Labs", "Cosmos DB is a globally distributed database with multiple APIs and consistency options."],
    ["managed-identity", "microsoft-security-ai", "How should an Azure-hosted application access Key Vault without stored credentials?", "Use a managed identity with scoped access", "Embed a client secret in source code", "Enable anonymous vault access", "Put the secret in a URL", "Managed identities avoid application-managed credentials."],
    ["service-bus", "ai-engineering", "Which Azure messaging service supports reliable queues and topics for enterprise workflows?", "Azure Service Bus", "Azure DNS", "Azure Advisor", "Azure Front Door", "Service Bus provides durable brokered messaging with queues and topics."],
    ["event-grid", "ai-engineering", "Which service routes discrete events from publishers to subscribers?", "Azure Event Grid", "Azure Files", "Microsoft Sentinel", "Azure Bastion", "Event Grid is an event distribution service using a publish-subscribe model."],
    ["api-management", "ai-engineering", "Which service publishes APIs with policies, quotas, authentication, and developer access?", "Azure API Management", "Azure Resource Graph", "Azure Batch", "Azure Migrate", "API Management provides an API gateway and lifecycle capabilities."],
    ["application-insights", "ai-engineering", "Which service provides application performance telemetry, traces, and failures?", "Application Insights", "Azure Cost Management", "Azure Policy", "Azure DNS", "Application Insights captures application observability telemetry."],
    ["cache", "ai-engineering", "Which design reduces repeated expensive reads by storing frequently used results in memory?", "Caching", "Polling faster", "Disabling indexes", "Increasing secret lifetime", "Caching improves latency and reduces load when invalidation is handled correctly."],
  ],
  "AI-102": [
    ["model-catalog", "azure-ai-foundry", "Which Azure AI Foundry capability helps teams discover and compare available models?", "Model catalog", "Resource locks", "Azure DNS", "Subscription invoices", "The model catalog presents model choices and deployment information."],
    ["evaluation", "azure-ai-foundry", "What should a team use to compare prompt and model configurations before release?", "Representative evaluations with quality and safety metrics", "One informal happy-path prompt", "Only model parameter count", "No production-like data", "Evaluation provides repeatable evidence about application behavior."],
    ["rag", "ai-engineering", "What is the purpose of retrieval-augmented generation?", "Ground generation in retrieved, relevant source content", "Remove the need for access control", "Train a foundation model from scratch for every query", "Guarantee every output is correct", "RAG supplies relevant external context to a generative model."],
    ["ai-search", "azure-ai-foundry", "Which Azure service supports vector, keyword, hybrid, and semantic retrieval for AI applications?", "Azure AI Search", "Azure DNS", "Azure Policy", "Azure Files only", "Azure AI Search provides retrieval capabilities commonly used in RAG."],
    ["content-safety", "responsible-ai", "Which capability detects harmful text and image categories in AI inputs and outputs?", "Azure AI Content Safety", "Azure Cost Management", "Azure Backup", "Azure Resource Graph", "Content Safety classifies supported harmful-content categories."],
    ["managed-identity", "microsoft-security-ai", "How should a Foundry workload authenticate to supported Azure resources without embedded secrets?", "Use managed identity and scoped role assignments", "Commit access keys to the repository", "Use anonymous endpoints", "Share one administrator token", "Managed identity reduces credential handling and supports least privilege."],
    ["speech", "azure-ai-foundry", "Which Azure AI capability converts spoken audio into text?", "Speech to text", "Text to speech", "Object detection", "Document layout extraction", "Speech to text transcribes spoken language."],
    ["document-intelligence", "azure-ai-foundry", "Which service extracts structured fields and layout from documents?", "Azure AI Document Intelligence", "Azure Load Balancer", "Azure Policy", "Azure DNS", "Document Intelligence analyzes document text, layout, and fields."],
    ["monitoring", "ai-engineering", "What should production generative AI monitoring include?", "Quality, safety, latency, errors, usage, and cost signals", "Only HTTP status 200 counts", "Only model name", "No feedback or traces", "AI operations require both conventional telemetry and model/application quality signals."],
    ["agent-tools", "ai-security", "What is the safest way to expose tools to an AI agent?", "Use explicit authorization, least-privilege scopes, and validated arguments", "Give every tool administrator access", "Execute arbitrary model text", "Disable audit logs", "Tool boundaries must constrain what a compromised interaction can do."],
  ],
  "GH-ADV-SECURITY": [
    ["codeql", "github-advanced-security", "What does CodeQL code scanning analyze?", "Code as data to identify supported vulnerability patterns", "Only repository star counts", "Only deployment billing", "Only issue labels", "CodeQL queries a database representation of code and data flow."],
    ["path", "github-advanced-security", "What does a code-scanning path explanation show?", "How data flows from a source to a vulnerable sink", "The repository billing plan", "The user interface theme", "The number of stars", "Path explanations help developers understand the flow that creates a vulnerability."],
    ["secret-scanning", "github-advanced-security", "What is secret scanning designed to detect?", "Credential and token patterns committed to supported locations", "Only syntax errors", "Only large files", "Only unsigned commits", "Secret scanning identifies supported secret patterns in repository content and history."],
    ["push-protection", "github-advanced-security", "What does push protection do when it detects a supported secret?", "Blocks or warns before the secret is pushed and requires a justified bypass", "Deletes the repository", "Publishes the secret", "Disables authentication", "Push protection prevents many secrets from entering the repository."],
    ["dependabot-alerts", "github-advanced-security", "What triggers a Dependabot alert?", "A vulnerable dependency is identified in the dependency graph", "A pull request has no reviewer", "A branch is renamed", "A README is edited", "Dependabot alerts connect dependency inventory to known vulnerability data."],
    ["dependency-review", "github-advanced-security", "What does dependency review show in a pull request?", "Dependency changes and associated risk before merge", "Only contributor avatars", "Only workflow duration", "Only commit signatures", "Dependency review surfaces introduced or changed dependencies and vulnerabilities."],
    ["sarif", "github-advanced-security", "Which format can upload compatible third-party static-analysis results to code scanning?", "SARIF", "Markdown", "CSV invoices", "PNG", "GitHub code scanning accepts supported SARIF result files."],
    ["default-setup", "github-advanced-security", "What is the benefit of CodeQL default setup?", "Quickly enable supported code scanning with managed configuration", "Bypass all branch rules", "Grant public write access", "Remove alert history", "Default setup simplifies initial CodeQL configuration and maintenance."],
    ["security-campaigns", "github-advanced-security", "What is a security campaign used for?", "Coordinate and track remediation of a defined set of alerts", "Publish a marketing website", "Create billing invoices", "Replace repository permissions", "Campaigns organize focused remediation work across selected alerts."],
    ["dismissal", "github-advanced-security", "What should accompany dismissal of a security alert?", "A reviewed reason supported by evidence", "No explanation", "Deletion of audit history", "A shared password", "Dismissals should be justified and auditable so risk acceptance is explicit."],
  ],
  "AZ-305": [
    ["landing-zone", "ai-engineering", "What does an Azure landing zone provide?", "A governed foundation for subscriptions, identity, networking, and operations", "One unmanaged virtual machine", "A replacement for all application architecture", "Anonymous public access", "Landing zones establish scalable platform and governance foundations."],
    ["hub-spoke", "ai-engineering", "Why use a hub-and-spoke network topology?", "Centralize shared connectivity and security while isolating workloads", "Give every workload a public IP", "Remove all routing controls", "Use one subnet for every environment", "Hub-spoke balances centralized services with workload isolation."],
    ["identity", "microsoft-security-ai", "What is the preferred application identity pattern for Azure resources?", "Managed identities with least-privilege role assignments", "Long-lived secrets in source", "Shared global administrator accounts", "Anonymous access", "Managed identities and scoped roles reduce credential exposure."],
    ["data-store", "ai-engineering", "What should primarily drive selection of an Azure data store?", "Workload access patterns, consistency, scale, availability, and governance requirements", "The product logo", "A single benchmark only", "The longest service name", "Data architecture should follow measurable workload and quality requirements."],
    ["rto-rpo", "ai-engineering", "Which requirements determine acceptable recovery time and data loss?", "RTO and RPO", "CPU and memory only", "Repository stars", "Issue labels", "Recovery time and recovery point objectives drive continuity design."],
    ["multi-region", "ai-engineering", "What is required for a credible multi-region recovery design?", "Tested replication, failover, routing, and operational procedures", "A diagram without exercises", "One larger server", "No monitoring", "Resilience depends on tested technology and operational readiness."],
    ["cost", "ai-engineering", "Which practice best supports sustainable Azure cost management?", "Measure usage, allocate costs, right-size resources, and review continuously", "Buy maximum capacity for every workload", "Disable budgets", "Ignore idle resources", "Cost optimization is an ongoing architecture and operations discipline."],
    ["monitoring", "ai-engineering", "What should an architecture observability design connect?", "Telemetry, service objectives, alerts, diagnostics, and response ownership", "Only raw logs with no retention", "Only monthly invoices", "Only CPU averages", "Observability should support detection, diagnosis, and accountable response."],
    ["migration", "ai-engineering", "What should determine whether a workload is rehosted, refactored, rearchitected, or retired?", "Business goals, technical constraints, risk, cost, and desired outcomes", "Alphabetical application name", "One vendor feature", "The number of files", "Migration strategy must align effort and risk with business value."],
    ["governance", "microsoft-security-ai", "How should an enterprise enforce consistent Azure architecture standards?", "Use management hierarchy, policy, role assignments, and automated guardrails", "Rely only on verbal reminders", "Give every user owner access", "Disable audit logs", "Governance combines scoped policy, access, automation, and evidence."],
  ],
};

function rotateOptions(
  values: readonly string[],
  correct: string,
  offset: number,
): { options: string[]; answer: number } {
  const normalizedOffset = offset % values.length;
  const options = [
    ...values.slice(normalizedOffset),
    ...values.slice(0, normalizedOffset),
  ];
  return { options, answer: options.indexOf(correct) };
}

function pairObjectives(
  certificationObjectives: readonly ObjectiveTuple[],
): ObjectiveTuple[] {
  const pairs: ObjectiveTuple[] = [];
  for (let left = 0; left < certificationObjectives.length; left += 1) {
    for (
      let right = left + 1;
      right < certificationObjectives.length;
      right += 1
    ) {
      const first = certificationObjectives[left];
      const second = certificationObjectives[right];
      pairs.push([
        `${first[0]}-${second[0]}`,
        first[1],
        `A design review must resolve both decisions: "${first[2]}" and "${second[2]}" Which answer pair correctly resolves both?`,
        `${first[3]}; and ${second[3]}`,
        `${first[4]}; and ${second[3]}`,
        `${first[3]}; and ${second[4]}`,
        `${first[5]}; and ${second[5]}`,
        `Both decisions must be correct. ${first[7]} ${second[7]}`,
      ]);
    }
  }
  return pairs;
}

function authoredQuestions(
  certificationCode: string,
  certificationObjectives: readonly ObjectiveTuple[],
): ExamQuestionDefinition[] {
  const paired = pairObjectives(certificationObjectives).slice(0, 40);
  const seeds: Array<{
    objective: ObjectiveTuple;
    variation: "decision" | "rationale";
    difficulty: number;
  }> = [
    ...certificationObjectives.flatMap((objective) => [
      { objective, variation: "decision" as const, difficulty: 1 },
      { objective, variation: "rationale" as const, difficulty: 1 },
    ]),
    ...paired.slice(0, 20).map((objective) => ({
      objective,
      variation: "decision" as const,
      difficulty: 2,
    })),
    ...paired.slice(20, 40).map((objective) => ({
      objective,
      variation: "decision" as const,
      difficulty: 3,
    })),
    ...paired.slice(0, 20).map((objective) => ({
      objective,
      variation: "rationale" as const,
      difficulty: 4,
    })),
    ...paired.slice(20, 40).map((objective) => ({
      objective,
      variation: "rationale" as const,
      difficulty: 5,
    })),
  ];

  return seeds.map(({ objective, variation, difficulty }, questionIndex) => {
    const type: ExamQuestionType =
      difficulty >= 4
        ? "case_study"
        : difficulty >= 2
          ? "scenario"
          : "multiple_choice";
    const rationale = objective[7];
    const optionValues =
      variation === "decision"
        ? [objective[3], objective[4], objective[5], objective[6]]
        : [
            rationale,
            "It removes the need for authorization, testing, and operational review.",
            "It guarantees that every workload and user will have identical requirements.",
            "It is preferred only because it avoids documenting architecture tradeoffs.",
          ];
    const correct = optionValues[0];
    const options = rotateOptions(
      optionValues,
      correct,
      questionIndex + difficulty,
    );
    const context =
      difficulty === 4
        ? "Fabrikam operates multiple teams and environments. The decision must reduce operational risk, preserve auditability, and scale beyond one project."
        : difficulty === 5
          ? "Northwind is modernizing a business-critical platform after a production incident. Leadership requires measurable reliability, least privilege, and reviewable evidence."
          : undefined;
    const prompt =
      variation === "decision"
        ? objective[2]
        : `An architect selected "${objective[3]}" for this decision: ${objective[2]} Which rationale best supports that selection?`;

    return {
      id: `${certificationCode.toLowerCase()}-${objective[0]}-v${variation === "decision" ? 1 : 2}`,
      certificationCode,
      type,
      difficulty,
      domain: objective[1],
      caseContext: context,
      prompt,
      options: options.options,
      answer: options.answer,
      explanation: rationale,
    };
  });
}

export const examQuestions: ExamQuestionDefinition[] = Object.entries(
  objectives,
).flatMap(([certificationCode, certificationObjectives]) =>
  authoredQuestions(certificationCode, certificationObjectives),
);

for (const certificationCode of Object.keys(objectives)) {
  const count = examQuestions.filter(
    (question) => question.certificationCode === certificationCode,
  ).length;
  if (count !== QUESTIONS_PER_CERTIFICATION) {
    throw new Error(
      `${certificationCode} must define ${QUESTIONS_PER_CERTIFICATION} practice questions; found ${count}.`,
    );
  }
}
