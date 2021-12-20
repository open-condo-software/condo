import React from 'react'
import Head from 'next/head'
import { PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useIFrame } from '@condo/domains/common/hooks/useIFrame'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'

const ContactsPage = () => {
    const iframe = useIFrame('http://localhost:3002/import')
    const { organization } = useOrganization()

    return (
        <>
            <Head>
                <title>Страница с iframe</title>
            </Head>
            <PageWrapper>
                {get(organization, 'id')}
                {iframe}
            </PageWrapper>
        </>
    )
}

export default ContactsPage
