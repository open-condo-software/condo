const { generators } = require('openid-client')
const readline = require('readline')

const { SbbolOauth2Api } = require('@condo/domains/organization/integrations/sbbol/oauth2')

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
    const api = new SbbolOauth2Api()
    const checks = { nonce: generators.nonce(), state: generators.state() }
    const redirectUrl = api.authorizationUrlWithParams(checks)
    console.log(redirectUrl)
    const urlInput = await askQuestion('Past you redirect url: ')
    const tokenSet = await api.completeAuth(urlInput, checks)
    console.log(tokenSet)
}

main().catch(console.error)
