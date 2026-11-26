# VYRA Markets — Brokerage Operating Flowcharts

**Status:** Proposed target architecture only. No regulated approval, broker connection, live custody or execution is active. The current application remains paper-only.

## 1. Regulatory decision and product activation gates

~~~mermaid
flowchart TD
 A[Proposed feature or product] --> B{Country and customer type known?}
 B -->|No| X[Block; information only]
 B -->|Yes| C[Map product, regulated activity and promotion rules]
 C --> D{Advice, solicitation, arranging, orders, custody, fund distribution or money involved?}
 D -->|Yes or uncertain| E[Obtain local legal classification]
 D -->|No| F[Review general information and data rights]
 E --> G{Licence, registration, approval or principal appointment required?}
 G -->|Yes| H[Obtain effective authorisation / appointment]
 G -->|No, documented| I[Verify partner permissions]
 H --> I
 F --> I
 I --> J{Partner, contract and marketing approved?}
 J -->|No| X
 J -->|Yes| K[Complete privacy, AML, security, support and resilience controls]
 K --> L{Testing and sign-off passed?}
 L -->|No| X
 L -->|Yes| M[Enable only approved country × product × partner features]
 M --> N[Monitor licences, contracts, complaints and incidents]
 N --> O{Permission or partner status changes?}
 O -->|Yes| X
 O -->|No| M
~~~

## 2. Customer discovery and official partner hand-off

~~~mermaid
flowchart TD
 A[Visitor opens VYRA] --> B[Choose asset class or education topic]
 B --> C[View product and provider facts]
 C --> D[Show risk, fees, legal provider, sources and verification date]
 D --> E{Country and product eligible?}
 E -->|Unknown / blocked| F[Information only; onboarding disabled]
 E -->|Approved hand-off| G[Capture consent and policy version]
 G --> H[Create pseudonymous referral event]
 H --> I[Open official partner domain]
 I --> J[Partner performs KYC, AML and customer classification]
 J --> K{Partner approves account?}
 K -->|No / pending| L[Partner handles decision; VYRA cannot override]
 K -->|Yes| M[Customer contracts directly with regulated partner]
 M --> N[Partner receives funds and holds custody]
 N --> O{Partner permits account-data connection?}
 O -->|No| P[Use official partner portal]
 O -->|Yes| Q[Approved OAuth / callback / API]
 Q --> R[Display sourced data with timestamp]
 R --> S[Daily sync and reconciliation]
~~~

## 3. Future order lifecycle — disabled until written approval

~~~mermaid
sequenceDiagram
 participant U as Customer
 participant V as VYRA
 participant P as Policy Engine
 participant B as Licensed Broker
 participant E as Execution Venue
 participant A as Audit / Reconciliation

 U->>V: Request order preview
 V->>P: Check country, account, customer and product permissions
 P-->>V: Allow with policy version or reject
 V->>B: Request authoritative quote and order preview
 B-->>V: Price, fees, buying power, restrictions and warnings
 V-->>U: Display complete order preview
 U->>V: Confirm
 V->>B: Submit with idempotency key
 B-->>V: Accepted, rejected or pending reference
 V->>A: Persist request and provider reference
 B->>E: Route under broker's own arrangements
 E-->>B: Fill, partial fill, reject or cancel
 B-->>V: Signed event or authenticated status
 V->>A: Deduplicate and persist event
 V-->>U: Show verified provider status
 A->>B: Reconcile positions, cash, fills and fees
 Note over V,B: API acceptance is not a fill; a fill is not settlement.
~~~

## 4. Provider data and privacy boundary

~~~mermaid
flowchart LR
 subgraph Customer
  U[Customer device]
 end
 subgraph VYRA
  UI[Web application]
  AUTH[Authentication and consent]
  POLICY[Country / product policy]
  API[Server API and provider registry]
  TOKENS[Encrypted scoped tokens, only if contract permits]
  AUDIT[Append-only audit records]
 end
 subgraph Regulated Partner
  KYC[Partner KYC / AML]
  BROKER[Account / portfolio / order service]
  CUSTODY[Client money and custody]
 end
 U --> UI
 UI --> AUTH
 AUTH --> POLICY
 UI --> API
 API --> POLICY
 API --> TOKENS
 API --> BROKER
 BROKER --> KYC
 BROKER --> CUSTODY
 API --> AUDIT
 BROKER -->|Approved minimum data only| API
 KYC -.->|Identity documents remain with partner by default| U
~~~

