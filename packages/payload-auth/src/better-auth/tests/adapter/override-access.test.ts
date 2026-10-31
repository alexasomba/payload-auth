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

  it('returns a forward-joined user under Better Auth’s requested key', async () => {
    const sessionFields = [
      { name: 'token', type: 'text' },
      { name: 'userId', type: 'relationship', relationTo: 'users' }
    ]
    const userFields = [
      { name: 'email', type: 'email' },
      { name: 'name', type: 'text' }
    ]
    const session = { id: 7, token: 'session-token', userId: 42 }
    const user = { id: 42, email: 'customer@example.test', name: 'Customer' }
    const payload = {
      config: { custom: {} },
      collections: {
        sessions: {
          config: {
            slug: 'sessions',
            custom: { betterAuthModelKey: 'session' },
            fields: sessionFields,
            flattenedFields: sessionFields
          }
        },
        users: {
          config: {
            slug: 'users',
            custom: { betterAuthModelKey: 'user' },
            fields: userFields,
            flattenedFields: userFields
          }
        }
      },
      async findByID(args: { collection: string }) {
        return args.collection === 'sessions' ? session : user
      },
      async find() {
        return { docs: [session], totalDocs: 1 }
      }
    } as unknown as BasePayload

    const adapter = payloadAdapter({
      payloadClient: payload,
      adapterConfig: { idType: 'number', idPrefix: 'payload:' }
    })({
      user: { modelName: 'users' },
      session: { modelName: 'sessions' }
    } as BetterAuthOptions)

    const byId = await adapter.findOne({
      model: 'session',
      where: [{ field: 'id', value: 7 }],
      join: { user: true }
    }) as Record<string, any>
    const byWhere = await adapter.findMany({
      model: 'session',
      where: [{ field: 'token', value: 'session-token' }],
      join: { user: true }
    }) as Record<string, any>[]

    for (const result of [byId, byWhere[0]]) {
      expect(result?.user).toMatchObject({ id: 'payload:42', email: 'customer@example.test' })
      expect(result?.userId).toBe('payload:42')
    }
  })
})
