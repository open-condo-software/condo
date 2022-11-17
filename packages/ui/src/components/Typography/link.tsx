import React from 'react'
import Base from 'antd/lib/typography/Base'
import classNames from 'classnames'
import { TYPOGRAPHY_CLASS_PREFIX, TEXT_SIZES } from './constants'

export type TypographyLinkProps =  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'type'> & {
    title?: string
    disabled?: boolean
    ellipsis?: boolean
    size?: typeof TEXT_SIZES[number]
    id?: string
    children?: React.ReactNode
    ['aria-label']?: string
}

const Link = React.forwardRef<HTMLElement, TypographyLinkProps>((props, ref) => {
    const { size } = props
    const className = classNames(
        // TODO(DOMA-4681): Remove TYPOGRAPHY_CLASS_PREFIX after next antd release including this patch: https://github.com/ant-design/ant-design/pull/38586
        TYPOGRAPHY_CLASS_PREFIX,
        {
            [`${TYPOGRAPHY_CLASS_PREFIX}-${size}`]: size,
        }
    )
    return (
        <Base
            className={className}
            prefixCls={TYPOGRAPHY_CLASS_PREFIX}
            ref={ref}
            component='a'
            {...props}
        />
    )
})

Link.displayName = 'Typography.Link'

export {
    Link,
}

