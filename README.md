# better-auth-payload

Better Auth for [Payload CMS](https://payloadcms.com). One auth system for your admin panel and your app.

This fork of [payload-auth](https://github.com/payload-auth/payload-auth) adds Payload 4, TanStack Start and Cloudflare D1 support.

📖 **[Upstream documentation](https://payload-auth.dev)** · 📦 **[npm](https://www.npmjs.com/package/better-auth-payload)**

```bash
pnpm add better-auth-payload better-auth @better-auth/core @better-auth/passkey
```

```ts
import { buildConfig } from 'payload'
import { betterAuthPlugin } from 'better-auth-payload/better-auth'

export default buildConfig({
  admin: { user: 'users' },
  plugins: [
    betterAuthPlugin({
      admin: { enabled: false },
      adminInvitations: { enabled: false },
      users: { roles: ['user', 'admin'], adminRoles: ['admin'] },
      betterAuthOptions: {
        emailAndPassword: { enabled: true },
      },
    }),
  ],
})
```

Follow the [TanStack Start setup](./packages/payload-auth/README.md#tanstack-start) for the auth route and custom login views. The [upstream installation guide](https://payload-auth.dev/docs/getting-started/installation) covers the optional Next.js integration.

## Repository layout

| Path | Contents |
| --- | --- |
| `packages/payload-auth` | The published plugin and database adapter |
| `docs` | The documentation site ([Fumadocs](https://fumadocs.dev)) |
| `demo` | A Next.js + Payload app exercising the plugin |
| `dev-docs` | Internal architecture, audit and test-plan notes |
| `plans` | Implementation plans |

## Development

```bash
pnpm install
pnpm build          # build the plugin
pnpm dev            # watch the plugin and run the demo
pnpm test           # run the plugin test suite
pnpm test:run       # single test run
```

The test suite needs Postgres. Start one with the bundled compose file:

```bash
docker compose -f docker-compose.test.yml up -d
```

To work on the documentation site:

```bash
pnpm --filter payload-auth-docs dev
```

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Releases

The fork uses reviewed package tarballs for releases. The inherited semantic-release publishing jobs run only in the upstream repository, whose version tags belong to the original package.

Build and pack `packages/payload-auth`, review the resulting version, README and peer dependencies, then publish that exact tarball after release approval. Publishing a branch or merging a fork PR does not publish to npm.

## License

MIT
