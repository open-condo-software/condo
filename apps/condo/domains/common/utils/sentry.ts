import * as Sentry from '@sentry/node'
import { RewriteFrames } from '@sentry/integrations'
import getConfig from 'next/config'

// refs. to: https://github.com/vercel/next.js/blob/canary/examples/with-sentry/utils/sentry.js
export const initSentry = () => {
    const { publicRuntimeConfig } = getConfig()
    const { sentryDsn, isProduction } = publicRuntimeConfig

    if (sentryDsn) {
        const integrations = []
        if (typeof window === 'undefined') {
            // For Node.js, rewrite Error.stack to use relative paths, so that source
            // maps starting with ~/_next map to files in Error.stack with path
            // app:///_next
            integrations.push(
                new RewriteFrames({
                    iteratee: (frame) => {
                        frame.filename = frame.filename.replace(
                            process.env.NEXT_PUBLIC_SENTRY_SERVER_ROOT_DIR,
                            'app:///'
                        )
                        frame.filename = frame.filename.replace('.next', '_next')
                        return frame
                    },
                })
            )
        }

        Sentry.init({
            integrations,
            dsn: sentryDsn,
            enabled: isProduction,
        })
    }
}
