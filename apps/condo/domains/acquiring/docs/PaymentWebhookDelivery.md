# Payment Webhook Delivery System

## Overview

The Payment Webhook Delivery System allows API users to receive HTTP callbacks when a Payment's status changes. Users specify a callback URL when creating an Invoice or BillingReceipt, and the system sends webhooks when payments for those items change status.

**Important**: Callback URLs must be pre-approved by adding them to the `PaymentWebhookDeliveryWhiteListItem` whitelist. Only admin/support users can manage this whitelist.

## Use Case

When an external system creates an Invoice or BillingReceipt via GraphQL API, it can provide a `statusChangeCallbackUrl`. Whenever a Payment related to that Invoice/Receipt changes status (e.g., `CREATED` → `PROCESSING` → `DONE`), the system sends an HTTP POST request to that URL with details about the change.

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  Payment        │     │ PaymentWebhookDelivery│     │  External Server    │
│  (status change)│────▶│ (delivery record)     │────▶│  (callback URL)     │
└─────────────────┘     └──────────────────────┘     └─────────────────────┘
        │                       │      ▲
        │                       │      │ retry
        ▼                       ▼      │
┌─────────────────┐      ┌──────────────────────┐
│  Invoice or     │      │  Cron Task           │
│  BillingReceipt │      │  (every 5 minutes)   │
│  (callback URL) │      └──────────────────────┘
└─────────────────┘
```

## Data Models

### Invoice (webhook fields)

| Field | Type | Description |
|-------|------|-------------|
| `statusChangeCallbackUrl` | Url (optional) | URL to call when payment status changes |
| `statusChangeCallbackSecret` | Text (read-only) | Auto-generated secret for webhook signature verification |

### BillingReceipt (webhook fields)

| Field | Type | Description |
|-------|------|-------------|
| `statusChangeCallbackUrl` | Url (optional) | URL to call when payment status changes |
| `statusChangeCallbackSecret` | Text (read-only) | Auto-generated secret for webhook signature verification |

### PaymentWebhookDeliveryWhiteListItem

Stores approved webhook callback URLs. Only URLs in this whitelist can be used as `statusChangeCallbackUrl` in Invoice or BillingReceipt.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier |
| `url` | Url | Yes | Approved webhook callback URL (must be unique) |
| `name` | Text | No | Human-readable name (e.g., "Production CRM Webhook") |
| `description` | Text | No | Optional description of what this webhook is used for |
| `isEnabled` | Checkbox | Yes | Whether this URL is currently enabled (default: true) |

**Access Control**:
- **Read**: Admin, Support only
- **Create/Update**: Admin, Support only
- **Delete**: Not allowed (use soft delete)

### PaymentWebhookDelivery

Stores webhook delivery attempts and their results:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier |
| `payment` | Relationship:Payment | Yes | Link to the payment |
| `previousStatus` | Text | No | Status before the change |
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

## Webhook Payload

When a webhook is delivered, the following JSON payload is sent:

```json
{
  "event": "payment.status.changed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "deliveryId": "550e8400-e29b-41d4-a716-446655440000",
  "attempt": 1,
  "nextRetryAt": "2024-01-15T10:31:00.000Z",
  "expiresAt": "2024-01-22T10:30:00.000Z",
  "data": {
    "paymentId": "550e8400-e29b-41d4-a716-446655440001",
    "previousStatus": "PROCESSING",
    "newStatus": "DONE",
    "amount": "1500.00",
    "currencyCode": "RUB",
    "accountNumber": "123456789",
    "organization": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Management Company LLC"
    },
    "invoice": {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "number": 123,
      "status": "paid",
      "toPay": "1500.00"
    },
    "receipt": null
  }
}
```

### Payment Statuses

| Status | Description |
|--------|-------------|
| `CREATED` | Payment has been created |
| `PROCESSING` | Payment is being processed |
| `WITHDRAWN` | Money has been withdrawn from payer |
| `DONE` | Payment completed successfully |
| `ERROR` | Payment failed |

## HTTP Request

### Request Format

```http
POST {callbackUrl} HTTP/1.1
Content-Type: application/json
X-Condo-Signature: {hmac-sha256-signature}
X-Condo-Event: payment.status.changed
X-Condo-Delivery-Id: {delivery-uuid}

