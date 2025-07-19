import { MobileFeatureConfig as MobileFeatureConfigType } from '@app/condo/schema'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { SettingCard } from '@condo/domains/common/components/settings/SettingCard'

interface TicketSubmittingSettingCardProps {
    mobileConfig?: MobileFeatureConfigType
}

const TICKET_DISABLING_SETTINGS_URL = '/settings/mobileFeatureConfig/ticketSubmitting'
const TEXT_ELLIPSIS_CONFIG = { rows: 2 }

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
            <Typography.Paragraph type='secondary' >
                {isDisabled ? TicketSubmittingIsDisabledLabel : TicketSubmittingIsEnabledLabel}
            </Typography.Paragraph>
            <Typography.Paragraph type='secondary' ellipsis={TEXT_ELLIPSIS_CONFIG} >
                {isDisabled ? `${TicketSubmittingCommonPhoneLabel}: ${commonPhone ? commonPhone : '-'}` : ''}
            </Typography.Paragraph>
        </SettingCard>
    )
}