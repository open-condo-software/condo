# Static Condo Miniapp Boilerplate

This is a Next.js-based boilerplate for Condo miniapps configured for static export mode. 
It can be used for both B2B and B2C miniapps.

## Purpose

This template provides a starting point for building Condo miniapps that can be deployed as static sites (HTML/CSS/JS)
to free hosting services like GitHub Pages or Condo Developers Portal. 

This template utilise implicit OIDC flow for authentication in Condo and Custom Fields for storing data, 
so it best suited for apps with no server-side logic.

> NOTE: This template is not recommended for apps with custom backend, so consider using another template with OIDC code flow for this.

## Tech-stack description

This app is based on Next.js, React, and TypeScript. Next.js is configured for [static export mode](./next.config.ts), 
so no server-side features like API routes or middleware are available.

For passing config variables to app, you can use runtime config inside `next.config.ts`. 
For a static apps it is baked during build time, so it's not really "runtime", but it's used for codebase consistency across other app templates.

## File structure

This app inherits structure from default Next.js Pages Router App and extends it with Domain Driven Design (DDD) patterns.

All application logic is located in domains folder, each domain has its own subfolder with separate name (like ticket, user, organization, resident).
For generic utils / files use `common` domain.

Inside each domain file placed in separate folder based on usage:
- `domains/<domain>/constants/*.ts` - folder for domain specific constants
- `domains/<domain>/utils/*.ts` - folder for domain specific utils (functions, helpers, etc.)
- `domains/<domain>/hooks/*.ts` - folder for react hooks
- `domains/<domain>/components/**/*.tsx` - folder for domain specific components (in general do not place components in subfolders, until its heavy or grouped by usage). Example: `domains/user/components/UserCard.tsx`
- `domains/<domain>/queries/*.gql` - folder for GQL requests. Place requests for Condo API here, it will be processed by `graphql-codegen` to `@/gql` from where you can import them in your components / pages.

There's also specific files for translations similar to `@/gql`, in app root there's a `lang` folder containing `<locale>.json` files for each locale. 
By default, miniapp supports `ru` and `en` locales. You can change this by tweaking `domains/common/constants/locales.ts` file. More context on `i18n` can be found in [i18n](#i18n) section.

## i18n

[//]: # (TODO: add i18n description)

