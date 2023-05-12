import { Affix } from 'antd'
import React, { ReactElement } from 'react'

import { Space, SpaceProps } from '../Space'
import { Typography } from '../Typography'

const ACTION_BAR_CLASS_PREFIX = 'condo-affix'
const AFFIX_CONTENT_WRAPPER_CLASS = `${ACTION_BAR_CLASS_PREFIX}-content-wrapper`

const SPACE_SIZE: SpaceProps['size'] = [16, 16]

export type ActionBarProps = {
    message?: string
    actions: [ReactElement, ...ReactElement[]]
}

export const ActionBar: React.FC<ActionBarProps> = (props) => {
    const { actions, message } = props

    return (
        <Affix offsetBottom={0} prefixCls={ACTION_BAR_CLASS_PREFIX}>
            <Space wrap size={SPACE_SIZE} className={AFFIX_CONTENT_WRAPPER_CLASS}>
                {message && <Typography.Text strong>{message}</Typography.Text>}
                {actions}
            </Space>
        </Affix>
    )
}