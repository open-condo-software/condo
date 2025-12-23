# AGENTS.md

This is a comprehensive guide for AI coding agents working on the Condo project - an Open Source property management SaaS platform.

## Project Overview

**Condo** is a property management platform that allows users to manage tickets, resident contacts, properties, payment tracking, invoices, and a service marketplace. It offers an extension system for mini-apps and is built as a monorepo with multiple apps and shared packages.

- **Repository:** https://github.com/open-condo-software/condo
- **License:** MIT
- **Architecture:** Monorepo with Yarn workspaces
- **Primary Stack:** KeystoneJS, NextJS, ApolloGraphQL, PostgreSQL, Redis

## Monorepo Structure

### Apps (`/apps/*`)
Independent applications that cannot use code from each other. Each app is a standalone service:
- `condo` - Main Keystone + Next web application (property management)
- `pos-integration` - POS integration service
- `billing-connector` - Billing integration
- `callcenter` - Call center service
- `resident-app` - Resident mobile/web app
- `dev-portal-web` - Developer portal
- And 20+ other specialized apps

### Packages (`/packages/*`)
Internal libraries shared across apps:
- `@open-condo/ui` - **UI Kit** (recommended for all GUI elements)
- `@open-condo/icons` - Icon library
- `@open-condo/*` packages - Core utilities and shared functionality
- `webhooks` - Webhook functionality
- `apollo` - Apollo client utilities
- `billing` - Billing utilities
- And more specialized packages

## Environment Requirements

### Required Software
- **Node.js:** 22.x (LTS) - Use nvm for local development
- **Yarn:** 3.2.2+ (Berry)
- **Python:** 3.x (for database migrations)
- **PostgreSQL:** 16.4+
- **Redis:** 6.2+
- **Docker & Docker Compose** (optional, for databases)

### Python Packages
```bash
pip install Django psycopg2-binary
```

## Setup Commands

### Initial Setup
```bash
# 1. Start databases (optional, using Docker)
docker compose up -d postgresdb redis

# 2. Install Node.js dependencies
yarn install

# 3. Build @open-condo packages (required before running apps)
yarn workspace @app/condo build:deps

# 4. Prepare local environment (creates .env, databases, test users)
node bin/prepare -f condo
```

### Development Commands
```bash
# Start main condo app in dev mode
yarn workspace @app/condo dev

# Start worker (handles async tasks)
yarn workspace @app/condo worker

# Run tests
yarn workspace @app/condo test
yarn workspace @app/condo test User.test.js  # Specific test file

# Build for production
yarn workspace @app/condo build
yarn workspace @app/condo start
```

### Database Migrations
```bash
# Run migrations
yarn workspace @app/condo migrate

# Create new migrations after schema changes
yarn workspace @app/condo makemigrations

# Revert last migration
yarn workspace @app/condo migrate:down

# Unlock migrations table
yarn workspace @app/condo migrate:unlock
```

### Build Commands
```bash
# Build all packages
yarn build:packages

# Build all apps
yarn build:apps

# Build everything
yarn build
```

### Package Management

**Important:** The project maintains the same version of each package across all apps due to the shared `yarn.lock` file. This ensures consistency and prevents version conflicts.

```bash
# Add package to all apps (recommended for external dependencies)
yarn add <package> -W

# Add package to specific app (use only for app-specific dependencies)
yarn workspace @app/<name> add <package>

# Run command in specific workspace
yarn workspace @app/<name> <command>

# Upgrade packages interactively (updates across all apps)
yarn upgrade-interactive --latest
```

## Code Style Guidelines

### JavaScript/TypeScript

**ESLint Configuration** (`.eslintrc.js`):
- **Indentation:** 4 spaces
- **Quotes:** Single quotes for strings, single quotes for JSX attributes
- **Semicolons:** Never use semicolons
- **Object spacing:** Always use spaces inside curly braces: `{ foo }`
- **Trailing commas:** Always for multiline arrays/objects/imports
- **Space before function paren:** Always required
- **Import order:** Enforced with groups (builtin → external → @open-condo → internal → sibling → parent)
- **Newlines between imports:** Always required between groups
- **Alphabetize imports:** Case-insensitive ascending order

