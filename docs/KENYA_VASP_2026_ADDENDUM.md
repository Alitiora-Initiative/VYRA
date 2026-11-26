# Kenya VASP Regulation 2026 — VYRA Crypto Activity Addendum

**Research cut-off:** 26 November 2026  
**Legal instruments:** Virtual Asset Service Providers Act, 2025 (Act No. 20 of 2025) and Virtual Asset Service Providers Regulations, 2026 (Legal Notice No. 134 of 2026).  
**Purpose:** Update the main VYRA brokerage plan for Kenya's newly operational virtual-asset regime. This is an engineering and research note, not legal advice or an authorisation.

## 1. This is a separate regulated perimeter from securities brokerage

The VASP Act commenced on 4 November 2025. The VASP Regulations, Legal Notice 134 of 2026, were gazetted and commenced on 22 July 2026. The joint CBK/CMA notice of 13 November 2026 confirmed that the regulations operationalise the Act and that any person providing or intending to provide virtual-asset services must apply to the relevant regulator. The regulators said they would publish their licensed-VASP lists. VYRA must therefore not treat a crypto brokerage, exchange, custodial wallet, crypto payment, virtual-asset investment advice or management feature as an ordinary add-on to its securities brokerage UI.

The VASP Act defines a virtual asset as a digital representation of value that can be digitally traded or transferred and used for payment or investment, excluding fiat-currency representations, securities and other financial assets. It defines a VASP as a company licensed under the Act to carry on virtual-asset services. A virtual-asset trading platform includes a digital platform facilitating exchanges of virtual assets for fiat or other virtual assets on behalf of third parties for a fee, commission or other benefit where the platform holds/controls customer assets or purchases from a seller to sell to a buyer. The Act's service categories also separately identify virtual-asset brokers and wallet/payment providers.

Most importantly for a web platform, Regulation 4 of the 2026 rules applies to persons offering virtual-asset services in or from Kenya. A person is deemed to operate in or from Kenya where it actively solicits or targets local consumers, or derives economic benefit or income from Kenya, even without physical presence. This is an important cross-border test. Hosting VYRA overseas, using an offshore company, or placing a foreign partner's link on a Kenyan-targeted site does not by itself settle the legal question.

The correct next step is to obtain a written Kenyan legal analysis of every crypto-related VYRA feature: displaying and ranking providers, paid placement, referral links, lead forms, suitability questionnaires, account opening hand-offs, quote routing, transaction hand-off, order submission, wallet connection, exchange routing, custody, token listings, staking, portfolio management, and performance or trading signals. The legal analysis must distinguish operating a VASP from advertising or promoting a licensee's VASP service and from other capital-markets activity. Do not infer that a pure introducer is outside the rules without advice from Kenyan counsel and, where appropriate, written CBK/CMA clarification.

## 2. Which regulator covers which virtual-asset service?

The First Schedule to the VASP Act assigns different activities to the two regulators. The schedule is the starting point for routing a proposed service, not a substitute for the regulator's interpretation of a combined product.

| Service | Statutory description / example | Responsible authority named in the Act |
|---|---|---|
| Virtual-asset wallet provider | Third party holds/manages private keys for customers | Central Bank of Kenya (CBK) |
| Virtual-asset exchange | Platform facilitates virtual-asset-to-virtual-asset or virtual-asset-to-fiat exchange, trading, clearing and settlement | Capital Markets Authority (CMA) |
| Virtual-asset payment processor | Arranges transactions involving virtual assets and fiat or virtual assets | CBK |
| Virtual-asset broker | Facilitates exchange between virtual assets through an exchange and wallet providers for clients, including retail, institutional investors or funds | CMA |
| Virtual-asset investment adviser | Gives investment advice on virtual assets, offerings or NFTs | CMA |
| Virtual-asset manager | Discretionarily manages portfolios containing virtual assets under client mandates | CMA |
| ICO / tokenisation / token issuance platform | Issues or operates a platform for virtual-asset offerings or real-world-asset tokens | CMA |
| Stablecoin issuance | Creates/manages approved stablecoins and their reserves | CBK |

