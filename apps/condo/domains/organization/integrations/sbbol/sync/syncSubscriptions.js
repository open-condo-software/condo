const { SbbolRequestApi } = require('../SbbolRequestApi')
const { SbbolFintechApi } = require('../SbbolFintechApi')
const { debugMessage } = require('../common')
const dayjs = require('dayjs')
const { ServiceSubscription } = require('@condo/domains/subscription/utils/serverSchema')
const { SUBSCRIPTION_TRIAL_PERIOD_DAYS, SUBSCRIPTION_TYPE } = require('@condo/domains/subscription/constants')
const { dvSenderFields } = require('../constants')

const conf = process.env
const SBBOL_CONFIG = conf.SBBOL_CONFIG ? JSON.parse(conf.SBBOL_CONFIG) : {}

async function stop (subscription, context) {
    debugMessage('Stopping subscription', subscription)
    return await ServiceSubscription.update(context.keystone, subscription.id, {
        ...dvSenderFields,
        finishAt: dayjs().toISOString(),
    })
}

/**
 * Fetches changes in subscriptions from SBBOL for specified date and creates or stops
 * ServiceSubscriptions, accordingly.
 *
 * @param {KeystoneContext} context
 * @param organization
 * @return {Promise<void>}
 */
const syncSubscriptions = async ({ context, organization, date }) => {
    if (!organization) {
        console.error('organization param is not defined')
    }

    let ourOrganizationAccessToken
    try {
        // `service_organization_hashOrgId` is a `userInfo.HashOrgId` from SBBOL, that used to obtain accessToken
        // for organization, that will be queried in SBBOL using `SbbolFintechApi`.
        ourOrganizationAccessToken = await SbbolRequestApi.getOrganizationAccessToken(SBBOL_CONFIG.service_organization_hashOrgId)
    } catch (e) {
        console.error(e.message)
        return
    }
    console.debug('ourOrganizationAccessToken', ourOrganizationAccessToken)
    const fintechApi = new SbbolFintechApi(ourOrganizationAccessToken)
    debugMessage('Checking, whether the user have ServiceSubscription items')

    const existingSubscriptions = await ServiceSubscription.getAll(context.keystone, {
        organization: {
            id: organization.id,
        },
        finishAt_gt: dayjs().toISOString(),
    })
    const existingSubscription = existingSubscriptions[0]

    const { inn } = organization.meta

    const advanceAcceptances = await fintechApi.fetchAdvanceAcceptances({ date, clientId: SBBOL_CONFIG.client_id })
    const organizationAcceptance = advanceAcceptances.find(({ payerInn }) => (
        payerInn === inn
    ))

    if (!organizationAcceptance) {
        // This is an errored case, because organization cannot be redirected
        // to callback url without accepting offer
        debugMessage(`SBBOL returned no changes in offers for organization(inn=${inn}), do nothing`)
    } else {
        // Client has accepted our offer
        if (organizationAcceptance.active) {
            // TODO: add trial for additional day when client accepts previously revoked (after accepting) offer

            debugMessage(`User from organization(inn=${inn}) has accepted our offer in SBBOL`)

            // In case of accepted SBBOL offer new subscription should be started and all current subscriptions will make no sense.
            // If active one is present, stop it by cutting it's period until now.
            // It covers following cases:
            // - When new organization was created and trial default subscription was created
            // - When user has default subscription (trial or not)
            if (existingSubscription) {
                await stop(existingSubscription, context)
            }

            const now = dayjs()
            const trialServiceSubscription = await ServiceSubscription.create(context.keystone, {
                ...dvSenderFields,
                type: SUBSCRIPTION_TYPE.SBBOL,
                isTrial: true,
                organization: { connect: { id: organization.id } },
                startAt: now.toISOString(),
                finishAt: now.add(SUBSCRIPTION_TRIAL_PERIOD_DAYS, 'days').toISOString(),
            })
            debugMessage('Created trial subscription for SBBOL', trialServiceSubscription)
        } else {
            debugMessage(`User from organization(inn=${inn}) has declined our offer in SBBOL`)
            if (existingSubscription.type === SUBSCRIPTION_TYPE.SBBOL) {
                await stop(existingSubscription, context)
            }
        }
    }
}

module.exports = {
    syncSubscriptions,
}