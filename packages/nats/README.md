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
    const { connection, isConnected } = useNatsConnection({ enabled: true })
    
    const { isSubscribed, messageCount } = useNatsSubscription({
        streamName: 'ticket-changes',
        subject: `ticket-changes.${orgId}.>`,
        connection,
        isConnected,
        onMessage: (data, msg) => {
            console.log('Ticket updated:', data)
            msg.ack()
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

Subscribe to stream with typed messages.

**Options:**
- `streamName: string` - Stream name
- `subject: string` - Subject pattern
- `connection: NatsConnection | null` - From useNatsConnection
- `isConnected: boolean` - From useNatsConnection
- `enabled?: boolean` - Enable subscription
- `onMessage?: (data: T, msg: JsMsg) => void | Promise<void>` - Message handler
- `autoAck?: boolean` - Auto-acknowledge (default: true)
- `durableName?: string` - Durable consumer name

**Returns:**
- `isSubscribed: boolean`
- `isSubscribing: boolean`
- `error: Error | null`
- `messageCount: number`

## Access Control

NATS auth callout validates access based on:
1. User JWT token from `/nats/token`
2. Stream-level permissions (read/write)
3. Organization membership and roles

**Example permission check:**
```javascript
access: {
    read: async (context, userId, orgId) => {
        const orgs = await getEmployedOrRelatedOrganizationsByPermissions(
            context,
            userId,
            'canReadTickets'
        )
        return orgs.some(org => org.id === orgId)
    },
}
```

## Environment Variables

```bash
# Server
NATS_URL=nats://localhost:4222
NATS_ENABLED=true
NATS_TOKEN=nats_auth_token
NATS_TOKEN_SECRET=your_secret_key

# Client
NEXT_PUBLIC_NATS_WS_URL=ws://localhost:8080
```

## Testing

NATS middleware and auth tests are in `apps/condo/domains/common/schema/`:
- `natsMiddleware.test.js` - Middleware and endpoint tests
- `natsAuthCallout.test.js` - Authorization tests

Run tests:
```bash
yarn workspace @app/condo test natsMiddleware.test.js
yarn workspace @app/condo test natsAuthCallout.test.js
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Client (Browser)                                           │
│  ┌──────────────────────┐                                   │
│  │ useNatsConnection    │ ← WebSocket → /nats/token        │
│  │ useNatsSubscription  │               /nats/auth         │
│  └──────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
                    ↓ nats.ws (WebSocket)
┌─────────────────────────────────────────────────────────────┐
│  NATS Server (JetStream)                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ticket-      │  │ billing-     │  │ notification-│      │
│  │ changes      │  │ events       │  │ events       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                    ↑ nats (TCP)
┌─────────────────────────────────────────────────────────────┐
│  Server (Node.js)                                           │
│  ┌──────────────────────┐                                   │
│  │ StreamRegistry       │ → Initialize streams             │
│  │ Publisher            │ → Publish messages               │
│  │ NatsMiddleware       │ → /nats/token, /nats/auth        │
│  └──────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
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
├── client.js              # NATS client wrapper
├── publisher.js           # Server-side publisher
├── streams.js             # Stream registry with validation
├── middleware/
│   └── NatsMiddleware.js  # Express middleware
├── utils/
│   ├── natsAuthCallout.js # Authorization logic
│   └── index.js
├── hooks/
│   ├── useNatsConnection.ts    # Client connection hook
│   └── useNatsSubscription.ts  # Client subscription hook
└── index.js               # Main exports
```
