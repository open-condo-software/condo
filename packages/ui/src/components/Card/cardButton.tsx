import classNames from 'classnames'
import React from 'react'

import './cardCheckbox.less'
import { Card } from './card'

import type { CardProps } from './card'
export type CardButtonProps = Omit<CardProps, 'hoverable'>


const CARD_CLASS_PREFIX = 'condo-card'

const CardButton = React.forwardRef<HTMLDivElement, CardButtonProps>((props, ref) => {
    const {
        className: propsClassName,
        ...rest
    } = props

    const className = classNames(propsClassName, {
        [`${CARD_CLASS_PREFIX}-button-type`]: true,
    })

    return (
        <Card
            {...rest}
            ref={ref}
            className={className}
            hoverable
        />
    )
})

CardButton.displayName = 'CardButton'

export {
    CardButton,
}