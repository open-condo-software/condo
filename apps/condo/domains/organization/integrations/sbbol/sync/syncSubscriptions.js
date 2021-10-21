const { SbbolRequestApi } = require('../SbbolRequestApi')
const { SbbolFintechApi } = require('../SbbolFintechApi')
const { debugMessage } = require('../common')
const dayjs = require('dayjs')
const { ServiceSubscription } = require('@condo/domains/subscription/utils/serverSchema')
const { SUBSCRIPTION_TRIAL_PERIOD_DAYS, SUBSCRIPTION_TYPE } = require('@condo/domains/subscription/constants')
const { dvSenderFields } = require('../constants')
const { processArrayOf } = require('@condo/domains/common/utils/parallel')
const { getSchemaCtx } = require('@core/keystone/schema')

const conf = process.env
const SBBOL_CONFIG = conf.SBBOL_CONFIG ? JSON.parse(conf.SBBOL_CONFIG) : {}

async function stop (subscription, context) {
    debugMessage('Stopping subscription', subscription)
    return await ServiceSubscription.update(context, subscription.id, {
        ...dvSenderFields,
        finishAt: dayjs().toISOString(),
    })
}

/**
 * Create or cancel SBBOL subscription, according to changes in advance acceptance
 * @param {AdvanceAcceptance} advanceAcceptance
 * @param active
 * @param context
 * @return {Promise<void>}
 */
const syncSubscriptionsFor = async (advanceAcceptance) => {
    const { payerInn, active } = advanceAcceptance
    const { keystone: context } = await getSchemaCtx('User')
    // GraphQL from Keystone does not supports querying of database fields of type JSON.
    const knex = context.adapter.knex
    const result = await knex('Organization')
        .whereRaw('meta->>\'inn\' = ?', [payerInn])
        .orderBy('createdAt', 'desc')
        .select('id', 'meta')

    const [organization] = result

    if (!organization) {
        debugMessage(`Not found organization with inn=${payerInn} to sync SBBOL subscriptions for`)
        return
    }

    // TODO: What to do with multiple organizations with same inn?
    // Tests will always trigger this error after several passes over the same database
    // if (result.length > 1) {
    //     throw new Error('Multiple organizations with the same inn exists. Its unknown, for what specific organization to create SBBOL subscription')
    // }

    const existingSubscriptions = await ServiceSubscription.getAll(context, {
        organization: {
            id: organization.id,
        },
        finishAt_gt: dayjs().toISOString(),
    })
    const existingSubscription = existingSubscriptions[0]

    if (existingSubscriptions.length > 1) {
        console.error(`More than one subscription found for Organization(id=${organization.id}). It seems strange.`)
    }

    // Client has accepted our offer
    if (active) {
        // TODO: add trial for additional day when client accepts previously revoked (after accepting) offer

        debugMessage(`User from organization(inn=${payerInn}) has accepted our offer in SBBOL`)

        // In case of accepted SBBOL offer new subscription should be started and all current subscriptions will make no sense.
        // If active one is present, stop it by cutting it's period until now.
        // It covers following cases:
        // - When new organization was created and trial default subscription was created
        // - When user has default subscription (trial or not)
        if (existingSubscription) {
            await stop(existingSubscription, context)
        }

        const now = dayjs()
        const trialServiceSubscription = await ServiceSubscription.create(context, {
            ...dvSenderFields,
            type: SUBSCRIPTION_TYPE.SBBOL,
            isTrial: true,
            organization: { connect: { id: organization.id } },
            startAt: now.toISOString(),
            finishAt: now.add(SUBSCRIPTION_TRIAL_PERIOD_DAYS, 'days').toISOString(),
            sbbolOfferAccept: {
                dv: 1,
                data: advanceAcceptance, // TODO: Figure out, why it crashes here on `payerInn` field
            },
        })
        debugMessage('Created trial subscription for SBBOL', trialServiceSubscription)
    } else {
        debugMessage(`User from organization(inn=${payerInn}) has declined our offer in SBBOL`)
        if (existingSubscription.type === SUBSCRIPTION_TYPE.SBBOL) {
            await stop(existingSubscription, context)
        }
    }
}

/**
 * Fetches changes in subscriptions from SBBOL for specified date and creates or stops
 * ServiceSubscriptions, accordingly.
 *
 * @param {String} date - stringified day in format 'YYYY-MM-DD'
 * @return {Promise<void>}
 */
const syncSubscriptions = async (date) => {
    if (!date) throw new Error('date is not specified')
    debugMessage('Start syncSubscriptions')

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

    const advanceAcceptances = await fintechApi.fetchAdvanceAcceptances({ date: '2021-10-08', clientId: SBBOL_CONFIG.client_id })

    if (advanceAcceptances.length === 0) {
        debugMessage('SBBOL returned no changes in offers, do nothing')
    } else {
        await processArrayOf(advanceAcceptances).inSequenceWith(syncSubscriptionsFor)
    }
    debugMessage('End syncSubscriptions')
}

module.exports = {
    syncSubscriptions,
}