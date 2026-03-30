# ExternalContent Field Type

The `ExternalContent` field type stores large data externally in files rather than directly in the database. This is useful for fields that contain large JSON/XML/text content that would bloat the database.

## Features

- **External Storage**: Data is stored in files (local filesystem, S3, OBS) instead of database
- **Transparent Access**: Data is automatically loaded and deserialized when accessed via GraphQL
- **Performance Optimization**: Uses DataLoader for batching and caching in GraphQL queries
- **Backward Compatibility**: Supports both inline JSON (legacy) and file-meta references
- **Multiple Formats**: JSON, XML, and plain text supported
- **Size Limits**: Configurable maximum size to prevent abuse

## Usage

### Basic Configuration

```javascript
const { ExternalContent } = require('@open-condo/keystone/fields')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')

const MyFieldFileAdapter = new FileAdapter('MyFieldFolder')

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

### Using the Helper Function

```javascript
const { createExternalDataField } = require('@open-condo/keystone/utils/externalContentFieldType')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')

const MyFieldFileAdapter = new FileAdapter('MyFieldFolder')

const MY_DATA_FIELD = createExternalDataField({
    adapter: MyFieldFileAdapter,
    format: 'json',
    maxSizeBytes: 50 * 1024 * 1024, // 50MB (optional, default: 10MB)
})

const MySchema = {
    fields: {
        myData: MY_DATA_FIELD,
    },
}
```

## Configuration Options

### Field Options

- **`adapter`** (required): FileAdapter instance for storing files
- **`format`** (optional): Data format - `'json'`, `'xml'`, or `'text'` (default: `'json'`)
- **`processors`** (optional): Custom serialization/deserialization functions
- **`maxSizeBytes`** (optional): Maximum size in bytes for field content (default: 10485760 = 10MB)

Example with custom size limit:
```javascript
const LARGE_DATA_FIELD = createExternalDataField({
    adapter: myFileAdapter,
    format: 'json',
    maxSizeBytes: 100 * 1024 * 1024, // 100MB
})
```

## How It Works

### Data Storage

1. When you create/update a record with ExternalContent field:
   - Data is serialized (e.g., JSON.stringify)
   - Size is validated against `maxSizeBytes`
   - Content is saved to a file via FileAdapter
   - Database stores only file metadata: `{ id, filename }`

2. When you read a record:
   - GraphQL resolver loads file content
   - Content is deserialized (e.g., JSON.parse)
   - Original data structure is returned

### File Naming

Files are named using the pattern: `{ListKey}_{fieldPath}_{cuid}.{ext}`

Example: `BillingReceipt_raw_ck123abc.json`

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
2. **Run Migration**: Use the backfill script to migrate existing data
3. **Deploy**: Deploy schema changes first, then run backfill

Example backfill script pattern:
```javascript
const cuid = require('cuid')
const { Readable } = require('stream')

// For each record with inline JSON
const payload = JSON.stringify(record.myData)
const fileId = cuid()
const filename = `MyList_myData_${fileId}.json`

await knex.transaction(async (trx) => {
    const saved = await adapter.save({
        stream: Readable.from([Buffer.from(payload, 'utf-8')]),
        filename,
        mimetype: 'application/json',
        encoding: 'utf-8',
        id: fileId,
    })
    
    await trx.raw(`
        UPDATE "MyList"
        SET "myData" = ?
        WHERE "id" = ?
    `, [JSON.stringify(saved), record.id])
})
```

See `apps/condo/bin/billing/backfillBillingReceiptRawToExternalContent.js` for a complete example.

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
