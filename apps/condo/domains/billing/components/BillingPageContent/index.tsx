import styled from '@emotion/styled'
import get from 'lodash/get'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Tag } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import { PageWrapper, PageHeader, TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'

import { useBillingAndAcquiringContexts } from './ContextProvider'
import { MainContent } from './MainContent'


const StyledPageWrapper = styled(PageWrapper)`
     & .condo-tabs, & .condo-tabs-content, & .condo-tabs-tabpane, & .page-content {
       height: 100%;
     }
`

export const BillingPageContent: React.FC = () => {
    const { billingContext } = useBillingAndAcquiringContexts()
    const billingName = get(billingContext, ['integration', 'name'], '')

    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.accrualsAndPayments' })
    const ConnectedStatusMessage = intl.formatMessage({ id: 'accrualsAndPayments.billing.statusTag.connected' }, { name: billingName })
    const ErrorStatusMessage = intl.formatMessage({ id: 'accrualsAndPayments.billing.statusTag.error' }, { name: billingName })

    const userOrganization = useOrganization()
    const canReadBillingReceipts = get(userOrganization, ['link', 'role', 'canReadBillingReceipts'], false)
    const canReadPayments = get(userOrganization, ['link', 'role', 'canReadPayments'], false)

    const currentProblem = get(billingContext, 'currentProblem')

    const tagBg = currentProblem ? colors.red['5'] : colors.green['5']
    const tagMessage = currentProblem ? ErrorStatusMessage : ConnectedStatusMessage

    if (!canReadBillingReceipts && !canReadPayments) {
        return <AccessDeniedPage />
    }

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <StyledPageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} extra={<Tag bgColor={tagBg} textColor={colors.white}>{tagMessage}</Tag>}/>
                <MainContent />
            </StyledPageWrapper>
        </>
    )
}