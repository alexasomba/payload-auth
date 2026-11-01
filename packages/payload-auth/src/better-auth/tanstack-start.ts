type AuthHandler = {
  handler: (request: Request) => Promise<Response>
}

type AuthHandlerResolver = AuthHandler | ((context: TanStackStartHandlerContext) => AuthHandler | Promise<AuthHandler>)

type TanStackStartHandlerContext = {
  request: Request
}

/**
 * Creates TanStack Start server-route handlers for a Better Auth instance.
 * Pass a resolver when the auth instance depends on request-scoped Worker
 * bindings, such as a Payload D1 configuration.
 */
export function createTanStackStartAuthHandlers(auth: AuthHandlerResolver) {
  const handle = async (context: TanStackStartHandlerContext) => {
    const { request } = context
    const instance = typeof auth === 'function' ? await auth(context) : auth
    return instance.handler(request)
  }

  return {
    GET: handle,
    POST: handle
  }
}
