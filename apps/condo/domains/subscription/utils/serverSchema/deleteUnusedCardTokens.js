const dayjs = require('dayjs')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')

const { SubscriptionPaymentAdapter } = require('@condo/domains/subscription/tasks/utils/SubscriptionPaymentAdapter')
const { getSubscriptionPaymentRecipient } = require('@condo/domains/subscription/utils/serverSchema/getSubscriptionPaymentRecipient')

const logger = getLogger('deleteUnusedCardTokens')

/**
 * Deletes card tokens on the acquiring side once no other active context of the organization pays with them.
 * The contexts the cards were just detached from are excluded from that check.
 * Failures are only logged: the cards are already detached, a leftover token is harmless
 *
 * @param {{ organizationId: string, bindingIds: string[], detachedContextIds: string[] }} params
 */
async function deleteUnusedCardTokens ({ organizationId, bindingIds, detachedContextIds }) {
    if (!bindingIds || bindingIds.length === 0) return

    const { recipientOrgId, acquiringIntegration } = await getSubscriptionPaymentRecipient()
    if (!recipientOrgId || !acquiringIntegration || !acquiringIntegration.hostUrl) {
        logger.error({ msg: 'subscription payment recipient is not configured, skipping card token deletion', data: { organizationId, cardTokenIds: bindingIds } })
        return
    }

    for (const bindingId of bindingIds) {
        const stillUsedContexts = await find('SubscriptionContext', {
            organization: { id: organizationId },
            bindingId,
            id_not_in: detachedContextIds,
            endAt_gte: dayjs().format('YYYY-MM-DD'),
            deletedAt: null,
        })
        if (stillUsedContexts.length > 0) continue

        try {
            await SubscriptionPaymentAdapter.deleteCardToken({
                hostUrl: acquiringIntegration.hostUrl,
                organizationId,
                cardTokenId: bindingId,
            })
            logger.info({ msg: 'deleted card token from payment gateway', data: { organizationId, cardTokenId: bindingId } })
        } catch (err) {
            logger.error({ msg: 'failed to delete card token from payment gateway', data: { organizationId, cardTokenId: bindingId, error: get(err, 'message') || 'Unknown error' } })
        }
    }
}

module.exports = {
    deleteUnusedCardTokens,
}
