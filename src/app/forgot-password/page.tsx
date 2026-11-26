'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(error.message || 'Could not request a password reset.');
      setMessage('If the address is registered, a password reset link will be sent. Check your inbox.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not request a password reset.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="authShell"><section className="authCard">
    <Link className="authBrand" href="/"><span className="authMark">V</span><span>VYRA<small>MARKETS</small></span></Link>
    <div className="authEyebrow">ACCOUNT RECOVERY</div>
    <h1>Reset your password.</h1>
    <p className="authLead">We will send a recovery link if the email is registered.</p>
    <form onSubmit={submit} className="authForm">
      <label>Email address<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/></label>
      <button className="authSubmit" disabled={busy}>{busy ? 'Sending…' : 'Send recovery link'}</button>
    </form>
    {message && <p className="authMessage" role="status">{message}</p>}
    <Link className="authSwitchLink" href="/login">Back to sign in</Link>
  </section></main>;
}
