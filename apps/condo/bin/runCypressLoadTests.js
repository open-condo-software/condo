/**
 * Runs cypress load tests.
 *
 * Prepare:
 * 1. You should be able to run Cypress
 * 2. You should have metrics set up
 *
 * Usage:
 * yarn node ./runCypressLoadTests <number of Cypress instances> <run continuously?>
 *
 * Examples:
 * yarn node ./runCypressLoadTests 5 continuous // Runs 5 cypress nodes continuously
 * yarn node ./runCypressLoadTests 5 // Runs 5 cypress nodes once!
 */

const { spawn } = require('child_process')

const conf = require('@open-condo/config')

const CYPRESS_BROWSER = conf['CYPRESS_BROWSER'] || 'electron'
const CYPRESS_CONFIG_PATH = conf['CYPRESS_CONFIG_PATH'] || './cypress/cypress.config.ts'

const logger = console

const RUN_TESTS_COMMAND = 'yarn'
const RUN_TESTS_ARGS = ['workspace', '@app/condo', 'cypress', 'run', '-b', CYPRESS_BROWSER, 'C', CYPRESS_CONFIG_PATH]

/**
 * Transforms cypress message to the one-liner.
 * @param {string} message
 * @returns {*}
 */
const trimMessage = (message) => {
    return message
        .replaceAll('─', '')
        .replaceAll( /  +/g, ' ' )
        .replaceAll('\n', '')
        .replaceAll('\r\n', '')
}


const processCypressStdoutMessage = (message, instance) => {
    const msg = trimMessage(message.toString())

    if (msg.includes('Running:')) {
        logger.info(`STDOUT Cypress instance: ${instance} ${msg}`)
    }
}

const processCypressStderrMessage = (message, instance) => {
    const msg = trimMessage(message.toString())

    logger.warn(`STDERR Cypress instance: ${instance} ${msg}`)
}


const runCypressInParallel = (instances) => {
    const cypressInstances = []

    for (let i = 0; i < instances; i++) {

        const cypressInstance = spawn(RUN_TESTS_COMMAND, RUN_TESTS_ARGS)

        cypressInstance.stdout.on('data', (data) => {
            processCypressStdoutMessage(data, i)
        })

        cypressInstance.stderr.on('data', (data) => {
            processCypressStderrMessage(data, i)
        })

        cypressInstance.on('close', (code) => {
            logger.info(`Cypress instance ${i} close all stdio with code ${code}`)
        })

        cypressInstance.on('error', (err) => {
            logger.error(`Cypress instance ${i} emitted an error: ${err}`)
        })

        cypressInstances.push(cypressInstance)
    }
}


const runCypressContinuously = async (instances) => {

    let idx = 0
    let cypressInstances = {}

    // eslint-disable-next-line no-constant-condition
    while (true) {

        await new Promise(r => setTimeout(r, 1000))

        if (Object.keys(cypressInstances).length >= instances) { continue }

        const instanceId = idx++

        const cypressInstance = spawn(RUN_TESTS_COMMAND, RUN_TESTS_ARGS)

        cypressInstance.stdout.on('data', (data) => {
            processCypressStdoutMessage(data, instanceId)
        })

        cypressInstance.stderr.on('data', (data) => {
            processCypressStderrMessage(data, instanceId)
        })

        cypressInstance.on('close', (code) => {
            logger.info(
                `IEVENT Cypress instance ${instanceId} close all stdio with code ${code}`)

            delete cypressInstances[instanceId]
            logger.info(`IEVENT Cypress instance ${instanceId} deleted`)
        })

        cypressInstance.on('error', (err) => {
            logger.error(
                `IEVENT Cypress instance ${instanceId} emitted an error: ${err}`)

            delete cypressInstances[instanceId]
            logger.info(`IEVENT Cypress instance ${instanceId} deleted`)
        })

        logger.info(`IEVENT Cypress instance ${instanceId} spawned`)
        cypressInstances[instanceId] = cypressInstance
    }
}



const runCypressLoadTests = async () => {
    const [,,instances, continuous] = process.argv

    if (continuous) {
        logger.info('Cypress load tests will run in CONTINUOUS mode!')
        await runCypressContinuously(parseInt(instances))
    } else {
        logger.info('Cypress load tests will run only once!')
        await runCypressInParallel(parseInt(instances))
    }
}

runCypressLoadTests().then(async () => {
    logger.info('Done!')
})