const dayjs = require('dayjs')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')

const { SUBSCRIPTION_PAYMENT_BUFFER_DAYS } = require('@condo/domains/subscription/constants')
const { SubscriptionPaymentAdapter } = require('@condo/domains/subscription/tasks/utils/SubscriptionPaymentAdapter')
const { getSubscriptionPaymentRecipient } = require('@condo/domains/subscription/utils/serverSchema/getSubscriptionPaymentRecipient')

const logger = getLogger('deleteUnusedCardTokens')

/**
 * Deletes card tokens on the acquiring side once no context of the organization pays with them anymore.
 * Call it after the cards are detached from the contexts. Failures are only logged: a leftover token is harmless
 *
 * @param {{ organizationId: string, bindingIds: string[] }} params
 */
async function deleteUnusedCardTokens ({ organizationId, bindingIds }) {
    if (!bindingIds || bindingIds.length === 0) return

    const { recipientOrgId, acquiringIntegration } = await getSubscriptionPaymentRecipient()
    if (!recipientOrgId || !acquiringIntegration || !acquiringIntegration.hostUrl) {
        logger.error({ msg: 'subscription payment recipient is not configured, skipping card token deletion', data: { organizationId } })
        return
    }

    for (const bindingId of bindingIds) {
        const stillUsedContexts = await find('SubscriptionContext', {
            organization: { id: organizationId },
            bindingId,
            // still renewed with this card within the buffer window
            endAt_gte: dayjs().subtract(SUBSCRIPTION_PAYMENT_BUFFER_DAYS, 'days').format('YYYY-MM-DD'),
            deletedAt: null,
        })
        if (stillUsedContexts.length > 0) continue

        try {
            await SubscriptionPaymentAdapter.deleteCardToken({
                hostUrl: acquiringIntegration.hostUrl,
                organizationId,
                cardTokenId: bindingId,
            })
            logger.info({ msg: 'deleted card token from payment gateway', data: { organizationId } })
        } catch (err) {
            logger.error({ msg: 'failed to delete card token from payment gateway', data: { organizationId, error: get(err, 'message') || 'Unknown error' } })
        }
    }
}

module.exports = {
    deleteUnusedCardTokens,
}
