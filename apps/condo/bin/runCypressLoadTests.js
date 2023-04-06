const path = require('path')
const util = require('util')

const faker = require('faker')
const { Client } = require('pg')

const spawn = util.promisify(require('child_process').spawn)
const exec = util.promisify(require('child_process').exec)

const RUN_TESTS_COMMAND = 'yarn workspace @app/condo cypress run -b chrome -C ./cypress/cypress.config.ts'

const runCypressInParallel = async (instances) => {
    const cypressInstances = []
    for (let i = 0; i < instances; i++) {
        cypressInstances.push(exec(
            RUN_TESTS_COMMAND,
            (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`)
                    return
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`)
                    return
                }
                console.log(`stdout: ${stdout}`)
            })
        )
    }
    await Promise.all(cypressInstances)
    await setTimeout(() => {console.log('Slept for 1 second')}, 1000)
}

const setupPostgresStats = async (url) => {
    const client = new Client(url)
    await client.connect()
    return setInterval(async () => {
        const result = await client.query('SELECT COUNT(*) FROM pg_stat_activity')
        console.log(`Query rate: ${result.rows[0].count} queries per second`)
    }, 1000)
}

const runCypressLoadTests = async () => {
    const [,,instances, condoUrl] = process.argv

    const { DATABASE_URL } = process.env

    let postgresStats = await setupPostgresStats(DATABASE_URL)
    await runCypressInParallel(parseInt(instances), condoUrl)

    postgresStats = null
}

runCypressLoadTests()
    .then(() => {
        console.log('\r\n')
        console.log('All done')
        process.exit(0)
    }).catch((err) => {
        console.error('Failed to done', err)
    })