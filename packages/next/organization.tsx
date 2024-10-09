import { ApolloQueryResult } from '@apollo/client'
import { DocumentNode } from 'graphql'
import { gql } from 'graphql-tag'
import cookie from 'js-cookie'
import get from 'lodash/get'
import { NextPage } from 'next'
import nextCookie from 'next-cookies'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

import { DEBUG_RERENDERS, DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER, preventInfinityLoop, getContextIndependentWrappedInitialProps } from './_utils'
import { useQuery } from './apollo'
import { useAuth } from './auth'


type OrganizationContextType<GetActiveOrganizationEmployeeQuery = any, Link = any, Organization = any> = {
    selectLink: (linkItem: { id: string }) => (Promise<ApolloQueryResult<GetActiveOrganizationEmployeeQuery>> | Promise<void>)
    isLoading: boolean
    link?: Link | null
    organization?: Organization | null
}

const OrganizationContext = createContext<OrganizationContextType>({
    isLoading: false,
    selectLink: () => Promise.resolve(),
})

const useOrganization = <GetActiveOrganizationEmployeeQuery = any, Link = any, Organization = any> (): OrganizationContextType<GetActiveOrganizationEmployeeQuery, Link, Organization> => useContext(OrganizationContext)

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
    role
`

let GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY = gql`
    query getOrganizationToUserLinkById($id: ID!) {
        obj: OrganizationToUserLink (where: {id: $id}) {
            ${organizationToUserFragment}
        }
    }
