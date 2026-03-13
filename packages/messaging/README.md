# @open-condo/messaging

Real-time messaging package for the condo platform. Delivers entity change notifications to browser clients over WebSocket (NATS).

## Channels

Two built-in channel types:

- **`<app>.user.<userId>.<entity>`** — personal data for a single user (e.g. `condo.user.abc-123.notification`)
- **`<app>.organization.<orgId>.<entity>`** — entity changes visible to all active employees of an organization (e.g. `condo.organization.org-1.ticket`)

All channels are defined in a single registry (`CHANNEL_DEFINITIONS` in `core/topic.js`). The relay, permission computation, middleware, and access control all consume this registry automatically.

### Adding a new channel

Add one entry to `CHANNEL_DEFINITIONS` in `core/topic.js`:

```javascript
{
    name: 'mychannel',
    isAvailable: ({ userId }) => !!userId,
    buildRelayPermissions: ({ userId }) => [
        `${RELAY_SUBSCRIBE_PREFIX}.${userId}.${APP_PREFIX}.mychannel.${userId}.>`,
    ],
    buildAvailableChannel: ({ userId }) => ({
        name: 'mychannel',
        topicPrefix: `${APP_PREFIX}.mychannel.${userId}`,
    }),
}
```

The relay subscribe topic mirrors the actual NATS topic: `_MESSAGING.subscribe.<userId>.<actualTopic>`. The relay handler extracts `actualTopic` directly from the subject — no channel-specific topic building is needed.

`topicPrefix` is a concrete NATS subject prefix (no wildcards). Consumers must append an entity name to construct a subscribable topic:

```javascript
const topic = `${channel.topicPrefix}.ticket`  // e.g. condo.organization.org-1.ticket
```

Do **not** pass `topicPrefix` directly to `useMessagingSubscription` — the hook validates that topics contain no NATS wildcards (`>`, `*`).

No other files need modification — the relay, JWT permissions, `/messaging/channels` endpoint, and access control read from this registry.

## Setup

### Configuration

All messaging settings are provided via a single `MESSAGING_CONFIG` JSON env var:

```env
MESSAGING_CONFIG={"enabled":true,"brokerUrl":"nats://localhost:4222","wsUrl":"ws://localhost:8080","tokenSecret":"<secret>","authAccountSeed":"<nkey-seed>","authIssuer":"<nkey-public-key>","authUser":"auth","authPassword":"<pass>","serverUser":"server","serverPassword":"<pass>"}
```

| Field | Description | Default |
|---|---|---|
| `enabled` | Enable messaging subsystem | `false` |
| `adapter` | Adapter name | `'nats'` |
| `brokerUrl` | NATS broker URL | — |
| `brokerToken` | NATS auth token (alternative to user/pass for server connection) | — |
| `wsUrl` | WebSocket URL for browser clients (passed to Next.js `publicRuntimeConfig`) | — |
| `tokenSecret` | Secret for signing client JWT tokens | — |
| `tokenTtl` | Client token TTL | `'24h'` |
| `authAccountSeed` | NKey seed for auth callout account (private seed) | — |
| `authIssuer` | NKey public key for auth callout issuer (used by `nats.conf` via `nats-entrypoint.sh`) | — |
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
const { connection, isConnected, userId } = useMessagingConnection({
    enabled: !!organization?.id,
})

