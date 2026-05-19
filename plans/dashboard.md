 # SvelteKit CEO Cash Conversion Dashboard

  ## Summary

  Build the first screen as a CEO dashboard, not a generic table. The main story is: the company is profitable, but cash is partly locked in receivables, inventory, and debt service.

  Use data/Piano_dei_Conti.csv as the source and render a SvelteKit dashboard titled Cash Conversion Cockpit.

  ## Dashboard Display

  - Top insight band
      - One clear sentence: Profittevole, ma con 660k EUR assorbiti dal capitale circolante operativo.
      - Show 4 headline KPIs: Revenue 3.93M, EBITDA margin 20.4%, Net working capital 660k, Net financial debt / EBITDA 0.72x.
      - Add status labels: healthy profitability, moderate leverage, cash buffer limited.
  - Cash conversion section
      - Make this the primary panel.
      - Show a horizontal flow: Receivables 1.10M + Inventory 390k - Payables 775k = NWC 712k.
      - Include estimated cycle metrics: DSO ~97d, DIO ~98d, DPO ~128d, CCC ~67d.
      - Label these as estimates because the CSV has year-end balances, not monthly averages.
  - Profitability section
      - Show EBITDA bridge: value of production 4.03M, production costs 3.42M, EBITDA 799k, EBIT 606k, net profit 389k.
      - Use compact KPI cards plus a simple CSS/SVG bridge chart.
      - Explain visually that depreciation, finance costs, and taxes reduce profit after operating performance.
  - Revenue and cost mix section
      - Revenue mix as stacked bar:
          - Italy products 71.3%
          - EU products 15.3%
          - Extra-EU 5.1%
          - Services 8.9%
          - Discounts -0.6%
      - Cost mix as ranked bars:
          - Materials/goods 42.5%
          - Personnel 24.5%
          - Services 22.2%
      - Why: lets the CEO see concentration and biggest levers without reading account rows.
  - Liquidity and debt section
      - Show cash 132k, financial debt 705k, net financial debt 573k, interest coverage 10.8x, equity/assets 31.2%.
      - Add a small warning callout: cash equals about 0.46 months of production costs, so liquidity is the weak point despite profit.

  ## SvelteKit Implementation

  - Add a server-side metric module in $lib/finance/metrics.ts.
      - Types: AccountRow, DashboardMetric, DashboardData.
      - Parse CSV rows, normalize decimal values, compute metrics from livello === "Sottoconto" only.
      - Use CEE sections and account-code prefixes for grouping.
  - Add src/routes/+page.server.ts.
      - Read data/Piano_dei_Conti.csv from disk.
      - Return one typed DashboardData object to the page.
      - Keep all financial calculations server-side.
  - Replace src/routes/+page.svelte.
      - Render the dashboard with Svelte 5 syntax.
      - Use Tailwind utility classes and lucide-svelte icons for KPI/status affordances.
      - No table-first UI; include a compact “Dettaglio conti” section only near the bottom for traceability.

  ## Visual Style

  - Dense, executive, operational dashboard.
  - White/light background, restrained borders, 8px radius panels.
  - Avoid a marketing hero. First viewport must immediately show the business state.
  - Use color semantically:
      - green for healthy margin
      - amber for cash pressure
      - red only for genuine risk
      - neutral gray for accounting context
  - Desktop layout: 12-column grid with cash conversion spanning the main width.
  - Mobile layout: stacked KPI cards, then cash conversion, profitability, mix, debt.

  ## Test Plan

  - Run pnpm check.
      - Revenue 3,925,000
      - EBITDA 798,900
      - EBIT 605,900
      - Net profit 388,700
      - Net financial debt 572,700
  - Confirm no metric double-counts Mastro or Conto rows.
  - Confirm trend/anomaly labels are absent unless monthly data is later added.

  ## Assumptions

  - The dashboard copy can be in Italian because the exercise and target customer are Italian.
  - No charting dependency is needed for v1; simple SVG/CSS bars are enough.
  - Monthly trend charts are out of scope until the source includes monthly balances or transaction-level dates.