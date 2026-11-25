'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Save } from 'lucide-react';

export default function SettingsPage() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/account/profile', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message ?? 'Sign in to open account settings.');
        if (active) {
          setEmail(data.email ?? '');
          setDisplayName(data.profile?.display_name ?? '');
        }
      })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : 'Could not load profile.'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? 'Profile update failed.');
      setMessage('Profile saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Profile update failed.');
    } finally {
      setSaving(false);
    }
  }

  return <main className="authShell"><section className="settingsCard">
    <Link className="backLink" href="/"><ArrowLeft size={15}/> Back to dashboard</Link>
    <div className="authBrand"><span className="authMark">V</span><span>VYRA<small>MARKETS</small></span></div>
    <div className="authEyebrow">ACCOUNT PREFERENCES</div>
    <h1>Settings</h1>
    <p className="authLead">Manage your basic account profile and security information.</p>
    {busy ? <p className="emptyCopy">Loading account…</p> : <form onSubmit={save} className="authForm">
      <label>Email address<input type="email" value={email} readOnly disabled/></label>
      <label>Display name<input type="text" minLength={2} maxLength={60} value={displayName} onChange={event => setDisplayName(event.target.value)} required/></label>
      <button className="authSubmit" disabled={saving}><Save size={15}/> {saving ? 'Saving…' : 'Save profile'}</button>
    </form>}
    {message && <p className="authMessage" role="status">{message}</p>}
    <div className="settingsSecurity"><ShieldCheck size={18}/><div><strong>Trading environment</strong><small>Paper-only. Live broker connections, deposits and withdrawals are disabled.</small></div></div>
    <div className="quickLinks"><Link href="/forgot-password">Change or reset password</Link><Link href="/api/execution/readiness">Provider readiness</Link></div>
  </section></main>;
}
