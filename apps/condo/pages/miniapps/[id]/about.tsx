import Error from 'next/error'
import { useRouter } from 'next/router'
import React from 'react'

import { prepareSSRContext } from '@open-condo/miniapp-utils'
import { initializeApollo } from '@open-condo/next/apollo'


import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import { extractSSRState } from '@condo/domains/common/utils/next/ssr'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { B2BAppPage } from '@condo/domains/miniapp/components/AppDescription'
import { ServicesReadPermissionRequired } from '@condo/domains/miniapp/components/PageAccess'

import type { GetServerSideProps } from 'next'


type PageType = React.FC & {
    requiredAccess: React.ReactNode
}

const MiniappDescriptionPage: PageType = () => {
    const { query: { id } } = useRouter()

    if (Array.isArray(id) || !id || !isSafeUrl(id)) return <Error statusCode={404}/>

    return <B2BAppPage id={id}/>
}

MiniappDescriptionPage.requiredAccess = ServicesReadPermissionRequired

export default MiniappDescriptionPage

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { req, res } = context

    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const { redirect, user } = await prefetchAuthOrRedirect(client, context)
    if (redirect) return redirect

    await prefetchOrganizationEmployee({ client, context, userId: user.id })

    return extractSSRState(client, req, res, {
        props: {},
    })
}
