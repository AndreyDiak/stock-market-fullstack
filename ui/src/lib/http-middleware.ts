type UnauthorizedMiddleware = () => void

let unauthorizedMiddleware: UnauthorizedMiddleware | null = null

export function registerHttpUnauthorizedMiddleware(
  handler: UnauthorizedMiddleware | null,
) {
  unauthorizedMiddleware = handler
}

export function runHttpUnauthorizedMiddleware() {
  unauthorizedMiddleware?.()
}