A single app can perform more than one service. VYRA must map each actual function to the legal category. For example, a user connecting an external non-custodial wallet to read a public balance is not necessarily the same activity as VYRA holding keys, controlling client funds, executing exchanges, brokering a conversion or arranging payment. Equally, a VYRA interface that sends an order to a crypto exchange or takes a commission for a client exchange may not be just passive data display. Counsel must examine the exact technical and commercial arrangement.

## 3. Territorial reach and marketing / referral controls

Regulation 4 is a major design constraint: actively targeting Kenyan consumers or deriving economic benefit or income from Kenya may bring a service within the in-or-from-Kenya test regardless of where the servers or entity are located.

Regulation 123 says a person must not advertise or purport to advertise a virtual-asset service, or promote or purport to promote one (including ICOs and NFTs), unless the requirements of the Regulations are met. It also says a person acting on behalf of a licensee must comply with those requirements, and the licensee is responsible for that person's advertising as if it had undertaken the advertising itself. Regulations 124–132 address advertising quality, content, performance information, costs/commissions, risk warnings, duties of promoters and third parties, internet advertising and prohibited practices. The rules require clear, fair, complete, balanced, current and non-misleading information and identify paid promotion on third-party pages as something to disclose.

This means a commission-bearing crypto referral extension, paid influencer page, provider ranking, broker comparison or campaign is not safe merely because VYRA does not custody assets. Before a partner referral module is activated:
- the actual activity must be classified by counsel;
- the partner's licence and exact activity must be verified;
- the partner must approve the content, landing page, targeting and compensation model;
- paid promotion, conflicts, costs and risks must be transparently disclosed;
- the approved copy and creative must be archived with version and date;
- VYRA must have a stop switch by provider, campaign, customer country and asset category;
- attribution must use minimum pseudonymous data and an approved privacy basis;
- any provider callback must be signed, replay-protected and contractually authorised.

The law does not mean every ordinary website link is automatically a VASP activity. It does mean VYRA must not infer a general safe harbour for crypto referrals or advertising. An external lawyer and the relevant regulator must determine which boundary applies to the exact flow.

## 4. Capital, liquidity and statutory fees: ownership is not a zero-capital route

The Fifth Schedule of the VASP Regulations specifies minimum paid-up capital and liquid-capital requirements. These are not hosting costs; they are financial requirements for the licensed legal entity, and the rules require core capital to remain available and unencumbered. Regulation 85 also permits the regulator to require more based on risk. If the licensee is authorised for more than one activity, the paid-up capital is the highest applicable category plus 50% of the paid-up capital for each additional activity.

| VASP category | Minimum paid-up capital | Minimum liquid capital |
|---|---:|---:|
| Virtual-asset wallet provider | KSh 150,000,000 | KSh 30,000,000 or 100% of current liabilities for at least 30 days, whichever is higher |
| Virtual-asset exchange | KSh 100,000,000 | KSh 20,000,000 or 8% of total liabilities, whichever is higher |
| Virtual-asset payment processor | KSh 10,000,000 | 100% of current liabilities for at least 30 days |
| Virtual-asset broker | KSh 10,000,000 | KSh 2,000,000 or 8% of total liabilities, whichever is higher |
| Virtual-asset investment adviser | Nil in the Fifth Schedule | Nil in the Fifth Schedule |
| Virtual-asset manager | KSh 20,000,000 | KSh 4,000,000 or 8% of total liabilities, whichever is higher |
| ICO issuer | KSh 20,000,000 | KSh 4,000,000 or 8% of total liabilities, whichever is higher |
| Tokenisation provider | KSh 10,000,000 | KSh 2,000,000 or 8% of total liabilities, whichever is higher |
| Token issuance platform | KSh 20,000,000 | KSh 4,000,000 or 8% of total liabilities, whichever is higher |
| Stablecoin issuer | KSh 300,000,000 | KSh 60,000,000 or 100% of current liabilities for at least 30 days, whichever is higher |

