import type { BasePayload } from 'payload'
import type { BetterAuthOptions } from '../types'

export async function resolveRuntimeBetterAuthOptions({
  payload,
  options,
  factory
}: {
  payload: BasePayload
  options: BetterAuthOptions
  factory?: (context: {
    payload: BasePayload
    options: BetterAuthOptions
  }) => Partial<BetterAuthOptions> | null | Promise<Partial<BetterAuthOptions> | null>
}): Promise<BetterAuthOptions | null> {
  if (!factory) return options
  const overrides = await factory({ payload, options })
  if (overrides === null) return null
  return {
    ...options,
    ...overrides,
    // The plugin list controls generated collections. Runtime options may
    // replace callbacks/configuration only when explicitly returned.
    plugins: overrides.plugins ?? options.plugins
  }
}
