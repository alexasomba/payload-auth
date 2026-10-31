# Better Auth plugin for Payload CMS

Replaces Payload's built-in authentication with [Better Auth](https://www.better-auth.com),
so the admin panel and your application share one auth system.

Full documentation: <https://payload-auth.dev>

## Usage

```ts
import { buildConfig } from 'payload'
import { betterAuthPlugin } from 'payload-auth/better-auth'

export default buildConfig({
  admin: { user: 'users' },
  plugins: [
    betterAuthPlugin({
      users: { roles: ['user', 'admin'], adminRoles: ['admin'] },
      betterAuthOptions: {
        emailAndPassword: { enabled: true }
      }
    })
  ]
})
```

## What it does

Given `PayloadAuthOptions`, the plugin:

1. Infers `admin.loginMethods` from your providers and plugins, unless you set it.
2. Derives the Better Auth schema for the models your plugins require.
3. Builds Payload collections from that schema — twice, so cross-collection references
   (hooks, endpoints) resolve against final slugs.
4. Runs `sanitizeBetterAuthOptions`, rewriting `modelName` and field mappings to address
   your real Payload slugs and field names.
5. Replaces the admin login, signup, forgot/reset password and 2FA views.
6. Registers an `onInit` hook that constructs Better Auth with the Payload adapter and
   attaches it to `payload.betterAuth`.

The generated `users` collection also declares an auth strategy that resolves Better Auth
sessions for the admin panel, with `disableRefresh: true` so it never emits `Set-Cookie`.

## Key exports

| Export                            | Purpose                                             |
| --------------------------------- | --------------------------------------------------- |
| `betterAuthPlugin(options)`       | The Payload plugin                                  |
| `getPayloadAuth<O>(config)`       | Payload with a typed `betterAuth` attached          |
| `generateVerifyEmailUrl(options)` | Build a signed email-verification URL               |
| `sanitizeBetterAuthOptions(...)`  | Internal option resolution, exported for inspection |

## TanStack Start and Cloudflare D1

The adapter and schema plugin are framework-independent. Set `admin.enabled` to
`false` when the application supplies its own admin login and recovery screens;
the plugin still adds Better Auth collections and Payload's authentication
strategy to the configured Users collection. This avoids importing the package's
Next.js admin views into a TanStack Start Worker.

Configure Payload with its D1 adapter and install the Better Auth plugin as usual:

```ts
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { betterAuthPlugin } from 'payload-auth/better-auth'

export function makePayloadConfig(env: Env) {
  return buildConfig({
    db: sqliteD1Adapter({ binding: env.DB }),
    plugins: [
      betterAuthPlugin({
        admin: { enabled: false },
        betterAuthOptions: {
          emailAndPassword: { enabled: true }
        }
      })
    ]
    // Keep your existing Users collection here; the plugin extends it.
  })
}
```

To extend an existing Payload `Users` collection, set `users.slug` to its slug.
Matching fields such as `name`, `email`, and a role field are reused and mapped
to Better Auth instead of being added a second time. Use `users.idPrefix` when
Better Auth user IDs must retain an existing stable mapping such as
`payload:<users.id>`.

`betterAuthOptionsFactory` runs after Payload initializes and can provide
runtime secrets, Worker bindings, and callback closures. Keep plugin/schema
declarations in `betterAuthOptions`, because Payload generates auth collections
from those declarations before `onInit` runs:

```ts
betterAuthPlugin({
  users: { slug: 'users', idPrefix: 'payload:' },
  betterAuthOptions: { emailAndPassword: { enabled: true } },
  betterAuthOptionsFactory: ({ payload }) => ({
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        await payload.sendEmail({ to: user.email, subject: 'Reset password', text: url })
      }
    }
  })
})
```

Expose the Better Auth handler through a TanStack Start catch-all server route.
Resolve Payload and Better Auth inside the request so Cloudflare bindings stay
request-scoped and every response header, including `Set-Cookie`, passes through:

```ts
import { createFileRoute } from '@tanstack/react-router'
import { createTanStackStartAuthHandlers } from 'payload-auth/better-auth/tanstack-start'
import { getPayloadAuth } from 'payload-auth/better-auth/plugin'
import { makePayloadConfig } from '~/payload/config.server'
import { getRequestEnv } from '~/env.server'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: createTanStackStartAuthHandlers(async () => {
      const payload = await getPayloadAuth(makePayloadConfig(getRequestEnv()))
      return payload.betterAuth
    })
  }
})
```

The plugin stores the user in Payload's configured Users collection. Better Auth
sessions, accounts, verifications, and enabled plugin data are represented by
Payload collections and must be applied through the application's Payload
migrations. Do not run Better Auth's Kysely migration CLI against the same D1
database. The Payload Local API adapter delegates each operation to the configured
database adapter. Its multi-operation `transaction` callback is not a shared
database transaction; D1 does not support interactive transactions, so callers
should use idempotent operations and must not depend on callback-wide rollback.

Types: `PayloadAuthOptions`, `BetterAuthOptions`, `BetterAuthReturn`, `LoginMethod`,
`SocialProvider`, `PayloadRequestWithBetterAuth`, `CollectionHookWithBetterAuth`,
`EndpointWithBetterAuth`.

## Reference

- [Plugin options](https://payload-auth.dev/docs/reference/plugin-options)
- [Collections](https://payload-auth.dev/docs/concepts/collections)
- [Admin panel integration](https://payload-auth.dev/docs/concepts/admin-panel)
- [Better Auth plugin support](https://payload-auth.dev/docs/reference/better-auth-plugins)
