import classNames from 'classnames'
import get from 'lodash/get'
import React, { useCallback } from 'react'

import '../checkbox/cardCheckbox.less'
import { sendAnalyticsClickEvent } from '../../_utils/analytics'
import { CARD_CLASS_PREFIX } from '../_utils/constants'
import { CardBody, CardBodyProps } from '../body/cardBody'
import { Card, CardProps } from '../card'
import { CardHeader, CardHeaderProps } from '../header/cardHeader'


export type CardButtonProps = Pick<CardProps, 'accent' | 'disabled' | 'id' | 'className' | 'onClick'> & {
    header?: CardHeaderProps
    body?: CardBodyProps
}

const CardButton = React.forwardRef<HTMLDivElement, CardButtonProps>((props, ref) => {
    const {
        header,
        body,
        className: propsClassName,
        id,
        onClick,
        ...rest
    } = props

    const className = classNames(propsClassName, {
        [`${CARD_CLASS_PREFIX}-button-type`]: true,
        [`${CARD_CLASS_PREFIX}-no-body`]: !body,
    })

    const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement> & React.MouseEvent<HTMLAnchorElement>) => {
        const title = get(header, 'headingTitle')
        if (title) {
            sendAnalyticsClickEvent('Card', { title, id })
        }

        if (onClick) {
            onClick(event)
        }
    }, [header, id, onClick])

    return (
        <Card
            {...rest}
            id={id}
            ref={ref}
            className={className}
            hoverable
            title={header && <CardHeader {...header} />}
            onClick={handleClick}
        >
            {body && <CardBody {...body}/>}
        </Card>
    )
})

CardButton.displayName = 'CardButton'

export {
    CardButton,
}