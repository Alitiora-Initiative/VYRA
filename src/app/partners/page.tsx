import Link from 'next/link';
import { ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react';
import { listPartnerCandidates } from '@/lib/partners/registry';

const categoryLabels: Record<string, string> = {
  brokerage_infrastructure: 'Brokerage infrastructure research',
  multi_asset_introducer: 'Multi-asset introducer research',
  investment_api: 'Investment API research',
};

export default function PartnersPage() {
  const candidates = listPartnerCandidates();

  return (
    <main className="authShell">
      <section className="settingsCard" style={{ maxWidth: 980, width: '100%' }}>
        <Link className="backLink" href="/"><ArrowLeft size={15} /> Back to dashboard</Link>
        <div className="authBrand"><span className="authMark">V</span><span>VYRA<small>MARKETS</small></span></div>
        <div className="authEyebrow">PARTNER ECOSYSTEM</div>
        <h1>Brokerage partners</h1>
        <p className="authLead">
          Research candidates for a future regulated-partner model. These organisations are not connected to VYRA.
        </p>

        <div className="settingsSecurity" style={{ margin: '22px 0', alignItems: 'flex-start' }}>
          <ShieldAlert size={19} />
          <div>
            <strong>Research only — no referral is enabled</strong>
            <small>
              VYRA has no confirmed partnership, licence appointment, customer-country approval or production API connection.
              These cards are not recommendations and do not invite you to open or fund an account through VYRA.
            </small>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
          {candidates.map((candidate) => (
            <article key={candidate.id} style={{
              border: '1px solid rgba(148,163,184,.18)',
              borderRadius: 14,
              padding: 18,
              background: 'rgba(255,255,255,.025)',
              minWidth: 0,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>{candidate.name}</h2>
                  <p style={{ margin: '6px 0 0', color: 'var(--muted, #94a3b8)', fontSize: 12 }}>
                    {categoryLabels[candidate.category] ?? 'Research candidate'}
                  </p>
                </div>
                <span style={{
                  flexShrink: 0,
                  border: '1px solid rgba(234,179,8,.4)',
                  color: '#facc15',
                  borderRadius: 999,
                  padding: '4px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.04em',
                }}>
                  RESEARCH ONLY
                </span>
              </div>
              <ul style={{ paddingLeft: 18, margin: '14px 0', color: 'var(--muted, #94a3b8)', fontSize: 13, lineHeight: 1.55 }}>
                {candidate.notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13 }}>
                <a href={candidate.officialWebsite} target="_blank" rel="noreferrer">Official website <ExternalLink size={12} /></a>
                <a href={candidate.officialDocumentation} target="_blank" rel="noreferrer">Partner documentation <ExternalLink size={12} /></a>
              </div>
              <p style={{ margin: '14px 0 0', fontSize: 11, color: 'var(--muted, #94a3b8)' }}>
                VYRA-approved countries: none. VYRA-approved products: none. Connection: not connected.
              </p>
            </article>
          ))}
        </div>

        <div className="quickLinks" style={{ marginTop: 22 }}>
          <Link href="/api/partners">Partner directory data (API)</Link>
          <Link href="https://github.com/Alitiora-Initiative/VYRA/blob/main/docs/BROKERAGE_MASTER_PLAN.md" target="_blank">Read brokerage master plan</Link>
        </div>
      </section>
    </main>
  );
}
