import { defineConfig } from 'cypress'

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:3000',
        projectId: 'dc36jj',
        videoCompression: 15,
        waitForAnimations: true,
        defaultCommandTimeout: 10000,
        retries: 3,
        setupNodeEvents (on, config) {
            // eslint-disable-next-line import/order
            return require('./plugins/index.js')(on, config)
        },
    },
})
