import React from 'react'

import { Download } from '@open-condo/icons'
import { Space, Typography } from '@open-condo/ui'

import type { RenderReturnType } from '@condo/domains/common/components/Table/Renders'

export const getPosReceiptUrlRender = (linkText: string) => {
    return function render (url: string): RenderReturnType {
        if (!url) return '—'

        return (
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
    }
}
