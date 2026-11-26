'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity, ArrowLeft, ArrowUpRight, BarChart3, Clock3, Database,
  ExternalLink, RefreshCw, Search, ShieldCheck, WifiOff,
} from 'lucide-react';
import { evaluateCfdQuote } from '@/lib/cfd/market.mjs';

type AssetClass = 'forex' | 'index' | 'equity' | 'commodity' | 'crypto';
type CfdQuote = {
  bid: number | string;
  ask: number | string;
  source: string;
  quoteKind: 'indicative' | 'executable';
  observedAt: string;
};
type CfdContract = {
  id: string;
  contract_code: string;
  display_name: string;
  underlying_symbol: string;
  asset_class: AssetClass;
  contract_size: number | string;
  min_lots: number | string;
  max_lots: number | string;
  lot_step: number | string;
  tick_size: number | string;
  tick_value: number | string | null;
  quote_currency: string;
  margin_currency: string;
  provider_symbol: string;
  provider_name: string;
  contract_source_url: string | null;
  quote: CfdQuote | null;
};
type MarketResponse = {
  ok: boolean;
  status: string;
  error?: string;
  contracts?: CfdContract[];
  fetchedAt?: string;
};

const filters = [
  { value: 'all', label: 'All contracts' },
  { value: 'forex', label: 'Forex' },
  { value: 'index', label: 'Indices' },
  { value: 'commodity', label: 'Commodities' },
  { value: 'equity', label: 'Shares' },
  { value: 'crypto', label: 'Crypto CFDs' },
] as const;

function price(value: number | string, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: amount < 10 ? 6 : 3,
  }).format(amount) + ' ' + currency;
}

function time(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleTimeString() : 'Timestamp unavailable';
}

function assetLabel(value: AssetClass) {
  return ({ forex: 'Forex', index: 'Index CFD', equity: 'Share CFD', commodity: 'Commodity', crypto: 'Crypto CFD' })[value] ?? value;
}

