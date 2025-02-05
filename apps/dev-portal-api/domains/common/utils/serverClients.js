const get = require('lodash/get')

const { ApolloServerClient } = require('@open-condo/apollo-server-client')
const conf = require('@open-condo/config')
const { GQLError, GQLErrorCode: { INTERNAL_ERROR } } = require('@open-condo/keystone/errors')

const { REMOTE_SYSTEM } = require('@dev-portal-api/domains/common/constants/common')
const { MULTIPLE_FOUND } = require('@dev-portal-api/domains/common/constants/errors')
const { DEFAULT_LOCALE } = require('@dev-portal-api/domains/common/constants/locales')
const { SEND_MESSAGE_MUTATION } = require('@dev-portal-api/domains/common/gql')

const DEV_AUTH_CONFIG = JSON.parse(conf['CONDO_DEV_BOT_CONFIG'] || '{}')
const PROD_AUTH_CONFIG = JSON.parse(conf['CONDO_PROD_BOT_CONFIG'] || '{}')

function _getClientRequisites (config) {
    return {
        endpoint: get(config, 'apiUrl', 'http://localhost:4004'),
        authRequisites: {
            email: get(config, 'email', 'dev-portal-api-bot@example.com'),
            password: get(config, 'password', 'your-secret-pass'),
        },
    }
}

const ERRORS = {
    MULTIPLE_FOUND: {
        code: INTERNAL_ERROR,
        type: MULTIPLE_FOUND,
        message: 'Unable to determine the object to update because multiple objects were found for the specified importID and exportId',
        messageForUser: 'api.common.MULTIPLE_FOUND',
    },
}


class CondoClient extends ApolloServerClient {
    constructor ({ endpoint, authRequisites, opts }) {
        super(endpoint, authRequisites, opts)
    }

    async sendMessage (to, message, extraMeta = {}) {
        await this.executeAuthorizedMutation({
            mutation: SEND_MESSAGE_MUTATION,
            variables: {
                data: {
                    ...this.dvSender(),
                    to,
                    type: 'DEV_PORTAL_MESSAGE',
                    lang: this.locale,
                    meta: {
                        dv: 1,
                        body: message,
                        ...extraMeta,
                    },
                },
            },
        })
    }

    async findExportedModel ({ modelGql, exportId, id, context }) {
        const searchConditions = []
        if (exportId) searchConditions.push({ id: exportId })
        searchConditions.push({ AND: [{ importId: id, importRemoteSystem: REMOTE_SYSTEM }] })
        const objs = await this.getModels({
            modelGql,
            first: 2,
            where: {
                OR: searchConditions,
            },
        })
        if (objs.length > 1) {
            throw new GQLError(ERRORS.MULTIPLE_FOUND, context)
        }

        return objs.length ? objs[0] : null
    }
}

const developmentClient = new CondoClient({
    ..._getClientRequisites(DEV_AUTH_CONFIG),
    opts: { clientName: 'dev-portal-api-dev-client', locale: DEFAULT_LOCALE },
})

const productionClient = new CondoClient({
    ..._getClientRequisites(PROD_AUTH_CONFIG),
    opts: { clientName: 'dev-portal-api-prod-client', locale: DEFAULT_LOCALE },
})

module.exports = {
    developmentClient,
    productionClient,
}