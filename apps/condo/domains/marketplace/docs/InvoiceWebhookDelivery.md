# Invoice Webhook Delivery System

## Overview

The Invoice Webhook Delivery System allows API users to receive HTTP callbacks when an Invoice's status changes. Users specify a callback URL when creating or updating an Invoice, and the system guarantees delivery attempts for a configurable period (default: 7 days).

## Use Case

When an external system creates an Invoice via GraphQL API, it can provide a `statusChangeCallbackUrl`. Whenever the Invoice status changes (e.g., `draft` → `published` → `paid`), the system sends an HTTP POST request to that URL with details about the change.

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  Invoice        │     │ InvoiceWebhookDelivery│     │  External Server    │
│  (status change)│────▶│ (delivery record)     │────▶│  (callback URL)     │
└─────────────────┘     └──────────────────────┘     └─────────────────────┘
                               │      ▲
                               │      │ retry
                               ▼      │
                        ┌──────────────────────┐
                        │  Cron Task           │
                        │  (every 5 minutes)   │
                        └──────────────────────┘
```

## Data Models

### Invoice (extended)

New fields added to the existing Invoice schema:

| Field | Type | Description |
|-------|------|-------------|
| `statusChangeCallbackUrl` | Url (optional) | URL to call when invoice status changes |
| `statusChangeCallbackSecret` | Text (read-only) | Auto-generated secret for webhook signature verification |

### InvoiceWebhookDelivery (new schema)

Stores webhook delivery attempts and their results:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier |
| `invoice` | Relationship:Invoice | Yes | Link to the invoice |
| `previousStatus` | Text | No | Status before the change (null for new invoices) |
| `newStatus` | Text | Yes | Status after the change |
| `callbackUrl` | Url | Yes | Target URL for webhook delivery |
| `status` | Select | Yes | `pending`, `success`, `failed` |
| `attempt` | Integer | Yes | Current attempt number (starts at 0) |
| `httpStatusCode` | Integer | No | HTTP response status code |
| `responseBody` | Text | No | Response body (truncated to 1000 chars) |
| `errorMessage` | Text | No | Error description if delivery failed |
| `expiresAt` | DateTimeUtc | Yes | Stop retrying after this timestamp |
| `nextRetryAt` | DateTimeUtc | Yes | When to attempt next delivery |
| `sentAt` | DateTimeUtc | No | When the last request was sent |

#### Status Values

- **`pending`**: Delivery is scheduled or waiting for retry
- **`success`**: Webhook was delivered successfully (HTTP 2xx received)
- **`failed`**: Delivery permanently failed (expired or exhausted retries)

## Webhook Payload

When a webhook is delivered, the following JSON payload is sent:

```json
{
  "event": "invoice.status.changed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "deliveryId": "550e8400-e29b-41d4-a716-446655440000",
  "attempt": 1,
  "nextRetryAt": "2024-01-15T10:31:00.000Z",
  "expiresAt": "2024-01-22T10:30:00.000Z",
  "data": {
    "invoiceId": "550e8400-e29b-41d4-a716-446655440001",
    "invoiceNumber": 123,
    "previousStatus": "published",
    "newStatus": "paid",
    "toPay": "1500.00",
    "paidAt": "2024-01-15T10:30:00.000Z",
    "publishedAt": "2024-01-14T09:00:00.000Z",
    "canceledAt": null,
    "organization": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Management Company LLC"
    }
  }
}
```

### Payload Fields

| Field | Description |
|-------|-------------|
| `event` | Event type, always `invoice.status.changed` |
| `timestamp` | ISO 8601 timestamp when the webhook was sent |
| `deliveryId` | Unique ID of this delivery attempt (for idempotency) |
| `attempt` | Attempt number (1, 2, 3, ...) |
| `nextRetryAt` | When the next retry will be attempted if this delivery fails (null on last attempt) |
| `expiresAt` | When the system will stop retrying (delivery TTL deadline) |
| `data.invoiceId` | UUID of the invoice |
| `data.invoiceNumber` | Human-readable invoice number within organization |
| `data.previousStatus` | Status before the change (null if invoice was just created) |
| `data.newStatus` | New status after the change |
| `data.toPay` | Total amount to pay |
| `data.paidAt` | Timestamp when invoice was paid (if applicable) |
| `data.publishedAt` | Timestamp when invoice was published (if applicable) |
| `data.canceledAt` | Timestamp when invoice was canceled (if applicable) |
| `data.organization` | Organization that owns the invoice |

## HTTP Request

### Request Format

```http
POST {callbackUrl} HTTP/1.1
Content-Type: application/json
X-Condo-Signature: {hmac-sha256-signature}
X-Condo-Event: invoice.status.changed
X-Condo-Delivery-Id: {delivery-uuid}

