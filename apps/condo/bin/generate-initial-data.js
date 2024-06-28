const { prepareAppEnvLocalAdminUsers } = require('@open-condo/cli')

async function main () {
    const appName = 'condo'
    await prepareAppEnvLocalAdminUsers(appName)
}

if (process.env.NODE_ENV === 'production') {
    console.log('NODE_ENV should not have value "production"')
    process.exit(1)
}

main().then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
})
