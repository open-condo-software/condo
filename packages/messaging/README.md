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

### Environment variables

```env
MESSAGING_ENABLED=true
MESSAGING_BROKER_URL=nats://localhost:4222
MESSAGING_BROKER_WS_URL=ws://localhost:8080
MESSAGING_TOKEN_SECRET=<random-secret>
MESSAGING_SERVER_USER=server
MESSAGING_SERVER_PASSWORD=<password>
MESSAGING_AUTH_ACCOUNT_SEED=<nats-account-nkey-seed>
MESSAGING_AUTH_USER=auth
MESSAGING_AUTH_PASSWORD=<password>
```

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

### Client env

Add to `.env` or Next.js config:

```env
NEXT_PUBLIC_MESSAGING_WS_URL=ws://localhost:8080
```

## Publishing messages

### Using the `messaged` plugin (recommended)

Add the plugin to any Keystone schema to auto-publish changes on create/update/delete.

Each target specifies a **channel** name and either a direct **field** on the model or an async **resolve** function.

**Direct field** (model has the target ID as a field):

```javascript
const { messaged } = require('@open-condo/messaging')

const Ticket = new GQLListSchema('Ticket', {
    plugins: [messaged({ targets: [{ channel: 'organization', field: 'organization' }] })],
    // ...
})
// publishes to: condo.organization.<orgId>.ticket
```

**Relationship resolution** (target ID is on a related model):

```javascript
const { messaged } = require('@open-condo/messaging')
const { getById } = require('@open-condo/keystone/schema')

const TicketComment = new GQLListSchema('TicketComment', {
    plugins: [messaged({ targets: [{ channel: 'organization', resolve: async ({ updatedItem }) => {
        const ticket = await getById('Ticket', updatedItem.ticket)
        return ticket?.organization
    }}] })],
    // ...
})
```

**Multi-target with holding organization** (publish to direct org + holding org):

```javascript
const { messaged } = require('@open-condo/messaging')
const { find } = require('@open-condo/keystone/schema')

const Ticket = new GQLListSchema('Ticket', {
    plugins: [messaged({
        targets: [
            { channel: 'organization', field: 'organization' },
            {
                channel: 'organization',
                resolve: async ({ updatedItem }) => {
                    const orgId = updatedItem.organization
                    if (!orgId) return null
                    const links = await find('OrganizationLink', { to: orgId, deletedAt: null })
                    return links[0]?.from || null
                },
            },
        ],
    })],
    // ...
})
// publishes to: condo.organization.<orgId>.ticket AND condo.organization.<holdingOrgId>.ticket
```

Publishes to `<appPrefix>.<channel>.<targetId>.<entityName>` with payload `{ id, operation }` where operation is `'create'` | `'update'` | `'delete'`. The app prefix is automatically derived from the nearest `package.json` name.

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
├── plugins/messaged.js      # Keystone plugin for auto-publishing
├── setup.js                 # setupMessaging, initMessaging, closeMessaging, revoke/unrevoke
├── utils/                   # Re-exports from core/AccessControl (configure, checkAccess, getAvailableChannels)
└── hooks/                   # React hooks (useMessagingConnection, useMessagingSubscription, useMessagingChannels)
```
