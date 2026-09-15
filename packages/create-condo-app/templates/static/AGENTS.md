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
- [Authorization](#authorization)
- [Condo API](#condo-api)
- [App Architecture](#app-architecture)

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

All folders must be named in `camelCase`. `lowerCamelCase` is preferred for everything, except component files or folders which use `UpperCamelCase`. Examples:
- `domains/user/components/MyComponent.tsx` - single-file component
- `domains/user/utils/passwords.ts`

## UI & Components

- For designing UI you can use [`@open-condo/ui`](https://www.npmjs.com/package/@open-condo/ui) and [`@open-condo/icons`](https://www.npmjs.com/package/@open-condo/icons) package as primary source of components.
- You can find Storybook playground for icons and components here: https://condo.d.doma.ai/ui/index.html
- If components from `@open-condo/ui` are not enough, you can use components from [`antd@^5`](https://5x.ant.design) and icons from [`lucide-react`](https://lucide.dev/icons/), 
but only use them if you have a specific and complex need. For a simple primitives / layouts consider using local components instead.
- For styling, you should use css-modules. Each module should be placed next to imported component / page. For example `domains/user/components/UserCard.module.css`.
- You should always use functional components and hooks, and avoid classes.

### Grouped components

When a component becomes too large or complex, it can be split into multiple files within a folder for better readability. Grouped components use `UpperCamelCase` for the folder name and must contain an `index.ts` file to enable importing the same way as single-file components.

Example structure:
```
domains/user/components/UserCard/
  card.tsx
  title.tsx
  index.ts
```

This allows importing as:
```ts
import { UserCard } from '@/domains/user/components/UserCard'
```

> NOTE: That's the only way where UpperCamelCase folder name is allowed.

## Code style and naming conventions

### Naming 

- Use `SNAKE_CASE` with caps for constants
- Use `UpperCamelCase` for components and translations variables
- Translation variables must be `UpperCamelCase` and ends with `Title` / `Subtitle` / `Text` / `Description` / `Placeholder` / `Label` suffix. (For example: `TicketPageTitle`, `NamePlaceholder`, `AlertDescription`)
- React contexts counts as components, file should be named `<Something>Context.tsx` and contained hooks and provider export (`<Something>Provider` and `use<Something>`)
- Use `lowerCamelCase` for the rest (variables, functions, hooks, etc.)
- Component props type must be named `Props` and placed next to component:
```ts
type MyComponentProps = {}

export const MyComponent: React.FC<MyComponentProps> = ({}) => {
    return null
}
- React context components must contain `Provider` and `use` hook as well
```

### Code style
- Use separate line for importing types:
```ts
import { Something } from './file'
import type { SomeType } from './file'
```
- Use `const` for variables
- Use named inline exports where possible
```ts
export const SOME_VALUE = 3
```
- Prefer using functions over anonymous functions / const functions
- Always use functional components and hooks
- `useIntl` must be the first line of component, translations is right after it 
(translations is always on top when possible (except the cases with dynamic translations using values or dynamic keys))
```ts
export const MyComponent: React.FC<MyComponentProps> = ({}) => {
    const intl = useIntl()
    const SomeTitle = intl.formatMessage({ id: 'common.components.myComponent.title' })
    
    // The rest of code
    
    return null
}

```
- Avoid using relative imports from parent folders (like `../`), only sibling imports are allowed (`./`), for rest use absolute imports `@/`

### GraphQL queries

**Important:** Always refer to the actual Condo schema (via GraphQL Playground at https://condo.d.doma.ai/admin/api or schema files in `apps/condo/domains/*/schema/` locally or in [`GitHub`](https://github.com/open-condo-software/condo)) before writing queries or mutations. Never guess query names, field names, or types.

**File organization:**
- List-related queries and mutations should be stored in files named after the model they operate on (e.g., `domains/ticket/queries/TicketComment.gql`)
- Other queries and mutations should be stored in files named same as mutation / query itself (e.g., `domains/billing/queries/RegisterBillingReceipts.gql`)

**Query design:**
- Always use named queries/mutations instead of anonymous, so all types and hooks are generated correctly by graphql-codegen
- Naming like `get<Somehting>By<Something>` is preferred for queries, mutations can just copy original mutation name
- Use GraphQL variables for dynamic values - you can hard-code static arguments like pagination (`first: 1`,  `skip: 0` or so) directly in the query to reduce complexity with variables
- Avoid using generic arguments when specific ones are clearer (e.g., `query getPropertyByAddressKet($addressKey: String)` is better than `query allProperties($where: PropertyWhereInput)`)
- Fetch only the data you need to minimize rate-limit consumption and make your code more resilient to schema changes - avoid fetching redundant relations (e.g., `createdBy`, `updatedBy` and any other) unless specifically required
- Use fragments when you have multiple queries for the same list to increase Apollo cache hit ratio - define fragments for generic queries and extend them in specific heavy queries
- Use GraphQL aliases to improve TypeScript code readability. Aliases let you rename fields in the response, making your component code cleaner. For example:
  ```graphql
  query getTicketsByOrganization($orgId: ID!) {
      tickets: allTickets(where: { organization: { id: $orgId } }) {
          id
          name
      }
  }
  ```
  This allows accessing data as `data.tickets` instead of `data.allTickets` in your TypeScript code

## i18n

i18n is handled by `react-intl` and `@open-condo/miniapp-utils` packages.

`TranslationHelper` defined in `@/domains/common/utils/i18n` is responsible for locale selection (it select best locale from available by miniapp based on condo launchParams and browser languages).

`react-intl` is used for translations / formatting everything based on selected locale

### Translation keys conventions

Translations are stored in `lang` folder, each locale has its own json file. This json file contains translation keys and texts as values. 
Translation keys are group of `lowerCamelCase` words, separated by dots.

There are 3 groups of keys, separated by prefix:
- Page-specific translations. Used in pages directly, or in components used only in these specific pages.
Their keys should start with page path (like Next.js route, omitting special chars like `[]`) and `page` prefix. Example for `/tickets/[id]/index.ts` page: `page.tickets.id.index.title`
- Component-specific translations. For components used in multiple pages.
Their keys start with domain and component name. Example: `components.common.myComponent.title`
- Global translations. Used in multiple domains, all across app. They should start with `global` prefix. Examples: `global.app.title` or `global.unitName.flat.abbr`

Keys must be sorted in specific way:
1. Global translations
2. Component-specific translations
3. Page-specific translations

Between each group of keys there should be empty line to improve readability. There should also be empty line between each page / component / global group.
Keys inside each group (global / components / pages) should be sorted alphabetically.
All locales must contain the same keys, so total number of rows as well as order is the same across all locales.

Dynamic translations with values should use values as second arg as react-intl requires:
```ts
const SomeTitle = intl.formatMessage({ id: 'components.user.userCard.title'}, { name: 'John' })
```
React-intl also supports pluralization in templates (zero, one, two, few, many, other):
```ts
const SomeTitle = intl.formatMessage({ id: 'components.marketplace.marketplaceCard.total.text'}, { total: 100500 })
```

You should use intl from hook and its methods on top of components, like `formatMessage` or `formatDate`, when possible. If not, prefer using components like `FormattedMessage` or `FormattedNumber`, 
if that's also not possible, then move it in other hooks like `useMemo`

Each translation should end with one of the following suffixes: `placeholder`, `label`, `title`, `text`, `message`, `description`.

Form translations must be prefixed with `<formName>Form` prefix. Example: `pages.ticket.create.form.createTicketForm.title`. `<formName>` can be omitted if page contains single form (just `form` left), but highly recommended to use it for better readability.
Form items must be prefixed with `form.<formName>.items.<itemName>` prefix. Example: `components.user.authForm.items.phone.label`
Form buttons must be prefixed with `form.<formName>.actions.<actionName>` prefix. Example: `components.user.authForm.actions.signIn.label`

Example of form translation structure in JSON:
```json
{
  "components.user.authForm.title": "Sign In",
  "components.user.authForm.items.phone.label": "Phone number",
  "components.user.authForm.items.phone.placeholder": "Enter your phone",
  "components.user.authForm.actions.signIn.label": "Sign In"
}
```

Page action (as well as all actions) must be prefixed with `actions`. Examples: `global.actions.cancel.label` or `pages.meters.id.index.verificationModal.actions.close.label`
As you can see modals inherit similar patterns to forms.

> Note: Long translation keys are acceptable and encouraged, as they help determine usage context and prevent naming conflicts.

> Important note: all parts of translation keys must be in `lowerCamelCase` and separated by dots. But const inside components must be `UpperCamelCase` according to [naming conventions](#code-style-and-naming-conventions).


## Bridge

App uses [`@open-condo/bridge`](https://www.npmjs.com/package/@open-condo/bridge) package for communication with parent condo app (frontend to frontend).
Parent app might be B2B App for managing companies or B2C App for residents, native or web, bridge API is the same for all of them, you can check [documentation](https://developers.doma.ai/docs/bridge/about) to check which methods are supported on platforms
Bridge is primarily used to get launch params (locale / user id / organization or resident id), resize app, perform background authorization and so on...

## Authorization

App uses OIDC code flow with PKCE for authorization. This flow is used, when app cannot store client secret safely or / and its code is exposed in browser.
That's our case, since this app does not have backend. All auth are done automatically by [AuthContext](./domains/user/components/AuthContext.tsx). The flow is following:
1. `authenticatedUser` query is fired to Condo API on app startup to receive current user data using token from `localStorage` (if available)
2. If user is `null` (unauthenticated), token is missing/expired, or its id does not match with launch params user id (in case user changed between sessions), then OIDC flow is performed
3. OIDC flow is performed in background, using [Condo Bridge](#bridge) `RequestAuth` method and `oidc-client-ts` library as helper for generating verifiers and processing code response
4. Received code is exchanged for access token and stored in `localStorage`

> Important NOTE: PKCE flow is configured in the way, where refresh token is not provided, since we do not have backend to store it, and access token has a short lifetime (< 24h).
> The entire app goal is to receive token and perform actions with condo API. Do not store token anywhere else, especially don't send it to any backend. For app with backend use other app templates

## Condo API

Condo API is a GraphQL API that provides access to all Condo platform functionality. 
The source of truth for the API schema is the [GraphQL Playground](https://condo.d.doma.ai/admin/api) where you can introspect the schema, view schemaDocs, and test queries and mutations. 
For additional documentation and guides, refer to the [Condo Developers Portal](https://developers.doma.ai).

### Generic API Rules

**Mutation inputs:**
- All mutations must accept `dv` (data version) and `sender` parameters for audit trail
- Use `getClientSideSenderInfo` from `@open-condo/miniapp-utils/helpers/sender` to generate sender info

**Deletion:**
- Hard-delete is prohibited - never use delete mutations
- Instead, set `deletedAt` to an ISO 8601 timestamp string (e.g., `new Date().toISOString()`)

**List queries pattern:**
For most models (e.g., Ticket), the standard query pattern is:
- `all<ModelName>s` - for listing with filtering (where, orderBy, first, skip)
- `<ModelName>` - for fetching a single record by ID
- `_all<ModelName>sMeta` - for getting counts (with same where filters)
- `create<ModelName>` - for creating a record
- `update<ModelName>` - for updating and soft-deleting a record

**Pagination:**
- API won't return more than 1000 objects per request
- Due to rate limits on Condo API, it's recommended to request no more than 100 objects per page
- Always use `first` and `skip` arguments in `all<ModelName>s` queries for pagination

**Relations:**
- When connecting related records, use `{ connect: { id } }` in relation input
- Example: `{ organization: { connect: { id: orgId } } }`

**Address handling:**
- Always use `addressKey` to link addresses to properties - it's the unique address identifier in Condo
- Do not use `address` field for linking, as the address string can change while `addressKey` remains stable

### Main Domains and Models

#### Organization

Represents property management companies and their structure.

**Key queries/mutations:**
- `Organization` / `allOrganizations` - fetch organization data
- `Employee` / `allEmployees` - manage company employees

**Common patterns:**

Current organization ID is passed in `condoContextEntityId` from launch params.

**Fetch organization by ID:**
```graphql
fragment OrganizationInfo on Organization {
    id
    tin
    name
    country
}

query getOrganizationById($id: ID!) {
    organization: Organization(where: {id: $id}) {
        ...OrganizationInfo
    }
}
```

**Fetch current employee with role:**
```graphql
query getEmployeeByUserAndOrganization($userId: ID!, $organizationId: ID!) {
    allOrganizationEmployees(
        first: 1
        where: { user: {id: $userId}, organization: { id: $organizationId }}
    ) {
        id
        organization {
            ...OrganizationInfo
        }
        role {
            id
            name
            canReadTickets
        }
    }
}
```

Get `userId` from `useAuth()` and `organizationId` from launch params.

Use this domain when you need to work with company structure or employee management.

#### Property

Represents a property (building) divided into separate units (flats, parking spaces, etc.) that can be owned independently.

**Key queries/mutations:**
- `Property` / `allProperties` - fetch property data
- Properties are linked to organizations and have address information via `addressKey`

**Key concepts:**
- Property has a map/schema defining its structure (sections, floors, units)
- Each unit can be independently owned 
- Properties are linked to managing organizations
- Use `addressKey` for stable address references (see [Generic API Rules](#generic-api-rules) above)

Use this when working with property management, unit information, or building structure.

#### Contact

Represents the organization's list of contacts, managed by the organization itself.

**Key queries/mutations:**
- `Contact` / `allContacts` - fetch and manage contact information
- `ContactRole` / `allContactRoles` - manage contact roles

**Key concepts:**
- Contacts serve as the organization's managed list of persons (residents and other contacts)
- Contact fields like `role` and `isVerified` may be resolved to matching residents (by addressKey, unitName, unitType, phone)
- Residents can automatically create contacts when interacting with the managing company (e.g., during ticket creation)
- Contacts are uniquely identified by property, unitName, unitType, and phone combination

Use this when working with contact management, ticket contacts, or resident verification.

#### Resident

Represents a person living at a specific address (addressKey + unitName + unitType).

**Key concepts:**
- Residents can be linked to managing companies automatically or via Service Consumer
- Service Consumer represents a resident's intent to consume services from a specific company using an account number
- Use this when working with resident profiles, contact information, or service relationships

**Key queries/mutations:**
- `Resident` / `allResidents` - fetch resident data
- `ServiceConsumer` / `allServiceConsumers` - manage service relationships

**Key fields:**
- Resident: `addressKey` (unique address identifier), `unitName` (unit within property), `unitType` (flat/parking/commercial), `isVerifiedByManagingCompany` (verification status)
- ServiceConsumer: `organization` (service provider), `accountNumber` (billing account)

#### Ticket

Core domain for managing support tickets and requests.

**Key queries/mutations:**
- `Ticket` / `allTickets` - fetch ticket details and lists
- `TicketComment` / `allTicketComments` - textual comments on tickets
- `TicketFile` / `allTicketFiles` - files attached to tickets
- `TicketCommentFile` / `allTicketCommentFiles` - files attached to ticket comments
- `createTicket` - create new tickets
- `updateTicket` - update ticket status, details, assignments
- `_allTicketsMeta` - get ticket counts with filters

**Key concepts:**
- Resident tickets are automatically classified (category, problem, place classifiers)
- Classifiers can be fetched from the API - their IDs are consistent across all Condo instances
- Use this when working with support tickets, comments, file attachments, or ticket classification

#### Incident

Represents mass incidents affecting multiple properties (e.g., electricity/water outage).

**Key queries/mutations:**
- `Incident` / `allIncidents` - fetch incident details and lists
- Incidents have `workStart`, `workFinish`, `status` (actual/not_actual), and `textForResident` fields

**Key concepts:**
- Used for planned or emergency work affecting entire properties or organization
- Can be marked as emergency or scheduled
- Includes text for residents explaining the situation

Use this when working with mass notifications, utility outages, or property-wide maintenance.

#### Meter

Domain for working with utility meters and readings.

**Key queries/mutations:**
- `Meter` / `allMeters` - fetch meter information (number, accountNumber, unitName, unitType, resource)
- `MeterReading` / `allMeterReadings` - manage meter readings (date, value1-value4 for tariffs, source)
- `MeterResource` / `allMeterResources` - fetch resource types (e.g., cold water, hot water, electricity)
- `createMeterReading` - submit new readings
- `updateMeterReading` - correct existing readings

**Key concepts:**
- MeterResource IDs are consistent across all Condo instances (like ticket classifiers)
- Meters can be single-tariff (value1 only) or multi-tariff (value1-value4)
- Readings have source tracking (mobile_app, billing, call, etc.)

Use this when working with utility meter management, readings submission, or resource tracking.

## App Architecture

This section is used by AI coding agents to store app-specific context, learnings, and other app-specific data accumulated during development. Agents should document:

- **Architecture decisions** - Key design choices and their rationale
- **Domain-specific patterns** - Reusable patterns specific to this app's domains
- **Integration details** - How different parts of the app interact with Condo API and Bridge
- **Performance learnings** - Optimization strategies and performance considerations
- **Known limitations** - Constraints or limitations discovered during development
- **Future improvements** - Ideas for enhancements or refactoring

This context helps maintain consistency across development sessions and provides valuable information for future agents working on this app.