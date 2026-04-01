/**
 * Server-side backfill script to migrate inline JSON fields to ExternalContent (file-meta).
 * 
 * This script reads raw JSONB data directly from the database (bypassing GraphQL resolvers)
 * and triggers the ExternalContent field's save logic to migrate inline JSON to external files.
 *
 * Usage:
 *   yarn workspace @app/condo node bin/backfillExternalContentField.js \
 *     --schema billing.BillingReceipt --field raw \
 *     [--filter '{"organization":"<uuid>"}']
 *
 * Parameters:
 *   --schema <domain.model>  Schema in format 'domain.model' (e.g., billing.BillingReceipt) [required]
 *   --field <name>           Field name to migrate (e.g., raw) [required]
 *   --filter <json>          Optional JSON filter for WHERE clause (e.g., '{"organization":"<uuid>"}')
 *   --batch-size <n>         Rows per page (default: 250)
 *   --max-records <n>        Stop after processing N records
 *   --progress-every <n>     Log progress every N records (default: 1000)
 *   --dry-run                Do not write files or update database
 *   --continue-on-error      Continue processing on error instead of stopping
 */
const path = require('path')

const commander = require('commander')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')
const { itemsQuery } = require('@open-condo/keystone/schema')
const { isFileMeta } = require('@open-condo/keystone/utils/externalContentFieldType')

const { prompt } = require('./lib/prompt')

function parseJsonFilter (filterStr) {
    if (!filterStr) return null
    try {
        const parsed = JSON.parse(filterStr)
        if (typeof parsed !== 'object' || parsed === null) {
            throw new Error('Filter must be a JSON object')
        }
        return parsed
    } catch (err) {
        throw new Error(`Invalid JSON filter: ${err.message}`)
    }
}

const program = new commander.Command()
program
    .requiredOption('-s, --schema <domain.model>', 'Schema in format domain.model (e.g., billing.BillingReceipt)')
    .requiredOption('-f, --field <name>', 'Field name to migrate (e.g., raw)')
    .option('--filter <json>', 'Optional JSON filter for WHERE clause (e.g., \'{"organization":"<uuid>"}\')')
    .option('--batch-size <n>', 'Rows per page (default: 250)', (v) => parseInt(v, 10), 250)
    .option('--max-records <n>', 'Stop after processing N records', (v) => parseInt(v, 10))
    .option('--progress-every <n>', 'Log progress every N processed records (default: 1000)', (v) => parseInt(v, 10), 1000)
    .option('--dry-run', 'Do not write files or update database', false)
    .option('--continue-on-error', 'Continue processing on error instead of stopping', false)

