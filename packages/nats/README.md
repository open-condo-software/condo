# @open-condo/nats

NATS JetStream integration for real-time messaging in Condo platform.

## Overview

This package provides:
- **Server-side:** Stream registry, publisher, authentication middleware
- **Client-side:** React hooks for connection and subscription management
- **Validation:** Stream naming conventions with Zod schemas

## Quick Start

### Server: Register and Publish

```javascript
const { streamRegistry, publish } = require('@open-condo/nats')

// Register stream
streamRegistry.register('ticket-changes', {
    ttl: 3600,
    subjects: ['ticket-changes.{organizationId}.{ticketId}'],
    description: 'Ticket entity changes',
    access: { read: 'canManageTickets' },
})

// Publish message
await publish({
    stream: 'ticket-changes',
    subject: `ticket-changes.${orgId}.${ticketId}`,
    data: { operation: 'update', ticketId, status: 'completed' },
})
```

### Client: Subscribe to Changes

```typescript
import { useNatsConnection, useNatsSubscription } from '@open-condo/nats/hooks'

const MyComponent = () => {
    const { connection, isConnected, allowedStreams } = useNatsConnection({ enabled: true })
    
    const { isSubscribed, messageCount } = useNatsSubscription({
        streamName: 'ticket-changes',
        subject: `ticket-changes.${orgId}.>`,
        connection,
        isConnected,
        allowedStreams,
        organizationId: orgId,
        onMessage: (data) => {
            console.log('Ticket updated:', data)
        },
    })
    
    return <div>Messages: {messageCount}</div>
}
```

## Stream Naming Conventions

All stream names must follow these rules (enforced via Zod):

### Format
- **Pattern:** `{domain}-{suffix}`
- **Case:** lowercase kebab-case
- **Length:** 3-50 characters
- **Required suffixes:**
  - `-changes` - Entity CRUD operations
  - `-events` - Business domain events
  - `-notifications` - User/system notifications

### Examples

```
✅ ticket-changes          # Valid
✅ billing-events          # Valid
✅ user-notifications      # Valid

❌ ticketChanges           # Wrong case
❌ ticket-updates          # Invalid suffix
❌ tc                      # Too short
```

### Subject Patterns

```
✅ ticket-changes.>                           # All tickets
✅ ticket-changes.{organizationId}.>          # Organization tickets
✅ ticket-changes.{organizationId}.{ticketId} # Specific ticket

❌ other-stream.>                             # Must start with stream name
❌ ticket-changes.*.>.create                  # > must be last
```

## API Reference

### Server-Side

#### `streamRegistry.register(name, config)`

Register a NATS stream with validation.

**Parameters:**
- `name: string` - Stream name (must follow naming conventions)
- `config: StreamConfig`
  - `ttl?: number` - Message TTL in seconds
  - `subjects: string[]` - Subject patterns
  - `description?: string` - Stream description
  - `access?: { read?: string | AccessFn, write?: string | AccessFn }` - Access control
  - `storage?: 'file' | 'memory'` - Storage type
  - `retention?: 'limits' | 'interest' | 'workqueue'` - Retention policy

**Example:**
```javascript
streamRegistry.register('property-changes', {
    ttl: 86400,
    subjects: ['property-changes.{organizationId}.>'],
    access: {
        read: async (context, userId, orgId) => {
            // Custom access logic
            return hasPermission(userId, orgId, 'canReadProperties')
        },
    },
})
```

#### `publish({ stream, subject, data })`

Publish message to stream.

**Parameters:**
- `stream: string` - Stream name
- `subject: string` - Full subject (must match registered subjects)
- `data: object` - Message payload (auto-serialized to JSON)

#### `initializeNatsPublisher(config)`

Initialize NATS publisher (called automatically in app startup).

### Client-Side Hooks

#### `useNatsConnection(options)`

Manage global NATS WebSocket connection.

**Options:**
- `enabled?: boolean` - Enable connection (default: true)
- `autoConnect?: boolean` - Auto-connect on mount (default: true)

**Returns:**
- `connection: NatsConnection | null`
- `isConnected: boolean`
- `isConnecting: boolean`
- `error: Error | null`

#### `useNatsSubscription<T>(options)`

