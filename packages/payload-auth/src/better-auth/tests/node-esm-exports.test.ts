import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

const packageRoot = fileURLToPath(new URL('../../../', import.meta.url))

it('loads the adapter, Payload plugin, and TanStack Start exports in native Node ESM', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      'await import("better-auth-payload/better-auth/adapter"); await import("better-auth-payload/better-auth/plugin"); await import("better-auth-payload/better-auth/tanstack-start")',
    ],
    { cwd: packageRoot, encoding: 'utf8' },
  )

  expect(result.status, result.stderr).toBe(0)
})
