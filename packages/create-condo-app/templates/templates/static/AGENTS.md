# Static (Backendless) Condo Miniapp Boilerplate

This is a Next.js-based boilerplate for Condo miniapps configured for static export mode.
It can be used for both B2B and B2C miniapps.

## Purpose

This template provides a starting point for building Condo miniapps that can be deployed as static sites (HTML/CSS/JS)
to free hosting services like GitHub Pages or Condo Developers Portal.

This template utilises OIDC authorization code flow with PKCE for authentication in Condo and Custom Fields for storing data,
so it best suited for apps with no server-side logic.

> NOTE: This template is not recommended for apps with custom backend, so consider using another template with OIDC code flow for this.

## Tech-stack description

This app is based on Next.js, React, and TypeScript. Next.js is configured for [static export mode](./next.config.ts),
so no server-side features like API routes or middleware are available.

For passing config variables to app, you can use runtime config inside `next.config.ts`.
For a static apps it is baked during build time, so it's not really "runtime", but it's used for codebase consistency across other app templates.

CSS-modules is used for styling. There's transformer inside next.config.ts, allowing you to write css in `kebab-case` and use them in js with `camelCase` to satisfy both stylelint and ts autocomplete.

## Authorization

App uses OIDC code flow with PKCE for authorization. This flow is used, when app cannot store client secret safely or / and its code is exposed in browser.
That's our case, since this app does not have backend. All auth are done automatically by [AuthContext](../static/domains/user/components/AuthContext.tsx). The flow is following:
1. `authenticatedUser` query is fired to Condo API on app startup to receive current user data using token from `localStorage` (if available)
2. If user is `null` (unauthenticated), token is missing/expired, or its id does not match with launch params user id (in case user changed between sessions), then OIDC flow is performed
3. OIDC flow is performed in background, using [Condo Bridge](#bridge) `RequestAuth` method and `oidc-client-ts` library as helper for generating verifiers and processing code response
4. Received code is exchanged for access token and stored in `localStorage`

> Important NOTE: PKCE flow is configured in the way, where refresh token is not provided, since we do not have backend to store it, and access token has a short lifetime (< 24h).
> The entire app goal is to receive token and perform actions with condo API. Do not store token anywhere else, especially don't send it to any backend. For app with backend use other app templates
