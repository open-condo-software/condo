import styled from '@emotion/styled'
import get from 'lodash/get'
import Head from 'next/head'
import React, { useCallback, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Settings } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Modal, Space, Tag, Tooltip, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'
import { useBreakpoints } from '@open-condo/ui/hooks'

import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import { PageWrapper, PageHeader } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { UI_BILLING_SPP_COMBINED_PAGE } from '@condo/domains/common/constants/featureflags'

import { CombinedMainContent } from './CombinedMainContent'
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
    const { useFlag } = useFeatureFlags()
    const isCombinedPageEnabled = useFlag(UI_BILLING_SPP_COMBINED_PAGE)
    const PageTitle = intl.formatMessage({ id: isCombinedPageEnabled ? 'global.section.SPP' : 'global.section.accrualsAndPayments' })
    const SettingsTitle = intl.formatMessage({ id: 'global.section.settings' })
    const SettingsMessage = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.message' })

    const { billingContexts } = useBillingAndAcquiringContexts()
    const breakpoints = useBreakpoints()
    const userOrganization = useOrganization()
    const [settingsModalOpen, setSettingsModalOpen] = useState(false)

    const isSmallScreen = !breakpoints.TABLET_LARGE
    const canReadBillingReceipts = get(userOrganization, ['link', 'role', 'canReadBillingReceipts'], false)
    const canReadPayments = get(userOrganization, ['link', 'role', 'canReadPayments'], false)

    const billingTags = useMemo(() => billingContexts.reduce<Array<{
        key: string
        name: string
        problemMessage: string | null
    }>>((result, context) => {
        const name = get(context, ['integration', 'name'])
        if (!name) return result

        const problem = get(context, 'currentProblem')
        const problemMessage = problem
            ? get(problem, 'message') || get(problem, 'title') || intl.formatMessage({ id: 'accrualsAndPayments.billing.statusTag.error' }, { name })
            : null

        result.push({
            key: get(context, ['integration', 'id']) || context.id,
            name,
            problemMessage,
        })

        return result
    }, []), [billingContexts, intl])
    const problemContext = billingContexts.find(({ currentProblem }) => !!currentProblem)
    const currentProblem =  problemContext ? get(problemContext, 'currentProblem') : null

    const tagBg = currentProblem ? colors.red['5'] : colors.green['5']
    const billingNames = useMemo(() => billingTags.map(({ name }) => name), [billingTags])

    const LegacyTags = useMemo(() =>{
        return (
            <Space size={4} direction={isSmallScreen ? 'vertical' : 'horizontal'}>
                {billingNames.map((name) => {
                    const ErrorStatusMessage = intl.formatMessage({ id: 'accrualsAndPayments.billing.statusTag.error' }, { name })
                    const tagMessage = currentProblem ? ErrorStatusMessage : name

                    return <Tag key={name} bgColor={tagBg} textColor={colors.white}>{tagMessage}</Tag>
                })}
            </Space>
        )
    }, [billingNames, currentProblem, intl, isSmallScreen, tagBg])

    const openSettingsModal = useCallback(() => setSettingsModalOpen(true), [])
    const closeSettingsModal = useCallback(() => setSettingsModalOpen(false), [])

    const CombinedHeaderExtraContent = useMemo(() => {
        return (
            <Space size={4}>
                {billingTags.map(({ key, name, problemMessage }) => {
                    const tag = (
                        <Tag
                            key={key}
                            bgColor={problemMessage ? colors.red['5'] : colors.gray[3]}
                            textColor={problemMessage ? colors.white : colors.gray[7]}
                        >
                            {name}
                        </Tag>
                    )

                    if (!problemMessage) return tag

                    return (
                        <Tooltip key={key} title={problemMessage}>
                            <span>{tag}</span>
                        </Tooltip>
                    )
                })}
                <Button
                    type='secondary'
                    minimal
                    compact
                    icon={<Settings size='medium' />}
                    title={SettingsTitle}
                    onClick={openSettingsModal}
                />
            </Space>
        )
    }, [SettingsTitle, billingTags, openSettingsModal])

    if (!canReadBillingReceipts && !canReadPayments) {
        return <AccessDeniedPage />
    }

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <StyledPageWrapper>
                <PageHeader
                    tags={isCombinedPageEnabled ? undefined : LegacyTags}
                    extra={isCombinedPageEnabled ? CombinedHeaderExtraContent : undefined}
                    title={<Typography.Title>{PageTitle}</Typography.Title>}
                />
                {isCombinedPageEnabled ? <CombinedMainContent/> : <MainContent />}
                <Modal
                    open={settingsModalOpen}
                    onCancel={closeSettingsModal}
                    title={SettingsTitle}
                    footer={null}
                >
                    <Typography.Text type='secondary'>{SettingsMessage}</Typography.Text>
                </Modal>
            </StyledPageWrapper>
        </>
    )
}
