# Files API

This middleware has endpoints for uploading binaries and sharing previously uploaded files between apps/users.

* **Base path**: `/api/files`
* **Endpoints**:

  * `POST /api/files/upload` — upload one or multiple files (can also **attach** in the same call)
  * `POST /api/files/share` — create a new file record that points to an existing binary (re-share)
  * `POST /api/files/attach` — attach an existing uploaded file to a specific model record

## Authentication

* Only authenticated, non-deleted users can call the endpoints. Auth is taken from the app session cookie (same as other Keystone-secured endpoints).
* Unauthorized or deleted users receive `UNAUTHENTICATED/AUTHORIZATION_REQUIRED`.

---

## Configuration

Set `FILE_UPLOAD_CONFIG` env var to a JSON string:

`clients` is a map whose keys are `fileClientId` and values contain the HS256 secret used to sign/verify tokens.

```json
{
  "clients": {
    "some-app-internal-id": { "secret": "<HS256-signing-secret>" }
  },
  "quota": {
    "default": 100,
    "whitelist": ["<uuid:skip-rate-limit>"],
    "overrides": { "<uuid:user-id>": 150 }
  }
}
```

* `quota.default` — default hourly upload limit per user (files/hour).
* `quota.whitelist` — array of user UUIDs that **bypass** rate limits (not counted and never blocked).
* `quota.overrides` — per-user hourly limits that **override** `default`.

If `quota` is omitted entirely, it defaults to:

```json
{ "default": 100, "whitelist": [], "overrides": {} }
```

---

## Uploading files

* **Method**: `POST`
* **Content-Type**: `multipart/form-data`
* **Fields**:

  * `file` — one or multiple file binaries
  * `meta` — **required** JSON string/object with:

    * `dv`: `1`
    * `sender`: `{ dv: 1, fingerprint: string }`
    * `user`: `{ id: "<USER_ID>" }` — must equal the authenticated user id
    * `fileClientId`: one of keys from `clients`
    * `modelNames`: non-empty array of allowed model names to which this file may be connected
    * `organization` (optional): `{ id: "<ORGANIZATION_ID>" }`
  * `attach` — **optional** JSON string/object to **attach inline** during upload:

    * `dv`: `1`
    * `sender`: `{ dv: 1, fingerprint: string }`
    * `modelName`: a single target model name (must be in `meta.modelNames`)
    * `itemId`: UUID of the target record

### Example — classic upload

```bash
curl -X POST "$SERVER/api/files/upload" \
  -H "Cookie: $COOKIE" \
  -F "file=@/path/to/dino.png" \
  -F 'meta={"dv":1,"sender":{"dv":1,"fingerprint":"test-runner"},"user":{"id":"<USER_ID>"},"fileClientId":"app-frontend","modelNames":["SomeModel"],"organization":{"id":"<ORG_ID>"}}'
```

**Successful response (classic):**

```json
{
  "data": {
    "files": [
      { "id": "<uuid>", "signature": "<jwt>" }
    ]
  }
}
```

### Example — upload **with inline attach** (single request)

```bash
curl -X POST "$SERVER/api/files/upload" \
  -H "Cookie: $COOKIE" \
  -F "file=@/path/to/dino.png" \
  -F 'meta={
    "dv":1,"sender":{"dv":1,"fingerprint":"test-runner"},
    "user":{"id":"<USER_ID>"},
    "fileClientId":"app-frontend",
    "modelNames":["SomeModel"]
  }' \
  -F 'attach={
    "dv":1,"sender":{"dv":1,"fingerprint":"test-runner"},
    "modelName":"SomeModel",
    "itemId":"<MODEL_UUID>"
  }'
```

**Successful response (inline attach):**

```json
{
  "data": {
    "files": [
      {
        "id": "<uuid>",
        "signature": "<jwt>",
        "attached": true,
        "publicSignature": "<jwt>"
      }
    ]
  }
}
```

* `signature` — HS256 JWT (5 min TTL) signed with `clients[fileClientId].secret`. Payload contains file meta needed to call `/attach` later (if you didn’t use inline attach).
* `publicSignature` — HS256 JWT (5 min TTL) of the **public file meta** (same payload you get from `/attach`). Use this directly to persist the file in your app, just like with `graphql-upload`.

> Multiple `file` parts are supported. If `attach` is provided, **all** uploaded files are attached to the same `itemId`/`modelName` and each gets its own `publicSignature`.

---

## FileRecord meta & signature payloads

### Upload/Share signatures (`signature`)

Correspond to the **upload token** (used to authorize `/attach` later):

