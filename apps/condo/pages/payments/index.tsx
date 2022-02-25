import React from 'react'
import Head from 'next/head'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Typography } from 'antd'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { PaymentsPageContent } from '@condo/domains/billing/components/payments'

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