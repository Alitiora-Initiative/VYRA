'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'signin') {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) throw new Error(result.error.message || 'Sign in failed.');
        router.replace('/');
        router.refresh();
      } else {
        const result = await authClient.signUp.email({
          email,
          password,
          name: name.trim(),
        });
        if (result.error) throw new Error(result.error.message || 'Account creation failed.');
        if (!result.data?.token) {
          setMessage('Account created. Check your email for the verification step, then sign in.');
        } else {
          router.replace('/');
          router.refresh();
        }
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
      <form onSubmit={submit} className="authForm">
        {mode === 'signup' && <label>Full name<input type="text" autoComplete="name" minLength={2} maxLength={80} required value={name} onChange={event => setName(event.target.value)} placeholder="Your name" /></label>}
        <label>Email address<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label>Password<input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
        <button className="authSubmit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
      </form>
      {message && <p className="authMessage" role="status">{message}</p>}
      {mode === 'signin' && <Link className="authSwitchLink" href="/forgot-password">Forgot your password?</Link>}
      <button className="authSwitch" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}>
        {mode === 'signin' ? 'New to VYRA? Create an account' : 'Already registered? Sign in'}
      </button>
      <p className="authFoot">By continuing, you agree to the platform terms and risk disclosures.</p>
    </section>
  </main>;
}
