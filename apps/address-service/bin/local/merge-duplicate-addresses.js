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

const PropertyGQL = generateGqlQueries('Property', '{ id addressKey }')
const AddressGQL = generateGqlQueries('Address', '{ id key possibleDuplicateOf { id key } }')

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
    const condoApiUrl = process.env.CONDO_API_URL
    const email = process.env.CONDO_USER
    const password = process.env.CONDO_PASSWORD
    const addressServiceApiUrl = process.env.ADDRESS_SERVICE_API_URL

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
async function isAddressReferenced (condoClient, addressId) {
    if (!addressId) return false
    const properties = await condoClient.getModels({
        modelGql: PropertyGQL,
        where: { addressKey: addressId, deletedAt: null },
        first: 1,
    })
    return properties.length > 0
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

async function main (args) {
    const isDryRun = args.includes('--dry-run')
    if (isDryRun) {
        console.info('DRY RUN mode — no changes will be written')
    }

    const { condoClient, addressClient } = await createClients()
    console.info('Signed in to condo and address-service')

    const pageSize = 100
    let skip = 0
    let totalProcessed = 0
    let totalMerged = 0
    let totalSkipped = 0

    let addresses
    do {
        addresses = await addressClient.getModels({
            modelGql: AddressGQL,
            where: { possibleDuplicateOf_is_null: false, deletedAt: null },
            first: pageSize,
            skip,
            sortBy: ['createdAt_ASC'],
        })

        for (const address of addresses) {
            totalProcessed++
            const target = address.possibleDuplicateOf

            console.info(`\n  Processing: ${address.id} (key: ${address.key})`)
            console.info(`    Target:   ${target.id} (key: ${target.key})`)

            // Check which address id is actually used in condo Properties
            const currentReferenced = await isAddressReferenced(condoClient, address.id)
            const targetReferenced = await isAddressReferenced(condoClient, target.id)

            let winner, loser

            if (currentReferenced && targetReferenced) {
                console.info('    SKIP: both addresses are referenced in condo Properties')
                totalSkipped++
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

            console.info(`    Winner: ${winner.id}, Loser: ${loser.id} (current=${currentReferenced ? 'ref' : '-'}, target=${targetReferenced ? 'ref' : '-'})`)

            if (!isDryRun) {
                try {
                    const status = await resolveDuplicate(addressClient, address.id, winner.id)
                    console.info(`    Result: ${status}`)
                    totalMerged++
                } catch (err) {
                    console.info(`    SKIP (server error): ${err.message}`)
                    totalSkipped++
                }
            } else {
                totalMerged++
            }
        }

        // After merging, some addresses lose possibleDuplicateOf, so reset skip
        if (!isDryRun) {
            skip = 0
        } else {
            skip += Math.min(pageSize, addresses.length)
        }
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
