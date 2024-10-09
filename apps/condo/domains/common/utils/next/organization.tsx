import { ApolloClient, ApolloQueryResult, NormalizedCacheObject } from '@apollo/client'
import { getCookie, setCookie, deleteCookie } from 'cookies-next'
import cookie from 'js-cookie'
import get from 'lodash/get'
import { GetServerSideProps, NextPage } from 'next'
// import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
//
// import { useAuth } from '@open-condo/next/auth'
// import { useSSRCookiesContext } from '@/domains/common/utils/next/ssr'

import {
    GetActiveOrganizationEmployeeDocument,
    GetActiveOrganizationEmployeeQuery,
    GetActiveOrganizationEmployeeQueryVariables,
    useGetActiveOrganizationEmployeeQuery,
} from '@/gql'
import { OrganizationTypeType, UserTypeType } from '@/schema'

// type OrganizationContextType = {
//     /** @deprecated Use selectEmployee */
//     selectLink: (linkItem: { id: string }) => (Promise<void> | Promise<ApolloQueryResult<GetActiveOrganizationEmployeeQuery>>)
//     selectEmployee: (employeeId: string) => (Promise<void> | Promise<ApolloQueryResult<GetActiveOrganizationEmployeeQuery>>)
//     isLoading: boolean
//     /** @deprecated Use employee, role or organization */
//     link?: GetActiveOrganizationEmployeeQuery['employees'][number] | null
//     employee?: Omit<GetActiveOrganizationEmployeeQuery['employees'][number], 'role' | 'organization'> | null
//     organization?: GetActiveOrganizationEmployeeQuery['employees'][number]['organization'] | null
//     role?: GetActiveOrganizationEmployeeQuery['employees'][number]['role'] | null
// }
//
// const OrganizationContext = createContext<OrganizationContextType>({
//     isLoading: false,
//     link: null,
//     employee: null,
//     organization: null,
//     role: null,
//     selectLink: () => Promise.resolve(),
//     selectEmployee: () => Promise.resolve(),
// })
//
// export const useOrganization = (): OrganizationContextType => useContext(OrganizationContext)
//
export const ACTIVE_EMPLOYEE_COOKIE_NAME = 'organizationLinkId'
//
// const setCookieLinkId = (value) => {
//     if (typeof window !== 'undefined') {
//         cookie.set(ACTIVE_EMPLOYEE_COOKIE_NAME, value, { expires: 365 })
//     }
// }
//
// const DEBUG_RERENDERS = false
//
// export const OrganizationProvider: React.FC = ({ children }) => {
//     const auth = useAuth()
//     const { organizationLinkId } = useSSRCookiesContext()
//     const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(organizationLinkId)
//
//     const onError = useCallback((error) => {
//         // console.log('OrganizationProvider:onError:: >>>', error)
//         // NOTE: In case, when organization from cookie left from old user, and we don't have access to it
//         // We'll reset cookie without showing explicit error
//         if (error.message.includes('You do not have access to this resource')) {
//             setCookieLinkId('')
//             setActiveEmployeeId(null)
//             console.log('OrganizationProvider:ERROR to null: >>>', { error })
//             setActiveEmployee(null)
//         } else {
//             throw error
//         }
//     }, [])
//
//     const { loading: employeeLoading, refetch, data } = useGetActiveOrganizationEmployeeQuery({
//         variables: {
//             where: {
//                 organization: { type: OrganizationTypeType.ManagingCompany },
//                 user: { id: auth.user.id, type: UserTypeType.Staff },
//                 id: activeEmployeeId,
//                 isAccepted: true,
//                 isBlocked: false,
//                 isRejected: false,
//             },
//         },
//         skip: auth.isLoading || !auth.user || !auth.user.id || !activeEmployeeId,
//         onError,
//     })
//
//     const isLoading = auth.isLoading || employeeLoading
//
//     const [activeEmployee, setActiveEmployee] = useState<GetActiveOrganizationEmployeeQuery['employees'][number] | null>(get(data, ['employees', 0]) || null)
//
//     const handleSelectItem: OrganizationContextType['selectLink'] = useCallback((linkItem) => {
//         console.log('OrganizationProvider:handleSelectItem:: >>>', {
//             linkItem,
//         })
//         if (linkItem && linkItem.id) {
//             const newId = linkItem.id
//             setActiveEmployeeId(newId)
//             return refetch({ where: { id: newId } })
//         } else {
//             setCookieLinkId('')
//             setActiveEmployeeId(null)
//             console.log('OrganizationProvider:handleSelectItem:to null: >>>', { linkItem })
//             setActiveEmployee(null)
//             return Promise.resolve()
//         }
//     }, [])
//
//     const handleSelectEmployee: OrganizationContextType['selectEmployee'] = useCallback((employeeId) => {
//         return handleSelectItem({ id: employeeId })
//     }, [handleSelectItem])
//
//     useEffect(() => {
//         const employee = get(data, ['employees', 0])
//         if (!employee) return
//
//         if (JSON.stringify(employee) === JSON.stringify(activeEmployee)) return
//         if (DEBUG_RERENDERS) console.log('OrganizationProvider() newState', employee)
//
//         const isEmployeeActive = !employee.isRejected && !employee.isBlocked && employee.isAccepted
//
//
//         console.log('OrganizationProvider:if (!isEmployeeActive) {:: >>>', { isEmployeeActive, employee, data })
//
//         if (!isEmployeeActive) {
//             setCookieLinkId('')
//             setActiveEmployeeId(null)
//             console.log('OrganizationProvider:if (!isEmployeeActive) {:to null: >>>', { isEmployeeActive, activeEmployee, employee, data })
//             setActiveEmployee(null)
//         } else {
//             setCookieLinkId(employee.id)
//             setActiveEmployeeId(employee.id)
//             setActiveEmployee(employee)
//         }
//     }, [data, activeEmployee])
//
//     useEffect(() => {
//         if (auth.isLoading) return
//         if (!auth.user && activeEmployee !== null) {
//             console.log('OrganizationProvider:change auth.user:: >>>', { auth, activeEmployee })
//             setActiveEmployee(null)
//         }
//     }, [auth.user])
//
//     if (DEBUG_RERENDERS) console.log('OrganizationProvider()', activeEmployee, 'loading', employeeLoading, 'skip', (auth.isLoading || !auth.user || !activeEmployeeId))
//
//     console.log('OrganizationProvider::: >>>', {
//         loading: employeeLoading, data,
//         skip: auth.isLoading || !auth.user || !activeEmployeeId,
//         variables: { id: activeEmployeeId },
//         auth,
//         activeEmployeeId,
//         organizationLinkId,
//
//         activeEmployee,
//
//         selectLink: handleSelectItem,
//         isLoading: (!auth.user || !activeEmployeeId) ? false : isLoading,
//         link: (activeEmployee && activeEmployee.id) ? activeEmployee : null,
//         employee: (activeEmployee && activeEmployee.id) ? activeEmployee : null,
//         organization: (activeEmployee && activeEmployee.organization) ? activeEmployee.organization : null,
//         role: (activeEmployee && activeEmployee.role) ? activeEmployee.role : null,
//     })
//
//     return (
//         <OrganizationContext.Provider
//             value={{
//                 selectLink: handleSelectItem,
//                 selectEmployee: handleSelectEmployee,
//                 isLoading: (!auth.user || !activeEmployeeId) ? false : isLoading,
//                 link: (activeEmployee && activeEmployee.id) ? activeEmployee : null,
//                 employee: (activeEmployee && activeEmployee.id) ? activeEmployee : null,
//                 organization: (activeEmployee && activeEmployee.organization) ? activeEmployee.organization : null,
//                 role: (activeEmployee && activeEmployee.role) ? activeEmployee.role : null,
//             }}
//             children={children}
//         />
//     )
// }
//
// export const withOrganization = () => (PageComponent: NextPage): NextPage => {
//     const WithOrganization = (props) => {
//         return (
//             <OrganizationProvider>
//                 <PageComponent {...props} />
//             </OrganizationProvider>
//         )
//     }
//
//     // Set the correct displayName in development
//     if (process.env.NODE_ENV !== 'production') {
//         const displayName =
//             PageComponent.displayName || PageComponent.name || 'Component'
//         WithOrganization.displayName = `WithOrganization(${displayName})`
//     }
//
//     WithOrganization.getInitialProps = PageComponent.getInitialProps
//
//     return WithOrganization
// }

