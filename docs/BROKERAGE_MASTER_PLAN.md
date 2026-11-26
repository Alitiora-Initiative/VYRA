# VYRA Markets — Brokerage & Regulated-Partner Platform Master Plan

**Research cut-off:** 26 November 2026  
**Repository:** Alitiora-Initiative/VYRA  
**Status:** Foundation build / research specification. This document is not a legal opinion, licence, partner appointment, offer of securities, or approval to accept clients or money.

---

## 1. The decision: build a partner-led financial access platform, not an unlicensed broker

VYRA should be built as a software and distribution platform that makes it easier for users to discover, compare, understand, onboard with and monitor products supplied by established regulated firms. The first business model should be a controlled bridge to licensed brokers, investment banks, fund managers and custody providers. VYRA should own the digital experience, market education, product catalogue, suitability-aware navigation where permitted, user preferences, secure communications, partner hand-off, and permitted account-status visibility. The licensed partner should own the regulated account relationship, onboarding approval, KYC/AML decisions, client-money arrangements, custody, order acceptance, execution, clearing, settlement, fund administration, investment management and regulatory reporting unless a written agreement and the relevant regulator expressly allocate a function differently.

This is not a semantic distinction. Regulators assess what the business actually does, not what the website calls itself. A platform that only displays general product information and links out to a licensed provider has a different risk profile from one that solicits a customer, recommends a product, collects an order, transmits an order, handles money, negotiates execution, receives transaction-based remuneration, or markets a private fund. Each additional activity can move VYRA closer to a regulated activity. The US SEC, for example, says that finding investors, making referrals to securities intermediaries, operating securities trading platforms, participating in solicitation or negotiation, receiving outcome- or transaction-related compensation, or handling customer money can be factors in broker registration analysis. The SEC explicitly warns that even “finder” and referral activity may require registration depending on the facts. A referral button is therefore not a universal legal safe harbour.

The recommended product identity is **VYRA Markets — a partner-powered market access platform**. Until legal classification and approvals are complete, public wording should say that VYRA is a software project or partner marketplace in development. Do not call VYRA a licensed broker, exchange, custodian, fund manager, hedge fund, investment adviser, asset manager, or execution venue. Do not display partner badges, regulator logos, “insured” statements, “institutional-grade” guarantees, or claims of partner affiliation unless written evidence authorises each statement.

The strategic advantage is that VYRA can build useful software before it has the capital required to be a regulated principal. It can prove the quality of its product catalogue, educational tools, quote handling, privacy controls, referral attribution, customer support and partner integration. It can then seek a contract with a principal that is already authorised in the target jurisdiction. The partner must still approve the arrangement and the regulator may require registration, notification, approval or licensing of VYRA itself. The route reduces the need to build custody and exchange membership from nothing; it does not remove legal, conduct, capital, data-protection or operational requirements.

The initial product should not route live orders. The existing repository is a paper-trading and market-data foundation with disabled live execution slots. That is the correct safety boundary while partners, contracts, permissions and production controls remain unverified. All current balances and orders are simulated. A provider adapter interface is not evidence that a broker is connected. This plan deliberately keeps the word “live” for verified provider data and actual production order status, not mock output.

## 2. Business model and operating-model choices

VYRA must choose a legal operating model before enabling any account-opening, referral-payment, order-transmission or fund-subscription feature. These models are alternatives, not interchangeable labels.

### 2.1 Neutral discovery and general-information layer

VYRA may build a general information product catalogue, explain asset classes, show public regulatory registers, compare published fees using a consistent methodology, present risk education, and link to official provider pages. The information must be accurate, current, balanced and not tailored into a personal recommendation. Product ranking must disclose methodology and commercial relationships. A paid placement must be labelled. A “best broker for you” quiz, personalised ranking, or recommendation to buy a specific security or fund may cross into regulated advice, financial promotion or arranging, depending on jurisdiction and functionality.

The safest pre-approval experience is one in which a user chooses a category and then independently chooses to visit the provider’s official domain. VYRA should not collect trading instructions, account funding instructions, or identity-document images in this stage. It should not pre-fill provider account-opening applications unless the provider and counsel approve that exact workflow. The product must clearly disclose that the user leaves VYRA and enters the provider’s account-opening process.

### 2.2 Pure referral or affiliate arrangement

A referral relationship may generate revenue through a fixed marketing fee, qualified-lead fee, or revenue share. None of these is automatically lawful in all markets. Transaction-based compensation, compensation tied to deposits or trading volume, lead qualification, solicitation scripts, recommendations, or ongoing client servicing can increase regulatory risk. The US SEC lists referral and commission-splitting activity among examples that can trigger broker registration analysis. In the United Kingdom, financial promotions by unauthorised persons require careful treatment and approval by an appropriately authorised person where required. The FCA's social-media guidance specifically covers affiliate marketers and warns that unauthorised promotion of regulated products without appropriate approval may be a criminal offence.

VYRA must therefore start with **no commission-bearing affiliate traffic** until external counsel has reviewed the exact customer journey, jurisdictions, content, compensation formula and partner agreement. A referral code or click-out URL can be developed as a technical test using synthetic data, but must not be activated for public securities or investment solicitations. Commercial compensation terms should be disclosed, and the referral contract should prohibit VYRA from giving advice, making representations about returns, guaranteeing onboarding, receiving customer money, or modifying customer orders.

### 2.3 Appointed representative, tied agent or regulated introducer

In some jurisdictions, a firm may carry out a defined set of activities under a principal's regulatory umbrella. This is a formal status, not a casual partnership. In the United Kingdom, an appointed representative operates under a written agreement with its principal, the principal is responsible for the activities within the appointment, and the principal must make the required notification. The FCA distinguishes an introducer appointed representative from a full appointed representative: the former can undertake introductions and distribute financial promotions within its limited scope. The FCA expects the principal to check the representative's fitness, competence and financial soundness, and to oversee activity. An appointment does not authorise VYRA to exceed the written scope or to represent itself as independently authorised.

Under MiFID II Article 29, an investment firm may appoint a tied agent to promote services, solicit business, receive and transmit orders, place financial instruments and provide advice within the permitted arrangement. The investment firm remains fully and unconditionally responsible for the tied agent's actions and omissions when acting for it, and the tied agent must disclose the capacity in which it acts and the firm represented. National implementation and registration rules apply. This is a possible model for particular European markets only after a principal confirms it can appoint VYRA and counsel validates the requirements.

The Kenyan 2023 consolidated regulations define an intermediary services platform as an electronic application or other platform facilitating marketing and distribution of approved collective investment schemes, and define its provider as an intermediary between fund managers and investors. The framework requires a licence to operate an intermediary service platform, a written agreement with a licensed fund manager, business plan, adequate capital, office and people, fit-and-proper governance, platform and security evidence, business continuity, audit trails, risk management, data protection, AML/CTF, cybersecurity and complaints processes. The Authority’s 2025 general licensing regime and current checklists must also be reviewed before applying. Do not assume that an ordinary affiliate contract can replace an ISPP licence.

### 2.4 Broker-as-a-service or white-label brokerage

A brokerage infrastructure partner can provide account creation, identity checks, money movement, execution, custody, clearing and reporting APIs. Depending on the contractual model, the platform can operate as the regulated broker, an appointed/introducing intermediary, a software provider, a registered adviser, or a technology vendor to a regulated entity. Each model changes the onboarding data, permissions, client disclosure, regulatory responsibility, capital, insurance, recordkeeping and operational obligations. The vendor's technology does not automatically lend its licence to VYRA.

The preferred model to investigate first is a fully disclosed or partner-led arrangement where each customer has a direct account relationship with the regulated partner and the partner controls onboarding approval, customer money, custody and execution. VYRA should initially receive only the minimum permitted status and portfolio data needed for the user interface. An omnibus arrangement may require VYRA to manage additional sub-ledgers, allocations, reconciliations and client-account records, which is not appropriate without substantial compliance and operating capital. Do not select omnibus simply because it appears technically easier.

### 2.5 Own broker or dealer licence

Owning a brokerage licence may eventually provide more control over economics, product access and user experience. It also brings capital requirements, management experience and fit-and-proper assessments, compliance officers, internal controls, audit, safeguarding or custody arrangements, regulatory reporting, complaints, systems testing, business-continuity resources and ongoing supervision. A licence in Kenya does not give VYRA permission to serve customers globally. A foreign licence does not automatically authorise solicitation of Kenyan residents.

This is a later-stage decision based on a genuine business case, partner data, legal advice, adequate funding and a realistic regulatory capital plan. It is not a near-term workaround for a zero-capital project. The initial roadmap must not assume that raising capital or receiving a partner's licence is automatic.

## 3. Kenya is the first regulatory perimeter to resolve

VYRA is being built by a Kenya-based founder, so the first legal workstream must establish the treatment of Kenyan residents and the entity through which the product would operate. It is sensible to design for international expansion, but not to launch globally before country-specific permissions have been mapped. A user location selector is not a licensing analysis. The customer residence, location at solicitation, product, partner entity, marketing channel, account structure, and where the regulated activity occurs may all matter.

The Capital Markets Authority (CMA) is the key starting authority for securities, investment products, online forex and intermediaries in the Kenyan capital market. Its public licensing checklist page currently lists Broker Dealer, Custodian, Fund Manager, Investment Adviser, Intermediary Service Platform Provider (ISPP), Stockbroker, Non-Dealing Online Forex Broker and other checklists. The CMA states that its checklists are only summaries and the underlying regulations are the conclusive requirements. The live licensee portal separates categories such as stockbrokers, fund managers, non-dealing online forex brokers, dealing online forex brokers, authorised securities dealers and ISPPs. VYRA must verify each prospective partner in the live register immediately before signing and before publishing any referral link.

