import { DynamicAppResizer } from '@/domains/common/components/DynamicAppResizer'
import '@/styles/globals.css'

import type { AppProps } from 'next/app'

export default function App ({ Component, pageProps }: AppProps) {
    return (
        <DynamicAppResizer>
            <Component {...pageProps} />
        </DynamicAppResizer>
    )
}
