import { describe, expect, it, vi } from 'vitest'
import type { BasePayload } from 'payload'
import { resolveRuntimeBetterAuthOptions } from '../../plugin/lib/resolve-runtime-better-auth-options'
import { betterAuthPlugin } from '../../plugin'

describe('runtime Better Auth options factory', () => {
  it('receives Payload and overlays runtime settings without dropping static plugin schemas', async () => {
    const payload = { collections: {} } as unknown as BasePayload
    const plugin = { id: 'email-otp', schema: { verification: {} } } as any
    const options = { baseURL: 'https://shop.example', plugins: [plugin] } as any
    const factory = vi.fn(async () => ({ secret: 'runtime-secret' }))

    const resolved = await resolveRuntimeBetterAuthOptions({
      payload,
      options,
      factory
    })

    expect(factory).toHaveBeenCalledWith({ payload, options })
    expect(resolved).toMatchObject({
      baseURL: 'https://shop.example',
      secret: 'runtime-secret',
      plugins: [plugin]
    })
  })

  it('allows runtime plugin callbacks while retaining the schema plugin list by default', async () => {
    const schemaPlugin = { id: 'email-otp', schema: { verification: {} } } as any
    const runtimePlugin = { id: 'email-otp', options: { sendVerificationOTP: vi.fn() } } as any
    const resolved = await resolveRuntimeBetterAuthOptions({
      payload: {} as BasePayload,
      options: { plugins: [schemaPlugin] } as any,
      factory: async () => ({ plugins: [runtimePlugin] })
    })

    expect(resolved.plugins).toEqual([runtimePlugin])
  })

  it('preserves generated schema and the host onInit when runtime initialization is deferred', async () => {
    const hostInit = vi.fn()
    const factory = vi.fn(() => null)
    const config = betterAuthPlugin({
      admin: { enabled: false },
      adminInvitations: { enabled: false },
      betterAuthOptionsFactory: factory
    })({ collections: [{ slug: 'users', auth: true, fields: [] }], onInit: hostInit } as any)
    expect(config.collections?.some((collection) => collection.slug === 'accounts')).toBe(true)
    const payload = { db: { defaultIDType: 'number' } } as unknown as BasePayload
    await config.onInit?.(payload)
    expect(hostInit).toHaveBeenCalledWith(payload)
    expect(factory).toHaveBeenCalledOnce()
    expect(payload).not.toHaveProperty('betterAuth')
  })
})
