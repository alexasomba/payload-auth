import type { BetterAuthOptions } from 'better-auth'
import type { BasePayload } from 'payload'
import { describe, expect, it } from 'vitest'

import { payloadAdapter } from '../../adapter/index'

describe('Payload adapter access', () => {
  it('uses trusted Local API access for internal Better Auth collection reads', async () => {
    const calls: Array<{ overrideAccess?: boolean }> = []
    const payload = {
      config: { custom: {} },
      collections: {
        rateLimit: {
          config: {
            slug: 'rateLimit',
            custom: { betterAuthModelKey: 'rateLimit' },
            fields: []
          }
        }
      },
      async find(args: { overrideAccess?: boolean }) {
        calls.push(args)
        return { docs: [], totalDocs: 0 }
      }
    } as unknown as BasePayload

    const adapter = payloadAdapter({
      payloadClient: payload,
      adapterConfig: { idType: 'number' }
    })({
      rateLimit: { enabled: true, modelName: 'rateLimit', storage: 'database' }
    } as BetterAuthOptions)

    await adapter.findMany({ model: 'rateLimit' })

    expect(calls).toHaveLength(1)
    expect(calls[0]?.overrideAccess).toBe(true)
  })
})