{payload}
```

### Signature Verification

The `X-Condo-Signature` header contains an HMAC-SHA256 signature of the request body, signed with the **per-invoice/receipt secret**.

#### Getting the Secret

The secret is returned when you create or query an Invoice/BillingReceipt:

```graphql
query {
  Invoice(where: { id: "invoice-uuid" }) {
    id
    statusChangeCallbackUrl
    statusChangeCallbackSecret  # Use this to verify webhooks
  }
}
```

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

app.post('/webhook', (req, res) => {
    const signature = req.headers['x-condo-signature']
    const paymentId = req.body.data.paymentId
    
    // Look up the secret you stored when creating the invoice/receipt
    const secret = await getStoredSecretForPayment(paymentId)
    
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

### Time-To-Live (TTL)

Webhooks are retried until the `expiresAt` timestamp is reached. Default TTL is 7 days.

## API Usage

### Step 1: Register Callback URL in Whitelist (Admin/Support only)

Before using a callback URL, it must be added to the whitelist:

```graphql
mutation {
  createPaymentWebhookDeliveryWhiteListItem(data: {
    dv: 1
    sender: { dv: 1, fingerprint: "admin-panel" }
    url: "https://my-app.com/webhooks/payment"
    name: "My App Production Webhook"
    description: "Webhook endpoint for payment notifications"
    isEnabled: true
  }) {
    id
    url
    name
    isEnabled
  }
}
```

### Step 2: Query Whitelisted URLs

```graphql
query {
  allPaymentWebhookDeliveryWhiteListItems(where: { isEnabled: true }) {
    id
    url
    name
    description
  }
}
```

### Step 3: Create Invoice with Whitelisted Callback URL

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
    statusChangeCallbackUrl: "https://my-app.com/webhooks/payment"  # Must be in whitelist!
  }) {
    id
    number
    status
    statusChangeCallbackUrl
    statusChangeCallbackSecret  # Store this to verify webhook signatures!
  }
}
```

**Note**: If the `statusChangeCallbackUrl` is not in the whitelist, the mutation will fail with error `CALLBACK_URL_NOT_IN_WHITELIST`.

### Disable a Whitelisted URL

```graphql
mutation {
  updatePaymentWebhookDeliveryWhiteListItem(
    id: "whitelist-item-uuid"
    data: {
      dv: 1
      sender: { dv: 1, fingerprint: "admin-panel" }
      isEnabled: false
    }
  ) {
    id
    url
    isEnabled
  }
}
```

## Configuration

### Constants

| Constant | Default | Description |
|----------|---------|-------------|
| `PAYMENT_WEBHOOK_DELIVERY_TTL_DAYS` | `7` | Days to retry before giving up |
| `PAYMENT_WEBHOOK_RETRY_INTERVALS` | See above | Retry delays in seconds |
| `PAYMENT_WEBHOOK_TIMEOUT_MS` | `30000` | HTTP request timeout in milliseconds |
| `PAYMENT_WEBHOOK_MAX_RESPONSE_LENGTH` | `1000` | Maximum response body length to store |

## File Structure

```
apps/condo/domains/acquiring/
├── constants/
│   └── webhook.js                              # Webhook constants
├── schema/
│   ├── PaymentWebhookDelivery.js               # Delivery tracking schema
│   ├── PaymentWebhookDeliveryWhiteListItem.js  # URL whitelist schema
│   └── fields/
│       └── webhookCallback.js                  # Shared webhook fields & validation
├── tasks/
│   ├── sendPaymentWebhook.js                   # Delivery task
│   └── retryFailedPaymentWebhooks.js           # Retry cron task
├── utils/
│   └── serverSchema/
│       └── webhookDelivery.js                  # tryDeliverWebhook, buildWebhookPayload
├── access/
│   ├── PaymentWebhookDelivery.js               # Delivery access control
│   └── PaymentWebhookDeliveryWhiteListItem.js  # Whitelist access control
└── docs/
    └── PaymentWebhookDelivery.md               # This documentation
```

## Security Considerations

1. **URL Whitelist**: Callback URLs must be pre-approved in `PaymentWebhookDeliveryWhiteListItem` by admin/support
2. **URL Validation**: Callback URLs must be valid HTTPS URLs
3. **Per-Invoice/Receipt Secrets**: Each invoice/receipt has its own unique webhook secret
4. **Signature Verification**: All webhooks include HMAC-SHA256 signature for authenticity
5. **Timeout**: 30-second timeout prevents hanging connections
6. **Response Truncation**: Response bodies are truncated to 1000 characters

## Idempotency

Receivers should handle duplicate deliveries gracefully using the `X-Condo-Delivery-Id` header and `deliveryId` in the payload.
