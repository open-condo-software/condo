# ExternalContent Field Type

The `ExternalContent` field type stores large data externally in files rather than directly in the database. This is useful for fields that contain large JSON/XML/text content that would bloat the database.

## Features

- **External Storage**: Data is stored in files (local filesystem, S3, OBS) instead of database
- **Transparent Access**: Data is automatically loaded and deserialized when accessed via GraphQL
- **Performance Optimization**: Uses DataLoader for batching and caching in GraphQL queries
- **Backward Compatibility**: Supports both inline JSON (legacy) and file-meta references
- **Multiple Formats**: JSON, XML, and plain text supported with format-specific serialization
- **Size Limits**: Configurable maximum size to prevent abuse
- **Format-Aware GraphQL Types**: Returns correct GraphQL type based on format (String for XML/text, JSON for json)

## Usage

### Creating ExternalContent Fields (Recommended)

Use the `createExternalDataField` utility function to create ExternalContent fields. This is the recommended approach:

```javascript
const { ExternalContent: { createExternalDataField } } = require('@open-condo/keystone/fieldsUtils')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')

const MyFieldFileAdapter = new FileAdapter('MyFieldFolder') // The folder where files will be stored

const MY_DATA_FIELD = createExternalDataField({
    adapter: MyFieldFileAdapter,
    format: 'json', // or 'xml', 'text'
    maxSizeBytes: 50 * 1024 * 1024, // 50MB (optional, default: 10MB)
    adminConfig: { isReadOnly: true }, // (optional, default: true) - set to false to allow editing in admin UI
})

const MySchema = {
    fields: {
        myData: MY_DATA_FIELD,
    },
}
```

### Using Default Processors

The `DEFAULT_PROCESSORS` object is available for import and contains the built-in processor definitions for json, xml, and text formats:

```javascript
const { ExternalContent: { DEFAULT_PROCESSORS } } = require('@open-condo/keystone/fieldsUtils')

// Access default processors
const jsonProcessor = DEFAULT_PROCESSORS.json
const xmlProcessor = DEFAULT_PROCESSORS.xml
const textProcessor = DEFAULT_PROCESSORS.text

// Or use them to create custom processors by extending
const customProcessors = {
    ...DEFAULT_PROCESSORS,
    myFormat: {
        graphQLInputType: 'String',
        graphQLReturnType: 'String',
        serialize: (value) => customSerialize(value),
        deserialize: (raw) => customDeserialize(raw),
        mimetype: 'application/custom',
        fileExt: 'custom',
    },
}
```

### Reading ExternalContent Values

When you need to read ExternalContent field values in scripts or utilities (outside of GraphQL), use the `resolveExternalContentValue` utility:

```javascript
const { ExternalContent: { resolveExternalContentValue } } = require('@open-condo/keystone/fieldsUtils')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')

const BillingReceiptRawFieldFileAdapter = new FileAdapter('BillingReceiptRawField') // The folder where files are stored

// In your script or utility function
const rawValue = await resolveExternalContentValue(receipt.raw, {
    adapter: BillingReceiptRawFieldFileAdapter,
})
```

**Parameters:**
- **`value`** - The field value from database (could be inline JSON or file-meta)
- **`options.adapter`** (required) - File adapter instance for reading files
- **`options.formatProcessors`** (optional) - Custom format processors (uses built-in defaults for json/xml/text)
- **`options.context`** (optional) - GraphQL context for DataLoader batching
- **`options.batchDelayMs`** (optional) - Batch delay for DataLoader in milliseconds

**Notes:**
- For GraphQL queries, the field resolver automatically uses `resolveExternalContentValue` with DataLoader batching
- For scripts and utilities using `find()`, you need to manually call this function to load the file content
- Format is determined from file metadata (`meta.format`), uses built-in processors for common formats (json, xml, text)
- Pass custom `formatProcessors` only if you need to override defaults or add custom formats
- Returns `null` if the file doesn't exist (graceful handling)
- Throws an error if deserialization fails or format is unknown
- You may use adapter directly from your field configuration if needed

### Basic Configuration (Legacy)

If you prefer to configure the field directly without the helper function:

```javascript
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')

const MyFieldFileAdapter = new FileAdapter('MyFieldFolder') // The folder where files will be stored

const MySchema = {
    fields: {
        myData: {
            type: 'ExternalContent',
            adapter: MyFieldFileAdapter,
            format: 'json', // or 'xml', 'text'
            maxSizeBytes: 10 * 1024 * 1024, // 10MB (optional, default: 10MB)
        },
    },
}
```

## Configuration Options

### Field Options

- **`adapter`** (required): FileAdapter instance for storing files
- **`format`** (optional): Data format - `'json'`, `'xml'`, or `'text'` (default: `'json'`)
- **`processors`** (optional): Custom format processors (uses built-in defaults if not provided)
- **`maxSizeBytes`** (optional): Maximum size in bytes for field content (default: 10485760 = 10MB)
- **`batchDelayMs`** (optional): DataLoader batch delay in milliseconds (default: 10ms)
- **`schemaDoc`** (optional): Field description for schema documentation
- **`sensitive`** (optional): Mark field as sensitive for audit logging
- **`isRequired`** (optional): Whether the field is required

