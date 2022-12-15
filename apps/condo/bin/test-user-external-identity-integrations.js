const { SBER_ID_IDP_TYPE } = require('@condo/domains/user/constants/common')
const { getIdentityIntegration } = require('@condo/domains/user/integration/identity')

const integration = getIdentityIntegration(SBER_ID_IDP_TYPE)

async function main () {
    const params = await integration.generateLoginFormParams();
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