import Error from 'next/error'
import { useRouter } from 'next/router'
import React from 'react'

import { PageComponentType } from '@condo/domains/common/types'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { B2BAppPage } from '@condo/domains/miniapp/components/AppDescription'
import { ServicesReadPermissionRequired } from '@condo/domains/miniapp/components/PageAccess'


const MiniappDescriptionPage: PageComponentType = () => {
    const { query: { id } } = useRouter()

    if (Array.isArray(id) || !id || !isSafeUrl(id)) return <Error statusCode={404}/>

    return <B2BAppPage id={id}/>
}

MiniappDescriptionPage.requiredAccess = ServicesReadPermissionRequired

export default MiniappDescriptionPage
