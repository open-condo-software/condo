const path = require('path')
const dayjs = require('dayjs')
const map = require('lodash/map')

const { GraphQLApp } = require('@keystonejs/app-graphql')
const conf = require('@core/config')

const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')

const { BillingReceipt, BillingProperty, BillingIntegrationOrganizationContext } = require('@condo/domains/billing/utils/serverSchema')
const { BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS } = require('@condo/domains/billing/constants/constants')

const { sendMessage, Message, Device } = require('@condo/domains/notification/utils/serverSchema')
const {
    BILLING_RECEIPT_AVAILABLE_MANUAL_TYPE,
    BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_MANUAL_TYPE,
    MESSAGE_SENT_STATUS, MESSAGE_DELIVERED_STATUS,
    MESSAGE_READ_STATUS, MESSAGE_ERROR_STATUS,
} = require('@condo/domains/notification/constants/constants')

const { Organization } = require('@condo/domains/organization/utils/serverSchema')

const { Property } = require('@condo/domains/property/utils/serverSchema')

const { Resident } = require('@condo/domains/resident/utils/serverSchema')
const get = require('lodash/get')
const { COUNTRIES, DEFAULT_LOCALE } = require('@condo/domains/common/constants/countries')

const BASE_NAME = path.posix.basename(process.argv[1])
const CHUNK_SIZE = 50
const MAX_ROWS_COUNT = 1000000
const CURRENT_MONTH_START = dayjs().date(1).format('YYYY-MM-DD')
const NEXT_MONTH_START = dayjs().date(1).date(40).date(1).format('YYYY-MM-DD')
const MAX_SEND_COUNT = 100

/**
 This script sends push notifications to all users who are:
     * residents of the properties:
        - of the organization with provided billingContextId
        - having at least one billing receipt for provided period on the property
     * have available pushTokens
     * have not been sent this king of notifications during current month yet
 */
class ReceiptsNotificationSender {

    context = null

