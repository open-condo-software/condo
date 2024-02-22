// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import getConfig from 'next/config'

const { publicRuntimeConfig: { sentryConfig } } = getConfig()

if (sentryConfig['dsn']) {
    Sentry.init({
        dsn: sentryConfig['dsn'],
        tracesSampleRate: sentryConfig['sampleRate'],
        debug: false,
    })
}
