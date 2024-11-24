import { getCookie } from 'cookies-next'
import { createContext, useContext } from 'react'

import type { IncomingMessage, ServerResponse } from 'http'
import type { Context } from 'react'

const SSR_COOKIES_DEFAULT_PROP_NAME = '__SSR_COOKIES__'

type SSRCookiesContextValues<CookiesList extends ReadonlyArray<string>> = Record<CookiesList[number], string | null>

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

type UseCookiesExtractor<
    CookiesList extends ReadonlyArray<string>,
    CookiesPropName extends string = typeof SSR_COOKIES_DEFAULT_PROP_NAME,
> = <PropsType extends Record<string, unknown>>(pageParams: SSRPropsWithCookies<PropsType, CookiesList, CookiesPropName>['props']) => SSRCookiesContextValues<CookiesList>

type UseSSRCookies<CookiesList extends ReadonlyArray<string>> = () => SSRCookiesContextValues<CookiesList>

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
    }

    getContext (): Context<SSRCookiesContextValues<CookiesList>> {
        return this.context
    }

    generateUseCookiesExtractorHook (): UseCookiesExtractor<CookiesList, CookiesPropName> {
        const defaultValues = this.defaultValues
        const propName = this.propName

        return function useCookiesExtractor<PropsType extends Record<string, unknown>> (
            pageParams: SSRPropsWithCookies<PropsType, CookiesList, CookiesPropName>['props']
        ): SSRCookiesContextValues<CookiesList> {
            return pageParams[propName] || defaultValues
        }
    }

    generateUseSSRCookiesHook (): UseSSRCookies<CookiesList> {
        const context = this.context

        return function useSSRCookies (): SSRCookiesContextValues<CookiesList> {
            return useContext(context)
        }
    }

    extractSSRCookies<PropsType extends Record<string, unknown>> (req: IncomingMessage, res: ServerResponse, pageParams: SSRProps<PropsType>): SSRPropsWithCookies<PropsType, CookiesList, CookiesPropName>  {
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
