const path = require('path')

const { getAppServerUrl, updateAppEnvFile } = require('@open-condo/cli')

const APP_NAME = path.basename(path.resolve(__dirname, '..')) 

async function syncWithLocalDevApi () {
    const apiServerUrl = await getAppServerUrl('dev-api')
    await updateAppEnvFile(APP_NAME, 'SERVER_URL', apiServerUrl)
}

async function main () {
    await syncWithLocalDevApi()
}

main().then(() => {
    console.log('done')
    process.exit()
}).catch((err) => {
    console.error(err)
    process.exit(1)
})

