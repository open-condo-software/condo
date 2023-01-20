const dayjs = require('dayjs')

const { execGqlWithoutAccess } = require('@open-condo/codegen/generate.server.utils')

const { SUBSCRIPTION_TRIAL_PERIOD_DAYS } = require('../../constants')
const { ServiceSubscription } = require('../../gql')

async function createTrialSubscription (context, organization, extraData) {
    if (!context) throw new Error('no context')
    if (!organization.id) throw new Error('wrong organization.id argument')

    return await execGqlWithoutAccess(context, {
        query: ServiceSubscription.CREATE_OBJ_MUTATION,
        variables: {
            data: {
                organization: { connect: { id: organization.id } },
                type: 'default',
                isTrial: true,
                startAt: dayjs().toISOString(),
                finishAt: dayjs().add(SUBSCRIPTION_TRIAL_PERIOD_DAYS, 'days').toISOString(),
                ...extraData,
            },
        },
        errorMessage: '[error] Create trial subscription internal error',
        dataPath: 'obj',
    })
}

module.exports = {
    createTrialSubscription,
}