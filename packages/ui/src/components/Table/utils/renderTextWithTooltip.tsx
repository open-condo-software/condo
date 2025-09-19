import isBoolean from 'lodash/isBoolean'
import isNull from 'lodash/isNull'
import isString from 'lodash/isString'
import React from 'react'

import { Typography, TooltipProps, Tooltip } from '@open-condo/ui/src'

const ELLIPSIS_SETTINGS = { rows: 3, expandable: false }

type RenderTextWithTooltipProps = {
    ellipsis?: boolean
    postfix?: string
    extraTitle?: string
    extraTooltipProps?: TooltipProps
}

const getTitleMessage = ({ text, extraTitle, postfix }: { text?: unknown, extraTitle?: string, postfix?: string }) => {
    if (extraTitle || isNull(extraTitle)) {
        return extraTitle
    }

    if (text) {
        if (postfix && isString(postfix)) {
            return `${text} ${postfix}`
        }
        return `${text}`
    }

    return null
}

export const renderTextWithTooltip = <TData = unknown>({
    ellipsis = false,
    postfix = '',
    extraTitle,
    extraTooltipProps,
}: RenderTextWithTooltipProps = {}) => {
    const RenderTextWithTooltipComponent = (text: TData) => {
        const title = getTitleMessage({ text, extraTitle, postfix })
        const ellipsisConfig = isBoolean(ellipsis) ? ELLIPSIS_SETTINGS : ellipsis

        return (
            <Tooltip 
                title={title} 
                placement='topLeft' 
                destroyTooltipOnHide
                {...extraTooltipProps}
            >
                <span>
                    <Typography.Paragraph ellipsis={ellipsisConfig} size='medium'>
                        {String(text)}
                    </Typography.Paragraph>
                </span>
            </Tooltip>
        )
    }
    
    return RenderTextWithTooltipComponent
}