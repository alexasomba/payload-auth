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

  it('uses trusted Local API access when consuming a row by ID', async () => {
    const calls: Array<{ overrideAccess?: boolean }> = []
    const payload = {
      config: { custom: {} },
      collections: {
        verifications: {
          config: {
            slug: 'verifications',
            custom: { betterAuthModelKey: 'verification' },
            fields: []
          }
        }
      },
      async findByID(args: { overrideAccess?: boolean }) {
        calls.push(args)
        return { id: 42 }
      },
      async delete() {
        return { docs: [{ id: 42 }] }
      }
    } as unknown as BasePayload

    const adapter = payloadAdapter({
      payloadClient: payload,
      adapterConfig: { idType: 'number' }
    })({ verification: { modelName: 'verifications' } } as BetterAuthOptions)

    await adapter.consumeOne({ model: 'verification', where: [{ field: 'id', value: 42 }] })

    expect(calls).toHaveLength(1)
    expect(calls[0]?.overrideAccess).toBe(true)
  })
})
