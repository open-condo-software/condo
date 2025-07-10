/**
 * Utility to work with SBBOL Crypto API to obtain Digital Signature Certificate (DSC)
 *
 * A process of obtaining a DSC consist from following steps:
 * 1. Get cert center code, using 'get-crypto-info' command
 * 2. Manually create a Certificate Signing Request (CSR) with some desktop crypto-program or some crypto-API,
 *    better with that, that is approved by government
 * 3. Post CSR using `post-csr` command
 * 4. Get state of CSR using `get-csr-state` command.
 *    When status will get `Accepted`, then go to next step
 * 5. Download CSR in print-friendly format using `get-csr-print`
 * 6. Send printed CSR to appropriate responsible employee
 * 7. Get status of CSR again. When status will get `Published_by_Bank`, then go to next step
 * 8. Download published DSC using 'get-crypto-info' command
 * 9. Activate DSC using `activate-certificate` command
 *
 * Steps, described above, are presenting an one-off manual process.
 * Each step is supposed to be called manually and output is supposed to be read, stored (!)
 * and processed from console.
 *
 * @example
 * ```shell
 * cd apps/condo
 * yarn node bin/sbbol/crypto.js get-crypto-info
 * yarn node bin/sbbol/crypto.js post-csr
 * yarn node bin/sbbol/crypto.js get-csr-state
 * yarn node bin/sbbol/crypto.js activate-certificate
 * ```
 */
const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')
const { values } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { SbbolCryptoApi } = require('@condo/domains/organization/integrations/sbbol/SbbolCryptoApi')
const { getAccessTokenForUser } = require('@condo/domains/organization/integrations/sbbol/utils')

const logger = getLogger()

const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}
const SBBOL_CSR_REQUEST_DATA = conf.SBBOL_CSR_REQUEST_DATA ? JSON.parse(conf.SBBOL_CSR_REQUEST_DATA) : {}

const COMMAND = {
    GET_CRYPTO_INFO: 'get-crypto-info',
    POST_CSR: 'post-csr',
    GET_CSR_STATE: 'get-csr-state',
    GET_CSR_PRINT: 'get-csr-print',
    ACTIVATE_CERTIFICATE: 'activate-certificate',
}

const validateAndGetCommand = () => {
    const [command] = process.argv.slice(2)
    if (values(COMMAND).includes(command)) {
        return command
    } else {
        throw new Error('Wrong `command` argument value')
    }
}

const getAccessTokenFor = async (hashOrgId, userId) => {
    let accessToken
    try {
        // `service_organization_hashOrgId` is a `userInfo.HashOrgId` from SBBOL, that used to obtain accessToken
        // for organization, that will be queried in SBBOL using `SbbolFintechApi`.
        ({ accessToken } = await getAccessTokenForUser(userId))
    } catch (err) {
        logger.error({
            msg: 'failed to obtain organization access token from SBBOL',
            err,
        })
        return null
    }
    return accessToken
}

async function main () {
    const command = validateAndGetCommand()

    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    const userId = process.argv.slice(2)
    const accessToken = await getAccessTokenFor(SBBOL_CSR_REQUEST_DATA.service_organization_hashOrgId, userId)

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

    if (cryptoInfo && command === COMMAND.POST_CSR && userId) {
        // Use id of different ogranization, to that SBBOL support specifically granted rights to post CSR
        const accessTokenForCSR = await getAccessTokenFor(SBBOL_CSR_REQUEST_DATA.service_organization_hashOrgId, userId)

        const cryptoApiForCSR = new SbbolCryptoApi({
            accessToken: accessTokenForCSR,
            host: SBBOL_FINTECH_CONFIG.host,
            port: SBBOL_FINTECH_CONFIG.port,
            certificate: SBBOL_PFX.certificate,
            passphrase: SBBOL_PFX.passphrase,
        })

        const response = await cryptoApiForCSR.postCertificateSigningRequest({
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

    if (command === COMMAND.GET_CSR_PRINT) {
        await cryptoApi.getCertificateSigningRequestPrint(SBBOL_CSR_REQUEST_DATA.externalId, SBBOL_CSR_REQUEST_DATA.printCertificateFilename)
    }

    if (command === COMMAND.ACTIVATE_CERTIFICATE) {
        const response = await cryptoApi.activateCertificate(SBBOL_CSR_REQUEST_DATA.externalId)
        console.log('response from cryptoApi.activateCertificate', response)
    }

    await keystone.disconnect()
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})