const { flatten, uniq } = require('lodash')

const conf = require('@core/config')

const { getStartDates } = require('@condo/domains/common/utils/date')

const { BillingProperty } = require('@condo/domains/billing/utils/serverSchema')

const { Message, Device } = require('@condo/domains/notification/utils/serverSchema')
const {
    RESIDENT_ADD_BILLING_ACCOUNT_TYPE, MESSAGE_SENT_STATUS,
    MESSAGE_DELIVERED_STATUS, MESSAGE_READ_STATUS,
} = require('@condo/domains/notification/constants/constants')

const { Property } = require('@condo/domains/property/utils/serverSchema')

const { Resident, ServiceConsumer } = require('@condo/domains/resident/utils/serverSchema')

const { BillingContextScriptCore, prepareAndProceed } = require('./lib/billing-context-script-core')
const { getUniqueByField, getConnectionsMapping } = require('../lib/helpers')

/**
 This script sends push notifications to all users who are:
     * residents of the properties:
        - of the organization with provided billingContextId
        - and have no accounts added
     * have available pushTokens
     * have not been sent this king of notifications during current month yet
 */
class ResidentsNotificationSender extends BillingContextScriptCore {
    async proceed () {
        const serviceConsumerWhere = { billingIntegrationContext: { id: this.billingContextId, deletedAt: null }, accountNumber_not: null, deletedAt: null }
        const serviceConsumers = await this.loadListByChunks(ServiceConsumer, serviceConsumerWhere)
        const consumerResidentIds = getUniqueByField(serviceConsumers, 'resident.id')

        console.info('[INFO] residents with account numbers found:', consumerResidentIds.length)

        const billingPropertiesWhere = { deletedAt: null, context: { id: this.billingContextId, deletedAt: null } }
        const billingProperties = await this.loadListByChunks(BillingProperty, billingPropertiesWhere)
        const propertyAddresses = getUniqueByField(billingProperties, 'address')

        console.info('[INFO] billing property addresses found within context:', propertyAddresses.length)

        /**
         *  Here we search for all non-deleted properties that are:
         *  - belong to the organization
         *  - match by address non-deleted BillingProperties related to BillingContext of the organization
         */
        const propertiesWhere = { deletedAt: null, organization: { id: this.billingContext.organization.id, deletedAt: null }, address_in: propertyAddresses }
        const properties = await this.loadListByChunks(Property, propertiesWhere)
        const propertyIds = getUniqueByField(properties, 'id')

        console.info('[INFO] properties found matching addresses within organization billing properties:', propertyIds.length)

        const { thisMonthStart, nextMonthStart } = getStartDates()

        console.info('[INFO] Requesting sent messages for period:', { thisMonthStart, nextMonthStart })

        const messagesWhere = {
            deletedAt: null,
            type_in: [this.messageType],
            status_in: [MESSAGE_SENT_STATUS, MESSAGE_DELIVERED_STATUS, MESSAGE_READ_STATUS],
            createdAt_gte: thisMonthStart,
            createdAt_lt: nextMonthStart,
        }

        const messagesSent = await this.loadListByChunks(Message, messagesWhere)
        const sentResidentIds1 = getUniqueByField(messagesSent, 'meta.data', 'residentId')
        const sentResidentIds2 = flatten(getUniqueByField(messagesSent, 'meta.data', 'residentIds'))
        /**
         * Here we build array of ids of all resident that:
         * - has billing account connected
         * - had already been sent notification this month
         */
        const sentResidentIds = uniq([...sentResidentIds1, ...sentResidentIds2])
        const excludeResidentIds = uniq([...consumerResidentIds, ...sentResidentIds])

        console.info('[INFO] residents that already had been sent notifications this month:', sentResidentIds.length)
        console.info('[INFO] residents that will be excluded:', excludeResidentIds.length)

        /**
         * Here we are searching for all non-deleted residents that are:
         * - belong to organization of provided context
         * - haven't received notification of type RESIDENT_ADD_BILLING_ACCOUNT_TYPE yet this month
         * - aren't mentioned in ServiceConsumer relations
         */
        const residentsWhere = { deletedAt: null, property: { id_in: propertyIds }, id_not_in: excludeResidentIds }
        const residents = await this.loadListByChunks(Resident, residentsWhere)
        const userIds = getUniqueByField(properties, 'user.id')
        /**
         * We need userId -> residentId mapping
         */
        const usersToResidentsMapping = getConnectionsMapping(residents, 'user.id')

        console.info(`[INFO] ${userIds.length} users without notifications found among ${residents.length} residents.`)

        const devicesWhere = { deletedAt: null, pushToken_not: null, owner: { id_in: userIds } }
        const devices = await this.loadListByChunks(Device, devicesWhere)
        const deviceUserIds = getUniqueByField(devices, 'owner.id')

        if (!this.forceSend) {
            console.info(`[INFO] ${deviceUserIds.length} users with pushTokens found to be sent notifications to among ${devices.length} devices.`)

            process.exit(0)
        }

        if (this.forceSend) {
            let count = 0

            for (const userId of deviceUserIds) {
                count++

                const data = {
                    userId,
                    residentId: usersToResidentsMapping[userId][0],
                    residentIds: usersToResidentsMapping[userId],
                    url: `${conf.SERVER_URL}/billing/receipts/`,
                    period: this.period,
                }

                await this.sendLocalizedMessage(userId, data)

                if (count >= this.maxSendCount) break
            }

            console.info(`[INFO] ${count} notifications ${!this.forceSend ? 'to be' : ''} sent.`)
        }
    }
}

prepareAndProceed(ResidentsNotificationSender, RESIDENT_ADD_BILLING_ACCOUNT_TYPE).then()
