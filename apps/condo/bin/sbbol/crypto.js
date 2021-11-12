const conf = require('@core/config')
const { getOrganizationAccessToken } = require('@condo/domains/organization/integrations/sbbol/accessToken')
const { SbbolCryptoApi } = require('@condo/domains/organization/integrations/sbbol/SbbolCryptoApi')
const { logger: baseLogger } = require('@condo/domains/organization/integrations/sbbol/common')
const path = require('path')
const { prepareKeystoneExpressApp } = require('@core/keystone/test.utils')
const { values } = require('lodash')

const logger = baseLogger.child({ module: 'crypto' })

const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}

const STEP_BACK_TO_CONDO_REPO_ROOT_PATH = '../..'

const COMMAND = {
    GET_CRYPTO_INFO: 'get-crypto-info',
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

    const name = path.basename(process.cwd())
    const namePath = path.join(__dirname, STEP_BACK_TO_CONDO_REPO_ROOT_PATH, 'apps', name)
    const keystoneModule = require(path.join(namePath, 'index'))
    const { keystone } = await prepareKeystoneExpressApp(keystoneModule)

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

    if (command === COMMAND.GET_CRYPTO_INFO) {
        const result = await cryptoApi.getCryptoInfo()
        console.debug('result', result)
    }


    await keystone.disconnect()
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})