import styled from '@emotion/styled'
import get from 'lodash/get'
import Head from 'next/head'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Tag, Space } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'
import { useBreakpoints } from '@open-condo/ui/hooks'

import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import { PageWrapper, PageHeader } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'

import { useBillingAndAcquiringContexts } from './ContextProvider'
import { MainContent } from './MainContent'


const StyledPageWrapper = styled(PageWrapper)`
     & .condo-tabs, & .condo-tabs-content, & .condo-tabs-tabpane, & .page-content {
       height: 100%;
     },
    & .condo-tabs-nav, & .condo-tabs-nav-wrap {
        min-height: 48px;
    },
`

export const BillingPageContent: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.accrualsAndPayments' })

    const { billingContexts } = useBillingAndAcquiringContexts()
    const breakpoints = useBreakpoints()
    const userOrganization = useOrganization()

    const isSmallScreen = !breakpoints.TABLET_LARGE
    const canReadBillingReceipts = get(userOrganization, ['link', 'role', 'canReadBillingReceipts'], false)
    const canReadPayments = get(userOrganization, ['link', 'role', 'canReadPayments'], false)

    const problemContext = billingContexts.find(({ currentProblem }) => !!currentProblem)
    const currentProblem =  problemContext ? get(problemContext, 'currentProblem') : null

    const tagBg = currentProblem ? colors.red['5'] : colors.green['5']

    const Tags = useMemo(() =>{
        const billingNames = billingContexts.map(({ integration }) => get(integration, 'name'))
        return (
            <Space size={4} direction={isSmallScreen ? 'vertical' : 'horizontal'}>
                {billingNames.map((name) => {
                    const ErrorStatusMessage = intl.formatMessage({ id: 'accrualsAndPayments.billing.statusTag.error' }, { name })
                    const tagMessage = currentProblem ? ErrorStatusMessage : name

                    return <Tag key={name} bgColor={tagBg} textColor={colors.white}>{tagMessage}</Tag>
                })}
            </Space>
        )
    }, [billingContexts, currentProblem, intl, isSmallScreen, tagBg])

    if (!canReadBillingReceipts && !canReadPayments) {
        return <AccessDeniedPage />
    }

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <StyledPageWrapper>
                <PageHeader tags={Tags} title={<Typography.Title>{PageTitle}</Typography.Title>} />
                <MainContent />
            </StyledPageWrapper>
        </>
    )
}