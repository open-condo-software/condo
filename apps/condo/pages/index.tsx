import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

import { useOrganization } from '@open-condo/next/organization'

import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ASSIGNED_TICKET_VISIBILITY, MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'


const IndexPage = () => {
    const router = useRouter()
    const organization = useOrganization()

    useEffect(() => {
        if (get(organization, ['organization', 'type'], MANAGING_COMPANY_TYPE) === SERVICE_PROVIDER_TYPE) {
            router.push('/billing')
        } else if (get(organization, ['link', 'role', 'ticketVisibilityType']) !== ASSIGNED_TICKET_VISIBILITY) {
            router.push('/reports')
        }
    }, [organization, router])
    return <></>
}

IndexPage.requiredAccess = OrganizationRequired

export default IndexPage
