# Two Good Co · Close the Loop

A unified Next.js app on Cloudflare Workers that delivers two "Close the Loop" capabilities for Two Good Co:

1. **Impact reporting** — import the Personal Wellbeing Index Client Tracker, validate data quality, and generate reproducible quarterly impact reports with Personal Wellbeing Index domain movement, work-readiness indicators, cohort breakdowns and exports (PDF / CSV / XLSX).
2. **Donation traceability** — build a unified donation ledger and trace donor orders through to the shelters that received donated meals and care packs, with a manual review queue and privacy-safe handling of sensitive shelters.

Built with Next.js 15 (App Router, React Server Components), TypeScript, Tailwind CSS v4, shadcn/ui (Base UI), Drizzle ORM on Cloudflare D1, and deployed to Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare).

> Access control is a prototype: roles (`Administrator`, `Impact analyst`, `Operations`, `Viewer`) are modelled in data and switchable from the header. Permissions are enforced in server logic. Sample data is de-identified.

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

The migration SQL lives in [`migrations/0000_init.sql`](migrations/0000_init.sql). Metric definitions and prototype users are seeded automatically on first request.

### Regenerating migrations

After changing any schema file in `src/db/schema`, regenerate the migration with:

```bash
npx drizzle-kit generate
```

Then apply it with the `wrangler d1 migrations apply` commands above.

## Development

```bash
npm run dev
```

Runs the Next.js dev server at [http://localhost:3000](http://localhost:3000). The Cloudflare bindings (including local D1) are provided automatically via OpenNext.

## Tests

```bash
npm run test
```

Unit tests (Vitest) cover spreadsheet import, metric calculations, data validation, product normalisation, donor-to-shelter matching, and sensitive-shelter privacy masking.

## Methodology notes

- **Scoring** is configurable data (`impact_metric_definition`), seeded from the tracker's Guide sheet. Personal Wellbeing Index domains use a 0–10 scale; Financial Worry uses 1–4 with `5 = Don't know` treated as missing; confidence/voice/work-readiness use 1–5 Likert; career confidence and skills awareness use 0–10.
- **Averages** exclude blank responses and values flagged as missing. On 0–10 scales, a dash (`-`) in the tracker is scored as **0** (not missing). Out-of-range values are flagged and excluded.
- **Change scores** compare the baseline average to the 3-month and 6-month averages.
- **Reproducibility** — generating a report freezes a snapshot of all computed metric results, so a report's outputs never change even if new data is imported later.
- **Donor-to-shelter matching** infers links from product category, postcode and quantity agreement (Order IDs in customer orders and shelter dispatch sheets are separate systems and are not compared). Traces below the confidence threshold go to manual review. Each trace stores its method, confidence and the candidate orders considered for explainability.
- **Privacy** — shelters flagged with a sensitive address have their name and precise location withheld from anyone without the sensitive-view permission and from all partner-facing exports.

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
| `cf-typegen` | Generate Cloudflare binding types |
