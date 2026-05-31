# template

A generic client miniapp template based on modern Next.js patterns used in this monorepo.

## Quick start

1. `yarn install`
2. `yarn prepare`
3. `yarn maketypes`
4. `yarn dev`

## Notes

- OIDC auth is configured via Next API routes.
- GraphQL requests are proxied through `/api/graphql`.
- Keep business logic inside `domains/*`.