**Key Rules:**
```javascript
// ✅ Correct
const foo = { bar: 'baz' }
function example () {
    return 'hello'
}

// ❌ Wrong
const foo = {bar: 'baz'};
function example() {
    return "hello";
}
```

**Import Patterns:**
```javascript
// ✅ Use specific lodash imports
import get from 'lodash/get'

// ❌ Don't use named imports from lodash
import { get } from 'lodash'

// ✅ Correct import order
import fs from 'fs'                          // builtin
import React from 'react'                    // external
import { getById } from '@open-condo/keystone/schema'  // @open-condo
import { MyComponent } from './components'   // internal
```

**Restricted Imports:**
- Don't use `jspdf` - use `pdfmake` instead
- Don't import from `@open-keystone/fields*` or `@open-condo/keystone/fields`

### CSS/LESS

**Stylelint Configuration** (`.stylelintrc.json`):
- Extends `stylelint-config-standard` and `stylelint-config-rational-order`
- Supports LESS syntax via `postcss-less`
- Allows `:global` pseudo-class
- Allows `@tailwind` at-rules
- Allows `fade()` function

### TypeScript

- **TypeScript version:** 5.8.3+
- **Parser:** @typescript-eslint/parser
- **Strict mode:** Recommended
- **JSX:** React JSX transform
- **No explicit any:** Warn level (try to avoid)

## Testing

### Test Structure

**Jest Configuration** (`apps/condo/jest.config.js`):
- **Test runner:** Jasmine2
- **Three test projects:**
  1. **Schema tests** (`*.test.js`) - Keystone schema tests
  2. **Schema specs** (`*.spec.[tj]s`) - Unit tests for schema utilities
  3. **Main tests** - All other tests

**Test File Patterns:**
- `*.test.js` - Schema integration tests (use Keystone test utils)
- `*.spec.js` or `*.spec.ts` - Unit tests (mock dependencies)

### Testing Best Practices

**From project testing patterns:**

1. **Simplicity over complexity** - Simple tests focusing on basic functionality are more reliable
2. **Avoid complex mocking** - Don't mock everything; test actual behavior when possible
3. **Focus on interface** - Test public API and behavior, not implementation details
4. **Module structure testing** - Verify exports, function signatures, return types
5. **Consistent mock objects** - Use `mockReturnValue` instead of `mockImplementation(() => ({ ... }))` for objects
6. **Mock isolation** - Each test should set up its own mocks and expectations
7. **Don't mock condo client** - Use real models where possible (follow patterns from existing tests)
8. **Faker usage** - Use `faker.datatype.uuid()` for UUID generation (not `faker.string.uuid()`)

**Test Modes:**
```bash
# Real client mode (HTTP requests to remote server)
yarn workspace @app/condo test

# Fake client mode (for debugging, single process)
TESTS_FAKE_CLIENT_MODE=true yarn workspace @app/condo test
```

**Debug Database Queries:**
```bash
DEBUG=knex:query,knex:tx yarn workspace @app/condo dev
```

### Common Testing Patterns

**Mock Keystone Context:**
```javascript
const mockSudoContext = { /* ... */ }
const mockKeystoneContext = {
    sudo: jest.fn().mockReturnValue(mockSudoContext),
}
// Use mockSudoContext in expectations, not mockKeystoneContext.sudo()
```

**Mock Class Instances:**
```javascript
// ✅ Use consistent mock objects
const mockClient = { auth: jest.fn() }
MyClass.mockImplementation(() => mockClient)
expect(result).toBe(mockClient)

// ❌ Don't use toBeInstanceOf with mocked classes
expect(result).toBeInstanceOf(MyClass)  // Fails with mocks
```

## Linting & Code Quality

