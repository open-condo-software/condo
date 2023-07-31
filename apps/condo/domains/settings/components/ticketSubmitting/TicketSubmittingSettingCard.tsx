import { MobileFeatureConfig as MobileFeatureConfigType } from '@app/condo/schema'
import { Typography } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { SettingCard } from '@condo/domains/common/components/settings/SettingCard'

interface TicketSubmittingSettingCardProps {
    mobileConfig?: MobileFeatureConfigType
}

const TICKET_DISABLING_SETTINGS_URL = '/settings/mobileFeatureConfig/ticketSubmitting'
const TYPOGRAPHY_STYLE: React.CSSProperties = { width: '100%' }

export const TicketSubmittingSettingCard: React.FC<TicketSubmittingSettingCardProps> = ({ mobileConfig }) => {
    const intl = useIntl()
    const TicketSubmittingTitle = intl.formatMessage({ id: 'pages.condo.settings.mobileFeatureConfig.submittingPeriod.pageTitle' })
    const TicketSubmittingCommonPhoneLabel = intl.formatMessage({ id: 'pages.condo.settings.mobileFeatureConfig.submittingPeriod.commonPhone' })
    const TicketSubmittingIsDisabledLabel = intl.formatMessage({ id: 'pages.condo.settings.barItem.MobileFeatureConfig.ticketSubmitting.isDisabled' })
    const TicketSubmittingIsEnabledLabel = intl.formatMessage({ id: 'pages.condo.settings.barItem.MobileFeatureConfig.ticketSubmitting.isEnabled' })

    const router = useRouter()

    const handleClickCard = useCallback(() => {
        router.push(TICKET_DISABLING_SETTINGS_URL)
    }, [router])

    const commonPhone = get(mobileConfig, 'commonPhone')
    const isDisabled = get(mobileConfig, 'ticketSubmittingIsDisabled')

    return (
        <SettingCard title={TicketSubmittingTitle} onClick={handleClickCard}>
            <Typography.Text type='secondary' style={TYPOGRAPHY_STYLE}>
                {isDisabled ? TicketSubmittingIsDisabledLabel : TicketSubmittingIsEnabledLabel}
            </Typography.Text>
            <Typography.Text type='secondary' ellipsis style={TYPOGRAPHY_STYLE}>
                {isDisabled ? `${TicketSubmittingCommonPhoneLabel}: ${commonPhone ? commonPhone : '-'}` : ''}
            </Typography.Text>
        </SettingCard>
    )
}