import { AppError } from '../../utils/errors.js';
import { env } from '../../config/env.js';
import type { AuthProvider, OAuthProfile } from './auth.service.js';

export function buildYandexAuthorizeUrl(state: string): string {
  const url = new URL('https://oauth.yandex.ru/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', env.YANDEX_CLIENT_ID);
  url.searchParams.set('redirect_uri', env.YANDEX_CALLBACK_URL);
  url.searchParams.set('state', state);
  return url.toString();
}

export async function fetchYandexProfile(accessToken: string): Promise<OAuthProfile> {
  const response = await fetch('https://login.yandex.ru/info?format=json', {
    headers: { Authorization: `OAuth ${accessToken}` },
  });

  if (!response.ok) {
    throw new AppError(502, 'YANDEX_API_ERROR', 'Failed to fetch user info from Yandex');
  }

  const data = (await response.json()) as {
    id: string;
    default_email?: string;
    emails?: string[];
    display_name?: string;
    real_name?: string;
    default_avatar_id?: string;
    is_avatar_empty?: boolean;
  };

  const email = data.default_email ?? data.emails?.[0] ?? `yandex-${data.id}@users.stock-market.local`;
  const name = data.display_name ?? data.real_name ?? email.split('@')[0];
  const picture =
    data.default_avatar_id && !data.is_avatar_empty
      ? `https://avatars.yandex.net/get-yapic/${data.default_avatar_id}/islands-200`
      : undefined;

  return {
    provider: 'yandex',
    id: data.id,
    email,
    name,
    picture,
  };
}

export async function fetchGoogleProfile(accessToken: string): Promise<OAuthProfile> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new AppError(502, 'GOOGLE_API_ERROR', 'Failed to fetch user info from Google');
  }

  const data = (await response.json()) as {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };

  return {
    provider: 'google' as AuthProvider,
    id: data.id,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}