Subscribe to stream via PUB-gated relay with typed messages.

**Options:**
- `streamName: string` - Stream name
- `subject: string` - Subject pattern
- `connection: NatsConnection | null` - From useNatsConnection
- `isConnected: boolean` - From useNatsConnection
- `allowedStreams?: string[]` - Client-side validation (defense-in-depth)
- `organizationId?: string` - Organization ID for relay scoping
- `enabled?: boolean` - Enable subscription
- `onMessage?: (data: T, msg: Msg) => void | Promise<void>` - Message handler

**Returns:**
- `isSubscribed: boolean`
- `isSubscribing: boolean`
- `error: Error | null`
- `messageCount: number`

## Access Control

Access control is enforced at three levels:

### 1. Application-level (stream registration)
Each stream declares its `access.read` config — a boolean, permission string, or async function:
```javascript
streamRegistry.register('ticket-changes', {
    access: {
        read: async ({ authentication, context, organizationId, subject }) => {
            const { item: user } = authentication
            const orgs = await getPermittedOrganizations(context, user, ['canReadTickets'])
            return orgs.includes(organizationId)
        },
    },
})
```

### 2. NATS-level (PUB-gated relay)
When a client connects to NATS via WebSocket, the **AuthCalloutService** intercepts the connection:
1. Validates the JWT token issued by `/nats/token`
2. Extracts `allowedStreams` and `organizationId` from the token
3. Creates a signed NATS user JWT with org-scoped PUB permissions
4. NATS enforces PUB permissions for the lifetime of the connection

Clients use PUB to `_NATS.subscribe.{stream}.{organizationId}` to request a server-side relay.
NATS enforces that the client can only publish to their own org's relay subject.

> **Security note:** NATS does not enforce SUB permissions in auth_callout non-operator mode.
> PUB permissions ARE enforced. The relay architecture uses PUB as the access control mechanism.

### 3. Server-side relay (SubscriptionRelayService)
The **SubscriptionRelayService** runs server-side and handles relay requests:
1. Receives `_NATS.subscribe.{stream}.{orgId}` from client (PUB-gated)
2. Subscribes to `{stream}.{orgId}.>` with full server permissions
3. Forwards matching messages to the client's unique delivery INBOX
4. Client receives messages via `_INBOX.>` (always allowed)

### 4. Client-side (defense-in-depth)
The `useNatsSubscription` hook validates `allowedStreams` before requesting a relay.

## Setup

### 1. Generate NKey pair
```bash
yarn workspace @open-condo/nats generate-nats-keys
```

### 2. Add to `.env`
```bash
NATS_URL=nats://localhost:4222
NATS_ENABLED=true
NATS_TOKEN_SECRET=your_secret_key
NATS_AUTH_ACCOUNT_SEED=SA...   # from step 1
NATS_AUTH_ISSUER=A...          # from step 1
NATS_AUTH_USER=auth-service
NATS_AUTH_PASSWORD=auth-secret
NATS_SERVER_USER=condo-server
NATS_SERVER_PASSWORD=server-secret
NEXT_PUBLIC_NATS_WS_URL=ws://localhost:8080
```

### 3. Start NATS (docker-compose)
Pass `NATS_AUTH_ISSUER`, `NATS_AUTH_PASSWORD`, `NATS_SERVER_PASSWORD` to the NATS container (already configured in `docker-compose.yml`).

```bash
docker compose --profile dbs up -d
```

### 4. Start condo
The `initNats()` function in `apps/condo/initNats.js` starts:
- **AuthCalloutService** — connects to NATS as `auth-service`, handles `$SYS.REQ.USER.AUTH`
- **Publisher** — connects as `condo-server`, initializes streams, publishes events
- **SubscriptionRelayService** — connects as `condo-server`, relays messages to client INBOXes

## Testing

Tests are in `apps/condo/domains/common/schema/`:
- `natsJwt.spec.js` — NATS JWT encoding/signing unit tests
- `natsAuthCalloutService.spec.js` — Auth callout service logic unit tests
- `natsAccessControl.spec.js` — Access control permission model unit tests
- `natsAccessControlIntegration.spec.js` — PUB-gated relay integration tests (requires NATS)