Example with custom size limit:
```javascript
const LARGE_DATA_FIELD = createExternalDataField({
    adapter: myFileAdapter,
    format: 'json',
    maxSizeBytes: 100 * 1024 * 1024, // 100MB
    batchDelayMs: 20,
    schemaDoc: 'Large data field',
    sensitive: true,
})
```

## How It Works

### Data Storage

**Database Column Type**: ExternalContent fields use TEXT columns in PostgreSQL (not JSON/JSONB)

1. When you create/update a record with ExternalContent field:
   - Data is serialized using the format-specific processor (e.g., JSON.stringify for json format)
   - Size is validated against `maxSizeBytes`
   - Content is saved to a file via FileAdapter
   - FileAdapter generates `publicUrl` based on storage configuration (local, S3, Sbercloud, etc.)
   - Database stores file metadata as JSON string: `{ "id": "...", "filename": "...", "publicUrl": "...", "_externalContentFieldTypeMeta": { "format": "xml" } }`

2. When you read a record via GraphQL:
   - **`fieldName`** - Returns raw file metadata (JSON string) for admin UI
   - **`fieldNameResolved`** - Virtual field that loads and deserializes file content for API clients
   
3. Admin UI behavior:
   - Queries the `fieldName` field to get raw file metadata
   - Controller parses JSON string into object
   - Field/Cell components display clickable link using stored `publicUrl`
   
4. API client behavior:
   - Query `fieldNameResolved` to get deserialized content
   - GraphQL resolver loads file content via DataLoader
   - Content is deserialized using the format-specific processor
   - Returns the actual data (object for JSON, string for XML/text)

### File Naming

Files are named using the pattern: `{ListKey}_{fieldPath}_{uuid}.{ext}`

Example: `BillingReceipt_raw_550e8400-e29b-41d4-a716-446655440000.json`

### GraphQL Query Examples

**Admin UI - Get file metadata with download link:**
```graphql
query {
  XmlLog(where: { id: "..." }) {
    id
    log  # Returns: '{"filename":"...","publicUrl":"https://...","_externalContentFieldTypeMeta":{"format":"xml"},...}'
  }
}
```

**API Client - Get deserialized content:**
```graphql
query {
  XmlLog(where: { id: "..." }) {
    id
    logResolved  # Returns: "<REQ><GUID>...</GUID>...</REQ>" (actual XML string)
  }
}
```

**Get both metadata and content:**
```graphql
query {
  XmlLog(where: { id: "..." }) {
    id
    log          # File metadata for download link
    logResolved  # Actual XML content for processing
  }
}
```

### Admin UI Editing

By default, ExternalContent fields are **read-only** in the admin UI. You can enable editing via `adminConfig`:

```javascript
const EDITABLE_FIELD = createExternalDataField({
    adapter: myFileAdapter,
    format: 'xml',
    adminConfig: { isReadOnly: false }, // Allow editing in admin UI
})
```

**Behavior:**
- **`isReadOnly: true` (default)**: Field displays as a clickable download link (for new files) or plain text (for legacy content)
- **`isReadOnly: false`**: Field displays as a textarea input, allowing users to edit the content directly in the admin UI

When a user edits the field, the content is saved in the new file-based format with proper metadata, `publicUrl`, and format information. The old file is deleted automatically after the database write succeeds.

### Legacy Content Handling

The field maintains backward compatibility with data stored before the ExternalContent refactoring:

**Legacy XML/text content** (stored directly as string):
- **Admin UI (`log` field)**: Displays the actual XML/text content as plain text
- **API Client (`logResolved` field)**: Returns the XML/text content as-is

**Legacy inline JSON** (stored as JSON object without file metadata):
- **Admin UI (`log` field)**: Displays the JSON content as formatted string
- **API Client (`logResolved` field)**: Returns the JSON object as-is

**New file-based content** (stored as file metadata):
- **Admin UI (`log` field)**: Displays clickable download link with filename
- **API Client (`logResolved` field)**: Loads file from storage and returns deserialized content

The field automatically detects the data format using the `_externalContentFieldTypeMeta` field and handles each case appropriately.

### Performance Optimization

The field uses a custom DataLoader that:
- **Batches** multiple file reads into a single operation (10ms window)
- **Caches** results per GraphQL request to prevent duplicate reads
- **Isolates errors** so one file failure doesn't break the entire batch

## Important Limitations

### Transaction Behavior

⚠️ **File operations are NOT transactional**

When updating a field:
1. New file is saved first
2. Database is updated with new file reference
3. Old file is deleted (if exists)

If step 2 fails after step 1, the new file will be orphaned in storage. This is an acceptable trade-off to prevent data loss.

