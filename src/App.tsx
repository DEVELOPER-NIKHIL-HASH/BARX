
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  CandlestickChart,
  Clock3,
  Layers3,
  Play,
  Pause,
  RotateCcw,
  Search,
  Settings,
  TrendingUp,
  Wallet,
  SkipForward,
  Zap,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from 'lightweight-charts'

type Candle = CandlestickData<Time>
type Timeframe = '1m' | '5m' | '15m' | '1h' | '1d'
type Order = {
  id: number
  side: 'BUY' | 'SELL'
  price: number
  time: string
  quantity: number
}

const intervals: Timeframe[] = ['1m', '5m', '15m', '1h', '1d']

const intervalLabels: Record<Timeframe, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1H',
  '1d': '1D',
}

const speeds = [1, 2, 5, 10]

const formatPrice = (price: number) =>
  price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

function App() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  const [candles, setCandles] = useState<Candle[]>([])
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [replayIndex, setReplayIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

  const [balance, setBalance] = useState(10000)
  const [position, setPosition] = useState(0)
  const [averageEntry, setAverageEntry] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState('Overview')
  const [quantity, setQuantity] = useState('0.001')

  // Load historical BTC/USDT candles from Binance.
  const loadMarketData = useCallback(async () => {
    setLoading(true)
    setError('')
    setIsPlaying(false)
    setCandles([])
    setReplayIndex(0)

    try {
      const url = new URL('https://api.binance.com/api/v3/klines')
      url.searchParams.set('symbol', 'BTCUSDT')
      url.searchParams.set('interval', timeframe)
      url.searchParams.set('limit', '500')

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`)
      }

      const result: unknown = await response.json()

      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('No historical market data received.')
      }

      const parsed: Candle[] = result.map((row: any) => ({
        time: Math.floor(Number(row[0]) / 1000) as Time,
        open: Number(row[1]),
        high: Number(row[2]),
        low: Number(row[3]),
        close: Number(row[4]),
      }))

      if (
        parsed.some(
          (candle) =>
            !Number.isFinite(candle.open) ||
            !Number.isFinite(candle.high) ||
            !Number.isFinite(candle.low) ||
            !Number.isFinite(candle.close),
        )
      ) {
        throw new Error('Invalid candle data received.')
      }

      setCandles(parsed)
      setReplayIndex(Math.min(99, parsed.length - 1))
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to Binance.',
      )
    } finally {
      setLoading(false)
    }
  }, [timeframe])

  useEffect(() => {
    loadMarketData()
  }, [loadMarketData])

  // Initialize TradingView Lightweight Charts.
  useEffect(() => {
    const container = chartContainerRef.current
    if (!container) return

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { color: '#101622' },
        textColor: '#94a3b8',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: '#22d3ee',
          labelBackgroundColor: '#0891b2',
        },
        horzLine: {
          color: '#22d3ee',
          labelBackgroundColor: '#0891b2',
        },
      },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    chartRef.current = chart
    candleSeriesRef.current = series

    return () => {
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
    }
  }, [])

  // Display only candles reached by the replay.
  useEffect(() => {
    const series = candleSeriesRef.current
    if (!series || candles.length === 0) return

    const visibleCandles = candles.slice(0, replayIndex + 1)
    series.setData(visibleCandles)
    chartRef.current?.timeScale().fitContent()
  }, [candles, replayIndex])

  // Replay timer.
  useEffect(() => {
    if (!isPlaying || candles.length === 0) return

    const interval = window.setInterval(() => {
      setReplayIndex((current) =>
        Math.min(current + 1, candles.length - 1),
      )
    }, 1000 / speed)

    return () => window.clearInterval(interval)
  }, [isPlaying, speed, candles.length])

  useEffect(() => {
    if (candles.length > 0 && replayIndex >= candles.length - 1) {
      setIsPlaying(false)
    }
  }, [replayIndex, candles.length])

  const currentCandle = candles[replayIndex]

  const currentPrice = currentCandle?.close ?? 0

  const progress =
    candles.length > 1
      ? (replayIndex / (candles.length - 1)) * 100
      : 0

  const change = currentCandle
    ? ((currentCandle.close - currentCandle.open) /
        currentCandle.open) *
      100
    : 0

  const unrealizedPnL =
    position > 0 ? (currentPrice - averageEntry) * position : 0

  const currentValue = position * currentPrice

  const canTrade =
    currentCandle !== undefined && currentPrice > 0

  const placeOrder = (side: 'BUY' | 'SELL') => {
    if (!canTrade) return

    const amount = Number(quantity)

    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Enter a valid quantity.')
      return
    }

    const price = currentPrice
    const cost = amount * price

    if (side === 'BUY') {
      if (cost > balance) {
        alert('Insufficient paper balance.')
        return
      }

      const newPosition = position + amount
      const newAverage =
        newPosition > 0
          ? (position * averageEntry + cost) / newPosition
          : price

      setBalance((previous) => previous - cost)
      setAverageEntry(newAverage)
      setPosition(newPosition)
    } else {
      if (amount > position) {
        alert('Not enough BTC in your paper position.')
        return
      }

      setBalance((previous) => previous + cost)

      const remaining = position - amount
      setPosition(remaining)

      if (remaining <= 0.000000001) {
        setAverageEntry(0)
        setPosition(0)
      }
    }

    const newOrder: Order = {
      id: Date.now(),
      side,
      price,
      time: new Date().toLocaleTimeString(),
      quantity: amount,
    }

    setOrders((previous) => [newOrder, ...previous])
  }

  const resetReplay = () => {
    setIsPlaying(false)
    setReplayIndex(0)
  }

  const nextCandle = () => {
    setIsPlaying(false)
    setReplayIndex((previous) =>
      Math.min(previous + 1, candles.length - 1),
    )
  }

  const previousCandle = () => {
    setIsPlaying(false)
    setReplayIndex((previous) => Math.max(0, previous - 1))
  }

  const replayDate = useMemo(() => {
    if (!currentCandle) return '--'

    return new Date(
      Number(currentCandle.time) * 1000,
    ).toLocaleString()
  }, [currentCandle])

  return (
    <main className="min-h-screen bg-[#080b12] text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-lg font-black text-slate-950">
            B
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider">BARX</h1>
            <p className="text-[10px] tracking-[0.2em] text-slate-500">
              MARKET REPLAY TERMINAL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                error ? 'bg-red-400' : 'bg-emerald-400'
              }`}
            />
            {error ? 'DATA ERROR' : 'SYSTEM ONLINE'}
          </span>
          <button
            className="rounded-lg border border-white/10 p-2"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] p-4 md:p-6">
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              Trading workspace
            </p>
            <h2 className="mt-1 text-2xl font-bold">
              Market Overview
            </h2>
          </div>
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
            HISTORICAL REPLAY · PAPER MODE
          </div>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: 'Total Markets',
              value: '04',
              icon: <Layers3 />,
            },
            {
              label: 'Paper Balance',
              value: `$${formatPrice(balance)}`,
              icon: <Wallet />,
            },
            {
              label: 'BTC Position',
              value: position.toFixed(5),
              icon: <Activity />,
            },
            {
              label: 'Replay Status',
              value: isPlaying ? 'Playing' : 'Paused',
              icon: <Clock3 />,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/10 bg-[#101622] p-4"
            >
              <div className="mb-3 flex items-center justify-between text-slate-500">
                <span className="text-xs">{item.label}</span>
                {item.icon}
              </div>
              <p className="break-all text-xl font-bold">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="min-w-0 rounded-xl border border-white/10 bg-[#101622]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  BTC / USDT
                  <span className="rounded bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-300">
                    BINANCE
                  </span>
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>Historical candlestick chart</span>
                  {currentCandle && (
                    <span className="text-slate-400">
                      ${formatPrice(currentPrice)}
                    </span>
                  )}
                  {currentCandle && (
                    <span
                      className={
                        change >= 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }
                    >
                      {change >= 0 ? '+' : ''}
                      {change.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {intervals.map((item) => (
                  <button
                    key={item}
                    onClick={() => setTimeframe(item)}
                    className={`rounded-md border px-3 py-2 text-xs transition ${
                      timeframe === item
                        ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                        : 'border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {intervalLabels[item]}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative min-h-[350px]">
              <div
                ref={chartContainerRef}
                className="h-[350px] w-full"
              />

              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#101622]">
                  <RefreshCw
                    className="mb-3 animate-spin text-cyan-400"
                    size={30}
                  />
                  <p className="text-sm text-slate-300">
                    Loading Binance historical data...
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Fetching BTC/USDT candles
                  </p>
                </div>
              )}

              {!loading && error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#101622] p-6 text-center">
                  <AlertCircle
                    className="mb-3 text-red-400"
                    size={34}
                  />
                  <p className="font-semibold text-red-300">
                    Market data unavailable
                  </p>
                  <p className="mt-2 max-w-sm text-xs text-slate-500">
                    {error}
                  </p>
                  <button
                    onClick={loadMarketData}
                    className="mt-4 flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950"
                  >
                    <RefreshCw size={15} />
                    Retry connection
                  </button>
                </div>
              )}

              {!loading && !error && candles.length > 0 && (
                <div className="pointer-events-none absolute left-3 top-3 rounded bg-[#080b12]/80 px-2 py-1 text-[10px] text-slate-400">
                  {candles.length} HISTORICAL CANDLES
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">
                    Historical Replay
                  </h3>
                  <p className="text-xs text-slate-500">
                    {replayDate}
                  </p>
                </div>
                <span className="text-xs text-cyan-300">
                  {candles.length > 0
                    ? `${replayIndex + 1} / ${candles.length} CANDLES`
                    : 'WAITING FOR DATA'}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max={Math.max(candles.length - 1, 0)}
                value={Math.min(replayIndex, Math.max(candles.length - 1, 0))}
                disabled={candles.length === 0 || loading}
                onChange={(event) => {
                  setIsPlaying(false)
                  setReplayIndex(Number(event.target.value))
                }}
                className="mb-4 w-full cursor-pointer accent-cyan-400"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={loading || candles.length === 0}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40"
                >
                  {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>

                <button
                  disabled={candles.length === 0}
                  onClick={previousCandle}
                  className="rounded-lg border border-white/10 p-2 text-slate-400 disabled:opacity-40"
                  title="Previous candle"
                >
                  <SkipForward className="rotate-180" size={17} />
                </button>

                <button
                  disabled={candles.length === 0}
                  onClick={nextCandle}
                  className="rounded-lg border border-white/10 p-2 text-slate-400 disabled:opacity-40"
                  title="Next candle"
                >
                  <SkipForward size={17} />
                </button>

                <button
                  disabled={candles.length === 0}
                  onClick={resetReplay}
                  className="rounded-lg border border-white/10 p-2 text-slate-400 disabled:opacity-40"
                  title="Reset replay"
                >
                  <RotateCcw size={17} />
                </button>

                <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 p-1">
                  <Zap size={14} className="ml-1 text-amber-400" />
                  {speeds.map((item) => (
                    <button
                      key={item}
                      onClick={() => setSpeed(item)}
                      className={`rounded px-2 py-1 text-xs ${
                        speed === item
                          ? 'bg-cyan-400 text-slate-950'
                          : 'text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {item}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-between text-xs text-slate-500">
                <span>Replay progress</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl border border-white/10 bg-[#101622] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Market Watchlist</h3>
                <Search size={17} className="text-slate-500" />
              </div>

              <div className="space-y-2">
                <div className="rounded-lg border border-cyan-400/40 bg-cyan-400/5 p-3">
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-medium">
                      BTC / USDT
                    </span>
                    <span className="text-xs text-cyan-300">
                      SELECTED
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-200">
                  