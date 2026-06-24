export const OAUTH_MESSAGE_TYPE = 'stock-market-oauth'

export interface OAuthMessage {
  type: typeof OAUTH_MESSAGE_TYPE
  accessToken?: string
  error?: string
}

export function isOAuthMessage(data: unknown): data is OAuthMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as OAuthMessage).type === OAUTH_MESSAGE_TYPE
  )
}
