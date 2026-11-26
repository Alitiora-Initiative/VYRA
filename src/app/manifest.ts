import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'VYRA Markets',
    short_name: 'VYRA',
    description: 'A multi-asset market workspace with paper trading. No live trading is enabled.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#080c11',
    theme_color: '#080c11',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    categories: ['finance', 'business'],
    lang: 'en',
  };
}
