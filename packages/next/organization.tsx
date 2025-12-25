import { ApolloQueryResult } from '@apollo/client'
import { DocumentNode } from 'graphql'
import { gql } from 'graphql-tag'
import cookie from 'js-cookie'
import get from 'lodash/get'
import { NextPage } from 'next'
import nextCookie from 'next-cookies'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

import { isSSR } from '@open-condo/miniapp-utils'

import { DEBUG_RERENDERS, DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER, preventInfinityLoop, getContextIndependentWrappedInitialProps } from './_utils'
import { useQuery } from './apollo'
import { useAuth } from './auth'
import { Either } from './types'


// NOTE: OpenCondoNext is defined as a global namespace so the library user can override the default types
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace OpenCondoNext {
        interface GetActiveOrganizationEmployeeQueryType {}
        interface LinkType {}
        interface OrganizationType {}
        interface EmployeeType {}
        interface RoleType {}
    }
}

/** @deprecated */
type LinkType = keyof OpenCondoNext.LinkType extends never
    ? any
    : OpenCondoNext.LinkType
type OrganizationType = keyof OpenCondoNext.OrganizationType extends never
    ? any
    : OpenCondoNext.OrganizationType
type EmployeeType = keyof OpenCondoNext.EmployeeType extends never
    ? any
    : OpenCondoNext.LinkType
type RoleType = keyof OpenCondoNext.RoleType extends never
    ? any
    : OpenCondoNext.RoleType
type GetActiveOrganizationEmployeeQueryType = keyof OpenCondoNext.GetActiveOrganizationEmployeeQueryType extends never
    ? any
    : OpenCondoNext.GetActiveOrganizationEmployeeQueryType

type OrganizationContextType = {
    /** @deprecated Use selectEmployee */
    selectLink: (linkItem: { id: string }) => Promise<void | ApolloQueryResult<GetActiveOrganizationEmployeeQueryType>>
    selectEmployee: (employeeId: string) => Promise<void | ApolloQueryResult<GetActiveOrganizationEmployeeQueryType>>
    isLoading: boolean
    /** @deprecated Use organization, employee or role */
    link?: LinkType | null
    organization?: OrganizationType | null
    employee?: EmployeeType | null
    role?: RoleType | null
}

const OrganizationContext = createContext<OrganizationContextType>({
    isLoading: false,
    selectLink: () => Promise.resolve(),
    selectEmployee: () => Promise.resolve(),
})

type UseOrganization = () => OrganizationContextType
const useOrganization: UseOrganization = () => useContext(OrganizationContext)

const organizationToUserFragment = `
    id
    organization {
      id
      name
      description
      avatar {
        publicUrl
      }
      importRemoteSystem
    }
    user {
      id
    }
    role {
      id
    }
`

/** @deprecated */
let GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY_LEGACY = gql`
    query getOrganizationToUserLinkById($id: ID!) {
        obj: OrganizationToUserLink (where: {id: $id}) {
            ${organizationToUserFragment}
        }
    }
`

let GET_ORGANIZATION_EMPLOYEE_QUERY = gql`
    query getOrganizationEmployee($userId: ID!, $employeeId: ID!) {
        employee: OrganizationEmployee (where: { id: $employeeId, user: { id: $userId } }) {
            ${organizationToUserFragment}
        }
    }
`

const ACTIVE_EMPLOYEE_COOKIE_NAME = 'organizationLinkId'

const setCookieEmployeeId = (value) => {
    if (typeof window !== 'undefined') {
        cookie.set(ACTIVE_EMPLOYEE_COOKIE_NAME, value, { expires: 365 })
    }
}

const removeCookieEmployeeId = () => {
    if (typeof window !== 'undefined') {
        cookie.remove(ACTIVE_EMPLOYEE_COOKIE_NAME)
    }
}

