# better-auth-payload

This package is maintained as a fork of [payload-auth](https://github.com/payload-auth/payload-auth).
It adds Payload 4, TanStack Start and Cloudflare D1 compatibility. The original
project and contributors retain their copyright under the included MIT license.

Connect [Better Auth](https://www.better-auth.com) to [Payload CMS](https://payloadcms.com), including an adapter that can reuse an existing Payload Users collection.

Configure your application's authentication strategy, trusted origins, session policy and admin access for its own requirements. The TanStack Start integration can be used without the package's Next.js admin views.

📖 **[Upstream documentation](https://payload-auth.dev)** · 🤖 **[llms.txt](https://payload-auth.dev/llms.txt)**

## Install

```bash
pnpm add better-auth-payload better-auth @better-auth/core @better-auth/passkey
```

## TanStack Start

Use Payload `4.0.0-beta.6` with its matching `@payloadcms/tanstack-start` and `@payloadcms/ui` packages. Keep the Better Auth packages on matching versions.

Disable the package's Next.js admin views and invitations when supplying your own login views:

```ts
// src/payload.config.ts
import { buildConfig } from 'payload'
import { betterAuthPlugin } from 'better-auth-payload/better-auth'

export default buildConfig({
  admin: { user: 'users' },
  plugins: [
    betterAuthPlugin({
      admin: { enabled: false },
      adminInvitations: { enabled: false },
      users: {
        roles: ['user', 'admin'],
        adminRoles: ['admin'],
      },
      betterAuthOptions: {
        secret: process.env.BETTER_AUTH_SECRET!,
        baseURL: process.env.BETTER_AUTH_URL!,
        emailAndPassword: { enabled: true },
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        },
      },
    }),
  ],
})
```

```ts
// src/routes/api/auth/$.ts — adapt the directory to your Start route configuration
import { createFileRoute } from '@tanstack/react-router'
import { createTanStackStartAuthHandlers } from 'better-auth-payload/better-auth/tanstack-start'

const handlers = createTanStackStartAuthHandlers(async () => {
  const [{ default: config }, { getPayloadAuth }] = await Promise.all([
    import('@payload-config'),
    import('better-auth-payload/better-auth/plugin'),
  ])
  return (await getPayloadAuth(config)).betterAuth
})

export const Route = createFileRoute('/api/auth/$')({
  server: { handlers },
})
```

The resolver runs inside each request, so a Worker can resolve its Payload configuration and D1 bindings in request scope. Configure independent `PAYLOAD_SECRET` and `BETTER_AUTH_SECRET` values and set `BETTER_AUTH_URL` to the application's origin. Next.js is optional for this integration.

Provide your own customer and administrator login views and enforce the application's roles and session policy. Disabling the supplied views does not restore Payload's native password authentication.

Then regenerate the import map and create the schema:

```bash
pnpm payload generate:importmap
pnpm payload migrate:create && pnpm payload migrate
```

Apply migrations to the database used by your Payload configuration. ShopHQ's Cloudflare D1 setup uses its own migration commands.

## Next.js (optional)

The supplied admin views target Next.js. For that runtime, enable the views, install the optional Next.js peers and use its auth route adapter:

```ts
// src/app/api/auth/[...all]/route.ts
import configPromise from '@payload-config'
import { toNextJsHandler } from 'better-auth/next-js'
import { getPayloadAuth } from 'better-auth-payload/better-auth'

const payload = await getPayloadAuth(configPromise)
export const { POST, GET } = toNextJsHandler(payload.betterAuth)
```

The [upstream installation guide](https://payload-auth.dev/docs/getting-started/installation) describes this Next.js setup. It does not document this fork's Payload 4/TanStack Start integration.

## What it does

- **Generates collections.** `users`, `sessions`, `accounts` and `verifications` are built from the Better Auth schema, plus one collection for every Better Auth plugin you enable — passkeys, two-factors, organizations, API keys, SSO providers and more.
- **Uses Better Auth plugins.** The database adapter uses Payload's Local API. Configure and test each Better Auth plugin and authorization policy for your application.
- **Provides Next.js admin auth views.** Login, signup, forgot password, reset password and two-factor verification views are available for Next.js integrations. Other runtimes can supply their own views.
- **Wires up roles.** Define roles once; they feed Payload access control and the Better Auth `admin` plugin.

## Entry points

| Import path | Contents |
| --- | --- |
| `better-auth-payload/better-auth` | Plugin, adapter and types — the usual import |
| `better-auth-payload/better-auth/plugin` | Plugin only |
| `better-auth-payload/better-auth/adapter` | Adapter only |
| `better-auth-payload/better-auth/tanstack-start` | TanStack Start request handlers |
| `better-auth-payload/better-auth/plugin/client` | Client components |
| `better-auth-payload/better-auth/plugin/rsc` | Server components and admin views |
| `better-auth-payload/shared/payload/fields` | Reusable Payload field components |

## Requirements

| Requirement | Version |
| --- | --- |
| `payload`, `@payloadcms/ui` | `>=3.79.1 <4 \|\| ^4.0.0-beta.6` |
| `@payloadcms/next` (optional) | `>=3.79.1 <4 \|\| ^4.0.0-beta.6` |
| `better-auth`, `@better-auth/core` | `>=1.5.0 <2` |
| `next` (optional) | `>=15.4.8 <17` |
| `react`, `react-dom` | `>=19.2.1 <20` |
| `zod` | `^4.5.4` |

The plugin talks to Payload's Local API. The fork's verification covers PostgreSQL and the ShopHQ D1 integration; verify other adapters in your own application.

## Documentation

| | |
| --- | --- |
| [Installation](https://payload-auth.dev/docs/getting-started/installation) | Install and wire up the plugin |
| [How it works](https://payload-auth.dev/docs/concepts/how-it-works) | The architecture |
| [Collections](https://payload-auth.dev/docs/concepts/collections) | What gets generated, and how to extend it |
| [Plugin options](https://payload-auth.dev/docs/reference/plugin-options) | Every option, with defaults |
| [Better Auth plugin support](https://payload-auth.dev/docs/reference/better-auth-plugins) | What is configured automatically |
| [Troubleshooting](https://payload-auth.dev/docs/troubleshooting) | Common problems |

## License

MIT
