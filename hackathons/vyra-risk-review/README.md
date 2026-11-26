# VYRA Sentinel — Concurrent Finance Risk Review

An isolated VYRA module demonstrating three collaborative agents reviewing a synthetic market-access route:

1. **Evidence Scout** maps the case to the supplied regulator/statutory sources.
2. **Route Analyst** analyses jurisdiction, investor category, product and activity, then lists missing evidence.
3. **Independent Auditor** runs after the first two agents finish and challenges unsupported claims, missing citations and overstatements.

The first two agents run concurrently through Mozaik. The auditor runs after both reports arrive. A deterministic decision engine validates source IDs and release gates. A human then acknowledges, rejects or defers the report. This acknowledgement is not legal approval and never activates brokerage functionality.

## Safety contract

- Synthetic route and public-source metadata only. No customer data, accounts, trades or real funds.
- No live market execution, order routing, deposits, withdrawals, custody, referrals or customer onboarding.
- All agent claims must refer to source IDs from the supplied register.
- The deterministic engine rejects unknown/missing source references.
- Twelve release gates default to incomplete.
- Even if all gates are marked complete, the outcome remains MANUAL_LEGAL_COMPLIANCE_GO_NO_GO_REQUIRED.
- Human acknowledgement only records that a person reviewed the report; it cannot switch a regulated action on.
- LLM output is untrusted analysis, not a legal opinion or a substitute for source verification.

## Run locally

Requires Node.js 20+. The default is an offline scripted Mozaik run and requires no API key.

~~~bash
npm install
npm test
npm start
~~~

The offline run starts two analyst loops concurrently, waits for both answers, then runs the independent auditor. It uses scripted fixtures, does not call an LLM provider, and is clearly recorded as `offline-scripted-demo`.

For live model-backed analysis, copy `.env.example` to `.env`, add one of `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` or `GEMINI_API_KEY`, then run:

~~~bash
npm run start:live
~~~

The default model is `gpt-5.5`; set `MOZAIK_MODEL` to another model supported by the installed Mozaik version if needed. Live inference can incur provider charges. API keys remain local and must never be committed.

## Agent architecture

~~~mermaid
flowchart TD
 H[Human submits synthetic route] --> B((Mozaik runtime))
 B --> E[Evidence Scout]
 B --> R[Route Analyst]
 E --> S[(Shared runtime state)]
 R --> S
 S -->|Both reports received| A[Independent Auditor]
 A --> D[Deterministic source and evidence gate]
 D --> O[Blocked / human go-no-go required]
 O --> H2[Human acknowledges / rejects / defers]
 H2 --> L[JSON audit artefact]
~~~

Mozaik uses defineRuntime, RuntimeState, createAgent, createHuman, situation handlers and fire-and-forget runLoop calls. The first two analyst loops are launched from the same message.sent event and execute concurrently. The auditor reacts to analysis.ready after both analyst reports are committed. The integration test verifies that at least two inference calls overlap and that the auditor starts only after both analyst completions.

## Scoring alignment

The current Black Friday AI Hackathon finance track publishes four scoring dimensions:
- Useful finance problem (30)
- Real multi-agent concurrency using Mozaik (30)
- Runnable implementation (25)
- Source/data care (15)

This project is designed around those requirements. CI runs the Mozaik runtime integration test using a custom offline inference runner; this proves the event and concurrency flow without paid model calls. The live model path is opt-in.

## Source register

The included data/kenya-evidence.json records the public sources and their limits. It includes CMA licensing checklists, Kenya collective-investment/ISPP regulations, Kenya VASP Regulations 2026, the CBK/CMA operationalisation notice and CMA regulatory-sandbox eligibility.

The evidence pack is a curated demo subset, not the full laws or a comprehensive jurisdiction database. Verify the complete current texts and seek qualified counsel before any operational use.

## Repository and submission note

This folder is currently inside the private VYRA repository. The hackathon rules require a repository the judges can access. Do not make the main VYRA repository public because it contains unrelated product history and architecture. Before submission, copy this self-contained folder into a separate public repository, confirm its README/tests/dependencies work from a clean clone, and include a short demo video if possible.

## Competition status

The Black Friday AI Hackathon organiser listed new registration closing at 09:00 CET on 26 November 2026 and final submissions closing at midnight CET at the end of 27 November 2026. New registration therefore needed to occur before the registration cutoff. A pre-registered entrant can still submit before the final deadline, subject to the official rules.