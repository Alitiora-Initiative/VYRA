'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  Activity, ArrowUpRight, Bell, BriefcaseBusiness,
  ChartNoAxesCombined, CircleHelp, Command, CreditCard, Globe2,
  LayoutDashboard, LogIn, Menu, Plus, Settings, ShieldCheck,
  Star, RefreshCw, ExternalLink, X, Network,
} from 'lucide-react';

type Quote = {
  symbol: string; name: string; assetClass: string; price: number;
  changePercent: number | null; currency: string; source: string; asOf: string;
};
type PaperAccount = {
  id: string; account_type: string; status: string; currency: string;
  cashBalance: number; availableCash: number; reservedCash: number;
  riskLimits?: { max_order_notional: number; max_position_notional: number; max_daily_realized_loss: number; slippage_bps: number } | null;
  positions: Array<{ instrument_id: string; quantity: number; average_cost: number; reservedQuantity: number; availableQuantity: number; instrument_catalog?: { symbol: string; name: string; asset_class: string } }>;
};
type Order = {
  id: string; side: string; order_type: string; quantity: number;
  status: string; average_fill_price: number | null; created_at: string;
  instrument_catalog?: { symbol: string; name: string };
};
type LedgerTransaction = {
  id: string; event_type: string; description: string; created_at: string;
  ledger_entries?: Array<{
    id: string; direction: 'debit' | 'credit'; amount: number; currency: string;
    ledger_accounts?: { account_code: string };
  }>;
};

const nav = [
  ['Overview', LayoutDashboard], ['Markets', ChartNoAxesCombined],
  ['Portfolio', BriefcaseBusiness], ['Activity', Activity],
] as const;

