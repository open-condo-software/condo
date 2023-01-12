const { SBER_ID_IDP_TYPE } = require('@condo/domains/user/constants/common')
const { SberIdIdentityIntegration } = require('@condo/domains/user/integration/sberid/SberIdIdentityIntegration')

const integration = new SberIdIdentityIntegration()

async function main () {
    const params = await integration.generateLoginFormParams({
        nonce: 'NTEVGkTb32Q64as8zgh5lQ',
        state: '4Tl8Nxx3n6t62iGKhrxru51UR_pZ_C8Un53srazCDbU.V7Ubr0u0oWo.edupower'
    });
    console.log(params)
    const tokenSet = await integration.issueExternalIdentityToken({ code: 'E349B85D-B8E0-46D5-88C6-FC6DDDBDB82C'})
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