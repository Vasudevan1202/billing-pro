# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a full-featured restaurant billing system (Udupi POS).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS v4
- **QR Codes**: qrcode.react

## Artifacts

### Restaurant Billing (`/`) — react-vite
Full-featured South Indian restaurant POS system with:
- **Billing page** (`/`) — menu grid with cart, payment (cash/UPI/card), UPI QR code, printable invoice
- **Orders page** (`/orders`) — recent orders list with detail view
- **Analytics page** (`/analytics`) — revenue/orders/avg-order-value with top-selling items
- **Admin page** (`/admin`) — full CRUD for menu items (add/edit/delete/toggle availability)

### API Server (`/api`) — Express
Handles all backend logic including menu CRUD, order creation, and analytics.

## Database Schema

- `menu_items` — id, name, price, category, image_url, available, created_at
- `orders` — id, order_number, total_amount, payment_method, status, created_at
- `order_items` — id, order_id, menu_item_id, menu_item_name, quantity, unit_price, subtotal

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/restaurant-billing run dev` — run frontend locally

## Seeded Menu Items

Idly (₹30), Puttu (₹40), Poori (₹45), Dosai (₹50), Vada (₹35), Pazhampori (₹25), Coffee (₹20), Tea (₹15), Upma (₹40), Pongal (₹45)
