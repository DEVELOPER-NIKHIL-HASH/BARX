
import { useState } from 'react'
import {
  Activity,
  CandlestickChart,
  ChevronDown,
  Clock3,
  Layers3,
  Play,
  RotateCcw,
  Search,
  Settings,
  TrendingUp,
  Wallet,
} from 'lucide-react'

const markets = [
  { name: 'BTC / USDT', symbol: 'BTC', price: '67,432.80', change: '+2.45%', positive: true },
  { name: 'ETH / USDT', symbol: 'ETH', price: '3,521.40', change: '+1.82%', positive: true },
  { name: 'NIFTY 50', symbol: 'NIFTY', price: '24,850.25', change: '-0.64%', positive: false },
  { name: 'GOLD', symbol: 'GOLD', price: '2,645.20', change: '+0.38%', positive: true },
]

function App() {
  const [activeMarket, setActiveMarket] = useState('BTC / USDT')
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState('Overview')

  return (
    <main className="min-h-screen bg-[#080b12] text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-lg font-black text-slate-950">
            B
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider">BARX</h1>
            <p className="text-[10px] tracking-[0.2em] text-slate-500">MARKET REPLAY TERMINAL</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            SYSTEM ONLINE
          </span>
          <button className="rounded-lg border border-white/10 p-2">
            <Settings size={18} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] p-4 md:p-6">
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Trading workspace</p>
            <h2 className="mt-1 text-2xl font-bold">Market Overview</h2>
          </div>
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
            DEMO MODE · Sample data
          </div>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Total Markets', value: '04', icon: <Layers3 /> },
            { label: 'Paper Balance', value: '$10,000', icon: <Wallet /> },
            { label: 'Active Positions', value: '00', icon: <Activity /> },
            { label: 'Replay Status', value: 'Paused', icon: <Clock3 /> },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-[#101622] p-4">
              <div className="mb-3 flex items-center justify-between text-slate-500">
                <span className="text-xs">{item.label}</span>
                {item.icon}
              </div>
              <p className="text-xl font-bold">{item.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="min-w-0 rounded-xl border border-white/10 bg-[#101622]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <button className="flex items-center gap-2 text-lg font-bold">
                  {activeMarket} <ChevronDown size={16} />
                </button>
                <p className="mt-1 text-xs text-slate-500">Historical chart workspace</p>
              </div>
              <div className="flex gap-2">
                {['1m', '5m', '15m', '1H', '1D'].map((time) => (
                  <button key={time} className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-400 hover:bg-white/10">
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex min-h-[310px] flex-col items-center justify-center p-6 text-center">
              <CandlestickChart size={48} className="mb-4 text-cyan-400" />
              <h3 className="text-lg font-semibold">Chart Engine Workspace</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Historical candlestick chart will appear here when market data is connected.
              </p>
              <span className="mt-4 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-500">
                Data connection pending
              </span>
            </div>

            <div className="border-t border-white/10 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Historical Replay</h3>
                  <p className="text-xs text-slate-500">Practice with historical candles</p>
                </div>
                <span className="text-xs text-amber-300">NOT LIVE</span>
              </div>
              <div className="mb-4 h-1.5 rounded-full bg-slate-800">
                <div className="h-1.5 w-1/4 rounded-full bg-cyan-400" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">
                  <Play size={15} /> {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button className="rounded-lg border border-white/10 p-2 text-slate-400">
                  <RotateCcw size={17} />
                </button>
                <span className="text-xs text-slate-500">Replay controls · Demo UI</span>
              </div>
            </div>
          </section>

          <aside className="rounded-xl border border-white/10 bg-[#101622] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Market Watchlist</h3>
              <Search size={17} className="text-slate-500" />
            </div>
            <div className="space-y-2">
              {markets.map((market) => (
                <button
                  key={market.symbol}
                  onClick={() => setActiveMarket(market.name)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    activeMarket === market.name
                      ? 'border-cyan-400/40 bg-cyan-400/5'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-medium">{market.name}</span>
                    <span className={`text-xs ${market.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {market.change}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-300">{market.price}</p>
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-white/10 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp size={16} className="text-cyan-400" />
                Paper Trading
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Simulated trading only. No real money or orders.
              </p>
              <button className="mt-3 w-full rounded-lg bg-white/10 py-2 text-sm hover:bg-white/15">
                Open Workspace
              </button>
            </div>
          </aside>
        </div>

        <section className="mt-5 rounded-xl border border-white/10 bg-[#101622] p-4">
          <div className="flex flex-wrap gap-5 border-b border-white/10">
            {['Overview', 'Positions', 'Order History'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm ${
                  activeTab === tab
                    ? 'border-b-2 border-cyan-400 text-cyan-400'
                    : 'text-slate-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="py-8 text-center text-sm text-slate-500">
            {activeTab === 'Overview'
              ? 'Your trading overview will appear here.'
              : activeTab === 'Positions'
                ? 'No open paper positions.'
                : 'No orders have been placed.'}
          </div>
        </section>

        <footer className="py-6 text-center text-xs text-slate-600">
          BARX © 2026 · Historical Market Replay & Paper Trading
        </footer>
      </div>
    </main>
  )
}

export default App
