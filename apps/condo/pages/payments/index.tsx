import PaymentsPageContent from '@condo/domains/billing/components/payments/PaymentsPageContent'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { useIntl } from '@core/next/intl'
import { Typography } from 'antd'
import Head from 'next/head'
import React from 'react'

const PaymentsPage = () => {
    const intl = useIntl()
    const TheTitle = intl.formatMessage({ id: 'menu.Payments' })

    return (
        <>
            <Head>
                <title>
                    {TheTitle}
                </title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{TheTitle}</Typography.Title>}/>
                <TablePageContent>
                    <PaymentsPageContent/>
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

PaymentsPage.headerAction = <TitleHeaderAction descriptor={{ id: 'menu.Payments' }}/>
PaymentsPage.requiredAccess = OrganizationRequired

export default PaymentsPage