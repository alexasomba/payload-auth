import type { BasePayload } from 'payload'

export type PayloadAdapterParams = {
  payloadClient: BasePayload | Promise<BasePayload> | (() => Promise<BasePayload>)
  adapterConfig: {
    enableDebugLogs?: boolean
    idType: 'number' | 'text'
    /** Prefix used by an existing Payload identity mapping (for example `payload:`). */
    idPrefix?: string
  }
}

export type PayloadAdapter = (options: PayloadAdapterParams) => (options: any) => any
