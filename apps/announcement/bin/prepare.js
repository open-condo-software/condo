const { prepareCondoAppOidcConfig, prepareCondoAppB2BAppConfig, updateAppEnvFile, prepareAppEnvLocalAdminUsers, getAppEnvValue, runAppPackageJsonScript } = require('@open-condo/cli')


const main = async ([B2BAppName = 'announcement']) => {
    // 1) register oidc url in condo
    const appName = 'announcement'
    const oidcConf = await prepareCondoAppOidcConfig(appName)
    await updateAppEnvFile(appName, 'OIDC_CONDO_CLIENT_CONFIG', JSON.stringify(oidcConf))
    // 2) prepare B2BApp in condo
    await prepareCondoAppB2BAppConfig(appName, B2BAppName)
    // 3) migrate initial data and maketypes
    await runAppPackageJsonScript(appName, 'makemigrations')
    await runAppPackageJsonScript(appName, 'migrate')
    await runAppPackageJsonScript(appName, 'maketypes')
    // 4) add local admin user
    await prepareAppEnvLocalAdminUsers(appName)
    // 5) add condo url conf
    const condoUrl = await getAppEnvValue('condo', 'SERVER_URL') || 'http://localhost:3000'
    await updateAppEnvFile(appName, 'CONDO_DOMAIN', condoUrl)
    console.log('Done')
}

main(process.argv.slice(2))
    .then(() => {
        process.exit()
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
