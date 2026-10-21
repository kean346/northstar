# Northstar

A responsive, standalone analytics showcase inspired by the supplied dark dashboard reference. **Demo · Fictional data.** No marketing website files, authentication, database, or live services are involved.

## Run

Requires Node.js 20.9+ (validated with Node 24) and npm.

```sh
npm ci
npm run dev
```

For production: `npm run build` then `npm start`. The server listens on port 3000. If the default npm cache is unwritable, use `npm ci --cache /tmp/northstar-npm`.

## Workflow

Choose January, February or March 2025; inspect revenue and acquisition; explore Analytics with a channel filter; search/sort Customers and open their activity; export a matching Reports CSV. Period and channel selections persist between those views. Overview intentionally shows all channels. Settings changes the workspace name and comparison visibility; Integrations offers explicitly simulated switches. Ctrl/⌘ K opens page/customer search. Reset demo restores all preferences and filters.

## Data and definitions

`src/lib/data.ts` holds the deterministic 96-customer model, transactions, visitors, calculations and CSV generation. Transactions are monthly subscription payments on the start day of each month, stopping before cancellation. Revenue sums dated transactions. Active customers are subscribed at calendar month end. New subscriptions use actual start dates. Conversion is new paying subscriptions / eligible visitors, aggregated from counts. Comparisons use prior calendar months; rate changes use percentage points. Revenue is plotted cumulatively through each day; acquisitions are daily counts. Charts use the correct number of days; days absent from a shorter previous month have no comparison point. January has no prior baseline because December has no sample data. Currency is ZAR with en-ZA formatting.

Customer details and lifetime totals are scoped through the selected month end. The report exports channel aggregates consistent with the on-screen table, plus active customer counts. CSV fields are quoted and quote-escaped. Fictional names use reserved example.com emails.

Only workspace preferences and simulated connections are persisted under `northstar.demo.v1` in browser localStorage. Customer data is immutable. Date/channel filters are session state. No data is sent to integration providers.

## Checks

```sh
npm run typecheck
npm test
npm run build
npm start
npx playwright test
```

Browser tests cover filters, navigation, details, empty search, CSV byte consistency, simulation, reset, command search, desktop/tablet/mobile overflow, dialog focus and Escape. The included Playwright configuration uses `/usr/bin/chromium`; change its executable path for your machine or use Playwright's managed browser. Screenshots are written to `/tmp/northstar-*.png`.

Local font files come from Fontsource (Plus Jakarta Sans and Space Grotesk); icons use Lucide, charts use Recharts. Native dialogs provide focus containment and Escape; the mobile navigation traps keyboard focus. Reduced motion is respected.

## Limitations

No real integrations, custom date ranges, editable customer records, live authentication, or backend persistence. The source screenshot is a visual reference rather than a pixel-identical target. Deployment and integration into the paceIT marketing site are separate tasks.
