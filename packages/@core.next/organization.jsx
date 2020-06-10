import React, { createContext, useContext, useState, useEffect } from 'react'
import { useApolloClient, useLazyQuery } from './apollo'
import gql from 'graphql-tag'
import cookie from 'js-cookie'
import { useAuth } from './auth'
import nextCookie from 'next-cookies'

const { DEBUG_RERENDERS, preventInfinityLoop, getContextIndependentWrappedInitialProps } = require('./_utils')

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

let getLink = () => {
    let state = null
    if (typeof window !== 'undefined') {
        try {
            const cookieState = cookie.get('organizationLink')
            if (cookieState) state = JSON.parse(state)
        } catch (e) {
            console.warn('JSON parse organization value error:', e)
            state = null
        }
    }
    return state
}

let extractReqLink = (req) => {
    let state = null
    try {
        const cookieState = nextCookie({ req }).organizationLink
        if (typeof cookieState === 'object') state = cookieState
    } catch (e) {
        console.error(e)
        state = null
    }
    return state
}

const OrganizationProvider = ({ children, initialLink }) => {
    const client = useApolloClient()
    const auth = useAuth()
    const [state, setState] = useState(initialLink || getLink())
    useEffect(() => {
        // validate changed!
        if (!state) return
        runUpdateQuery(state.id)
    })

    function safeSetState (obj) {
        if (JSON.stringify(obj) === JSON.stringify(state)) return
        if (DEBUG_RERENDERS) console.log('OrganizationProvider() newState', obj)
        cookie.set('organizationLink', JSON.stringify(obj), { expires: 365 })
        setState(obj)
    }

    function runUpdateQuery (id) {
        return client.query({
            query: GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY,
            variables: { id: id },
        }).then(({ data }) => {
            if (String(auth.user.id) === String(data.obj.user.id)) {
                safeSetState(data.obj)
            } else {
                console.error('auth.user.id === data.user.id', data, auth)
                safeSetState(null)
            }
        }, (error) => {
            console.error(error)
            safeSetState(null)
        })
    }

    if (DEBUG_RERENDERS) console.log('OrganizationProvider()', state)

    return (
        <OrganizationContext.Provider
            value={{
                selectLink: (linkItem) => runUpdateQuery(linkItem.id),
                link: (state && state.id) ? state : null,
                organization: (state && state.organization) ? state.organization : null,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    )
}

if (DEBUG_RERENDERS) OrganizationProvider.whyDidYouRender = true

const withOrganization = ({ ssr = false, ...opts } = {}) => PageComponent => {
    // TODO(pahaz): refactor it. No need to patch globals here!
    GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY = opts.GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY ? opts.GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY : GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY
    getLink = opts.getLink ? opts.getLink : getLink
    extractReqLink = opts.extractReqLink ? opts.extractReqLink : extractReqLink

    const WithOrganization = ({ link, ...pageProps }) => {
        if (DEBUG_RERENDERS) console.log('WithOrganization()', link)
        return (
            <OrganizationProvider initialLink={link}>
                <PageComponent {...pageProps} />
            </OrganizationProvider>
        )
    }

    if (DEBUG_RERENDERS) WithOrganization.whyDidYouRender = true

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName = PageComponent.displayName || PageComponent.name || 'Component'
        WithOrganization.displayName = `withOrganization(${displayName})`
    }

    if (ssr || PageComponent.getInitialProps) {
        WithOrganization.getInitialProps = async ctx => {
            const inAppContext = Boolean(ctx.ctx)
            const req = (inAppContext) ? ctx.ctx.req : ctx.req
            const link = extractReqLink(req)
            const pageProps = await getContextIndependentWrappedInitialProps(PageComponent, ctx)
            preventInfinityLoop(ctx)
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
