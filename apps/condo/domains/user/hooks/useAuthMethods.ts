import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { isSafeUrl } from '@condo/domains/common/utils/url.utils'


const { publicRuntimeConfig: { hasSbbolAuth } } = getConfig()

const ALLOWED_FLOWS = ['default', 'oidc'] as const
const ALLOWED_AUTH_METHODS = ['phonePassword', 'sbbolid'] as const

type AuthMethods = 'phonePassword' | 'sbbolid'
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
        if (typeof methodsFromQuery === 'string') return methodsFromQuery.split(',')
        return [...ALLOWED_AUTH_METHODS]
    }, [methodsFromQuery])

    const authMethods = useMemo(() => {
        const result = {
            phonePassword: authFlow === 'default' || (authFlow === 'oidc' && authMethodsList.includes('phonePassword')),
            sbbolid: (authFlow === 'default' || (authFlow === 'oidc' && authMethodsList.includes('sbbolid'))),
        }

        // authMethods from query was empty then we set defaults values (everything to true)
        if (Object.values(result).every((value) => !value)) {
            result['phonePassword'] = true
            result['sbbolid'] = hasSbbolAuth
        }

        return result
    }, [authMethodsList, authFlow])

    return {
        authFlow,
        authMethods,
        queryParams,
    }
}