### Linting Commands
```bash
# Lint everything (runs on CI)
yarn lint

# Lint code only
yarn lint:code
yarn lint:code:fix  # Auto-fix issues

# Lint styles
yarn lint:styles

# Lint translations
yarn lint:translations

# Lint dependencies
yarn lint:deps
```

### Static Analysis

**Run Semgrep SAST analysis:**
```bash
# Run analysis (runs on CI)
yarn analysis

# Analyze specific directory
yarn analysis -d apps/condo
```

**Install Semgrep:**
```bash
brew install semgrep
# or
python3 -m pip install semgrep
```

**Semgrep Rules:** The project uses multiple security rulesets including `p/default`, `p/security-audit`, `p/owasp-top-ten`, `p/secrets`, `p/sql-injection`, and others.

### Semgrep Exclusions

When Semgrep flags code that is intentionally safe but triggers a rule, use `// nosemgrep:` comments to suppress false positives. **Always include a comment explaining why the code is safe.**

**Format:**
```javascript
// [Explanation why this is safe]
// nosemgrep: rule-id
const result = potentiallyFlaggedCode()
```

**Common use cases:**

**1. Path traversal in template/config paths:**
```javascript
// templatePath is a configured template path - not a user input
// all results of export file generation will be accessible only for authorized end users
// nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
const fileContent = await render(path.resolve(templatePath), replaces)
```

**2. HTTP server in tests:**
```javascript
// tests express for a fake gql client
// nosemgrep: problem-based-packs.insecure-transport.js-node.using-http-server.using-http-server
__expressServer = http.createServer(__expressApp).listen(0)
```

**3. Disabled TLS in test environment:**
```javascript
// test apollo client with disabled tls
// nosemgrep: problem-based-packs.insecure-transport.js-node.bypass-tls-verification.bypass-tls-verification
const httpsAgentWithUnauthorizedTls = new https.Agent({ rejectUnauthorized: false })
```

**4. Dynamic RegExp from controlled input:**
```javascript
// Not a ReDoS case. We generate a specific RE from controlled input
// nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
return new RegExp((sol ? '^' : '') + regexString + (eol ? '$' : ''))
```

**5. Unsafe format string in logging:**
```javascript
// Safe logging in test environment with controlled input
// nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
console.error(`[catchError !!!]${testName}:`, thrownError)
```

**Best practices:**
- **Always explain why** the flagged code is safe before the `nosemgrep` comment
- Use the **full rule ID** from Semgrep output
- Only suppress **false positives** - never ignore real security issues
- Keep explanations **concise but clear**
- Review suppressions during code review

**Finding rule IDs:**
Run Semgrep to see the rule ID in the output:
```bash
yarn analysis
# Output will show: rule-id: javascript.lang.security.audit.path-traversal...
```

## Commit Message Convention

**Format:** `<type>(<scope>): <subject>`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `hotfix` - Urgent production fix
- `refactor` - Code refactoring
- `test` - Adding/updating tests
- `docs` - Documentation changes
- `style` - Code style changes
- `perf` - Performance improvements
- `build` - Build system changes
- `ci` - CI configuration changes
- `chore` - Other changes
- `revert` - Revert previous commit

**Scopes:**
- `global` - Affects entire project
- `deps` - Dependency changes
- App names: `condo`, `pos-integration`, `billing-connector`, etc.
- Package names: `webhooks`, `apollo`, `billing`, etc.

**Subject Rules:**
- Must start with task number: `DOMA-1234` or `INFRA-1234` (except for `hotfix` type)
- Must contain at least 2 words after task number
- Max header length: 52 characters
- Max body line length: 72 characters
- Use lowercase (not sentence-case, start-case, pascal-case, or upper-case)

**Examples:**
```bash
feat(condo): DOMA-1234 add payment integration
fix(pos-integration): DOMA-5678 fix receipt generation error
hotfix(global): fix critical security vulnerability
```

## UI Kit (`@open-condo/ui`)

