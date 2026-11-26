'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const CONSENT_KEY = 'vyra-analytics-consent';
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

type Consent = 'accepted' | 'rejected' | null;

export function AnalyticsConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID ?? '';
  const validGtmId = GTM_ID_PATTERN.test(gtmId);

  useEffect(() => {
    try {
      const value = window.localStorage.getItem(CONSENT_KEY);
      if (value === 'accepted' || value === 'rejected') setConsent(value);
    } finally {
      setReady(true);
    }
  }, []);

  function choose(value: Exclude<Consent, null>) {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } finally {
      setConsent(value);
    }
  }

  return (
    <>
      {ready && consent === 'accepted' && validGtmId ? (
        <Script id="vyra-gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!=='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      ) : null}
      {ready && consent === null ? (
        <aside className="consentBanner" aria-label="Analytics preferences">
          <div>
            <strong>Privacy choices</strong>
            <p>VYRA does not load optional analytics until you allow them. Read the <a href="/legal/privacy">privacy status</a>.</p>
          </div>
          <div className="consentActions">
            <button type="button" className="consentSecondary" onClick={() => choose('rejected')}>Reject analytics</button>
            <button type="button" className="consentPrimary" onClick={() => choose('accepted')}>Allow analytics</button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
