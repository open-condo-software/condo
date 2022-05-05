const path = require('path')
const dayjs = require('dayjs')
const isEmpty = require('lodash/isEmpty')
const isUndefined = require('lodash/isUndefined')

const { GraphQLApp } = require('@keystonejs/app-graphql')
const conf = require('@core/config')

const { BillingReceipt, BillingIntegrationOrganizationContext } = require('@condo/domains/billing/utils/serverSchema')
const { BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS } = require('@condo/domains/billing/constants/constants')

const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { BILLING_RECEIPT_AVAILABLE_MANUAL_TYPE } = require('@condo/domains/notification/constants/constants')

const { Organization } = require('@condo/domains/organization/utils/serverSchema')

const { Resident, ServiceConsumer } = require('@condo/domains/resident/utils/serverSchema')
const get = require('lodash/get')
const { COUNTRIES, DEFAULT_LOCALE } = require('@condo/domains/common/constants/countries')

const BASE_NAME = path.posix.basename(process.argv[1])

class ReceiptsNotificationSender {

    context = null

    constructor ({ billingContextId, period, logOnly }) {
        this.billingContextId = billingContextId
        this.period = period
        this.billingContext = null
        this.logOnly = logOnly
    }

    async connect () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        // we need only apollo
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async proceed () {
        try {
            const billingContext = await BillingIntegrationOrganizationContext.getOne(this.context, { id: this.billingContextId, status: BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS })

            if (billingContext.length === 0) throw new Error(`Provided billingContextId not found or status is not ${BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS}`)

            this.billingContext = billingContext
        } catch (e) {
            throw new Error('Provided billingContextId was invalid')
        }

        const receiptsWhere = { context: { id: this.billingContextId, deletedAt: null }, period_in: [this.period], deletedAt: null }
        const receipts = await BillingReceipt.getAll(this.context, receiptsWhere)

        if (!receipts.length) {
            console.error('No BillingReceipt records for provided billingContextId and period')

            return 1
        }

        for (const receipt of receipts) {
            // don't send notification if there is no debt on a bill
            if (+receipt.toPay <= 0) continue

            const serviceConsumerWhere = { billingIntegrationContext: { id: this.billingContextId, deletedAt: null }, billingAccount: { id: receipt.account.id, deletedAt: null }, deletedAt: null }
            const serviceConsumers = await ServiceConsumer.getAll(this.context, serviceConsumerWhere)

            if (isEmpty(serviceConsumers)) continue

            for (const consumer of serviceConsumers) {
                const resident = await Resident.getOne(this.context, { id: consumer.resident.id, deletedAt: null })
                const data = {
                    receiptId: receipt.id,
                    residentId: resident.id,
                    userId: resident.user.id,
                    accountId: receipt.account.id,
                    url: `${conf.SERVER_URL}/billing/receipts/${receipt.id}`,
                }

                if (this.logOnly) {
                    console.info('[INFO] Billing receipt available for userId: ', resident.user.id)
                } else {
                    const organization = await Organization.getOne(this.context, { id: resident.organization.id, deletedAt: null })

                    /**
                     * Detect message language
                     * Use DEFAULT_LOCALE if organization.country is unknown
                     * (not defined within @condo/domains/common/constants/countries)
                     */
                    const lang = get(COUNTRIES, [organization.country, 'locale'], DEFAULT_LOCALE)

                    await sendMessage(this.context, {
                        lang,
                        to: { user: { id: resident.user.id } },
                        type: BILLING_RECEIPT_AVAILABLE_MANUAL_TYPE,
                        meta: { dv: 1, data },
                        sender: { dv: 1, fingerprint: `condo/bin/${BASE_NAME}` },
                    })

                }
            }
        }
    }
}

async function main ([billingContextId, periodRaw, logOnly]) {
    if (!billingContextId || !periodRaw)
        throw new Error(`No billingContextId and period were provided – please use like this: yarn workspace @app/condo node ./bin/${BASE_NAME} <contextId> <period> [<logOnly>]`)
    if (!dayjs(periodRaw).isValid())
        throw new Error('Incorrect period format was provided. Available: YYYY-MM-01')

    const period = dayjs(periodRaw).date(1).format('YYYY-MM-DD')
    const ReceiptsManager = new ReceiptsNotificationSender({ billingContextId, period, logOnly: !isUndefined(logOnly) })

    console.time('keystone')
    await ReceiptsManager.connect()
    console.timeEnd('keystone')

    await ReceiptsManager.proceed()
}

main(process.argv.slice(2)).then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
})
