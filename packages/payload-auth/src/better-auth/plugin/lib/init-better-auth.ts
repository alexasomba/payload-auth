import { betterAuth } from 'better-auth'
import type { BasePayload } from 'payload'
import { payloadAdapter } from 'payload-auth/better-auth/adapter'
import type { BetterAuthFunctionOptions, BetterAuthReturn, PayloadAuthOptions } from '../types'

export function initBetterAuth<O extends PayloadAuthOptions>({
  payload,
  idType,
  idPrefix,
  options: { enableDebugLogs = false, ...restOptions }
}: {
  payload: BasePayload
  idType: 'number' | 'text'
  idPrefix?: string
  options: BetterAuthFunctionOptions<O>
}): BetterAuthReturn<O> {
  return betterAuth({
    ...restOptions,
    database: payloadAdapter({
      payloadClient: payload,
      adapterConfig: {
        enableDebugLogs,
        idType,
        idPrefix
      }
    })
  }) as unknown as BetterAuthReturn<O>
}
