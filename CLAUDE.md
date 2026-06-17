# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Next.js)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is configured.

## Architecture

**Newton Scientific Co. billing app** — Next.js 15 App Router, MongoDB/Mongoose, JWT auth, PDF/print invoice generation.

### Route Groups

- `(auth)/login` — public login page
- `(dashboard)/` — all protected routes; middleware validates JWT cookie on every request to `/dashboard`, `/create-bill`, `/bills`, `/settings`
- `app/api/` — API handlers that call `getSession()` before touching the database

### Data Flow

1. `middleware.ts` — validates `token` httpOnly cookie (jose HS256) on protected routes; redirects unauthorized → `/login`
2. API routes call `getSession()` from `src/lib/auth.ts` to re-validate; all mutations are session-gated
3. `src/lib/mongodb.ts` — cached Mongoose singleton (connection reuse across hot reloads)
4. `src/models/Bill.ts` — main schema with embedded `IBillItem[]`; text index on `customerName + companyName`
5. `src/models/Counter.ts` — atomic auto-increment for bill numbers (starts at 10001); call `getNextSequence()` when creating a bill

### Key Files

| Path | Purpose |
|------|---------|
| `src/lib/auth.ts` | JWT sign/verify, `getSession()` |
| `src/lib/mongodb.ts` | Mongoose connection singleton |
| `src/lib/pdf.ts` | jsPDF invoice/challan generation |
| `src/lib/print.ts` | HTML print output (bill & challan variants) |
| `src/utils/numberToWords.ts` | Amount → Bengali words (Crore/Lakh/Thousand); used in invoice footer |
| `src/types/index.ts` | Shared TS interfaces (`Bill`, `InvoiceItem`, `BillListItem`, `ApiResponse`) |
| `src/components/Sidebar.tsx` | Nav sidebar with mobile toggle |

### Bill Form (create-bill / edit)

- `react-hook-form` + `useFieldArray` for dynamic line items
- `useWatch` drives live subtotal/grand-total calculations client-side
- Zod schema validation via `@hookform/resolvers/zod`
- On submit, POSTs to `/api/bills`; bill number is fetched from `/api/next-bill-no` on mount

### PDF / Print

Two document types — **Bill** (with pricing) and **Challan** (delivery note, no pricing). Both are generated entirely client-side:
- `pdf.ts` uses `jspdf` + `jspdf-autotable`
- `print.ts` opens a new browser window with formatted HTML

### Environment Variables

```
MONGODB_URI=           # MongoDB Atlas connection string
JWT_SECRET=            # Secret for HS256 signing
ADMIN_EMAIL=           # Single admin login
ADMIN_PASSWORD=        # Single admin password
NEXT_PUBLIC_BASE_URL=  # e.g. http://localhost:3000
```

All are required; the app will fail silently or throw at runtime if missing.

### Styling Conventions

- TailwindCSS 3 with CSS variable–based design tokens (HSL)
- shadcn/ui components live in `src/components/ui/`; add new ones with `npx shadcn@latest add <component>`
- Dark mode is class-based (`dark:` prefix); toggling not yet wired up in the UI
