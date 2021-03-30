import { Tooltip as DefaultTooltip, TooltipProps, Typography } from 'antd'
import React from 'react'
import { colors } from '../constants/style'

export const Tooltip: React.FC<TooltipProps> = (props) => (
    <DefaultTooltip
        {...props}
        title={<Typography.Text>{props.title}</Typography.Text>}
        arrowPointAtCenter={true}
        mouseEnterDelay={0.3}
        color={colors.white}
    />
)
