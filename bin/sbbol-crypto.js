const conf = require('@core/config')
const { getOrganizationAccessToken } = require('@condo/domains/organization/integrations/sbbol/accessToken')
const { SbbolCryptoApi } = require('@condo/domains/organization/integrations/sbbol/SbbolCryptoApi')
const { logger: baseLogger } = require('@condo/domains/organization/integrations/sbbol/common')
const path = require('path')
const { values } = require('lodash')
const { GraphQLApp } = require('@keystonejs/app-graphql')

const logger = baseLogger.child({ module: 'crypto' })

const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}
const SBBOL_CSR_REQUEST_DATA = conf.SBBOL_CSR_REQUEST_DATA ? JSON.parse(conf.SBBOL_CSR_REQUEST_DATA) : {}

const COMMAND = {
    GET_CRYPTO_INFO: 'get-crypto-info',
    POST_CSR: 'post-csr',
    GET_CSR_STATE: 'get-csr-state',
}

const validateAndGetCommand = () => {
    const [command] = process.argv.slice(2)
    if (values(COMMAND).includes(command)) {
        return command
    } else {
        throw new Error('Wrong `command` argument value')
    }
}

async function main () {
    const command = validateAndGetCommand()

    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    let accessToken
    try {
        // `service_organization_hashOrgId` is a `userInfo.HashOrgId` from SBBOL, that used to obtain accessToken
        // for organization, that will be queried in SBBOL using `SbbolFintechApi`.
        accessToken = await getOrganizationAccessToken(SBBOL_FINTECH_CONFIG.service_organization_hashOrgId)
    } catch (e) {
        logger.error({
            message: 'Failed to obtain organization access token from SBBOL',
            error: e.message,
            hashOrgId: SBBOL_FINTECH_CONFIG.service_organization_hashOrgId,
        })
        return null
    }

    const cryptoApi = new SbbolCryptoApi({
        accessToken,
        host: SBBOL_FINTECH_CONFIG.host,
        port: SBBOL_FINTECH_CONFIG.port,
        certificate: SBBOL_PFX.certificate,
        passphrase: SBBOL_PFX.passphrase,
    })

    let cryptoInfo

    if ([COMMAND.GET_CRYPTO_INFO, COMMAND.POST_CSR].includes(command)) {
        cryptoInfo = await cryptoApi.getCryptoInfo()
    }

    if (cryptoInfo && command === COMMAND.POST_CSR) {
        const response = await cryptoApi.postCertificateSigningRequest({
            cryptoInfo,
            cms: SBBOL_CSR_REQUEST_DATA.cms,
            email: SBBOL_CSR_REQUEST_DATA.email,
            externalId: SBBOL_CSR_REQUEST_DATA.externalId,
            number: SBBOL_CSR_REQUEST_DATA.number,
            orgName: SBBOL_CSR_REQUEST_DATA.orgName,
            firstName: SBBOL_CSR_REQUEST_DATA.firstName,
            lastName: SBBOL_CSR_REQUEST_DATA.lastName,
            patronymic: SBBOL_CSR_REQUEST_DATA.patronymic,
            userPosition: SBBOL_CSR_REQUEST_DATA.userPosition,
        })
        console.log('response from cryptoApi.postCertificateSigningRequest', response)
    }

    if (command === COMMAND.GET_CSR_STATE) {
        const response = await cryptoApi.getCertificateSigningRequestState(SBBOL_CSR_REQUEST_DATA.externalId)
        console.log('response from cryptoApi.getCertificateSigningRequestState', response)
    }

    await keystone.disconnect()
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})