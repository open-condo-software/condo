import { ApolloQueryResult } from '@apollo/client'
import { DocumentNode } from 'graphql'
import { gql } from 'graphql-tag'
import cookie from 'js-cookie'
import get from 'lodash/get'
import { NextPage } from 'next'
import nextCookie from 'next-cookies'
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

import { DEBUG_RERENDERS, DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER, preventInfinityLoop, getContextIndependentWrappedInitialProps } from './_utils'
import { useQuery } from './apollo'
import { useAuth } from './auth'
import { Either } from './types'


// NOTE: OpenCondoNext is defined as a global namespace so the library user can override the default types
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace OpenCondoNext {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface GetActiveOrganizationEmployeeQueryType {}
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface LinkType {}
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface OrganizationType {}
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface EmployeeType {}
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
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
    : OpenCondoNext.LinkType
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
    query getOrganizationEmployee($where: OrganizationEmployeeWhereInput!) {
        employee: OrganizationEmployee (where: $where) {
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
    const [employee, setEmployee] = useState(initialEmployee)

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
        if (JSON.stringify(employee) === JSON.stringify(employee)) return
        if (DEBUG_RERENDERS) console.log('OrganizationProviderLegacy() newState', employee)

        const isEmployeeActive = !employee.isRejected && !employee.isBlocked && employee.isAccepted

        if (!isEmployeeActive) {
            setCookieEmployeeId('')
            setEmployeeIdState(null)
            setEmployee(null)
        } else {
            setCookieEmployeeId(employee.id)
            setEmployeeIdState(employee.id)
            setEmployee(employee)
        }
    }, [data, employee])

    useEffect(() => {
        if (auth.isLoading) return
        if (!auth.user && employee !== null) setEmployee(null)
    }, [auth.user])

    function onError (error) {
        // NOTE: In case, when organization from cookie left from old user, and we don't have access to it
        // We'll reset cookie without showing explicit error
        if (error.message.includes('You do not have access to this resource')) {
            setCookieEmployeeId('')
            setEmployeeIdState(null)
            setEmployee(null)
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
            setEmployee(null)
            return Promise.resolve()
        }
    }

    const handleSelectEmployee: OrganizationContextType['selectEmployee'] = useCallback((employeeId) => {
        return handleSelectLink({ id: employeeId })
    }, [handleSelectLink])

    if (DEBUG_RERENDERS) console.log('OrganizationProviderLegacy()', employee, 'loading', employeeLoading, 'skip', (auth.isLoading || !auth.user || !employeeIdState))

    const isLoading = auth.isLoading || employeeLoading

    return (
        <OrganizationContext.Provider
            value={{
                selectLink: handleSelectLink,
                selectEmployee: handleSelectEmployee,
                isLoading: (!auth.user || !employeeIdState) ? false : isLoading,
                link: (employee && employee.id) ? employee : null,
                organization: (employee && employee.organization) ? employee.organization : null,
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
type WithOrganizationLegacy = (props: WithOrganizationLegacyProps) => (PageComponent: NextPage) => NextPage

/** @deprecated */
const _withOrganizationLegacy: WithOrganizationLegacy = ({ ssr = false, ...opts } = {}) => PageComponent => {
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

    if (ssr || PageComponent.getInitialProps) {
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
    useEmployeeId?: () => { employeeId?: string | null }
    getEmployeeWhere?: (userId: string) => Record<string, unknown>
}
const OrganizationProvider: React.FC<OrganizationProviderProps> = ({
    children,
    useEmployeeId = () => null,
    getEmployeeWhere,
}) => {
    const auth = useAuth()
    const { employeeId } = useEmployeeId()
    const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(employeeId)

    const onError = useCallback((error) => {
        // console.log('OrganizationProvider:onError:: >>>', error)
        // NOTE: In case, when organization from cookie left from old user, and we don't have access to it
        // We'll reset cookie without showing explicit error
        if (error.message.includes('You do not have access to this resource')) {
            setCookieEmployeeId('')
            setActiveEmployeeId(null)
            console.log('OrganizationProvider:ERROR to null: >>>', { error })
            setActiveEmployee(null)
        } else {
            throw error
        }
    }, [])

    const employeeWhere = useMemo(() => {
        if (!getEmployeeWhere) return { id: activeEmployeeId }

        return {
            ...getEmployeeWhere(get(auth, ['user', 'id'], null)),
            id: activeEmployeeId,
        }
    }, [activeEmployeeId, auth, getEmployeeWhere])

    const { loading: employeeLoading, refetch, data } = useQuery(GET_ORGANIZATION_EMPLOYEE_QUERY, {
        variables: {
            where: employeeWhere,
        },
        skip: auth.isLoading || !auth.user || !auth.user.id || !activeEmployeeId,
        onError,
    })

    const isLoading = auth.isLoading || employeeLoading

    const [activeEmployee, setActiveEmployee] = useState(get(data, ['employees', 0]) || null)

    /** @deprecated */
    const handleSelectLink: OrganizationContextType['selectLink'] = useCallback((newEmployee) => {
        console.log('OrganizationProvider:handleSelectEmployee:: >>>', {
            newEmployee,
        })
        if (newEmployee && newEmployee.id) {
            const newId = newEmployee.id
            setActiveEmployeeId(newId)
            return refetch({ where: { id: newId } })
        } else {
            setCookieEmployeeId('')
            setActiveEmployeeId(null)
            console.log('OrganizationProvider:handleSelectEmployee:to null: >>>', { newEmployee })
            setActiveEmployee(null)
            return Promise.resolve()
        }
    }, [])

    const handleSelectEmployee: OrganizationContextType['selectEmployee'] = useCallback((employeeId) => {
        return handleSelectLink({ id: employeeId })
    }, [handleSelectLink])

    useEffect(() => {
        const employee = get(data, ['employees', 0])
        if (!employee) return

        if (JSON.stringify(employee) === JSON.stringify(activeEmployee)) return
        if (DEBUG_RERENDERS) console.log('OrganizationProvider() newState', employee)

        const isEmployeeActive = !employee.isRejected && !employee.isBlocked && employee.isAccepted

        console.log('OrganizationProvider:if (!isEmployeeActive) {:: >>>', { isEmployeeActive, employee, data })

        if (!isEmployeeActive) {
            setCookieEmployeeId('')
            setActiveEmployeeId(null)
            console.log('OrganizationProvider:if (!isEmployeeActive) {:to null: >>>', { isEmployeeActive, activeEmployee, employee, data })
            setActiveEmployee(null)
        } else {
            setCookieEmployeeId(employee.id)
            setActiveEmployeeId(employee.id)
            setActiveEmployee(employee)
        }
    }, [data, activeEmployee])

    useEffect(() => {
        if (auth.isLoading) return
        if (!auth.user && activeEmployee !== null) {
            console.log('OrganizationProvider:change auth.user:: >>>', { auth, activeEmployee })
            setActiveEmployee(null)
        }
    }, [auth.user])

    if (DEBUG_RERENDERS) console.log('OrganizationProvider()', activeEmployee, 'loading', employeeLoading, 'skip', (auth.isLoading || !auth.user || !activeEmployeeId))

    console.log('OrganizationProvider::: >>>', {
        loading: employeeLoading, data,
        skip: auth.isLoading || !auth.user || !activeEmployeeId,
        variables: { id: activeEmployeeId },
        auth,
        activeEmployeeId,

        activeEmployee,

        selectLink: handleSelectEmployee,
        isLoading: (!auth.user || !activeEmployeeId) ? false : isLoading,
        link: (activeEmployee && activeEmployee.id) ? activeEmployee : null,
        employee: (activeEmployee && activeEmployee.id) ? activeEmployee : null,
        organization: (activeEmployee && activeEmployee.organization) ? activeEmployee.organization : null,
        role: (activeEmployee && activeEmployee.role) ? activeEmployee.role : null,
    })

    return (
        <OrganizationContext.Provider
            value={{
                selectLink: handleSelectLink,
                selectEmployee: handleSelectEmployee,
                isLoading: (!auth.user || !activeEmployeeId) ? false : isLoading,
                link: (activeEmployee && activeEmployee.id) ? activeEmployee : null,
                organization: (activeEmployee && activeEmployee.organization) ? activeEmployee.organization : null,
                employee: (activeEmployee && activeEmployee.id) ? activeEmployee : null,
                role: (activeEmployee && activeEmployee.role) ? activeEmployee.role : null,
            }}
            children={children}
        />
    )
}


type WithOrganizationProps = {
    useEmployeeId?: OrganizationProviderProps['useEmployeeId']
    getEmployeeWhere?: OrganizationProviderProps['getEmployeeWhere']
    GET_ORGANIZATION_EMPLOYEE_QUERY?: DocumentNode
}
type WithOrganization = (props: WithOrganizationProps) => (PageComponent: NextPage) => NextPage

const _withOrganization: WithOrganization = (opts) => (PageComponent) => {
    GET_ORGANIZATION_EMPLOYEE_QUERY = opts.GET_ORGANIZATION_EMPLOYEE_QUERY ? opts.GET_ORGANIZATION_EMPLOYEE_QUERY : GET_ORGANIZATION_EMPLOYEE_QUERY

    const WithOrganization = (props) => {
        return (
            <OrganizationProvider useEmployeeId={opts?.useEmployeeId} getEmployeeWhere={opts?.getEmployeeWhere}>
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
type mergedWithOrganization = (props: mergedWithOrganizationProps) => (PageComponent: NextPage) => NextPage
const withOrganization: mergedWithOrganization = ({ legacy = true, ...opts }) => (PageComponent: NextPage): NextPage => {
    if (legacy) {
        return _withOrganizationLegacy(opts)(PageComponent)
    }

    return _withOrganization(opts)(PageComponent)
}

export {
    withOrganization,
    useOrganization,
    setCookieEmployeeId,
    removeCookieEmployeeId,
}
