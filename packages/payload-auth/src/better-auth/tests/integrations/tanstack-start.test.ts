import { describe, expect, it, vi } from 'vitest'
import { createTanStackStartAuthHandlers } from '../../tanstack-start'

describe('createTanStackStartAuthHandlers', () => {
  it.each(['GET', 'POST'] as const)('forwards %s requests and responses', async (method) => {
    const request = new Request('https://example.test/api/auth/session', {
      method
    })
    const response = new Response('ok', {
      headers: { 'set-cookie': 'better-auth.session_token=token; HttpOnly' }
    })
    const handler = vi.fn().mockResolvedValue(response)
    const routes = createTanStackStartAuthHandlers({ handler })

    const result = await routes[method]({ request })

    expect(handler).toHaveBeenCalledWith(request)
    expect(result).toBe(response)
    expect(result.headers.get('set-cookie')).toContain('HttpOnly')
  })

  it('resolves a request-scoped auth instance lazily', async () => {
    const request = new Request('https://example.test/api/auth/session')
    const response = Response.json({ authenticated: true })
    const handler = vi.fn().mockResolvedValue(response)
    const resolveAuth = vi.fn().mockResolvedValue({ handler })
    const routes = createTanStackStartAuthHandlers(resolveAuth)

    await expect(routes.GET({ request })).resolves.toBe(response)

    expect(resolveAuth).toHaveBeenCalledWith({ request })
    expect(handler).toHaveBeenCalledWith(request)
  })
})
