import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import {
    GetActiveOrganizationEmployeeDocument,
    GetActiveOrganizationEmployeeQuery,
    GetActiveOrganizationEmployeeQueryVariables,
    GetActiveOrganizationEmployeeQueryResult,
} from '@app/condo/gql'
import { getCookie, setCookie, deleteCookie } from 'cookies-next'
import cookie from 'js-cookie'
import get from 'lodash/get'
import { NextPageContext } from 'next'

import { isSSR } from '@open-condo/miniapp-utils'


export const ACTIVE_EMPLOYEE_COOKIE_NAME = 'organizationLinkId'

function getCookieEmployeeId (context: NextPageContext): string | null {
    let state: string | null
    if (isSSR()) {
        state = getCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, { req: context.req, res: context.res })
    } else {
        try {
            state = cookie.get(ACTIVE_EMPLOYEE_COOKIE_NAME) || null
        } catch (e) {
            console.error('Failed to get employee id from cookie', e)
            state = null
        }
    }
    return state
}

function setCookieEmployeeId (context: NextPageContext, activeEmployeeId: string) {
    if (isSSR()) {
        setCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, activeEmployeeId, { req: context.req, res: context.res })
    } else {
        cookie.set(ACTIVE_EMPLOYEE_COOKIE_NAME, activeEmployeeId, { expires: 365 })
    }
}

function removeCookieEmployeeId (context: NextPageContext) {
    if (isSSR()) {
        deleteCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, { req: context.req, res: context.res })
    } else {
        cookie.remove(ACTIVE_EMPLOYEE_COOKIE_NAME)
    }
}

type PrefetchOrganizationEmployeeArgs = {
    apolloClient: ApolloClient<NormalizedCacheObject>
    context: NextPageContext
    userId: string
}
type PrefetchOrganizationEmployeeReturnType = Promise<{
    activeEmployee: GetActiveOrganizationEmployeeQueryResult['data']['employees'][number]
}>

export async function prefetchOrganizationEmployee (args: PrefetchOrganizationEmployeeArgs): PrefetchOrganizationEmployeeReturnType {
    const { apolloClient, context, userId } = args

    const activeEmployeeId = getCookieEmployeeId(context)

    if (activeEmployeeId) {
        const response = await apolloClient.query<GetActiveOrganizationEmployeeQuery, GetActiveOrganizationEmployeeQueryVariables>({
            query: GetActiveOrganizationEmployeeDocument,
            variables: {
                employeeId: activeEmployeeId,
                userId,
            },
        })

        const activeEmployee = get(response, ['data', 'employees', 0]) || null

        if (activeEmployee) {
            return { activeEmployee }
        }
    }

    const response = await apolloClient.query<GetActiveOrganizationEmployeeQuery, GetActiveOrganizationEmployeeQueryVariables>({
        query: GetActiveOrganizationEmployeeDocument,
        variables: {
            userId,
        },
    })
    // NOTE:It is assumed that "prefetchOrganizationEmployee" will be executed
    // at the beginning of the "getServerSideProps" call,
    // so we can ignore the arguments and clear all "allOrganizationEmployees" requests
    apolloClient.cache.evict({
        id: 'ROOT_QUERY',
        fieldName: 'allOrganizationEmployees',
    })

    const activeEmployee = get(response, ['data', 'employees', 0]) || null

    if (activeEmployee) {
        apolloClient.writeQuery({
            query: GetActiveOrganizationEmployeeDocument,
            variables: {
                employeeId: activeEmployee.id,
                userId,
            },
            data: response.data,
        })

        setCookieEmployeeId(context, activeEmployee.id)
    } else {
        removeCookieEmployeeId(context)
    }

    return { activeEmployee }
}
