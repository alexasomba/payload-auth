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
  }) => Partial<BetterAuthOptions> | Promise<Partial<BetterAuthOptions>>
}): Promise<BetterAuthOptions> {
  if (!factory) return options
  const overrides = await factory({ payload, options })
  return {
    ...options,
    ...overrides,
    // The plugin list controls generated collections. Runtime options may
    // replace callbacks/configuration only when explicitly returned.
    plugins: overrides.plugins ?? options.plugins
  }
}
