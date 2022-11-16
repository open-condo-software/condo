import React from 'react'
import type { TextProps as DefaultTextProps } from 'antd/lib/typography/Text'
import Base from 'antd/lib/typography/Base'
import classNames from 'classnames'

declare const TEXT_TYPES: ['default', 'secondary', 'inverted', 'danger', 'warning', 'info', 'success']
declare const TEXT_SIZES: ['lg', 'md', 'sm']
export type TypographyTextProps = Omit<DefaultTextProps,
'keyboard'
| 'type'
| 'editable'
| 'copyable'
| 'mark'
| 'className'
| 'prefixCls'
| 'style'> & {
    type?: typeof TEXT_TYPES[number]
    size?: typeof TEXT_SIZES[number]
}

const TYPOGRAPHY_CLASS_PREFIX = 'condo-typography'

const Text = React.forwardRef<HTMLSpanElement, TypographyTextProps>((props, ref) => {
    const { type = 'default', size = 'lg', ...rest } = props
    const className = classNames(
        // TODO(DOMA-4681): Remove TYPOGRAPHY_CLASS_PREFIX after next antd release including this patch: https://github.com/ant-design/ant-design/pull/38586
        TYPOGRAPHY_CLASS_PREFIX,
        {
            [`${TYPOGRAPHY_CLASS_PREFIX}-${type}`]: type,
            [`${TYPOGRAPHY_CLASS_PREFIX}-${size}`]: size,
        }
    )

    return (
        <Base
            prefixCls={TYPOGRAPHY_CLASS_PREFIX}
            ref={ref}
            component='span'
            className={className}
            {...rest}
        />
    )
})

Text.displayName = 'Typography.Text'

export {
    Text,
}