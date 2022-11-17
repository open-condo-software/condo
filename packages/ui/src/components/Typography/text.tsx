import React from 'react'
import type { TextProps as DefaultTextProps } from 'antd/lib/typography/Text'
import Base from 'antd/lib/typography/Base'
import classNames from 'classnames'
import { TYPOGRAPHY_CLASS_PREFIX, TEXT_SIZES, TEXT_TYPES } from './constants'

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

const Text = React.forwardRef<HTMLSpanElement, TypographyTextProps>((props, ref) => {
    const { type, size = 'lg', ...rest } = props
    const className = classNames({
        [`${TYPOGRAPHY_CLASS_PREFIX}-${type}`]: type,
        [`${TYPOGRAPHY_CLASS_PREFIX}-${size}`]: size,
    })
    // NOTE: Used wrapper destructuring to explicitly pass component props, which is marked as internal in antd
    const componentProps = { component: 'span' }

    return (
        <Base
            {...rest}
            prefixCls={TYPOGRAPHY_CLASS_PREFIX}
            ref={ref}
            className={className}
            {...componentProps}
        />
    )
})

Text.displayName = 'Typography.Text'

export {
    Text,
}