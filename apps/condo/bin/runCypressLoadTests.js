const { spawn } = require('child_process')

const RUN_TESTS_COMMAND = 'yarn'
const RUN_TESTS_ARGS = ['workspace', '@app/condo', 'cypress', 'run', '-b', 'chrome', 'C', './cypress/cypress.config.ts']


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
        console.info(`STDOUT Cypress instance: ${instance} ${msg}`)
    }
}

const processCypressStderrMessage = (message, instance) => {
    const msg = trimMessage(message.toString())

    console.warn(`STDERR Cypress instance: ${instance} ${msg}`)
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
            console.info(`Cypress instance ${i} close all stdio with code ${code}`)
        })

        cypressInstance.on('error', (err) => {
            console.error(`Cypress instance ${i} emitted an error: ${err}`)
        })

        cypressInstances.push(cypressInstance)
    }

    return Promise.all(cypressInstances)
}


const runCypressLoadTests = async () => {
    const [,,instances] = process.argv

    await runCypressInParallel(parseInt(instances))
}

runCypressLoadTests().then(async r => {
    await r
})