## 5. Operations, reconciliation and incident response

~~~mermaid
flowchart TD
 A[Partner events and daily statements] --> B[Verify webhook signature and deduplicate]
 B --> C[Persist source event and normalized record]
 C --> D[Reconcile cash, positions, orders, fills and fees]
 D --> E{Exact match?}
 E -->|Yes| F[Close batch and publish verified as-of status]
 E -->|No| G[Open discrepancy case with owner and severity]
 G --> H[Freeze affected feature if material]
 H --> I[Compare statements, API snapshots and event sequence]
 I --> J[Escalate to partner operations]
 J --> K[Post reversal / replacement; never rewrite history]
 K --> L[Root cause and customer communication]
 F --> M[Monitor and review]
 L --> M
 M --> N{Critical incident or licence change?}
 N -->|Yes| O[Disable affected provider, product or country]
 N -->|No| A
~~~

## 6. Deployment and release gates

~~~mermaid
flowchart TD
 A[Private GitHub change] --> B[Install pinned dependencies]
 B --> C[Unit, API contract and security tests]
 C --> D[Typecheck, lint and production build]
 D --> E{All checks pass?}
 E -->|No| F[Block deployment and fix]
 E -->|Yes| G[Preview with synthetic data]
 G --> H[Manual acceptance, accessibility and privacy review]
 H --> I{Release class?}
 I -->|Internal paper demo| J[Deploy paper-only flags]
 I -->|Partner sandbox| K[Deploy sandbox credentials only]
 I -->|Real-money production| L[Legal, partner, security and operations sign-off]
 L --> M{All launch evidence complete?}
 M -->|No| F
 M -->|Yes| N[Deploy smallest approved country × product × partner scope]
 J --> O[Monitor and rollback]
 K --> O
 N --> O
~~~

## 7. Responsibility boundaries

| Function | VYRA in the recommended first model | Regulated partner |
|---|---|---|
| Product discovery | Software, neutral information and approved hand-off | Verifies provider facts and approves permitted promotion |
| Customer account | Does not own regulated account | Owns account agreement and onboarding approval |
| KYC / AML | No final decision by default | Collects evidence, screens and decides |
| Customer money / custody | Does not receive or hold funds/assets | Holds client money/assets under its authorised model |
| Order handling / execution | No live order activity initially | Accepts, routes, executes, clears and settles |
| Referral tracking | Minimal pseudonymous attribution where approved | Supplies only contractually permitted conversion status |
| Portfolio information | Displays partner-sourced data with timestamps | Authoritative account record and statement |
| Complaints | Own platform/referral complaints and route clearly | Owns brokerage, execution, custody and fund complaints |



## 9. Implemented AccessGraph route evaluation

~~~mermaid
flowchart TD
 A[Proposed customer journey] --> B[Select jurisdiction]
 B --> C[Select customer / investor type]
 C --> D[Select product class]
 D --> E[Describe actual VYRA activity]
 E --> F{Versioned rule pack exists?}
 F -->|No| G[Unassessed: block route]
 F -->|Yes| H[Match evidence and activity rules]
 H --> I[Show source, provision, date and review items]
 I --> J[Verify regulated principal and customer category]
 J --> K[Check 12 mandatory evidence gates]
 K --> L{All evidence complete?}
 L -->|No| M[Keep onboarding, referral, execution and money movement disabled]
 L -->|Yes| N[Manual legal/compliance go-no-go]
 N --> O{Signed release decision?}
 O -->|No| M
 O -->|Yes| P[Enable only the exact approved country × customer × product × activity]
~~~

This is the current product-control prototype. The implemented rule pack covers Kenya only and is not a comprehensive legal database. Other listed countries return unassessed. Even a fully completed checklist does not itself enable production activity.

## 8. Hard-stop rules

- Unknown country, customer type, permission or product status means blocked, not assumed approved.
- No affiliate link, referral commission or financial promotion goes live without written review.
- No identity documents or source-of-funds evidence are collected by VYRA by default.
- No deposits, crypto, securities or customer money enter a VYRA account or founder wallet.
- No order is sent until licensing, contract, partner approval, security and certification gates pass.
- API acceptance is not execution; execution is not settlement; settlement is not a withdrawal promise.
- Missing events or reconciliation differences create a case, never an invented status.
- Stale or unknown quotes are never presented as current or used for execution.
- Paper balances remain clearly marked simulation and separate from partner balances.
- Disable a provider/product/country immediately when its licence, contract or critical controls become uncertain.
