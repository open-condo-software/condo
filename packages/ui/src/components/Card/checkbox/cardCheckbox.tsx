import classNames from 'classnames'
import React, { useCallback, useMemo, useState } from 'react'

import './cardCheckbox.less'
import { Checkbox } from '../../Checkbox'
import { CARD_CLASS_PREFIX } from '../_utils/constants'
import { CardBody, CardBodyProps } from '../body/cardBody'
import { Card } from '../card'
import { CardHeader, CardHeaderProps } from '../header/cardHeader'

import type { CardProps } from '../card'


export type CardCheckboxProps = Pick<CardProps, 'disabled' | 'onClick'> & {
    header?: Omit<CardHeaderProps, 'tag' | 'mainLink' | 'secondLink'>
    body?: CardBodyProps
}

const CardCheckbox = React.forwardRef<HTMLDivElement, CardCheckboxProps>((props, ref) => {
    const {
        header,
        body,
        ...rest
    } = props

    const [checked, setChecked] = useState<boolean>()

    const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        setChecked(prev => !prev)

        if (props.onClick) {
            props.onClick(event)
        }
    }, [props])

    const className = classNames({
        [`${CARD_CLASS_PREFIX}-checked`]: checked,
        [`${CARD_CLASS_PREFIX}-checkbox-type`]: true,
        [`${CARD_CLASS_PREFIX}-no-body`]: !body,
    })
    const checkbox = useMemo(() => (
        <Checkbox
            className={`${CARD_CLASS_PREFIX}-checkbox`}
            checked={checked}
        />
    ), [checked])
    const title = useMemo(() => header && (
        <>
            {checkbox}
            <CardHeader {...header} />
        </>
    ), [checkbox, header])
    const handleButtonClick = useCallback((e: React.MouseEvent<HTMLButtonElement> & React.MouseEvent<HTMLAnchorElement>) => {
        e.stopPropagation()

        if (body?.button?.onClick) {
            body.button.onClick(e)
        }
    }, [body])
    const bodyProps = useMemo(() => ({
        ...body,
        button: body?.button && { ...body.button, onClick: handleButtonClick },
    }), [body, handleButtonClick])
    const children = useMemo(() => header ? <CardBody {...bodyProps}/> : (
        <>
            {checkbox}
            <CardBody {...bodyProps} />
        </>
    ), [bodyProps, checkbox, header])

    return (
        <Card
            {...rest}
            ref={ref}
            className={className}
            onClick={handleClick}
            hoverable
            title={title}
        >
            {body && children}
        </Card>
    )
})

CardCheckbox.displayName = 'CardCheckbox'

export {
    CardCheckbox,
}
