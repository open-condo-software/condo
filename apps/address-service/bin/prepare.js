const { prepareAppEnvLocalAdminUsers, prepareCondoAppOidcConfig, updateAppEnvFile } = require('@open-condo/cli')

async function main () {
    // register oidc url in condo!
    const appName = 'address-service'
    const oidcConf = await prepareCondoAppOidcConfig(appName)
    await updateAppEnvFile(appName, 'OIDC_CONFIG', JSON.stringify(oidcConf))

    // add local admin user!
    await prepareAppEnvLocalAdminUsers(appName)

    await updateAppEnvFile(appName, 'PROVIDER', 'dadata', { commentAbove: 'Possible values:\n- dadata (need DADATA_SUGGESTIONS)\n- google (need GOOGLE_API_KEY)\n pullenti (need PULLENTI_CONFIG)' } )
    await updateAppEnvFile(appName, 'DADATA_SUGGESTIONS', '{"url": "https://suggestions.dadata.ru/suggestions/api/4_1/rs", "token": "<your token here>"}', { commentAbove: 'need for PROVIDER=dadata' } )
    await updateAppEnvFile(appName, 'GOOGLE_API_KEY', '<google api key>', { commentAbove: 'need for PROVIDER=google\nsee:\n- https://console.cloud.google.com/google/maps-apis/credentials\n- https://code.google.com/apis/console/' } )
    await updateAppEnvFile(appName, 'PULLENTI_CONFIG', '{"url": "http://localhost:3333/"}', { commentAbove: 'need for PROVIDER=pullenti\nPullenti is local server for normalizing addresses. See https://garfias.ru/' } )

    console.log('done')
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
