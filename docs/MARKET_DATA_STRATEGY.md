
# BARX — Market Data Strategy

## 1. Objective
BARX will use reliable historical market data for charting, candle replay, indicators, and paper trading.

## 2. Supported Markets
- Stocks
- Cryptocurrency
- Forex
- Indices
- Commodities

Coverage will be added progressively according to data availability, licensing, and reliability.

## 3. Standard Candle Format
Every candle must contain:

- timestamp
- open
- high
- low
- close
- volume

Timestamps will use UTC.

## 4. Data Quality Rules
- OHLC values must be valid numbers.
- High must be greater than or equal to open and close.
- Low must be less than or equal to open and close.
- Volume cannot be negative.
- Candles must be ordered chronologically.
- Duplicate timestamps must be handled safely.
- Missing candles must not be silently fabricated.

## 5. Timeframes
Planned timeframes:
- 1 minute
- 5 minutes
- 15 minutes
- 30 minutes
- 1 hour
- 4 hours
- 1 day
- 1 week

Actual availability depends on the provider.

## 6. Provider Architecture
Market data providers must be modular.

BARX should be able to support multiple providers without rewriting the chart or replay engine.

Each provider must document:
- Supported markets
- Available timeframes
- Historical data limits
- Rate limits
- Licensing restrictions
- Pricing

## 7. Data Integrity
- Never label sample data as live market data.
- Never claim complete historical coverage without verification.
- Respect provider licensing and exchange restrictions.
- Store the source and retrieval time of imported datasets.

## 8. Replay Safety
- Future candles must remain inaccessible to replay calculations.
- Indicators must calculate only from visible candles.
- Paper trading must use only information available at replay time.

## 9. Initial Development
Begin with clearly labeled sample OHLCV datasets.

Real provider integration will be selected after evaluating coverage, licensing, and free-tier limits.
