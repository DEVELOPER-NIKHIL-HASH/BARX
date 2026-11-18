
# BARX — Project Structure

## 1. Architecture
BARX will initially use a frontend-first architecture.

Technology:
- React
- TypeScript
- Vite
- Tailwind CSS
- TradingView Lightweight Charts
- IndexedDB for initial browser storage

## 2. Planned Directory Structure

barx/
├── docs/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── layout/
│   │   ├── charts/
│   │   └── common/
│   ├── features/
│   │   ├── dashboard/
│   │   ├── replay/
│   │   ├── trading/
│   │   ├── analytics/
│   │   └── watchlist/
│   ├── services/
│   │   ├── market-data/
│   │   └── storage/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   ├── styles/
│   └── main.tsx
├── index.html
├── package.json
└── README.md

## 3. Architecture Rules
- Keep features modular.
- Separate chart rendering from replay logic.
- Separate market data providers from application components.
- Keep reusable components independent.
- Use TypeScript types for market data and trading entities.
- Avoid unnecessary dependencies.

## 4. Important Note
This is a planned structure, not an existing codebase.

Directories and files will be created progressively during implementation.
