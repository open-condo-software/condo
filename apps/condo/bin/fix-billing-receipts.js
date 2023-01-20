/**
 * Creates and links billing recipients for all billing receipts
 *
 * Usage:
 *      yarn workspace @app/condo node bin/fix-billing-receipts
 */


const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')
const { get } = require('lodash')

const { BillingReceipt, BillingRecipient } = require('@condo/domains/billing/utils/serverSchema')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')


async function main () {
    const resolved = path.resolve('../index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()


    const adminContext = await keystone.createContext({ skipAccessControl: true })

    const allBillingReceipts = await loadListByChunks({
        context: adminContext,
        list: BillingReceipt,
        chunkSize: 50,
        limit: 100000000,
    })

    console.debug(`Going to process ${allBillingReceipts.length} items`)

    for ( let i = 0; i < allBillingReceipts.length; ++i) {

        const receipt = allBillingReceipts[i]

        // Skip if receipt is softDeleted
        if (receipt.deletedAt) {
            continue
        }

        const receiptId = get(receipt, 'id')
        const recipient = get(receipt, 'recipient')
        const contextId = get(receipt, ['context', 'id'])

        let receiverId
        const sameRecipient = await BillingRecipient.getOne(adminContext, {
            tin: get(recipient, 'tin'),
            iec: get(recipient, 'iec'),
            bic: get(recipient, 'bic'),
            bankAccount: get(recipient, 'bankAccount'),
        })
        if (sameRecipient) {
            receiverId = sameRecipient.id
            console.debug(`Going to link | ${i + 1} from ${allBillingReceipts.length}`)
        } else {
            const createdRecipient = await BillingRecipient.create(adminContext, {
                dv: 1,
                sender: { dv: 1, fingerprint: 'fix-billing-receipts.js' },
                context: { connect: { id: contextId } },
                name: get(recipient, 'name'),
                tin: get(recipient, 'tin'),
                iec: get(recipient, 'iec'),
                bic: get(recipient, 'bic'),
                bankAccount: get(recipient, 'bankAccount'),
                meta: {
                    ...recipient,
                },
            })
            receiverId = createdRecipient.id
            console.debug(`Going to create | ${i + 1} from ${allBillingReceipts.length}`)
        }

        await BillingReceipt.update(adminContext, receiptId, {
            dv: 1,
            sender: { dv: 1, fingerprint: 'fix-billing-receipts.js' },
            receiver: { connect: { id: receiverId } },
        })
    }
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})