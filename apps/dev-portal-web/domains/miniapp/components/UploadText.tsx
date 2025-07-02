import React from 'react'

import { Download } from '@open-condo/icons'
import { Typography, Space } from '@open-condo/ui'

export const UploadText: React.FC<{ children: string }>  = ({ children }) => {
    return (
        <Typography.Link size='medium'>
            <Space size={8} direction='horizontal'>
                <Download size='medium'/>
                {children}
            </Space>
        </Typography.Link>
    )
}