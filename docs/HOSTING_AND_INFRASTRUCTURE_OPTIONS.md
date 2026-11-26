# VYRA Markets — Hosting and Infrastructure Options

**Research cut-off:** 26 November 2026  
**Constraint:** zero capital; private GitHub repository; Next.js application; Supabase Auth/Postgres code already in use.  
**Purpose:** choose a free development/demo host without pretending a free plan is suitable for regulated financial production.

## 1. Recommendation

### Near-term demo
Keep the committed Render blueprint as the first low-effort demo option, provided the owner selects a Render workspace. Render's free Node web service can run a Next.js server, but sleeps after 15 minutes of inactivity and can take around one minute to wake. Its free filesystem is ephemeral, and free Render Postgres expires after 30 days. Render explicitly says not to use free instances for production. Use it only for an internal paper-only demo with no real customer data, funds, broker credentials or live execution.

### Alternative for a free Next.js demo
Netlify Free is a viable comparison option because Netlify documents support for modern Next.js features through its OpenNext adapter, including App Router, SSR, route handlers and middleware. Its public pricing page lists a $0 Free plan, but current account/usage/build-credit limits should be checked before deploy. It may be useful if Render workspace access is blocked; it is not a production brokerage infrastructure decision.

### Longer-term zero-cost experimentation
Cloudflare Workers is an attractive future experiment. Cloudflare's documentation recommends **vinext** as its current Next.js-on-Workers route for new projects and documents a non-destructive migration workflow. The Workers Free plan includes 100,000 requests/day and 10ms CPU time per invocation. The existing VYRA app must pass compatibility checks before migration. This is a separate migration branch, not a drop-in one-click deployment; confirm the Supabase SSR/Auth cookie flows, middleware behaviour, Node package compatibility, image handling, scheduled work and secrets binding.

### Do not choose as current production path
- Vercel Hobby is for personal, non-commercial use according to Vercel's pricing page; VYRA is intended as a commercial financial platform. The private org repository link was also blocked by the current Vercel Hobby team. Do not pay for Pro or make the repository public just to deploy.
- Railway Free gives $1/month usage credit and services sleep after 5–10 minutes of inactivity; the $1 is consumed by CPU, RAM, storage and egress. Custom domains, cron and region choice are excluded from Free. It is a useful sandbox, but not a reliable always-on broker-facing platform.
- No free platform should host live brokerage operations, authoritative financial ledgers or regulated customer records merely because a free tier is available.

## 2. Hosting comparison

| Platform | Current free offering / framework support | Main limitations | VYRA recommendation |
|---|---|---|---|
| Render | Free Node web services and static sites; can host a normal Next.js Node server | 15-min idle sleep, ~1-min wake, ephemeral filesystem, 750 free instance hours per workspace/month; free Postgres expires after 30 days; Render says not production use | **First paper-demo candidate** after workspace selection; keep DB in a separate durable project |
| Netlify | $0 Free plan; Next.js via OpenNext; docs list App Router, SSR, route handlers, middleware and image optimisation | Check current credit/build limits and account team features; data persistence is separate | Good alternative for previews/demo; verify the project's runtime and data flows |
| Cloudflare Workers | Free Workers plan; Next.js supported via vinext (recommended in current docs) | Requires a compatibility/migration test; Free CPU 10ms/invocation and 100k requests/day; Workers runtime differs from Node | Strong future experiment for low-cost edge hosting, but not an untested production migration |
| Railway | $0 Free plan, $1 resource credit/month; up to 3 services; serverless sleep | Sleeps after 5–10 min; no custom domains/cron/region choice on Free; when monthly credit is used, services stop | Small sandbox only; not primary broker demo |
| Vercel | Hobby $0; Next.js native platform; automatic Git deployment | Hobby is for personal/non-commercial projects; current private organisation integration requires a paid plan in this account | Do not use for this commercial project under current zero-capital constraint |
| Supabase | Existing VYRA code targets Supabase Auth/Postgres | Current organisation has reached the two active Free project limit; 9N8 and Space Ledger must remain untouched | Find a separate authorised free-capacity organisation or pause database provisioning; do not repurpose another project |

## 3. Detailed evidence and source links

### Render
Official documentation: https://render.com/docs/free

The current Render free deployment guide says free web services and data stores are useful for testing and hobby projects, but not production. It says free web services spin down after 15 minutes without incoming traffic and take about one minute to resume. The free filesystem is ephemeral; local changes disappear after redeploy, restart or spin-down. Render gives 750 free instance-hours per workspace per month. Free Render Postgres databases expire 30 days after creation.

Implications:
- Do not store uploads, SQLite files or broker event queues on the container filesystem.
- Do not use free Render Postgres as the durable VYRA ledger.
- Accept cold-start delay for internal demo only.
- Do not connect partner production credentials or real user KYC.

### Netlify
Official pricing: https://www.netlify.com/pricing/  
Official Next.js adapter docs: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/

Netlify's current public page lists a $0 Free plan and says projects are private until shared. Its Next.js docs say the OpenNext adapter supports App Router, SSR, ISR, route handlers, server actions, middleware and other current Next.js features. The build adapter provisions serverless functions and edge middleware. Confirm the current Free plan credit and limits in the account before choosing it.

