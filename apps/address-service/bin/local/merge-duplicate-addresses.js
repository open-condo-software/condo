/**
 * Bulk auto-merge duplicate addresses for clear cases.
 * Runs locally — connects to condo and address-service as remote GraphQL clients.
 *
 * For each Address with possibleDuplicateOf IS NOT NULL:
 *   1. Identify the two candidate addresses (current + possibleDuplicateOf target)
 *   2. Determine the winner by checking which Address.id is referenced
 *      in the condo database (Property.addressKey = Address.id)
 *   3. Auto-merge clear cases (only one is referenced, or neither)
 *      via the resolveAddressDuplicate mutation
 *   4. Skip ambiguous cases (both are referenced) for admin manual resolution
 *
 * See bin/local/README.md for setup instructions.
 *
 * Usage:
 *      node apps/address-service/bin/local/merge-duplicate-addresses.js [--dry-run]
 */

const { gql } = require('graphql-tag')

const { ApolloServerClient } = require('@open-condo/apollo-server-client')
const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const conf = require('@open-condo/config')

const PropertyGQL = generateGqlQueries('Property', '{ id addressKey }')
const AddressGQL = generateGqlQueries('Address', '{ id key possibleDuplicateOf { id key } }')
const PROGRESS_BAR_WIDTH = 20

const RESOLVE_ADDRESS_DUPLICATE_MUTATION = gql`
    mutation resolveAddressDuplicate ($data: ResolveAddressDuplicateInput!) {
        result: resolveAddressDuplicate(data: $data) { status }
    }
`

/**
 * Create condo + address-service clients from environment variables.
 * Signs into condo first, then into address-service via OIDC (signInToMiniApp).
 */
async function createClients () {
    const condoApiUrl = conf['CONDO_API_URL']
    const email = conf['CONDO_USER']
    const password = conf['CONDO_PASSWORD']
    const addressServiceApiUrl = conf['ADDRESS_SERVICE_API_URL']

    if (!condoApiUrl || !email || !password || !addressServiceApiUrl) {
        throw new Error(
            'Missing required environment variables.\n' +
            'Required: CONDO_API_URL, CONDO_USER, CONDO_PASSWORD, ADDRESS_SERVICE_API_URL\n' +
            'See bin/local/.env.example for reference.'
        )
    }

    const condoClient = new ApolloServerClient(condoApiUrl, { identity: email, secret: password }, { clientName: 'merge-dup-condo' })
    await condoClient.signIn()

    const addressClient = await condoClient.signInToMiniApp(addressServiceApiUrl)

    return { condoClient, addressClient }
}

/**
 * Check if an address id is referenced by any Property in condo.
 * Property.addressKey stores Address.id.
 */
async function getReferencedAddressIds (condoClient, addressIds) {
    const uniqueAddressIds = [...new Set(addressIds.filter(Boolean))]
    if (uniqueAddressIds.length === 0) return new Set()

    const properties = await condoClient.getModels({
        modelGql: PropertyGQL,
        where: { addressKey_in: uniqueAddressIds, deletedAt: null },
    })

    return new Set(properties.map((property) => property.addressKey).filter(Boolean))
}

/**
 * Call the resolveAddressDuplicate mutation on the address-service.
 */
async function resolveDuplicate (addressClient, addressId, winnerId) {
    const { data, errors } = await addressClient.executeAuthorizedMutation({
        mutation: RESOLVE_ADDRESS_DUPLICATE_MUTATION,
        variables: {
            data: {
                dv: 1,
                sender: { dv: 1, fingerprint: 'merge-duplicate-addresses' },
                addressId,
                action: 'merge',
                winnerId,
            },
        },
    })

    if (errors && errors.length > 0) {
        const messages = errors.map((e) => e.message).join('; ')
        throw new Error(`resolveAddressDuplicate failed for addressId=${addressId} winnerId=${winnerId}: ${messages}`)
    }

    if (!data || !data.result) {
        throw new Error(`resolveAddressDuplicate returned empty result for addressId=${addressId} winnerId=${winnerId}`)
    }

    return data.result.status
}

function formatProgressBar (current, total, width = PROGRESS_BAR_WIDTH) {
    const safeTotal = total > 0 ? total : 1
    const ratio = Math.min(current / safeTotal, 1)
    const filled = Math.round(ratio * width)
    return `[${'#'.repeat(filled)}${'-'.repeat(width - filled)}]`
}

