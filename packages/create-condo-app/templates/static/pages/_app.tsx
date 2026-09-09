import { ApolloProvider } from '@apollo/client'

import { CachePersistorContext } from '@open-condo/apollo'

import { DynamicAppResizer } from '@/domains/common/components/DynamicAppResizer'
import { IntlProvider } from '@/domains/common/components/IntlProvider'
import { LaunchParamsProvider } from '@/domains/common/components/LaunchParamsContext'
import { useApollo } from '@/domains/common/utils/apollo'
import { withTranslations } from '@/domains/common/utils/i18n'

import type { AppType } from 'next/app'

import '@/styles/globals.css'

type PageProps = Record<string, unknown>

const App: AppType<PageProps> =  ({ Component, pageProps }) => {
    const { client, cachePersistor } = useApollo(pageProps)

    return (
        <ApolloProvider client={client}>
            <CachePersistorContext.Provider value={{ persistor: cachePersistor }}>
                <LaunchParamsProvider>
                    <IntlProvider>
                        <DynamicAppResizer>
                            <Component {...pageProps} />
                        </DynamicAppResizer>
                    </IntlProvider>
                </LaunchParamsProvider>
            </CachePersistorContext.Provider>
        </ApolloProvider>
    )
}

App.getInitialProps = async () => ({})

export default withTranslations(App)

