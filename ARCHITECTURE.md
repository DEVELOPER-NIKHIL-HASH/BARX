
# BARX — System Architecture

## 1. Product Vision
BARX is a historical market replay and paper trading platform.

Users can study historical price movements, replay candles, practice trading with virtual funds, and analyze their performance.

## 2. Supported Markets
- Stocks
- Cryptocurrency
- Forex
- Indices
- Commodities

Market coverage will be introduced progressively based on reliable data availability.

## 3. Core Modules
1. Chart Engine
2. Historical Market Data
3. Replay Engine
4. Technical Indicators
5. Paper Trading Engine
6. Trading Analytics
7. User Workspace

## 4. Initial Technology Direction
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- Charts: TradingView Lightweight Charts
- Initial storage: Browser IndexedDB
- Source control: GitHub

Backend and external data providers will be evaluated in later phases.

## 5. Replay Engine Rules
- Historical candles must play in chronological order.
- Future candles must remain hidden during replay.
- Indicators must use only candles visible at the replay cursor.
- Paper trading decisions must not access future market data.

## 6. Market Data Format
Each candle contains:
- timestamp
- open
- high
- low
- close
- volume

All timestamps will use a consistent UTC representation.

## 7. Development Principles
- Build in small, testable phases.
- Keep market data providers modular.
- Never claim unsupported data coverage.
- Protect user data.
- Avoid paid dependencies during the initial development stage.
