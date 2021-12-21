import React from 'react'
import Head from 'next/head'
import { PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { IFrame } from '@condo/domains/common/components/IFrame'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'

const ContactsPage = () => {
    const { organization } = useOrganization()

    return (
        <>
            <Head>
                <title>Страница с iframe</title>
            </Head>
            {/*<FeatureFlagRequired name={'playground'} fallback={<Error statusCode={404}/>}>*/}
            <PageWrapper>
                {get(organization, 'id')}
                <IFrame pageUrl={'http://localhost:3002/import'}/>
            </PageWrapper>
            {/*</FeatureFlagRequired>*/}
        </>
    )
}

export default ContactsPage
