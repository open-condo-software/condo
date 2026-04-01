import type { IncomingMessage, ServerResponse } from 'http'
import type { ComponentType as ReactComponentType } from 'react'

export type Optional<T> = T | undefined

type AppInitialProps<PropsType extends Record<string, unknown>> = { pageProps: PropsType }

type AppContext = {
    ctx: {
        req: Optional<IncomingMessage>
        res: Optional<ServerResponse>
    }
}

export type AppType<PropsType extends Record<string, unknown>, ComponentType, RouterType> =
    ReactComponentType<{ pageProps: PropsType, Component: ComponentType, router: RouterType }> & {
        getInitialProps?: (context: AppContext) => Promise<AppInitialProps<PropsType>> | AppInitialProps<PropsType>
    }