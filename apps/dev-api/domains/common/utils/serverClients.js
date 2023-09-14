const get = require('lodash/get')

const { ApolloServerClient } = require('@open-condo/apollo-server-client')
const conf = require('@open-condo/config')

const { DEFAULT_LOCALE } = require('@dev-api/domains/common/constants/locales')
const { SEND_MESSAGE_MUTATION } = require('@dev-api/domains/common/gql')

const DEV_AUTH_CONFIG = JSON.parse(conf['CONDO_DEV_BOT_CONFIG'] || '{}')
const PROD_AUTH_CONFIG = JSON.parse(conf['CONDO_PROD_BOT_CONFIG'] || '{}')

function _getClientRequisites (config) {
    return {
        endpoint: get(config, 'apiUrl', 'http://localhost:4004'),
        authRequisites: {
            email: get(config, 'email', 'dev-api-bot@example.com'),
            password: get(config, 'password', 'your-secret-pass'),
        },
    }
}


class CondoClient extends ApolloServerClient {
    constructor ({ endpoint, authRequisites, opts }) {
        super(endpoint, authRequisites, opts)
    }

    async sendMessage (message, to) {
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
                    },
                },
            },
        })
    }
}

const developmentClient = new CondoClient({
    ..._getClientRequisites(DEV_AUTH_CONFIG),
    opts: { clientName: 'dev-api-server-dev-client', locale: DEFAULT_LOCALE },
})

const productionClient = new CondoClient({
    ..._getClientRequisites(PROD_AUTH_CONFIG),
    opts: { clientName: 'dev-api-server-prod-client', locale: DEFAULT_LOCALE },
})

module.exports = {
    developmentClient,
    productionClient,
}