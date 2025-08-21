import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { isSafeUrl } from '@condo/domains/common/utils/url.utils'


const { publicRuntimeConfig: { hasSbbolAuth, defaultStaffAuthMethods } } = getConfig()

const ALLOWED_FLOWS = ['default', 'oidc'] as const
const ALLOWED_AUTH_METHODS = ['phonePassword', 'emailPassword', 'sbbolid'] as const
const DEFAULT_AUTH_METHODS = getDefaultAuthMethods()

function getDefaultAuthMethods () {
    const isValidAuthMethods = (method: string): method is AuthMethods => (ALLOWED_AUTH_METHODS as readonly string[]).includes(method)
    const result = defaultStaffAuthMethods.filter(isValidAuthMethods) as Array<AuthMethods>
    return result.length > 0
        ? result
        : ['phonePassword', ...(hasSbbolAuth ? ['sbbolid'] : [])] as Array<AuthMethods>
}

type AuthMethods = typeof ALLOWED_AUTH_METHODS[number]
type AuthFlows = typeof ALLOWED_FLOWS[number]
type UseAuthMethods = () => {
    authFlow: AuthFlows
    authMethods: {
        [AuthMethod in AuthMethods]: boolean
    }
    queryParams: string
}

export const useAuthMethods: UseAuthMethods = () => {
    const router = useRouter()

    const { flow: flowFromQuery, methods: methodsFromQuery, next: nextFromQuery } = router.query

    const queryParams = useMemo(() => {
        const isValidNextUrl = nextFromQuery && !Array.isArray(nextFromQuery) && isSafeUrl(nextFromQuery)

        const queryParamsByKey = {
            flow: typeof flowFromQuery === 'string' ? flowFromQuery : '',
            methods: typeof methodsFromQuery === 'string' ? methodsFromQuery : '',
            next: isValidNextUrl ? encodeURIComponent(nextFromQuery) : '',
        }
        const queryParamsAsArray: Array<string> = []
        Object.entries(queryParamsByKey).forEach(([key, value]) => {
            if (value) queryParamsAsArray.push(`${key}=${value}`)
        })
        return queryParamsAsArray.join('&')
    }, [flowFromQuery, methodsFromQuery, nextFromQuery])

    const authFlow = useMemo(() => {
        const isValidFlow = (flow: string): flow is AuthFlows => (ALLOWED_FLOWS as readonly string[]).includes(flow)
        return (typeof flowFromQuery === 'string' && isValidFlow(flowFromQuery))
            ? (flowFromQuery as AuthFlows)
            : 'default'
    }, [flowFromQuery])
    const authMethodsList = useMemo(() => {
        if (typeof methodsFromQuery === 'string') return methodsFromQuery.split(',').filter((method) => (ALLOWED_AUTH_METHODS as readonly string[]).includes(method))
        return [...DEFAULT_AUTH_METHODS]
    }, [methodsFromQuery])

    const authMethods = useMemo(() => {
        const result = {
            phonePassword: authMethodsList.includes('phonePassword'),
            emailPassword: authMethodsList.includes('emailPassword'),
            sbbolid: authMethodsList.includes('sbbolid'),
        }

        // Fallback: if query provides no valid methods, use DEFAULT_AUTH_METHODS
        if (Object.values(result).every((value) => !value)) {
            result['phonePassword'] = DEFAULT_AUTH_METHODS.includes('phonePassword')
            result['emailPassword'] = DEFAULT_AUTH_METHODS.includes('emailPassword')
            result['sbbolid'] = DEFAULT_AUTH_METHODS.includes('sbbolid')
        }

        return result
    }, [authMethodsList])

    return {
        authFlow,
        authMethods,
        queryParams,
    }
}