export default function CfdTraderoomPage() {
  const [contracts, setContracts] = useState<CfdContract[]>([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [lastFetched, setLastFetched] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number]['value']>('all');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (active) setRefreshing(true);
      try {
        const response = await fetch('/api/cfd/market', { cache: 'no-store' });
        const data = await response.json() as MarketResponse;
        if (!active) return;
        if (!response.ok || !data.ok) {
          setContracts([]);
          setStatus(data.status || 'unavailable');
          setError(data.error || 'CFD market data is unavailable.');
        } else {
          setContracts(Array.isArray(data.contracts) ? data.contracts : []);
          setStatus(data.status);
          setError('');
          setLastFetched(data.fetchedAt || '');
        }
      } catch {
        if (!active) return;
        setContracts([]);
        setStatus('unavailable');
        setError('Could not reach the CFD market-data endpoint. No cached or sample prices are displayed.');
      } finally {
        if (active) setRefreshing(false);
      }
    };

    void Promise.resolve().then(refresh);
    const timer = window.setInterval(() => { void refresh(); }, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return contracts.filter((contract) => {
      const categoryMatches = filter === 'all' || contract.asset_class === filter;
      const queryMatches = !normalized || [
        contract.contract_code,
        contract.display_name,
        contract.underlying_symbol,
        contract.provider_name,
      ].some((value) => value.toLowerCase().includes(normalized));
      return categoryMatches && queryMatches;
    });
  }, [contracts, filter, query]);

  const freshQuotes = contracts.filter((contract) =>
    evaluateCfdQuote(contract.quote ? {
      bid: contract.quote.bid,
      ask: contract.quote.ask,
      observedAt: contract.quote.observedAt,
    } : null).available
  ).length;

  return <main className="cfdRoom">
    <header className="cfdTopbar">
      <Link href="/" className="cfdBack"><ArrowLeft size={16}/> VYRA workspace</Link>
      <div className="cfdTopActions">
        <Link href="/provider-graph">Provider Graph <ArrowUpRight size={14}/></Link>
        <Link href="/access-graph">Access Graph <ArrowUpRight size={14}/></Link>
      </div>
    </header>

    <div className="cfdPage">
      <section className="cfdHero">
        <div>
          <div className="cfdEyebrow"><BarChart3 size={14}/> VYRA MARKETS / FOREX & CFD</div>
          <h1>CFD Traderoom</h1>
          <p>Provider-sourced contracts, transparent bid/ask quotes and policy-first risk controls.</p>
        </div>
        <div className="cfdMode"><ShieldCheck size={16}/> PAPER MODE · EXECUTION LOCKED</div>
      </section>

      <section className="cfdNotice">
        <ShieldCheck size={20}/>
        <div>
          <strong>CFD market-data room — no live trading</strong>
          <p>Prices are shown only when an enabled CFD contract and an authorised fresh quote exist in the VYRA registry. The current build does not submit orders, route liquidity, accept deposits or hold client money.</p>
        </div>
      </section>

      <section className="cfdStats">
        <article><span>Enabled contracts</span><strong>{contracts.length}</strong><small>Provider-reviewed registry</small></article>
        <article><span>Fresh quotes</span><strong>{freshQuotes}</strong><small>Database freshness policy applies</small></article>
        <article><span>Execution routes</span><strong>Locked</strong><small>A/B/Hybrid remain paper architecture only</small></article>
      </section>

      <section className="cfdMainGrid">
        <div className="cfdMarketPanel">
          <div className="cfdPanelHead">
            <div><h2>Contract market watch</h2><p>Only published instruments appear here.</p></div>
            <button className="cfdRefresh" type="button" onClick={() => window.location.reload()} disabled={refreshing}><RefreshCw size={15}/> Refresh</button>
          </div>

          <div className="cfdFilters">
            <label className="cfdSearch"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search symbol, name or provider"/></label>
            <div className="cfdFilterRow">
              {filters.map((item) => <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={filter === item.value ? 'active' : ''}>{item.label}</button>)}
            </div>
          </div>

          {status === 'loading' && <div className="cfdEmpty"><Activity size={24}/><strong>Connecting to CFD registry</strong><p>Loading enabled contracts and fresh provider quotes.</p></div>}
          {error && <div className="cfdEmpty cfdError"><WifiOff size={24}/><strong>CFD data is not ready</strong><p>{error}</p><span>Check the migration and database connection before opening this room to users.</span></div>}
          {!error && status === 'empty' && <div className="cfdEmpty"><Database size={25}/><strong>No CFD contracts published yet</strong><p>The registry is intentionally empty. VYRA will not create sample symbols or substitute spot FX, crypto or equity prices for CFD quotes.</p><span>Publish a contract only after its signed provider specification, country eligibility and market-data entitlement have been reviewed.</span></div>}
          {!error && status !== 'loading' && contracts.length > 0 && filtered.length === 0 && <div className="cfdEmpty"><Search size={22}/><strong>No matching contracts</strong><p>Change the asset filter or search phrase.</p></div>}

          {filtered.length > 0 && <div className="cfdContractList">
            {filtered.map((contract) => {
              const quoteState = evaluateCfdQuote(contract.quote ? {
                bid: contract.quote.bid,
                ask: contract.quote.ask,
                observedAt: contract.quote.observedAt,
              } : null);
              const quote = contract.quote;
              return <article className="cfdContract" key={contract.id}>
                <div className="cfdInstrument">
                  <span className="cfdAssetIcon">{contract.asset_class === 'forex' ? 'FX' : contract.asset_class === 'index' ? 'IDX' : contract.asset_class === 'commodity' ? 'COM' : contract.asset_class === 'equity' ? 'EQ' : 'CRY'}</span>
                  <div><strong>{contract.contract_code}</strong><small>{contract.display_name} · {assetLabel(contract.asset_class)}</small></div>
                </div>
                <div className="cfdQuoteCell"><small>Bid</small><strong>{quoteState.available && quote ? price(quote.bid, contract.quote_currency) : 'Unavailable'}</strong></div>
                <div className="cfdQuoteCell"><small>Ask</small><strong>{quoteState.available && quote ? price(quote.ask, contract.quote_currency) : 'Unavailable'}</strong></div>
                <div className="cfdQuoteCell"><small>Spread</small><strong>{quoteState.available && quoteState.spreadBps !== null ? quoteState.spreadBps.toFixed(2) + ' bps' : '—'}</strong></div>
                <div className="cfdSourceCell">
                  {quoteState.available && quote ? <><span className="cfdQuoteBadge">{quote.quoteKind === 'executable' ? 'PROVIDER-LABELLED EXECUTABLE' : 'INDICATIVE'}</span><small>{quote.source} · {time(quote.observedAt)}</small></> : <><span className="cfdUnavailable">QUOTE UNAVAILABLE</span><small>{quoteState.reason || 'No fresh provider quote in the permitted window.'}</small></>}
                </div>
              </article>;
            })}
          </div>}

          <div className="cfdPanelFoot"><span><Clock3 size={13}/> Auto-refresh every 15 seconds while this page is open.</span><span>{lastFetched ? 'Registry checked ' + time(lastFetched) : 'Waiting for first registry response'}</span></div>
        </div>

        <aside className="cfdExecutionPanel">
          <div className="cfdPanelHead"><div><h2>Order ticket</h2><p>Paper CFD execution</p></div><ShieldCheck size={18}/></div>
          <div className="cfdLock"><ShieldCheck size={30}/><strong>Not released</strong><p>Orders remain disabled until VYRA has a reviewed jurisdiction/client margin policy, paper account ledger, server-side order validation and tested close-out workflow.</p></div>
          <div className="cfdGateList">
            <div><span className="cfdGatePending"/>Approved contract catalogue<strong>Pending</strong></div>
            <div><span className="cfdGatePending"/>Fresh CFD price feed<strong>Pending</strong></div>
            <div><span className="cfdGatePending"/>Country/client margin policy<strong>Not seeded</strong></div>
            <div><span className="cfdGatePending"/>Paper CFD account & ledger<strong>Not built</strong></div>
            <div><span className="cfdGatePending"/>Order/close-out test suite<strong>Pending</strong></div>
          </div>
          <Link href="/provider-graph" className="cfdGateLink">Review market-data and liquidity providers <ExternalLink size={14}/></Link>
          <p className="cfdPanelDisclaimer">No leverage is assumed. A missing or expired policy must block an order rather than fall back to a generic ratio. A provider-labelled quote is not a promise of VYRA execution.</p>
        </aside>
      </section>

      <section className="cfdBottomNotice"><Database size={17}/><div><strong>Source integrity</strong><p>The room reads the VYRA CFD contract and quote tables. It does not use the existing spot market board as a proxy, and it does not fabricate an instrument list when those tables are empty.</p></div></section>
      <footer className="cfdFooter">VYRA Markets · Forex & CFD software foundation · Paper-only research environment · Not a licensed brokerage service.</footer>
    </div>
  </main>;
}
