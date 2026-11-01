import type { CollectionConfig } from 'payload'
import type { ModelKey } from '@/better-auth/generated-types'
import { baModelKey, baseSlugs } from '../../constants'
import type { BetterAuthSchemas, BuildCollectionProps, PayloadAuthOptions } from '../../types'
import { buildAccountsCollection } from './accounts/index'
import { buildAdminInvitationsCollection } from './admin-invitations'
import { buildApiKeysCollection } from './api-keys'
import { buildDeviceCodeCollection } from './device-code'
import { buildInvitationsCollection } from './invitations'
import { buildJwksCollection } from './jwks'
import { buildMembersCollection } from './members'
import { buildOrganizationRolesCollection } from './organization-roles'
import { buildOrganizationsCollection } from './organizations'
import { buildPasskeysCollection } from './passkeys'
import { buildRateLimitCollection } from './rate-limit'
import { buildSessionsCollection } from './sessions'
import { buildSsoProvidersCollection } from './sso-providers'
import { buildSubscriptionsCollection } from './subscriptions'
import { buildTeamMembersCollection } from './team-members'
import { buildTeamsCollection } from './teams'
import { buildTwoFactorsCollection } from './two-factors'
import { buildUsersCollection } from './users/index'
import { getAdminAccess } from '../../helpers/get-admin-access'
import { getSchemaCollectionSlug } from './utils/collection-schema'
import { getCollectionFields } from './utils/transform-schema-fields-to-payload'
import { buildVerificationsCollection } from './verifications'

/**
 * Builds the required collections based on the BetterAuth options and plugins
 */
export function buildCollections({
  incomingCollections,
  pluginOptions,
  resolvedSchemas
}: {
  incomingCollections: CollectionConfig[]
  pluginOptions: PayloadAuthOptions
  resolvedSchemas: BetterAuthSchemas
}): Record<string, CollectionConfig> {
  const collectionBuilders: Partial<Record<ModelKey, (props: BuildCollectionProps) => CollectionConfig>> = {
    [baModelKey.user]: (props: BuildCollectionProps) => buildUsersCollection(props),
    [baModelKey.account]: (props: BuildCollectionProps) => buildAccountsCollection(props),
    [baModelKey.session]: (props: BuildCollectionProps) => buildSessionsCollection(props),
    [baModelKey.verification]: (props: BuildCollectionProps) => buildVerificationsCollection(props),
    [baModelKey.organization]: (props: BuildCollectionProps) => buildOrganizationsCollection(props),
    [baModelKey.member]: (props: BuildCollectionProps) => buildMembersCollection(props),
    [baModelKey.invitation]: (props: BuildCollectionProps) => buildInvitationsCollection(props),
    [baModelKey.team]: (props: BuildCollectionProps) => buildTeamsCollection(props),
    [baModelKey.teamMember]: (props: BuildCollectionProps) => buildTeamMembersCollection(props),
    [baModelKey.jwks]: (props: BuildCollectionProps) => buildJwksCollection(props),
    [baModelKey.apikey]: (props: BuildCollectionProps) => buildApiKeysCollection(props),
    [baModelKey.twoFactor]: (props: BuildCollectionProps) => buildTwoFactorsCollection(props),
    [baModelKey.passkey]: (props: BuildCollectionProps) => buildPasskeysCollection(props),
    [baModelKey.ssoProvider]: (props: BuildCollectionProps) => buildSsoProvidersCollection(props),
    [baModelKey.subscription]: (props: BuildCollectionProps) => buildSubscriptionsCollection(props),
    [baModelKey.deviceCode]: (props: BuildCollectionProps) => buildDeviceCodeCollection(props),
    [baModelKey.rateLimit]: (props: BuildCollectionProps) => buildRateLimitCollection(props),
    [baModelKey.organizationRole]: (props: BuildCollectionProps) => buildOrganizationRolesCollection(props)
  }

  const collectionMap: Record<string, CollectionConfig> = {}
  for (const modelKey of Object.keys(resolvedSchemas) as ModelKey[]) {
    const collectionSlug = getSchemaCollectionSlug(resolvedSchemas, modelKey)
    const props = {
      incomingCollections,
      pluginOptions,
      resolvedSchemas
    }
    const builder = collectionBuilders[modelKey]
    if (builder) {
      collectionMap[collectionSlug] = builder(props)
      continue
    }

    // Better Auth 1.7 plugins can declare their own tables at runtime. Build
    // the collection from that plugin's schema when no specialized Payload
    // collection builder is needed (for example, SCIM managed-connection
    // models). This keeps plugin-owned schemas available to the adapter.
    const schema = (resolvedSchemas as Record<string, any>)[modelKey]
    if (!schema) continue
    const existing = incomingCollections.find((collection) => collection.slug === collectionSlug)
    const generatedFields = getCollectionFields({ schema })
    const existingFields = existing?.fields ?? []
    const namedFields = new Set(
      existingFields.filter((field) => 'name' in field && typeof field.name === 'string').map((field) => (field as { name: string }).name)
    )
    collectionMap[collectionSlug] = {
      ...existing,
      slug: collectionSlug,
      admin: {
        ...existing?.admin,
        group: pluginOptions.collectionAdminGroup ?? 'Auth',
        hidden: pluginOptions.hidePluginCollections ?? false
      },
      access: {
        ...getAdminAccess(pluginOptions),
        ...existing?.access
      },
      custom: {
        ...existing?.custom,
        betterAuthModelKey: modelKey
      },
      fields: [
        ...existingFields,
        ...(generatedFields ?? []).filter((field) => {
          const name = 'name' in field ? field.name : undefined
          return typeof name !== 'string' || !namedFields.has(name)
        })
      ]
    }
  }

  // Admin invitations are a Payload Auth feature, not a Better Auth model.
  // Hosts that provision staff through another boundary can omit this table.
  if (pluginOptions.adminInvitations?.enabled !== false) {
    const adminInvitationsSlug = pluginOptions.adminInvitations?.slug ?? baseSlugs.adminInvitations
    collectionMap[adminInvitationsSlug] = buildAdminInvitationsCollection({
      incomingCollections,
      pluginOptions
    })
  }

  // Then add incoming collections that don't conflict with required ones
  incomingCollections.forEach((c) => {
    if (!collectionMap[c.slug]) {
      collectionMap[c.slug] = c
    }
  })

  return collectionMap
}
