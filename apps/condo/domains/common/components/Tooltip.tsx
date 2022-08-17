import { Tooltip as DefaultTooltip, TooltipProps as DefaultTooltipProps } from 'antd'
import React from 'react'
import { colors } from '../constants/style'
import get from 'lodash/get'

type TooltipProps = DefaultTooltipProps & { textColor?: string }

export const Tooltip: React.FC<TooltipProps> = (props) => {
    const overlayInnerStyle: React.CSSProperties = get(props, 'overlayInnerStyle', {})
    overlayInnerStyle.color = get(props, 'textColor', colors.black)
    const tooltipProps = {
        arrowPointAtCenter: true,
        mouseEnterDelay: 0.15,
        color: colors.white,
        ...props,
        overlayInnerStyle,
    }

    return (
        <DefaultTooltip {...tooltipProps}/>
    )
}