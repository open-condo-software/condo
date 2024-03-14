import get from 'lodash/get'
import pickBy from 'lodash/pickBy'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useOrganization } from '@open-condo/next/organization'

import { ORGANIZATION_TOUR } from '@condo/domains/common/constants/featureflags'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'

// Equality of read access name of OrganizationEmployeeRole and page url sorted by menu items order
const ACCESS_REDIRECTS = {
    canReadAnalytics: '/reports',
    canReadTickets: '/ticket',
    canReadIncidents: '/incident',
    canReadNewsItems: '/news',
    canReadProperties: '/property',
    canReadContacts: '/contact',
    canReadEmployees: '/employee',
    canReadPayments: '/billing',
    canReadBillingReceipts: '/billing',
}

const IndexPage = () => {
    const router = useRouter()
    const organization = useOrganization()
    const { useFlag } = useFeatureFlags()
    const isTourEnabled = useFlag(ORGANIZATION_TOUR)

    useEffect(() => {
        const role = get(organization, 'link.role')
        if (role) {
            if (get(organization, ['organization', 'type'], MANAGING_COMPANY_TYPE) === SERVICE_PROVIDER_TYPE) {
                router.push('/billing')
            } else {
                const userAccesses = Object.keys(pickBy(role, (value, key) => key.startsWith('canRead') && value === true))

                if (isTourEnabled) {
                    router.push('/tour')
                    return
                }

                // Find first available page and redirect user from index page
                const foundRedirect = Object.keys(ACCESS_REDIRECTS)
                    .find(accessRedirect => userAccesses.includes(accessRedirect))
                if (foundRedirect) {
                    router.push(ACCESS_REDIRECTS[foundRedirect])
                } else {
                    router.push('/user')
                }
            }
        }
    }, [isTourEnabled, organization, router])
    return <></>
}

IndexPage.requiredAccess = OrganizationRequired

export default IndexPage
