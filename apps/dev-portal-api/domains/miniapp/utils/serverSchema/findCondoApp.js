const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { getByCondition } = require('@open-condo/keystone/schema')

const { productionClient, developmentClient } = require('@dev-portal-api/domains/common/utils/serverClients')
const { CondoB2CAppGql } = require('@dev-portal-api/domains/condo/gql')
const { APP_NOT_FOUND } = require('@dev-portal-api/domains/miniapp/constants/errors')
const { PROD_ENVIRONMENT } = require('@dev-portal-api/domains/miniapp/constants/publishing')



const ERRORS = {
    APP_NOT_FOUND: {
        code: BAD_USER_INPUT,
        type: APP_NOT_FOUND,
        message: 'The application with the specified ID was not found',
        messageForUser: 'api.miniapp.B2CApp.APP_NOT_FOUND',
    },
}

async function findCondoApp ({ args, context }) {
    const { data: { app: { id }, environment } } = args

    const exportField = `${environment}ExportId`
    const serverClient = environment === PROD_ENVIRONMENT
        ? productionClient
        : developmentClient

    const app = await getByCondition('B2CApp', { id, deletedAt: null })
    if (!app || !app[exportField]) {
        throw new GQLError(ERRORS.APP_NOT_FOUND, context)
    }

    const condoAppId = app[exportField]
    const condoApp = await serverClient.findExportedModel({
        modelGql: CondoB2CAppGql,
        exportId: condoAppId,
        id: app.id,
        context,
    })

    if (!condoApp) {
        throw new GQLError(ERRORS.APP_NOT_FOUND, context)
    }

    return { condoApp, serverClient }
}

module.exports = {
    findCondoApp,
}