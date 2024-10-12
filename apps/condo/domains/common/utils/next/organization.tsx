import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import {
    GetActiveOrganizationEmployeeDocument,
    GetActiveOrganizationEmployeeQuery,
    GetActiveOrganizationEmployeeQueryVariables,
} from '@app/condo/gql'
import { OrganizationTypeType, UserTypeType } from '@app/condo/schema'
import { getCookie, setCookie, deleteCookie } from 'cookies-next'
import get from 'lodash/get'
import { GetServerSideProps } from 'next'
export const ACTIVE_EMPLOYEE_COOKIE_NAME = 'organizationLinkId'

type PrefetchOrganizationEmployeeArgs = {
    client: ApolloClient<NormalizedCacheObject>
    context: Parameters<GetServerSideProps>[0]
    userId: string
}

export async function prefetchOrganizationEmployee (args: PrefetchOrganizationEmployeeArgs) {
    const { client, context, userId } = args

    const activeEmployeeId = getCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, { req: context.req, res: context.res })

    if (activeEmployeeId) {
        const response = await client.query<GetActiveOrganizationEmployeeQuery, GetActiveOrganizationEmployeeQueryVariables>({
            query: GetActiveOrganizationEmployeeDocument,
            variables: {
                where: {
                    id: activeEmployeeId,
                    organization: { type_in: [OrganizationTypeType.ManagingCompany, OrganizationTypeType.ServiceProvider] },
                    user: { id: userId, type: UserTypeType.Staff },
                    isAccepted: true,
                    isBlocked: false,
                    isRejected: false,
                },
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
            where: {
                organization: { type_in: [OrganizationTypeType.ManagingCompany, OrganizationTypeType.ServiceProvider] },
                user: { id: userId, type: UserTypeType.Staff },
                isAccepted: true,
                isBlocked: false,
                isRejected: false,
            },
        },
    })

    const activeEmployee = get(response, ['data', 'employees', 0]) || null

    if (activeEmployee) {
        setCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, get(activeEmployee, 'id', null), { req: context.req, res: context.res })
    } else {
        deleteCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, { req: context.req, res: context.res })
    }

    return { activeEmployee }
}
