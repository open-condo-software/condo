import classNames from 'classnames'
import React, { useCallback, useState } from 'react'

import { Card } from './card'

import { Checkbox } from '../Checkbox'


import type { CardProps } from './card'

export type CheckboxCardProps = Omit<CardProps, 'active'>

const CARD_CLASS_PREFIX = 'condo-card'

const CheckboxCard = React.forwardRef<HTMLDivElement, CheckboxCardProps>((props, ref) => {
    const {
        className: propsClassName,
        ...rest
    } = props

    const className = classNames(propsClassName, {
        [`${CARD_CLASS_PREFIX}-checkbox`]: true,
    })

    const [active, setActive] = useState<boolean>()

    const handleClick = useCallback((event) => {
        setActive(prev => !prev)

        if (props.onClick) {
            props.onClick(event)
        }
    }, [props])

    return (
        <Card
            {...rest}
            ref={ref}
            className={className}
            active={active}
            onClick={handleClick}
            title={(
                <>
                    <Checkbox checked={active} />
                    {rest.title}
                </>
            )}
        />
    )
})

CheckboxCard.displayName = 'CheckboxCard'

export {
    CheckboxCard,
}
