import { DynamicAppResizer } from '@/domains/common/components/DynamicAppResizer'
import { IntlProvider } from '@/domains/common/components/IntlProvider'
import { LaunchParamsProvider } from '@/domains/common/components/LaunchParamsContext'
import { withTranslations } from '@/domains/common/utils/i18n'

import type { AppType } from 'next/app'

import '@/styles/globals.css'

type PageProps = Record<string, unknown>

const App: AppType<PageProps> =  ({ Component, pageProps }) => {
    return (
        <LaunchParamsProvider>
            <IntlProvider>
                <DynamicAppResizer>
                    <Component {...pageProps} />
                </DynamicAppResizer>
            </IntlProvider>
        </LaunchParamsProvider>
    )
}

export default withTranslations(App)

