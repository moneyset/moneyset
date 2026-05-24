## MONEYSET

Premium market cognition MVP: real Binance movement + restrained multi-agent interpretation + operational intelligence + memory + Telegram companion.

This repo is designed to be deployable as a **calm, production-grade MVP** (not a trading terminal, not a signal bot).

### Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

### Environment variables

Copy `.env.example` → `.env.local` and fill only what you need.

- **Binance**: runs on public endpoints by default (keys reserved for signed endpoints later).
- **OpenRouter**: required for live multi-agent cognition (`OPENROUTER_API_KEY`).
- **Telegram**: required to run the bot (`TELEGRAM_BOT_TOKEN`).
- **NOWPayments**: optional; if missing the billing flow runs in demo mode.

### Deploy (Vercel)

- Add environment variables from `.env.example` in Vercel Project Settings.
- Deploy normally. All sensitive keys must remain **server-side only**.

### Key routes

- **Cognition workspace**: `/`
- **Settings**: `/settings`
- **Journal**: `/journal`
- **Cognition archive**: `/memory`
- **Auth**: `/auth`

### API routes (selected)

- Binance (public proxy):
  - `/api/binance/ticker`
  - `/api/binance/kline`
  - `/api/binance/premium-index`
  - `/api/binance/open-interest`
- OpenRouter cognition:
  - `/api/openrouter/cognition`
- Billing:
  - `/api/billing/create`
  - `/api/billing/status`
- Telegram:
  - `/api/telegram/webhook`
  - `/api/telegram/link-code`
  - `/api/telegram/link-status`
  - `/api/telegram/state/push`
  - `/api/telegram/alert`

### Architecture overview (high level)

- **Market layer**:
  - WS price stream + throttled REST metrics → `useMarketStore`
- **Cognition layer**:
  - deterministic simulation store (calm, coherent state evolution)
  - OpenRouter agents run only on meaningful triggers (cooldowns)
  - operational intelligence feed emits only on meaningful shifts
- **Memory layer**:
  - local-first archive snapshots + journal entries (Supabase-ready later)
- **Premium layer**:
  - subscription store + provider abstraction
  - calm gating and checkout UX
- **Telegram layer**:
  - webhook bot + link codes + rare alerts

### Security notes

- Never commit `.env.local` (the repo ignores `.env*`).
- Rotate keys if they were ever pasted into chat logs or committed by accident.
- Configure Telegram with a webhook secret token (`TELEGRAM_WEBHOOK_SECRET`) before production use.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
