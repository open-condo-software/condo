import React from 'react'
import Head from 'next/head'
import Error from 'next/error'
import { useIntl } from '@core/next/intl'
import { PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { FeatureFlagRequired } from '@condo/domains/common/components/containers/FeatureFlag'
import Content from '@condo/domains/miniapp/components/AppDescription'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'

const AboutAcquiringPage = () => {
    const intl = useIntl()
    // TODO(2420): Change it based on integration
    const PageTitle = intl.formatMessage({ id: 'menu.Services' })


    return (
        <FeatureFlagRequired name={'services'} fallback={<Error statusCode={404}/>}>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Content/>
                </PageContent>
            </PageWrapper>
        </FeatureFlagRequired>
    )
}

AboutAcquiringPage.requiredAccess = OrganizationRequired
AboutAcquiringPage.headerAction = <ReturnBackHeaderAction
    descriptor={{ id: 'menu.Services' }}
    path={'/services'}/>

export default AboutAcquiringPage