async function main (args) {
    const isDryRun = args.includes('--dry-run')
    if (isDryRun) {
        console.info('DRY RUN mode — no changes will be written')
    }

    const { condoClient, addressClient } = await createClients()
    console.info('Signed in to condo and address-service')

    const pageSize = 100
    const duplicateWhere = { possibleDuplicateOf_is_null: false, deletedAt: null }
    const totalRecords = await addressClient.getCount({
        modelGql: AddressGQL,
        where: duplicateWhere,
    })
    const totalPages = Math.ceil(totalRecords / pageSize)

    console.info(`Total to process: ${totalRecords} records across ~${totalPages} pages (pageSize=${pageSize})`)

    let skip = 0
    let pageNumber = 0
    let totalProcessed = 0
    let totalMerged = 0
    let totalSkipped = 0

    let addresses
    do {
        pageNumber++
        addresses = await addressClient.getModels({
            modelGql: AddressGQL,
            where: duplicateWhere,
            first: pageSize,
            skip,
            sortBy: ['createdAt_ASC'],
        })

        if (addresses.length === 0) break

        console.info(`\nPage ${pageNumber}/${totalPages || '?'}: ${addresses.length} records`)

        const referencedAddressIds = await getReferencedAddressIds(
            condoClient,
            addresses.flatMap((address) => [address.id, address.possibleDuplicateOf && address.possibleDuplicateOf.id])
        )

        let pageSkipped = 0
        let pageProcessed = 0

        for (const address of addresses) {
            totalProcessed++
            pageProcessed++

            const progress = formatProgressBar(pageProcessed, addresses.length)
            const progressLine = `${progress} batch=${pageNumber}/${totalPages || '?'} page ${pageProcessed}/${addresses.length} global=${totalProcessed}/${totalRecords} merged=${totalMerged} skipped=${totalSkipped}`
            const target = address.possibleDuplicateOf

            if (!target) {
                console.info(`${progressLine} | SKIP null target | current=${address.id || '-'}`)
                console.info(`  current key: ${address.key || '-'}`)
                totalSkipped++
                pageSkipped++
                continue
            }

            // Check which address id is actually used in condo Properties
            const currentReferenced = referencedAddressIds.has(address.id)
            const targetReferenced = referencedAddressIds.has(target.id)

            let winner, loser

            if (currentReferenced && targetReferenced) {
                console.info(`${progressLine} | SKIP both referenced | current=${address.id || '-'} target=${target.id || '-'}`)
                console.info(`  current key: ${address.key || '-'}`)
                console.info(`  target  key: ${target.key || '-'}`)
                totalSkipped++
                pageSkipped++
                continue
            } else if (currentReferenced) {
                winner = address
                loser = target
            } else if (targetReferenced) {
                winner = target
                loser = address
            } else {
                // Neither is referenced — target (existing) wins by default
                winner = target
                loser = address
            }

            console.info(
                `${progressLine} | MERGE winner=${winner.id} loser=${loser.id} current=${currentReferenced ? 'ref' : '-'} target=${targetReferenced ? 'ref' : '-'}`
            )
            console.info(`  current key: ${address.key || '-'}`)
            console.info(`  target  key: ${target.key || '-'}`)

            if (!isDryRun) {
                try {
                    const status = await resolveDuplicate(addressClient, address.id, winner.id)
                    console.info(`  result: ${status}`)
                    totalMerged++
                } catch (err) {
                    console.info(`  SKIP (server error): ${err.message}`)
                    totalSkipped++
                    pageSkipped++
                }
            } else {
                totalMerged++
                pageSkipped++
            }
        }

        console.info(`Page ${pageNumber} done: processed=${pageProcessed}, merged=${totalMerged}, skipped=${totalSkipped}`)

        // Advance skip past records that remain in query results (skipped/unmerged).
        // In non-dry-run mode merged records disappear from the query, so only
        // skipped ones need to be stepped over. In dry-run nothing is removed.
        skip += isDryRun ? addresses.length : pageSkipped
    } while (addresses.length > 0)

    console.info(`\nSummary: ${totalProcessed} processed, ${totalMerged} merged, ${totalSkipped} skipped`)
}

main(process.argv.slice(2)).then(
    () => {
        console.info('All done!')
        process.exit()
    },
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