const getCookieEmployeeId = () => {
    let state = null
    if (typeof window !== 'undefined') {
        try {
            state = cookie.get(ACTIVE_EMPLOYEE_COOKIE_NAME) || null
        } catch (e) {
            console.error('Failed to get employee id from cookie', e)
            state = null
        }
    }
    return state
}

const extractReqEmployeeId = (req) => {
    try {
        return nextCookie({ req }).organizationLinkId || null
    } catch (e) {
        return null
    }
}

/** @deprecated */
const OrganizationProviderLegacy = ({ children, initialEmployee }) => {
    const auth = useAuth()
    const cookieEmployee = getCookieEmployeeId()
    const [employeeIdState, setEmployeeIdState] = useState(initialEmployee && initialEmployee.id || cookieEmployee)
    const [activeEmployee, setActiveEmployee] = useState(initialEmployee)

    useEffect(() => {
        if (!(initialEmployee && initialEmployee.id || cookieEmployee)) {
            setEmployeeIdState(null)
        }
    }, [initialEmployee, cookieEmployee])

    const { loading: employeeLoading, refetch, data } = useQuery(GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY_LEGACY, {
        variables: { id: employeeIdState },
        skip: auth.isLoading || !auth.user || !employeeIdState,
        onError,
    })

    useEffect(() => {
        if (!data) return

        const employee = data.obj
        if (JSON.stringify(employee) === JSON.stringify(activeEmployee)) return
        if (DEBUG_RERENDERS) console.log('OrganizationProviderLegacy() newState', employee)

        const isEmployeeActive = !employee.isRejected && !employee.isBlocked && employee.isAccepted

        if (!isEmployeeActive) {
            setCookieEmployeeId('')
            setEmployeeIdState(null)
            setActiveEmployee(null)
        } else {
            setCookieEmployeeId(employee.id)
            setEmployeeIdState(employee.id)
            setActiveEmployee(employee)
        }
    }, [data, activeEmployee])

    useEffect(() => {
        if (auth.isLoading) return
        if (!auth.user && activeEmployee !== null) setActiveEmployee(null)
    }, [auth.user])

    function onError (error) {
        // NOTE: In case, when organization from cookie left from old user, and we don't have access to it
        // We'll reset cookie without showing explicit error
        if (error.message.includes('You do not have access to this resource')) {
            setCookieEmployeeId('')
            setEmployeeIdState(null)
            setActiveEmployee(null)
        } else {
            throw error
        }
    }

    const handleSelectLink: OrganizationContextType['selectLink'] = (newEmployee) => {
        if (newEmployee && newEmployee.id) {
            const newId = newEmployee.id
            setEmployeeIdState(newId)
            return refetch({ id: newId })
        } else {
            setCookieEmployeeId('')
            setEmployeeIdState(null)
            setActiveEmployee(null)
            return Promise.resolve()
        }
    }

    const handleSelectEmployee: OrganizationContextType['selectEmployee'] = useCallback((employeeId) => {
        return handleSelectLink({ id: employeeId })
    }, [handleSelectLink])

    if (DEBUG_RERENDERS) console.log('OrganizationProviderLegacy()', activeEmployee, 'loading', employeeLoading, 'skip', (auth.isLoading || !auth.user || !employeeIdState))

    const isLoading = auth.isLoading || employeeLoading

    return (
        <OrganizationContext.Provider
            value={{
                selectLink: handleSelectLink,
                selectEmployee: handleSelectEmployee,
                isLoading: (!auth.user || !employeeIdState) ? false : isLoading,
                link: (activeEmployee && activeEmployee.id) ? activeEmployee : null,
                organization: (activeEmployee && activeEmployee.organization) ? activeEmployee.organization : null,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    )
}

if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) OrganizationProviderLegacy.whyDidYouRender = true

const initOnRestore = async (ctx) => {
    let employeeId, employee = null
    const isOnServerSide = typeof window === 'undefined'
    if (isOnServerSide) {
        const inAppContext = Boolean(ctx.ctx)
        const req = (inAppContext) ? ctx.ctx.req : ctx.req
        employeeId = extractReqEmployeeId(req)
    } else {
        employeeId = getCookieEmployeeId()
    }

    if (employeeId) {
        try {
            const data = await ctx.apolloClient.query({
                query: GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY_LEGACY,
                variables: { id: employeeId },
                fetchPolicy: (isOnServerSide) ? 'network-only' : 'cache-first',
            })
            employee = data.data ? data.data.obj : null
        } catch (error) {
            // Prevent Apollo Client GraphQL errors from crashing SSR.
            // Handle them in components via the data.error prop:
            // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
            console.error('Error while running `withOrganization`', error)
            employee = null
        }
    }

    return { employee }
}

type WithOrganizationLegacyProps = {
    ssr?: boolean
    GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY?: DocumentNode
}
type WithOrganizationLegacyType = (props: WithOrganizationLegacyProps) => (PageComponent: NextPage) => NextPage

/** @deprecated */
const _withOrganizationLegacy: WithOrganizationLegacyType = ({ ssr = false, ...opts } = {}) => PageComponent => {
    // TODO(pahaz): refactor it. No need to patch globals here!
    GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY_LEGACY = opts.GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY ? opts.GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY : GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY_LEGACY

    const WithOrganization = ({ employee, ...pageProps }) => {
        if (DEBUG_RERENDERS) console.log('WithOrganization()', employee)
        return (
            <OrganizationProviderLegacy initialEmployee={employee}>
                <PageComponent {...pageProps} />
            </OrganizationProviderLegacy>
        )
    }

    if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) WithOrganization.whyDidYouRender = true

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName = PageComponent.displayName || PageComponent.name || 'Component'
        WithOrganization.displayName = `withOrganization(${displayName})`
    }

    if (ssr || !isSSR() || PageComponent.getInitialProps) {
        WithOrganization.getInitialProps = async ctx => {
            if (DEBUG_RERENDERS) console.log('WithOrganization.getInitialProps()', ctx)
            const isOnServerSide = typeof window === 'undefined'
            const { employee } = await initOnRestore(ctx)
            const pageProps = await getContextIndependentWrappedInitialProps(PageComponent, ctx)

            if (isOnServerSide) {
                preventInfinityLoop(ctx)
            }

            return {
                ...pageProps,
                employee,
            }
        }
    }

    return WithOrganization
}

