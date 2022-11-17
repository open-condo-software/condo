import React from 'react'
import Base from 'antd/lib/typography/Base'
import classNames from 'classnames'
import { TYPOGRAPHY_CLASS_PREFIX, TEXT_SIZES } from './constants'

export type TypographyLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'type'> & {
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
    const className = classNames({
        [`${TYPOGRAPHY_CLASS_PREFIX}-${size}`]: size,
    })
    // NOTE: Used wrapper destructuring to explicitly pass component props, which is marked as internal in antd
    const componentProps = { component: 'a' }

    return (
        <Base
            {...props}
            className={className}
            prefixCls={TYPOGRAPHY_CLASS_PREFIX}
            ref={ref}
            {...componentProps}
        />
    )
})

Link.displayName = 'Typography.Link'

export {
    Link,
}

