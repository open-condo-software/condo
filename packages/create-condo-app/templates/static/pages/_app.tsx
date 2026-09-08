import { DynamicAppResizer } from '@/domains/common/components/DynamicAppResizer'
import { LaunchParamsProvider } from '@/domains/common/components/LaunchParamsContext'

import type { AppProps } from 'next/app'

import '@/styles/globals.css'

export default function App ({ Component, pageProps }: AppProps) {
    return (
        <LaunchParamsProvider>
            <DynamicAppResizer>
                <Component {...pageProps} />
            </DynamicAppResizer>
        </LaunchParamsProvider>
    )
}
