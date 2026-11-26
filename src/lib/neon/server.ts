import 'server-only';

import { fetchWithToken, NeonPostgrestClient } from '@neon/postgrest-js';
import { auth, isNeonAuthConfigured } from '@/lib/auth/server';

type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string | null;
  user_metadata: { name: string | null };
};

export async function getNeonServer() {
  const dataApiUrl = process.env.NEON_DATA_API_URL;
  if (!dataApiUrl || !isNeonAuthConfigured()) return null;

  const { data: session, error: sessionError } = await auth.getSession();
  if (sessionError || !session?.user) return null;

  const { data: tokenData, error: tokenError } = await auth.token();
  if (tokenError || !tokenData?.token) return null;

  const name = session.user.name ?? null;
  const user: AuthenticatedUser = {
    id: session.user.id,
    email: session.user.email ?? null,
    name,
    user_metadata: { name },
  };

  const db = new NeonPostgrestClient({
    dataApiUrl,
    options: {
      global: {
        fetch: fetchWithToken(async () => tokenData.token),
      },
    },
  });

  // Compatibility surface for existing handlers. Queries still use the
  // user's JWT and are enforced by PostgreSQL grants and RLS policies.
  return {
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
    },
    from: db.from.bind(db),
    rpc: db.rpc.bind(db),
  };
}