type OrganizationProviderProps = {
    useInitialEmployeeId: () => { employeeId?: string | null }
}
const OrganizationProvider: React.FC<React.PropsWithChildren<OrganizationProviderProps>> = ({
    children,
    useInitialEmployeeId,
}) => {
    const { user, isLoading: userLoading } = useAuth()
    const { employeeId } = useInitialEmployeeId()
    const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(employeeId)

    const onError = useCallback((error) => {
        // NOTE: In case, when organization from cookie left from old user, and we don't have access to it
        // We'll reset cookie without showing explicit error
        if (error.message.includes('You do not have access to this resource')) {
            setCookieEmployeeId('')
            setActiveEmployeeId(null)
            setActiveEmployee(null)
        } else {
            throw error
        }
    }, [])

    const { loading: employeeLoading, refetch, data } = useQuery(GET_ORGANIZATION_EMPLOYEE_QUERY, {
        variables: {
            userId: user?.id || null,
            employeeId: activeEmployeeId,
        },
        skip: userLoading || !user || !user.id || !activeEmployeeId,
        onError,
    })

    const isLoading = userLoading || employeeLoading

    const [activeEmployee, setActiveEmployee] = useState(get(data, ['employees', 0]) || null)

    const handleSelectEmployee: OrganizationContextType['selectEmployee'] = useCallback((employeeId) => {
        if (employeeId) {
            setActiveEmployeeId(employeeId)
            return refetch({ employeeId })
        } else {
            setCookieEmployeeId('')
            setActiveEmployeeId(null)
            setActiveEmployee(null)
            return Promise.resolve()
        }
    }, [refetch])

    /** @deprecated */
    const handleSelectLink: OrganizationContextType['selectLink'] = useCallback((newEmployee) => {
        return handleSelectEmployee(newEmployee?.id || null)
    }, [handleSelectEmployee])

    useEffect(() => {
        const employee = get(data, ['employees', 0])
        if (!employee) return

        if (JSON.stringify(employee) === JSON.stringify(activeEmployee)) return
        if (DEBUG_RERENDERS) console.log('OrganizationProvider() newState', employee)

        const isEmployeeActive = !employee.isRejected && !employee.isBlocked && employee.isAccepted

        if (!isEmployeeActive) {
            setCookieEmployeeId('')
            setActiveEmployeeId(null)
            setActiveEmployee(null)
        } else {
            setCookieEmployeeId(employee.id)
            setActiveEmployeeId(employee.id)
            setActiveEmployee(employee)
        }
    }, [data, activeEmployee])

    useEffect(() => {
        if (userLoading) return
        if (!user && activeEmployee !== null) {
            setCookieEmployeeId('')
            setActiveEmployeeId(null)
            setActiveEmployee(null)
        }
    }, [user, userLoading, activeEmployee])

    if (DEBUG_RERENDERS) console.log('OrganizationProvider()', activeEmployee, 'loading', employeeLoading, 'skip', (userLoading || !user || !activeEmployeeId))

    return (
        <OrganizationContext.Provider
            value={{
                selectLink: handleSelectLink,
                selectEmployee: handleSelectEmployee,
                isLoading: (!user || !activeEmployeeId) ? false : isLoading,
                link: (user && activeEmployee && activeEmployee.id) ? activeEmployee : null,
                organization: (user && activeEmployee && activeEmployee.organization) ? activeEmployee.organization : null,
                employee: (user && activeEmployee && activeEmployee.id) ? activeEmployee : null,
                role: (user && activeEmployee && activeEmployee.role) ? activeEmployee.role : null,
            }}
            children={children}
        />
    )
}