async function main () {
    program.parse()
    const opts = program.opts()

    const schema = opts.schema
    const field = opts.field
    
    if (!schema || !field) {
        console.error('❌ Error: --schema and --field are required')
        program.help()
        process.exit(1)
    }

    // Parse schema into domain and model
    const [domain, model] = schema.split('.')
    if (!domain || !model) {
        throw new Error('Invalid --schema format. Expected: domain.model (e.g., billing.BillingReceipt)')
    }

    let filter = null
    if (opts.filter) {
        try {
            filter = parseJsonFilter(opts.filter)
        } catch (err) {
            throw new Error(`Invalid --filter: ${err.message}`)
        }
    }

    const warnings = []
    if (!filter) warnings.push(`--filter is not set: ALL records in "${model}" will be processed`)

    if (warnings.length > 0) {
        console.log('\n⚠️  Warning:')
        for (const w of warnings) console.log(`   ${w}`)
        console.log('')
        const answer = await prompt('Are you sure you want to continue? (Y/N)', false, 'N')
        if (answer.toUpperCase() !== 'Y') {
            console.log('Aborted.')
            process.exit(0)
        }
    }

    const batchSize = opts.batchSize
    if (!Number.isFinite(batchSize) || batchSize <= 0) {
        throw new Error('Invalid --batch-size')
    }

    const maxRecords = opts.maxRecords
    if (maxRecords != null && (!Number.isFinite(maxRecords) || maxRecords <= 0)) {
        throw new Error('Invalid --max-records')
    }

    const progressEvery = opts.progressEvery
    if (!Number.isFinite(progressEvery) || progressEvery <= 0) {
        throw new Error('Invalid --progress-every')
    }

    // Load server utils dynamically based on domain for update operations
    const serverUtilsPath = path.resolve(__dirname, `../domains/${domain}/utils/serverSchema`)
    let serverUtils
    try {
        serverUtils = require(serverUtilsPath)
    } catch (err) {
        throw new Error(`Failed to load server utils from ${serverUtilsPath}: ${err.message}`)
    }

    if (!serverUtils[model]) {
        throw new Error(`Model "${model}" not found in server utils. Available models: ${Object.keys(serverUtils).join(', ')}`)
    }

    // Initialize Keystone app
    console.log('\n🔧 Initializing Keystone app...')
    const { keystone } = await prepareKeystoneExpressApp(path.resolve(__dirname, '..'))
    const context = await keystone.createContext({ skipAccessControl: true })

    let processed = 0
    let failed = 0
    let skipped = 0
    let lastProcessedId = null
    const failedRecords = []

    console.log('\n🚀 Starting backfill...')
    console.log('Configuration:')
    console.log(`  Schema: ${schema}`)
    console.log(`  Field: ${field}`)
    console.log(`  Filter: ${filter ? JSON.stringify(filter) : 'NONE (all records)'}`)
    console.log(`  Batch size: ${batchSize}`)
    console.log(`  Max records: ${maxRecords || 'unlimited'}`)
    console.log(`  Dry run: ${opts.dryRun ? 'YES (no changes will be made)' : 'NO'}`)
    console.log(`  Continue on error: ${opts.continueOnError ? 'YES' : 'NO'}`)
    console.log('\n⚠️  Important:')
    console.log('  - Do NOT run multiple instances of this script concurrently')
    console.log('  - Running concurrent instances will process duplicate records')
    console.log('\n📋 Process:')
    console.log(`  1. Query ${model} records with inline JSON ${field} data from database`)
    console.log('  2. Detect records with inline JSON (not file-meta)')
    console.log('  3. Update records to trigger ExternalContent field migration')
    console.log('')

    let hasMore = true
    let batchNumber = 0
    while (hasMore) {
        batchNumber++
        console.log(`\n🔍 Fetching batch #${batchNumber} (up to ${batchSize} records)...`)
        
        // Build where clause
        const whereConditions = [
            { deletedAt: null },
        ]
        
        // Add filter conditions
        if (filter) {
            whereConditions.push(filter)
        }

        const where = whereConditions.length === 1 ? whereConditions[0] : { AND: whereConditions }
        
        // Calculate skip offset for this batch
        const skip = (batchNumber - 1) * batchSize

        let rows = []
        try {
            // Use itemsQuery to read raw database values without GraphQL resolver processing
            // This gives us the actual JSONB data, not the resolved ExternalContent
            rows = await itemsQuery(model, {
                where,
                sortBy: ['id_ASC'],
                first: batchSize,
                skip,
            })
        } catch (err) {
            console.error(`❌ Error fetching records: ${err.message}`)
            throw err
        }
        
        hasMore = rows.length > 0
        if (!hasMore) {
            console.log('   No more records found.')
            continue
        }
        console.log(`   Found ${rows.length} record(s) to process`)

        for (const row of rows) {
            const { id } = row
            
            // Read raw field value directly from database (bypassing GraphQL resolver)
            // This gives us the actual JSONB value, not the processed ExternalContent value
            const rawFieldValue = row[field]
            
            // Check if we've reached the max records limit before processing
            if (maxRecords && processed >= maxRecords) {
                console.log(`\n⚠️  Reached max records limit (${maxRecords}). Stopping.`)
                console.log(`   Last processed ID: ${lastProcessedId}`)
                hasMore = false
                break
            }

            // Validate that field value is not null and not already a file-meta object
            if (!rawFieldValue) {
                console.log(`   ⏭️  Skipping ${id}: ${field} is null`)
                skipped++
                lastProcessedId = id
                continue
            }
            
            // Parse JSON string if needed (database stores serialized JSON)
            let fieldValue = rawFieldValue
            if (typeof rawFieldValue === 'string') {
                try {
                    fieldValue = JSON.parse(rawFieldValue)
                } catch (err) {
                    // If parsing fails, it's not JSON - skip it
                    console.log(`   ⏭️  Skipping ${id}: ${field} is not valid JSON`)
                    skipped++
                    lastProcessedId = id
                    continue
                }
            }
            
            if (isFileMeta(fieldValue)) {
                console.log(`   ⏭️  Skipping ${id}: already has file metadata`)
                skipped++
                lastProcessedId = id
                continue
            }

            if (opts.dryRun) {
                const payloadSize = Buffer.byteLength(JSON.stringify(fieldValue ?? null), 'utf-8')
                console.log(`   🔍 [DRY RUN] Would migrate ${id}: ${(payloadSize / 1024).toFixed(2)} KB`)
            } else {
                try {
                    const payloadSize = Buffer.byteLength(JSON.stringify(fieldValue ?? null), 'utf-8')
                    console.log(`   💾 Migrating ${id}: ${(payloadSize / 1024).toFixed(2)} KB`)
                    
                    // Update the model with the same field data
                    // This will trigger the ExternalContent field's save logic to:
                    // 1. Serialize the JSON data
                    // 2. Save it to a file via the adapter
                    // 3. Store file-meta reference in the database
                    await serverUtils[model].update(context, id, {
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'backfill-external-content-field' },
                        [field]: fieldValue,
                    })
                    
                    console.log(`   ✅ Successfully migrated ${id}`)
                } catch (err) {
                    failed++
                    failedRecords.push({ id, error: err.message })
                    console.error(`   ❌ Failed to process ${id}: ${err.message}`)
                    console.error(`      Error details: ${err.stack}`)
                    
                    if (!opts.continueOnError) {
                        throw err
                    }
                    // Continue to next record
                    lastProcessedId = id
                    continue
                }
            }

            processed++
            lastProcessedId = id

            if (processed % progressEvery === 0) {
                console.log(`📊 Progress: ${processed} records processed (last processed ID: ${lastProcessedId})`)  
            }
        }

        if (maxRecords && processed >= maxRecords) break
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Backfill completed!')
    console.log('='.repeat(60))
    console.log(`   Schema: ${schema}`)
    console.log(`   Field: ${field}`)
    console.log(`   Total records processed: ${processed}`)
    console.log(`   Total records skipped: ${skipped}`)
    console.log(`   Total records failed: ${failed}`)
    console.log(`   Total batches: ${batchNumber}`)
    console.log(`   Last processed record (ID): ${lastProcessedId || 'none'}`)
    if (failed > 0) {
        console.log('\n   ⚠️  Failed records:')
        failedRecords.slice(0, 10).forEach(({ id, error }) => {
            console.log(`      - ${id}: ${error}`)
        })
        if (failedRecords.length > 10) {
            console.log(`      ... and ${failedRecords.length - 10} more`)
        }
    }
    if (opts.dryRun) {
        console.log('\n   ⚠️  DRY RUN - No changes were made to the database')
        console.log('   Run without --dry-run to apply changes')
    } else {
        console.log('\n   ✅ All changes have been saved to the database')
    }
    console.log('='.repeat(60))
}

main().then(() => {
    console.info('✅ All done!')
    process.exit()
}).catch((e) => {
    console.error('❌ Script failed:', e)
    process.exit(1)
})
