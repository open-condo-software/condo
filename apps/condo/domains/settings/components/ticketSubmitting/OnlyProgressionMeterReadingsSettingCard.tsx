import { MobileFeatureConfig as MobileFeatureConfigType } from '@app/condo/schema'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { SettingCard } from '@condo/domains/common/components/settings/SettingCard'

interface OnlyProgressionMeterReadingsSettingCardProps {
    mobileConfig?: MobileFeatureConfigType
}

const TICKET_DISABLING_SETTINGS_URL = '/settings/mobileFeatureConfig/onlyProgressionMeterReadings'

export const OnlyProgressionMeterReadingsSettingCard: React.FC<OnlyProgressionMeterReadingsSettingCardProps> = ({ mobileConfig }) => {
    const intl = useIntl()
    const OnlyProgressionMeterReadingsTitle = intl.formatMessage({ id: 'pages.condo.settings.barItem.MobileFeatureConfig.OnlyProgressionMeterReadings.title' })
    const OnlyProgressionMeterReadingsIsDisabledLabel = intl.formatMessage({ id: 'pages.condo.settings.barItem.MobileFeatureConfig.OnlyProgressionMeterReadings.isDisabled' })
    const OnlyProgressionMeterReadingsIsEnabledLabel = intl.formatMessage({ id: 'pages.condo.settings.barItem.MobileFeatureConfig.OnlyProgressionMeterReadings.isEnabled' })

    const router = useRouter()

    const handleClickCard = useCallback(() => {
        router.push(TICKET_DISABLING_SETTINGS_URL)
    }, [router])

    const isEnabled = get(mobileConfig, 'onlyProgressionMeterReadingsIsEnabled')

    return (
        <SettingCard title={OnlyProgressionMeterReadingsTitle} onClick={handleClickCard}>
            <Typography.Text type='secondary' >
                {isEnabled ? OnlyProgressionMeterReadingsIsEnabledLabel : OnlyProgressionMeterReadingsIsDisabledLabel}
            </Typography.Text>
        </SettingCard>
    )
}