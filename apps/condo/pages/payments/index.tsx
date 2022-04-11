import PaymentsPageContent from '@condo/domains/acquiring/components/payments/PaymentsPageContent'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { useIntl } from '@core/next/intl'
import { Typography } from 'antd'
import Head from 'next/head'
import React, { CSSProperties } from 'react'

const PAGE_HEADER_TITLE_STYLES: CSSProperties = { margin: 0 }

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
                <PageHeader
                    title={<Typography.Title style={PAGE_HEADER_TITLE_STYLES}>{TheTitle}</Typography.Title>}
                />
                <TablePageContent>
                    <PaymentsPageContent/>
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

PaymentsPage.requiredAccess = OrganizationRequired

export default PaymentsPage