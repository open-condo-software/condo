import { QuestionCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Space } from 'antd'
import React from 'react'

import { Tooltip } from '@condo/domains/common/components/Tooltip'

const StyledSpace = styled(Space)`
    &:hover {
      cursor: help;
    }
`

interface ILabelWithInfo {
    title: string
    message: string
}

export const LabelWithInfo: React.FC<ILabelWithInfo> = ({ title, message }) => (
    <Tooltip placement='topLeft' title={title}>
        <StyledSpace>
            {message}
            <QuestionCircleOutlined/>
        </StyledSpace>
    </Tooltip>
)