import {
    Card as DefaultCard,
    CardProps as DefaultCardProps,
} from 'antd'
import classNames from 'classnames'
import React, { CSSProperties, useCallback, useState } from 'react'

import { Checkbox } from '../Checkbox'

const CARD_CLASS_PREFIX = 'condo-card'

export type CardProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> &
Pick<DefaultCardProps, 'hoverable' | 'title'> & {
    type?: 'card' | 'checkbox'
    width?: CSSProperties['width']
    bodyPadding?: CSSProperties['padding']
    titlePadding?: CSSProperties['padding']
    active?: boolean
    disabled?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => {
    const {
        type = 'card',
        width,
        bodyPadding,
        titlePadding,
        active = false,
        disabled = false,
        className: propsClassName,
        ...rest
    } = props

    const [innerActive, setInnerActive] = useState<boolean>()

    const className = classNames(propsClassName, {
        [`${CARD_CLASS_PREFIX}-active`]: active || innerActive,
        [`${CARD_CLASS_PREFIX}-disabled`]: disabled,
        [`${CARD_CLASS_PREFIX}-${type}`]: type,
    })

    const [checked, setChecked] = useState<boolean>()

    const handleClick = useCallback((event) => {
        const valueToSet = !checked

        setChecked(valueToSet)
        setInnerActive(valueToSet)

        if (props.onClick) {
            props.onClick(event)
        }
    }, [checked, props])
    
    return (
        <DefaultCard
            {...rest}
            className={className}
            style={{ width }}
            prefixCls={CARD_CLASS_PREFIX}
            ref={ref}
            bodyStyle={{ padding: bodyPadding }}
            headStyle={{ padding: titlePadding }}
            onClick={handleClick}
            title={(
                <>
                    <Checkbox checked={checked} onChange={e => setChecked(e.target.checked)} />
                    {rest.title}
                </>
            )}
        />
    )
})

Card.displayName = 'Card'

export {
    Card,
}