### Orphaned Files

Orphaned files can occur in these scenarios:
- Database update fails after file save
- Delete operation fails (logged but doesn't block update)
- Process crashes between save and DB update

**Cleanup Strategy**: Implement a periodic cleanup job that:
1. Lists all files in storage
2. Checks which files are referenced in database
3. Deletes unreferenced files older than N days

### Memory Usage

⚠️ **Entire file is loaded into memory**

When a field is accessed, the complete file content is loaded into memory. For large datasets:
- 100 records × 1MB each = 100MB in memory
- Consider pagination or streaming for very large files

## Migration from Inline JSON

If you're migrating from a `Json` field to `ExternalContent`:

1. **Update Schema**: Change field type to `ExternalContent`
2. **Run Migration**: Use the generic backfill script to migrate existing data
3. **Deploy**: Deploy schema changes first, then run backfill

### Using the Backfill Script

Use the generic `backfillExternalContentField.js` script to migrate any JSON field to ExternalContent:

```bash
yarn workspace @app/condo node bin/backfillExternalContentField.js \
  --schema billing.BillingReceipt \
  --field raw \
  [--filter '{"organization":"<uuid>"}'] \
  [--dry-run]
```

**Parameters:**
- **`--schema <domain.model>`** (required) - Schema in format `domain.model` (e.g., `billing.BillingReceipt`)
- **`--field <name>`** (required) - Field name to migrate (e.g., `raw`)
- **`--filter <json>`** (optional) - JSON filter for WHERE clause to limit records (e.g., `'{"organization":"<uuid>"}'`)
- **`--batch-size <n>`** (optional) - Rows per page (default: 250)
- **`--max-records <n>`** (optional) - Stop after processing N records
- **`--progress-every <n>`** (optional) - Log progress every N records (default: 1000)
- **`--dry-run`** (optional) - Preview changes without writing files or updating database
- **`--continue-on-error`** (optional) - Continue processing on error instead of stopping

**Example with dry-run:**
```bash
yarn workspace @app/condo node bin/backfillExternalContentField.js \
  --schema billing.BillingReceipt \
  --field raw \
  --dry-run
```

The script handles the complete migration process:
1. Reads inline JSON data from the database
2. Saves data to external files via the FileAdapter
3. Updates database records with file-meta references
4. Supports filtering, batching, and error handling

## Security

### Path Traversal Protection

The field includes built-in protection against path traversal attacks:
- Validates filenames don't contain `..` or absolute paths
- Normalizes paths and ensures they stay within base directory
- Rejects any suspicious patterns

### Access Control

File access is controlled at the field level using Keystone's access control:

```javascript
const MySchema = {
    fields: {
        sensitiveData: {
            type: ExternalContent,
            adapter: MyFieldFileAdapter,
            access: {
                read: ({ authentication }) => authentication.item?.isAdmin,
            },
        },
    },
}
```

## Troubleshooting

### "Payload size exceeds maximum allowed size"

Increase `maxSizeBytes` in field configuration or reduce data size.

```javascript
const MY_FIELD = createExternalDataField({
    adapter: myFileAdapter,
    maxSizeBytes: 50 * 1024 * 1024, // Increase to 50MB
})
```

### "Failed to read file"

Check:
- File adapter is properly configured
- File exists in storage
- Permissions are correct
- For cloud storage: credentials and bucket access

### "Max retries exceeded"

This indicates high load on the DataLoader. The system will retry up to 10 times before failing. If this occurs frequently, consider:
- Increasing batch delay
- Reducing concurrent GraphQL queries
- Optimizing query patterns

### Orphaned Files

To identify orphaned files:
1. List all files in storage folder
2. Query database for all file references
3. Compare and identify unreferenced files
4. Delete files older than your retention period

## Best Practices

1. **Use appropriate size limits**: Set `maxSizeBytes` per field based on your use case
2. **Monitor storage usage**: Track file storage growth
3. **Implement cleanup**: Periodically remove orphaned files
4. **Use pagination**: For queries returning many records with ExternalContent fields
5. **Consider caching**: Add Redis caching for frequently accessed data
6. **Test migrations**: Always test backfill scripts with `--dry-run` first
7. **Use advisory locks**: Prevent concurrent backfill script execution

## Example: BillingReceipt.raw

The `BillingReceipt.raw` field is a real-world example:

```javascript
const BillingReceiptRawFieldFileAdapter = new FileAdapter('BillingReceiptRawField')

const BILLING_RECEIPT_RAW_FIELD = createExternalDataField({
    adapter: BillingReceiptRawFieldFileAdapter,
    format: 'json',
})

const BillingReceipt = {
    fields: {
        raw: {
            ...BILLING_RECEIPT_RAW_FIELD,
            access: { read: access.canReadSensitiveBillingReceiptData },
        },
    },
}
```

This stores large billing receipt JSON data externally while keeping the database lean.
