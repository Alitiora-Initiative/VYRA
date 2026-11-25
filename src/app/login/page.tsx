'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/browser';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error('Authentication is not configured yet. Connect the VYRA Supabase project first.');
      const result = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` } });
      if (result.error) throw result.error;
      if (mode === 'signup' && !result.data.session) {
        setMessage('Account created. Check your email to confirm the address, then sign in.');
      } else {
        router.replace('/');
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="authShell">
    <section className="authCard">
      <Link className="authBrand" href="/"><span className="authMark">V</span><span>VYRA<small>MARKETS</small></span></Link>
      <div className="authEyebrow">SECURE ACCOUNT ACCESS</div>
      <h1>{mode === 'signin' ? 'Welcome back.' : 'Create your account.'}</h1>
      <p className="authLead">Access your multi-asset workspace. Live trading is not enabled.</p>
      {params.get('error') && <p className="authMessage" role="alert">Authentication callback failed. Please sign in again.</p>}
      <form onSubmit={submit} className="authForm">
        <label>Email address<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        <label>Password<input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>
        <button className="authSubmit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
      </form>
      {message && <p className="authMessage" role="status">{message}</p>}
      <button className="authSwitch" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}>
        {mode === 'signin' ? 'New to VYRA? Create an account' : 'Already registered? Sign in'}
      </button>
      <p className="authFoot">By continuing, you agree to the platform terms and risk disclosures.</p>
    </section>
  </main>;
}
