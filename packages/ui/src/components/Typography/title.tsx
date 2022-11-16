import React from 'react'
import type { TitleProps as DefaultTitleProps } from 'antd/lib/typography/Title'
import Base from 'antd/lib/typography/Base'
import classNames from 'classnames'

declare const TITLE_LEVELS: [1, 2, 3, 4, 5, 6]
declare const TITLE_TYPES: ['default', 'inverted']
export type TypographyTitleProps = Pick<DefaultTitleProps, 'ellipsis' | 'onClick' | 'title' | 'children'> & {
    type?: typeof TITLE_TYPES[number]
    level?: typeof TITLE_LEVELS[number]
}

const TYPOGRAPHY_CLASS_PREFIX = 'condo-typography'

const Title = React.forwardRef<HTMLElement, TypographyTitleProps>((props, ref) => {
    const { level = 1, type = 'default', ...rest } = props
    const component = `h${level}`
    const className = classNames(
        // TODO(DOMA-4681): Remove TYPOGRAPHY_CLASS_PREFIX after next antd release including this patch: https://github.com/ant-design/ant-design/pull/38586
        TYPOGRAPHY_CLASS_PREFIX,
        {
            [`${TYPOGRAPHY_CLASS_PREFIX}-${type}`]: type,
        }
    )

    return (
        <Base
            prefixCls={TYPOGRAPHY_CLASS_PREFIX}
            ref={ref}
            component={component}
            className={className}
            {...rest}
        />
    )
})

Title.displayName = 'Typography.Title'

export {
    Title,
}