import { Tooltip as DefaultTooltip } from 'antd'
import React from 'react'

import type { TooltipProps as DefaultTooltipProps } from 'antd'

const TOOLTIP_CLASS_PREFIX = 'condo-tooltip'
const MOUSE_ENTER_DELAY_IN_SECONDS = 0.15

export type TooltipProps = Pick<DefaultTooltipProps,
'open'
| 'onOpenChange'
| 'className'
| 'id'
| 'placement'
| 'destroyTooltipOnHide'
| 'zIndex'
| 'defaultOpen'> & {
    title: string
    children?: React.ReactNode
}

export const Tooltip: React.FC<TooltipProps> = (props) => {
    return (
        <DefaultTooltip
            {...props}
            prefixCls={TOOLTIP_CLASS_PREFIX}
            mouseEnterDelay={MOUSE_ENTER_DELAY_IN_SECONDS}
        />
    )
}