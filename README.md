# Two Good Co · Close the Loop

A unified Next.js app on Cloudflare Workers that helps Two Good Co **prove donation impact** and **measure participant wellbeing** from the same platform — turning operational spreadsheets into traceable outcomes, reproducible reports, and partner-safe communications.

Built with Next.js 15 (App Router, React Server Components), TypeScript, Tailwind CSS v4, shadcn/ui (Base UI), Drizzle ORM on Cloudflare D1, Cloudflare Workers AI, and deployed to Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare).

> **Prototype.** Roles (`Administrator`, `Impact analyst`, `Operations`, `Viewer`) are modelled in data and switchable from the header. Permissions are enforced in server logic. Sample data is de-identified and not representative of actual service or customer information.

## Why Close the Loop

Two Good Co needs to answer two related questions with confidence:

1. **Where did donated meals and care packs go?** Donors and partners want to know their contribution reached the shelters and communities it was intended for — without exposing sensitive locations.
2. **Is the program improving wellbeing?** Personal Wellbeing Index (PWI) tracker data must be validated, scored consistently, and reported in a way that holds up to scrutiny over time.

Close the Loop connects import → validation → analysis → export in one place, with audit trails and role-based access so teams can work from the same source of truth.

## Features

### Impact — donation traceability

Trace donor orders through to the shelters that received donated meals and care packs.

| Area | What it does |
|------|----------------|
| **Dashboard** | Summary stats (orders, donations, shelters, match status) and charts by donation type and top shelters. |
| **Donation ledger** | Unified ledger linking donors, orders, fulfilments, and traces — browse all donations or switch to the needs-attention view to confirm, reject, or override uncertain links. Manual overrides are preserved by the matching engine. |
| **Automatic matching** | After import, infers donor-to-shelter links from product category, postcode, and quantity agreement. Each trace stores its method, confidence, and candidates considered. |
| **Shelters** | Browse the shelter registry, including sensitive-address flags. |
| **Partner-safe export** | Download a CSV impact file that always masks sensitive shelters, regardless of viewer role. |
| **Thank-you emails** | Send personalised 1:1 donor thank-you emails (via Resend) summarising confirmed and likely matches for that donor only. |

### Impact (Beta) — weekly allocation ledger

A parallel prototype at `/donations-beta` that implements the Close the Loop weekly allocation model. It does **not** replace the confidence-based traceability flow above — both can run from the same imported workbook.

| Area | What it does |
|------|----------------|
| **Dashboard** | Allocation summary (allocated, Too Good gap, carry-forward), pool breakdown (meals vs care packs), matching weeks, demo loader, and manual re-run. |
| **Allocation ledger** | Source-of-truth rows tying donor orders to shelter fulfilments by week — including carry-forward balances and gap fills. Filterable; CSV export. |
| **Weekly matching** | Separate pools for meals and care packs. Like-for-like demand bucketing by Flex product subtype. Priority: exact quantity match, then largest donor orders first, then Too Good gap tracking. |
| **Carry-forward** | Partially used donor orders roll their remaining balance into later weeks (donor orders have no date; weeks are driven by Flex fulfilment dates). |
| **Donor impact reports** | Donors aggregated by email (repeat donors merged). Printable report pages and email delivery via Resend with a link to the report. Sensitive shelters use generalised location copy. |
| **Demo scenario** | One-click synthetic multi-week workbook for demonstrating exact matches, carry-forward, gap fills, and reports without production data. |

Requires the allocation migration in [`migrations/0001_allocation_beta.sql`](migrations/0001_allocation_beta.sql) — apply with the same `wrangler d1 migrations apply` commands as the init migration.

### Wellbeing — PWI impact reporting

Import the Personal Wellbeing Index Client Tracker, validate data quality, and generate reproducible quarterly wellbeing reports.

| Area | What it does |
|------|----------------|
| **Import review** | Preview imported observations, surface validation errors and warnings, and inspect cohort breakdowns before generating a report. |
| **Report generation** | Freeze a snapshot of all computed metric results so a report's outputs never change, even if new data is imported later. |
| **Dashboard & reports** | Track domain movement, work-readiness indicators, period trends, and cohort comparisons with charts and metric tables. |
| **Exports** | Print to PDF, or download CSV / XLSX from any frozen report. |
| **Wellbeing assistant** | Ask natural-language questions grounded only in your report figures, powered by Cloudflare Workers AI (`@cf/openai/gpt-oss-120b`). |

### Shared platform