`

const setCookieLinkId = (value) => {
    if (typeof window !== 'undefined') {
        cookie.set('organizationLinkId', value, { expires: 365 })
    }
}

const getLinkId = () => {
    let state = null
    if (typeof window !== 'undefined') {
        try {
            state = cookie.get('organizationLinkId') || null
        } catch (e) {
            state = null
        }
    }
    return state
}

const extractReqLinkId = (req) => {
    try {
        return nextCookie({ req }).organizationLinkId || null
    } catch (e) {
        return null
    }
}

const OrganizationProviderLegacy = ({ children, initialLinkValue }) => {
    const auth = useAuth()
    const cookieOrganizationEmployee = getLinkId()
    const [linkIdState, setLinkIdState] = useState(initialLinkValue && initialLinkValue.id || cookieOrganizationEmployee)
    const [link, setLink] = useState(initialLinkValue)

    useEffect(() => {
        if (!(initialLinkValue && initialLinkValue.id || cookieOrganizationEmployee)) {
            setLinkIdState(null)
        }
    }, [initialLinkValue, cookieOrganizationEmployee])

    const { loading: linkLoading, refetch, data } = useQuery(GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY, {
        variables: { id: linkIdState },
        skip: auth.isLoading || !auth.user || !linkIdState,
        onError,
    })

    useEffect(() => {
        if (!data) return

        const employee = data.obj
        if (JSON.stringify(employee) === JSON.stringify(link)) return
        if (DEBUG_RERENDERS) console.log('OrganizationProviderLegacy() newState', employee)

        const isEmployeeActive = !employee.isRejected && !employee.isBlocked && employee.isAccepted

        if (!isEmployeeActive) {
            setCookieLinkId('')
            setLinkIdState(null)
            setLink(null)
        } else {
            setCookieLinkId(employee.id)
            setLinkIdState(employee.id)
            setLink(employee)
        }
    }, [data, link])

    useEffect(() => {
        if (auth.isLoading) return
        if (!auth.user && link !== null) setLink(null)
    }, [auth.user])

    function onError (error) {
        // NOTE: In case, when organization from cookie left from old user, and we don't have access to it
        // We'll reset cookie without showing explicit error
        if (error.message.includes('You do not have access to this resource')) {
            setCookieLinkId('')
            setLinkIdState(null)
            setLink(null)
        } else {
            throw error
        }
    }

    function handleSelectItem (linkItem) {
        if (linkItem && linkItem.id) {
            const newId = linkItem.id
            setLinkIdState(newId)
            return refetch({ id: newId })
        } else {
            setCookieLinkId('')
            setLinkIdState(null)
            setLink(null)
            return Promise.resolve()
        }
    }

    if (DEBUG_RERENDERS) console.log('OrganizationProviderLegacy()', link, 'loading', linkLoading, 'skip', (auth.isLoading || !auth.user || !linkIdState))

    const isLoading = auth.isLoading || linkLoading

    return (
        <OrganizationContext.Provider
            value={{
                selectLink: handleSelectItem,
                isLoading: (!auth.user || !linkIdState) ? false : isLoading,
                link: (link && link.id) ? link : null,
                organization: (link && link.organization) ? link.organization : null,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    )
}

if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) OrganizationProviderLegacy.whyDidYouRender = true

const initOnRestore = async (ctx) => {
    let linkId, link = null
    const isOnServerSide = typeof window === 'undefined'
    if (isOnServerSide) {
        const inAppContext = Boolean(ctx.ctx)
        const req = (inAppContext) ? ctx.ctx.req : ctx.req
        linkId = extractReqLinkId(req)
    } else {
        linkId = getLinkId()
    }

    if (linkId) {
        try {
            const data = await ctx.apolloClient.query({
                query: GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY,
                variables: { id: linkId },
                fetchPolicy: (isOnServerSide) ? 'network-only' : 'cache-first',
            })
            link = data.data ? data.data.obj : null
        } catch (error) {
            // Prevent Apollo Client GraphQL errors from crashing SSR.
            // Handle them in components via the data.error prop:
            // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
            console.error('Error while running `withOrganization`', error)
            link = null
        }
    }

    return { link }
}

type WithOrganizationProps = {
    ssr?: boolean
    GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY?: DocumentNode
}
export type WithOrganization = (props: WithOrganizationProps) => (PageComponent: NextPage<any>) => NextPage<any>

const _withOrganizationLegacy: WithOrganization = ({ ssr = false, ...opts } = {}) => PageComponent => {
    // TODO(pahaz): refactor it. No need to patch globals here!
    GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY = opts.GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY ? opts.GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY : GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY

    const WithOrganization = ({ link, ...pageProps }) => {
        if (DEBUG_RERENDERS) console.log('WithOrganization()', link)
        return (
            <OrganizationProviderLegacy initialLinkValue={link}>
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
            const { link } = await initOnRestore(ctx)
            const pageProps = await getContextIndependentWrappedInitialProps(PageComponent, ctx)

            if (isOnServerSide) {
                preventInfinityLoop(ctx)
            }

            return {
                ...pageProps,
                link,
            }
        }
    }

    return WithOrganization
}

const OrganizationProvider: React.FC<{ useOrganizationLinkId: () => { organizationLinkId?: string | null } }> = ({ children, useOrganizationLinkId }) => {
    const auth = useAuth()
    const { organizationLinkId } = useOrganizationLinkId()
    const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(organizationLinkId)

    const onError = useCallback((error) => {
        // console.log('OrganizationProvider:onError:: >>>', error)
        // NOTE: In case, when organization from cookie left from old user, and we don't have access to it
        // We'll reset cookie without showing explicit error
        if (error.message.includes('You do not have access to this resource')) {
            setCookieLinkId('')
            setActiveEmployeeId(null)
            console.log('OrganizationProvider:ERROR to null: >>>', { error })
            setActiveEmployee(null)
        } else {
            throw error
        }
    }, [])

    // TODO(INFRA-574): pass variables in props?
    const { loading: employeeLoading, refetch, data } = useQuery(GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY, {
        variables: {
            where: {
                organization: { type: 'MANAGING_COMPANY' }, // or 'HOLDING
                user: { id: auth.user.id, type: 'staff' },
                id: activeEmployeeId,
                isAccepted: true,
                isBlocked: false,
                isRejected: false,
            },
        },
        skip: auth.isLoading || !auth.user || !auth.user.id || !activeEmployeeId,
        onError,
    })

    const isLoading = auth.isLoading || employeeLoading

    const [activeEmployee, setActiveEmployee] = useState(get(data, ['employees', 0]) || null) // TODO(INFRA-574)

    const handleSelectItem: OrganizationContextType['selectLink'] = useCallback((linkItem) => {
        console.log('OrganizationProvider:handleSelectItem:: >>>', {
            linkItem,
        })
        if (linkItem && linkItem.id) {
            const newId = linkItem.id
            setActiveEmployeeId(newId)
            return refetch({ where: { id: newId } })
        } else {
            setCookieLinkId('')
            setActiveEmployeeId(null)
            console.log('OrganizationProvider:handleSelectItem:to null: >>>', { linkItem })
            setActiveEmployee(null)
            return Promise.resolve()
        }
    }, [])

    // const handleSelectEmployee: OrganizationContextType['selectEmployee'] = useCallback((employeeId) => {
    //     return handleSelectItem({ id: employeeId })
    // }, [handleSelectItem])

    useEffect(() => {
        const employee = get(data, ['employees', 0]) // TODO(INFRA-574)
        if (!employee) return

        if (JSON.stringify(employee) === JSON.stringify(activeEmployee)) return
        if (DEBUG_RERENDERS) console.log('OrganizationProvider() newState', employee)

        const isEmployeeActive = !employee.isRejected && !employee.isBlocked && employee.isAccepted

        console.log('OrganizationProvider:if (!isEmployeeActive) {:: >>>', { isEmployeeActive, employee, data })

        if (!isEmployeeActive) {
            setCookieLinkId('')
            setActiveEmployeeId(null)
            console.log('OrganizationProvider:if (!isEmployeeActive) {:to null: >>>', { isEmployeeActive, activeEmployee, employee, data })
            setActiveEmployee(null)
        } else {
            setCookieLinkId(employee.id)
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
        organizationLinkId,

        activeEmployee,

        selectLink: handleSelectItem,
        isLoading: (!auth.user || !activeEmployeeId) ? false : isLoading,
        link: (activeEmployee && activeEmployee.id) ? activeEmployee : null,
        employee: (activeEmployee && activeEmployee.id) ? activeEmployee : null,
        organization: (activeEmployee && activeEmployee.organization) ? activeEmployee.organization : null,
        role: (activeEmployee && activeEmployee.role) ? activeEmployee.role : null,
    })

    return (
        <OrganizationContext.Provider
            value={{
                selectLink: handleSelectItem,
                isLoading: (!auth.user || !activeEmployeeId) ? false : isLoading,
                link: (activeEmployee && activeEmployee.id) ? activeEmployee : null,
                organization: (activeEmployee && activeEmployee.organization) ? activeEmployee.organization : null,
            }}
            children={children}
        />
    )
}

const _withOrganization = ({ useOrganizationLinkId, ...opts }) => (PageComponent: NextPage): NextPage => {
    GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY = opts.GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY ? opts.GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY : GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY

    const WithOrganization = (props) => {
        return (
            <OrganizationProvider useOrganizationLinkId={useOrganizationLinkId}>
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

const withOrganization = ({ legacy = true, ...opts }: any) => (PageComponent: NextPage): NextPage => {
    if (legacy) {
        return _withOrganizationLegacy(opts)(PageComponent)
    }

    return _withOrganization(opts)(PageComponent)
}

export {
    withOrganization,
    useOrganization,
    setCookieLinkId,
}
