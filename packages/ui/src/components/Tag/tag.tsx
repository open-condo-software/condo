import {
    Tag as DefaultTag,
} from 'antd'
import React, { CSSProperties } from 'react'

import { colors } from '@open-condo/ui/src/colors'

const TAG_CLASS_PREFIX = 'condo-tag'

export type TagProps = React.HTMLAttributes<HTMLSpanElement> & {
    children: string
    textColor?: CSSProperties['color']
    bgColor?: CSSProperties['backgroundColor']
    icon?: React.ReactNode
    iconPosition?: 'start' | 'end'
    className?: string
}

const Tag = React.forwardRef<HTMLSpanElement, TagProps>((props, ref) => {
    const {
        children,
        textColor = colors.gray['7'],
        bgColor = colors.gray['1'],
        iconPosition = 'start',
        icon,
        className,
    } = props

    return (
        <DefaultTag
            children={!icon ? children : (
                <div className={`${TAG_CLASS_PREFIX}-content`}>
                    {iconPosition === 'start' && (
                        <span className={`${TAG_CLASS_PREFIX}-icon-start`}>
                            {icon}
                        </span>
                    )}
                    {children}
                    {iconPosition === 'end' && (
                        <span className={`${TAG_CLASS_PREFIX}-icon-end`}>
                            {icon}
                        </span>
                    )}
                </div>
            )}
            prefixCls={TAG_CLASS_PREFIX}
            ref={ref}
            style={{
                color: textColor,
                background: bgColor,
            }}
            className={className}
        />
    )
})

Tag.displayName = 'Tag'

export {
    Tag,
}