import { AuthView } from '@neondatabase/auth-ui';
import { authViewPaths } from '@neondatabase/auth-ui/server';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <main className="authShell neonAuthShell">
      <div className="neonAuthCard">
        <a className="authBrand" href="/">
          <span className="authMark">V</span>
          <span>VYRA<small>MARKETS</small></span>
        </a>
        <AuthView path={path} />
        <p className="authFoot">VYRA Markets · Paper trading only · Live execution is disabled.</p>
      </div>
    </main>
  );
}
