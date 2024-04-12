import get from 'lodash/get'
import pickBy from 'lodash/pickBy'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo } from 'react'

import { useOrganization } from '@open-condo/next/organization'

import { SECOND_LEVEL_STEPS } from '@condo/domains/onboarding/constants/steps'
import { TourStep } from '@condo/domains/onboarding/utils/clientSchema'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'

import { TourStepStatusType } from '../schema'

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
    const organizationId = useMemo(() => get(organization, 'organization.id', null), [])

    const { count: completedTourStepsCount, loading : completedTourStepsCountLoading } = TourStep.useCount({
        where: {
            organization: { id: organizationId },
            type_in: SECOND_LEVEL_STEPS,
            status: TourStepStatusType.Completed,
        },
    }, { skip: !organizationId })

    useEffect(() => {
        const role = get(organization, 'link.role')
        if (role) {
            if (get(organization, ['organization', 'type'], MANAGING_COMPANY_TYPE) === SERVICE_PROVIDER_TYPE) {
                router.push('/billing')
            } else {
                if (completedTourStepsCountLoading) return

                const userAccesses = Object.keys(pickBy(role, (value, key) => key.startsWith('canRead') && value === true))

                if (completedTourStepsCount < SECOND_LEVEL_STEPS.length) {
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
    }, [organization, router, completedTourStepsCountLoading, completedTourStepsCount])

    return <></>
}

IndexPage.requiredAccess = OrganizationRequired

export default IndexPage
