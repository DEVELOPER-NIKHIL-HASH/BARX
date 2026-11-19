
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'X-Content-Type-Options': 'nosniff',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

const ALLOWED_MARKETS = [
  'stocks',
  'forex',
  'commodities',
]

const ALLOWED_INTERVALS = [
  '1min',
  '5min',
  '15min',
  '1h',
  '1day',
]

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      })
    }

    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, 405)
    }

    const url = new URL(request.url)

    // Normalize trailing slashes
    const path = url.pathname.replace(/\/+$/, '') || '/'

    // Root endpoint
    if (path === '/') {
      return json({
        status: 'online',
        service: 'BARX Market API',
        version: '1.0.0',
        endpoints: [
          '/health',
          '/api/quote',
          '/api/time_series',
        ],
      })
    }

    // Health check
    if (path === '/health') {
      return json({
        status: 'online',
        service: 'BARX Market API',
        timestamp: new Date().toISOString(),
      })
    }

    // Validate API route
    if (
      path !== '/api/quote' &&
      path !== '/api/time_series'
    ) {
      return json({
        error: 'Route not found',
        requestedPath: path,
        availableRoutes: [
          '/',
          '/health',
          '/api/quote',
          '/api/time_series',
        ],
      }, 404)
    }

    // Check API secret
    if (!env.TWELVE_DATA_API_KEY) {
      return json({
        error: 'Twelve Data API key is not configured',
      }, 500)
    }

    const market = (
      url.searchParams.get('market') || ''
    ).toLowerCase()

    const symbol = (
      url.searchParams.get('symbol') || ''
    ).trim()

    if (!ALLOWED_MARKETS.includes(market)) {
      return json({
        error: 'Invalid market',
        allowedMarkets: ALLOWED_MARKETS,
      }, 400)
    }

    if (
      !symbol ||
      symbol.length > 30 ||
      !/^[A-Za-z0-9./:_-]+$/.test(symbol)
    ) {
      return json({
        error: 'Invalid symbol',
      }, 400)
    }

    const endpoint =
      path === '/api/quote'
        ? 'quote'
        : 'time_series'

    const providerUrl = new URL(
      `https://api.twelvedata.com/${endpoint}`
    )

    providerUrl.searchParams.set('symbol', symbol)
    providerUrl.searchParams.set(
      'apikey',
      env.TWELVE_DATA_API_KEY
    )

    if (endpoint === 'time_series') {
      const interval =
        url.searchParams.get('interval') || '1h'

      if (!ALLOWED_INTERVALS.includes(interval)) {
        return json({
          error: 'Invalid timeframe',
          allowedIntervals: ALLOWED_INTERVALS,
        }, 400)
      }

      const requestedSize = Number(
        url.searchParams.get('outputsize') || 200
      )

      const outputsize =
        Number.isFinite(requestedSize)
          ? Math.max(
              1,
              Math.min(500, Math.floor(requestedSize))
            )
          : 200

      providerUrl.searchParams.set(
        'interval',
        interval
      )

      providerUrl.searchParams.set(
        'outputsize',
        String(outputsize)
      )
    }

    try {
      const response = await fetch(
        providerUrl.toString()
      )

      const data = await response.json()

      if (!response.ok || data.status === 'error') {
        return json({
          error:
            data.message ||
            'Market data provider error',
          providerCode: data.code || response.status,
        }, 502)
      }

      return json({
        success: true,
        market,
        symbol,
        source: 'Twelve Data',
        endpoint,
        data,
      })

    } catch (error) {
      return json({
        error: 'Unable to connect to market data provider',
      }, 502)
    }
  },
}
