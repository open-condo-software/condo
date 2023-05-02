const { spawn, exec } = require('child_process')
const path = require('path')
const util = require('util')

const faker = require('faker')
const { Client } = require('pg')


//const spawn = util.promisify(require('child_process').spawn)
//const exec = util.promisify(require('child_process').exec)

const RUN_TESTS_COMMAND = 'yarn'// -b chrome -C ./cypress/cypress.config.ts --spec "./cypress/e2e/pages/auth.cy.js"'

const RUN_TESTS_ARGS = ['workspace', '@app/condo', 'cypress', 'run', '-b', 'chrome', 'C', './cypress/cypress.config.ts']

// const RUN_TESTS_COMMAND = 'ls'
// const RUN_TESTS_ARGS = ['-la']

console.log( process.env.PATH )

const runCypressInParallel = async (instances) => {
    const cypressInstances = []

    for (let i = 0; i < instances; i++) {

        const cypressInstance = spawn(RUN_TESTS_COMMAND, RUN_TESTS_ARGS)

        cypressInstance.stdout.on('data', (data) => {
            console.log(`STDOUT Instance: ${i}: ${data.toString()}`)
        })

        cypressInstance.stderr.on('data', (data) => {
            console.log(`STDERR Instance: ${i}: ${data}`)
        })

        cypressInstance.on('close', (code) => {
            console.log(`child process close all stdio with code ${code}`)
        })

        cypressInstance.on('error', (err) => {
            console.log(`child process emitted an error: ${err}`)
        })

        cypressInstances.push(cypressInstance)
    }

    await Promise.all(cypressInstances)

    console.log('All done!')
}


const runCypressLoadTests = async () => {
    const [,,instances, condoUrl] = process.argv

    await runCypressInParallel(parseInt(instances), condoUrl)

    await setTimeout(() => {console.log('Slept for 5 seconds')}, 5000)
}

runCypressLoadTests()