The most important local development is the CMA announcement dated 17 November 2026. The Authority said it had granted two ISPP licences, an investment-based crowdfunding platform operator licence and two Non-Dealing Online Foreign Exchange Broker licences. It described Reserve X Labs Limited as an ISPP under the 2025 General Licensing Regulations, connecting investors including the Kenyan diaspora to CMA-approved capital-markets products. Its first product was to be the SIB Fixed Income Fund in partnership with Standard Investment Bank. The press release described investor verification, account approvals, a secure registry and audit-ready reporting, and said that licensed fund managers, investment banks and accredited intermediaries retain responsibility for execution, asset management and custody. This is a strong local business-model reference, but it is not an approval for VYRA. The actual licence scope, agreement and permitted marketing activities must be confirmed directly.

### 3.1 ISPP route

An ISPP is the leading Kenyan model to investigate if VYRA wants to present multiple approved investment products through one digital interface. The 2023 collective investment regulations include a definition covering electronic applications facilitating marketing and distribution of approved collective investment schemes, with the ISPP acting as intermediary between fund manager and investor. Regulation 76 requires a licence to operate such a platform and says a licensed ISPP needs approval before marketing and distributing collective investment schemes from multiple fund managers. Regulation 77 lists evidence expected in an application.

The documents and controls named in Regulation 77 include:
1. Evidence of incorporation or establishment.
2. A written agreement with a licensed fund manager covering each party's roles, rights and duties, liabilities, dispute resolution, complaints handling and investor protection.
3. A business plan describing the platform, the value it adds to the capital markets and financial projections.
4. Evidence of adequate capital, office and human resources.
5. Organisation structure and fit-and-proper profiles of directors, shareholders, management and key people.
6. Detailed platform information, system capacity, security measures, user terms and evidence of functionality.
7. Business continuity and disaster recovery plan.
8. Recordkeeping procedures and audit trail.
9. Risk management framework, fraud prevention measures, risk matrix and mitigations.
10. Data protection policy.
11. AML and counter-terrorism-financing policy.
12. Cybersecurity policies and procedures.
13. Complaint management policies and procedures, including lodging, acknowledgement and resolution.
14. Risk management policies and procedures, plus applicable licensing fees and any additional information requested by CMA.

The current 2025 General Licensing Regulations and CMA's updated 2026 checklists must be read alongside the older consolidated regulations. Do not rely on a third-party summary for the controlling text. The Authority's licensing webpage says checklists were updated on 15 September 2026; it also explicitly advises applicants to read the statutory regulations. The first legal task is to download and reconcile the current ISPP and broker-dealer checklists against the current 2025 instrument. Ask CMA, in writing, whether VYRA's exact proposed functions — product discovery, neutral comparison, referral links, lead capture, account application prefill, partner status APIs, and later portfolio visibility — fall within the ISPP scope or another category. Keep a record of the response.

### 3.2 Online forex and CFD route

Kenya regulates online foreign-exchange trading through a separate framework. The CMA describes non-dealing online forex brokers as licensed entities linking clients to the foreign exchange market for commission or spread mark-up without making a market against clients. Dealing brokers act as principal/market maker. The CMA register lists the authorised local entities and should be the authoritative starting point for any Kenyan forex referral. Forex CFDs and leverage are high-risk products; VYRA should not add them to the first partner catalogue merely because a provider offers them internationally.

VYRA must not accept or transmit forex/CFD orders, manage trading balances, operate a dealing book, or provide money-management signals for customers without a clear licensed model. If the desired user experience is a direct hand-off to a Kenyan licensed non-dealing broker, obtain a written referral/appointed status and marketing approval. Confirm the broker's precise licence category and product permissions. The customer must be onboarded and funded directly with the provider. Do not use a foreign broker's offshore entity as a substitute for an entity authorised to serve the customer in Kenya.

### 3.3 Hedge funds and alternative investment funds

