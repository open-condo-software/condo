import { NextPageContext } from 'next'
import Router from 'next/router'

import { isSSR } from '@open-condo/miniapp-utils'


type NextRedirectParams = { destination: string, permanent?: boolean, as?: string }
type NextRedirectReturnType = { pageProps: Record<string,  never> }
export async function nextRedirect (pageContext: NextPageContext, params: NextRedirectParams): Promise<NextRedirectReturnType> {
    if (isSSR()) {
        pageContext.res.writeHead(params.permanent ? 308 : 307, {
            Location: params.destination,
        })
        pageContext.res.end()
    } else {
        await Router.push(params.destination, params.as)
    }

    return { pageProps: {} }
}
