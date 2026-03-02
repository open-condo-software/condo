# @open-condo/messaging

Real-time messaging package for the condo platform. Delivers entity change notifications to browser clients over WebSocket (NATS).

## Channels

Two built-in channel types:

- **`user.<userId>.<entity>`** — personal data for a single user
- **`organization.<orgId>.<entity>`** — entity changes visible to all active employees of an organization

All channels are defined in a single registry (`CHANNEL_DEFINITIONS` in `core/topic.js`). The relay, permission computation, middleware, and access control all consume this registry automatically.

### Adding a new channel

Add one entry to `CHANNEL_DEFINITIONS` in `core/topic.js`:

```javascript
{
    name: 'mychannel',
    extractUserId: (parts) => parts[0] || null,       // for revocation tracking
    buildActualTopic: (parts) => `mychannel.${parts[0]}.${parts[1] || '>'}`,
    buildRelayPermissions: ({ userId }) => [
        `${RELAY_SUBSCRIBE_PREFIX}.mychannel.${userId}.>`,
    ],
    buildAvailableChannel: ({ userId }) => ({
        name: 'mychannel',
        topic: `mychannel.${userId}.>`,
    }),
}
```

No other files need modification — the relay, JWT permissions, `/messaging/channels` endpoint, and access control read from this registry.

## Setup

### Configuration

All messaging settings are provided via a single `MESSAGING_CONFIG` JSON env var:

```env
MESSAGING_CONFIG={"enabled":true,"brokerUrl":"nats://localhost:4222","wsUrl":"ws://localhost:8080","tokenSecret":"<secret>","authAccountSeed":"<nkey-seed>","authUser":"auth","authPassword":"<pass>","serverUser":"server","serverPassword":"<pass>"}
```

| Field | Description | Default |
|---|---|---|
| `enabled` | Enable messaging subsystem | `false` |
| `adapter` | Adapter name | `'nats'` |
| `brokerUrl` | NATS broker URL | — |
| `wsUrl` | WebSocket URL for browser clients (passed to Next.js `publicRuntimeConfig`) | — |
| `tokenSecret` | Secret for signing client JWT tokens | — |
| `tokenTtl` | Client token TTL | `'24h'` |
| `authAccountSeed` | NKey seed for auth callout account | — |
| `authUser` | Auth callout NATS username | — |
| `authPassword` | Auth callout NATS password | — |
| `serverUser` | Server connection NATS username | — |
| `serverPassword` | Server connection NATS password | — |
| `rateLimitMax` | Max requests per rate-limit window | `20` |
| `rateLimitWindowSec` | Rate-limit window in seconds | `60` |

### Server initialization

Call `setupMessaging()` in your app entry point with per-channel access checkers:

```javascript
const { find } = require('@open-condo/keystone/schema')
const { setupMessaging } = require('@open-condo/messaging')

setupMessaging({
    accessCheckers: {
        organization: async (context, userId, organizationId) => {
            const employees = await find('OrganizationEmployee', {
                user: { id: userId },
                organization: { id: organizationId },
                isAccepted: true,
                isRejected: false,
                isBlocked: false,
                deletedAt: null,
            })
            return employees.length > 0
        },
    },
})
```

The `accessCheckers` map defines a per-channel access control function `(context, userId, targetId) => Promise<boolean>`. The `user` channel has built-in access control (own channel only) and does not need a checker.

This connects to NATS, starts the auth callout service, publisher, and subscription relay.

## Publishing messages

### Using `organizationMessaged` plugin (recommended for organization channel)

Publishes entity changes to the organization channel, automatically resolving the organization and its holding organization (via `OrganizationLink`). Uses the same resolution pattern as `addOrganizationFieldPlugin`.

**Model with direct `organization` field** (e.g. Ticket):

```javascript
const { organizationMessaged } = require('@open-condo/messaging')

const Ticket = new GQLListSchema('Ticket', {
    plugins: [organizationMessaged()],
    // ...
})
// publishes to: condo.organization.<orgId>.ticket
// publishes to: condo.organization.<holdingOrgId>.ticket (if holding exists)
```

**Model without `organization` field** (e.g. TicketComment → ticket.organization):