| Area | What it does |
|------|----------------|
| **Data import** | Single hub for uploading wellbeing and donation workbooks, with import history, checksums, and purge. |
| **Role-based access** | Four prototype roles with granular permissions (view, import, generate, resolve, sensitive data, AI). |
| **Audit log** | Append-only audit entries for exports, matching, and other sensitive actions. |
| **AI debug** | Test Workers AI prompts and inspect responses (`POST /api/ai/chat`). |
| **Future** | Presentation-style vision pages for where the platform could go next (not production features). |

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15, React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui (Base UI), Recharts |
| Database | Cloudflare D1 via Drizzle ORM |
| AI | Cloudflare Workers AI binding |
| Email | Resend (thank-you emails) |
| Runtime | Cloudflare Workers via OpenNext |

## Prerequisites: create the D1 database

The app stores everything in a Cloudflare D1 database bound as `DB`.

1. Create the database (run this for me):

   ```bash
   npx wrangler d1 create g-dai-db
   ```

2. Copy the returned `database_id` into [`wrangler.jsonc`](wrangler.jsonc), replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`.

3. Apply the schema migration. **Local** (for `npm run dev` / `npm run preview`):

   ```bash
   npx wrangler d1 migrations apply g-dai-db --local
   ```

   **Remote** (before deploying):

   ```bash
   npx wrangler d1 migrations apply g-dai-db --remote
   ```

The migration SQL lives in [`migrations/0000_init.sql`](migrations/0000_init.sql) and [`migrations/0001_allocation_beta.sql`](migrations/0001_allocation_beta.sql). Metric definitions and prototype users are seeded automatically on first request.

### Regenerating migrations

After changing any schema file in `src/db/schema`, regenerate the migration with:

```bash
npx drizzle-kit generate
```

Then apply it with the `wrangler d1 migrations apply` commands above.

## Optional configuration

### Thank-you emails (Resend)

To send donor thank-you emails, configure:

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Sender address, e.g. `Two Good Co <hello@twogood.com.au>` |

Add these to `.dev.vars` locally or as Wrangler secrets in production. Used for thank-you emails and Impact (Beta) donor impact report emails.

Optional: set `NEXT_PUBLIC_APP_URL` so impact report emails link to the correct host (defaults to `http://localhost:3000` in development).

### Workers AI

The Workers AI binding is configured in [`wrangler.jsonc`](wrangler.jsonc) under `"ai": { "binding": "AI" }`. The wellbeing assistant and AI debug page use this binding — no separate API key is required when deployed to Cloudflare.

## Development

```bash
npm run dev
```

Runs the Next.js dev server at [http://localhost:3000](http://localhost:3000). Cloudflare bindings (including local D1) are provided automatically via OpenNext.

## Tests

```bash
npm run test
```

Unit tests (Vitest) cover:

- PWI tracker spreadsheet import and metric calculations
- Data validation rules
- Donation workbook import and product normalisation
- Donor-to-shelter matching and scoring
- Sensitive-shelter privacy masking
- Weekly allocation engine (exact match, carry-forward, gap fill, separate meal/care-pack pools)

## Methodology notes

- **Scoring** is configurable data (`impact_metric_definition`), seeded from the tracker's Guide sheet. PWI domains use a 0–10 scale; Financial Worry uses 1–4 with `5 = Don't know` treated as missing; confidence/voice/work-readiness use 1–5 Likert; career confidence and skills awareness use 0–10.
- **Averages** exclude blank responses and values flagged as missing. On 0–10 scales, a dash (`-`) in the tracker is scored as **0** (not missing). Out-of-range values are flagged and excluded.
- **Change scores** compare the baseline average to the 3-month and 6-month averages.
- **Reproducibility** — generating a report freezes a snapshot of all computed metric results, so a report's outputs never change even if new data is imported later.
- **Donor-to-shelter matching** infers links from product category, postcode and quantity agreement (Order IDs in customer orders and shelter dispatch sheets are separate systems and are not compared). Traces below the confidence threshold go to manual review. Each trace stores its method, confidence and the candidate orders considered for explainability.
- **Weekly allocation (Beta)** runs a separate engine at `/donations-beta`: demand is aggregated per ISO week, shelter, and product subtype; donor supply is drawn from a cumulative pool with carry-forward; shortfalls are recorded as Too Good gap fills. See [`src/lib/donations-beta/`](src/lib/donations-beta/).
- **Privacy** — shelters flagged with a sensitive address have their name and precise location withheld from anyone without the sensitive-view permission and from all partner-facing exports and thank-you emails.

## Deploy to Cloudflare Workers

```bash
npx wrangler login   # once
npm run deploy
```

## Scripts

| Script | Description |
|--------|-------------|
| `dev` | Next.js dev server with Turbopack |
| `test` | Run the Vitest unit suite |
| `build` | Standard Next.js production build |
| `preview` | Build and preview in the Workers runtime locally |
| `deploy` | Build and deploy to Cloudflare Workers |
| `upload` | Build and upload to Cloudflare (without deploying) |
| `cf-typegen` | Generate Cloudflare binding types |
