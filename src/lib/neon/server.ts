import 'server-only';

import { createClient } from '@neondatabase/neon-js';
import { getNeonAuth } from './auth';

function toApplicationUser(user: {
  id: string;
  email?: string | null;
  name?: string | null;
}) {
  return {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    user_metadata: { name: user.name ?? '' },
  };
}

/**
 * Request-scoped Neon Data API client with a JWT from the current Neon Auth
 * session. Anonymous JWTs are used only when there is no signed-in user;
 * Postgres grants and RLS remain authoritative for every request.
 */
export async function getNeonServer() {
  const auth = getNeonAuth();
  const dataApiUrl = process.env.NEON_DATA_API_URL;
  if (!auth || !dataApiUrl) return null;

  const db = createClient({
    dataApi: {
      url: dataApiUrl,
      getToken: async () => {
        const session = await auth.getSession();

        if (session.data?.user) {
          const result = await auth.token();
          if (result.error || !result.data?.token) return null;
          return result.data.token;
        }

        const anonymous = await auth.getAnonymousToken();
        return anonymous.error ? null : anonymous.data?.token ?? null;
      },
    },
  });

  return {
    auth: {
      getUser: async () => {
        const result = await auth.getSession();
        const user = result.data?.user;
        return {
          data: { user: user ? toApplicationUser(user) : null },
          error: result.error ?? (user ? null : new Error('Authentication required.')),
        };
      },
    },
    from: db.from.bind(db),
    rpc: db.rpc.bind(db),
  };
}
