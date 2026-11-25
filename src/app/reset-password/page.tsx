'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/browser';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState('');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('Checking recovery session…');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkSession() {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        if (active) setMessage('Authentication is not configured. Connect the VYRA database first.');
        return;
      }
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !data.user) {
        setMessage('Open the password recovery link sent to your email, then return here.');
      } else {
        setReady(true);
        setMessage('');
      }
    }
    void checkSession();
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmed) { setMessage('The passwords do not match.'); return; }
    setBusy(true);
    setMessage('');
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error('Authentication is not configured.');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('Password updated. You can now sign in with your new password.');
      await supabase.auth.signOut();
      window.setTimeout(() => { router.replace('/login'); }, 1200);
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
    {ready ? <form onSubmit={submit} className="authForm">
      <label>New password<input type="password" minLength={8} autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)}/></label>
      <label>Confirm new password<input type="password" minLength={8} autoComplete="new-password" required value={confirmed} onChange={event => setConfirmed(event.target.value)}/></label>
      <button className="authSubmit" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
    </form> : null}
    {message && <p className="authMessage" role="status">{message}</p>}
    <Link className="authSwitchLink" href="/login">Back to sign in</Link>
  </section></main>;
}
