import React, { CSSProperties } from 'react'
import {
    Card as DefaultCard,
    CardProps as DefaultCardProps,
} from 'antd'

const CARD_CLASS_PREFIX = 'condo-card'

export type CardProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> &
Pick<DefaultCardProps, 'hoverable' | 'title'> & {
    width?: CSSProperties['width']
    bodyPadding?: CSSProperties['padding']
    titlePadding?: CSSProperties['padding']
}

const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => {
    const { width, bodyPadding = 24, titlePadding = 24, ...rest } = props
    return (
        <DefaultCard
            {...rest}
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