import type { BetterAuthOptions } from 'better-auth'
import type { BasePayload } from 'payload'
import { describe, expect, it } from 'vitest'

import { payloadAdapter } from '../../adapter/index'

describe('Payload adapter password writes', () => {
  it('fails when a credential password update matches no account', async () => {
    const accountFields = [
      { name: 'accountId', type: 'text' },
      { name: 'providerId', type: 'text' },
      { name: 'userId', type: 'relationship', relationTo: 'users' },
      { name: 'password', type: 'text' }
    ]
    const userFields = [{ name: 'email', type: 'email' }]
    const calls: unknown[] = []
    const payload = {
      config: { custom: {} },
      collections: {
        accounts: {
          config: {
            slug: 'accounts',
            custom: { betterAuthModelKey: 'account' },
            fields: accountFields,
            flattenedFields: accountFields
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
      async update(args: unknown) {
        calls.push(args)
        return { docs: [] }
      }
    } as unknown as BasePayload

    const adapter = payloadAdapter({
      payloadClient: payload,
      adapterConfig: { idType: 'number', idPrefix: 'payload:' }
    })({
      user: { modelName: 'users' },
      account: { modelName: 'accounts' }
    } as BetterAuthOptions)

    await expect(
      adapter.updateMany({
        model: 'account',
        where: [
          { field: 'userId', value: 'payload:42' },
          { field: 'providerId', value: 'credential' },
          { field: 'accountId', value: 'payload:42' }
        ],
        update: { password: 'redacted-test-hash' }
      })
    ).rejects.toThrow('No credential account matched the password update.')
    expect(calls).toHaveLength(1)
  })
})
