# better-auth-payload

This package is maintained as a fork of [payload-auth](https://github.com/payload-auth/payload-auth).
It adds Payload 4, TanStack Start and Cloudflare D1 compatibility. The original
project and contributors retain their copyright under the included MIT license.

Connect [Better Auth](https://www.better-auth.com) to [Payload CMS](https://payloadcms.com), including an adapter that can reuse an existing Payload Users collection.

Configure your application's authentication strategy, trusted origins, session policy and admin access for its own requirements. The TanStack Start integration can be used without the package's Next.js admin views.

📖 **[Upstream documentation](https://payload-auth.dev)** · 🤖 **[llms.txt](https://payload-auth.dev/llms.txt)**

## Install

```bash
pnpm add better-auth-payload better-auth
```

## Use

```ts
// src/payload.config.ts
import { buildConfig } from 'payload'
import { betterAuthPlugin } from 'better-auth-payload/better-auth'

export default buildConfig({
  admin: { user: 'users' },
  plugins: [
    betterAuthPlugin({
      users: {
        roles: ['user', 'admin'],
        adminRoles: ['admin'],
      },
      betterAuthOptions: {
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
// src/app/api/auth/[...all]/route.ts
import configPromise from '@payload-config'
import { toNextJsHandler } from 'better-auth/next-js'
import { getPayloadAuth } from 'better-auth-payload/better-auth'

const payload = await getPayloadAuth(configPromise)

export const { POST, GET } = toNextJsHandler(payload.betterAuth)
```

Then regenerate the import map and create the schema:

```bash
pnpm payload generate:importmap
pnpm payload migrate:create && pnpm payload migrate
```

See the [installation guide](https://payload-auth.dev/docs/getting-started/installation) for the full walkthrough.

## What it does

- **Generates collections.** `users`, `sessions`, `accounts` and `verifications` are built from the Better Auth schema, plus one collection for every Better Auth plugin you enable — passkeys, two-factors, organizations, API keys, SSO providers and more.
- **Leaves Better Auth alone.** The plugin installs a database adapter that speaks Payload's Local API. Every Better Auth endpoint, plugin and client method behaves exactly as its own docs describe.
- **Replaces the admin auth views.** Login, signup, forgot password, reset password and two-factor verification are rendered by Better Auth-powered views that respect your enabled login methods.
- **Wires up roles.** Define roles once; they feed Payload access control and the Better Auth `admin` plugin.

## Entry points

| Import path | Contents |
| --- | --- |
| `better-auth-payload/better-auth` | Plugin, adapter and types — the usual import |
| `better-auth-payload/better-auth/plugin` | Plugin only |
| `better-auth-payload/better-auth/adapter` | Adapter only |
| `better-auth-payload/better-auth/plugin/client` | Client components |
| `better-auth-payload/better-auth/plugin/rsc` | Server components and admin views |
| `better-auth-payload/shared/payload/fields` | Reusable Payload field components |

## Requirements

| Requirement | Version |
| --- | --- |
| `payload`, `@payloadcms/next`, `@payloadcms/ui` | `>=3.79.1 <4` |
| `better-auth`, `@better-auth/core` | `>=1.5.0 <2` |
| `next` | `>=15.4.8 <17` |
| `react`, `react-dom` | `>=19.2.1 <20` |
| `zod` | `^4.3.6` |

Any Payload database adapter works — the plugin talks to Payload's Local API, not to your database directly.

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