const { isSubscribed, messageCount } = useMessagingSubscription({
    topic: `organization.${organization.id}.ticket`,
    connection,
    isConnected,
    userId,
    enabled: isConnected,
    onMessage: (data) => {
        // data: { id, operation }
        refetchTickets()
    },
})
```

### Available hooks

| Hook | Purpose |
|---|---|
| `useMessagingConnection` | Manages WebSocket connection to NATS (auto-reconnect, ref-counted). Returns `connection`, `isConnected`, `userId` |
| `useMessagingSubscription` | Subscribes to a topic via PUB-gated relay, receives messages on INBOX. Accepts `userId` for user-scoped unsubscribe |
| `useMessagingChannels` | Fetches available channels from `/messaging/channels` |

## Security

### PUB/SUB permission model

Clients are granted only the minimum permissions needed:

- **PUB** — relay subscribe topics (`_MESSAGING.subscribe.<userId>.<app>.<channel>.<id>.>`), relay unsubscribe topic (`_MESSAGING.unsubscribe.<userId>.*`)
- **SUB** — `_INBOX.>` only (for receiving relayed messages and request/reply responses)

Clients do **not** have PUB permission on `_INBOX.>`. NATS `request()` embeds reply-to in the PUB header — the server publishes the response, not the client. This prevents authenticated clients from injecting messages into other users' delivery inboxes.

### Relay input validation

- **deliverInbox** — relay subscribe requests must provide an inbox starting with `_INBOX.`; arbitrary subjects are rejected
- **Topic format validation** — the relay verifies that the `actualTopic` starts with the expected `APP_PREFIX` before subscribing, preventing subscription to arbitrary NATS subjects even if PUB permissions are misconfigured
- **Unsubscribe scoping** — unsubscribe PUB permission is scoped to `_MESSAGING.unsubscribe.<userId>.*`, preventing clients from tearing down other users' relays
- **Relay ownership** — every relay tracks a `requestingUserId` extracted from the PUB-enforced subject (`_MESSAGING.subscribe.<userId>.…`). Since NATS enforces PUB permissions, the userId in the subject is guaranteed to match the authenticated user — it cannot be spoofed. On unsubscribe, the relay service verifies the requesting userId matches the relay owner
- **Per-user relay limit** — each user is limited to `maxRelaysPerUser` (default: 50) concurrent relay subscriptions, preventing resource exhaustion from malicious or runaway clients
- **Crypto-random relay IDs** — relay IDs use `crypto.randomBytes` hex encoding, preventing enumeration attacks

### Rate limiting

The `/messaging/token` and `/messaging/channels` endpoints are rate-limited by both IP address and authenticated user ID. This prevents abuse from shared IPs (NAT/proxy) and per-user flooding independently. Configurable via `rateLimitMax` and `rateLimitWindowSec`.

### JetStream consumers and gap replay

The relay creates **ephemeral JetStream push consumers** (not core NATS subscriptions) for each relay. This enables message replay when a client briefly disconnects:

1. Both channel streams use `limits` retention with `max_age: 1h` — messages are buffered in memory regardless of active consumers
2. On re-subscribe, the client can pass `startTime` (ISO 8601) in the relay request body to replay messages from the gap:
   ```javascript
   connection.request(relayTopic, JSON.stringify({ deliverInbox, startTime: '2025-01-01T12:00:00.000Z' }))
   ```
3. If `startTime` is omitted, the consumer uses `deliver_policy: new` (only future messages)
4. The `useMessagingSubscription` hook tracks `lastMessageTime` automatically and passes it on re-subscribe after a relay-closed sentinel

### Relay TTL cleanup

Relay subscriptions are automatically swept when clients disconnect without sending an explicit unsubscribe (e.g. network failure, tab close, crash). Each relay is assigned a `createdAt` timestamp (refreshed on every forwarded message), and a periodic sweep removes relays older than the configured TTL (default: 5 minutes, sweep interval: 60 seconds). Both values are configurable via `relayTtlMs` and `cleanupIntervalMs` in the relay service `start()` config.

When a relay is swept (or revoked), a sentinel message `{ __relay_closed: true, relayId, reason }` is sent to the client's `deliverInbox` before teardown, allowing the client to detect the closure and re-subscribe.

## Access revocation

### User-level revocation

When a user is deleted or blocked, revoke their messaging access instantly:

```javascript
const { revokeMessagingUser, unrevokeMessagingUser } = require('@open-condo/messaging')

revokeMessagingUser(userId)       // tears down all relays + blocks new connections
unrevokeMessagingUser(userId)     // re-enables access
```

### Organization-level revocation

When a user is removed from an organization (e.g. employee blocked/rejected), revoke only their org-scoped access:

```javascript
const { revokeMessagingUserOrganization, unrevokeMessagingUserOrganization } = require('@open-condo/messaging')

revokeMessagingUserOrganization(userId, organizationId)   // tears down org relays + blocks new org connections
unrevokeMessagingUserOrganization(userId, organizationId) // re-enables org access
```

Org-level revocation only affects relays for the specified organization — user-channel relays and other organizations remain active.

Both levels are propagated cross-process via admin topics:
- `_MESSAGING.admin.revoke.<userId>` / `_MESSAGING.admin.unrevoke.<userId>` — user-level
- `_MESSAGING.admin.revokeOrg.<userId>.<organizationId>` / `_MESSAGING.admin.unrevokeOrg.<userId>.<organizationId>` — org-level

These topics are restricted to the server connection only — regular clients cannot publish to them.

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
│   ├── natsJwt.spec.js
│   ├── natsAuthCalloutService.spec.js
│   └── messagingRevocation.spec.js
├── middleware/               # Express endpoints (/messaging/token, /messaging/channels)
├── errors.js                # GQLError definitions for middleware
├── plugins/
│   ├── messaged.js          # Generic Keystone plugin for auto-publishing to any channel
│   └── organizationMessaged.js  # Organization-specific plugin (auto-resolves org + holding)
├── setup.js                 # setupMessaging, initMessaging, closeMessaging, revoke/unrevoke
├── utils/                   # Re-exports from core/AccessControl (configure, checkAccess, getAvailableChannels)
└── hooks/                   # React hooks (useMessagingConnection, useMessagingSubscription, useMessagingChannels)
```