Implications:
- Netlify may be a low-friction alternative to Render for the existing Next.js code.
- Use a preview environment with synthetic data only.
- Verify all server-only environment variables are kept in host secrets.
- Do not assume its hosting plan includes the database, authentication, compliance or exchange data rights.

### Cloudflare Workers
Official Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/  
Official Next.js framework guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/  
Official OpenNext adapter page: https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/

Cloudflare's Next.js guide (updated November 2026) recommends vinext for new and migrated Next.js applications on Workers and gives non-destructive setup steps. The older OpenNext adapter supports most Next.js features but Cloudflare recommends vinext as the default path. The Free Workers plan includes 100,000 requests/day and 10ms CPU time per invocation. Paid Workers begins at a $5 monthly minimum, so do not choose a plan that requires the paid tier.

Implications:
- Create a separate branch for compatibility testing.
- Run the vinext compatibility check, migrate in a non-destructive way, test routes/auth/cookies/RPC/data fetches, and compare behaviour before choosing.
- Never combine a migration with the main production release.
- Check Node.js compatibility; Worker runtime packages differ from a standard Node server.
- Use Workers secrets/bindings, not hardcoded values.

### Railway
Official Free plan: https://docs.railway.com/pricing/free-plan  
Official pricing: https://railway.com/pricing

Railway's official Free plan provides $1 of monthly resource usage without a credit card. Services sleep after 5–10 minutes without outbound traffic. The Free plan currently supports up to one project with up to three services and limited CPU/RAM, while custom domains, cron jobs and region selection require the paid Hobby tier. The $1 credit can be consumed by compute, memory, volume and network egress; services stop when the allowance is exhausted.

Implications:
- A sandbox with little activity may fit the allowance; a public, always-on financial application does not.
- Do not assume the $1 credit will cover a workload or remain available after traffic grows.
- No live customer money, ledger or order traffic.

### Vercel
Official pricing: https://vercel.com/pricing  
Official Hobby docs: https://vercel.com/docs/plans/hobby

Vercel pricing lists Hobby at $0 and identifies the intended use as personal, non-commercial web apps/projects. The plan is not an appropriate assumption for a commercial brokerage business. The VYRA team connection also cannot currently link the private organisation repository without a paid upgrade. No upgrade should be purchased under the zero-capital constraint.

## 4. Database and data-service decision

VYRA's core database is now a dedicated Neon PostgreSQL project, not Supabase or Firestore. The project `vyra-markets` is provisioned in Frankfurt, with a `vyra` database, Neon Managed Better Auth and the Neon Data API. The Neon-native migration is applied to the main branch. The active application uses Neon Auth, the Neon Data API and a server-only quote-ingestion connection with the restricted `vyra_quote_ingest` role.

The earlier Supabase project attempt was blocked by the account's two active Free project limit. Do not connect VYRA to 9N8 or Space Ledger; both remain untouched. The old Supabase SQL migration is history/reference only and must not be applied to Neon.

Do not substitute a hosting platform's temporary database for VYRA Postgres. Neon Free is a development/paper environment only. Before any production financial book, require supported backups, tested restores, defined RPO/RTO, operational monitoring, audit evidence, capacity and contractual support.

## 5. Environment layout

| Environment | Hosting | Database | Secrets/data |
|---|---|---|---|
| Local development | Developer laptop / Node.js | Neon `vyra-dev` or isolated local test DB | synthetic users/data; local secret file ignored by Git |
| Pull-request preview | CI build or isolated preview host | no production DB; synthetic/disposable test branch only | no production secrets |
| Paper demo | Render Free initially, or Netlify after verification | dedicated Neon `vyra` project | synthetic paper data only; server-side Neon secrets |
| Partner sandbox | Separate environment agreed with the authorised partner | isolated Neon branch/project or partner-approved test environment | sandbox credentials only, scoped to approved API permissions |
| Production brokerage | Not selected; must be jointly agreed with authorised partner and counsel | durable supported database with contractual backup/recovery and operating commitments | production secrets in managed secret store; least privilege, MFA and monitored rotation |

A later production architecture will likely need multiple isolated services or modules: web app, identity, partner API gateway, policy engine, market-data service, async job/queue worker, webhook receiver, audit store, reconciliation worker, monitoring and immutable backup. Do not overbuild these paid services before partner selection; the interface contracts and security boundaries can be designed now and deployed only when funded and permitted.

## 6. Infrastructure decision log

- VYRA remains on private GitHub.
- Full GitHub Actions passed on commit `9f0e6d65ceed9a53fdf5457f600d5a67adc37783` (16 tests, typecheck, lint and production build); a later documentation-only run is being checked.
- render.yaml is present for a free Node demo service.
- Render service creation is pending owner selection between My Workspace and JOJO.
- Neon VYRA project is provisioned and the native migration is applied; Supabase projects 9N8 and Space Ledger remain untouched.
- Vercel Hobby deployment is not selected.
- Netlify and Cloudflare Workers remain researched alternatives, not connected deployments.
- No actual public deployment is represented as active.
