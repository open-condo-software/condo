import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { PageComponentType } from '@condo/domains/common/types'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

const CoworkIndexPage: PageComponentType = () => {
    const router = useRouter()

    useEffect(() => {
        void router.replace('/ai-engineer/chat')
    }, [router])

    return null
}

CoworkIndexPage.requiredAccess = OrganizationRequired

export default CoworkIndexPage
