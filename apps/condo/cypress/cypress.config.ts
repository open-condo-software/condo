import { defineConfig } from 'cypress'

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:3000',
        projectId: 'dc36jj',
        videoCompression: 15,
        waitForAnimations: true,
        defaultCommandTimeout: 10000,
        retries: 3,
        // We've imported your old cypress plugins here.
        // You may want to clean this up later by importing these.
        setupNodeEvents (on, config) {
            return require('./plugins/index.js')(on, config)
        },
    },
})
