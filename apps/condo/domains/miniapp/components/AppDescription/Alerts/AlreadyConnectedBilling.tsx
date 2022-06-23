import React, { CSSProperties, useCallback } from 'react'
import { Alert, Space, Typography } from 'antd'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { useRouter } from 'next/router'
import { SUPPORT_EMAIL } from '@condo/domains/common/constants/requisites'

const ALERT_BOX_STYLE: CSSProperties = {
    width: 'fit-content',
}

const AlertBody: React.FC = () => {
    const intl = useIntl()
    const CompanyName = intl.formatMessage({ id: 'CompanyName' })
    const BillingSectionMessage = intl.formatMessage({ id: 'menu.Billing' })
    const AlertMessage = intl.formatMessage({ id: 'miniapps.billing.AlreadyConnected.message' }, {
        company: CompanyName,
        email: SUPPORT_EMAIL,
    })
    const AlertButtonMessage = intl.formatMessage({ id: 'miniapps.billing.AlreadyConnected.button' }, {
        section: BillingSectionMessage,
    })

    const router = useRouter()
    const handleClick = useCallback(() => {
        router.push('/billing')
    }, [router])

    return (
        <Space direction={'vertical'} size={12}>
            <Typography.Text>
                {AlertMessage}
            </Typography.Text>
            <Button
                type={'sberBlack'}
                onClick={handleClick}
            >
                {AlertButtonMessage}
            </Button>
        </Space>
    )
}

export const AlreadyConnectedBilling: React.FC = () => {
    const intl = useIntl()
    const AlertTitle = intl.formatMessage({ id: 'miniapps.billing.AlreadyConnected.title' })

    return (
        <Alert
            message={<Typography.Text strong type={'danger'}>{AlertTitle}</Typography.Text>}
            description={<AlertBody/>}
            type={'error'}
            showIcon
            style={ALERT_BOX_STYLE}
        />
    )
}