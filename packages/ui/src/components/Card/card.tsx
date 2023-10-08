import {
    Card as DefaultCard,
    CardProps as DefaultCardProps,
} from 'antd'
import classNames from 'classnames'
import React, { CSSProperties } from 'react'

const CARD_CLASS_PREFIX = 'condo-card'

export type CardProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> &
Pick<DefaultCardProps, 'hoverable' | 'title'> & {
    width?: CSSProperties['width']
    bodyPadding?: CSSProperties['padding']
    titlePadding?: CSSProperties['padding']
    active?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => {
    const { width, bodyPadding = 24, titlePadding = 24, active = false, ...rest } = props

    const className = classNames({
        [`${CARD_CLASS_PREFIX}-active`]: active,
    })
    
    return (
        <DefaultCard
            {...rest}
            className={className}
            style={{ width }}
            prefixCls={CARD_CLASS_PREFIX}
            ref={ref}
            bodyStyle={{ padding: bodyPadding }}
            headStyle={{ padding: titlePadding }}
        />
    )
})

Card.displayName = 'Card'

export {
    Card,
}