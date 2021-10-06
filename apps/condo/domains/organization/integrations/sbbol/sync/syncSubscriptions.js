const { SbbolRequestApi } = require('../SbbolRequestApi')
const { SbbolFintechApi } = require('../SbbolFintechApi')
const { debugMessage } = require('../common')
const { getItems } = require('@keystonejs/server-side-graphql-client')
const dayjs = require('dayjs')
const { ServiceSubscription } = require('@condo/domains/subscription/utils/serverSchema')
const { SUBSCRIPTION_TRIAL_PERIOD_DAYS } = require('@condo/domains/subscription/constants')

const conf = process.env
const SBBOL_CONFIG = conf.SBBOL_CONFIG ? JSON.parse(conf.SBBOL_CONFIG) : {}

const syncSubscriptions = async ({ context, organization }) => {
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
    const subscriptions = await getItems( {
        ...context,
        listKey: 'ServiceSubscription',
        where: {
            organization: {
                id: organization.id,
            },
            finishAt_gt: dayjs().toISOString(),
        },
        returnFields: 'id',
    })

    if (subscriptions.length > 0 && subscriptions[0].type === 'sbbol') {
        debugMessage('User already have active SBBOL subscription')
    } else {
        debugMessage('No subscriptions found')

        const { inn } = organization.meta
        const today = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

        // `clientId` here, and accessToken, used for initialization of `fintechApi` should be
        // for the same organization
        const advanceAcceptances = await fintechApi.fetchAdvanceAcceptances({ date: today, clientId: SBBOL_CONFIG.client_id })
        const organizationAcceptance = advanceAcceptances.find(({ payerInn }) => (
            payerInn === inn
        ))
        if (!organizationAcceptance) {
            // This is an errored case, because organization cannot be redirected
            // to callback url without accepting offer
            console.error(`No offers found for organization(inn=${inn})`)
        } else {
            if (organizationAcceptance.active) {
                // TODO: add trial for additional day when client accepts previously revoked (after accepting) offer

                debugMessage(`User from organization(inn=${inn}) has accepted our offer in SBBOL`)
                // Дома: Создаём клиенту личный кабинет в системе Дома по условиям оферты
                // Создаём пробную подписку `ServiceSubscription`  на 15 дней
                const now = dayjs()

                // Default trial subscription will be created in `registerOrganization`.
                // In case of ongoing SBBOL subscription, other non-SBBOL subscriptions makes no sense.
                // If active one is present, cut it's period until now.
                const existingSubscription = subscriptions[0]
                if (existingSubscription) {
                    await ServiceSubscription.update(context, existingSubscription.id, {
                        finishAt: dayjs(),
                    })
                }
                const trialServiceSubscription = await ServiceSubscription.create(context, {
                    type: 'sbbol',
                    isTrial: true,
                    organization: { connect: { id: organization.id } },
                    startAt: now,
                    finishAt: now.add(SUBSCRIPTION_TRIAL_PERIOD_DAYS, 'days'),
                })
                debugMessage('Created trial subscription for SBBOL', trialServiceSubscription)
            } else {
                debugMessage(`User from organization(inn=${inn}) has not accepted our offer in SBBOL, do nothing`)
                // TODO: cancel `ServiceSubscription` if exist
            }
        }
    }
}

module.exports = {
    syncSubscriptions,
}