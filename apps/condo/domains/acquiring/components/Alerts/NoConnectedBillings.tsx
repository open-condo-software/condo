import React, { CSSProperties } from 'react'
import { Alert, Space, Typography } from 'antd'
import { useIntl } from '@core/next/intl'
import Link from 'next/link'

const ALERT_BOX_STYLE: CSSProperties = {
    width: 'fit-content',
}

const AlertBody: React.FC = () => {
    const intl = useIntl()
    const AlertMessage = intl.formatMessage({ id: 'miniapps.acquiring.NoBillings.message' })
    const AlertLinkMessage = intl.formatMessage({ id: 'miniapps.acquiring.NoBillings.link' })

    return (
        <Space direction={'vertical'} size={12}>
            <Typography.Text>
                {AlertMessage}
            </Typography.Text>
            <Link href={'/miniapps?tab=billing'}>
                <Typography.Link>
                    {AlertLinkMessage}
                </Typography.Link>
            </Link>
        </Space>
    )
}

export const NoConnectedBillings: React.FC = () => {
    const intl = useIntl()
    const AlertTitle = intl.formatMessage({ id: 'miniapps.acquiring.NoBillings.title' })

    return (
        <Alert
            message={<Typography.Text strong>{AlertTitle}</Typography.Text>}
            description={<AlertBody/>}
            type={'warning'}
            showIcon
            style={ALERT_BOX_STYLE}
        />
    )
}