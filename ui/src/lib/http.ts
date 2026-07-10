import ky from 'ky';
import { API_URL } from '../config';
import { useAuthStore } from '../stores/auth.store';
import { isAccessTokenExpired, isAuthEndpoint, tryRefreshAccessToken } from './auth-refresh';
import { runHttpUnauthorizedMiddleware } from './http-middleware';

function attachAccessToken(request: Request, accessToken: string | null) {
  if (accessToken) {
    request.headers.set('Authorization', `Bearer ${accessToken}`);
  }
}

async function ensureFreshAccessToken(): Promise<string | null> {
  let { accessToken } = useAuthStore.getState();

  if (accessToken && !isAccessTokenExpired(accessToken)) {
    return accessToken;
  }

  const refreshed = await tryRefreshAccessToken();
  if (!refreshed) return accessToken;

  return useAuthStore.getState().accessToken;
}

export const http = ky.create({
  prefix: API_URL,
  credentials: 'include',
  // limit: 0 блокирует ky.retry() — принудительный retry после refresh тоже учитывает лимит.
  retry: {
    limit: 1,
    methods: [],
    statusCodes: [],
    retryOnTimeout: false,
  },
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        if (isAuthEndpoint(request.url)) return;

        const accessToken = await ensureFreshAccessToken();
        attachAccessToken(request, accessToken);
      },
    ],
    afterResponse: [
      async ({ request, response, retryCount }) => {
        if (response.status !== 401) return;
        if (isAuthEndpoint(request.url)) return;

        if (retryCount > 0 || request.headers.get('x-auth-retried')) {
          runHttpUnauthorizedMiddleware();
          return;
        }

        const refreshed = await tryRefreshAccessToken();
        if (!refreshed) {
          runHttpUnauthorizedMiddleware();
          return;
        }

        const { accessToken } = useAuthStore.getState();
        if (!accessToken) {
          runHttpUnauthorizedMiddleware();
          return;
        }

        const headers = new Headers(request.headers);
        headers.set('x-auth-retried', '1');
        headers.set('Authorization', `Bearer ${accessToken}`);

        return ky.retry({
          request: new Request(request, { headers }),
          code: 'TOKEN_REFRESHED',
          delay: 0,
        });
      },
    ],
  },
});
