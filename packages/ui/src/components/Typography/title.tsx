import React from 'react'
import type { TitleProps as DefaultTitleProps } from 'antd/lib/typography/Title'
import Base from 'antd/lib/typography/Base'
import classNames from 'classnames'
import { TYPOGRAPHY_CLASS_PREFIX } from './constants'

declare const TITLE_LEVELS: [1, 2, 3, 4, 5, 6]
declare const TITLE_TYPES: ['inverted']
export type TypographyTitleProps = Pick<DefaultTitleProps, 'ellipsis' | 'onClick' | 'title' | 'children'> & {
    type?: typeof TITLE_TYPES[number]
    level?: typeof TITLE_LEVELS[number]
}

const Title = React.forwardRef<HTMLElement, TypographyTitleProps>((props, ref) => {
    const { level = 1, type, ...rest } = props
    const className = classNames({
        [`${TYPOGRAPHY_CLASS_PREFIX}-${type}`]: type,
    })
    // NOTE: Used wrapper destructuring to explicitly pass component props, which is marked as internal in antd
    const componentProps = { component: `h${level}` }

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

Title.displayName = 'Typography.Title'

export {
    Title,
}