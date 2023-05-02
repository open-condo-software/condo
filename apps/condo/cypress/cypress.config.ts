import { defineConfig } from 'cypress'

import conf from '@open-condo/config'


const LOAD_TESTING = conf['CYPRESS_IS_LOAD_TESTING']

const config = {
    e2e: {
        baseUrl: conf['SERVER_URL'],
        projectId: 'dc36jj',
        video: true,
        videoCompression: 15,
        waitForAnimations: true,
        defaultCommandTimeout: 10000,
        screenshotOnRunFailure: true,
        retries: 3,
        setupNodeEvents (on, config) {
        // eslint-disable-next-line import/order
            require('./plugins/index.js')(on, config)
            require('./plugins/metrics.js')(on, config)
        },
        env: {
            supportPassword: conf['CYPRESS_SERVER_SUPPORT_PASSWORD'],
            supportEmail: conf['CYPRESS_SERVER_SUPPORT_EMAIL'],
            grafanaConfig: conf['CYPRESS_GRAFANA_CONFIG'],
        },
        requestTimeout: 10000,
        pageLoadTimeout: 10000,
        numTestsKeptInMemory: 0,
    },
}

if (LOAD_TESTING) {

    console.log('Cypress is loaded in LOAD TESTING mode. No videos will be recorded, and no screenshots will be saved')

    config.e2e.video = false
    config.e2e.screenshotOnRunFailure = false
    config.e2e.retries = 0
}

export default defineConfig(config)
