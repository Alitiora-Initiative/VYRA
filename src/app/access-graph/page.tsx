'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowUpRight, BookOpen, CheckCircle2, CircleAlert,
  Database, FileSearch, LockKeyhole, Network, ShieldCheck,
} from 'lucide-react';
import {
  ACCESS_ACTIVITIES, ACCESS_COUNTRIES, ACCESS_CUSTOMER_TYPES, ACCESS_EVIDENCE, ACCESS_PRODUCTS,
  ACCESS_GRAPH_REVIEW_DATE, ACCESS_GRAPH_VERSION, evaluateAccess,
  type AccessDecision,
} from '@/lib/access-graph/rules.mjs';
import { evaluateMarketAccessRoute } from '@/lib/access-graph/route-gate.mjs';
import { getProviderGraphSnapshot } from '@/lib/provider-graph/capabilities.mjs';

const PROVIDER_CANDIDATES = getProviderGraphSnapshot().providers;

export default function AccessGraphPage() {
  const [country, setCountry] = useState('KE');
  const [customerType, setCustomerType] = useState('retail');
  const [product, setProduct] = useState('virtual_asset');
  const [activity, setActivity] = useState('virtual_asset_service');
  const [providerId, setProviderId] = useState('interactive-brokers');

  const result = useMemo<AccessDecision>(
    () => evaluateAccess({ country, customerType, product, activity }),
    [country, customerType, product, activity]
  );
  const routeDecision = useMemo(
    () => evaluateMarketAccessRoute({ country, customerType, product, activity, providerId }),
    [country, customerType, product, activity, providerId]
  );
  const selectedProvider = PROVIDER_CANDIDATES.find((item) => item.id === providerId);
  const matchedEvidenceIds = new Set(result.evidence.map((item) => item.id));
  const visibleBlockers = [
    ...routeDecision.blockers.filter((item) => item.startsWith('Access Graph:')).slice(0, 3),
    ...routeDecision.blockers.filter((item) => item.startsWith('Provider Graph:')).slice(0, 3),
  ];
  const hiddenBlockerCount = Math.max(0, routeDecision.blockers.length - visibleBlockers.length);

  return (
    <main className="accessShell">
      <div className="accessTop">
        <Link className="accessBack" href="/"><ArrowLeft size={15}/> Back to VYRA Markets</Link>
        <div className="accessBrand"><span className="accessLogo">V</span><span>VYRA <small>ACCESS GRAPH</small></span></div>
      </div>

      <section className="accessHero">
        <div className="accessEyebrow"><Network size={15}/> REGULATORY-AWARE MARKET ACCESS INFRASTRUCTURE</div>
        <h1>One access graph.<br/><span>Every route has proof.</span></h1>
        <p>Before a broker, product or referral is connected, VYRA maps the country, customer, activity, provider capabilities and evidence required for that exact route.</p>
        <div className="accessHeroMeta">
          <span><ShieldCheck size={14}/> Default-deny policy</span>
          <span><Database size={14}/> Rule pack {ACCESS_GRAPH_VERSION}</span>
          <span><FileSearch size={14}/> Reviewed {ACCESS_GRAPH_REVIEW_DATE}</span>
        </div>
      </section>

      <section className="accessGrid">
        <div className="accessCard accessSimulator">
          <div className="accessCardHead">
            <div><div className="accessEyebrow">01 / ROUTE SIMULATOR</div><h2>Test a market-access route</h2></div>
            <span className="accessStatusTag">SIMULATION</span>
          </div>
          <p className="accessLead">Change one dimension at a time. An unknown combination never inherits permission from another country, product or provider.</p>

          <div className="accessFields">
            <label>Customer / target jurisdiction
              <select value={country} onChange={(event) => setCountry(event.target.value)}>
                {ACCESS_COUNTRIES.map((item) => <option key={item.code} value={item.code}>{item.name}{item.assessed ? ' · rule pack available' : ' · not yet assessed'}</option>)}
              </select>
            </label>
            <label>Customer / investor type
              <select value={customerType} onChange={(event) => setCustomerType(event.target.value)}>
                {ACCESS_CUSTOMER_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>Product class
              <select value={product} onChange={(event) => setProduct(event.target.value)}>
                {ACCESS_PRODUCTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>VYRA activity
              <select value={activity} onChange={(event) => setActivity(event.target.value)}>
                {ACCESS_ACTIVITIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>Partner / provider candidate
              <select value={providerId} onChange={(event) => setProviderId(event.target.value)}>
                {PROVIDER_CANDIDATES.map((item) => <option key={item.id} value={item.id}>{item.name} · research only</option>)}
              </select>
            </label>
          </div>

          <div className={'accessDecision ' + result.severity}>
            <div className="accessDecisionTop">
              <div className="accessDecisionIcon"><LockKeyhole size={20}/></div>
              <div><span>REGULATORY SIGNAL · {result.regulatorySignal.replaceAll('_',' ').toUpperCase()}</span><h3>{result.headline}</h3></div>
            </div>
            <p>{result.explanation}</p>
            <div className="accessDecisionFooter">
              <span><CircleAlert size={14}/> {result.missingGates.length} outstanding evidence gates</span>
              <strong>LIVE ACTIONS: DISABLED</strong>
            </div>
          </div>

          <div className="accessDecision critical">
            <div className="accessDecisionTop">
              <div className="accessDecisionIcon"><Network size={20}/></div>
              <div>
                <span>COMBINED ACCESS + PROVIDER DECISION</span>
                <h3>{routeDecision.readyForHumanReview ? 'Evidence complete — human review required' : 'Route blocked pending evidence'}</h3>
              </div>
            </div>
            <p>{selectedProvider?.name ?? providerId} is evaluated against the same country, investor type, product and activity as AccessGraph. Both graphs must pass before a route can even be escalated for human review.</p>
            <div className="accessRouteBlockers">
              {visibleBlockers.map((blocker, index) => (
                <div className="accessRouteBlocker" key={blocker}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{blocker}</p>
                </div>
              ))}
              {routeDecision.provider.missingCapabilities.length > 0 && (
                <div className="accessCapabilityGaps">
                  <strong>Activity-specific provider evidence gaps</strong>
                  {routeDecision.provider.missingCapabilities.slice(0, 3).map((gap) => (
                    <article key={gap.id}>
                      <b>{gap.label}</b>
                      <p>{gap.reason}</p>
                      <small>Evidence required: {gap.requiredEvidence.join(' · ')}</small>
                    </article>
                  ))}
                  {routeDecision.provider.missingCapabilities.length > 3 && (
                    <small>+ {routeDecision.provider.missingCapabilities.length - 3} additional capability gaps</small>
                  )}
                </div>
              )}
              {hiddenBlockerCount > 0 && <div className="accessRouteMore">+ {hiddenBlockerCount} additional blockers in the composite decision</div>}
              {routeDecision.blockers.length === 0 && <div className="accessRouteMore">No recorded blockers. This outcome is still not an approval.</div>}
            </div>
            <div className="accessDecisionFooter">
              <span><CircleAlert size={14}/> {routeDecision.blockers.length} blockers · {routeDecision.provider.missingCapabilities.length} capability gaps</span>
              <strong>NO CUSTOMER ACTIONS ENABLED</strong>
            </div>
          </div>

          <div className="accessLaunchState">
            <div><small>VYRA launch status</small><strong>{result.launchStatus === 'blocked_pending_evidence' ? 'Blocked pending evidence' : 'Manual go / no-go required'}</strong></div>
            <p>{result.message}</p>
          </div>
          <div className="accessCustomerNote"><strong>Customer-type coverage:</strong> {result.customerTypeNote}</div>
        </div>

        <div className="accessCard accessFlowCard">
          <div className="accessEyebrow">02 / DECISION PIPELINE</div>
          <h2>From idea to permitted route</h2>
          <div className="accessPipeline">
            <div className="accessPipelineStep"><span>1</span><div><strong>Identify activity</strong><small>Not just asset label — what does VYRA actually do?</small></div></div>
            <div className="accessPipelineStep"><span>2</span><div><strong>Resolve jurisdiction</strong><small>Residence, targeting, distribution and economic nexus</small></div></div>
            <div className="accessPipelineStep"><span>3</span><div><strong>Attach source evidence</strong><small>Regulator, law, version, provision and review date</small></div></div>
            <div className="accessPipelineStep"><span>4</span><div><strong>Verify provider capabilities</strong><small>Only the roles required for this activity must have current evidence</small></div></div>
            <div className="accessPipelineStep"><span>5</span><div><strong>Human release gate</strong><small>Legal, compliance, security and operations sign-off</small></div></div>
          </div>
          <div className="accessPipelineFoot"><ShieldCheck size={16}/> A partner logo or offshore server is not a policy decision.</div>
        </div>
      </section>

      <section className="accessCard accessEvidenceCard">
        <div className="accessCardHead">
          <div><div className="accessEyebrow">03 / SOURCE-OF-TRUTH REGISTER</div><h2>Regulatory evidence</h2></div>
          <span className="accessStatusTag">{matchedEvidenceIds.size} SOURCES MATCHED</span>
        </div>
        <p className="accessLead">The rulepack links to primary regulator and statutory sources. It records the source and the question it informs; it does not turn a source into a legal opinion.</p>
        <div className="accessEvidenceList">
          {ACCESS_EVIDENCE.map((item) => {
            const matched = matchedEvidenceIds.has(item.id);
            return <article className={'accessEvidenceItem ' + (matched ? 'matched' : '')} key={item.id}>
              <div className="accessEvidenceIcon"><BookOpen size={17}/></div>
              <div className="accessEvidenceBody">
                <div className="accessEvidenceMeta"><span>{item.authority}</span><span>{matched ? 'MATCHED TO THIS ROUTE' : item.publishedOrUpdated}</span></div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <small>Relevance: {item.use}</small>
                <div className="accessEvidenceProvisions">{item.provisions.map((provision) => <span key={provision}>{provision}</span>)}</div>
                <a href={item.url} target="_blank" rel="noreferrer">Open official evidence <ArrowUpRight size={13}/></a>
              </div>
            </article>;
          })}
        </div>
      </section>

      <section className="accessCard accessGatesCard">
        <div className="accessCardHead"><div><div className="accessEyebrow">04 / RELEASE CONTROL</div><h2>Evidence required before activation</h2></div><span className="accessStatusTag">ALL UNCHECKED</span></div>
        <div className="accessGateGrid">
          {result.missingGates.map((item, index) => <div className="accessGate" key={item.key}><span>{String(index + 1).padStart(2,'0')}</span><strong>{item.label}</strong><CircleAlert size={15}/></div>)}
          {result.missingGates.length === 0 && <div className="accessGateComplete"><CheckCircle2 size={18}/> Checklist recorded as complete — independent human go/no-go is still required.</div>}
        </div>
        <p className="accessDisclaimer">This is a versioned product-control demonstration, not legal advice, a regulator interpretation, a sandbox approval or permission to operate. Kenya is the only jurisdiction currently mapped. Every other market is unassessed and remains blocked. The rule pack needs ongoing review by qualified counsel and the relevant regulator.</p>
      </section>

      <footer className="accessFooter">
        <span>VYRA ACCESS GRAPH · {ACCESS_GRAPH_VERSION}</span>
        <Link href="/">Return to VYRA Markets</Link>
      </footer>
    </main>
  );
}
