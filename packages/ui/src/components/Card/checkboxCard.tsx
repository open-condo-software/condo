import classNames from 'classnames'
import React, { useCallback, useMemo, useState } from 'react'

import './checkboxCard.less'
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

    const [active, setActive] = useState<boolean>()

    const handleClick = useCallback((event) => {
        setActive(prev => !prev)

        if (props.onClick) {
            props.onClick(event)
        }
    }, [props])

    const className = classNames(propsClassName, {
        [`${CARD_CLASS_PREFIX}-checkbox-type`]: true,
    })
    const title = useMemo(() => props.title && (
        <>
            <Checkbox
                className={`${CARD_CLASS_PREFIX}-checkbox`}
                checked={active}
            />
            {rest.title}
        </>
    ), [active, props.title, rest.title])
    const children = useMemo(() => props.title ? props.children : (
        <>
            <Checkbox
                className={`${CARD_CLASS_PREFIX}-checkbox`}
                checked={active}
            />
            {props.children}
        </>
    ), [active, props.children, props.title])

    return (
        <Card
            {...rest}
            ref={ref}
            className={className}
            active={active}
            onClick={handleClick}
            title={title}
            children={children}
        />
    )
})

CheckboxCard.displayName = 'CheckboxCard'

export {
    CheckboxCard,
}
