
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from 'lightweight-charts'
import {
  Activity, Clock3, Layers3, Play, Pause, RotateCcw,
  Settings, Wallet, SkipForward, RefreshCw,
  AlertCircle, Zap,
} from 'lucide-react'

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
const speeds = [1, 2, 5, 10]

const money = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function App() {
  const chartContainer = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  const [candles, setCandles] = useState<Candle[]>([])
  const [timeframe, setTimeframe] = useState<Timeframe>('1h')
  const [index, setIndex] = useState(99)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [balance, setBalance] = useState(10000)
  const [position, setPosition] = useState(0)
  const [entry, setEntry] = useState(0)
  const [quantity, setQuantity] = useState('0.001')
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState('Overview')

  const current = candles[index]
  const price = current?.close ?? 0
  const pnl = position * (price - entry)
  const value = position * price
  const progress = candles.length > 1 ? index / (candles.length - 1) * 100 : 0
  const change = current ? (current.close - current.open) / current.open * 100 : 0
  const date = current ? new Date(Number(current.time) * 1000).toLocaleString() : '--'

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    setPlaying(false)
    try {
      const url = new URL('https://api.binance.com/api/v3/klines')
      url.searchParams.set('symbol', 'BTCUSDT')
      url.searchParams.set('interval', timeframe)
      url.searchParams.set('limit', '500')
      const response = await fetch(url.toString())
      if (!response.ok) throw new Error(`Binance error: ${response.status}`)
      const data = await response.json()
      if (!Array.isArray(data) || !data.length) throw new Error('No candle data received')
      const parsed: Candle[] = data.map((row: any[]) => ({
        time: Math.floor(Number(row[0]) / 1000) as Time,
        open: Number(row[1]),
        high: Number(row[2]),
        low: Number(row[3]),
        close: Number(row[4]),
      }))
      setCandles(parsed)
      setIndex(Math.min(99, parsed.length - 1))
    } catch (e) {
      setCandles([])
      setIndex(0)
      setError(e instanceof Error ? e.message : 'Unable to load market data')
    } finally {
      setLoading(false)
    }
  }, [timeframe])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const container = chartContainer.current
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
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: true,
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
    seriesRef.current = series
    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current || !candles.length) return
    seriesRef.current.setData(candles.slice(0, index + 1))
    chartRef.current?.timeScale().fitContent()
  }, [candles, index])

  useEffect(() => {
    if (!playing || !candles.length) return
    const timer = window.setInterval(() => {
      setIndex((old) => Math.min(old + 1, candles.length - 1))
    }, 1000 / speed)
    return () => window.clearInterval(timer)
  }, [playing, speed, candles.length])

  useEffect(() => {
    if (candles.length && index >= candles.length - 1) setPlaying(false)
  }, [index, candles.length])

  const trade = (side: 'BUY' | 'SELL') => {
    const amount = Number(quantity)
    if (!current || !Number.isFinite(amount) || amount <= 0) {
      alert('Enter a valid quantity')
      return
    }
    const cost = amount * price
    if (side === 'BUY') {
      if (cost > balance) {
        alert('Insufficient paper balance')
        return
      }
      const total = position + amount
      setEntry((position * entry + cost) / total)
      setPosition(total)
      setBalance((b) => b - cost)
    } else {
      if (amount > position) {
        alert('Not enough BTC in your paper position')
        return
      }
      const remaining = position - amount
      setPosition(remaining)
      setBalance((b) => b + cost)
      if (remaining < 0.000000001) setEntry(0)
    }
    setOrders((old) => [{
      id: Date.now(),
      side,
      price,
      time: new Date().toLocaleTimeString(),
      quantity: amount,
    }, ...old])
  }

  const reset = () => {
    setPlaying(false)
    setIndex(0)
  }

  return (
    <main className="min-h-screen bg-[#080b12] text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-xl font-black text-slate-950">B</div>
          <div>
            <h1 className="text-xl font-bold tracking-wider">BARX</h1>
            <p className="text-[10px] tracking-[0.2em] text-slate-500">MARKET REPLAY TERMINAL</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          SYSTEM ONLINE
          <Settings className="ml-3 text-slate-400" size={18} />
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] p-4 md:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Trading workspace</p>
            <h2 className="mt-1 text-2xl font-bold">Market Overview</h2>
          </div>
          <span className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">HISTORICAL REPLAY · PAPER MODE</span>
        </div>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Markets', value: '04', icon: <Layers3 /> },
            { label: 'Paper Balance', value: `$${money(balance)}`, icon: <Wallet /> },
            { label: 'BTC Position', value: position.toFixed(5), icon: <Activity /> },
            { label: 'Replay Status', value: playing ? 'Playing' : 'Paused', icon: <Clock3 /> },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-[#101622] p-4">
              <div className="mb-3 flex items-center justify-between text-slate-500">
                <span className="text-xs">{item.label}</span>{item.icon}
              </div>
              <p className="break-all text-xl font-bold">{item.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="min-w-0 rounded-xl border border-white/10 bg-[#101622]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <h3 className="text-lg font-bold">BTC / USDT <span className="rounded bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-300">BINANCE</span></h3>
                <p className="mt-1 text-xs text-slate-500">Historical candlestick chart</p>
                {current && <p className="mt-1 text-sm">${money(price)} <span className={change >= 0 ? 'text-emerald-400' : 'text-red-400'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span></p>}
              </div>
              <div className="flex gap-1">
                {intervals.map((item) => (
                  <button key={item} onClick={() => setTimeframe(item)} className={`rounded-md border px-3 py-2 text-xs ${timeframe === item ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300' : 'border-white/10 text-slate-400'}`}>{item}</button>
                ))}
              </div>
            </div>

            <div className="relative min-h-[350px]">
              <div ref={chartContainer} className="h-[350px] w-full" />
              {loading && <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#101622]">
                <RefreshCw className="mb-3 animate-spin text-cyan-400" size={30} />
                <p className="text-sm">Loading Binance data...</p>
              </div>}
              {!loading && error && <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#101622] p-5 text-center">
                <AlertCircle className="mb-3 text-red-400" size={32} />
                <p className="text-red-300">Market data unavailable</p>
                <p className="mt-2 text-xs text-slate-500">{error}</p>
                <button onClick={loadData} className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">Retry</button>
              </div>}
            </div>

            <div className="border-t border-white/10 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Historical Replay</h3>
                  <p className="text-xs text-slate-500">{date}</p>
                </div>
                <span className="text-xs text-cyan-300">{candles.length ? `${index + 1} / ${candles.length} CANDLES` : 'NO DATA'}</span>
              </div>
              <input type="range" min="0" max={Math.max(candles.length - 1, 0)} value={Math.min(index, Math.max(candles.length - 1, 0))} disabled={!candles.length || loading} onChange={(e) => { setPlaying(false); setIndex(Number(e.target.value)) }} className="mb-4 w-full accent-cyan-400" />
              <div className="flex flex-wrap items-center gap-2">
                <button disabled={!candles.length || loading} onClick={() => setPlaying(!playing)} className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">
                  {playing ? <Pause size={15} /> : <Play size={15} />}{playing ? 'Pause' : 'Play'}
                </button>
                <button disabled={!candles.length} onClick={() => { setPlaying(false); setIndex((i) => Math.max(0, i - 1)) }} className="rounded-lg border border-white/10 p-2"><SkipForward className="rotate-180" size={17} /></button>
                <button disabled={!candles.length} onClick={() => { setPlaying(false); setIndex((i) => Math.min(candles.length - 1, i + 1)) }} className="rounded-lg border border-white/10 p-2"><SkipForward size={17} /></button>
                <button disabled={!candles.length} onClick={reset} className="rounded-lg border border-white/10 p-2"><RotateCcw size={17} /></button>
                <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 p-1">
                  <Zap size={14} className="ml-1 text-amber-400" />
                  {speeds.map((s) => <button key={s} onClick={() => setSpeed(s)} className={`rounded px-2 py-1 text-xs ${speed === s ? 'bg-cyan-400 text-slate-950' : 'text-slate-400'}`}>{s}x</button>)}
                </div>
              </div>
              <div className="mt-4 flex justify-between text-xs text-slate-500"><span>Replay progress</span><span>{progress.toFixed(1)}%</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${progress}%` }} /></div>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl border border-white/10 bg-[#101622] p-4">
              <h3 className="mb-4 font-semibold">Market Watchlist</h3>
              <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/5 p-3">
                <div className="flex justify-between"><span className="text-sm font-medium">BTC / USDT</span><span className="text-xs text-cyan-300">SELECTED</span></div>
                <p className="mt-2 text-sm font-semibold">${money(price)}</p>
                <p className="mt-1 text-xs text-slate-500">Bitcoin · Binance</p>
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="mb-2 text-xs text-slate-500">DATA SOURCE</p>
                <div className="flex justify-between text-sm"><span>Binance API</span><span className="text-emerald-400">Public</span></div>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#101622] p-4">
              <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Paper Trading</h3><span className="text-[10px] text-amber-300">SIMULATED</span></div>
              <div className="mb-4 rounded-lg bg-[#080b12] p-3"><p className="text-xs text-slate-500">Available balance</p><p className="mt-1 text-xl font-bold">${money(balance)}</p></div>
              <label className="mb-2 block text-xs text-slate-400">Quantity (BTC)</label>
              <input type="number" min="0.000001" step="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mb-3 w-full rounded-lg border border-white/10 bg-[#080b12] px-3 py-3 text-sm outline-none focus:border-cyan-400" />
              <p className="mb-3 text-xs text-slate-500">Estimated value: ${money(price * Math.max(0, Number(quantity) || 0))}</p>
              <div className="grid grid-cols-2 gap-2">
                <button disabled={!current} onClick={() => trade('BUY')} className="rounded-lg bg-emerald-500 py-3 text-sm font-bold disabled:opacity-40">BUY</button>
                <button disabled={!current} onClick={() => trade('SELL')} className="rounded-lg bg-red-500 py-3 text-sm font-bold disabled:opacity-40">SELL</button>
              </div>
              <p className="mt-3 text-center text-[10px] text-slate-500">Simulated trades only. No real money.</p>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#101622] p-4">
              <h3 className="mb-4 font-semibold">Position Overview</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">BTC quantity</span><span>{position.toFixed(6)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Average entry</span><span>{entry ? `$${money(entry)}` : '--'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Market value</span><span>${money(value)}</span></div>
                <div className="flex justify-between border-t border-white/10 pt-3"><span className="text-slate-400">Unrealized P&L</span><span className={pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{pnl >= 0 ? '+' : '-'}${money(Math.abs(pnl))}</span></div>
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-5 rounded-xl border border-white/10 bg-[#101622]">
          <div className="flex gap-5 border-b border-white/10 px-4">
            {['Overview', 'Order History'].map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`border-b-2 py-4 text-sm ${tab === item ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-500'}`}>{item}</button>
            ))}
          </div>
          {tab === 'Overview' ? (
            <div className="grid gap-4 p-4 sm:grid-cols-3">
              <div className="rounded-lg bg-[#080b12] p-4"><p className="text-xs text-slate-500">Portfolio value</p><p className="mt-2 text-xl font-bold">${money(balance + value)}</p></div>
              <div className="rounded-lg bg-[#080b12] p-4"><p className="text-xs text-slate-500">Open BTC position</p><p className="mt-2 text-xl font-bold">{position.toFixed(6)} BTC</p></div>
              <div className="rounded-lg bg-[#080b12] p-4"><p className="text-xs text-slate-500">Total paper orders</p><p className="mt-2 text-xl font-bold">{orders.length}</p></div>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              {orders.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No orders yet. Place a paper trade to get started.</p> : (
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-500"><tr><th className="p-3">Side</th><th className="p-3">Price</th><th className="p-3">Quantity</th><th className="p-3">Time</th></tr></thead>
                  <tbody>{orders.map((order) => (
                    <tr key={order.id} className="border-t border-white/10">
                      <td className={`p-3 font-semibold ${order.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{order.side}</td>
                      <td className="p-3">${money(order.price)}</td>
                      <td className="p-3">{order.quantity}</td>
                      <td className="p-3 text-slate-400">{order.time}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          )}
        </section>

        <footer className="mt-6 flex flex-wrap justify-between gap-2 border-t border-white/10 py-5 text-xs text-slate-500">
          <span>BARX · Historical Market Replay</span>
          <span>Data: Binance public API · Paper trading only</span>
        </footer>
      </div>
    </main>
  )
}

export default App
