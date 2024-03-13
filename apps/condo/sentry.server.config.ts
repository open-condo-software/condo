// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import getConfig from 'next/config'

const { publicRuntimeConfig: { sentryConfig, currentVersion } } = getConfig()

if (sentryConfig['client']) {
    Sentry.init({
        dsn: sentryConfig['client']['dsn'],
        sampleRate: sentryConfig['client']['sampleRate'],
        tracesSampleRate: sentryConfig['client']['sampleRate'],
        debug: false,
        sendClientReports: true,
        autoSessionTracking: true,
        environment: sentryConfig['client']['environment'],
        release: `${sentryConfig['client']['environment']}-${currentVersion}`,
    })
}
