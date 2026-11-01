import { describe, expect, it } from 'vitest'
import { betterAuthPlugin } from '../../plugin'

describe('Payload Users collection reuse', () => {
  it('extends the existing collection without duplicating mapped auth fields', () => {
    const beforeLogin = () => undefined
    const existingUsers = {
      slug: 'users',
      auth: true,
      hooks: { beforeLogin: [beforeLogin] },
      fields: [
        { name: 'name', type: 'text' },
        { name: 'email', type: 'text' },
        {
          name: 'roles',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Customer', value: 'customer' },
            { label: 'Admin', value: 'admin' }
          ]
        }
      ]
    }

    const config = betterAuthPlugin({
      admin: { enabled: false },
      betterAuthOptions: {
        user: {
          additionalFields: {
            role: {
              type: 'string',
              fieldName: 'roles',
              defaultValue: 'customer',
              input: false
            }
          }
        }
      }
    })({ collections: [existingUsers] } as any)

    const users = config.collections?.find(({ slug }) => slug === 'users')
    expect(users).toBeDefined()
    expect(users?.hooks?.beforeLogin).toContain(beforeLogin)
    expect(users?.fields.filter((field: any) => field.name === 'name')).toHaveLength(1)
    expect(users?.fields.filter((field: any) => field.name === 'email')).toHaveLength(1)
    expect(users?.fields.filter((field: any) => field.name === 'roles')).toHaveLength(1)
    expect(users?.fields.find((field: any) => field.name === 'roles')?.custom).toMatchObject({ betterAuthFieldKey: 'role' })
    expect(users?.fields.find((field: any) => field.name === 'roles')?.options).toEqual([
      { label: 'Customer', value: 'customer' },
      { label: 'Admin', value: 'admin' }
    ])
  })

  it('omits invitation storage and endpoints when the host owns staff provisioning', () => {
    const config = betterAuthPlugin({
      admin: { enabled: false },
      adminInvitations: { enabled: false }
    })({ collections: [{ slug: 'users', auth: true, fields: [] }] } as any)

    expect(config.collections?.some(({ slug }) => slug === 'admin-invitations')).toBe(false)
    const users = config.collections?.find(({ slug }) => slug === 'users')
    expect(users?.endpoints?.map(({ path }) => path)).toEqual(['/refresh-token'])
  })
})