For a VASP broker, the First Schedule lists a KSh 100,000 application fee and a KSh 100,000 licence fee. The application fee is non-refundable and the CBK checklist says it is payable for each VASP activity applied for. These fees are only the regulator fee items, not the total cost of incorporation, staff, insurance, bank accounts, compliance, audit, legal advice, technology, liquidity or operations. Exchange and wallet-provider categories have materially higher capital requirements.

**Decision for VYRA:** with no capital, VYRA must not plan to own a Kenyan VASP broker, exchange or custody/wallet licence now. The paid-up and liquid-capital requirements alone make that route infeasible. The feasible investigation is to be a technology provider or an approved third-party distribution/marketing partner for a properly licensed VASP, with the partner retaining the regulated account, customer money, custody and execution functions. Even that relationship must be reviewed: outsourcing and third-party roles are addressed in the VASP checklist, and crypto marketing by persons acting on behalf of licensees is expressly controlled. This document does not conclude that VYRA can operate as an unlicensed crypto introducer.

## 5. Application and operating evidence required for a VASP

The VASP application is not just a form and API integration. The Act requires an eligible company limited by shares and the regulator considers personnel, AML/CFT/CPF, consumer and data protection, capital, insurance, fit-and-proper ownership and management, cyber safeguards, physical or data facilities and public-interest factors.

The official CBK licensing checklist currently surfaced on the CBK website says it covers the CBK categories of stablecoin issuers, virtual-asset payment processors and virtual-asset wallet providers. It begins with preliminary engagement: an application-intention letter, detailed product/business-model presentation, target customer segments, three-year financial projections, organogram, end-to-end customer journey and funds flow, risk assessment and full disclosure of cross-border operations and affiliates. It also calls for name approval, company incorporation, constitutional documents, CR12/beneficial-owner data, KRA PIN and tax-compliance evidence, source of capital, capital and liquidity evidence in the applicant company's name, shareholder declarations, insurance, financial statements and a Kenyan bank account.

The checklist's business and control evidence includes:
- operating model, activities, target customer segments and customer/funds flow;
- three-to-five-year business projections, cost and revenue model and capital/liquidity plan;
- governance, board, CEO, compliance officer, MLRO, cybersecurity lead/CISO, finance and internal-audit appointments;
- systems, network, architecture and data-flow diagrams; wallet/hot/cold storage details where the applicant holds assets;
- AML/CFT/CPF, sanctions, targeted financial sanctions, customer due diligence, enhanced due diligence and transaction monitoring;
- risk register covering market, operational, technology, liquidity, custody and fraud risk;
- incident response, business continuity, disaster recovery, wind-down and customer asset return plans;
- asset safeguarding, segregation, liquidity stress testing and insurance;
- data protection, privacy, cybersecurity audit, penetration testing and IT audit;
- consumer protection, market conduct, conflicts, complaints and customer agreements;
- reconciliation, cross-border service provision, outsourcing, third-party diligence, SLAs and forced-provider-replacement contingencies;
- separate VASP business unit and separate books of account from other business units.

The CBK checklist applies to its listed categories. The Act assigns virtual-asset exchange, broker, investment adviser and manager categories to CMA. VYRA must obtain the appropriate current CMA VASP application checklist and confirm the process directly with CMA for those activities; the CBK checklist must not be presented as a complete CMA broker/exchange application pack.

## 6. Practical VYRA crypto plan

