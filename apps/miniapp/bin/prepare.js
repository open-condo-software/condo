const { prepareCondoAppOidcConfig, prepareCondoAppB2BAppConfig, updateAppEnvFile, prepareAppEnvLocalAdminUsers, getAppEnvValue } = require('@open-condo/cli')

const main = async ([B2BAppName = 'miniapp']) => {
    // 1) register oidc url in condo
    const appName = 'miniapp'
    const oidcConf = await prepareCondoAppOidcConfig(appName)
    await updateAppEnvFile(appName, 'OIDC_CONDO_CLIENT_CONFIG', JSON.stringify(oidcConf))
    await updateAppEnvFile(appName, 'APP_TOKEN_KEY', 'appToken')
    await updateAppEnvFile(appName, 'CONDO_ACCESS_TOKEN_KEY', 'condoAccessToken')
    await updateAppEnvFile(appName, 'CONDO_REFRESH_TOKEN_KEY', 'condoRefreshToken')
    await updateAppEnvFile(appName, 'CONDO_ORGANIZATION_ID_KEY', 'condoOrganizationId')
    await updateAppEnvFile(appName, 'ACCEPT_LANGUAGE', 'accept-language')
    // 2) prepare B2BApp in condo
    await prepareCondoAppB2BAppConfig(appName, B2BAppName, { withLaunchRoute: true })
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
