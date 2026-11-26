import type { Metadata } from 'next';
import '@neondatabase/auth-ui/css';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'VYRA Markets',
  description: 'Multi-asset markets workspace with provider-backed quotes and paper trading. Live execution is disabled.',
  applicationName: 'VYRA Markets',
  referrer: 'strict-origin-when-cross-origin',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
