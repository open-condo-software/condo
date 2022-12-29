import React from 'react'
import type { TextProps as DefaultTextProps } from 'antd/lib/typography/Text'
import Base from 'antd/lib/typography/Base'
import classNames from 'classnames'
import merge from 'lodash/merge'
import { TYPOGRAPHY_CLASS_PREFIX, TEXT_SIZES, TEXT_TYPES, TOOLTIP_CLASS_PREFIX } from './constants'

const DEFAULT_ELLIPSIS_CONFIG = { tooltip: { prefixCls: TOOLTIP_CLASS_PREFIX } }

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
    const { type, size = 'lg', ellipsis, ...rest } = props
    const className = classNames({
        [`${TYPOGRAPHY_CLASS_PREFIX}-${type}`]: type,
        [`${TYPOGRAPHY_CLASS_PREFIX}-${size}`]: size,
    })
    // NOTE: Used wrapper destructuring to explicitly pass component props, which is marked as internal in antd
    const componentProps = { component: 'span' }
    // NOTE: We should pass default config anyway if any prop type was provided because prefixCls should exist at result prop
    let ellipsisProp: TypographyTextProps['ellipsis'] = false
    if (typeof ellipsis === 'boolean' && ellipsis) {
        ellipsisProp = DEFAULT_ELLIPSIS_CONFIG
    } else if (typeof ellipsis === 'object') {
        ellipsisProp = merge(DEFAULT_ELLIPSIS_CONFIG, ellipsis)
    }

    return (
        <Base
            {...rest}
            prefixCls={TYPOGRAPHY_CLASS_PREFIX}
            ref={ref}
            ellipsis={ellipsisProp}
            className={className}
            {...componentProps}
        />
    )
})

Text.displayName = 'Typography.Text'

export {
    Text,
}
