import Link from 'next/link';
import { notFound } from 'next/navigation';

const DOCUMENTS: Record<string, { title: string; description: string }> = {
  aml: { title: 'Anti-money laundering policy', description: 'The AML/CTF and sanctions policy must be supplied or approved by the regulated provider and VYRA counsel for the actual operating model.' },
  payment_policy: { title: 'Payment policy', description: 'The payment policy must name the actual payment provider, client-money holder, accepted methods, settlement timing, refunds and complaint owner.' },
  term: { title: 'Terms and conditions', description: 'Customer terms must identify the actual contracting legal entity, services, jurisdictions, product restrictions and responsible regulated provider.' },
  order_execution: { title: 'Order execution policy', description: 'An execution policy can only be published after the executing broker, execution model, venues, order handling and conflicts are confirmed in writing.' },
  privacy: { title: 'Privacy notice', description: 'A final privacy notice requires a verified data inventory, controller/processor roles, hosting and transfer locations, retention periods and contact details.' },
  general_fees: { title: 'General fees', description: 'Fees must be supplied and approved by the provider. VYRA will not invent spreads, commissions, deposit charges, withdrawal fees or inactivity fees.' },
};

export function generateStaticParams() {
  return Object.keys(DOCUMENTS).map((document) => ({ document }));
}

export default async function LegalDocumentStatusPage({
  params,
}: {
  params: Promise<{ document: string }>;
}) {
  const { document } = await params;
  const item = DOCUMENTS[document];
  if (!item) notFound();

  return (
    <main className="legalStatusShell">
      <section className="legalStatusCard">
        <Link className="legalStatusBrand" href="/">VYRA <span>MARKETS</span></Link>
        <p className="eyebrow">DOCUMENT STATUS · NOT A PUBLISHED POLICY</p>
        <h1>{item.title}</h1>
        <div className="legalPending">Pending regulated-provider and legal approval</div>
        <p>{item.description}</p>
        <p className="legalFinePrint">This page is a publication-status notice, not the legal document itself. VYRA has no active customer-money, deposit, withdrawal or live-execution service. Do not rely on this page as a contractual term, compliance policy or legal advice.</p>
        <Link className="legalBack" href="/">Return to VYRA Markets</Link>
      </section>
    </main>
  );
}
