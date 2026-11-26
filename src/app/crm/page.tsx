'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft, RefreshCw, Users, ListTodo, ShieldAlert, Handshake,
  Plus, ShieldCheck, Search, Clock3, CheckCircle2, AlertTriangle,
  Activity, X,
} from 'lucide-react';

type Lead = {
  id: string; full_name: string; email: string | null; phone: string | null;
  country_code: string; source: string; campaign_name: string | null;
  stage: string; created_at: string; marketing_consent: boolean;
};
type Task = {
  id: string; title: string; description: string | null; priority: string;
  status: string; due_at: string | null; created_at: string; lead_id: string | null;
};
type CaseRecord = {
  id: string; category: string; title: string; summary: string | null;
  partner_reference: string | null; priority: string; status: string; opened_at: string;
};
type Partner = {
  id: string; display_name: string; partner_type: string; country_code: string | null;
  status: string; legal_entity_verified_at: string | null;
  licence_verified_at: string | null; agreement_signed_at: string | null;
  country_scope_approved_at: string | null;
};
type Audit = {
  id: string; action: string; entity_type: string; details: Record<string,string>;
  created_at: string;
};
type CRMData = { leads: Lead[]; tasks: Task[]; cases: CaseRecord[]; partners: Partner[]; audit: Audit[] };

const leadStages = [
  ['new','New'], ['contacted','Contacted'], ['qualified','Qualified'],
  ['eligibility_review','Eligibility review'],
  ['partner_handoff_pending_approval','Partner hand-off pending approval'],
  ['lost','Lost'],
];
const caseCategories = [
  ['kyc_review','KYC review'], ['aml_review','AML review'],
  ['fraud_review','Fraud review'], ['payment_exception','Payment exception'],
  ['dealing_risk','Dealing risk'], ['reconciliation','Reconciliation'],
  ['customer_support','Customer support'], ['complaint','Complaint'],
  ['partner_incident','Partner incident'],
];
const caseRoles: Record<string,string[]> = {
  admin: caseCategories.map(([value]) => value),
  operations: caseCategories.map(([value]) => value),
  compliance: ['kyc_review','aml_review','fraud_review','complaint'],
  finance: ['payment_exception','reconciliation'],
  dealing: ['dealing_risk'],
  support: ['customer_support','complaint'],
  partner_manager: ['partner_incident'],
};

