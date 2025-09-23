### Files API

This middleware has endpoints for uploading binaries and sharing previously uploaded files between apps/users.

- **Base path**: `/api/files`
- **Endpoints**:
  - `POST /api/files/upload` — upload one or multiple files
  - `POST /api/files/share` — create a new file record that points to an existing binary (re-share)
  - `POST /api/files/attach` — attach an existing uploaded file to a specific model record

### Authentication

- Only authenticated, non-deleted users can call the endpoints. Auth is taken from the app session cookie (same as other Keystone-secured endpoints).
- Unauthorized or deleted users receive `UNAUTHENTICATED/AUTHORIZATION_REQUIRED`.

### Configuration

Set `FILE_UPLOAD_CONFIG` env var to a JSON string:


Clients is a object of fileClientId as a key and value is an object with payload of secret to encrypt and decrypt files 
```json
{
  "clients": {
    "some-app-internal-id": { "secret": "<HS256-signing-secret>" }
  },
  "quota": {
    "user": 100,
    "ip": 100
  }
}
```

Upload quota is 100 files per hour for user and ip by default.


### Uploading files

- Method: `POST`
- Content-Type: `multipart/form-data`
- Fields:
  - `file`: one or multiple file binaries
  - `meta`: JSON string with:
    - `dv`: `1`
    - `sender`: `{ dv: 1, fingerprint: string }`
    - `userId`: UUID of the current user; must equal the authenticated user id
    - `fileClientId`: one of keys from `clients`
    - `modelNames`: non-empty array of Models to which this file should be connected

Example (curl):

```bash
curl -X POST "$SERVER/api/files/upload" \
  -H "Cookie: $COOKIE" \
  -F "file=@/path/to/dino.png" \
  -F 'meta={"dv":1,"sender":{"dv":1,"fingerprint":"test-runner"},"userId":"<USER_ID>","fileClientId":"app-frontend","modelNames":["SomeModel"]}'
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
- `signature` is an HS256 JWT (expires in 5 minutes) signed with `clients[fileClientId].secret`. Payload contains file meta, including `recordId`, original filename, mimetype, encoding, and `meta` with app/user info.

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
    "userId": "<uuid>",
    "fileClientId": "<string>",
    "modelNames": ["<string>", "..."],
    "sourcefileClientId": "<string|null>"
  },
  "iat": <number>,
  "exp": <number>
}
```

### Connect a file to a GraphQL model

After you receive a file `signature` from the upload/share endpoint, pass it into a mutation for a model that has a file field. The field expects an input of type `FileMeta` with a `signature` property.

- Requirements:
  - The current user must be the owner indicated by `userId`.
  - The model’s list key must be present in `meta.modelNames`.
  - Use the signature before it expires.

Create example:

```graphql
mutation CreateSomeModel($data: SomeModelCreateInput!) {
  obj: createSomeModel(data: $data) {
    file { filename mimetype publicUrl path }
  }
}

// Data example:
data: {
  ...otherModelFields,
  file: { signature: 'signed-string-received-from-file-server' }
}

```


On read, the field resolves to:

```graphql
{
  file {
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
  - `userId`: UUID of the target user (new owner)
  - `fileClientId`: target app id (must exist in `clients`)
  - `modelNames` (optional): array of strings

Example:

```bash
curl -X POST "$SERVER/api/files/share" \
  -H "Cookie: $COOKIE" -H "Content-Type: application/json" \
  -d '{
    "dv":1,
    "sender":{"dv":1,"fingerprint":"test-runner"},
    "id":"<EXISTING_FILE_ID>",
    "userId":"<TARGET_USER_ID>",
    "fileClientId":"another-app",
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

- The returned `signature` is signed with the target `fileClientId` secret and includes `meta.sourcefileClientId` (original app) and `recordId` of the new file record.

### Attaching a file to a model

Attach an already uploaded file to a specific model record using a file client signature.

- Method: `POST`
- Content-Type: `application/json`
- Body:
  - `dv`: `1`
  - `sender`: `{ dv: 1, fingerprint: string }`
  - `modelName`: target model name (must be allowed by the file’s `meta.modelNames`)
  - `itemId`: target model record id (UUID)
  - `fileClientId`: client id used when the file was uploaded
  - `signature`: file client signature received from previous step (upload/share)

Example:

```bash
curl -X POST "$SERVER/api/files/attach" \
  -H "Cookie: $COOKIE" -H "Content-Type: application/json" \
  -d '{
    "dv": 1,
    "sender": { "dv": 1, "fingerprint": "test-runner" },
    "modelName": "SomeModel",
    "itemId": "<MODEL_UUID>",
    "fileClientId": "some-app-internal-id",
    "signature": "<signature-from-upload-or-share>"
  }'
```

Successful response:

```json
{
  "data": {
    "file": { "signature": "<jwt>" }
  }
}
```

- The `signature` is HS256 for full public file meta, signed by `clients[fileClientId].secret` (expires in 5 minutes). Use it when persisting the file in your application.

### Limits and quotas

- Default limits (can be overridden when instantiating the middleware):
  - `maxFieldSize`: 1 MiB (size of non-file fields like `meta`)
  - `maxFileSize`: 100 MiB per file
  - `maxFiles`: 2 files per request
- Rate limiting: per-hour counters for `user` and `ip` enforced via Redis.

### Receiving file from a model

GET /api/files/<file_id:string>?sign=<file_signature:string>

### Error responses

- `UNAUTHENTICATED/AUTHORIZATION_REQUIRED`: user not logged in or deleted
- `BAD_USER_INPUT/WRONG_REQUEST_METHOD_TYPE`: content type not `multipart/form-data` (upload)
- `BAD_USER_INPUT/MISSING_META`: `meta` field not provided (upload)
- `BAD_USER_INPUT/INVALID_META`: `meta` shape invalid or `userId` mismatch
- `BAD_USER_INPUT/MISSING_ATTACHED_FILES`: no `file` parts
- `BAD_USER_INPUT/PAYLOAD_TOO_LARGE`: field/file limit exceeded
- `BAD_USER_INPUT/MAX_FILE_UPLOAD_LIMIT_EXCEEDED`: too many files
- `FORBIDDEN/INVALID_APP_ID`: unknown `fileClientId`
- `TOO_MANY_REQUESTS/RATE_LIMIT_EXCEEDED`: quota exceeded
- `BAD_USER_INPUT/INVALID_PAYLOAD`: invalid JSON body for share/attach
- `BAD_USER_INPUT/FILE_NOT_FOUND`: file not found or not owned by the caller
