import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VYRA Markets',
  description: 'Multi-asset markets workspace with provider-backed quotes and paper trading. Live execution is disabled.',
  applicationName: 'VYRA Markets',
  referrer: 'strict-origin-when-cross-origin',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
