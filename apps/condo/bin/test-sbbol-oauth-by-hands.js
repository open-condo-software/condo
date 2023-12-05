const { generators } = require('openid-client')
const readline = require('readline')
const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')
const { initializeSbbolAuthApi, getSbbolUserInfoErrors } = require('@condo/domains/organization/integrations/sbbol/utils')

function askQuestion (query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    return new Promise(resolve => rl.question(query, ans => {
        rl.close()
        resolve(ans)
    }))
}

async function main () {
    await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp'] })
    const api = await initializeSbbolAuthApi()
    const checks = { nonce: generators.nonce(), state: generators.state() }
    const redirectUrl = api.authorizationUrlWithParams(checks)
    console.log(redirectUrl)
    const urlInput = await askQuestion('Past you redirect url: ')
    const tokenSet = await api.completeAuth(urlInput, checks)
    console.log(tokenSet)
    const { access_token } = tokenSet
    const userInfo = await api.fetchUserInfo(access_token)
    console.log(userInfo)

    const errors = getSbbolUserInfoErrors(userInfo)
    if (errors.length) {
        console.error('invalid user info!', errors.join('; '))
    }
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
