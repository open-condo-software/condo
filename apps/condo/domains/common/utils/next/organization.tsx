import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import {
    GetActiveOrganizationEmployeeDocument,
    GetActiveOrganizationEmployeeQuery,
    GetActiveOrganizationEmployeeQueryVariables,
    GetActiveOrganizationEmployeeQueryResult,
} from '@app/condo/gql'
import { getCookie, setCookie, deleteCookie } from 'cookies-next'
import get from 'lodash/get'
import { NextPageContext } from 'next'


export const ACTIVE_EMPLOYEE_COOKIE_NAME = 'organizationLinkId'

type PrefetchOrganizationEmployeeArgs = {
    apolloClient: ApolloClient<NormalizedCacheObject>
    context: NextPageContext
    userId: string
}
export type ActiveEmployeeType = GetActiveOrganizationEmployeeQueryResult['data']['employees'][number]
type PrefetchOrganizationEmployeeReturnType = Promise<{
    activeEmployee: ActiveEmployeeType
}>

export async function prefetchOrganizationEmployee (args: PrefetchOrganizationEmployeeArgs): PrefetchOrganizationEmployeeReturnType {
    const { apolloClient, context, userId } = args

    const activeEmployeeId = getCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, { req: context?.req, res: context?.res }) || null

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

        setCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, activeEmployee.id, { req: context?.req, res: context?.res })
    } else {
        deleteCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, { req: context?.req, res: context?.res })
    }

    return { activeEmployee }
}
