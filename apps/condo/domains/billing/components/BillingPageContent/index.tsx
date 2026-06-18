import get from 'lodash/get'
import Head from 'next/head'
import React, { useCallback, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Settings } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Space, Tag, Tooltip, Typography } from '@open-condo/ui'
import { useBreakpoints } from '@open-condo/ui/hooks'

import { useBillingHeaderTags } from '@condo/domains/billing/hooks/useBillingHeaderTags'
import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import { PageWrapper, PageHeader } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { UI_BILLING_SPP_COMBINED_PAGE } from '@condo/domains/common/constants/featureflags'

import styles from './BillingPageContent.module.css'
import { BillingSettingsModal } from './BillingSettingsModal'
import { CombinedMainContent } from './CombinedMainContent'
import { MainContent } from './MainContent'

export const BillingPageContent: React.FC = () => {
    const intl = useIntl()
    const { useFlag } = useFeatureFlags()
    const isCombinedPageEnabled = useFlag(UI_BILLING_SPP_COMBINED_PAGE)
    const PageTitle = intl.formatMessage({ id: isCombinedPageEnabled ? 'global.section.SPP' : 'global.section.accrualsAndPayments' })
    const SettingsTitle = intl.formatMessage({ id: 'global.section.settings' })

    const breakpoints = useBreakpoints()
    const userOrganization = useOrganization()
    const [settingsModalOpen, setSettingsModalOpen] = useState(false)
    const { legacyHeaderTags, combinedHeaderTags } = useBillingHeaderTags()

    const isSmallScreen = !breakpoints.TABLET_LARGE
    const canReadBillingReceipts = get(userOrganization, ['link', 'role', 'canReadBillingReceipts'], false)
    const canReadPayments = get(userOrganization, ['link', 'role', 'canReadPayments'], false)

    const LegacyTags = useMemo(() =>{
        return (
            <Space size={4} direction={isSmallScreen ? 'vertical' : 'horizontal'}>
                {legacyHeaderTags.map(({ key, label, bgColor, textColor }) => (
                    <Tag key={key} bgColor={bgColor} textColor={textColor}>{label}</Tag>
                ))}
            </Space>
        )
    }, [isSmallScreen, legacyHeaderTags])

    const openSettingsModal = useCallback(() => setSettingsModalOpen(true), [])
    const closeSettingsModal = useCallback(() => setSettingsModalOpen(false), [])

    const CombinedHeaderExtraContent = useMemo(() => {
        return (
            <Space size={4}>
                {combinedHeaderTags.map(({ key, label, bgColor, textColor, tooltipMessage }) => {
                    const tag = (
                        <Tag
                            key={key}
                            bgColor={bgColor}
                            textColor={textColor}
                        >
                            {label}
                        </Tag>
                    )

                    if (!tooltipMessage) return tag

                    return (
                        <Tooltip key={key} title={tooltipMessage}>
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
    }, [SettingsTitle, combinedHeaderTags, openSettingsModal])

    if (!canReadBillingReceipts && !canReadPayments) {
        return <AccessDeniedPage />
    }

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper className={styles.pageWrapper}>
                <PageHeader
                    tags={isCombinedPageEnabled ? undefined : LegacyTags}
                    extra={isCombinedPageEnabled ? CombinedHeaderExtraContent : undefined}
                    title={<Typography.Title>{PageTitle}</Typography.Title>}
                />
                {isCombinedPageEnabled ? <CombinedMainContent/> : <MainContent />}
                <BillingSettingsModal open={settingsModalOpen} onClose={closeSettingsModal} />
            </PageWrapper>
        </>
    )
}
