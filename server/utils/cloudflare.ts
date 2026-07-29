import type { H3Event } from 'h3'
import type { Compilable } from 'kysely'

export function useWAE(event: H3Event, query: Compilable) {
  const config = useRuntimeConfig(event)
  const env = event.context.cloudflare?.env || {}
  
  const cfAccountId = config.cfAccountId || env.NUXT_CF_ACCOUNT_ID || process.env.NUXT_CF_ACCOUNT_ID
  const cfApiToken = config.cfApiToken || env.NUXT_CF_API_TOKEN || process.env.NUXT_CF_API_TOKEN

  if (!cfAccountId || !cfApiToken) {
    console.error('Missing Cloudflare Analytics credentials in environment variables.')
    throw createError({ statusCode: 500, message: 'Missing Cloudflare Analytics credentials.' })
  }

  const compiledQuery = compileAnalyticsQuery(query)

  if (import.meta.dev)
    console.info('useWAE', compiledQuery)

  return $fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/analytics_engine/sql`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfApiToken}`,
    },
    body: compiledQuery,
    retry: 1,
    retryDelay: 100, // ms
  })
}
