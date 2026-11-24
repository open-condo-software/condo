# OIDC Condo Miniapp Boilerplate

[//]: # (section:description)

## Authorization

App uses full OIDC authorization code flow (without PKCE) for authorization, since this app has a backend
that can safely store the client secret (`OIDC_CLIENT_SECRET` in `serverRuntimeConfig`).

All auth is done automatically by [AuthContext](./domains/user/components/AuthContext.tsx). The flow is following:
1. On app startup, current user data is requested from the backend (which reads the session cookie and calls Condo API)
2. If user is `null` (unauthenticated) or its id does not match with launch params user id (in case user changed between sessions), then OIDC flow is performed
3. OIDC flow is performed in background: `AuthContext` opens `${serverUrl}/api/auth/condo` via [Condo Bridge](#bridge) `RequestAuth` method
4. `/api/auth/condo` endpoint (powered by `OIDCMiddleware` from `@open-condo/miniapp-utils/helpers/oidc`, see `domains/user/utils/auth.ts`) redirects to Condo OIDC provider, exchanges the returned code for tokens on `/api/auth/condo/callback`, and stores them in an encrypted session cookie
5. Session cookie (`session.id`, iron-session) is `httpOnly`, `secure`, `sameSite: 'none'` (see `domains/common/utils/session.ts`)

> Important NOTE: `sameSite: 'none'` is required on the session cookie so it's sent with background (cross-site) auth requests initiated from the Condo app.
> For this to work, the OIDC callback endpoint must allow CORS requests with `Origin: null` - this is handled by `middleware.ts` during local development.
> In deployed (non-local) environments this is handled automatically by the hosting platform, no extra configuration is needed.


