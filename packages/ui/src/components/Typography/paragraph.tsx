import React from 'react'
import type { ParagraphProps as DefaultParagraphProps } from 'antd/lib/typography/Paragraph'
import Base from 'antd/lib/typography/Base'
import classNames from 'classnames'
import { TYPOGRAPHY_CLASS_PREFIX, TEXT_SIZES, TEXT_TYPES } from './constants'

export type TypographyParagraphProps = Omit<DefaultParagraphProps,
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

const Paragraph = React.forwardRef<HTMLSpanElement, TypographyParagraphProps>((props, ref) => {
    const { type, size = 'lg', ...rest } = props
    const className = classNames({
        [`${TYPOGRAPHY_CLASS_PREFIX}-${type}`]: type,
        [`${TYPOGRAPHY_CLASS_PREFIX}-${size}`]: size,
    })
    // NOTE: Used wrapper destructuring to explicitly pass component props, which is marked as internal in antd
    const componentProps = { component: 'div' }

    return (
        <Base
            prefixCls={TYPOGRAPHY_CLASS_PREFIX}
            ref={ref}
            className={className}
            {...componentProps}
            {...rest}
        />
    )
})

Paragraph.displayName = 'Typography.Paragraph'

export {
    Paragraph,
}