**The `@open-condo/ui` package is the recommended way to add GUI elements to pages.** It provides a comprehensive set of React UI components designed specifically for the condo ecosystem.

### Installation & Setup

The UI kit is already included in the monorepo. To use it in your app:

```typescript
// Import components
import { Button, Space, Typography, Modal, Table } from '@open-condo/ui'
import type { ButtonProps, TableProps } from '@open-condo/ui'

// Import styles (in root component)
import '@open-condo/ui/dist/styles.min.css'

// Import icons
import { MoreVertical, Plus, Edit } from '@open-condo/icons'

// Import colors
import { colors } from '@open-condo/ui/colors'
import type { ColorPalette } from '@open-condo/ui/colors'

// Import hooks
import { useBreakpoints, useContainerSize } from '@open-condo/ui/hooks'
```

### Finding Available Components

To discover available components and their APIs:

1. **Check the main export file:** `/packages/ui/src/index.ts` - Lists all exported components with their types
2. **Browse component directories:** `/packages/ui/src/components/` - Each component has its own folder
3. **View Storybook examples:** `/packages/ui/src/stories/*.stories.tsx` - Interactive examples with usage patterns
4. **Search the codebase:** Use grep to find real-world usage: `grep -r "from '@open-condo/ui'" apps/condo/`
5. **Check the package README:** `/packages/ui/README.md` - Installation and basic usage guide

Common component categories include: Layout, Forms & Inputs, Data Display, Feedback, Typography, Navigation, and Utilities.

### Usage Examples

**Basic Button and Space:**
```typescript
import { Button, Space } from '@open-condo/ui'
import { Plus } from '@open-condo/icons'

<Space size={16}>
    <Button type='primary' icon={<Plus />}>
        Add New
    </Button>
    <Button type='secondary'>
        Cancel
    </Button>
</Space>
```

**Typography:**
```typescript
import { Typography, Space } from '@open-condo/ui'

<Space direction='vertical' size={8}>
    <Typography.Title level={1}>Page Title</Typography.Title>
    <Typography.Text type='secondary'>Description text</Typography.Text>
</Space>
```

**Table with Data:**
```typescript
import { Table } from '@open-condo/ui'
import type { TableColumn } from '@open-condo/ui'

const columns: TableColumn[] = [
    { key: 'name', title: 'Name', dataIndex: 'name' },
    { key: 'status', title: 'Status', dataIndex: 'status' },
]

<Table
    columns={columns}
    dataSource={data}
    loading={loading}
    pagination={{ pageSize: 20 }}
/>
```

**Modal:**
```typescript
import { Modal, Button } from '@open-condo/ui'

const [isOpen, setIsOpen] = useState(false)

<>
    <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
    <Modal
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        title='Modal Title'
    >
        Modal content
    </Modal>
</>
```

### Hooks

**`useBreakpoints`** - Responsive breakpoint detection:
```typescript
import { useBreakpoints } from '@open-condo/ui/hooks'

const breakpoints = useBreakpoints()
const isMobile = !breakpoints.TABLET_SMALL
const isTablet = breakpoints.TABLET_SMALL && !breakpoints.DESKTOP_SMALL
const isDesktop = breakpoints.DESKTOP_SMALL
```

Breakpoints:
- `MOBILE_SMALL` (0px)
- `MOBILE_LARGE` (360px)
- `TABLET_SMALL` (480px)
- `TABLET_LARGE` (768px)
- `DESKTOP_SMALL` (992px)
- `DESKTOP_LARGE` (1200px)

**`useContainerSize`** - Container dimensions:
```typescript
import { useContainerSize } from '@open-condo/ui/hooks'

const [{ width, height }, setRef] = useContainerSize()

return <div ref={setRef}>Width: {width}px</div>
```

### Colors

**Access theme colors in JavaScript/TypeScript:**

