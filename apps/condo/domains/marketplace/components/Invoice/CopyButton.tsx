import { Typography } from 'antd'
import React, { useCallback, useState } from 'react'

import { CheckCircle, Copy } from '@open-condo/icons'
import { Button, Space } from '@open-condo/ui'

const REFRESH_COPY_BUTTON_INTERVAL_IN_MS = 3000

export const CopyButton = ({ url, copyMessage, copiedMessage }) => {
    const [copied, setCopied] = useState<boolean>()

    const handleCopyClick = useCallback(async () => {
        if (copied) return

        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)

            setTimeout(() => setCopied(false), REFRESH_COPY_BUTTON_INTERVAL_IN_MS)
        } catch (e) {
            console.error('Unable to copy to clipboard', e)
        }
    }, [copied, url])

    return (
        <Button
            disabled={copied}
            type='secondary'
            icon={copied ? <CheckCircle size='medium' /> : <Copy size='medium' />}
            onClick={handleCopyClick}
        >
            {copied ? copiedMessage : copyMessage}
        </Button>
    )
}

export const getPaymentLinkNotification = ({ intl, number, url }) => {
    const SuccessNotificationDescription = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.create.notification.description' })
    const CopyLinkMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.create.notification.copyLink' })
    const CopiedLinkMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.create.notification.copiedLink' })

    return {
        message: (
            <Typography.Text strong>
                {intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.create.notification.message' }, { number })}
            </Typography.Text>
        ),
        description: (
            <Space size={16} direction='vertical'>
                <Typography.Text>
                    {SuccessNotificationDescription}
                </Typography.Text>
                <CopyButton url={url} copyMessage={CopyLinkMessage} copiedMessage={CopiedLinkMessage}/>
            </Space>
        ),
        duration: 0,
    }
}