import { ASSIGNED_TICKET_VISIBILITY } from '@condo/domains/organization/constants/common'
import get from 'lodash/get'
import React, { useEffect } from 'react'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { useRouter } from 'next/router'
import { useOrganization } from '@open-condo/next/organization'


const IndexPage = () => {
    const router = useRouter()
    const organization = useOrganization()

    useEffect(() => {
        if (get(organization, ['link', 'role', 'ticketVisibilityType']) !== ASSIGNED_TICKET_VISIBILITY) {
            router.push('/reports')
        }
    }, [organization, router])
    return <></>
}

IndexPage.requiredAccess = OrganizationRequired

export default IndexPage
