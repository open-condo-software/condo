import React, { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from './apollo'
import gql from 'graphql-tag'
import cookie from 'js-cookie'
import { useAuth } from './auth'
import nextCookie from 'next-cookies'

const { DEBUG_RERENDERS, DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER, preventInfinityLoop, getContextIndependentWrappedInitialProps } = require('./_utils')

const OrganizationContext = createContext({})

const useOrganization = () => useContext(OrganizationContext)

const organizationToUserFragment = `
    id
    organization {
      id
      name
      description
      avatar {
        publicUrl
      }
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

let setCookieLinkId = (value) => {
    if (typeof window !== 'undefined') {
        cookie.set('organizationLinkId', value, { expires: 365 })
    }
}

let getLinkId = () => {
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

let extractReqLinkId = (req) => {
    try {
        return nextCookie({ req }).organizationLinkId || null
    } catch (e) {
        return null
    }
}

const OrganizationProvider = ({ children, initialLinkValue }) => {
    const auth = useAuth()
    const [linkIdState, setLinkIdState] = useState(initialLinkValue && initialLinkValue.id || getLinkId())
    const [link, setLink] = useState(initialLinkValue)

    const { loading: linkLoading, refetch } = useQuery(GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY, {
        variables: { id: linkIdState },
        skip: auth.isLoading || !auth.user || !linkIdState,
        onCompleted: (data) => {
            if (!data) return // TODO(pahaz): remove ofter resolve: https://github.com/apollographql/react-apollo/issues/3492
            // NOTE: if skip == true the data = null
            const { obj } = data
            if (JSON.stringify(obj) === JSON.stringify(link)) return
            if (DEBUG_RERENDERS) console.log('OrganizationProvider() newState', obj)
            setCookieLinkId(obj.id)
            setLinkIdState(obj.id)
            setLink(obj)
        },
        onError,
    })

    useEffect(() => {
        if (auth.isLoading) return
        if (!auth.user && link !== null) setLink(null)
    }, [auth.user])

    function onError (error) {
        console.error(error)
        setCookieLinkId('')
        setLinkIdState(null)
        setLink(null)
        throw error
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

    if (DEBUG_RERENDERS) console.log('OrganizationProvider()', link, 'loading', linkLoading, 'skip', (auth.isLoading || !auth.user || !linkIdState))

    return (
        <OrganizationContext.Provider
            value={{
                selectLink: handleSelectItem,
                isLoading: (!auth.user || !linkIdState) ? false : linkLoading,
                link: (link && link.id) ? link : null,
                organization: (link && link.organization) ? link.organization : null,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    )
}

if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) OrganizationProvider.whyDidYouRender = true

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

const withOrganization = ({ ssr = false, ...opts } = {}) => PageComponent => {
    // TODO(pahaz): refactor it. No need to patch globals here!
    GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY = opts.GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY ? opts.GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY : GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY

    const WithOrganization = ({ link, ...pageProps }) => {
        if (DEBUG_RERENDERS) console.log('WithOrganization()', link)
        return (
            <OrganizationProvider initialLinkValue={link}>
                <PageComponent {...pageProps} />
            </OrganizationProvider>
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

export {
    withOrganization,
    useOrganization,
}