function label(value: string) {
  return value.replaceAll('_',' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function date(value: string | null) {
  if (!value) return 'No due date';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Invalid date' : parsed.toLocaleString();
}

export default function BrokerageCRMPage() {
  const [data, setData] = useState<CRMData>({ leads: [], tasks: [], cases: [], partners: [], audit: [] });
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState<'leads'|'tasks'|'cases'|'partners'|'audit'>('leads');
  const [search, setSearch] = useState('');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [leadForm, setLeadForm] = useState({
    fullName: '', email: '', phone: '', countryCode: 'KE',
    source: 'organic', campaignName: '', marketingConsent: false, contactChannel: 'none',
  });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'normal', dueAt: '' });
  const [caseForm, setCaseForm] = useState({
    category: 'customer_support', title: '', summary: '', partnerReference: '', priority: 'normal',
  });
  const [partnerForm, setPartnerForm] = useState({ displayName: '', partnerType: 'technology_provider', countryCode: '', notes: '' });

  const refresh = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/crm', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? 'CRM could not be loaded.');
      setData(result.data);
      setRole(result.role);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'CRM request failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(() => refresh()); }, [refresh]);

  const metrics = useMemo(() => ({
    leads: data.leads.length,
    qualified: data.leads.filter((item) => ['qualified','eligibility_review','partner_handoff_pending_approval'].includes(item.stage)).length,
    openTasks: data.tasks.filter((item) => ['open','in_progress'].includes(item.status)).length,
    openCases: data.cases.length,
    partnerResearch: data.partners.filter((item) => item.status !== 'approved').length,
  }), [data]);

  const sourceBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of data.leads) counts.set(lead.source, (counts.get(lead.source) ?? 0) + 1);
    return [...counts.entries()].sort((a,b) => b[1] - a[1]).slice(0,5);
  }, [data.leads]);
  const marketBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of data.leads) counts.set(lead.country_code, (counts.get(lead.country_code) ?? 0) + 1);
    return [...counts.entries()].sort((a,b) => b[1] - a[1]).slice(0,5);
  }, [data.leads]);

  const filteredLeads = useMemo(() => data.leads.filter((item) => {
    const term = search.trim().toLowerCase();
    return !term || [item.full_name,item.email ?? '',item.phone ?? '',item.country_code,item.source,item.campaign_name ?? ''].some((value) => value.toLowerCase().includes(term));
  }), [data.leads, search]);
  const filteredTasks = useMemo(() => data.tasks.filter((item) => !search || [item.title,item.description ?? '',item.priority].join(' ').toLowerCase().includes(search.toLowerCase())), [data.tasks, search]);
  const filteredCases = useMemo(() => data.cases.filter((item) => !search || [item.title,item.category,item.summary ?? '',item.partner_reference ?? ''].join(' ').toLowerCase().includes(search.toLowerCase())), [data.cases, search]);
  const filteredPartners = useMemo(() => data.partners.filter((item) => !search || [item.display_name,item.partner_type,item.country_code ?? '',item.status].join(' ').toLowerCase().includes(search.toLowerCase())), [data.partners, search]);

  async function mutate(body: Record<string, unknown>, successMessage: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/crm', {
        method: body.kind && body.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? 'CRM update failed.');
      setNotice(result.notice ?? successMessage);
      await refresh();
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'CRM update failed.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await mutate({ kind: 'lead', ...leadForm }, 'Prospect added to CRM.');
    if (saved) {
      setLeadForm({ fullName: '', email: '', phone: '', countryCode: 'KE', source: 'organic', campaignName: '', marketingConsent: false, contactChannel: 'none' });
      setShowLeadForm(false);
    }
  }
  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await mutate({ kind: 'task', ...taskForm }, 'Task added to your queue.');
    if (saved) {
      setTaskForm({ title: '', description: '', priority: 'normal', dueAt: '' });
      setShowTaskForm(false);
    }
  }
  async function createCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await mutate({ kind: 'case', ...caseForm }, 'Operations case opened.');
    if (saved) {
      setCaseForm({ category: 'customer_support', title: '', summary: '', partnerReference: '', priority: 'normal' });
      setShowCaseForm(false);
    }
  }

  async function createPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await mutate({ kind: 'partner', ...partnerForm }, 'Research-only partner record added.');
    if (saved) {
      setPartnerForm({ displayName: '', partnerType: 'technology_provider', countryCode: '', notes: '' });
      setShowPartnerForm(false);
    }
  }

  const tabs = [
    { id: 'leads', name: 'Leads', icon: Users, count: metrics.leads },
    { id: 'tasks', name: 'Tasks', icon: ListTodo, count: metrics.openTasks },
    { id: 'cases', name: 'Operations cases', icon: ShieldAlert, count: metrics.openCases },
    { id: 'partners', name: 'Partners', icon: Handshake, count: data.partners.length },
    { id: 'audit', name: 'Audit trail', icon: Activity, count: data.audit.length },
  ] as const;

  return <main className="crmShell">
    <header className="crmTopbar">
      <Link href="/" className="crmBack"><ArrowLeft size={16}/> Back to VYRA Markets</Link>
      <div className="crmBrand"><span>V</span><div>VYRA <small>CRM & OPERATIONS</small></div></div>
      <button className="crmRefresh" onClick={() => void refresh()} disabled={loading || busy}><RefreshCw size={15}/> Refresh</button>
    </header>

    <section className="crmPage">
      <div className="crmHero">
        <div>
          <div className="crmEyebrow"><ShieldCheck size={14}/> STAFF WORKSPACE · {role ? label(role) : 'ACCESS CONTROLLED'}</div>
          <h1>Brokerage operations desk</h1>
          <p>One place for prospect relationships, partner work, service queues and operational evidence.</p>
        </div>
        <div className="crmHeroState"><span/> CRM CONTROL PLANE</div>
      </div>

      <div className="crmSafetyNotice">
        <AlertTriangle size={18}/>
        <div><strong>Partner-led and paper-only boundary</strong><p>This CRM does not open regulated accounts, decide KYC/AML outcomes, accept money, send external referrals or place live trades. Regulated account and payment records remain with the licensed partner.</p></div>
      </div>

      {error && <div className="crmAlert" role="alert"><X size={16}/>{error}</div>}
      {notice && <div className="crmNotice" role="status"><CheckCircle2 size={16}/>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={14}/></button></div>}

      <div className="crmMetrics">
        <article><span>Prospects</span><strong>{loading ? '—' : metrics.leads}</strong><small>Recorded in this workspace</small></article>
        <article><span>Qualified / review</span><strong>{loading ? '—' : metrics.qualified}</strong><small>Not an approved partner client count</small></article>
        <article><span>Open tasks</span><strong>{loading ? '—' : metrics.openTasks}</strong><small>Assigned work items</small></article>
        <article><span>Open cases</span><strong>{loading ? '—' : metrics.openCases}</strong><small>Operational exceptions and service cases</small></article>
        <article><span>Partner reviews</span><strong>{loading ? '—' : metrics.partnerResearch}</strong><small>Not yet fully approved</small></article>
      </div>

      <div className="crmAnalyticsStrip">
        <article><h3>Acquisition sources</h3><p>Prospect records by captured first source</p>
          {sourceBreakdown.length ? sourceBreakdown.map(([name,count]) => <div className="crmBarRow" key={name}><span>{label(name)}</span><div><i style={{ width: (count / Math.max(1, metrics.leads) * 100) + '%' }}/></div><b>{count}</b></div>) : <small>No source data yet</small>}
        </article>
        <article><h3>Market pipeline</h3><p>Prospect volume by country code</p>
          {marketBreakdown.length ? marketBreakdown.map(([name,count]) => <div className="crmBarRow" key={name}><span>{name}</span><div><i style={{ width: (count / Math.max(1, metrics.leads) * 100) + '%' }}/></div><b>{count}</b></div>) : <small>No market data yet</small>}
        </article>
      </div>

      <div className="crmWorkspace">
        <nav className="crmTabs" aria-label="CRM sections">
          {tabs.map((item) => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => { setTab(item.id); setSearch(''); }}>
            <item.icon size={16}/><span>{item.name}</span><b>{item.count}</b>
          </button>)}
        </nav>
        <div className="crmContent">
          <div className="crmSectionHead">
            <div><h2>{tabs.find((item) => item.id === tab)?.name}</h2><p>{tab === 'leads' ? 'Capture enquiries and track source, country and next action.' : tab === 'tasks' ? 'Follow up the work assigned to your staff account.' : tab === 'cases' ? 'Route sensitive onboarding, payments, fraud, dealing and service exceptions.' : tab === 'partners' ? 'Track partner due diligence; unverified suppliers cannot be activated.' : 'Append-only record of CRM changes.'}</p></div>
            <div className="crmHeadActions">
              {tab !== 'audit' && <label className="crmSearch"><Search size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this queue"/></label>}
              {tab === 'leads' && role && ['admin','sales'].includes(role) && <button className="crmPrimary" onClick={() => setShowLeadForm((value) => !value)}><Plus size={15}/> Add prospect</button>}
              {tab === 'tasks' && role && ['admin','sales','support','compliance','finance','dealing','operations','partner_manager'].includes(role) && <button className="crmPrimary" onClick={() => setShowTaskForm((value) => !value)}><Plus size={15}/> Add task</button>}
              {tab === 'cases' && (caseRoles[role]?.length ?? 0) > 0 && <button className="crmPrimary" onClick={() => { setCaseForm((current) => ({ ...current, category: caseRoles[role]?.[0] ?? 'customer_support' })); setShowCaseForm((value) => !value); }}><Plus size={15}/> Open case</button>}
              {tab === 'partners' && role && ['admin','partner_manager'].includes(role) && <button className="crmPrimary" onClick={() => setShowPartnerForm((value) => !value)}><Plus size={15}/> Add partner</button>}
            </div>
          </div>

          {showLeadForm && tab === 'leads' && <form className="crmForm" onSubmit={createLead}>
            <div className="crmFormTitle"><strong>New prospect</strong><button type="button" onClick={() => setShowLeadForm(false)} aria-label="Close"><X size={16}/></button></div>
            <div className="crmFormGrid">
              <label>Full name<input required maxLength={120} value={leadForm.fullName} onChange={(event) => setLeadForm({ ...leadForm, fullName: event.target.value })}/></label>
              <label>Email<input type="email" maxLength={254} value={leadForm.email} onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })} placeholder="Optional if phone is supplied"/></label>
              <label>Phone<input maxLength={32} value={leadForm.phone} onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })} placeholder="International format preferred"/></label>
              <label>Country code<input required minLength={2} maxLength={2} value={leadForm.countryCode} onChange={(event) => setLeadForm({ ...leadForm, countryCode: event.target.value.toUpperCase() })}/></label>
              <label>Acquisition source<select value={leadForm.source} onChange={(event) => setLeadForm({ ...leadForm, source: event.target.value })}>{['organic','paid_search','paid_social','affiliate','introducing_broker','community','referral','direct','event','other'].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
              <label>Campaign name<input maxLength={120} value={leadForm.campaignName} onChange={(event) => setLeadForm({ ...leadForm, campaignName: event.target.value })}/></label>
            </div>
            <div className="crmConsent">
              <label><input type="checkbox" checked={leadForm.marketingConsent} onChange={(event) => setLeadForm({ ...leadForm, marketingConsent: event.target.checked, contactChannel: event.target.checked ? (leadForm.email ? 'email' : leadForm.phone ? 'phone' : 'none') : 'none' })}/> Prospect explicitly consented to marketing (must be documented)</label>
              {leadForm.marketingConsent && <label>Consent channel<select value={leadForm.contactChannel} onChange={(event) => setLeadForm({ ...leadForm, contactChannel: event.target.value })}><option value="email">Email</option><option value="phone">Phone</option></select></label>}
              <small>Do not tick unless consent was actually obtained. The current consent policy version is a draft and is not approved for live campaigns.</small>
            </div>
            <button className="crmPrimary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save prospect'}</button>
          </form>}

          {showTaskForm && tab === 'tasks' && <form className="crmForm" onSubmit={createTask}>
            <div className="crmFormTitle"><strong>New task</strong><button type="button" onClick={() => setShowTaskForm(false)} aria-label="Close"><X size={16}/></button></div>
            <div className="crmFormGrid">
              <label>Task title<input required minLength={3} maxLength={140} value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}/></label>
              <label>Priority<select value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}>{['low','normal','high','urgent'].map((v) => <option key={v}>{v}</option>)}</select></label>
              <label>Due date<input type="datetime-local" value={taskForm.dueAt} onChange={(event) => setTaskForm({ ...taskForm, dueAt: event.target.value })}/></label>
              <label>Description<input maxLength={500} value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })}/></label>
            </div>
            <button className="crmPrimary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Create task'}</button>
          </form>}

          {showPartnerForm && tab === 'partners' && <form className="crmForm" onSubmit={createPartner}>
            <div className="crmFormTitle"><strong>New partner research record</strong><button type="button" onClick={() => setShowPartnerForm(false)} aria-label="Close"><X size={16}/></button></div>
            <div className="crmFormGrid">
              <label>Organisation / partner name<input required minLength={2} maxLength={120} value={partnerForm.displayName} onChange={(event) => setPartnerForm({ ...partnerForm, displayName: event.target.value })}/></label>
              <label>Partner category<select value={partnerForm.partnerType} onChange={(event) => setPartnerForm({ ...partnerForm, partnerType: event.target.value })}>{['affiliate','introducing_broker','community','technology_provider','regulated_principal','other'].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
              <label>Country code (optional)<input maxLength={2} value={partnerForm.countryCode} onChange={(event) => setPartnerForm({ ...partnerForm, countryCode: event.target.value.toUpperCase() })} placeholder="KE"/></label>
              <label className="wide">Research notes only<input maxLength={600} value={partnerForm.notes} onChange={(event) => setPartnerForm({ ...partnerForm, notes: event.target.value })}/></label>
            </div>
            <small className="crmFormHint">Every new record is automatically marked RESEARCH ONLY. Staff cannot self-certify licences, agreements or market permissions here.</small>
            <button className="crmPrimary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save research partner'}</button>
          </form>}

          {showCaseForm && tab === 'cases' && <form className="crmForm" onSubmit={createCase}>
            <div className="crmFormTitle"><strong>New operations case</strong><button type="button" onClick={() => setShowCaseForm(false)} aria-label="Close"><X size={16}/></button></div>
            <div className="crmFormGrid">
              <label>Category<select value={caseForm.category} onChange={(event) => setCaseForm({ ...caseForm, category: event.target.value })}>{caseCategories.filter(([value]) => caseRoles[role]?.includes(value)).map(([value,name]) => <option key={value} value={value}>{name}</option>)}</select></label>
              <label>Title<input required minLength={3} maxLength={140} value={caseForm.title} onChange={(event) => setCaseForm({ ...caseForm, title: event.target.value })}/></label>
              <label>Priority<select value={caseForm.priority} onChange={(event) => setCaseForm({ ...caseForm, priority: event.target.value })}>{['low','normal','high','urgent'].map((v) => <option key={v}>{v}</option>)}</select></label>
              <label>Partner reference (opaque ID only)<input maxLength={100} value={caseForm.partnerReference} onChange={(event) => setCaseForm({ ...caseForm, partnerReference: event.target.value })}/></label>
              <label className="wide">Summary (do not enter identity or payment secrets)<textarea maxLength={600} value={caseForm.summary} onChange={(event) => setCaseForm({ ...caseForm, summary: event.target.value })}/></label>
            </div>
            <button className="crmPrimary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Open case'}</button>
          </form>}

          {loading ? <div className="crmEmpty">Loading CRM workspace…</div> : error.includes('not been provisioned') ? <div className="crmEmpty"><ShieldAlert size={22}/><strong>Staff access is not provisioned</strong><p>A database administrator must explicitly add an authorised staff member and role. Ordinary customer accounts cannot access this CRM.</p></div> :
          <>
            {tab === 'leads' && <div className="crmTableWrap"><table className="crmTable"><thead><tr><th>Prospect</th><th>Market</th><th>Source / campaign</th><th>Stage</th><th>Consent</th><th>Created</th></tr></thead><tbody>
              {filteredLeads.map((lead) => <tr key={lead.id}><td><strong>{lead.full_name}</strong><small>{lead.email || lead.phone}</small></td><td>{lead.country_code}</td><td>{label(lead.source)}<small>{lead.campaign_name || 'No campaign tagged'}</small></td><td><select aria-label={'Stage for '+lead.full_name} value={lead.stage} onChange={(event) => void mutate({kind:'lead',id:lead.id,stage:event.target.value},'Lead stage updated.')}>{leadStages.map(([value,name]) => <option key={value} value={value}>{name}</option>)}</select></td><td><span className={lead.marketing_consent ? 'crmTag green' : 'crmTag'}>{lead.marketing_consent ? 'Recorded' : 'No marketing consent'}</span></td><td>{date(lead.created_at)}</td></tr>)}
              {filteredLeads.length === 0 && <tr><td colSpan={6} className="crmNoRows">No prospect records yet. Nothing is pre-filled with demo contacts.</td></tr>}
            </tbody></table></div>}

            {tab === 'tasks' && <div className="crmCardList">{filteredTasks.map((item) => <article className="crmQueueCard" key={item.id}><div><span className={'crmPriority '+item.priority}>{item.priority}</span><h3>{item.title}</h3><p>{item.description || 'No additional notes'}</p><small><Clock3 size={13}/> {date(item.due_at)}</small></div><select aria-label={'Task status '+item.title} value={item.status} onChange={(event) => void mutate({kind:'task',id:item.id,status:event.target.value},'Task updated.')}><option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option><option value="cancelled">Cancelled</option></select></article>)}{filteredTasks.length === 0 && <div className="crmEmpty">No open tasks in this queue.</div>}</div>}

            {tab === 'cases' && <div className="crmCardList">{filteredCases.map((item) => <article className="crmQueueCard" key={item.id}><div><span className={'crmPriority '+item.priority}>{item.priority}</span><span className="crmCaseType">{label(item.category)}</span><h3>{item.title}</h3><p>{item.summary || 'No summary supplied'}</p><small>Opened {date(item.opened_at)}{item.partner_reference ? ' · Ref '+item.partner_reference : ''}</small></div><select aria-label={'Case status '+item.title} value={item.status} onChange={(event) => void mutate({kind:'case',id:item.id,status:event.target.value},'Case status updated.')}><option value="open">Open</option><option value="investigating">Investigating</option><option value="waiting_on_partner">Waiting on partner</option><option value="escalated">Escalated</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></article>)}{filteredCases.length === 0 && <div className="crmEmpty">No open operational cases in queues visible to your role.</div>}</div>}

            {tab === 'partners' && <div className="crmTableWrap"><table className="crmTable"><thead><tr><th>Partner</th><th>Type / country</th><th>Status</th><th>Legal entity</th><th>Licence</th><th>Agreement</th><th>Country scope</th></tr></thead><tbody>{filteredPartners.map((partner) => <tr key={partner.id}><td><strong>{partner.display_name}</strong></td><td>{label(partner.partner_type)}<small>{partner.country_code || 'Multi-country not verified'}</small></td><td><span className="crmTag">{label(partner.status)}</span></td><td>{partner.legal_entity_verified_at ? 'Verified' : 'Unverified'}</td><td>{partner.licence_verified_at ? 'Verified' : 'Unverified'}</td><td>{partner.agreement_signed_at ? 'Signed' : 'Not signed'}</td><td>{partner.country_scope_approved_at ? 'Approved' : 'Not approved'}</td></tr>)}{filteredPartners.length === 0 && <tr><td colSpan={7} className="crmNoRows">No partners have been inserted. Research candidates elsewhere in VYRA remain non-contractual.</td></tr>}</tbody></table></div>}

            {tab === 'audit' && <div className="crmCardList">{data.audit.map((event) => <article className="crmAuditRow" key={event.id}><Activity size={15}/><div><strong>{label(event.action)}</strong><p>{label(event.entity_type)} · {Object.entries(event.details ?? {}).map(([key,value]) => key+': '+value).join(' · ')}</p><small>{date(event.created_at)}</small></div></article>)}{data.audit.length === 0 && <div className="crmEmpty">No CRM audit events recorded yet.</div>}</div>}
          </>}
        </div>
      </div>

      <footer className="crmFooter"><span>VYRA CRM · STAFF ACCESS ONLY</span><span>Role: {role ? label(role) : 'Not provisioned'} · Live execution disabled</span></footer>
    </section>
  </main>;
}