The founder's ambition to connect investors with established funds should be treated as a distinct product vertical, not as an ordinary stocks-and-shares referral. Kenya's Alternative Investment Funds Regulations, 2023 expressly include hedge funds within the categories of alternative investment funds that require CMA approval. The regulation says no person may operate or hold itself out as an alternative investment fund without applying for and obtaining approval. It also says the fund is not to make an invitation to the public to subscribe to its securities. The eligibility considerations include fit-and-proper governance, an experienced key investment team (including at least one key person with five years' relevant experience), infrastructure and human resources, investment objectives, targeted investors, assets, strategy and tenure.

This means VYRA should not build a public “invest in famous hedge funds now” funnel or market a private fund to every retail user. A fund's minimum subscription, investor qualification, jurisdiction, capacity, redemption terms, lock-ups, side letters, risk factors, audited track record, administrator, auditor, custodian and offering memorandum must be verified. Many hedge funds only accept professional, accredited, institutional or other qualified investors, and access is often invitation-only. The exact investor eligibility standard differs by fund and jurisdiction. The fund manager, administrator and counsel must determine who can receive an offer and what constitutes a permissible approach.

The sensible first product is an **institutional strategies directory** that explains what different strategies are, identifies the legal fund manager, links only to approved public disclosures, and routes eligible investors to the fund manager's own qualification and onboarding process. No investor capital should pass through VYRA. If VYRA is facilitating subscriptions, matching investors to specific funds, or distributing private fund interests, stop and seek counsel and regulator guidance before enabling that workflow. A regulated ISPP may be relevant for Kenya-approved collective investment schemes, but that does not imply blanket authority for every hedge fund, offshore partnership or private placement.

### 3.4 Data protection and cross-border data transfers

The Office of the Data Protection Commissioner (ODPC) is relevant from the first collection of personal information. The Kenyan Data Protection Act and Regulations cover controller and processor responsibilities, transparency, lawful basis, security, retention, data-subject rights and cross-border transfers. The ODPC's registration rules specifically identify provision of financial services as a processing purpose for which registration is mandatory. If VYRA is a controller, processor, or both, the classification and registration obligations must be checked before onboarding real customers.

The ODPC published 2026 cross-border transfer guidance with standard clauses for controller-to-controller and controller-to-processor transfers. Before moving Kenyan identity, account or transaction data to a partner or cloud region outside Kenya, map the data flows, decide who is controller and processor, identify lawful transfer conditions, execute appropriate legal instruments and safeguards, assess the recipient's legal framework and security, and document the assessment. A generic privacy-policy sentence is not enough. VYRA should minimise personal data and let a licensed partner collect KYC documents directly wherever possible.

## 4. International expansion: one jurisdiction at a time

VYRA should not use “global” as a licence category. Build a country rule engine and onboard only when the provider contract, legal opinion and regulatory permissions support the user's jurisdiction and product. Maintain an allow-list per legal entity, provider, customer residence, customer type and asset class. A country being listed in a partner's generic international marketing page does not prove that the VYRA business model is available to a Kenyan entity or Kenyan residents.

### United Kingdom

Possible models to examine are a neutral referral arrangement, an introducer appointed representative (IAR), or an appointed representative (AR) under an authorised principal. The FCA says an IAR can carry out limited activities — introductions and distributing financial promotions — and a written agreement with the principal is required. The principal's permission must cover the regulated activity, the principal must notify the FCA at least 30 calendar days before appointment, and the AR must operate within the principal's oversight. The full AR model is broader and should be considered only where the principal has approved the activity and the necessary controls are in place.

Financial promotions are a separate gate. FCA guidance on social media applies to unauthorised persons including influencers and affiliate marketers. VYRA must have pre-approved, version-controlled copy and creative. Do not let referral partners, creators or affiliates publish unapproved return claims, urgency, performance figures or misleading risk comparisons. Product pages must be fair, clear and not misleading. The FCA Handbook's Article 25 guidance describes arranging deals in investments broadly, including arrangements with a view to transactions, and stresses the importance of the introducer's role in the chain of events. Get a UK regulatory perimeter opinion before deciding that a click-out or commission is outside the perimeter.

### European Union

MiFID II Article 29 sets the tied-agent model. The regulated investment firm remains responsible for its tied agent's actions and omissions within the appointment, and the agent must disclose the represented firm and its capacity. National competent authority registration and national implementation must be checked country by country. The business must also test whether each product is within the partner's MiFID permissions and whether retail distribution, complex products, inducements, appropriateness, suitability, best execution, conflicts, complaints and investor-protection rules apply.

Upvest is a candidate to assess for European embedded-investment infrastructure. Its published developer documentation describes three operating models: “Take Our License” for single accounts, “Bring Your Own License” for single accounts, and “Bring Your Own License” for omnibus accounts. It instructs developers to select an operating model before implementation and to contact the provider for API keys. This is an important reminder that legal responsibility and account structure shape the API. It is not evidence that Upvest is available for a Kenyan company, that it will onboard VYRA, or that it supports all countries VYRA wants to serve.

### United States

The US broker-dealer perimeter is particularly important for securities referrals, transaction-based compensation, hedge-fund solicitation and platforms. The SEC's broker-dealer registration guide notes that finders, referrers, commission splitters, people finding investors for hedge funds or private placements, securities platform operators and people handling funds or securities can be within the broker analysis depending on facts. The SEC considers transaction solicitation, negotiation, execution, transaction-related compensation and control of funds or securities. VYRA must not rely on a “finder” label or offshore company to bypass this.

Alpaca's Broker API documentation describes a complete brokerage experience around account opening, funding and trading, with use cases including fully disclosed and omnibus broker-dealer models and registered investment advisers. Its current marketing states 300+ global partners, 60+ partner countries and 10 licences as of November 2026. These are company-published platform claims, not an eligibility confirmation for VYRA. Alpaca must confirm in writing whether it would accept a Kenyan-incorporated partner, which entity would serve Kenyan customers, which countries and customer types are supported, who owns the regulatory relationship, and all commercial and capital requirements.

DriveWealth documents an API-first brokerage infrastructure providing account opening, funding, trading, custody, clearing and regulatory reporting for embedded-investing partners. It lists US equities, ETFs, mutual funds, options and fixed income as supported products. It is a credible candidate for US securities infrastructure discovery, but its actual country coverage, VYRA eligibility, operating model and fees must be confirmed in a partner discussion. Do not infer the ability to serve Kenya from a description of EMEA or APAC customers.

### Australia and other markets

ASIC states that an Australian financial services licence generally authorises financial product advice, dealing, market making, scheme operation and custodial/depository services, among other activities. ASIC's RG 36 explains when financial product advice and dealing are regulated. A platform that publishes recommendations, arranges transactions or markets products should not assume that a referral-only label removes the need for authorisation. Australia is not a launch market until the customer journey and partner permissions are reviewed.

Other jurisdictions require the same discipline: identify the local regulator, regulated activities, licensing and representative routes, retail/professional categories, promotion rules, client-money protection, data localisation/transfer requirements, complaints/compensation arrangements and partner eligibility. The United Arab Emirates, South Africa, Singapore, Canada, Japan and other attractive markets should each be documented separately before user acquisition. The platform should default to a blocked or information-only state when the law or partner eligibility is unknown.

## 5. Partner shortlist and due diligence

The providers below are a research shortlist, not confirmed partners. None has agreed to work with VYRA, and none should be described as integrated. Every commercial provider will conduct due diligence, may require a licensed entity, business history, financial resources, volumes, management experience, technology/security review, and minimum commercial commitments. A zero-capital founder should expect a long sales process and possible rejection. The plan is to approach them with a credible prototype, clear legal model, target market, operational design and staged customer forecast — not to promise a production launch.

### 5.1 Interactive Brokers (IBKR)

Why it is relevant: IBKR operates broad multi-asset brokerage infrastructure and has an established Introducing Broker programme, Broker Portal, client application tools, white branding and account-management APIs. Its public materials describe registered investment advisors and introducing brokers using digital account-management tools for registration, funds and banking, transfers and reports. It also has a no-code client application workflow for eligible registered advisors and introducing brokers. This can potentially allow a lower-cost first integration than building an entire brokerage stack, because the client account and provider workflow remain on IBKR.

What must be confirmed: IBKR's acceptance of a Kenya-incorporated organisation; whether VYRA can be an introducing broker or only an approved software/marketing provider; country and product permissions; licensing requirements in Kenya and each destination country; account ownership and customer contracting; compensation and fee mark-ups; white-label terms; account minimums and operating requirements; API access; onboarding and KYC allocation; customer support responsibilities; and whether clients in Kenya can open the relevant accounts.

Recommended use: first candidate for a regulated partner discovery conversation focused on a direct client relationship and official account hand-off. Do not build a production integration before IBKR confirms a VYRA-specific approved model.

### 5.2 Saxo Bank / Saxo institutional and introducing-broker services

Why it is relevant: Saxo publicly offers institutional, introducing broker and white-label services covering multiple asset classes, execution, risk, post-trade operations, custody, client reporting, trading APIs and platform services. Its partner materials distinguish purely introducing, order-assistance and discretionary models, and show that the licence requirement varies by partner model and jurisdiction. Saxo's white-label materials describe global stocks, bonds, funds, ETFs, FX, options, CFDs, commodities and futures, with integrated post-trade and custody services.

What must be confirmed: eligible VYRA entity and residence countries; minimum scale and capital requirements; whether a pure introducer model is available to the company; licence category required; ability to service retail customers in Kenya; custody and asset segregation framework; partner compensation; user branding and client ownership rules; onboarding responsibilities; and market data costs. Do not interpret a broad range of instruments as permission for VYRA to promote every instrument.

Recommended use: second candidate for institutional multi-asset outsourcing. Saxo may be commercially and operationally more substantial than a simple referral programme, so VYRA should first demonstrate the legal and business model.

### 5.3 Alpaca Broker API

Why it is relevant: Alpaca's Broker API describes full lifecycle brokerage functionality, from onboarding and funding through trading, clearing and custody, with fully disclosed and omnibus models. Its current platform marketing says 60+ partner countries and 10 global licences. Public documentation and API examples make it an attractive candidate for a developer-led build.

What must be confirmed: partner entity requirements; direct Kenyan eligibility; whether Kenyan residents can be served via the exact contracting entity; account type and customer ownership; licensing or regulatory approvals imposed on VYRA; KYC and funding responsibilities; product permissions by market; costs, minimums and settlement arrangements; and whether the 60+ partner-country statistic includes the intended partner model and customer residence. A global API is not a global authorisation for VYRA.

Recommended use: technical discovery and comparison for an equities/ETF-first service. Avoid adding options, margin and crypto to the first release unless each product is expressly approved.

### 5.4 DriveWealth

Why it is relevant: DriveWealth's official developer documentation describes regulated, API-first infrastructure serving financial institutions and technology companies, including account opening, funding, trading, custody, clearing and regulatory reporting. It documents self-directed and robo-advisory account experiences, order APIs and client onboarding data.

What must be confirmed: Kenya and target-country availability; approved operating model for VYRA; regulated entity and customer contract; securities custody and clearing; onboarding evidence and KYC vendor roles; integration and monthly minimums; market-data costs; production SLAs; incident responsibilities; and whether VYRA must hold its own broker/adviser permissions.

Recommended use: discovery for embedded US securities, preferably a partner-led fully disclosed model. Start with a small instrument scope and ensure every customer account belongs to the regulated provider.

### 5.5 Upvest

Why it is relevant: its Investment API supports embedded investing experiences and documents explicit license-taking and bring-your-own-licence models. It is useful for understanding how licensed infrastructure vendors divide legal accountability and operational roles.

What must be confirmed: geographies, partner eligibility, customer types, minimum scale, instruments, account custody, entity requirements, commercial terms and whether any non-European use is supported.

Recommended use: future European expansion research, not the default Kenyan MVP.

### 5.6 TradingView and chart vendors

TradingView can be evaluated for charts and potential broker integrations, but a charting provider is not a custodian, broker, investment fund or source of regulatory permission. Before embedding advanced charts, check real-time market data licences, exchange agreements, redistribution rights, non-display usage and whether delayed data may be displayed to retail customers. Charting SDK and platform pricing may require commercial approval. The initial chart layer can remain a clearly labelled, provider-sourced visualisation of permitted market data.

### 5.7 Technology vendors that are not brokers

White-label technology providers such as broker CRM, dealing-desk, bridge, liquidity aggregation, platform and back-office vendors can supply software to an already authorised broker. They are not a substitute for the regulated principal, clearing broker, custodian or liquidity counterparty. VYRA should not buy a “white-label broker package” and assume it now has a brokerage licence. If a later licensed principal selects a technology vendor, VYRA can integrate the principal's approved stack through a documented responsibility matrix.

## 6. Partner selection scorecard

Every candidate should be evaluated on a standard record with evidence attached. Score each dimension from 0 to 5, but weight regulatory eligibility and custody higher than the number of instruments. A partner that has every asset class but cannot legally serve the intended country scores zero for that market.

| Dimension | Weight | Evidence required |
|---|---:|---|
| Legal ability to serve target residents | 20% | Regulator register, written country acceptance, contracting entity |
| Operating model and licensing fit | 15% | Agreement model, authorisations, regulator approvals/notifications |
| Client money, custody and clearing | 15% | Legal entity, custody structure, segregation, statements, compensation regime |
| KYC/AML and sanctions workflow | 10% | Responsibility matrix, screening standards, escalation, audit evidence |
| Products and execution | 10% | Product permissions, venue coverage, order types, execution policy |
| Technical capabilities | 10% | API docs, sandbox, webhooks, idempotency, reconciliation, status page |
| Resilience and security | 5% | SOC/ISO evidence, incident process, BCP/DR, penetration testing |
| Customer support and complaints | 5% | SLA, escalation contacts, complaints allocation |
| Commercial fit | 5% | Setup, monthly minimums, per-account/per-trade costs, revenue share |
| Exit and portability | 5% | Data export, client transfer, termination and transition rights |

Hard disqualifiers: no verifiable regulatory licence for the service; no confirmation of customer-country eligibility; no clear account owner; money is paid to VYRA or a founder's personal account; no custody/counterparty evidence; inability to reconcile transactions; opaque spread or fee economics; pressure to advertise guaranteed returns; no complaint process; unresolved sanctions/AML controls; no data protection and transfer agreement; or refusal to explain what legal entity contracts with the customer.

The partner record must include legal entity name, company number, licence number, regulator, permissions, website, official register link, date checked, countries served, product scope, customer categories, account type, KYC owner, funds/custody owner, execution owner, clearing owner, complaints owner, data roles, security evidence, costs, minimum volumes, API version, test-environment details, settlement cycle, market-data rights, marketing approval contact, contract owner and review date. A provider's brand name alone is not sufficient.

## 7. The VYRA product architecture

The existing application already contains a useful early foundation: Next.js UI, Supabase SSR authentication code, provider adapters for crypto and Twelve Data, paper accounts, paper orders, risk checks, a double-entry paper ledger, watchlists, audit events and disabled live-execution adapter slots. These components are useful for a future broker-facing experience, but they are not a production brokerage. The next architecture should add strong domain boundaries rather than connect every provider directly to the dashboard.

### 7.1 Core bounded contexts

1. Identity and access: authentication, user profiles, consent, sessions, MFA, device/session risk and authorised support access.
2. Jurisdiction policy: country of residence, current location where legally relevant, customer type, age, sanctions and product availability. A rule decision must be stored with policy version, time, inputs and outcome.
3. Partner directory: regulated entities, licences, service scope, onboarding URL, supported countries, product list, disclosures, status and contract version.
4. Referral attribution: first-party click records, campaign/partner codes, consent state, attribution expiry, partner callback reconciliation and anti-fraud controls. It must not turn into trade capture or advice by accident.
5. Product catalogue: instruments, fund products, asset class, issuer/fund manager, legal wrapper, risk, currency, domicile, market, eligibility, fee schedule, documentation and source timestamp.
6. Market data: separate licensed quote providers, exchange/data entitlements, stale-data handling, source attribution, delayed/live flags and terms of use.
7. Partner onboarding: explicit hand-off or approved embedded onboarding, partner application state, KYC result status only where contractually permitted, and support references. VYRA should not store identity documents by default.
8. Portfolio visibility: partner-sourced balances and positions with source, as-of timestamp, account identifier token, reconciliation status and no local fabrication.
9. Order management: only when a provider authorises integration. Use a canonical order model but keep each asset class's order constraints, trading calendar, currency, fractional rules and product permissions separate.
10. Ledger and reconciliation: partner statements, balances, cash movements, fees, fills, positions and daily exceptions. VYRA's existing paper ledger remains separate from the production partner's books.
11. Compliance and oversight: screening and case-management references, complaints, marketing approval, conflicts, monitoring alerts, regulatory records, retention and audit trails.
12. Operations: provider status, incidents, alerts, change management, service-level reporting, business continuity and disaster recovery.

### 7.2 Provider adapter pattern

The current asset-class interfaces should evolve into a provider capability registry. Each provider must declare a supported capability matrix: market data, instrument search, account creation, KYC status, deposits, withdrawals, balances, positions, orders, cancels, fills, statements, corporate actions, reporting, complaints and webhooks. Unsupported operations must return an explicit unsupported result; they must never silently fall back to paper or mock execution. An adapter must include a provider environment (sandbox or production), account entity, region restrictions, API version, authentication method, idempotency behaviour, rate limits, webhook verification, retry rules and reconciliation requirements.

Use a strict provider environment switch. Sandbox credentials must never call production; production credentials must never be used by tests. A single capability endpoint should return verified readiness flags derived from configuration and a recent provider health check. “Connected” is only true after successful authenticated API access, account permission validation, and required provider test cases. “Trade enabled” is only true after the partner grants permission, production credentials are configured in server secrets, the regulatory gate is green, and operational sign-off is recorded.

### 7.3 Customer account and ownership model

For the recommended fully disclosed partner model, the partner should be the legal provider and account custodian. The user logs in to the partner's official or approved embedded onboarding flow and signs the partner's agreements. VYRA stores a non-secret external account reference or pseudonymous mapping, not the partner's credentials. It must not ask users to share broker passwords or API keys. Partner API access to balances or orders should use OAuth or other provider-approved delegated authorisation and narrowly scoped tokens.

If a customer has multiple providers, each portfolio must remain distinguishable. A VYRA consolidated view is only an informational aggregation, and each position must state its source and last update. The dashboard must not describe an aggregation as an official statement. Cash, buying power, unsettled cash, margin, pledged assets, crypto balances, accruals, dividends, corporate actions, open orders and pending withdrawals must be separately represented. Never combine customer cash across legal entities without the actual legal and accounting basis.

### 7.4 Market data architecture

Market data and trade execution are different services. VYRA must have rights to display data to its intended end users. A free developer plan may be useful for prototyping but may not permit commercial display, redistribution or derived data for unlimited users. Each instrument needs an exchange/provider source, market status, quote currency, time zone, as-of timestamp, delayed/live flag and data entitlement. Use cache keys with region and entitlement where relevant. Do not backfill a missing quote with a last-known price without labelling it stale.

The current CoinGecko and Twelve Data adapters are development providers. They do not provide a full consolidated market-data feed across every exchange. Before a commercial securities launch, negotiate the correct market-data licences through the broker partner or licensed vendor. Exchange fees can be material. If data is delayed, label it; do not use delayed quote data to certify an order price or portfolio valuation. A paper order may only use a quote if it is within a strict age window and in the correct quote currency. Keep the current paper-trading protections until a broker partner provides its own authoritative order preview and risk checks.

### 7.5 Order routing, execution and settlement

VYRA must not build an execution engine first and then search for a licence. A production order flow must start from a customer account that the provider recognises and a product that the provider allows for that client. Before submission, the partner must validate account status, permissions, available cash, buying power, short/borrow eligibility, order type, quantity, price, trading session, market status, suitability/appropriateness where required, concentration/margin and sanctions or restrictions. VYRA should display the partner's official order preview and warnings, obtain user confirmation, and send the order through an approved server-side API. It must use provider idempotency keys and persist an immutable order audit record.

Execution events are asynchronous. Do not mark an order as filled just because an API accepted it. Use signed webhooks or authenticated polling to observe accepted, pending, partially filled, filled, cancelled, rejected and expired states. Reconcile event sequence gaps with provider statements or API snapshots. Record raw provider event IDs and timestamps. A cancel request is not a cancellation until the provider confirms. Partial fills, fees, FX conversions, rounding, corrections, trade busts, corporate actions and settlement failures must be modelled explicitly.

Settlement is distinct from execution. A filled trade may not be settled immediately. Display available-to-trade cash, settled cash, unsettled cash and withdrawal-available cash as separate partner-sourced values. Do not promise an instant withdrawal. The partner's settlement rules, local holidays, cut-off times and banking rails control. Customer funds must never be paid to VYRA operating accounts or founder wallets.

### 7.6 Reconciliation and accounting

Use a daily reconciliation process comparing provider cash, positions, open orders, fills, transaction fees, corporate actions, dividends, taxes and external movements. Differences create durable cases with severity, owner, ageing, evidence and resolution. A production financial ledger should be immutable, double-entry and keyed to legal entity, currency, customer account, provider, settlement date and transaction reference. Any correction is a new reversing and replacement journal, never an edit to the old transaction.

The existing paper ledger is a simulated training ledger and must be physically or logically separated from real partner data. Do not rename the current mock USD 100,000 balance as a live brokerage balance. If partner balances are aggregated, read them from the partner and display the timestamp and legal source. Never use a user-entered balance as an execution authority.

## 8. Security, resilience and privacy foundation

A financial platform must be secure by design before it has live customers. The following are minimum design controls, not a substitute for external penetration testing or a regulator's standards.

### 8.1 Identity and privileged access

Use MFA for staff and administrative users. Separate customer, support, compliance, developer and production-operations roles. Enforce least privilege and just-in-time elevated access. Support users must not see full identity documents or full account numbers without a recorded purpose and approval. A support impersonation mode must be read-only by default, time-limited, and fully audited. Production deploy access must be restricted, with branch protection and review requirements.

### 8.2 Secrets and keys

Never commit provider API secrets, service-role keys, database passwords, OAuth client secrets, private keys or signing material to GitHub. Store them in the hosting provider's secret manager. Use separate keys for sandbox and production, rotate credentials, and revoke on suspected compromise. Service-role keys belong on server-only code paths. Browser bundles must contain only public keys designed for browser use. Add automated secret scanning and dependency scanning to CI. Do not paste credentials into chats, public issues or screenshots.

### 8.3 Application and database protection

Require row-level security for every exposed user-owned table. Verify all RPC function ownership, execution grants, SECURITY DEFINER use and search paths. Prevent IDOR by resolving account and provider references only after verifying the current user's authorisation. Validate all server-side input with strict schemas, enforce same-origin protections for cookie-authenticated mutations and rate-limit login, account creation, referrals and sensitive APIs. Add abuse detection, bot protection, secure headers, CSP, CSRF controls where relevant, and safe error messages that do not leak provider tokens or SQL internals.

The current Supabase project limit blocks a dedicated VYRA project in the only available organisation: the organisation has two active free projects and the free-project limit is two. The two existing projects are 9N8 and Space Ledger. Neither has been paused or modified. VYRA must not be connected to either product database. The schema should remain a reviewed migration in Git until a dedicated database project with approved capacity is available. Do not put VYRA production tables into a different product's project simply to get a green check.

### 8.4 Audit and evidence

Record authentication, consent changes, country-gate decisions, product eligibility outcomes, referral hand-offs, marketing approvals, partner credential changes, staff access, data exports, complaint events, provider webhook receipts, order lifecycle events and reconciliation actions. Audit data must be append-only where feasible, time-stamped in UTC and protected from ordinary customer edits. Maintain log retention in line with legal obligations and a schedule for access reviews. Sensitive data should be redacted from general application logs.

### 8.5 Availability and recovery

A free hosting tier is suitable for development and controlled demonstrations, not proof of production brokerage resilience. A real-money service needs a tested disaster-recovery plan, recovery time objective (RTO), recovery point objective (RPO), database backups, restore tests, vendor outage procedures, security incident response, on-call ownership and customer communications. The platform should fail closed when a provider or risk-control service is unavailable. A market-data outage must not trigger an order submission using stale quotes. A webhook outage must lead to reconciliation, not assumed success.

## 9. Documentation and legal pack required

There are two separate document libraries: (A) VYRA's corporate and licensing pack, and (B) operational/customer/vendor documents. All drafts should be dated and versioned. Each document should have an owner, approver, review date and related jurisdiction. Obtain local legal counsel to tailor documents; do not copy a broker's disclosures and present them as VYRA's own.

### 9.1 Corporate and ownership pack

- Certificate of incorporation and current company registry extract.
- Memorandum and articles / constitutional documents.
- Share register, beneficial ownership register and group structure chart.
- Director, shareholder and controller identity/address declarations.
- Board resolutions approving the business plan, regulatory applications, bank mandates, data protection officer or compliance appointments where appropriate.
- Organisation chart with responsibility and reporting lines.
- Director and key-person CVs, qualifications, references, regulatory history and fit-and-proper declarations.
- Shareholder source-of-funds/source-of-wealth evidence where required.
- Office and business address evidence, plus outsourcing and remote-working arrangements.
- Tax registration, beneficial ownership and statutory filings.
- Audited accounts where available; opening balance sheet and credible capital evidence where applicable.
- Three-year financial model with base, downside and stress assumptions.

### 9.2 Kenyan regulatory application pack

For an ISPP application, use the current CMA ISPP checklist and the current 2025 General Licensing Regulations. Based on the published requirements, prepare the written licensed-fund-manager agreement; full business plan and financial projections; proof of capital and operational resources; organisational chart; fit-and-proper files; system architecture and security documentation; platform demonstrations; business continuity and disaster recovery; recordkeeping and audit-trail procedures; fraud controls and risk matrix; data-protection policy; AML/CTF policy; cybersecurity policy; complaints policy; risk-management procedures; applicable fees; and additional information requested by CMA. The 2023 regulations expressly describe these information categories, but the 2025 regime and 2026 checklists must be reconciled by counsel before filing.

For a broker-dealer, stockbroker, non-dealing online forex broker, investment adviser or other licence, obtain the corresponding current checklist and applicable rules. Do not use the ISPP pack to apply for a broker licence. The required paid-up capital, liquid capital, key people, systems, insurance, audits and permissions can vary by category and have changed in the current licensing framework. Do not rely on old 2023 draft fee schedules. Obtain the latest fee schedule directly from CMA and calculate a full capital requirement with counsel.

### 9.3 Compliance and conduct policies

- Compliance manual and regulatory obligations register.
- AML/CTF policy, customer risk rating, source-of-funds/source-of-wealth procedures, sanctions and PEP screening, ongoing monitoring, suspicious-activity escalation and staff training.
- Customer onboarding and eligibility policy.
- Financial promotions and advertising approval policy.
- Product governance and product due-diligence policy.
- Conflicts of interest and inducements policy, including referral payments and ranking methodology.
- Best execution and order handling policy where VYRA is permitted to handle orders.
- Suitability/appropriateness policy if advice or complex products are permitted.
- Customer communication and disclosure standards.
- Complaints policy, acknowledgement/resolution SLAs and regulator escalation.
- Vulnerable-customer and financial-difficulty policy.
- Record retention, legal hold and deletion schedule.
- Outsourcing and third-party risk management policy.
- Business continuity, disaster recovery and incident response policy.
- Cybersecurity, vulnerability management and access-control policy.
- Data protection, privacy, consent and breach response policy.
- Staff dealing, insider information, gifts, personal account dealing and whistleblowing policies where relevant.

### 9.4 Customer documents

Only publish documents appropriate to the actual operating model. The future pack may include terms of use, privacy notice, cookie notice, risk disclosure, partner disclosure, referral/compensation disclosure, complaint route, data-sharing notice, consent records, product fact sheets, fee schedule, order handling/execution disclosures, account-opening partner agreements, and customer support responsibilities. Each partner's own account agreement, custody disclosure, execution policy, fee schedule, product disclosure and risk document must be accessible before the user commits to the provider.

Do not use VYRA's terms to imply it accepts customer deposits or holds assets. If the customer contracts directly with the broker, clearly state that the partner — not VYRA — is responsible for regulated account services. Avoid ambiguous expressions such as “your VYRA brokerage account” until that is legally and operationally correct. Explain that different providers can have different fees, protections, eligibility, withdrawal times and complaint routes.

### 9.5 Partner and vendor contract pack

- Mutual NDA for preliminary partner conversations.
- Partnership term sheet and legal operating-model summary.
- Referral or introducer agreement with permitted activities, territory, customer categories, commission, disclosures, marketing approval, recordkeeping, audit, complaints, indemnities, termination and customer transition.
- API/technology agreement with sandbox and production scope, uptime commitments, rate limits, data rights, security, incident notice, support, change management, IP, audit, penetration testing and termination.
- Data Processing Agreement (DPA), controller-to-controller data-sharing agreement, and appropriate cross-border transfer safeguards.
- KYC/AML outsourcing and reliance agreement, with explicit ownership of final decisions.
- Market data licence and exchange redistribution permissions.
- Custody/clearing/execution terms where relevant.
- Business continuity and exit/portability schedule.
- Service-level agreement and incident escalation matrix.
- Marketing material approval procedure and approved claims register.

### 9.6 Fund-specific due diligence documents

For a collective investment scheme or alternative investment fund, require the legal fund name, manager licence, fund approval, administrator, trustee/custodian, auditor, offering memorandum or information memorandum, constitutional documents, subscription agreement, target investor criteria, minimum subscription, fee and expense table, liquidity and redemption terms, lock-ups and gates, side-pocket and suspension provisions, valuation policy, leverage policy, risk disclosures, audit reports, regulatory filings, conflicts, related-party arrangements, strategy and manager history. A fund track record must be verified and presented with period, gross/net, fees, benchmark, drawdown and methodology. Never invent a performance chart or imply that past returns predict future results.

## 10. Partner relationship and referral extension design

A referral extension is a distribution capability, not a loophole. It should be built as a jurisdiction-aware, permission-aware module that can be disabled per partner, product, user location and campaign. The module should not be a browser extension that captures broker credentials or injects order buttons into another firm's website. A safer design is a VYRA web referral centre and optional partner-approved link-out/SSO integration.

Each partner card should have:
- Legal entity name and trading name, licence number, regulator and official register link.
- What the partner provides, which account and asset classes, eligible countries and customer categories.
- Clear statement of whether the user is opening an account with the partner or VYRA.
- A concise risk summary, full provider disclosures and official contact/complaint details.
- Fees and minimums sourced from current official material.
- Compensation and conflict disclosure if VYRA is paid.
- Last verification date, partner status and source evidence.
- An official application link that the user can inspect before leaving VYRA.

The referral event should record a pseudonymous user ID, partner ID, campaign ID, jurisdiction policy version, consent state, time, link version and destination. Do not store unnecessary query-string personal data. Avoid passing email, phone, national ID or account numbers in URLs. Partner callbacks must be signed, replay-protected, idempotent and schema-validated. Referral attribution expiry and duplicate handling must be documented in the contract. If the partner cannot provide an approved callback, use a click-out count only; do not pretend that an account was opened or funded.

The partner's onboarding page should state its own identity and regulator status. If a VYRA employee or affiliate answers product questions, the response must be inside the permitted scope and based on approved scripts. Do not tell a customer that a fund or broker is “best”, “safe”, “guaranteed”, “risk-free”, “regulated everywhere” or “approved by VYRA”. Customer-specific advice should be escalated to the partner's authorised adviser or the customer's own licensed adviser. The support system needs a clear hand-off route and timestamp.

Commissions must be designed after the legal analysis. Compare a fixed platform fee, subscription to neutral software, fixed qualified-introduction fee, account-opening fee, and revenue-sharing model. Any fee contingent on opening, funding, transactions, trading volume, assets under management or investment performance requires specific legal review. The partner agreement must specify whether compensation is paid by the provider, whether it affects the customer, whether the provider can change terms, how refunds and clawbacks work, and how VYRA discloses the conflict. Do not create a referral marketplace for hedge funds until private-placement and investment-adviser perimeter issues are resolved.

## 11. User journeys and functional requirements

### 11.1 Discovery journey

A visitor opens the markets page, chooses a category (shares, ETFs, fixed income, FX, commodities or funds), reads balanced education, checks the product's risk and jurisdiction status, and views providers that have been approved for that category and location. A product page displays source dates, provider's legal entity, licensing and eligibility, costs, risks and official documentation. The visitor chooses to continue to the provider's official onboarding. If the jurisdiction gate is unknown, the continue button remains disabled and explains why.

### 11.2 Onboarding hand-off

The user signs in to VYRA only if they wish to save watchlists or track their referral hand-off. VYRA records required consent and the policy version, then opens the partner's official application flow. The partner performs identity verification, sanctions checks, customer classification, source-of-funds review and account approval. VYRA receives only the status allowed by contract. If the partner denies or pauses the application, VYRA must not override the decision or encourage circumvention.

### 11.3 Portfolio view

A user can connect an existing partner account through approved OAuth or a partner-issued link. The partner controls authentication. VYRA stores only scoped token material in a server-side encrypted secret store if the provider permits it. Display holdings with the partner and account source, last-updated time, currency, pending/settled distinctions and reconciliation status. Provide a link to the official statement. A failed sync should show a stale warning and last successful retrieval; it must never replace unavailable data with a sample holding.

### 11.4 Order journey — future phase only

A user opens the order ticket, sees the exact provider account, instrument, venue, quote timestamp, currency, order type, quantity, estimated value, fees, risk warning and trading status, and confirms. VYRA sends the instruction to the approved provider. The provider validates and accepts or rejects it. VYRA observes status events; it does not manufacture a fill. If the provider returns a partial fill, the ticket shows filled and remaining amounts separately. On disconnect, the status becomes “verification required” and the app checks the provider before allowing another order. The user may always access the provider's own platform and records.

### 11.5 Fund investment journey — separate future module

The fund page displays the exact approved fund, legal manager, manager regulator/licence, fund approval and target investor category. A suitability or eligibility questionnaire is completed only if counsel and the licensed distributor have approved the method. The fund manager makes the final eligibility decision. The offer memorandum, subscription agreement, fees, liquidity, valuation and risk documents must be reviewed before any application. The subscription and money flow run directly through the fund manager or its authorised administrator/custodian. VYRA does not pool investor money or issue a receipt implying VYRA accepted funds.

## 12. Operations and governance

A small platform still needs named accountability. Before public referral activity, assign owners for compliance/legal, security/technology, customer support/complaints, data protection, partner management, finance/reconciliation and incident response. One person may temporarily hold more than one non-conflicting role in a prototype, but roles that require independent oversight must be separated when the business model and regulation demand it. If the founder lacks the required experience, the plan must include hiring or contracting appropriately qualified professionals, not falsely claiming qualifications.

Establish a weekly partner register review while partners are being assessed, monthly permission/contract checks for active links, and a quarterly review of the product catalogue. Re-check a provider immediately when a regulator warning, licence suspension, ownership change, insolvency, material incident or service outage is reported. A product becomes hidden automatically if its licence or partner relationship cannot be verified. Keep evidence of all review dates.

Complaints must be handled centrally with a clear record of receipt, category, severity, customer impact, owner, acknowledgement, response, resolution, root cause and regulatory escalation. VYRA must distinguish complaints about its website from complaints about a partner's brokerage, execution, custody or fund management. Do not send a user in circles: the interface should route them to the correct accountable entity and retain an audit record of the hand-off.

Incidents should have severity levels. A critical event includes unauthorised trading, suspected account takeover, data breach, compromised signing key, partner feed compromise, cash/position mismatch affecting users, failed withdrawal or order-status uncertainty. The response plan should permit immediate disablement of the affected provider, product, country or all trading links; preserve evidence; notify the partner and relevant authorities where required; communicate clearly; and perform post-incident review. Every production deploy requires a release note, rollback plan and tested health checks.

## 13. Infrastructure and zero-capital plan

The current founder constraint is zero operating capital. The practical objective is to get as much software and diligence work done as possible without spending money, while being honest that a real brokerage partner, licensed operation, market-data redistribution, legal opinions, audits, security assessments, support staff and required regulatory capital may involve non-zero costs. Free tiers are appropriate for a prototype and internal demo only. A free database, free hosting service and free market-data key do not create a safe or legally authorised brokerage.

### 13.1 What can be done at zero cost now

- Keep the repository private and maintain all documentation, tests and architecture in GitHub.
- Use a local development environment and mocked/sandbox fixtures that are unmistakably test data.
- Retain the current paper-trading engine for education and validation; label it simulation everywhere.
- Build the partner directory using only official public register data and public documentation, with source dates.
- Build a jurisdiction policy engine using static, reviewed policy data, and fail closed on unknown locations.
- Build referral journeys as non-public test flows with synthetic users and no commissions.
- Create a vendor due-diligence form, legal document register and partner outreach template.
- Add CI, dependency pinning, secret scanning, security tests, API contract tests and reproducible migrations.
- Use free preview hosting only for product demos that contain no real customer data and no production order capability.
- Request partner discovery calls and written eligibility responses without promising customer volume or paying for a package.

### 13.2 What is blocked or must not be represented as free

A dedicated VYRA Supabase project could not be created because Jaymn2006's Org already has its two allowed active free projects. Those projects are 9N8 and Space Ledger, and they must remain untouched. The attempted creation was rejected by Supabase. No VYRA project was created and no VYRA database migration was applied. Do not put VYRA tables into either existing database. The next step is to obtain a different organisation with free project capacity or to make a deliberate, separately authorised decision about an existing project. Do not pause or delete an existing project without explicit choice.

The Vercel integration was previously unable to link this private organisation-owned repository while the connected team is on the Hobby plan; the returned path required a paid plan. Do not upgrade or make the repository public to work around it. A free Render blueprint exists, but the correct Render workspace must be chosen before creating a service. No Render service has been created. Do not add production secrets until the service and legal model are ready.

A production database must have backups, restore testing, monitoring, access review, appropriate contractual terms and sufficient availability. The free tier's limitations must be read before using it for actual client information. If a provider's API or platform requires a commercial account, a deposit, a monthly minimum or a set-up fee, VYRA must not activate it without a separately funded and approved business case.

### 13.3 Hosting and deployment

Separate development, preview, staging and production. Use a deployment model that supports private repositories and protected secrets without making the repository public. The frontend may be deployed on a low-cost/free preview service for demonstration; production brokerage workloads require a realistic availability and support arrangement. Database, app, queue, webhook, object storage, monitoring and backup services must have clear owners and data locations. Do not place KYC documents in a generic bucket without a privacy and security assessment.

The application must expose health and readiness separately. Health means the process is running. Readiness means required dependencies and policy configuration are available. A provider outage should not necessarily stop educational pages, but it must disable order or portfolio functions that depend on that provider. A health endpoint must not expose keys, customer identifiers, database hostnames or sensitive environment state.

## 14. Roadmap: build in strict gates

### Gate 0 — lawful concept and current foundation

Deliverable: this master plan, flowchart, checklist, source register, architecture and legal questions pack. The current app remains internal and paper-only. Verify the code, fix CI, install dependencies, run lint/typecheck/build, and ensure all UI copy accurately says simulation. No external referral commissions and no real KYC collection.

Exit criteria: clear founder-approved target model; legal questions written; one initial customer country; one asset category; one proposed partner type; technical baseline tests green; no mock/live ambiguity.

### Gate 1 — partner discovery and regulatory classification

Deliverable: at least three partner conversations, written answers to country and customer eligibility questions, partner scorecards, legal perimeter memo for Kenya, current CMA checklist pack, and a written classification request to CMA or counsel. Build the partner directory with official sources and a private internal admin workflow. No product is publicly marked “available” without licence and permission evidence.

Exit criteria: one partner is willing to consider a defined operating model; legal counsel confirms the exact launch path or identifies a licence requirement and application sequence; costs and capital are known.

### Gate 2 — non-transactional platform MVP

Deliverable: account sign-in, preferences, product catalogue, regulator register links, educational content, country gating, consent, partner discovery, approved link-out, privacy notice, complaints page and audit records. Do not implement account opening APIs or orders unless the partner authorises the model. Only use public or synthetic user data.

Exit criteria: privacy and marketing review; partner has approved copy and link placement; no unauthorised advice; monitoring and support process live; partner licence rechecked.

### Gate 3 — partner onboarding and data connection

Deliverable: approved partner onboarding link/SSO or API flow, account status callback, scoped portfolio data where allowed, data-sharing agreement, operational support process and daily reconciliation. Customer agreements remain with the partner. Use sandbox first and certify every flow.

Exit criteria: written production approval, legal and compliance sign-off, country whitelist, support and incident playbooks, security assessment, test cases passed, partner readiness certificate or equivalent written authorisation.

### Gate 4 — limited live product

Deliverable: narrow, capped product scope with a small invited cohort, provider risk controls, customer disclosures, official statements, complaint routes, monitoring and reconciliation. Start with cash equities/ETFs or a simple fund hand-off depending on which partner/legal model is actually available. Do not launch margin, options, high leverage, CFDs, OTC derivatives, copy trading, discretionary portfolios or hedge funds as a first product.

Exit criteria: every account has an official partner identity; partner handles client cash and custody; settlement and reconciliation pass; zero unresolved critical incidents; legal permission covers the activity; customers understand who holds their assets and where to complain.

### Gate 5 — scale and add asset classes

Only after months of clean operations should VYRA consider another asset class or jurisdiction. Add one integration at a time. Each expansion requires a new permissions matrix, partner due diligence, product governance, data rights, user disclosures, API certification, security review and operational readiness. Scale marketing only after customer-support and incident capacity scale with it.

### Gate 6 — decide whether to seek VYRA's own licence

Use measured demand, recurring revenue, unit economics, operating loss, partner dependency and regulatory costs to decide whether own authorisation makes sense. Prepare a funded capital plan and recruit experienced compliance, operations and risk leadership. Do not file a licence application simply to create a perception of legitimacy. Do not become a dealing principal unless VYRA can responsibly fund the balance sheet, risk controls and operational capabilities.

## 15. Commercial model and unit economics

Potential revenue streams include partner-paid software/platform fees, disclosed fixed referral fees where legally permitted, a subscription for professional analytics, enterprise licensing of VYRA's front-end or compliance tooling, white-label software fees, and approved distribution fees for regulated products. Avoid a model that depends on customers trading more frequently or taking more risk. If a provider pays VYRA based on deposits or trading volume, the conflict must be assessed and disclosed; in some jurisdictions it may require a particular registration or appointment.

The unit economics model should separate:
- Customer acquisition cost by channel and country.
- Percentage of referred visitors who are eligible.
- Partner application completion rate.
- Partner approval rate.
- Time from click to account approval.
- Active funded accounts, using partner-confirmed status.
- Partner revenue per active account.
- Support and compliance cost per account.
- Market-data and API cost per active account.
- Refunds, clawbacks and fraud losses.
- Gross margin by partner and country.
- Concentration risk if one provider supplies most revenue.

Do not estimate revenue by multiplying all sign-ups by a hypothetical commission. Use only contractually confirmed commercial terms. Before any fundraising, prepare base, downside and severe-downside scenarios. Include provider termination, API price increases, country restrictions, payment failure, partner outage and regulatory delay.

## 16. Risk register

| Risk | Consequence | Control / owner |
|---|---|---|
| VYRA acts as an unlicensed broker or arranger | Enforcement, fines, blocked business, customer harm | External counsel and compliance; scope gate before every feature |
| Referral commission triggers registration | Illegal compensation or unlicensed activity | Written jurisdiction opinion; fixed compensation only if cleared |
| Financial promotion is unlawful/misleading | Regulatory action and customer loss | Principal approval, versioned copy, risk disclosure, archive |
| Partner lacks permission for user country/product | Invalid onboarding and regulatory exposure | Check official register and partner written confirmation |
| Customer funds enter VYRA | Client-money, safeguarding and fraud exposure | Prohibit fund flows; partner pays/holds directly |
| Custody/clearing unclear | Asset loss and inability to reconcile | Legal entity map, custody due diligence, statements |
| KYC/sanctions failure | Financial crime and regulatory breach | Partner performs checks; responsibility matrix and escalation |
| Cross-border data transfer unlawful | Privacy enforcement and data-subject harm | Data map, DPA, legal transfer safeguards, minimisation |
| Market data rights missing | Exchange/vendor claims and customer misinformation | Written licence/partner entitlement; delayed/live label |
| False portfolio or execution status | Customer harm and complaints | Source timestamps, event reconciliation, fail-closed state |
| Provider outage or API change | Trading/support disruption | Resilience tests, versioned adapters, circuit breakers, rollback |
| Cyberattack or credential theft | Data loss or unauthorised access | MFA, least privilege, secret rotation, security monitoring |
| Insufficient capital | Insolvency or inability to meet licence requirements | No regulated entity launch without verified capital plan |
| Hedge fund offered to ineligible retail users | Illegal distribution and losses | Qualification gate, fund counsel, manager-approved onboarding |
| Referral fraud / self-referrals | Partner termination and financial loss | Signed callbacks, fraud rules, attribution audit |
| Founder dependency | Outage and lost institutional knowledge | Runbooks, peer review, documented ownership and backups |

## 17. Required partner outreach package

Create a concise partner pack before contacting institutional teams:
1. One-page company and product overview with the honest status: prototype and paper-trading only.
2. Target-country matrix, starting with Kenya and no implied global coverage.
3. Preferred model: partner remains regulated account provider, custodian and execution firm; VYRA provides software and permitted discovery/hand-off.
4. Asset scope: one initial category; other classes are roadmap only.
5. User journey diagram and data-flow diagram.
6. Architecture/security overview, current test and deployment status, and known limitations.
7. Compliance/legal work plan with a named external counsel workstream.
8. Proposed responsibility matrix (RACI) and customer-support route.
9. Commercial questions: minimum assets/accounts, setup fee, monthly minimum, transaction share, referral economics, market-data costs and termination terms.
10. A request for explicit written confirmation of Kenyan partner eligibility, required licence/appointment and the entity that contracts with customers.

Ask partners for their institutional or embedded-brokerage business development team, not ordinary retail customer support. The first message should ask for a discovery call and country eligibility review, not API keys or a live account. Never send customer personal data before a data-sharing agreement and lawful basis are established.

## 18. Non-negotiable launch conditions

No real customer funds, identity documents, investments or securities orders may be accepted by VYRA unless all relevant conditions are true:
- VYRA's legal entity and the relevant partner structure are documented.
- Independent counsel has signed off on the activities and customer jurisdictions.
- Required CMA or foreign regulator licence, approval, registration or principal appointment is effective.
- The partner's legal entity, licence and permission scope are independently verified.
- Written contracts clearly allocate onboarding, KYC, funds, custody, execution, clearing, reporting, complaints and data responsibilities.
- Market-data and exchange redistribution rights are confirmed.
- Data protection registration, lawful basis and cross-border transfer controls are completed where required.
- Customer documents, financial promotions and risk disclosures are approved.
- Production provider credentials and customer account links are securely managed.
- Authentication, access control, ledger segregation, webhook signatures, idempotency, reconciliation, audit and monitoring pass independent testing.
- Business continuity, incident response and customer-support coverage are in place.
- No unresolved critical security, financial, legal or reconciliation defect remains.

If any of these conditions fails, the affected country, partner, asset class or feature must remain disabled. It is better to have a smaller, honest platform than a large dashboard that appears to offer regulated services it cannot lawfully provide.

## 19. Current status and immediate decisions

The codebase is a paper-trading application foundation. It has no production broker connection, no live custody, no live customer-money flow, no completed KYC/AML system, no approved financial promotions, no confirmed referral contract, no live trade execution and no production certification. The current paper-risk tests previously passed locally, but a complete production build, migration, CI run and database deployment still need to be verified.

A dedicated Supabase VYRA project was attempted after approval for the quoted zero monthly cost. Supabase rejected creation because the only available organisation has reached the two-active-free-project limit. The existing projects are 9N8 and Space Ledger. They were not altered, paused or deleted. No VYRA database has been provisioned and no migration has been applied. The next infrastructure decision must respect that constraint.

The next practical sequence is:
1. Finish and review the legal/technical pack in this repository.
2. Pick one target model and one first asset class.
3. Obtain a Kenyan regulatory classification opinion and current CMA checklist pack.
4. Approach IBKR, Saxo, Alpaca and DriveWealth with the partner brief; approach a licensed Kenyan investment bank/fund manager for an ISPP discussion if fund distribution is the priority.
5. Keep public pages information-only until partner and legal approval.
6. Resolve the isolated database capacity issue without touching 9N8 or Space Ledger.
7. Select the Render workspace explicitly before creating a free demo service.
8. Run CI and a complete app/security review.
9. Implement only the partner capability that is approved and tested.

## 20. Research sources and evidence notes

The sources below are official regulator, government, provider or primary-document sources unless marked otherwise. They were checked for this plan on 26 November 2026. The cited pages are the starting point for research, not a substitute for reading the complete laws, current licence register, executed contracts or written regulatory advice.

### Kenya
- CMA licensing checklists: https://www.cma.or.ke/licensing/ — the Authority says checklists are summaries and the regulations are the conclusive requirements; its current page lists an ISPP checklist and Broker Dealer Checklist updated in 2026.
- CMA live licensee directory: https://licensees.cma.or.ke/ — verify a partner and its exact category before linking.
- CMA regulatory framework: https://www.cma.or.ke/regulatory-framework/ — includes 2025 General Licensing Regulations and other capital-markets regulations.
- CMA announcement, 17 November 2026: https://www.cma.or.ke/cma-licenses-digital-investment-platforms-a-crowdfunding-platform-operator-and-online-foreign-exchange-brokers/ — current ISPP and non-dealing online forex licensing precedent and responsibility separation.
- Kenya Parliament, Kenya Gazette Supplement, Capital Markets regulations 2023 (includes AIF, CIS and ISPP provisions): https://www.parliament.go.ke/sites/default/files/2024-03/Capital%20markets%20regulations%2C%202023%20%28LN%20NO.%20170%20OF%202023%2C%20LN%20NO.%20171%20OF%202023%2C%20LN%20NO.%20172%20OF%202023%20AND%20LN%20NO.%20173%20OF%202023%29-compressed.pdf
- CMA ISPP checklist: https://www.cma.or.ke/download/39/licensing-checklists2/5802/intermediary-service-platform-provider-checklist-2.pdf
- ODPC 2026 cross-border transfer guidance: https://odpc.go.ke/wp-content/uploads/2026/09/ODPC-%E2%80%93-Guidance-Notes-for-Cross-border-Data-Transfers.pdf
- ODPC data-handler compliance: https://www.odpc.go.ke/data-protection-compliance/index.html
- Kenya Law legislation index for Legal Notice No. 197 of 2025: https://new.kenyalaw.org/legislation/

### United Kingdom and European Union
- FCA, become an appointed representative: https://www.fca.org.uk/firms/principals-appointed-representatives/become
- FCA, responsibilities and oversight of appointed representatives: https://www.fca.org.uk/firms/principals-appointed-representatives/responsibilities-how-to-oversee
- FCA, FG24/1 financial promotions on social media: https://www.fca.org.uk/publications/finalised-guidance/fg24-1-finalised-guidance-financial-promotions-social-media
- FCA Handbook PERG 8.32 on arranging deals: https://handbook.fca.org.uk/handbook/perg8/perg8s33
- MiFID II Article 29 tied agents (EUR-Lex): https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02014L0065-20211110

### United States and Australia
- SEC Guide to Broker-Dealer Registration: https://www.sec.gov/about/divisions-offices/division-trading-markets/division-trading-markets-compliance-guides/guide-broker-dealer-registration
- SEC Broker-Dealers overview: https://www.sec.gov/resources-small-businesses/capital-raising-building-blocks/broker-dealers
- ASIC, check whether you need an AFS licence: https://www.asic.gov.au/for-finance-professionals/afs-licensees/check-if-you-need-an-afs-licence
- ASIC Regulatory Guide 36: https://www.asic.gov.au/regulatory-resources/find-a-document/regulatory-guides/rg-36-licensing-financial-product-advice-and-dealing

### Candidate partner and technology documentation
- Interactive Brokers, introducing broker programme: https://www.interactivebrokers.com/support/faq/content/get-started-as-introducing-broker-150344495
- IBKR Digital Account Management tools: https://www.interactivebrokers.com/en/trading/account-management-tools.php
- IBKR Account Management API: https://www.interactivebrokers.com/campus/ibkr-api-page/web-api-account-management/
- IBKR registration options and client application: https://www.interactivebrokers.com/docs/web-api/account-management/resources/registration-options
- Saxo introducing broker services: https://www.saxoportal.com/institutional-and-partners/introducing-broker.html
- Saxo white-label services: https://www.saxoimf.com/institutional-and-partners/white-label.html
- Alpaca Broker API: https://docs.alpaca.markets/us/docs/about-broker-api
- Alpaca Broker platform: https://alpaca.markets/broker-api
- DriveWealth developer overview: https://developer.drivewealth.com/apis/docs/intro
- DriveWealth account opening and verification data: https://developer.drivewealth.com/apis/docs/opening-accounts
- Upvest Investment API and operating models: https://docs.upvest.co/ and https://docs.upvest.co/operating_models

### Evidence limitations
Some provider pages are marketing material and make claims about their services, partner coverage or scale. Those claims must be revalidated in a direct partner process. A provider's broad geography statement is not proof of Kenya-specific onboarding. The current Kenyan 2025 licensing regulations and the 2026 CMA checklists must be read in full before a licensing or operating decision; old draft fee tables must not be treated as current costs. A regulator's public announcement is a useful precedent, not permission to copy that firm's licence model. No partner has confirmed VYRA's eligibility, no legal opinion has been issued for VYRA, and no regulated activity is authorised by this document.

---

**Implementation principle:** build the regulated-partner rails and evidence system before building any real-money execution switch. VYRA's job is to be a trustworthy software bridge, not to imitate a licensed institution before it has the permissions, capital and controls to operate one.


## Critical Kenya crypto-law update — VASP regime now operational

A separate and critical update applies to the crypto portion of this multi-asset concept. The Virtual Asset Service Providers Act, 2025 commenced on 4 November 2025, and the Virtual Asset Service Providers Regulations, 2026 (Legal Notice No. 134 of 2026) were gazetted and commenced on 22 July 2026. The joint CBK/CMA notice of 13 November 2026 states that any person providing or intending to provide virtual-asset services must apply to the relevant authority. The Regulations apply to services in or from Kenya and treat active solicitation/targeting of Kenyan consumers or deriving economic benefit/income from Kenya as relevant even without local physical presence.

The Act's First Schedule assigns custodial wallet and virtual-asset payment processor services and stablecoin issuance to CBK, while virtual-asset exchange, virtual-asset broker, virtual-asset investment adviser, virtual-asset manager and token issuance/tokenisation functions are assigned to CMA. A virtual-asset broker is described as facilitating exchange between virtual assets through an exchange and wallet providers on behalf of clients. The advertising chapter also regulates advertising and promotion of virtual-asset services; persons acting on behalf of a licensee must comply, and the licensee is responsible for such advertising.

The VASP Regulations' Fifth Schedule requires a VASP broker to hold KSh 10 million paid-up capital and liquid capital of KSh 2 million or 8% of total liabilities, whichever is higher. A virtual-asset exchange has KSh 100 million paid-up capital and KSh 20 million or 8% of liabilities as liquid capital, whichever is higher. The schedule also gives wallet-provider requirements of KSh 150 million paid-up and KSh 30 million or 100% of current liabilities for at least 30 days. A multi-activity licensee may need the highest activity's capital plus 50% of paid-up capital for every additional activity. These figures make an owned Kenyan VASP broker/exchange unrealistic for the current zero-capital VYRA project.

Accordingly, crypto must remain a separate, disabled regulatory regime. VYRA must not assume that a securities/ISPP partner agreement or a general referral model authorises crypto referral or promotions. Obtain a Kenyan legal classification and regulator guidance for the precise referral, marketing, wallet-link, exchange-routing and order journey. The detailed addendum, source links and implementation consequences are in [Kenya VASP 2026 Addendum](KENYA_VASP_2026_ADDENDUM.md). This update is part of the 26 November 2026 research baseline and should be reviewed before any crypto-related feature or marketing work.


## 21. Institutional fund-distribution and hedge-fund channels

The "bridge to large funds" concept needs a second partner category beyond brokerage APIs. Some platforms connect authorised wealth managers, investment advisers and institutional distributors to fund managers and alternative investment products. They are generally B2B distribution and operations networks, not consumer affiliate programmes. VYRA should investigate them only through an eligible regulated institution and only after the target country, investor category, fund approval and marketing rules are established.

### 21.1 iCapital Marketplace

iCapital describes its Marketplace as a platform connecting wealth managers with alternative investments from asset managers. On its public page, it reported 1,358+ asset managers, 60 integrated platform/service partners, 2,644 funds supported and $1.2 trillion+ in global platform assets as of 31 July 2026 (provider-published figures). This makes it an important discovery target for private markets, private equity/debt and hedge fund distribution infrastructure.

The key distinction is that iCapital is describing a wealth-manager and asset-manager ecosystem. It does not mean a new software start-up can embed the catalogue as a retail referral feed or obtain access to institutional funds. VYRA would need to determine whether it can participate as a technology vendor, regulated distributor, wealth platform supplier or through a partner institution. It must confirm investor eligibility, country availability, fund-specific offer restrictions, due diligence responsibilities, client account ownership, subscription processing, minimums, reporting, data rights and commercial terms.

Official source: https://marketplace.icapital.com/

### 21.2 CAIS

CAIS publicly positions its platform for independent financial advisers and the wealth-management ecosystem. The CAIS platform page describes access to private-market funds, hedge funds and structured notes, plus pre-trade education, due diligence material and operational support. Its alternatives page describes coverage across private debt, private equity, real estate, infrastructure and hedge funds. The public materials indicate an adviser-oriented offering, not an open public retail marketplace.

VYRA should approach CAIS only after it can explain its regulated distributor/adviser partner, investor qualification model and jurisdiction. Questions: whether the prospective distributor must be a US registered investment adviser or another eligible firm; whether non-US advisers/platforms can participate; what entity contracts with investors; which qualified purchaser/accredited investor tests apply; who approves marketing; and whether VYRA can supply technology without becoming an unregistered solicitor or adviser. Do not build a fund-subscription or recommendation feature against the public website alone.

Official sources:
- https://www.caisgroup.com/financial-advisor/cais-platform
- https://www.caisgroup.com/investment-solutions/alternative-investments

### 21.3 Allfunds

Allfunds presents itself as a global fund-distribution and wealth-technology ecosystem for fund houses and distributors. Its fund-house page states that one agreement can provide access to a broad network of institutions and digital distribution tools. It reports €1.97 trillion in assets under administration, more than 19,000 active professional users on Allfunds Connect, more than 900 distributor contracts and more than 200,000 funds and ETFs including alternatives, with headline statistics dated 30 September 2026 on its public site.

Allfunds could be more relevant for the mutual-fund/ETF and regulated distributor side of VYRA than for a direct-to-consumer trading API. It describes services for banks, wealth managers, insurers, pension funds, custodians, investment banks and fund houses. VYRA must ask whether it could become a technology provider to an existing eligible distributor, what distributor status and permissions are required, what countries and fund domicile combinations are supported, how fund dealing/settlement occurs, what omnibus/nominee structures apply, and what minimum scale, fees and due diligence are required.

Official sources:
- https://allfunds.com/en/fund-houses/
- https://allfunds.com/en/about
- https://allfunds.com/en/annual-report-2025/

### 21.4 Interactive Brokers Capital Introduction

IBKR's public Hedge Fund Capital Introduction page describes an online capital-introduction programme for hedge funds using IBKR as their principal prime broker. It says eligible funds must have at least $3 million in assets under management and an audited track record of at least one year, or have traded through IBKR for the last year. The programme connects those funds with IBKR clients who are Accredited Investors and Qualified Purchasers through its Investors' Marketplace.

This is a significant example of how an established broker can connect eligible funds with eligible investors without VYRA itself becoming the fund manager. However, the programme is not a general referral network for retail customers or a free distribution API that VYRA can copy. The official eligibility, customer categories and IBKR's own brokerage relationship control. VYRA should ask IBKR whether an authorised introducing or wealth partner could use or refer to this programme and whether any third-party technology participation is allowed.

Official source: https://portal.interactivebrokers.com/en/accounts/hedge-fund-onboarding.php

### 21.5 FNZ — institutional wealth infrastructure, not a simple referral channel

FNZ describes an end-to-end wealth platform for financial institutions, wealth managers and advisers, integrating technology with investment operations, administration, custody, clearing, execution, reporting and multi-asset capabilities. This is relevant if VYRA eventually licenses its software or becomes a front-end/vendor to an established institution. It is not a consumer fund marketplace or a zero-cost broker API.

VYRA should treat FNZ as an enterprise infrastructure benchmark and possible long-term technology/outsourcing conversation after it has a regulated institutional partner, demonstrated demand and the necessary procurement readiness. Verify legal entity, country, service scope, custody model, integration architecture, minimum scale and commercial costs.

Official sources:
- https://www.fnz.com/wealth-platform
- https://www.fnz.com/wealth-management-platforms

### 21.6 How to approach these fund channels

The sequence should be:
1. Identify a CMA-licensed Kenyan investment bank, fund manager or appropriately licensed ISPP that is willing to be the regulated distributor for the target Kenyan CIS product.
2. Ask counsel whether the structure permits VYRA to provide neutral technology, referral or outsourced platform functionality, and whether separate ISPP authorisation is required.
3. If the goal is non-public hedge funds/alternatives, identify the investor category (professional, qualified, accredited or other locally defined category) and the legal distribution entity in each country.
4. Ask iCapital and CAIS whether any route exists for an Africa/Kenya-based platform or eligible institutional distributor. Do not claim they accept VYRA until written confirmation is obtained.
5. Ask Allfunds whether its fund distribution and dealing capabilities can be supplied through an existing local regulated distributor or technology-vendor relationship.
6. Ask IBKR whether its Capital Introduction Programme can be used by the relevant partner and what investor/fund eligibility conditions apply.
7. Use a data-only, education-only product directory until the relevant institution and regulator approve the exact activity.

These providers should be added to the research register and partner scorecard as a distinct **fund distribution / alternatives marketplace** category. They must not be conflated with executing brokers, prime brokers, fund managers, custodians or fund administrators. A platform that introduces investors to a fund is not necessarily the legal distributor; a prime broker does not necessarily manage or guarantee the fund; and a fund manager does not necessarily custody all fund assets.


## 22. Hosting decision update

The current zero-capital hosting comparison is recorded in [HOSTING_AND_INFRASTRUCTURE_OPTIONS.md](HOSTING_AND_INFRASTRUCTURE_OPTIONS.md). Render Free is the easiest current paper-demo target after workspace selection, but it sleeps after 15 minutes idle and its free Postgres expires after 30 days; Render explicitly says free services are not for production. Netlify Free supports current Next.js features through OpenNext and is an alternative preview host. Cloudflare recommends vinext for new Next.js projects on Workers and is worth a separate compatibility branch; it is not a direct deployment switch. Railway Free has only $1/month resource credit and sleeps. Vercel Hobby is for personal/non-commercial use and is not the right tier for this commercial concept. No free host is approved for live brokerage operations or real client records.


## 23. Full technology vendor map

A deeper layer-by-layer vendor shortlist, including brokerage rails, private-market and hedge-fund marketplaces, institutional fund distribution, KYC/KYB/AML, market data, charting, custody, client money, fund administration, monitoring and security tooling, is maintained in [BROKERAGE_TECH_VENDOR_MAP.md](BROKERAGE_TECH_VENDOR_MAP.md). The map distinguishes an execution broker from a fund manager, custodian, prime broker, transfer agent, market-data vendor, KYC processor and technology supplier. It intentionally recommends one regulated partner first rather than attempting to connect every vendor at once. No provider on the map is a confirmed VYRA partner.
