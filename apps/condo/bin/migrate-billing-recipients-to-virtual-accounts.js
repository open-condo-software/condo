/**
 * Load all billing recipients with manually set up isApproved field (not exists in the model since was migrated to virtual)
 *      and creates corresponding approved bank accounts
 *
 * Usage:
 *      yarn workspace @app/condo node bin/migrate-billing-recipients-to-virtual-accounts
 */

const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')

const { getById } = require('@open-condo/keystone/schema')

const { BankAccount } = require('@condo/domains/banking/utils/serverSchema')
const { BillingRecipient } = require('@condo/domains/billing/utils/serverSchema')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')


// constants section
const DV_AND_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'migrate-recipients-to-virtual-is-approved' } }
const PROCESS_CHUNK_SIZE = 10

// logging functions
function log (msg, params = '') {
    console.log(msg, params)
}

function logCatch (error, params = '') {
    console.error(error)
    console.error(error.message, params)
}

// utility functions
const getTotalApproved = async (context) => {
    const result = await context.adapter.knex('BillingRecipient')
        .count('id')
        .where({ isApproved: true, deletedAt: null })

    return parseInt(result[0].count)
}

const getApprovedRecipientsPage = async (context, offset) => {
    return context.adapter.knex('BillingRecipient')
        .where({ isApproved: true, deletedAt: null })
        .orderBy('createdAt', 'asc')
        .limit(PROCESS_CHUNK_SIZE)
        .offset(offset)
        .select()
}

// the main function
async function main () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    // firstly let's get total count of approved recipients
    const state = {
        total: await getTotalApproved(keystone),
        offset: 0,
        page: 0,
        hasMorePages: true,
        created: 0,
        updated: 0,
        errors: 0,
    }
    const notCreatedAccountRecipientIds = []

    log('Start sync isApproved', state)
    do {
        log(`Sync page #${state.page + 1} of ${Math.ceil(state.total / PROCESS_CHUNK_SIZE)}`)
        const recipients = await getApprovedRecipientsPage(keystone, state.offset)

        // proceed every recipient
        const brokenRecipients = (await Promise.all(recipients.map(async ({ id }) => {
            return await BillingRecipient.getOne(keystone, {
                id,
                context: {
                    deletedAt: null,
                },
            }, 'id tin bic bankAccount context { id }')
        }))).filter(recipient => recipient != null && !recipient.isApproved)

        // for each recipient with not wrongly not approved state -> let's create a bank account
        await Promise.all(brokenRecipients.map(async recipient => {
            try {
                const context = await getById('BillingIntegrationOrganizationContext', recipient.context.id)

                const bankAccountDetails = {
                    tin: recipient.tin,
                    country: RUSSIA_COUNTRY,
                    number: recipient.bankAccount,
                    currencyCode: 'RUB',
                    routingNumber: recipient.bic,
                }

                // next step is check if bank account actually exists, but not approved at the moment
                const [existsOne] = await BankAccount.getAll(keystone, {
                    tin: recipient.tin,
                    country: RUSSIA_COUNTRY,
                    number: recipient.bankAccount,
                    currencyCode: 'RUB',
                    routingNumber: recipient.bic,
                    organization: { id: context.organization },
                    isApproved: false,
                })

                if (existsOne != null) {
                    await BankAccount.update(keystone, existsOne.id, {
                        ...DV_AND_SENDER,
                        isApproved: true,
                        deletedAt: null,
                    })
                    state.updated++
                } else {
                    await BankAccount.create(keystone, {
                        ...bankAccountDetails,
                        ...DV_AND_SENDER,
                        organization: { connect: { id: context.organization } },
                        isApproved: true,
                    })
                    state.created++
                }
            } catch (e) {
                logCatch(e, { recipient: recipient.id })
                notCreatedAccountRecipientIds.push(recipient.id)
                state.errors++
            }
        }))

        // recalculate state
        state.offset += recipients.length
        state.page++
        state.hasMorePages = recipients.length !== 0
    } while (state.hasMorePages)

    // log in case if some accounts can not be created
    if (notCreatedAccountRecipientIds.length > 0) {
        log('Can not create bank accounts for the following recipients', notCreatedAccountRecipientIds)
    }

    log('Done', state)
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
