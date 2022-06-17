import { Organization } from '@app/condo/schema'
import getConfig from 'next/config'
import React, { useContext } from 'react'
import { createCondoBridge } from '@miniapp/domains/common/clients/CondoBridge'

interface IUseOrganizationHookValue {
    organization?: Organization,
    isLoading?: boolean,
}

const { publicRuntimeConfig: { condoUrl } } = getConfig()
const condoBridge = createCondoBridge({ receiverOrigin: condoUrl })
const OrganizationContext = React.createContext<IUseOrganizationHookValue>({})

const useOrganization = () => useContext(OrganizationContext)

const OrganizationProvider = ({ children }) => {
    let ret
    const { result: organization, isLoading } = condoBridge.useOrganization()

    if (isLoading || organization === undefined) {
        ret = <div>Getting organization...</div>
    } else if (organization === null) {
        ret = <div>No organization found</div>
    } else {
        ret = (
            <OrganizationContext.Provider value={{ organization, isLoading }}>
                {children}
            </OrganizationContext.Provider>
        )
    }

    return ret
}

const withOrganization = () => (PageComponent) => {
    const WithOrg = ({ organization, ...pageProps }) => {
        return (
            <OrganizationProvider>
                <PageComponent {...pageProps} />
            </OrganizationProvider>
        )
    }

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName = PageComponent.displayName || PageComponent.name || 'Component'
        WithOrg.displayName = `withOrganization(${displayName})`
    }

    return WithOrg
}

export { useOrganization, withOrganization }