### Phase A — now, zero capital
- Keep crypto order execution disabled.
- Keep all crypto balances and trades in the separate paper/simulation environment.
- Do not promote, rank or monetise a crypto brokerage partner.
- Do not collect crypto deposits, wallet private keys, seed phrases or exchange API secrets from end users.
- Build a private internal VASP activity map and evidence library.
- Ask Kenyan counsel to classify the proposed VYRA crypto quote, referral, wallet-connection and trading flows.
- Ask CMA which VASP category would apply to a proposed broker-routing layer and whether a third-party technology/referral role is permitted under a named licensee's scope.
- Ask CBK about wallet, payment processor and stablecoin activities only if VYRA proposes those functions.
- Add a VASP-specific country gate so a general securities/ISPP approval can never turn on crypto services automatically.

### Phase B — partner-led only after written permission
- Find a VASP licensed for the exact activity and product.
- Verify the licence in the regulator's official register or gazette and keep a dated record.
- Obtain a written contract and regulator/outsourcing approval or notification where required.
- Make the partner own account opening, customer due diligence, customer assets, custody and execution within the authorised perimeter.
- Agree marketing copy, third-party promotional responsibility, referral compensation and records.
- Use an approved server-to-server/API model with scoped credentials and signed callbacks.
- Do not represent the partner's authorisation as VYRA's own.

### Phase C — own VASP licence only after funding and professional readiness
- Reassess only after a funded corporate entity, capital source and financial runway exist.
- Recruit experienced directors, CEO, compliance, MLRO, cyber, finance and internal audit functions required for the category.
- Prepare the full legal, governance, capital, insurance, cybersecurity, AML, asset-safeguarding, liquidity and wind-down pack.
- Submit the pre-engagement business model and customer/funds flow for the relevant regulator's review.
- Obtain a licence before commencing or holding out VASP activity.
- Launch only after systems, controls and operations pass the regulator's and independent review requirements.

## 7. Immediate engineering changes required

- Add a distinct regulatory activity field to any future product or provider record: securities, collective investment scheme, forex/CFD, virtual-asset brokerage, virtual-asset exchange, custodial wallet, payment processing, virtual-asset advice/management, token issuance.
- Keep virtual-asset activities separate from equities/ETF/CIS partner permissions.
- Add jurisdiction rules for in-or-from-Kenya targeting and revenue, not just incorporation or hosting location.
- Add a crypto promotion approval gate distinct from a general partner-link approval.
- Require explicit licence number, regulator, activity scope, entity name, source and last-checked date.
- Require current evidence and a formal partner contract before a crypto action can be enabled.
- Build a dedicated controls checklist for customer asset segregation, funds/asset return, insurance, liquidity, exchange listing, transfer and wallet safeguarding if future VYRA ever owns these functions.
- Do not create custody or wallet functionality in the production product while the legal and capital model remains unresolved.

## 8. Primary sources

1. Virtual Asset Service Providers Act, 2025 (Act No. 20 of 2025), official revised law: https://www.centralbank.go.ke/wp-content/uploads/2026/11/Virtual-Asset-Service-Providers-Act-2025.pdf
2. Virtual Asset Service Providers Regulations, 2026 (Legal Notice 134 of 2026), official revised regulations: https://www.centralbank.go.ke/wp-content/uploads/2026/11/The-Virtual-Asset-Service-Providers-Regulations-2026.pdf
3. Joint CBK/CMA Public Notice, 13 November 2026, Gazettement of the VASP Regulations: https://www.centralbank.go.ke/wp-content/uploads/2026/11/CBK-CMA-Public-Notice-Operationalisation-of-the-VASP-Regulations-2026-.pdf
4. CBK VASPs Licensing Checklist: https://www.centralbank.go.ke/wp-content/uploads/2026/11/VASPs-Licensing-checklist.pdf
5. CMA regulatory framework: https://www.cma.or.ke/regulatory-framework/

**Limitations:** This addendum summarises the statutory text and the public checklist available on the research date. It is not a legal opinion, does not determine whether a VYRA referral workflow is itself a virtual-asset service, and does not confirm any provider's licence. The exact model must be classified by Kenyan counsel and the responsible regulator.
