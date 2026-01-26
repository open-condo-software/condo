import React from 'react'

import { Download } from '@open-condo/icons'
import { Space, Tooltip, Typography } from '@open-condo/ui'

import { LastTestingPosReceiptData } from '@condo/domains/acquiring/hooks/usePosIntegrationLastTestingPosReceipt'


type GetPosReceiptUrlRenderParams = {
    linkText: string
    verifyTitle: string
    verifyDescription: string
    lastTestingPosReceipt?: LastTestingPosReceiptData
}

export const getPosReceiptUrlRender = ({ linkText, verifyTitle, verifyDescription, lastTestingPosReceipt = null }: GetPosReceiptUrlRenderParams) => {
    return function render (url: string): React.ReactNode {
        if (!url) return '—'

        // Testing mode means that pos integration miniapp is in testing mode and there is a receipt created
        const isTestingMode = !!lastTestingPosReceipt

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

        return isTestingMode ? (
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
                defaultOpen={true}
            >
                {content}
            </Tooltip>
        ) : content
    }
}
