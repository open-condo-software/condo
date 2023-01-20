const dayjs = require('dayjs')
const { get, isEmpty } = require('lodash')

const { BillingIntegrationOrganizationContext } = require('@condo/domains/billing/utils/serverSchema')
const { COUNTRIES, DEFAULT_LOCALE } = require('@condo/domains/common/constants/countries')
const { getMonthStart } = require('@condo/domains/common/utils/date')
const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')

const { EXEC_COMMAND, BASE_NAME, MAX_SEND_COUNT, FORCE_SEND, DATE_FORMAT } = require('./constants')
const { ScriptCore, runFnWithArgs } = require('./script-core')

class BillingContextScriptCore extends ScriptCore {
    constructor ({ messageType, periodRaw, billingContextId, forceSend, maxSendCount }, withPeriod = false) {
        super()

        this.withPeriod = withPeriod

        this.checkArgs(billingContextId, periodRaw)

        this.messageType = messageType
        this.period = withPeriod ? getMonthStart(periodRaw, true) : null
        this.billingContextId = billingContextId
        this.forceSend = forceSend
        this.maxSendCount = maxSendCount
        this.billingContext = null
        this.organization = null
        this.locale = null
    }

    async sendLocalizedMessage (userId, data) {
        return await sendMessage(this.context, {
            lang: this.locale || DEFAULT_LOCALE,
            to: { user: { id: userId } },
            type: this.messageType,
            meta: { dv: 1, data },
            sender: { dv: 1, fingerprint: `condo/bin/${BASE_NAME}` },
        })
    }

    /**
     * Checks CLI args values and consistency
     * @param billingContextId
     * @param periodRaw
     */
    checkArgs (billingContextId, periodRaw) {
        console.info('\r\n')

        if (this.withPeriod) {
            if (!periodRaw || !billingContextId) {
                throw new Error(`No period and billingContextId were provided – please execute like following: ${EXEC_COMMAND} ./bin/${BASE_NAME} <period> <contextId> [${FORCE_SEND}] [<maxSendCount>]`)
            }

            if (!dayjs(periodRaw).isValid()) {
                throw new Error(`Incorrect period format was provided. Expected: ${DATE_FORMAT}`)
            }
        } else {
            if (!billingContextId) {
                throw new Error(`No billingContextId was provided – please execute like following: ${EXEC_COMMAND} ./bin/${BASE_NAME} <contextId> [${FORCE_SEND}] [<maxSendCount>]`)
            }
        }
    }

    /**
     * Loads BillingIntegrationContext data
     * @returns {Promise<void>}
     */
    async loadContextData () {
        try {
            const billingContext = await BillingIntegrationOrganizationContext.getOne(this.context, { id: this.billingContextId, status: CONTEXT_FINISHED_STATUS })

            if (isEmpty(billingContext)) throw new Error(`Provided billingContextId not found or status is not ${CONTEXT_FINISHED_STATUS}`)

            this.billingContext = billingContext

            await this.loadOrganizationData()
        } catch (e) {
            console.log('\r\n')
            console.error(e)

            throw new Error(`Provided billingContextId was invalid ${this.billingContextId}`)
        }
    }

    /**
     * Loads organization data
     * Detect message language by lazy loading organization data and extracting country info from it
     * Use DEFAULT_LOCALE if organization.country is unknown
     * (not defined within @condo/domains/common/constants/countries)
     */
    async loadOrganizationData () {
        if (!this.organization) this.organization = await Organization.getOne(this.context, { id: this.billingContext.organization.id, deletedAt: null })
        if (!this.locale) this.locale = get(COUNTRIES, get(this.organization, 'country.locale'), DEFAULT_LOCALE)
    }
}

/**
 * Initializes instance of given class by CLI args, prepares all connections, runs all checks, then executes proceed method
 * @param Constructor
 * @param messageType
 * @param withPeriod
 * @returns {Promise<void>}
 */
async function prepareAndProceed (Constructor, messageType, withPeriod = false) {
    const _prepareAndProceed = async (_args = []) => {
        let periodRaw, billingContextId, forceSendFlag, maxSendCount

        if (withPeriod) [periodRaw, billingContextId, forceSendFlag, maxSendCount = MAX_SEND_COUNT] = _args
        if (!withPeriod) [billingContextId, forceSendFlag, maxSendCount = MAX_SEND_COUNT] = _args

        const forceSend = forceSendFlag === FORCE_SEND
        const instance = new Constructor({ messageType, billingContextId, periodRaw, forceSend, maxSendCount }, withPeriod)

        await instance.connect()
        await instance.loadContextData()
        await instance.proceed()
    }

    runFnWithArgs(_prepareAndProceed)
}

module.exports = {
    BillingContextScriptCore,
    prepareAndProceed,
}