import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, CircleAlert, LockKeyhole, Network, ShieldCheck } from 'lucide-react';
import { getProviderGraphSnapshot } from '@/lib/provider-graph/capabilities.mjs';

export default function ProviderGraphPage() {
  const graph = getProviderGraphSnapshot();

  return (
    <main className="providerGraphShell">
      <header className="providerGraphTop">
        <Link href="/"><ArrowLeft size={15}/> Back to VYRA Markets</Link>
        <div><span className="providerGraphLogo">V</span><span>VYRA <small>PROVIDER GRAPH</small></span></div>
      </header>

      <section className="providerGraphHero">
        <div className="providerGraphEyebrow"><Network size={15}/> BROKER INTEROPERABILITY AND EVIDENCE</div>
        <h1>Know exactly<br/><span>who does what.</span></h1>
        <p>VYRA separates the technology provider from the regulated principal, custodian, executing broker, KYC operator, payment provider, data vendor and customer support owner. No role is assumed from a logo or API endpoint.</p>
        <div className="providerGraphProof">
          <div><strong>{graph.summary.providersInResearch}</strong><small>Research candidates</small></div>
          <div><strong>{graph.summary.legalEntitiesVerified}</strong><small>Legal entities verified</small></div>
          <div><strong>{graph.summary.signedAgreements}</strong><small>Signed agreements</small></div>
          <div><strong>{graph.summary.sandboxConnections}</strong><small>Sandbox connections</small></div>
          <div><strong>{graph.summary.productionApproved}</strong><small>Production approvals</small></div>
        </div>
      </section>

      <section className="providerGraphInvariant">
        <LockKeyhole size={19}/>
        <div><strong>Default status: disconnected and unapproved</strong><p>{graph.invariant}</p></div>
      </section>

      <section className="providerGraphSection">
        <div className="providerGraphSectionHead"><div className="providerGraphEyebrow">01 / PARTNER REGISTER</div><h2>Research candidates</h2><p>These are research records only. No VYRA appointment, production credential or customer referral is active.</p></div>
        <div className="providerGraphCards">
          {graph.providers.map((provider) => (
            <article className="providerGraphCard" key={provider.id}>
              <div className="providerGraphCardHead">
                <div><h3>{provider.name}</h3><small>{provider.category}</small></div>
                <span>RESEARCH ONLY</span>
              </div>
              <div className="providerGraphStates">
                <div><small>Legal entity</small><strong>Not verified</strong></div>
                <div><small>Licence scope</small><strong>Not verified</strong></div>
                <div><small>VYRA agreement</small><strong>Not signed</strong></div>
                <div><small>Sandbox</small><strong>Not connected</strong></div>
                <div><small>Countries approved</small><strong>None</strong></div>
                <div><small>Products approved</small><strong>None</strong></div>
              </div>
              <div className="providerGraphLinks">
                <a href={provider.officialWebsite} target="_blank" rel="noreferrer">Official website <ArrowUpRight size={13}/></a>
                <a href={provider.documentation} target="_blank" rel="noreferrer">Technical documentation <ArrowUpRight size={13}/></a>
              </div>
              <div className="providerGraphCardFoot"><CircleAlert size={14}/> {Object.keys(provider.capabilityStatus).length} capability roles still unverified</div>
            </article>
          ))}
        </div>
      </section>

      <section className="providerGraphSection">
        <div className="providerGraphSectionHead"><div className="providerGraphEyebrow">02 / CAPABILITY MATRIX</div><h2>Eleven roles. Eleven evidence trails.</h2><p>One provider may handle several roles, or none. VYRA records the accountable legal entity and evidence for each function separately.</p></div>
        <div className="providerGraphCapabilityGrid">
          {graph.capabilityRequirements.map((capability,index) => (
            <article className="providerGraphCapability" key={capability.id}>
              <div><span>{String(index+1).padStart(2,'0')}</span><h3>{capability.label}</h3><small>NOT VERIFIED FOR VYRA</small></div>
              <p>{capability.ownerQuestion}</p>
              <ul>{capability.requiredEvidence.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="providerGraphControls">
        <div><ShieldCheck size={20}/><strong>What it takes to become a connected provider</strong></div>
        <ol>
          <li>Verify the legal entity and current licence directly against the regulator register.</li>
          <li>Record country, customer category and product permissions for VYRA&apos;s exact activity.</li>
          <li>Obtain signed agreements and responsibility allocation for accounts, KYC, assets, execution, complaints and data.</li>
          <li>Connect a sandbox using scoped secrets, signed events, idempotency and failure handling.</li>
          <li>Complete conformance, security, reconciliation and legal/compliance review.</li>
          <li>Require a human release decision for the smallest approved scope; never auto-enable from an API status.</li>
        </ol>
        <p>Every unknown role remains blocked. A technology supplier is not automatically a broker, bank, custodian, payment institution or licensed introducer.</p>
      </section>

      <footer className="providerGraphFooter">
        <span>VYRA PROVIDER GRAPH · {graph.version}</span>
        <Link href="/access-graph">Open Access Graph <ArrowUpRight size={13}/></Link>
      </footer>
    </main>
  );
}
