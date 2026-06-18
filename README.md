# Newton Scientific Co. — Billing System

A full-stack billing and invoice management application for Newton Scientific Co., built with Next.js 15 App Router.

## Features

- **Invoice Management** — Create, edit, and view bills with dynamic line items
- **Auto-incrementing Bill Numbers** — Starting from 10001, guaranteed unique via atomic counter
- **PDF Export** — Download formatted invoices as PDF (with pricing)
- **Challan / Delivery Note** — Separate print layout without pricing
- **Bengali Amount in Words** — Invoice footer shows total in Bengali (Crore/Lakh/Thousand)
- **Search** — Full-text search on customer name and company name
- **JWT Authentication** — Single-admin login secured with httpOnly cookies

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Database | MongoDB via Mongoose 8 |
| Auth | jose (HS256 JWT) |
| Forms | react-hook-form + Zod |
| PDF | jsPDF + jspdf-autotable |
| UI | shadcn/ui + Radix UI + TailwindCSS 3 |
| Toasts | Sonner |

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB instance)

### Installation

```bash
git clone <repo-url>
cd Inventory
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<db>
JWT_SECRET=your-secret-key-here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-password
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

All five variables are required. The app will fail at runtime if any are missing.

### Development

```bash
npm run dev     # Start dev server at http://localhost:3000
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Public login page
│   ├── (dashboard)/           # Protected routes (bills, create-bill, settings)
│   └── api/                   # REST API handlers
├── components/
│   ├── Sidebar.tsx            # Nav sidebar with mobile toggle
│   └── ui/                    # shadcn/ui component library
├── lib/
│   ├── auth.ts                # JWT sign/verify, getSession()
│   ├── mongodb.ts             # Mongoose connection singleton
│   ├── pdf.ts                 # jsPDF invoice & challan generation
│   └── print.ts               # HTML print output (bill & challan variants)
├── models/
│   ├── Bill.ts                # Main bill schema with embedded line items
│   └── Counter.ts             # Atomic auto-increment for bill numbers
├── types/
│   └── index.ts               # Shared TS interfaces (Bill, InvoiceItem, etc.)
└── utils/
    └── numberToWords.ts       # Amount → Bengali words
middleware.ts                  # JWT validation on all protected routes
```

## Authentication

The app uses a single-admin model — credentials are set via environment variables. On login, a signed HS256 JWT is stored in an httpOnly cookie. `middleware.ts` validates this cookie on every request to protected routes and redirects unauthorized users to `/login`.

## PDF & Print

Two document types are generated entirely client-side:

- **Bill** — Full invoice with item pricing, subtotals, VAT/tax, and amount in Bengali words
- **Challan** — Delivery note layout, no pricing shown

Both `pdf.ts` (download) and `print.ts` (browser print dialog) support these variants.

## Data Model

Bills store an embedded array of line items (`IBillItem[]`) and are indexed for full-text search on `customerName` and `companyName`. Bill numbers are assigned atomically using the `Counter` model's `getNextSequence()` helper.
