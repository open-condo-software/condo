/**
 * @type {Cypress.PluginConfig}
 */
const fs = require('fs')

const Metrics = require('@open-condo/keystone/metrics')

const registredTraces = []

const METRIC_PREFIX = 'cypress.'
const METRIC_REPORT_FOLDER = 'metrics/'
const TRACES_REPORT_FILENAME = 'traces.json'

module.exports = async (on, config) => {

    on('task', {
        async 'metrics:histogram' ([name, value]) {
            console.log(`Logged metric: ${name} : ${value}`)
            Metrics.histogram({ name: METRIC_PREFIX + name, value })
            return null
        },

        'metrics:endTrace' ([trace]) {
            registredTraces.push(trace)
            return null
        },

        'metrics:getTraces' () {
            return registredTraces
        },
    })

    on('after:run', async (results) => {
        const path = METRIC_REPORT_FOLDER + TRACES_REPORT_FILENAME
        fs.writeFile(path, JSON.stringify(registredTraces), 'utf8', () => {
            console.log(`Traces have been saved to ${path}`)
        })
    })

    return config
}