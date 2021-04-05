import { QuestionCircleOutlined } from '@ant-design/icons'
import { Space } from 'antd'
import React from 'react'
import styled from '@emotion/styled'
import { Tooltip } from './Tooltip'

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