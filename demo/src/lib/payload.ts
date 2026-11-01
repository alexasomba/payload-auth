import configPromise from '@payload-config'
import { getPayloadAuth } from 'better-auth-payload/better-auth'
import { ConstructedBetterAuthPluginOptions } from './auth/options'

export const getPayload = async () => getPayloadAuth<ConstructedBetterAuthPluginOptions>(configPromise)
