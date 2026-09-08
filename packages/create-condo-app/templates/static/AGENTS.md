# Static (Backendless) Condo Miniapp Boilerplate

This is a Next.js-based boilerplate for Condo miniapps configured for static export mode. 
It can be used for both B2B and B2C miniapps.

## Table of contents

- [Purpose](#purpose)
- [Tech-stack description](#tech-stack-description)
- [Resources](#resources-and-terms)
- [File structure](#file-structure)
- [UI & Components](#ui--components)
- [Code style and naming conventions](#code-style-and-naming-conventions)
- [i18n](#i18n)
- [Bridge](#bridge)

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

CSS-modules is used for styling. There's transformer inside next.config.ts, allowing you to write css in `kebab-case` and use them in js with `camelCase` to satisfy both stylelint and ts autocomplete.

## Resources and terms

### Resources

You can find these resources helpful for learning how to build Condo miniapps:
- [Condo Developers Portal](https://developers.doma.ai) for documentations on Miniapps, Condo API, Condo Bridge and Condo UI
- [Condo UI Playground](https://condo.d.doma.ai/ui/index.html) for Condo UI components and icons
- [Condo GraphQL Playground](https://condo.d.doma.ai/admin/api). Here you can introspect the GQL schema to get schemaDocs / queries / mutations and other GQL context
- README.md and JSDoc of open-condo packages listed below for extra context

### Terms

Condo is an open-source open-core platform for managing companies / residents and service providers. 
It's development stand located at https://condo.d.doma.ai. Users might call it "Condo" or "Doma" or "Дома" in his requests. You should treat it as "Condo".

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

## UI & Components

- For designing UI you can use [`@open-condo/ui`](https://www.npmjs.com/package/@open-condo/ui) and [`@open-condo/icons`](https://www.npmjs.com/package/@open-condo/icons) package as primary source of components.
- You can find Storybook playground for icons and components here: https://condo.d.doma.ai/ui/index.html
- If components from `@open-condo/ui` are not enough, you can use components from [`antd@^5`](https://5x.ant.design) and icons from [`lucide-react`](https://lucide.dev/icons/), 
but only use them if you have a specific and complex need. For a simple primitives / layouts consider using local components instead.
- For styling, you should use css-modules. Each module should be placed next to imported component / page. For example `domains/user/components/UserCard.module.css`.
- You should always use functional components and hooks, and avoid classes.

## Code style and naming conventions

- Use `SNAKE_CASE` with caps for constants
- Use `UpperCamelCase` for components and translations variables
- Translation variables must be `UpperCamelCase` and ends with `Title` / `Subtitle` / `Text` / `Description` / `Placeholder` / `Label` suffix. (For example: `TicketPageTitle`, `NamePlaceholder`, `AlertDescription`)
- Use `lowerCamelCase` for the rest (variables, functions, hooks, etc.)

## i18n

[//]: # (TODO: add i18n description)

## Bridge

App uses [`@open-condo/bridge`](https://www.npmjs.com/package/@open-condo/bridge) package for communication with parent condo app (frontend to frontend).
Parent app might be B2B App for managing companies or B2C App for residents, native or web, bridge API is the same for all of them, you can check [documentation](https://developers.doma.ai/docs/bridge/about) to check which methods are supported on platforms
Bridge is primarily used to get launch params (locale / user id / organization or resident id), resize app, perform background authorization and so on...


