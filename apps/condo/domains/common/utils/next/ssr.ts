// TODO(INFRA-614): move it inside miniapp-utils

import { getCookie } from 'cookies-next'
import cookie from 'js-cookie'
import { NextPageContext } from 'next'
import { createContext, useContext } from 'react'

import { extractApolloState } from '@open-condo/apollo'
import { isSSR } from '@open-condo/miniapp-utils'

import { ACTIVE_EMPLOYEE_COOKIE_NAME } from './organization'

import type { NormalizedCacheObject, ApolloClient } from '@apollo/client'


const COOKIE_STATE_PROP_NAME = '__SSR_COOKIE_EXTRACTOR__'

// NOTE: put here only cookies needed in SRR (hydration)
const VITAL_COOKIES = [
    'organizationLinkId',
] as const

type SSRRequest = NextPageContext['req']
type SSRResponse = NextPageContext['res']

type SSRCookiesContextType = Record<typeof VITAL_COOKIES[number], string | null>


type SSRResult<PropsType> = {
    props: PropsType & {
        [COOKIE_STATE_PROP_NAME]?: SSRCookiesContextType
    }
}

const DEFAULT_COOKIES_VALUES: SSRCookiesContextType =
    Object.assign({}, ...VITAL_COOKIES.map(key => ({ [key]: null })))

function nextGetCookie (context: Pick<NextPageContext, 'req' | 'res'>, key: string) {
    let state: string | null
    if (isSSR()) {
        state = getCookie(key, { req: context.req, res: context.res })
    } else {
        try {
            state = cookie.get(ACTIVE_EMPLOYEE_COOKIE_NAME)
        } catch (e) {
            console.error('Failed to get state from cookie', e)
            state = null
        }
    }
    return state || null
}

export function extractVitalCookies<PropsType> (req: SSRRequest, res: SSRResponse, pageParams: SSRResult<PropsType>): SSRResult<PropsType> {
    const cookies: SSRCookiesContextType = Object.assign({},
        ...VITAL_COOKIES.map(key => ({
            [key]: nextGetCookie({ req, res }, key) || null,
        }))
    )

    if (pageParams?.props) {
        pageParams.props[COOKIE_STATE_PROP_NAME] = cookies
    }

    return pageParams
}

export function useVitalCookies<PropsType> (pageProps: SSRResult<PropsType>['props']): SSRCookiesContextType {
    return pageProps[COOKIE_STATE_PROP_NAME] || DEFAULT_COOKIES_VALUES
}

export function extractSSRState<PropsType> (
    client: ApolloClient<NormalizedCacheObject>,
    req: SSRRequest,
    res: SSRResponse,
    pageParams: SSRResult<PropsType>
): SSRResult<PropsType> {
    return extractVitalCookies(req, res,
        extractApolloState(client, pageParams)
    )
}

export const SSRCookiesContext = createContext<SSRCookiesContextType>(DEFAULT_COOKIES_VALUES)

export const useSSRCookiesContext = (): SSRCookiesContextType => useContext(SSRCookiesContext)
