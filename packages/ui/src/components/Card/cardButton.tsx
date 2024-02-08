import classNames from 'classnames'
import React from 'react'

import './cardCheckbox.less'
import { CARD_CLASS_PREFIX } from './_utils/constants'
import { Card } from './card'

import type { CardProps } from './card'
export type CardButtonProps = Omit<CardProps, 'hoverable'>


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