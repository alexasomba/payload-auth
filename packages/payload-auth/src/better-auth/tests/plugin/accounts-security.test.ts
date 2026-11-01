import { describe, expect, it } from 'vitest'
import { betterAuthPlugin } from '../../plugin'

describe('Better Auth account collection security', () => {
  it('denies public collection access to stored provider tokens and credentials', async () => {
    const config = betterAuthPlugin({ admin: { enabled: false } })(
      { collections: [{ slug: 'users', auth: true, fields: [] }] } as any
    )
    const accounts = config.collections?.find((collection) => collection.slug === 'accounts')
    expect(accounts).toBeDefined()
    for (const operation of ['create', 'read', 'readVersions', 'update', 'delete'] as const) {
      const access = accounts?.access?.[operation]
      expect(access).toBeTypeOf('function')
      for (const user of [null, { id: 1, roles: ['user'] }, { id: 1, roles: ['admin'] }]) {
        expect(await access?.({ req: { user } } as any)).toBe(false)
      }
    }
  })
})
