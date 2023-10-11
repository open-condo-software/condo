import Error from 'next/error'
import { useRouter } from 'next/router'
import React from 'react'

import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { B2BAppPage } from '@condo/domains/miniapp/components/AppIndex'
import { ServicesReadPermissionRequired } from '@condo/domains/miniapp/components/PageAccess'


type PageType = React.FC & {
    requiredAccess: React.ReactNode
}

const MiniAppIndexPage: PageType = () => {
    const { query: { id } } = useRouter()

    if (Array.isArray(id) || !id || !isSafeUrl(id)) {
        return <Error statusCode={404}/>
    }

    return <B2BAppPage id={id}/>
}

MiniAppIndexPage.requiredAccess = ServicesReadPermissionRequired

export default MiniAppIndexPage