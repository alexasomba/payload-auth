import { betterAuthPlugin } from 'better-auth-payload/better-auth'
import { betterAuthPluginOptions } from '@/lib/auth/options'

export const payloadAuth = () => betterAuthPlugin(betterAuthPluginOptions)