function money(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

function quoteIsFresh(quote: Quote) {
  const age = Date.now() - new Date(quote.asOf).getTime();
  return Number.isFinite(age) && age >= -30_000 && age <= 60_000;
}

export default function Home() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [unavailable, setUnavailable] = useState<Array<{assetClass:string;reason:string;provider:string}>>([]);
  const [account, setAccount] = useState<PaperAccount | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ledger, setLedger] = useState<LedgerTransaction[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [active, setActive] = useState('Overview');
  const [watch, setWatch] = useState<string[]>(['BTC-USD', 'ETH-USD', 'NVDA']);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [orderOpen, setOrderOpen] = useState(false);
  const [symbol, setSymbol] = useState('BTC-USD');
  const [side, setSide] = useState<'buy'|'sell'>('buy');
  const [orderType, setOrderType] = useState<'market'|'limit'>('market');
  const [quantity, setQuantity] = useState('0.01');
  const [limitPrice, setLimitPrice] = useState('');

  const loadMarkets = useCallback(async () => {
    try {
      const response = await fetch('/api/markets', { cache: 'no-store' });
      const data = await response.json();
      setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
      setUnavailable(Array.isArray(data.unavailable) ? data.unavailable : []);
    } catch {
      setQuotes([]);
      setUnavailable([{assetClass:'all',provider:'VYRA API',reason:'Market data request failed. Old quotes have been cleared.'}]);
    }
  }, []);

  const loadAccount = useCallback(async () => {
    try {
      const me = await fetch('/api/me', { cache: 'no-store' });
      if (!me.ok) { setUserEmail(null); setAccount(null); setOrders([]); setLedger([]); setWatch(['BTC-USD','ETH-USD','NVDA']); return; }
      const meData = await me.json();
      setUserEmail(meData.user?.email ?? null);
      const watchResponse = await fetch('/api/watchlist', { cache: 'no-store' });
      if (watchResponse.ok) {
        const watchData = await watchResponse.json();
        if (Array.isArray(watchData.items)) {
          setWatch(watchData.items.flatMap((item: { instrument_catalog?: { symbol?: string } }) =>
            item.instrument_catalog?.symbol ? [item.instrument_catalog.symbol] : []
          ));
        }
      }
      const response = await fetch('/api/trading/paper/accounts', { cache: 'no-store' });
      if (!response.ok) { setAccount(null); setOrders([]); setLedger([]); return; }
      const data = await response.json();
      const nextAccount = data.accounts?.[0] ?? null;
      setAccount(nextAccount);
      if (nextAccount?.id) {
        const orderResponse = await fetch('/api/trading/paper/orders?accountId=' + encodeURIComponent(nextAccount.id), { cache: 'no-store' });
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          setOrders(Array.isArray(orderData.orders) ? orderData.orders : []);
        }
        const ledgerResponse = await fetch('/api/trading/paper/ledger?accountId=' + encodeURIComponent(nextAccount.id), { cache: 'no-store' });
        if (ledgerResponse.ok) {
          const ledgerData = await ledgerResponse.json();
          setLedger(Array.isArray(ledgerData.transactions) ? ledgerData.transactions : []);
        } else {
          setLedger([]);
        }
      } else {
        setOrders([]);
        setLedger([]);
      }
    } catch {
      setAccount(null);
      setOrders([]);
      setLedger([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      // Yield before invoking callbacks that update React state.
      await Promise.resolve();
      if (!mounted) return;
      await Promise.all([loadMarkets(), loadAccount()]);
      if (mounted) setLoading(false);
    })();
    const timer = window.setInterval(() => { void loadMarkets(); }, 60000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [loadMarkets, loadAccount]);

  const portfolioValue = useMemo(() => {
    if (!account) return null;
    const positionsValue = account.positions.reduce((total, position) => {
      const positionSymbol = position.instrument_catalog?.symbol;
      const quote = quotes.find((item) => item.symbol === positionSymbol);
      return total + (quote && quote.currency === account.currency && quoteIsFresh(quote) ? Number(position.quantity) * quote.price : 0);
    }, 0);
    return Number(account.cashBalance) + positionsValue;
  }, [account, quotes]);

  async function openPaperAccount() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/trading/paper/accounts', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Could not open paper account.');
      setMessage(data.account?.created ? 'Paper account opened with a $100,000 simulated starting balance.' : 'Your paper account is ready.');
      await loadAccount();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Account setup failed.'); }
    finally { setBusy(false); }
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) return;
    setBusy(true); setMessage('');
    try {
      const body = {
        accountId: account.id, symbol, side, type: orderType,
        quantity: Number(quantity),
        ...(orderType === 'limit' ? { limitPrice: Number(limitPrice) } : {}),
        clientOrderId: crypto.randomUUID(),
      };
      const response = await fetch('/api/trading/paper/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Paper order rejected.');
      setMessage(data.result?.status === 'filled' ? 'Paper order filled. This is a simulation, not a broker execution.' : 'Paper limit order queued and waiting for a marketable quote.');
      setOrderOpen(false);
      await Promise.all([loadAccount(), loadMarkets()]);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Order submission failed.'); }
    finally { setBusy(false); }
  }

  async function cancelOrder(orderId: string) {
    setBusy(true);
    try {
      const response = await fetch('/api/trading/paper/orders/' + orderId + '/cancel', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Cancel failed.');
      setMessage('Open paper order cancelled.');
      await loadAccount();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Cancel failed.'); }
    finally { setBusy(false); }
  }

  const tradableQuotes = quotes.filter((item) => item.currency === (account?.currency ?? 'USD') && quoteIsFresh(item));
  const selectedQuote = tradableQuotes.find((item) => item.symbol === symbol);
  async function toggleWatch(symbolToToggle: string) {
    const adding = !watch.includes(symbolToToggle);
    setWatch((current) => adding
      ? [...current, symbolToToggle]
      : current.filter((value) => value !== symbolToToggle));
    if (!userEmail) return;

    try {
      const response = await fetch('/api/watchlist', {
        method: adding ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbolToToggle }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? 'Watchlist update failed.');
    } catch (error) {
      setWatch((current) => adding
        ? current.filter((value) => value !== symbolToToggle)
        : [...current, symbolToToggle]);
      setMessage(error instanceof Error ? error.message : 'Watchlist update failed.');
    }
  }
  function showOrder(preferredSymbol?: string) {
    const preferred = tradableQuotes.find((item) => item.symbol === preferredSymbol) ?? tradableQuotes[0];
    if (!preferred) {
      setMessage('There are no fresh USD-quoted instruments available for paper execution.');
      return;
    }
    setSymbol(preferred.symbol);
    setOrderOpen(true);
  }
  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="logo">V</div><div>VYRA<span>MARKETS</span></div></div>
      <div className="workspace"><div className="avatar">{userEmail ? userEmail.slice(0,1).toUpperCase() : 'V'}</div><div>VYRA workspace<small>{userEmail || 'Guest access'}</small></div></div>
      <div className="navlabel">WORKSPACE</div>
      {nav.map(([name, Icon]) => <button key={name} onClick={() => { setActive(name); if (name === 'Activity') document.getElementById('activity')?.scrollIntoView({behavior:'smooth'}); else if (name === 'Markets') document.getElementById('markets')?.scrollIntoView({behavior:'smooth'}); else if (name === 'Portfolio') document.getElementById('portfolio')?.scrollIntoView({behavior:'smooth'}); }} className={'navitem ' + (active === name ? 'selected' : '')}><Icon size={18}/>{name}</button>)}
      <Link href="/access-graph" className="navitem"><Network size={18}/>Access Graph</Link>
      <Link href="/provider-graph" className="navitem"><BriefcaseBusiness size={18}/>Provider Graph</Link>
      <Link href="/partners" className="navitem"><BriefcaseBusiness size={18}/>Brokerage partners</Link>
      <div className="navlabel">PREFERENCES</div>
      <button className="navitem"><Settings size={18}/>Settings</button>
      <button className="navitem"><CircleHelp size={18}/>Help centre</button>
      <div className="sidebottom"><ShieldCheck size={18}/><div><strong>Risk controls active</strong><small>Paper mode only · live disabled</small></div></div>
    </aside>
    <section className="content">
      <header className="topbar"><div className="crumb"><Menu size={18}/><span>Workspace</span><b>/</b>{active}</div><div className="topactions"><button className="iconbtn" onClick={() => void loadMarkets()} aria-label="Refresh market data"><RefreshCw size={16}/></button><button className="iconbtn" aria-label="Notifications"><Bell size={17}/></button>{userEmail ? <><span className="account">{userEmail}</span><form action="/api/logout" method="post"><button className="account" type="submit">Sign out</button></form></> : <Link className="account" href="/login"><LogIn size={16}/>Sign in</Link>}</div></header>
      <div className="page">
        <div className="welcome"><div><div className="eyebrow"><Globe2 size={14}/> MULTI-ASSET BROKERAGE FOUNDATION</div><h1>Trade with clarity.</h1><p>One workspace for crypto, equities, FX and commodities.</p></div><div className="welcomeActions"><Link className="accessQuickLink" href="/access-graph"><Network size={15}/> Access Graph <ArrowUpRight size={13}/></Link><Link className="accessQuickLink" href="/provider-graph"><BriefcaseBusiness size={15}/> Provider Graph <ArrowUpRight size={13}/></Link><div className="status"><span className="dot"/> PAPER MODE <ShieldCheck size={14}/></div></div></div>
        <div className="notice"><ShieldCheck size={19}/><div><strong>Paper trading only — live execution is locked</strong><p>Prices below come from connected market-data providers and carry source timestamps. Paper fills use an explicit 5 bps slippage assumption. No client funds or live broker orders are handled.</p></div></div>
        {message && <div className="messageBar" role="status">{message}<button onClick={() => setMessage('')} aria-label="Dismiss"><X size={15}/></button></div>}
        <section className="balance" id="portfolio">
          <div className="balheader"><span>Paper account</span><span className="pillText">{account ? 'ACTIVE · SIMULATED' : 'NOT OPENED'}</span></div>
          {account ? <>
            <h2>{portfolioValue === null ? '—' : money(portfolioValue, account.currency)}</h2>
            <div className="gain"><ShieldCheck size={16}/>Paper portfolio value <span>USD-quoted positions only; stale and non-USD positions excluded</span></div>
            <div className="balancefooter"><div><small>Cash available</small><strong>{money(Number(account.availableCash ?? account.cashBalance),account.currency)}</strong></div><div><small>Cash reserved for open orders</small><strong>{money(Number(account.reservedCash ?? 0),account.currency)}</strong></div><div><small>Open positions</small><strong>{account.positions.length}</strong></div><button className="primary" onClick={() => showOrder()}><ArrowUpRight size={16}/> New paper order</button></div>
          </> : <>
            <h2>—</h2><div className="gain">No account balance is displayed until you create a paper account.</div>
            <div className="balancefooter"><div><small>Account type</small><strong>Paper / simulated</strong></div><div><small>Starting balance</small><strong>$100,000 simulated</strong></div><button className="primary" disabled={!userEmail || busy} onClick={() => void openPaperAccount()}><Plus size={16}/> {busy ? 'Opening…' : 'Open paper account'}</button></div>
          </>}
        </section>

        {account && <section className="positionsPanel" id="positions">
          <div className="sectionhead compact"><div><h2>Open positions</h2><p>Mark-to-market only when a fresh USD quote is available.</p></div></div>
          {account.positions.length ? <div className="positionsTable">
            <div className="positionsHeader"><span>Instrument</span><span>Quantity</span><span>Avg. cost</span><span>Last price</span><span>Market value</span><span>Unrealised P&amp;L</span></div>
            {account.positions.map((position) => {
              const instrument = position.instrument_catalog;
              const symbol = instrument?.symbol ?? position.instrument_id;
              const quote = quotes.find((item) => item.symbol === symbol);
              const quantity = Number(position.quantity);
              const averageCost = Number(position.average_cost);
              const supportedQuote = quote && quote.currency === account.currency && quoteIsFresh(quote);
              const marketValue = supportedQuote ? quantity * quote.price : null;
              const unrealised = marketValue === null ? null : marketValue - quantity * averageCost;
              return <div className="positionsRow" key={position.instrument_id}>
                <strong>{symbol}<small>{instrument?.name ?? 'Instrument'}</small></strong>
                <span>{quantity.toLocaleString('en-US', { maximumFractionDigits: 8 })}<small>{Number(position.availableQuantity ?? quantity).toLocaleString('en-US', { maximumFractionDigits: 8 })} available</small></span>
                <span>{money(averageCost, account.currency)}</span>
                <span>{supportedQuote ? money(quote.price, account.currency) : 'Unavailable'}</span>
                <span>{marketValue === null ? 'Unavailable' : money(marketValue, account.currency)}</span>
                <span className={unrealised === null ? 'neutral' : unrealised >= 0 ? 'positive' : 'negative'}>{unrealised === null ? 'FX / quote unavailable' : (unrealised >= 0 ? '+' : '') + money(unrealised, account.currency)}</span>
              </div>;
            })}
          </div> : <p className="emptyCopy">No open positions. Filled paper buys will appear here.</p>}
        </section>}

        {account?.riskLimits && <section className="riskPanel">
          <div className="riskPanelTitle"><ShieldCheck size={16}/> Paper risk limits <span>server enforced</span></div>
          <div className="riskMetrics">
            <div><small>Max order notional</small><strong>{money(Number(account.riskLimits.max_order_notional),account.currency)}</strong></div>
            <div><small>Max position notional</small><strong>{money(Number(account.riskLimits.max_position_notional),account.currency)}</strong></div>
            <div><small>Daily loss stop</small><strong>{money(Number(account.riskLimits.max_daily_realized_loss),account.currency)}</strong></div>
            <div><small>Assumed adverse slippage</small><strong>{Number(account.riskLimits.slippage_bps).toFixed(1)} bps</strong></div>
          </div>
        </section>}

        <div className="sectionhead" id="markets"><div><h2>Provider market watch</h2><p>Provider quotes only. Source timestamps shown; not guaranteed real-time.</p></div><button className="outline" onClick={() => void loadMarkets()}><RefreshCw size={15}/> Refresh quotes</button></div>
        {quotes.length ? <div className="marketgrid">{quotes.map((quote) => <div className="market" key={quote.symbol}>
          <div className="markethead"><div className="coin">{quote.assetClass === 'crypto' ? '₿' : quote.assetClass === 'forex' ? 'FX' : quote.assetClass === 'commodity' ? 'Au' : quote.symbol.slice(0,1)}</div><div><strong>{quote.symbol}</strong><small>{quote.name} · {quote.assetClass}</small></div><button className="star" onClick={() => void toggleWatch(quote.symbol)} aria-label={watch.includes(quote.symbol) ? 'Remove from watchlist' : 'Add to watchlist'}><Star size={16} fill={watch.includes(quote.symbol) ? 'currentColor' : 'none'}/></button></div>
          <div className="price">{money(quote.price,quote.currency)}</div><div className={quote.changePercent === null ? 'neutral' : quote.changePercent >= 0 ? 'positive' : 'negative'}>{quote.changePercent === null ? 'Change unavailable' : (quote.changePercent >= 0 ? '+' : '') + quote.changePercent.toFixed(2) + '%'}</div>
          <div className="quoteMeta">{quote.source} · {new Date(quote.asOf).toLocaleTimeString()}</div>
          {account && quote.currency === account.currency && <button className="tradeLink" onClick={() => showOrder(quote.symbol)}>Trade in paper</button>}
        </div>)}</div> : <div className="emptyState"><Activity size={22}/><strong>{loading ? 'Loading provider quotes…' : 'No live quotes available'}</strong><p>Crypto uses the public CoinGecko API. Add a Twelve Data API key to enable stocks, FX and commodities. Provider errors are shown below.</p></div>}
        {unavailable.length > 0 && <div className="providerStatus"><strong>Provider status</strong>{unavailable.map((item,index)=><p key={item.assetClass + index}><span>{item.assetClass.toUpperCase()}</span> {item.provider}: {item.reason}</p>)}</div>}
        
        <div className="sectionhead" id="activity"><div><h2>Paper order activity</h2><p>Server-validated order lifecycle and ledger postings.</p></div></div>
        {account ? <div className="orderList">{orders.length ? orders.slice(0,8).map((order) => <div className="orderRow" key={order.id}><div><strong>{order.instrument_catalog?.symbol || 'Instrument'} · {order.side.toUpperCase()}</strong><small>{order.order_type} · {Number(order.quantity).toLocaleString()} units · {new Date(order.created_at).toLocaleString()}</small></div><span className={'orderStatus '+order.status}>{order.status}</span>{order.status === 'open' && <button className="cancelLink" disabled={busy} onClick={() => void cancelOrder(order.id)}>Cancel</button>}</div>) : <p className="emptyCopy">No paper orders yet. Select a live quote and submit your first paper order.</p>}</div>
          : <div className="emptyState"><BriefcaseBusiness size={22}/><strong>Your paper activity will appear here</strong><p>Sign in and open a paper account to submit market and limit orders.</p><Link className="tradeLink" href="/login">Sign in to continue</Link></div>}

        {account && <section className="ledgerPanel" id="ledger">
          <div className="sectionhead compact"><div><h2>Paper ledger</h2><p>Immutable double-entry journal · last 20 transactions</p></div></div>
          {ledger.length ? <div className="ledgerRows">{ledger.slice(0,20).map((transaction) => <article className="ledgerTransaction" key={transaction.id}>
            <div className="ledgerTransactionHead"><div><strong>{transaction.description}</strong><small>{transaction.event_type.replaceAll('_',' ')} · {new Date(transaction.created_at).toLocaleString()}</small></div><span className="ledgerImmutable">IMMUTABLE</span></div>
            <div className="ledgerEntries">{(transaction.ledger_entries ?? []).map((entry) => <div className="ledgerEntry" key={entry.id}>
              <span>{entry.ledger_accounts?.account_code?.replaceAll('_',' ') ?? 'Ledger account'}</span>
              <span className={entry.direction === 'debit' ? 'ledgerDebit' : 'ledgerCredit'}>{entry.direction.toUpperCase()} {money(Number(entry.amount),entry.currency)}</span>
            </div>)}</div>
          </article>)}</div> : <p className="emptyCopy">No ledger transactions are available yet.</p>}
        </section>}

        {orderOpen && <div className="modalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOrderOpen(false); }}><section className="orderModal" role="dialog" aria-modal="true" aria-labelledby="orderTitle">
          <div className="modalHead"><div><div className="eyebrow">PAPER EXECUTION</div><h2 id="orderTitle">New order</h2></div><button className="iconbtn" onClick={() => setOrderOpen(false)} aria-label="Close"><X size={17}/></button></div>
          <form className="orderForm" onSubmit={submitOrder}>
            <label>Instrument<select value={symbol} onChange={(event) => setSymbol(event.target.value)}>{tradableQuotes.map((quote) => <option value={quote.symbol} key={quote.symbol}>{quote.symbol} · {quote.name}</option>)}</select></label>
            <div className="formPair"><label>Side<select value={side} onChange={(event) => setSide(event.target.value as 'buy'|'sell')}><option value="buy">Buy</option><option value="sell">Sell</option></select></label><label>Order type<select value={orderType} onChange={(event) => setOrderType(event.target.value as 'market'|'limit')}><option value="market">Market</option><option value="limit">Limit</option></select></label></div>
            <label>Quantity<input type="number" step="any" min="0.00000001" required value={quantity} onChange={(event) => setQuantity(event.target.value)}/></label>
            {orderType === 'limit' && <label>Limit price ({selectedQuote?.currency || 'USD'})<input type="number" step="any" min="0.00000001" required value={limitPrice} onChange={(event) => setLimitPrice(event.target.value)}/></label>}
            <div className="orderEstimate"><span>Latest reference</span><strong>{selectedQuote ? money(selectedQuote.price,selectedQuote.currency) : 'No live quote'}</strong><small>{selectedQuote ? selectedQuote.source + ' · ' + new Date(selectedQuote.asOf).toLocaleString() : 'Market data unavailable for selected instrument'}</small></div>
            <button className="primary wide" disabled={busy || !selectedQuote}>{busy ? 'Submitting…' : 'Submit paper order'}</button>
            <p className="modalDisclaimer">Simulated only. Estimated fill includes 5 basis points of adverse slippage. This is not a live broker order.</p>
          </form>
        </section></div>}
        <div className="quickLinks"><Link href="/login"><LogIn size={16}/> Account access</Link><a href="/api/health" target="_blank" rel="noreferrer"><ExternalLink size={15}/> API health</a><a href="/api/markets" target="_blank" rel="noreferrer"><ExternalLink size={15}/> Market API</a><span><CreditCard size={16}/> Funding integration not enabled</span><span><Command size={16}/> AI research is not connected</span></div>
        <footer>VYRA Markets · Multi-asset brokerage software foundation · Paper trading only · Not a licensed brokerage service.</footer>
      </div>
    </section>
  </main>;
}
