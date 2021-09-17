import React from 'react'
import Head from 'next/head'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { FeatureFlagRequired } from '@condo/domains/common/components/containers/FeatureFlag'
import { Typography } from 'antd'
import { PaymentsRegisterTable } from '@condo/domains/billing/components/PaymentsPageContent/PaymentsRegisterTable'

const PaymentsRegisterPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.PaymentsRegister' })

    return (
        <FeatureFlagRequired name={'paymentsRegister'}>
            <Head>
                <title>
                    {PageTitle}
                </title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitle}</Typography.Title>}/>
                <PageContent>
                    {/*TODO (savelevMatthew): write wrapper for access / state checks*/}
                    <PaymentsRegisterTable/>
                </PageContent>
            </PageWrapper>
        </FeatureFlagRequired>
    )
}

PaymentsRegisterPage.headerAction = <TitleHeaderAction descriptor={{ id: 'menu.PaymentsRegister' }}/>
PaymentsRegisterPage.requiredAccess = OrganizationRequired

export default PaymentsRegisterPage
