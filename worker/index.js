
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=10',
      'X-Content-Type-Options': 'nosniff',
    },
  })

const allowedMarkets = ['stocks', 'forex', 'commodities']

const allowedIntervals = [
  '1min',
  '5min',
  '15min',
  '1h',
  '1day',
]

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, 405)
    }

    const url = new URL(request.url)

    if (url.pathname === '/health') {
      return json({ status: 'online', service: 'BARX Market API' })
    }

    if (!['/api/time_series', '/api/quote'].includes(url.pathname)) {
      return json({ error: 'Route not found' }, 404)
    }

    if (!env.TWELVE_DATA_API_KEY) {
      return json({ error: 'Market data API key is not configured' }, 500)
    }

    const market = url.searchParams.get('market')?.toLowerCase()
    const symbol = url.searchParams.get('symbol')?.trim()

    if (!allowedMarkets.includes(market)) {
      return json({ error: 'Invalid market type' }, 400)
    }

    if (
      !symbol ||
      symbol.length > 30 ||
      !/^[A-Za-z0-9./:_-]+$/.test(symbol)
    ) {
      return json({ error: 'Invalid symbol' }, 400)
    }

    const endpoint =
      url.pathname === '/api/quote' ? 'quote' : 'time_series'

    const providerUrl = new URL(
      `https://api.twelvedata.com/${endpoint}`
    )

    providerUrl.searchParams.set('symbol', symbol)
    providerUrl.searchParams.set('apikey', env.TWELVE_DATA_API_KEY)

    if (endpoint === 'time_series') {
      const interval = url.searchParams.get('interval') || '1h'

      if (!allowedIntervals.includes(interval)) {
        return json({ error: 'Invalid timeframe' }, 400)
      }

      const requestedSize = Number(
        url.searchParams.get('outputsize') || 200
      )

      const outputsize = Number.isFinite(requestedSize)
        ? Math.max(1, Math.min(500, Math.floor(requestedSize)))
        : 200

      providerUrl.searchParams.set('interval', interval)
      providerUrl.searchParams.set('outputsize', String(outputsize))
    }

    try {
      const upstream = await fetch(providerUrl.toString(), {
        cf: {
          cacheTtl: 10,
          cacheEverything: true,
        },
      })

      const data = await upstream.json()

      if (!upstream.ok || data.status === 'error') {
        return json(
          {
            error: data.message || 'Market data provider error',
            code: data.code || upstream.status,
          },
          upstream.status >= 400 ? upstream.status : 502
        )
      }

      return json({
        market,
        symbol,
        source: 'Twelve Data',
        data,
      })
    } catch {
      return json({ error: 'Unable to reach market data provider' }, 502)
    }
  },
}