{payload}
```

### Headers

| Header | Description |
|--------|-------------|
| `Content-Type` | Always `application/json` |
| `X-Condo-Signature` | HMAC-SHA256 signature of the payload body |
| `X-Condo-Event` | Event type for routing on receiver side |
| `X-Condo-Delivery-Id` | Unique delivery ID for idempotency handling |

### Signature Verification

The `X-Condo-Signature` header contains an HMAC-SHA256 signature of the request body, signed with a **per-invoice secret**. Each invoice has its own unique secret (`statusChangeCallbackSecret`) that is auto-generated when `statusChangeCallbackUrl` is set.

#### Getting the Secret

The secret is returned when you create or query an Invoice:

```graphql
query {
  Invoice(where: { id: "invoice-uuid" }) {
    id
    statusChangeCallbackUrl
    statusChangeCallbackSecret  # Use this to verify webhooks
  }
}
```

**Important**: Store this secret securely on your server. It's unique to each invoice and cannot be changed.

#### Verification Example (Node.js)

```javascript
const crypto = require('crypto')

function verifyWebhookSignature(requestBody, signatureHeader, secret) {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(requestBody))
        .digest('hex')
    
    return crypto.timingSafeEqual(
        Buffer.from(signatureHeader),
        Buffer.from(expectedSignature)
    )
}

// Usage in Express.js
app.post('/webhook', (req, res) => {
    const signature = req.headers['x-condo-signature']
    const invoiceId = req.body.data.invoiceId
    
    // Look up the secret you stored when creating the invoice
    const secret = await getStoredSecretForInvoice(invoiceId)
    
    const isValid = verifyWebhookSignature(req.body, signature, secret)
    
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' })
    }
    
    // Process webhook...
    res.status(200).json({ received: true })
})
```

## Retry Logic

### Retry Strategy

The system uses exponential backoff for retries:

| Attempt | Delay After Failure |
|---------|---------------------|
| 1 | Immediate |
| 2 | 1 minute |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |
| 6 | 6 hours |
| 7+ | 24 hours (daily) |

### Retry Intervals Configuration

```javascript
// Retry intervals in seconds
const INVOICE_WEBHOOK_RETRY_INTERVALS = [
    0,              // Attempt 1: immediate
    60,             // Attempt 2: 1 minute
    5 * 60,         // Attempt 3: 5 minutes
    30 * 60,        // Attempt 4: 30 minutes
    2 * 60 * 60,    // Attempt 5: 2 hours
    6 * 60 * 60,    // Attempt 6: 6 hours
    24 * 60 * 60,   // Attempt 7+: 24 hours (daily)
]
```

### Time-To-Live (TTL)

Webhooks are retried until the `expiresAt` timestamp is reached. The TTL is configurable:

```javascript
// How long to keep retrying webhook delivery
const INVOICE_WEBHOOK_DELIVERY_TTL_DAYS = 7
```

When `expiresAt` is reached, the delivery status is set to `failed` and no more retries are attempted.

### Changing TTL

- **Increasing TTL** (e.g., 7 → 30 days): New deliveries get longer expiration. Existing pending deliveries keep their original `expiresAt`.
- **Decreasing TTL** (e.g., 30 → 7 days): New deliveries get shorter expiration. Existing pending deliveries keep their original `expiresAt`.
- **To apply new TTL to existing deliveries**: Run a database migration to update `expiresAt = createdAt + NEW_TTL_DAYS` for records with `status = 'pending'`.

## Success Criteria

| HTTP Response | Result | Action |
|---------------|--------|--------|
| `2xx` | Success | Mark as `success`, stop retrying |
| `3xx` | Failure | Retry (redirects not followed) |
| `4xx` | Failure | Retry (receiver might fix their endpoint) |
| `5xx` | Failure | Retry (server error, might recover) |
| Timeout (30s) | Failure | Retry |
| Network error | Failure | Retry |

## Flow Diagrams

### Invoice Status Change Flow

```
1. User updates Invoice status via GraphQL
                    │
                    ▼
2. Invoice.afterChange hook triggered
                    │
                    ▼
3. Check: statusChangeCallbackUrl exists?
          │                    │
         No                   Yes
          │                    │
          ▼                    ▼
       (done)         4. Create InvoiceWebhookDelivery
                              │
                              ▼
                      5. Call sendInvoiceWebhook.delay(deliveryId)
                              │
                              ▼
                      6. Worker picks up task
                              │
                              ▼
                      7. tryDeliverWebhook()
                              │
                    ┌─────────┴─────────┐
                    │                   │
                 Success             Failure
                    │                   │
                    ▼                   ▼
            8a. Update status    8b. Calculate nextRetryAt
                to 'success'            │
                    │                   ▼
                    │           9. Check: nextRetryAt > expiresAt?
                    │                   │
                    │         ┌─────────┴─────────┐
                    │         │                   │
                    │        Yes                  No
                    │         │                   │
                    │         ▼                   ▼
                    │   10a. Mark as        10b. Update nextRetryAt
                    │       'failed'             status='pending'
                    │         │                   │
                    ▼         ▼                   ▼
                          (done)           (wait for cron)
