import { QuestionCircleOutlined } from '@ant-design/icons'
import { Space } from 'antd'
import React from 'react'

import { Tooltip } from '@open-condo/ui'


interface ILabelWithInfo {
    title: string
    message: string
}

export const LabelWithInfo: React.FC<ILabelWithInfo> = ({ title, message }) => (
    <Tooltip placement='topLeft' title={title}>
        <Space>
            {message}
            <QuestionCircleOutlined/>
        </Space>
    </Tooltip>
)