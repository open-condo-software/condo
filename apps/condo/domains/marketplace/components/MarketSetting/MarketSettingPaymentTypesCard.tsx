import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { SettingCard } from '@condo/domains/common/components/settings/SettingCard'

const PAYMENT_TYPE_SETTING_URL = '/settings/marketplace/paymentTypesSetting'
const TEXT_ELLIPSIS_CONFIG = { rows: 2 }

export const MarketSettingPaymentTypesCard: React.FC = () => {
    const intl = useIntl()
    const PaymentTypesSettingTitle = intl.formatMessage({ id: 'pages.condo.settings.marketplace.paymentTypesSetting.title' })
    const PaymentTypesSettingLabel = intl.formatMessage({ id: 'pages.condo.settings.marketplace.paymentTypesSetting.label' })

    const router = useRouter()

    const handleClickCard = useCallback(() => {
        router.push(PAYMENT_TYPE_SETTING_URL)
    }, [router])

    return (
        <SettingCard title={PaymentTypesSettingTitle} onClick={handleClickCard}>
            <Typography.Paragraph type='secondary' ellipsis={TEXT_ELLIPSIS_CONFIG} >
                {PaymentTypesSettingLabel}
            </Typography.Paragraph>
        </SettingCard>
    )
}