type PrefetchOrganizationEmployeeArgs = {
    client: ApolloClient<NormalizedCacheObject>
    context: Parameters<GetServerSideProps>[0]
    userId: string
}

export async function prefetchOrganizationEmployee (args: PrefetchOrganizationEmployeeArgs) {
    const { client, context, userId } = args

    const activeEmployeeId = getCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, { req: context.req, res: context.res })

    console.log('prefetchOrganizationEmployee:activeEmployeeId:: >>>', {
        activeEmployeeId, userId,
    })

    if (activeEmployeeId) {
        const response = await client.query<GetActiveOrganizationEmployeeQuery, GetActiveOrganizationEmployeeQueryVariables>({
            query: GetActiveOrganizationEmployeeDocument,
            variables: {
                where: {
                    id: activeEmployeeId,
                    organization: { type: OrganizationTypeType.ManagingCompany },
                    user: { id: userId, type: UserTypeType.Staff },
                    isAccepted: true,
                    isBlocked: false,
                    isRejected: false,
                },
            },
        })

        console.log('prefetchOrganizationEmployee:response:: >>>', {
            response,
            activeEmployee: get(response, ['data', 'employees', 0]) || null,
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
                organization: { type: OrganizationTypeType.ManagingCompany },
                user: { id: userId, type: UserTypeType.Staff },
                isAccepted: true,
                isBlocked: false,
                isRejected: false,
            },
        },
    })

    console.log('prefetchOrganizationEmployee:!activeEmployeeId:: >>>', {
        response,
        activeEmployee: get(response, ['data', 'employees', 0]) || null,
    })

    const activeEmployee = get(response, ['data', 'employees', 0]) || null

    if (activeEmployee) {
        setCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, get(activeEmployee, 'id', null), { req: context.req, res: context.res })
    } else {
        deleteCookie(ACTIVE_EMPLOYEE_COOKIE_NAME, { req: context.req, res: context.res })
    }

    return { activeEmployee }
}