```json
{
  "id": "<storage-id>",
  "recordId": "<FileRecord.id>",
  "path": "<string|null>",
  "filename": "<generated-name>",
  "originalFilename": "<original name>",
  "mimetype": "<mime>",
  "encoding": "<encoding>",
  "meta": {
    "dv": 1,
    "sender": { "dv": 1, "fingerprint": "<string>" },
    "user": { "id": "<uuid>" },
    "fileClientId": "<string>",
    "modelNames": ["<string>", "..."],
    "sourceFileClientId": "<string|null>"
  },
  "iat": <number>,
  "exp": <number>
}
```

### Public meta signature (`publicSignature` or `/attach` response)

This is the **full public file meta** signed for application storage. Shape matches your `FileRecord` public meta (`FILE_RECORD_PUBLIC_META_FIELDS`).

---

## Connect a file to a GraphQL model

If you **did not** use inline attach:

1. Call `/upload` → receive `signature`.
2. Call `/api/files/attach` (see below) → receive signed public meta.
3. Persist that meta in your app (same as GraphQL Upload’s `FileMeta`).

If you **did** use inline attach: you already have `publicSignature` from `/upload` and can persist it directly.

Example mutation (unchanged):

```graphql
mutation CreateSomeModel($data: SomeModelCreateInput!) {
  obj: createSomeModel(data: $data) {
    file { filename mimetype publicUrl path }
  }
}
```

---

## Sharing a file

Creates a new file record that points to the original binary; useful to “reassign” an uploaded file to another app/user/model.

* **Method**: `POST`
* **Content-Type**: `application/json`
* **Body**:

  * `dv`: `1`
  * `sender`: `{ dv: 1, fingerprint: string }`
  * `id`: UUID of existing file record (must belong to the authenticated user)
  * `user`: `{ id: "uuid" }` — new owner
  * `fileClientId`: target app id (must exist in `clients`)
  * `modelNames` (optional): array of strings

**Successful response:**

```json
{
  "data": {
    "file": { "id": "<uuid>", "signature": "<jwt>" }
  }
}
```

The returned `signature` is signed with the **target** `fileClientId` secret and includes `meta.sourceFileClientId` (original app) and the new `recordId`.

---

## Attaching a file to a model (separate call)

Use when you didn’t inline-attach in `/upload`.

* **Method**: `POST`
* **Content-Type**: `application/json`
* **Body**:

  * `dv`: `1`
  * `sender`: `{ dv: 1, fingerprint: string }`
  * `modelName`: target model name (must be in the file’s `meta.modelNames`)
  * `itemId`: target model record id (UUID)
  * `fileClientId`: the client id used when uploading
  * `signature`: upload/share signature

**Successful response:**

```json
{
  "data": {
    "file": { "signature": "<jwt>" }
  }
}
```

* This `signature` is the same **public file meta** you now also get as `publicSignature` when using inline attach.

---

## Limits and quotas

* **Per-request upload limits** (set when constructing middleware; defaults shown):

  * `maxFieldSize`: 1 MiB (for `meta`/`attach`)
  * `maxFileSize`: 100 MiB per file
  * `maxFiles`: 2 files per request
* **Rate limiting** (per user, per hour) via Redis:

  * Default limit = `quota.default` (100 if omitted)
  * If user is in `quota.whitelist`, limits are bypassed
  * If user has `quota.overrides[userId]`, it takes precedence over `default`

---

## Receiving file from a model

```
GET /api/files/<file_id:string>?sign=<file_signature:string>
```

---

## Error responses

* `UNAUTHENTICATED/AUTHORIZATION_REQUIRED`: user not logged in or deleted
* `BAD_USER_INPUT/WRONG_REQUEST_METHOD_TYPE`: content type not `multipart/form-data` (upload)
* `BAD_USER_INPUT/MISSING_META`: `meta` field not provided (upload)
* `BAD_USER_INPUT/INVALID_META`: `meta` shape invalid or `user` mismatch
* `BAD_USER_INPUT/MISSING_ATTACHED_FILES`: no `file` parts
* `BAD_USER_INPUT/PAYLOAD_TOO_LARGE`: field/file limit exceeded
* `BAD_USER_INPUT/MAX_FILE_UPLOAD_LIMIT_EXCEEDED`: too many files
* `FORBIDDEN/INVALID_APP_ID`: unknown `fileClientId`
* `TOO_MANY_REQUESTS/RATE_LIMIT_EXCEEDED`: quota exceeded
* `BAD_USER_INPUT/INVALID_PAYLOAD`: invalid JSON for `/share`, `/attach`, or the **`attach`** field on `/upload`
* `BAD_USER_INPUT/FILE_NOT_FOUND`: file not found or not owned by the caller