```typescript
import { colors } from '@open-condo/ui/colors'
import type { ColorPalette } from '@open-condo/ui/colors'

// Use colors in your components
const myStyle = {
    backgroundColor: colors.white,
    color: colors.gray[7],
    borderColor: colors.blue[5],
}

// Common color palettes available:
// - colors.white, colors.black
// - colors.gray[1-10] - Grayscale palette
// - colors.blue[1-10] - Blue palette
// - colors.green[1-10] - Green palette
// - colors.red[1-10] - Red palette
// - colors.orange[1-10] - Orange palette
// - colors.purple[1-10] - Purple palette
```

**Real-world example:**
```typescript
import { colors } from '@open-condo/ui/colors'

// Using colors in styled components
const StyledDiv = styled.div`
    background-color: ${colors.gray[1]};
    color: ${colors.gray[9]};
    
    &:hover {
        background-color: ${colors.blue[1]};
    }
`

// Using colors inline
<Typography.Text style={{ color: colors.gray[7] }}>
    Secondary text
</Typography.Text>
```

**Access colors in LESS/CSS:**

```less
// Import LESS variables
@import (reference) "@open-condo/ui/src/tokens/variables.less";

.my-component {
    background-color: @condo-global-color-white;
    color: @condo-global-color-gray-7;
    border: 1px solid @condo-global-color-blue-5;
}
```

**Finding available colors:**
- Check `/packages/ui/src/colors/index.ts` for color exports
- Browse component styles: `/packages/ui/src/components/*/style.less` for LESS variable usage
- Search codebase: `grep -r "colors.*from.*@open-condo/ui" apps/condo/`

### Style Variables

Import CSS or LESS variables for consistent theming:

```typescript
// CSS Variables
import '@open-condo/ui/style-vars/css'
```

```less
// LESS Variables
@import (reference) "@open-condo/ui/style-vars/less";
```

### Finding Usage Examples

Look for real-world usage patterns in the codebase:
- Search for imports: `grep -r "from '@open-condo/ui'" apps/condo/`
- Component examples: `/apps/condo/domains/*/components/*.tsx`
- Page-level usage: `/apps/condo/pages/**/*.tsx`
- Storybook examples: `/packages/ui/src/stories/*.stories.tsx`

### Best Practices

1. **Always use `@open-condo/ui` components** instead of creating custom UI elements
2. **Import icons from `@open-condo/icons`** for consistency
3. **Use `Space` component** for layout spacing instead of custom margins
4. **Use `Typography` components** for all text rendering
5. **Follow existing patterns** - search codebase for similar components before implementing
6. **Import types** alongside components for TypeScript support
7. **Use hooks** for responsive design and container sizing
8. **Use CSS Modules for component styling** - Place only minimal styles that cannot be achieved with UI kit components

### Component Styling

**Recommended approach:** Use CSS Modules for custom component styles, but keep styles minimal. Only add styles that cannot be achieved using `@open-condo/ui` components.

```typescript
// MyComponent.module.css
.container {
    /* Only add styles not available in UI kit */
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.customElement {
    /* Minimal custom styling */
    transform: rotate(45deg);
}
```

```typescript
// MyComponent.tsx
import { Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import styles from './MyComponent.module.css'

export const MyComponent = () => {
    return (
        <div className={styles.container}>
            {/* Use UI kit components for standard elements */}
            <Typography.Title level={2}>Title</Typography.Title>
            <Space direction='vertical'>
                {/* Custom styled element only when necessary */}
                <div className={styles.customElement}>
                    Custom content
                </div>
            </Space>
        </div>
    )
}
```

**Key principles:**
- Prefer UI kit components over custom CSS
- Use CSS Modules (`.module.css`) for scoped styles
- Keep custom styles minimal and focused
- Use UI kit colors, spacing, and typography tokens when possible
- Only create custom styles for unique layout or visual requirements not covered by the UI kit

## Architecture & Patterns

### Database
- **Primary:** PostgreSQL 16.4+ (with replication support)
- **Session/Cache:** Redis 6.2+
- **File Storage:** S3 (optional)
- **Migration Tool:** kmigrator (Django-based)

