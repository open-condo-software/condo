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
            component='div'
            className={className}
            {...rest}
        />
    )
})

Paragraph.displayName = 'Typography.Paragraph'

export {
    Paragraph,
}