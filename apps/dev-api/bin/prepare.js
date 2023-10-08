const path = require('path')

const { prepareAppEnvLocalAdminUsers } = require('@open-condo/cli')

const APP_NAME = path.basename(path.resolve(__dirname, '..'))

async function main () {
    await prepareAppEnvLocalAdminUsers(APP_NAME, 'phone')
}

main().then(() => {
    console.log('done')
    process.exit()
}).catch((err) => {
    console.error(err)
    process.exit(1)
})