### Key Technologies
- **Backend:** KeystoneJS 5 (GraphQL API)
- **Frontend:** Next.js (React framework)
- **UI Components:** @open-condo/ui (custom UI kit)
- **Icons:** @open-condo/icons
- **GraphQL Client:** Apollo Client
- **Task Queue:** Bull (Redis-based)
- **Testing:** Jest with Jasmine2
- **Build Tool:** Turbo (monorepo orchestration)
- **Containerization:** Docker

### Application Structure
- Each app has its own database
- Apps communicate via GraphQL APIs
- Shared code lives in `/packages`
- Environment variables in `.env` files (generated by `bin/prepare`)
- Migrations managed per-app

## Development Workflow

### Starting a New Feature
1. Create feature branch
2. Make schema changes if needed
3. Run `yarn workspace @app/<name> makemigrations`
4. Implement feature
5. Write tests (`.spec.js` for units, `.test.js` for schema)
6. Run linting: `yarn lint:code:fix`
7. Run tests: `yarn workspace @app/<name> test`
8. Commit with proper format: `feat(scope): DOMA-1234 description`

### Debugging
1. Use `TESTS_FAKE_CLIENT_MODE=true` for easier debugging
2. Enable database query logging: `DEBUG=knex:query,knex:tx`
3. Use IDE debugger with breakpoints
4. Check logs in worker process for async tasks

### Common Pitfalls
- **Don't forget to build packages** before running apps: `yarn workspace @app/condo build:deps`
- **Run prepare script** for new apps: `node bin/prepare -f <app-name>`
- **Migrations must be created** after schema changes
- **Worker must be running** for async tasks (notifications, imports, exports)
- **Use correct faker methods** - `faker.datatype.uuid()` not `faker.string.uuid()`
- **Import order matters** - ESLint will enforce proper grouping

## Security Considerations

- Never commit `.env` files (use `.env.example` as template)
- API keys and secrets go in environment variables
- Semgrep SAST analysis runs on CI
- Database credentials in docker-compose are for local dev only
- Use `scram-sha-256` authentication for PostgreSQL

## Performance Tips

- PostgreSQL configured with `max_connections=2000`, `shared_buffers=256MB`
- Use Redis for caching and session storage
- Worker handles async tasks to avoid blocking main app
- Turbo caching speeds up builds
- Use `--concurrency=100%` for parallel builds

## Useful Resources

- **Main docs:** `/docs/develop.md`, `/docs/contributing.md`, `/docs/deploy.md`
- **Migration guide:** `/docs/migration.md`
- **Database upgrade guide:** `/docs/db-upgrade.md`
- **Keystone docs:** https://github.com/keystonejs/keystone-5
- **Next.js docs:** https://nextjs.org
- **Apollo docs:** https://www.apollographql.com

## Default Ports

**Application Ports:** Ports for apps are automatically assigned during `bin/prepare.js` execution:
- Keystone apps: `4000 + app_order` (e.g., condo is typically `4006`)
- Next.js apps: `3000` (default Next.js port)
- Other apps: `4000 + app_order`
- Ports are configurable in each app's `.env` file after assignment

**Database & Cache Ports:**
- PostgreSQL master: `5432`
- PostgreSQL replica: `5433`
- Redis: `6379`
- Valkey cluster: `7001`, `7002`, `7003`

## Quick Reference

```bash
# Full setup from scratch
docker compose up -d postgresdb redis
yarn install
yarn workspace @app/condo build:deps
node bin/prepare -f condo
yarn workspace @app/condo dev

# Run tests
yarn workspace @app/condo test

# Create new app
yarn createapp

# Lint and fix
yarn lint:code:fix

# Build everything
yarn build
```

## Admin Access (Local Development)

After running `node bin/prepare -f condo`:
- URL: http://localhost:4006/admin/signin
- Email: Value of `DEFAULT_TEST_ADMIN_IDENTITY` in `apps/condo/.env`
- Password: Value of `DEFAULT_TEST_ADMIN_SECRET` in `apps/condo/.env`
