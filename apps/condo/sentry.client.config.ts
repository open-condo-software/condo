// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
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
