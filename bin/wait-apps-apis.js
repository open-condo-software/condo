const { program } = require('commander')
const fetch = require('node-fetch')

const { getAppServerUrl } = require('@open-condo/cli')

program
    .option('-f, --filter <names...>', 'Filters apps by name')
    .option('-s, --sleep <number>', 'Sleep interval between polling in ms', (value) => parseInt(value, 10), 3000)
    .option('-t, --timeout <number>', 'Max polling time in ms', (value) => parseInt(value, 10), 120000)
    .description('Extracts apps\' SERVER_URL variables and waits until they\'re ready to use')

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function pingApi (apiUrl) {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify({ operationName: null, variables: {}, query: '{appVersion}' }),
            headers: { 'Content-Type': 'application/json' },
        })
        const json = await response.json()
        if (!json?.data?.appVersion) {
            throw new Error('App not ready!')
        }
    } catch (error) {
        throw new Error(`Failed to ping API at ${apiUrl}: ${error.message}`)
    }
}

async function main () {
    const { filter, timeout, sleep } = program.parse().opts()

    if (!filter || filter.length === 0) {
        throw new Error('At least one app name must be provided using the -f or --filter option')
    }

    const serviceUrls = await Promise.all(filter.map(getAppServerUrl))
    const apiUrls = serviceUrls.filter(Boolean).map((url) => `${url}/admin/api`)

    if (apiUrls.length === 0) {
        throw new Error('No valid service URLs found')
    }

    const cycles = Math.ceil(timeout / sleep)

    for (let i = 0; i < cycles; i++) {
        const results = await Promise.allSettled(apiUrls.map(pingApi))
        if (results.every(res => res.status === 'fulfilled')) {
            console.log('All apps are ready to use')
            return
        }
        await delay(sleep)
    }

    throw new Error('Apps was not started in specified timeout')
}

main().catch(e => {
    console.error('Error:', e.message)
    process.exit(1)
})
