import { getCookie } from 'cookies-next'
import { createContext, useContext } from 'react'

import type { IncomingMessage, ServerResponse } from 'http'
import type { Context } from 'react'

const SSR_COOKIES_DEFAULT_PROP_NAME = '__SSR_COOKIES__'

export type SSRCookiesContextValues<CookiesList extends ReadonlyArray<string>> = Record<CookiesList[number], string | null>

type Optional<T> = T | undefined

type SSRProps<PropsType extends Record<string, unknown>> = {
    props?: PropsType
}

type SSRPropsWithCookies<
    PropsType extends Record<string, unknown>,
    CookiesList extends ReadonlyArray<string>,
    CookiesPropName extends string = typeof SSR_COOKIES_DEFAULT_PROP_NAME,
> = {
    props: PropsType & {
        [K in CookiesPropName]?: SSRCookiesContextValues<CookiesList>
    }
}

export type UseSSRCookiesExtractor<
    CookiesList extends ReadonlyArray<string>,
    CookiesPropName extends string = typeof SSR_COOKIES_DEFAULT_PROP_NAME,
> = <PropsType extends Record<string, unknown>>(pageParams: SSRPropsWithCookies<PropsType, CookiesList, CookiesPropName>['props']) => SSRCookiesContextValues<CookiesList>

export type UseSSRCookies<CookiesList extends ReadonlyArray<string>> = () => SSRCookiesContextValues<CookiesList>

/**
 * Helper that allows you to pass cookies from the request directly to the SSR,
 * thus avoiding layout shifts and loading states.
 *
 * NOTE: You should not use this tool to pass secure http-only cookies to the client,
 * that's why each application must define the list of allowed cookies itself.
 *
 * @example Init helper and export utils for app
 * import { SSRCookiesHelper } from '@open-condo/miniapp-utils/helpers/cookies'
 * import type { SSRCookiesContextValues } from '@open-condo/miniapp-utils/helpers/cookies'
 *
 * import type { Context } from 'react'
 *
 * // NOTE: put here only cookies needed in SRR (hydration), does not put http-only cookies here
 * const VITAL_COOKIES = ['residentId', 'isLayoutMinified'] as const
 *
 * const cookieHelper = new SSRCookiesHelper(VITAL_COOKIES)
 *
 * export const extractSSRCookies = cookieHelper.extractSSRCookies
 * export const useSSRCookiesExtractor = cookieHelper.generateUseSSRCookiesExtractorHook()
 * export const useSSRCookies = cookieHelper.generateUseSSRCookiesHook()
 * export const SSRCookiesContext = cookieHelper.getContext() as Context<SSRCookiesContextValues<typeof VITAL_COOKIES>>
 *
 * @example Extract cookies in getServerSideProps / getInitialProps
 * import { extractSSRCookies } from '@/domains/common/utils/ssr'
 *
 * export const getServerSideProps = async ({ req, res }) => {
 *     return extractSSRCookies(req, res, {
 *         props: { ... }
 *     })
 * }
 *
 * @example Pass extracted cookies to React context in your _app.ts
 * import { SSRCookiesContext } from '@/domains/common/utils/ssr'
 *
 * export default function App ({ Component, pageProps }: AppProps): ReactNode {
 *     const ssrCookies = useSSRCookiesExtractor(pageProps)
 *
 *     return (
 *         <SSRCookiesContext.Provider value={ssrCookies}>
 *             <Component {...pageProps} />
 *         </SSRCookiesContext.Provider>
 *     )
 * }
 *
 * @example Use extracted cookies anywhere in your app.
 * // /domains/common/components/Layout.tsx
 * import { useState } from 'react'
 * import { useSSRCookies } from '@/domains/common/utils/ssr'
 *
 * import type { FC } from 'react'
 *
 * export const Layout: FC = () => {
 *     const { isLayoutMinified } = useSSRCookies()
 *
 *     const [layoutMinified, setLayoutMinified] = useState(isLayoutMinified === 'true')
 *
 *     return {
 *         // ...
 *     }
 * }
 */
export class SSRCookiesHelper<
    CookiesList extends ReadonlyArray<string>,
    CookiesPropName extends string = typeof SSR_COOKIES_DEFAULT_PROP_NAME,
> {
    allowedCookies: CookiesList
    propName: CookiesPropName
    private readonly context: Context<SSRCookiesContextValues<CookiesList>>
    private readonly defaultValues: SSRCookiesContextValues<CookiesList>

    constructor (allowedCookies: CookiesList, propName?: CookiesPropName) {
        this.allowedCookies = allowedCookies
        this.propName = propName || SSR_COOKIES_DEFAULT_PROP_NAME as CookiesPropName
        this.defaultValues = Object.fromEntries(allowedCookies.map(key => [key, null])) as SSRCookiesContextValues<CookiesList>
        this.context = createContext<SSRCookiesContextValues<CookiesList>>(this.defaultValues)

        this.extractSSRCookies = this.extractSSRCookies.bind(this)
    }

    getContext (): Context<SSRCookiesContextValues<CookiesList>> {
        return this.context
    }

    generateUseSSRCookiesExtractorHook (): UseSSRCookiesExtractor<CookiesList, CookiesPropName> {
        const defaultValues = this.defaultValues
        const propName = this.propName

        return function useSSRCookiesExtractor<PropsType extends Record<string, unknown>> (
            pageProps: SSRPropsWithCookies<PropsType, CookiesList, CookiesPropName>['props']
        ): SSRCookiesContextValues<CookiesList> {
            return pageProps[propName] || defaultValues
        }
    }

    generateUseSSRCookiesHook (): UseSSRCookies<CookiesList> {
        const context = this.context

        return function useSSRCookies (): SSRCookiesContextValues<CookiesList> {
            return useContext(context)
        }
    }

    extractSSRCookies<PropsType extends Record<string, unknown>> (
        req: Optional<IncomingMessage>,
        res: Optional<ServerResponse>,
        pageParams: SSRProps<PropsType>
    ): SSRPropsWithCookies<PropsType, CookiesList, CookiesPropName>  {
        return {
            ...pageParams,
            props: {
                ...pageParams.props,
                [this.propName]: Object.fromEntries(
                    Object.keys(this.defaultValues).map(key => [
                        key,
                        getCookie(key, { req, res }) || null,
                    ])
                ),
            },
        } as SSRPropsWithCookies<PropsType, CookiesList, CookiesPropName>
    }
}
