import { describe, expect, it, vi } from 'vitest'
import type { BasePayload } from 'payload'
import { resolveRuntimeBetterAuthOptions } from '../../plugin/lib/resolve-runtime-better-auth-options'

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
})