```

### Cron Retry Flow

```
1. Cron task runs every 5 minutes
                    │
                    ▼
2. Query: SELECT * FROM InvoiceWebhookDelivery
          WHERE status = 'pending'
          AND nextRetryAt <= NOW()
          AND expiresAt > NOW()
                    │
                    ▼
3. For each delivery:
   Call sendInvoiceWebhook.delay(deliveryId)
                    │
                    ▼
4. Worker processes each delivery
   (same as steps 6-10 above)
```

## API Usage

### Creating an Invoice with Webhook

```graphql
mutation {
  createInvoice(data: {
    dv: 1
    sender: { dv: 1, fingerprint: "my-app" }
    organization: { connect: { id: "org-uuid" } }
    property: { connect: { id: "property-uuid" } }
    unitName: "42"
    unitType: "flat"
    rows: [
      { name: "Service", toPay: "1000", count: 1, sku: "SVC-001" }
    ]
    statusChangeCallbackUrl: "https://my-app.com/webhooks/invoice"
  }) {
    id
    number
    status
    statusChangeCallbackUrl
    statusChangeCallbackSecret  # Store this to verify webhook signatures!
  }
}
```

### Querying Webhook Delivery Status

```graphql
query {
  allInvoiceWebhookDeliveries(
    where: { invoice: { id: "invoice-uuid" } }
    sortBy: createdAt_DESC
  ) {
    id
    previousStatus
    newStatus
    status
    attempt
    httpStatusCode
    errorMessage
    nextRetryAt
    expiresAt
    sentAt
  }
}
```

## Configuration

### Constants

| Constant | Default | Description |
|----------|---------|-------------|
| `INVOICE_WEBHOOK_DELIVERY_TTL_DAYS` | `7` | Days to retry before giving up |
| `INVOICE_WEBHOOK_RETRY_INTERVALS` | See above | Retry delays in seconds |
| `INVOICE_WEBHOOK_TIMEOUT_MS` | `30000` | HTTP request timeout in milliseconds |
| `INVOICE_WEBHOOK_MAX_RESPONSE_LENGTH` | `1000` | Maximum response body length to store |

## File Structure

```
apps/condo/domains/marketplace/
├── constants/
│   └── index.js                          # Webhook constants
├── schema/
│   ├── Invoice.js                        # Extended with statusChangeCallbackUrl
│   └── InvoiceWebhookDelivery.js         # New delivery tracking schema
├── tasks/
│   ├── index.js                          # Task registration
│   ├── sendInvoiceWebhook.js             # Delivery task
│   └── retryFailedInvoiceWebhooks.js     # Retry cron task
├── utils/
│   └── webhookDelivery.js                # tryDeliverWebhook, buildWebhookPayload
├── access/
│   └── InvoiceWebhookDelivery.js         # Access control
└── docs/
    └── InvoiceWebhookDelivery.md         # This documentation
```

## Security Considerations

1. **URL Validation**: Callback URLs must be valid HTTPS URLs (HTTP allowed only in development)
2. **Per-Invoice Secrets**: Each invoice has its own unique webhook secret, preventing cross-invoice signature forgery
3. **Signature Verification**: All webhooks include HMAC-SHA256 signature for authenticity
4. **Timeout**: 30-second timeout prevents hanging connections
5. **Response Truncation**: Response bodies are truncated to 1000 characters to prevent storage abuse
6. **No Internal URLs**: Callback URLs should be validated to prevent SSRF attacks (no localhost, internal IPs)

## Idempotency

Receivers should handle duplicate deliveries gracefully. The `X-Condo-Delivery-Id` header and `deliveryId` in the payload can be used to deduplicate:

```javascript
app.post('/webhook', async (req, res) => {
    const deliveryId = req.body.deliveryId
    
    // Check if already processed
    const existing = await db.webhookLog.findOne({ deliveryId })
    if (existing) {
        return res.status(200).json({ received: true, duplicate: true })
    }
    
    // Process and log
    await processInvoiceStatusChange(req.body)
    await db.webhookLog.create({ deliveryId, processedAt: new Date() })
    
    res.status(200).json({ received: true })
})
```

## Monitoring

### Key Metrics

- **Delivery success rate**: `success / (success + failed)` per time period
- **Average delivery time**: Time from status change to successful delivery
- **Retry distribution**: How many deliveries succeed on attempt 1, 2, 3, etc.
- **Failure reasons**: Group by `errorMessage` to identify common issues

### Alerts

Consider alerting on:
- High failure rate (> 10% of deliveries failing permanently)
- Specific callback URLs with repeated failures
- Unusual spike in pending deliveries

## Limitations

1. **One URL per Invoice**: Each invoice can have only one callback URL
2. **No custom headers**: Receivers cannot configure custom headers
3. **No retry on demand**: Users cannot manually trigger a retry (support can reset `nextRetryAt`)
4. **Fixed payload**: Payload structure is fixed, users cannot customize which fields are included
