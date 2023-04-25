import { defineConfig } from 'cypress'

import conf from '@open-condo/config'

export default defineConfig({
    e2e: {
        baseUrl: conf['SERVER_URL'],
        projectId: 'dc36jj',
        videoCompression: 15,
        waitForAnimations: true,
        defaultCommandTimeout: 10000,
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
})
