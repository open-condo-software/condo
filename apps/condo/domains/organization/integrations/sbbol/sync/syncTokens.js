const conf = require('@condo/config')
const { get } = require('lodash')
const { getItems } = require('@keystonejs/server-side-graphql-client')
const { SBBOL_IMPORT_NAME } = require('./../common')
const { TokenSet: TokenSetAPI } = require('@condo/domains/organization/utils/serverSchema')
const { dvSenderFields } = require('../constants')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}

const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 // its real TTL is 180 days bit we need to update it earlier

/**
 *
 * @param context
 * @param {TokenSet} tokenInfoFromOAuth
 * @param organization
 * @param user
 * @param dvSenderFields
 * @return {Promise<void>}
 */
const syncTokens = async ({ context, tokenInfoFromOAuth, organization, user }) => {
    const { access_token, expires_at, refresh_token } = tokenInfoFromOAuth
    const owner = {
        organization: {
            id: get(organization, 'id'),
        },
        user: {
            id: get(user, 'id'),
        },
    }
    const connectOwner = {
        organization: {
            connect: { id: owner.organization.id },
        },
        user: {
            connect: { id: owner.user.id },
        },
    }

    const [currentTokenSet] = await getItems({
        ...context,
        listKey: 'TokenSet',
        where: {
            ...owner,
        },
        sortBy: ['createdAt_DESC'],
        returnFields: 'id',
    })
    const item = {
        ...dvSenderFields,
        importRemoteSystem: SBBOL_IMPORT_NAME,
        accessToken: access_token,
        refreshToken: refresh_token,
        accessTokenExpiresAt: new Date(Number(expires_at) * 1000).toISOString(),
        refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString(),
    }
    const { context: adminContext } = context
    if (currentTokenSet) {
        await TokenSetAPI.update(adminContext, currentTokenSet.id, item)
    } else {
        // Each user, created from data, provided by SBBOL, will have a corresponding record in a `TokenSet` table.
        // Actually, only one `TokenSet` record, that corresponds to our account as a partner of SBBOL,
        // will be used for server-server interaction with SBBOL API,
        // Another SBBOL accounts representing our clients. Yet there is no business cases, that require
        // to authorize requests to SBBOL API from an account of our client.
        // But keep them saved for the future.
        await TokenSetAPI.create(adminContext, {
            ...connectOwner,
            ...item,
            // It will be changed by `refreshSbbolClientSecret` cron-job periodically.
            // Expiration date of client secret is unknown at this stage.
            // By default, the client secret expires in 40 days after it was initialized or changed.
            // So, a newly created `TokenSet` record will have `null` value in `clientSecretExpiresAt`,
            // and this way it will be changed in next run of `refreshSbbolClientSecret` cron-job.
            clientSecret: SBBOL_AUTH_CONFIG.client_secret,
        })
    }
}

module.exports = {
    syncTokens,
}
