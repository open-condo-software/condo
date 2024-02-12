import classNames from 'classnames'
import React from 'react'

import './cardCheckbox.less'
import { CardBody, CardBodyProps } from './_utils/cardBody'
import { CardHeader, CardHeaderProps } from './_utils/cardHeader'
import { CARD_CLASS_PREFIX } from './_utils/constants'
import { Card, CardProps } from './card'


export type CardButtonProps = Pick<CardProps, 'accent' | 'disabled'> & {
    header: CardHeaderProps
    body?: CardBodyProps
}

const CardButton = React.forwardRef<HTMLDivElement, CardButtonProps>((props, ref) => {
    const {
        header,
        body,
        ...rest
    } = props

    const className = classNames({
        [`${CARD_CLASS_PREFIX}-button-type`]: true,
        [`${CARD_CLASS_PREFIX}-no-body`]: !body,
    })

    return (
        <Card
            {...rest}
            ref={ref}
            className={className}
            hoverable
            title={<CardHeader {...header} />}
        >
            {body && <CardBody {...body}/>}
        </Card>
    )
})

CardButton.displayName = 'CardButton'

export {
    CardButton,
}