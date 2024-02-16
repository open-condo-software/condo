import {
    Card as DefaultCard,
    CardProps as DefaultCardProps,
} from 'antd'
import classNames from 'classnames'
import React, { CSSProperties } from 'react'

import { CARD_CLASS_PREFIX } from './_utils/constants'


export type CardProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> &
Pick<DefaultCardProps, 'hoverable' | 'title'> & {
    width?: CSSProperties['width']
    bodyPadding?: CSSProperties['padding']
    titlePadding?: CSSProperties['padding']
    accent?: boolean
    active?: boolean
    disabled?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => {
    const {
        width,
        bodyPadding,
        titlePadding,
        active = false,
        accent = false,
        disabled = false,
        className: propsClassName,
        ...rest
    } = props

    const className = classNames(propsClassName, {
        [`${CARD_CLASS_PREFIX}-active`]: active,
        [`${CARD_CLASS_PREFIX}-accent`]: accent,
        [`${CARD_CLASS_PREFIX}-disabled`]: disabled,
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