type WithOrganizationProps = {
    useInitialEmployeeId: OrganizationProviderProps['useInitialEmployeeId']
    GET_ORGANIZATION_EMPLOYEE_QUERY?: DocumentNode
}
type WithOrganizationType = (props: WithOrganizationProps) => (PageComponent: NextPage) => NextPage

const _withOrganization: WithOrganizationType = (opts) => (PageComponent) => {
    GET_ORGANIZATION_EMPLOYEE_QUERY = opts.GET_ORGANIZATION_EMPLOYEE_QUERY ? opts.GET_ORGANIZATION_EMPLOYEE_QUERY : GET_ORGANIZATION_EMPLOYEE_QUERY

    const WithOrganization = (props) => {
        return (
            <OrganizationProvider useInitialEmployeeId={opts.useInitialEmployeeId}>
                <PageComponent {...props} />
            </OrganizationProvider>
        )
    }

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName =
            PageComponent.displayName || PageComponent.name || 'Component'
        WithOrganization.displayName = `WithOrganization(${displayName})`
    }

    WithOrganization.getInitialProps = PageComponent.getInitialProps

    return WithOrganization
}

type mergedWithOrganizationProps = Either<WithOrganizationProps & { legacy: false }, WithOrganizationLegacyProps & { legacy?: true }>
type mergedWithOrganizationType = (props: mergedWithOrganizationProps) => (PageComponent: NextPage) => NextPage
const withOrganization: mergedWithOrganizationType = (opts) => (PageComponent: NextPage): NextPage => {
    if (opts.legacy === false) {
        return _withOrganization(opts)(PageComponent)
    } else {
        return _withOrganizationLegacy(opts)(PageComponent)
    }
}

export {
    withOrganization,
    useOrganization,
    setCookieEmployeeId,
    removeCookieEmployeeId,
}
