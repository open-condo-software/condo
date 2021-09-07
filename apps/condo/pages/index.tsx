import React, { useEffect } from 'react'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { useRouter } from 'next/router'

const IndexPage = () => {
    const router = useRouter()
    useEffect(() => {
        router.push('/reports')
    }, [])
    return <></>
}

IndexPage.requiredAccess = OrganizationRequired

export default IndexPage
