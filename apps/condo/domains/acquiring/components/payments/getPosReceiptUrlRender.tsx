import React from 'react'

import { Download } from '@open-condo/icons'
import { Space, Tooltip, Typography } from '@open-condo/ui'

import { LastTestingPosReceiptData } from '@condo/domains/acquiring/hooks/usePosIntegrationLastTestingPosReceipt'


type GetPosReceiptUrlRenderParams = {
    linkText: string
    verifyTitle: string
    verifyDescription: string
    lastTestingPosReceipt?: LastTestingPosReceiptData
    showDelayMs?: number
}

type DelayedTestingTooltipProps = {
    delayMs: number
    verifyTitle: string
    verifyDescription: string
    children: React.ReactNode
}

const DelayedTestingTooltip: React.FC<DelayedTestingTooltipProps> = ({ delayMs, verifyTitle, verifyDescription, children }) => {
    const [isOpen, setIsOpen] = React.useState(false)

    React.useEffect(() => {
        const timer = setTimeout(() => setIsOpen(true), delayMs)

        return () => clearTimeout(timer)
    }, [delayMs])

    return (
        <Tooltip
            title={(
                <Space size={8} direction='vertical'>
                    <Typography.Title level={4}>
                        {verifyTitle}
                    </Typography.Title>
                    <Typography.Text size='small'>
                        {verifyDescription}
                    </Typography.Text>
                </Space>
            )}
            placement='left'
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            {children}
        </Tooltip>
    )
}

export const getPosReceiptUrlRender = ({
    linkText,
    verifyTitle,
    verifyDescription,
    lastTestingPosReceipt = null,
    showDelayMs = 700,
}: GetPosReceiptUrlRenderParams) => {
    return function render (url: string, record: { id?: string }): React.ReactNode {
        if (!url) return '—'

        const shouldShowTestingTooltip = !!lastTestingPosReceipt && record?.id === lastTestingPosReceipt.condoPaymentId

        const content = (
            <Space size={8}>
                <Download size='small' />
                <Typography.Link
                    href={url}
                    target='_blank'
                    size='medium'
                >
                    {linkText}
                </Typography.Link>
            </Space>
        )

        if (!shouldShowTestingTooltip) return content

        return (
            <DelayedTestingTooltip
                delayMs={showDelayMs}
                verifyTitle={verifyTitle}
                verifyDescription={verifyDescription}
            >
                {content}
            </DelayedTestingTooltip>
        )
    }
}
