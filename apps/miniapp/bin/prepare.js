const { prepareCondoAppOidcConfig, prepareCondoAppB2BAppConfig, updateAppEnvFile, prepareAppEnvLocalAdminUsers } = require('@open-condo/cli')

async function main () {
    // 1) register oidc url in condo!
    const serviceName = 'miniapp'
    const miniAppName = 'MiniApp'
    const oidcConf = await prepareCondoAppOidcConfig(serviceName)
    await updateAppEnvFile(serviceName, 'OIDC_CONDO_CLIENT_CONFIG', JSON.stringify(oidcConf))
    // 2) prepare B2BApp in condo!
    await prepareCondoAppB2BAppConfig(serviceName, miniAppName)
    // 2) add local admin user!
    await prepareAppEnvLocalAdminUsers(serviceName)
    console.log('done')
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
