const { spawn } = require('child_process')

const RUN_TESTS_COMMAND = 'yarn'
const RUN_TESTS_ARGS = ['workspace', '@app/condo', 'cypress', 'run', '-b', 'chrome', 'C', './cypress/cypress.config.ts']


const processCypressStdoutMessage = (message, instance) => {
    const msg = message.toString()
        .replaceAll('─', '')

    if (msg.includes('Running:')) {
        console.log(`STDOUT Cypress instance: ${instance}\r\n${msg}`)
    }
}


const runCypressInParallel = (instances) => {
    const cypressInstances = []

    for (let i = 0; i < instances; i++) {

        const cypressInstance = spawn(RUN_TESTS_COMMAND, RUN_TESTS_ARGS)

        cypressInstance.stdout.on('data', (data) => {
            processCypressStdoutMessage(data, i)
        })

        cypressInstance.stderr.on('data', (data) => {
            console.log(`STDERR Cypress instance: ${i}: \r\n${data}`)
        })

        cypressInstance.on('close', (code) => {
            console.log(`Cypress instance ${i} close all stdio with code ${code}`)
        })

        cypressInstance.on('error', (err) => {
            console.log(`Cypress instance ${i} emitted an error: ${err}`)
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