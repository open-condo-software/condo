// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import getConfig from 'next/config'

const { publicRuntimeConfig: { sentryDSN } } = getConfig()

if (sentryDSN) {
    Sentry.init({
        dsn: sentryDSN,
        tracesSampleRate: 0.2,
        debug: false,
    })
}
