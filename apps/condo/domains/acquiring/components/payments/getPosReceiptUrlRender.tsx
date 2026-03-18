import React, { useEffect } from 'react'

import { Download } from '@open-condo/icons'
import { Space, Tooltip, Typography, Tour } from '@open-condo/ui'

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
    const { setCurrentStep } = Tour.useTourContext()

    useEffect(() => {
        const timer = setTimeout(() => setCurrentStep(1), delayMs)

        return () => clearTimeout(timer)
    }, [delayMs, setCurrentStep])

    return (
        <Tour.TourStep step={1} title={verifyTitle} message={verifyDescription}>
            {children}
        </Tour.TourStep>
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
            <Tour.Provider>
                <DelayedTestingTooltip
                    delayMs={showDelayMs}
                    verifyTitle={verifyTitle}
                    verifyDescription={verifyDescription}
                >
                    {content}
                </DelayedTestingTooltip>
            </Tour.Provider>
        )
    }
}
