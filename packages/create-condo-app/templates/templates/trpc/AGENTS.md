# TRPC BFF Condo Miniapp Boilerplate

This is a Next.js-based boilerplate for Condo miniapps with a custom backend-for-frontend (BFF) layer.
It can be used for both B2B and B2C miniapps.

## Purpose

This template provides a starting point for building Condo miniapps that need custom server-side logic.
App has a simple, but powerful backend (utilising Next.js API routes) powered by [tRPC](https://trpc.io),
so it can safely call Condo API, your own databases, or any other external APIs on behalf of the client.

This template utilises OIDC authorization code flow with client secret for authentication in Condo, 
so all backend procedures are protected by condo authorization layers.


## Tech-stack description

This app is based on Next.js (Pages Router), React, and TypeScript.
API routes under `pages/api/` are available and act as the app primary backend (or BFF in case where are multiple backends).

Backend API is implemented with [tRPC](https://trpc.io): a single catch-all endpoint `pages/api/trpc/[trpc].ts` serves all procedures,
while domain-specific routers live in `domains/<domain>/routers/` and are aggregated in `domains/common/routers/_app.ts`.
On the client, tRPC is integrated with TanStack Query via `domains/common/utils/trpc.client.ts` (`useTRPC`, `useQuery`).

For passing config variables to app, you can use runtime config inside `next.config.ts`.
`publicRuntimeConfig` values are exposed to the client, while `serverRuntimeConfig` values (like `OIDC_CLIENT_SECRET`, `COOKIE_SECRET`)
are server-only and never shipped to the browser.

CSS-modules is used for styling. There's transformer inside next.config.ts, allowing you to write css in `kebab-case` and use them in js with `camelCase` to satisfy both stylelint and ts autocomplete.

## File structure

This app inherits structure from default Next.js Pages Router App and extends it with Domain Driven Design (DDD) patterns.

All application logic is located in domains folder, each domain has its own subfolder with separate name (like ticket, user, organization, resident).
For generic utils / files use `common` domain.

Inside each domain file placed in separate folder based on usage:
- `domains/<domain>/constants/*.ts` - folder for domain specific constants
- `domains/<domain>/utils/*.ts` - folder for domain specific utils (functions, helpers, etc.)
- `domains/<domain>/hooks/*.ts` - folder for react hooks
- `domains/<domain>/components/**/*.tsx` - folder for domain specific components (in general do not place components in subfolders, until its heavy or grouped by usage). Example: `domains/user/components/UserCard.tsx`
- `domains/<domain>/queries/*.gql` - folder for GQL requests. Place requests for Condo API here, it will be processed by `graphql-codegen` to `@/gql` from where you can import them in your TRPC routers to make sub-requests to Condo API.
- `domains/<domain>/routers/*.ts` - folder for TRPC routers. Place your domain-specific backend procedures here
- 
There's also specific files for translations similar to `@/gql`, in app root there's a `lang` folder containing `<locale>.json` files for each locale.
By default, miniapp supports `ru` and `en` locales. You can change this by tweaking `domains/common/constants/locales.ts` file. More context on `i18n` can be found in [i18n](#i18n) section.

All folders must be named in `camelCase`. `lowerCamelCase` is preferred for everything, except component files or folders which use `UpperCamelCase`. Examples:
- `domains/user/components/MyComponent.tsx` - single-file component
- `domains/user/utils/passwords.ts`

## Backend / API architecture

This app uses a **BFF (backend-for-frontend)** pattern: the Next.js server acts as a dedicated backend for the miniapp.
The client never talks to Condo API or external services directly - all data flows through tRPC procedures.

**tRPC layer:**
- Single HTTP endpoint `pages/api/trpc/[trpc].ts` serves all procedures via `createNextApiHandler`
- `createTRPCContext` (in `domains/common/utils/trpc.server.ts`) extracts OIDC tokens from the session cookie on each request and builds context: `condoUser` (decoded from id token), `condoAccessToken`, `constAccessTokenExpiresAt`
- Two procedure types: `authedProcedure` (throws `UNAUTHORIZED` without valid session) and `publicProcedure` (marked `@deprecated` - avoid using for anything except explicitly public endpoints)
- Always validate procedure inputs with `zod` schemas (see `examples/trpc` for reference)

**Routers:**
- Each domain has its own router in `domains/<domain>/routers/`, aggregated in `domains/common/routers/_app.ts` (`appRouter`)
- Routers fall into two kinds:
  - **Condo API proxies** - named after the Condo model/list they serve (like `queries/*.gql` files), e.g. `domains/organization/routers/OrganizationEmployee.ts`. They use `initializeServerApolloClient(ctx)` (from `domains/common/utils/apollo.ts`) which forwards `condoAccessToken` as `Bearer` token to Condo GraphQL API
  - **Custom backend services** - for your own logic: databases, external APIs, file storage, etc. These have no Condo counterpart and can use any server-side library

**Client side:**
- Components call procedures via `useTRPC()` + `useQuery`/`useMutation` from `domains/common/utils/trpc.client.ts` (TanStack Query under the hood)
- tRPC gives end-to-end type safety: `AppRouter` type is inferred from `appRouter`, so client calls are fully typed

**When to use this template:** when you need server-side secrets, database access, complex business logic,
rate limiting, or aggregation of multiple APIs.

## Security notes

- **Token storage:** OIDC tokens live only in the encrypted `session.id` cookie (iron-session, sealed with `COOKIE_SECRET`). They are never exposed to the client - the browser only talks to your own `/api/trpc` and `/api/auth/*` endpoints.
- **Server-only secrets:** `OIDC_CLIENT_SECRET` and `COOKIE_SECRET` are in `serverRuntimeConfig` - never move them to `publicRuntimeConfig` or `NEXT_PUBLIC_*` env variables, and never import server-only modules into client components.
- **Auth enforcement:** always use `authedProcedure` for anything that requires a logged-in user - it guarantees `ctx.condoUser` and `ctx.condoAccessToken` are present. `publicProcedure` is deprecated; only use it for intentionally public endpoints.
- **Condo API calls:** `initializeServerApolloClient` automatically attaches the user's `condoAccessToken` - Condo API enforces permissions server-side. Don't bypass it or use a service token unless you have a specific reason. **Do not reuse apollo client between requests**
- **Input validation:** validate all procedure inputs with `zod` - tRPC does not validate by default.
- **Session validation:** `AuthContext` verifies that the authenticated user's id matches `condoUserId` from launch params, so a stale session from a different user is discarded and the OIDC flow is re-run.
- **CORS:** the dev-only middleware restricts allowed origins to the Condo domain and app domain, with a special `Origin: null` case for the OIDC callback. Keep this restriction if you extend it.