```bash
# Unit tests (no server needed)
npx jest --config apps/condo/jest.config.js --testPathPattern='natsJwt.spec|natsAuthCalloutService.spec|natsAccessControl\.spec' --no-coverage

# Integration tests (requires running NATS: docker compose --profile dbs up -d)
NATS_INTEGRATION=true npx jest --config apps/condo/jest.config.js --testPathPattern='natsAccessControlIntegration' --no-coverage --forceExit
```

## Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│  Client (Browser)                                                 │
│  ┌──────────────────────────┐  1. GET /nats/token                │
│  │ useNatsConnection        │────→ Gets JWT with allowedStreams   │
│  │ useNatsSubscription      │  2. Connect to NATS WS with token  │
│  └──────────────────────────┘  3. PUB _NATS.subscribe.{s}.{org}  │
│         ↑ receives messages      (PUB enforced by NATS)          │
│         via unique _INBOX     4. Receive relay on _INBOX.{id}    │
└───────────────────────────────────────────────────────────────────┘
                    ↓ nats.ws (WebSocket, port 8080)
┌───────────────────────────────────────────────────────────────────┐
│  NATS Server (JetStream + Auth Callout)                           │
│                                                                   │
│  On client connect → publishes to $SYS.REQ.USER.AUTH             │
│  ← AuthCalloutService validates token, returns user JWT          │
│  → NATS enforces PUB permissions (org-scoped relay subjects)     │
│                                                                   │
│  Streams: ticket-changes | billing-events | notification-...     │
└───────────────────────────────────────────────────────────────────┘
                    ↑ nats (TCP, port 4222)
┌───────────────────────────────────────────────────────────────────┐
│  Condo Server (Node.js)                                           │
│  ┌────────────────────┐  ┌────────────────────────────────────┐  │
│  │ AuthCalloutService │  │ Publisher (condo-server user)       │  │
│  │ (auth-service user)│  │ → Initialize streams               │  │
│  │ → $SYS.REQ.USER.  │  │ → Publish events on changes        │  │
│  │   AUTH handler     │  └────────────────────────────────────┘  │
│  └────────────────────┘  ┌────────────────────────────────────┐  │
│                          │ SubscriptionRelayService            │  │
│                          │ → Listens on _NATS.subscribe.>     │  │
│                          │ → Subscribes to stream.org.> for   │  │
│                          │   each client relay request         │  │
│                          │ → Forwards messages to client INBOX │  │
│                          └────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ NatsMiddleware (Express)                                 │    │
│  │ → GET /nats/token  (issue JWT with allowed streams)      │    │
│  │ → GET /nats/streams (list available streams)             │    │
│  └──────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────┘
```

## Best Practices

1. **Stream Naming:** Always use compliant names (`-changes`, `-events`, `-notifications`)
2. **Subject Hierarchy:** Structure subjects hierarchically: `stream.org.entity.action`
3. **Error Handling:** Use `msg.nak()` for retryable errors, `msg.term()` for terminal failures
4. **Performance:** Keep message handlers fast, use `msg.inProgress()` for long tasks
5. **Security:** Never expose sensitive data in subjects, rely on access control
6. **Testing:** Mock hooks in tests, use real streams only for integration tests

## Package Structure

```
packages/nats/
├── authCalloutService.js       # NATS auth callout service (NKey-based)
├── subscriptionRelayService.js # Server-side PUB-gated message relay
├── client.js                   # NATS client wrapper (user/pass + token auth)
├── publisher.js                # Server-side publisher
├── streams.js                  # Stream registry with validation
├── middleware/
│   └── NatsMiddleware.js       # Express middleware (/nats/token, /nats/streams)
├── utils/
│   ├── natsAuthCallout.js      # Authorization logic (access checks)
│   ├── natsJwt.js              # NATS JWT encoding/signing (ed25519-nkey)
│   ├── subjectMatch.js         # NATS subject matching for testing
│   └── index.js
├── hooks/
│   ├── useNatsConnection.ts    # Client connection hook
│   ├── useNatsSubscription.ts  # Client subscription hook (relay-based)
│   └── useNatsStreams.ts       # Client streams discovery hook
└── index.js                    # Main exports
```
