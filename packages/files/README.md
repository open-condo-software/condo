### Files API

This middleware has endpoints for uploading binaries and sharing previously uploaded files between apps/users.

- **Base path**: `/api/files`
- **Endpoints**:
  - `POST /api/files/upload` — upload one or multiple files
  - `POST /api/files/share` — create a new file record that points to an existing binary (re-share)

### Authentication

- Only authenticated, non-deleted users can call the endpoints. Auth is taken from the app session cookie (same as other Keystone-secured endpoints).
- Unauthorized or deleted users receive `UNAUTHENTICATED/AUTHORIZATION_REQUIRED`.

### Configuration

Set `FILE_UPLOAD_CONFIG` env var to a JSON string:

```json
{
  "clients": {
    "some-app-internal-id": { "name": "Some app", "secret": "<HS256-signing-secret>" }
  },
  "quota": {
    "user": 100,
    "ip": 100
  }
}
```

### Uploading files

- Method: `POST`
- Content-Type: `multipart/form-data`
- Fields:
  - `file`: one or multiple file binaries
  - `meta`: JSON string with:
    - `dv`: `1`
    - `sender`: `{ dv: 1, fingerprint: string }`
    - `authedItemId`: UUID of the current user; must equal the authenticated user id
    - `appId`: one of keys from `clients`
    - `modelNames`: non-empty array of Models to which this file should be connected

Example (curl):

```bash
curl -X POST "$SERVER/api/files/upload" \
  -H "Cookie: $COOKIE" \
  -F "file=@/path/to/dino.png" \
  -F 'meta={"dv":1,"sender":{"dv":1,"fingerprint":"test-runner"},"authedItemId":"<USER_ID>","appId":"app-frontend","modelNames":["SomeModel"]}'
```

Successful response:

```json
{
  "data": {
    "files": [
      { "id": "<uuid>", "signature": "<jwt>" }
    ]
  }
}
```

- Multiple `file` parts are supported; response returns matching number of items.
- `signature` is an HS256 JWT (expires in 5 minutes) signed with `clients[appId].secret`. Payload contains file meta, including `recordId`, original filename, mimetype, encoding, and `meta` with app/user info.

### FileRecord model and signature payload

The signed payload corresponds to the public meta of `FileRecord`:

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
    "authedItemId": "<uuid>",
    "appId": "<string>",
    "modelNames": ["<string>", "..."],
    "sourceAppId": "<string|null>"
  },
  "iat": <number>,
  "exp": <number>
}
```

### Connect a file to a GraphQL model

After you receive a file `signature` from the upload/share endpoint, pass it into a mutation for a model that has a file field. The field expects an input of type `FileMeta` with a `signature` property.

- Requirements:
  - The current user must be the owner indicated by `authedItemId`.
  - The model’s list key must be present in `meta.modelNames`.
  - Use the signature before it expires.

Create example:

```graphql
mutation CreateSomeModel($data: SomeModelCreateInput!) {
  obj: createSomeModel(data: $data) {
    id
    file { signature }
  }
}
```


On read, the field resolves to:

```graphql
{
  fileField {
    id
    path
    filename
    originalFilename
    mimetype
    encoding
    publicUrl
    meta
  }
}
```

### Sharing a file

Creates a new file record that points to the original binary; useful to “reassign” an uploaded file to another app/user/model.

- Method: `POST`
- Content-Type: `application/json`
- Body:
  - `dv`: `1`
  - `sender`: `{ dv: 1, fingerprint: string }`
  - `id`: UUID of existing file record (must belong to the authenticated user)
  - `authedItemId`: UUID of the target user (new owner)
  - `appId`: target app id (must exist in `clients`)
  - `modelNames` (optional): array of strings

Example:

```bash
curl -X POST "$SERVER/api/files/share" \
  -H "Cookie: $COOKIE" -H "Content-Type: application/json" \
  -d '{
    "dv":1,
    "sender":{"dv":1,"fingerprint":"test-runner"},
    "id":"<EXISTING_FILE_ID>",
    "authedItemId":"<TARGET_USER_ID>",
    "appId":"another-app",
    "modelNames":["AnotherModel"]
  }'
```

Successful response:

```json
{
  "data": {
    "file": { "id": "<uuid>", "signature": "<jwt>" }
  }
}
```

- The returned `signature` is signed with the target `appId` secret and includes `meta.sourceAppId` (original app) and `recordId` of the new file record.

### Limits and quotas

- Default limits (can be overridden when instantiating the middleware):
  - `maxFieldSize`: 1 MiB (size of non-file fields like `meta`)
  - `maxFileSize`: 100 MiB per file
  - `maxFiles`: 2 files per request
- Rate limiting: per-hour counters for `user` and `ip` enforced via Redis.

### Error responses

- `UNAUTHENTICATED/AUTHORIZATION_REQUIRED`: user not logged in or deleted
- `BAD_USER_INPUT/WRONG_REQUEST_METHOD_TYPE`: content type not `multipart/form-data` (upload)
- `BAD_USER_INPUT/MISSING_META`: `meta` field not provided (upload)
- `BAD_USER_INPUT/INVALID_META`: `meta` shape invalid or `authedItemId` mismatch
- `BAD_USER_INPUT/MISSING_ATTACHED_FILES`: no `file` parts
- `BAD_USER_INPUT/PAYLOAD_TOO_LARGE`: field/file limit exceeded
- `BAD_USER_INPUT/MAX_FILE_UPLOAD_LIMIT_EXCEEDED`: too many files
- `FORBIDDEN/INVALID_APP_ID`: unknown `appId`
- `TOO_MANY_REQUESTS/RATE_LIMIT_EXCEEDED`: quota exceeded
- `BAD_USER_INPUT/INVALID_PAYLOAD`: invalid JSON body for share
- `BAD_USER_INPUT/FILE_NOT_FOUND`: share target not owned by the caller
