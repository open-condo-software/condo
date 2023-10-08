const { prepareAppEnvLocalAdminUsers, prepareCondoAppOidcConfig, updateAppEnvFile } = require('@open-condo/cli')

async function main () {
    // 1) register oidc url in condo!
    const appName = 'address-service'
    const oidcConf = await prepareCondoAppOidcConfig(appName)
    await updateAppEnvFile(appName, 'OIDC_CONFIG', JSON.stringify(oidcConf))
    // 2) add local admin user!
    await prepareAppEnvLocalAdminUsers(appName)
    console.log('done')
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
