import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import {
    GetActiveOrganizationEmployeeDocument,
    GetActiveOrganizationEmployeeQuery,
    GetActiveOrganizationEmployeeQueryVariables,
    GetActiveOrganizationEmployeeQueryResult,
} from '@app/condo/gql'
import { getCookie, setCookie, deleteCookie } from 'cookies-next'
import get from 'lodash/get'
import { GetServerSideProps } from 'next'


export const ACTIVE_EMPLOYEE_COOKIE_NAME = 'organizationLinkId'

type PrefetchOrganizationEmployeeArgs = {
    client: ApolloClient<NormalizedCacheObject>
    context: Parameters<GetServerSideProps>[0]
    userId: string
}
type PrefetchOrganizationEmployeeReturnType = Promise<{
    activeEmployee: GetActiveOrganizationEmployeeQueryResult['data']['employees'][number]
}>

export async function prefetchOrganizationEmployee (args: PrefetchOrganizationEmployeeArgs): PrefetchOrganizationEmployeeReturnType {
    const { client, context, userId } = args

    const activeEmployeeId = getCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, { req: context.req, res: context.res })

    if (activeEmployeeId) {
        const response = await client.query<GetActiveOrganizationEmployeeQuery, GetActiveOrganizationEmployeeQueryVariables>({
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

    const response = await client.query<GetActiveOrganizationEmployeeQuery, GetActiveOrganizationEmployeeQueryVariables>({
        query: GetActiveOrganizationEmployeeDocument,
        variables: {
            userId,
        },
    })
    // NOTE:It is assumed that "prefetchOrganizationEmployee" will be executed
    // at the beginning of the "getServerSideProps" call,
    // so we can ignore the arguments and clear all "allOrganizationEmployees" requests
    client.cache.evict({
        id: 'ROOT_QUERY',
        fieldName: 'allOrganizationEmployees',
    })

    const activeEmployee = get(response, ['data', 'employees', 0]) || null

    if (activeEmployee) {
        client.writeQuery({
            query: GetActiveOrganizationEmployeeDocument,
            variables: {
                employeeId: activeEmployee.id,
                userId,
            },
            data: response.data,
        })

        setCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, activeEmployee.id, { req: context.req, res: context.res })
    } else {
        deleteCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, { req: context.req, res: context.res })
    }

    return { activeEmployee }
}
