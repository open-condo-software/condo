const { program } = require('commander')
const fetch = require('node-fetch')

const { getAppServerUrl } = require('@open-condo/cli')

program.option('-f, --filter <names...>', 'Filters apps by name')
program.option('-s, --sleep <number>',  'Sleep interval between polling in ms', /\d{1,12}/, '3000')
program.option('-t, --timeout <number>',  'Max polling time in ms', /\d{1,12}/, '120000')
program.description('Extracts apps SERVER_URL variables and waits until they\'re ready to use')

async function pingApi (apiUrl) {
    const response = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({ 'operationName':null, 'variables':{}, 'query':'{appVersion}' }),
        headers: { 'Content-Type': 'application/json' },
    })
    const json = await response.json()
    if (!json || !json.data || !json.data.appVersion) {
        throw new Error('App not ready!')
    }
}

async function delay (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main () {
    program.parse()
    const { filter, timeout, sleep } = program.opts()

    const numericSleep = parseInt(sleep)
    const numericTimeout = parseInt(timeout)

    const serviceUrls = []
    for (const appName of filter) {
        serviceUrls.push(await getAppServerUrl(appName))
    }
    const apiUrls = serviceUrls.filter(url => url).map(url => `${url}/admin/api`)
    const cycles = Math.round(numericTimeout / numericSleep)

    for (let i = 0; i < cycles; i++) {
        const results = await Promise.allSettled(apiUrls.map(pingApi))
        if (results.every(res => res.status === 'fulfilled')) {
            return
        }
        await delay(numericSleep)
    }
    throw new Error('Apps was not started in specified timeout')
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)