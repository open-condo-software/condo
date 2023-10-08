import Base from 'antd/lib/typography/Base'
import classNames from 'classnames'
import merge from 'lodash/merge'
import React from 'react'

import { TYPOGRAPHY_CLASS_PREFIX, TEXT_SIZES, TEXT_TYPES, TOOLTIP_CLASS_PREFIX } from './constants'

import type { TextProps as DefaultTextProps } from 'antd/lib/typography/Text'

const DEFAULT_ELLIPSIS_CONFIG = { tooltip: { prefixCls: TOOLTIP_CLASS_PREFIX } }

export type TypographyTextProps = Omit<DefaultTextProps,
'keyboard'
| 'type'
| 'editable'
| 'copyable'
| 'mark'
| 'className'
| 'prefixCls'
| 'style'
| 'id'> & {
    type?: typeof TEXT_TYPES[number]
    size?: typeof TEXT_SIZES[number]
    lineWrapping?: 'break-spaces'
}

const Text = React.forwardRef<HTMLSpanElement, TypographyTextProps>((props, ref) => {
    const { type = 'primary', size = 'lg', ellipsis, onClick, lineWrapping, ...rest } = props
    const className = classNames({
        [`${TYPOGRAPHY_CLASS_PREFIX}-${type}`]: type,
        [`${TYPOGRAPHY_CLASS_PREFIX}-${size}`]: size,
        [`${TYPOGRAPHY_CLASS_PREFIX}-break-spaces`]: lineWrapping === 'break-spaces',
    }, typeof onClick === 'function' ? `${TYPOGRAPHY_CLASS_PREFIX}-clickable` : '')
    // NOTE: Used wrapper destructuring to explicitly pass component props, which is marked as internal in antd
    const componentProps = { component: 'span' }
    // NOTE: We should pass default config anyway if any prop type was provided because prefixCls should exist at result prop
    let ellipsisProp: TypographyTextProps['ellipsis'] = false
    if (typeof ellipsis === 'boolean' && ellipsis) {
        ellipsisProp = DEFAULT_ELLIPSIS_CONFIG
    } else if (typeof ellipsis === 'object') {
        ellipsisProp = merge(ellipsis, DEFAULT_ELLIPSIS_CONFIG)
    }

    return (
        <Base
            {...rest}
            prefixCls={TYPOGRAPHY_CLASS_PREFIX}
            ref={ref}
            ellipsis={ellipsisProp}
            className={className}
            onClick={onClick}
            {...componentProps}
        />
    )
})

Text.displayName = 'Typography.Text'

export {
    Text,
}
