import { Tooltip as DefaultTooltip, TooltipProps as DefaultTooltipProps } from 'antd'
import get from 'lodash/get'
import React from 'react'

import { colors } from '../constants/style'

type TooltipProps = DefaultTooltipProps & { textColor?: string }
const MOUSE_ENTER_DELAY_IN_SECONDS = 0.15

export const Tooltip: React.FC<TooltipProps> = (props) => {
    const overlayInnerStyle: React.CSSProperties = get(props, 'overlayInnerStyle', {})
    overlayInnerStyle.color = get(props, 'textColor', colors.black)
    const tooltipProps = {
        arrowPointAtCenter: true,
        mouseEnterDelay: MOUSE_ENTER_DELAY_IN_SECONDS,
        color: colors.white,
        ...props,
        overlayInnerStyle,
    }

    return (
        <DefaultTooltip {...tooltipProps}/>
    )
}