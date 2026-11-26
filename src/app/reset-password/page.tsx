'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('Checking recovery link…');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const recoveryToken = new URLSearchParams(window.location.search).get('token');
    setToken(recoveryToken ?? '');
    setMessage(recoveryToken ? '' : 'This recovery link is missing its token or has expired. Request a new link.');
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) { setMessage('Request a new password recovery link.'); return; }
    if (password !== confirmed) { setMessage('The passwords do not match.'); return; }
    setBusy(true);
    setMessage('');
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token });
      if (error) throw new Error(error.message || 'Could not update the password.');
      await authClient.signOut();
      setMessage('Password updated. You can now sign in with your new password.');
      window.setTimeout(() => router.replace('/login'), 1200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update the password.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="authShell"><section className="authCard">
    <Link className="authBrand" href="/"><span className="authMark">V</span><span>VYRA<small>MARKETS</small></span></Link>
    <div className="authEyebrow">ACCOUNT RECOVERY</div>
    <h1>Choose a new password.</h1>
    <p className="authLead">Use at least 8 characters and do not reuse a compromised password.</p>
    {token && <form onSubmit={submit} className="authForm">
      <label>New password<input type="password" minLength={8} autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)}/></label>
      <label>Confirm new password<input type="password" minLength={8} autoComplete="new-password" required value={confirmed} onChange={event => setConfirmed(event.target.value)}/></label>
      <button className="authSubmit" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
    </form>}
    {message && <p className="authMessage" role="status">{message}</p>}
    <Link className="authSwitchLink" href="/login">Back to sign in</Link>
  </section></main>;
}
