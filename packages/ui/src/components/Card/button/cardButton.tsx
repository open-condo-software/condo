import classNames from 'classnames'
import React from 'react'

import '../checkbox/cardCheckbox.less'
import { CARD_CLASS_PREFIX } from '../_utils/constants'
import { CardBody, CardBodyProps } from '../body/cardBody'
import { Card, CardProps } from '../card'
import { CardHeader, CardHeaderProps } from '../header/cardHeader'


export type CardButtonProps = Pick<CardProps, 'accent' | 'disabled'> & {
    header?: CardHeaderProps
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
            title={header && <CardHeader {...header} />}
        >
            {body && <CardBody {...body}/>}
        </Card>
    )
})

CardButton.displayName = 'CardButton'

export {
    CardButton,
}