    constructor ({ billingContextId, period, forceSend, maxSendCount }) {
        this.billingContextId = billingContextId
        this.period = period
        this.billingContext = null
        this.forceSend = forceSend
        this.maxSendCount = maxSendCount
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

    async loadListByChunks (list, where, sortBy, log) {
        return await loadListByChunks({
            context: this.context,
            list,
            where,
            sortBy,
            chunkSize: CHUNK_SIZE,
            limit: MAX_ROWS_COUNT,
            log,
        })
    }

    async testContext () {
        try {
            const billingContext = await BillingIntegrationOrganizationContext.getOne(this.context, { id: this.billingContextId, status: BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS })

            if (billingContext.length === 0) throw new Error(`Provided billingContextId not found or status is not ${BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS}`)

            this.billingContext = billingContext
        } catch (e) {
            throw new Error('Provided billingContextId was invalid')
        }
    }

    async sendMessage (userId, lang, data) {
        return await sendMessage(this.context, {
            lang,
            to: { user: { id: userId } },
            type: BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_MANUAL_TYPE,
            meta: { dv: 1, data },
            sender: { dv: 1, fingerprint: `condo/bin/${BASE_NAME}` },
        })
    }

    async proceed () {
        await this.testContext()

        const receiptsWhere = { context: { id: this.billingContextId, deletedAt: null }, period_in: [this.period], deletedAt: null }
        const receipts = await this.loadListByChunks(BillingReceipt, receiptsWhere)

        if (!receipts.length) {
            console.error('No BillingReceipt records found for provided billingContextId and period')

            return 1
        }

        console.info(`[INFO] ${receipts.length} Receipt rows found.`)

        const billingPropertyIds = [...new Set(map(receipts, 'property.id'))]

        const billingPropertiesWhere = { deletedAt: null, id_in: billingPropertyIds }
        const billingProperties = await this.loadListByChunks(BillingProperty, billingPropertiesWhere)

        console.info(`[INFO] ${billingProperties.length} BillingProperty rows found for ${billingPropertyIds.length} ids:`, billingPropertyIds)

        const propertyAddresses = [...new Set(map(billingProperties, 'address'))]

        console.info(`[INFO] ${propertyAddresses.length} addresses found:`, propertyAddresses)

        const propertiesWhere = { deletedAt: null, address_in: propertyAddresses }
        const properties = await this.loadListByChunks(Property, propertiesWhere)

        const propertyIds = [...new Set(map(properties, 'id'))]

        console.info(`[INFO] ${propertyIds.length} properties found for ${propertyAddresses.length} addresses`)

        const messagesWhere = {
            deletedAt: null,
            type_in: [BILLING_RECEIPT_AVAILABLE_MANUAL_TYPE, BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_MANUAL_TYPE],
            status_in: [MESSAGE_SENT_STATUS, MESSAGE_DELIVERED_STATUS, MESSAGE_READ_STATUS, MESSAGE_ERROR_STATUS],
            createdAt_gte: CURRENT_MONTH_START,
            createdAt_lt: NEXT_MONTH_START,
        }

        const messagesSent = await this.loadListByChunks(Message, messagesWhere)
        const sentUserIds = [...new Set(map(messagesSent, 'user.id'))]

        console.info(`[INFO] ${sentUserIds.length} users already received notifications.`)

        console.info('[INFO] Reading residents info.')

        const residentsWhere = { deletedAt: null, property: { id_in: propertyIds }, user: { id_not_in: sentUserIds } }
        const residents = await this.loadListByChunks(Resident, residentsWhere)

        // get only users, whom we didn't send notifications within current month yet.
        const userIds = [...new Set(map(residents, 'user.id'))]
        const userIdByResidentIds = residents.reduce(
            (acc, resident) => {
                acc[get(resident, 'user.id')] = get(resident, 'id')

                return acc
            },
            {}
        )

        console.info(`[INDO] ${userIds.length} users without notifications found amoung ${residents.length} residents.`)

        const devicesWhere = { deletedAt: null, pushToken_not: null, owner: { id_in: userIds } }
        const devices = await this.loadListByChunks(Device, devicesWhere)
        const deviceUserIds = [...new Set(map(devices, 'owner.id'))]

        if (!this.forceSend) {
            console.info(`[INDO] ${deviceUserIds.length} users with pushTokens found to be sent notifications to amoung ${devices.length} devices.`)

            return 0
        }

        if (this.forceSend) {
            let count = 0
            const organization = await Organization.getOne(this.context, { id: this.billingContext.organization.id, deletedAt: null })
            /**
             * Detect message language
             * Use DEFAULT_LOCALE if organization.country is unknown
             * (not defined within @condo/domains/common/constants/countries)
             */
            const lang = get(COUNTRIES, get(organization, 'country.locale'), DEFAULT_LOCALE)

            for (const userId of deviceUserIds) {
                count++

                const data = {
                    residentId: userIdByResidentIds[userId],
                    userId: userId,
                    url: `${conf.SERVER_URL}/billing/receipts/`,
                }

                await this.sendMessage(userId, lang, data)

                if (count >= this.maxSendCount) break
            }

            console.info(`[INFO] ${count} notifications ${!this.forceSend ? 'to be' : ''} sent.`)
        }
    }
}

async function main ([billingContextId, periodRaw, forceSend, maxSendCount = MAX_SEND_COUNT]) {
    if (!billingContextId || !periodRaw)
        throw new Error(`No billingContextId and period were provided – please use like this: yarn workspace @app/condo node ./bin/${BASE_NAME} <contextId> <period> [FORCE_SEND] [maxSendCount]`)
    if (!dayjs(periodRaw).isValid())
        throw new Error('Incorrect period format was provided. Available: YYYY-MM-01')

    const period = dayjs(periodRaw).date(1).format('YYYY-MM-DD')
    const ReceiptsManager = new ReceiptsNotificationSender({ billingContextId, period, forceSend: forceSend === 'FORCE_SEND', maxSendCount })

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
    process.exit(1)
})
