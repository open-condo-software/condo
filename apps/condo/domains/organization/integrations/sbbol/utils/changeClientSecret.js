const querystring = require('querystring')

const dayjs = require('dayjs')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { User } = require('@condo/domains/user/utils/serverSchema')

const { getAccessTokenForUser } = require('./getAccessTokenForUser')
const { getSbbolSecretStorage } = require('./getSbbolSecretStorage')

const { SbbolRequestApi } = require('../SbbolRequestApi')

const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}
const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}

async function changeClientSecret ({ clientId, currentClientSecret, newClientSecret }) {
    if (!clientId) throw new Error('changeClientSecret: no clientId')
    if (!newClientSecret) throw new Error('changeClientSecret: no newClientSecret')

    const sbbolSecretStorage = getSbbolSecretStorage()

    const { keystone: context } = await getSchemaCtx('User')

    const serviceUserId = get(SBBOL_AUTH_CONFIG, 'serviceUserId')
    if (!serviceUserId) throw new Error('changeClientSecret: no SBBOL_AUTH_CONFIG.serviceUserId')

    const user = await User.getOne(context, { id: serviceUserId })
    if (!user) {
        throw new Error(`Not found service User with id=${serviceUserId} to change Client Secret for SBBOL integration with clientId=${clientId}`)
    }

    const { accessToken } = await getAccessTokenForUser(user.id)

    const requestApi = new SbbolRequestApi({
        accessToken,
        host: SBBOL_FINTECH_CONFIG.host,
        port: SBBOL_FINTECH_CONFIG.port,
        certificate: SBBOL_PFX.certificate,
        passphrase: SBBOL_PFX.passphrase,
    })

    const body = {
        access_token: accessToken,
        client_id: clientId,
        client_secret: currentClientSecret || await sbbolSecretStorage.getClientSecret(),
        new_client_secret: newClientSecret,
    }

    // SBBOL does not accepts parameters from body of the POST-request, as it usually should be implemented.
    // It accepts parameters from URL query string
    const queryParams = querystring.stringify(body)

    const { data, statusCode } = await requestApi.request({
        method: 'POST',
        path: `/ic/sso/api/v1/change-client-secret?${queryParams}`,
        headers: {
            'Content-Type': 'application/json',
        },
    })
    if (statusCode !== 200) {
        throw new Error('Something went wrong, SBBOL sent not successful response.')
    } else {
        if (data) {
            const jsonData = JSON.parse(data)
            const { clientSecretExpiration } = jsonData
            if (!clientSecretExpiration) {
                throw new Error('clientSecretExpiration is missing in response, so, It\'s unknown, when new client secret will be expired')
            }
            await sbbolSecretStorage.setClientSecret(newClientSecret, { expiresAt: dayjs().add(clientSecretExpiration, 'days').unix() })
        }
    }
}

module.exports = {
    changeClientSecret,
}