```javascript
const { organizationMessaged } = require('@open-condo/messaging')

const TicketComment = new GQLListSchema('TicketComment', {
    plugins: [organizationMessaged({ fromField: 'ticket' })],
    // ...
})
// resolves organization via getById('Ticket', updatedItem.ticket).organization
```

### Using the `messaged` plugin (generic, for custom channels)

For non-organization channels or custom publishing logic, use the lower-level `messaged` plugin with explicit targets:

```javascript
const { messaged } = require('@open-condo/messaging')

const Notification = new GQLListSchema('Notification', {
    plugins: [messaged({ targets: [{ channel: 'user', field: 'user' }] })],
    // ...
})
// publishes to: condo.user.<userId>.notification
```

Each target specifies a **channel** name and either a direct **field** on the model or an async **resolve** function `({ updatedItem, existingItem, operation, context }) => string|null`.

All plugins publish to `<appPrefix>.<channel>.<targetId>.<entityName>` with payload `{ id, operation }` where operation is `'create'` | `'update'` | `'delete'`. The app prefix is automatically derived from the nearest `package.json` name.

### Manual publishing

```javascript
const { publish } = require('@open-condo/messaging')

await publish({
    topic: 'user.user-123.ticket',
    data: { ... },
})
```

## Frontend hooks

### Subscribing to entity changes

```typescript
import { useMessagingConnection, useMessagingSubscription } from '@open-condo/messaging/hooks'
import { useOrganization } from '@open-condo/next/organization'

const { organization } = useOrganization()
const { connection, isConnected } = useMessagingConnection({
    enabled: !!organization?.id,
})

const { isSubscribed, messageCount } = useMessagingSubscription({
    topic: `organization.${organization.id}.ticket`,
    connection,
    isConnected,
    enabled: isConnected,
    onMessage: (data) => {
        console.log('Entity changed:', data) // { id, operation }
    },
})
```

### Available hooks

| Hook | Purpose |
|---|---|
| `useMessagingConnection` | Manages WebSocket connection to NATS (generic, auto-reconnect, ref-counted) |
| `useMessagingSubscription` | Subscribes to a topic via PUB-gated relay, receives messages on INBOX |
| `useMessagingChannels` | Fetches available channels from `/messaging/channels` |

## Access revocation

When a user is deleted or blocked, revoke their messaging access instantly:

```javascript
const { revokeMessagingUser, unrevokeMessagingUser } = require('@open-condo/messaging')

revokeMessagingUser(userId)       // tears down relays + blocks new connections
unrevokeMessagingUser(userId)     // re-enables access
```

Revocation is propagated cross-process via admin topics (`_MESSAGING.admin.revoke.<userId>`, `_MESSAGING.admin.unrevoke.<userId>`). These topics are restricted to the server connection only — regular clients cannot publish to them.

## Error handling

The middleware (`/messaging/token`, `/messaging/channels`) uses `GQLError` and `expressErrorHandler` for consistent error responses matching the rest of the codebase. Error definitions are in `errors.js`.

Error response format:

```json
{
  "errors": [{
    "name": "GQLError",
    "message": "Authorization is required",
    "extensions": { "code": "UNAUTHENTICATED", "type": "AUTHORIZATION_REQUIRED" }
  }]
}
```

## Package structure

```
packages/messaging/
├── core/
│   ├── Publisher.js         # publish(topic, data)
│   ├── ChannelRegistry.js   # JetStream channel initialization
│   ├── AccessControl.js     # checkAccess, getAvailableChannels
│   └── topic.js             # CHANNEL_DEFINITIONS registry + topic builder helpers
├── adapters/nats/           # NATS adapter, auth callout, subscription relay
├── middleware/               # Express endpoints (/messaging/token, /messaging/channels)
├── errors.js                # GQLError definitions for middleware
├── plugins/
│   ├── messaged.js          # Generic Keystone plugin for auto-publishing to any channel
│   └── organizationMessaged.js  # Organization-specific plugin (auto-resolves org + holding)
├── setup.js                 # setupMessaging, initMessaging, closeMessaging, revoke/unrevoke
├── utils/                   # Re-exports from core/AccessControl (configure, checkAccess, getAvailableChannels)
└── hooks/                   # React hooks (useMessagingConnection, useMessagingSubscription, useMessagingChannels)
```
