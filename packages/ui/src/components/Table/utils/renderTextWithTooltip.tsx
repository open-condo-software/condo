import React from 'react'

import { Typography, TooltipProps, Tooltip } from '@open-condo/ui/src'

const ELLIPSIS_SETTINGS = { rows: 3, expandable: false }

type EllipsisProp = boolean | NonNullable<React.ComponentProps<typeof Typography.Paragraph>['ellipsis']>
type RenderTextWithTooltipProps = {
    ellipsis?: EllipsisProp
    postfix?: string
    extraTitle?: string | null
    extraTooltipProps?: TooltipProps
}

const getTitleMessage = ({ text, extraTitle, postfix }: { text?: unknown, extraTitle?: string | null, postfix?: string }) => {
    if (extraTitle !== undefined) return extraTitle
    if (text != null) {
        const base = String(text)
        return postfix ? `${base} ${postfix}` : base
    }
    return null
}

export const renderTextWithTooltip = <TValue = unknown>({
    ellipsis = false,
    postfix = '',
    extraTitle,
    extraTooltipProps,
}: RenderTextWithTooltipProps = {}) => function RenderTextWithTooltipComponent (text: TValue) {
    const title = getTitleMessage({ text, extraTitle, postfix })
    const ellipsisConfig = typeof ellipsis === 'boolean'
        ? (ellipsis ? ELLIPSIS_SETTINGS : false)
        : ellipsis

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
