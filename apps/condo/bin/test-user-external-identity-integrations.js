const { SberIdIdentityIntegration } = require('@condo/domains/user/integration/sberid/SberIdIdentityIntegration')
const conf = require("@open-condo/config");

const integration = new SberIdIdentityIntegration()

async function main () {
    const callbackPath = '/api/sber_id/auth/callback'
    const redirectUrl = `${conf.SERVER_URL}${callbackPath}`
    const params = await integration.generateLoginFormParams({
        nonce: 'NTEVGkTb32Q64as8zgh5lQ',
        state: '4Tl8Nxx3n6t62iGKhrxru51UR_pZ_C8Un53srazCDbU.V7Ubr0u0oWo.edupower'
    });
    console.log(params)
    const tokenSet = await integration.issueExternalIdentityToken('E0C3F1EE-EB1B-4559-B0CD-A10EF5DC4509', redirectUrl)
    console.log(tokenSet)
    const userInfo = await integration.getUserInfo(tokenSet)
    console.log(userInfo)
    const id = await integration.getUserExternalIdentityId(tokenSet)
    console.log(id)
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)