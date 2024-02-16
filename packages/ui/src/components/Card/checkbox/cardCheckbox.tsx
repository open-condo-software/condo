import classNames from 'classnames'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import './cardCheckbox.less'
import { Checkbox } from '../../Checkbox'
import { CARD_CLASS_PREFIX } from '../_utils/constants'
import { CardBody, CardBodyProps } from '../body/cardBody'
import { Card } from '../card'
import { CardHeader, CardHeaderProps } from '../header/cardHeader'

import type { CardProps } from '../card'


export type CardCheckboxProps = Pick<CardProps, 'disabled'> & {
    header?: Omit<CardHeaderProps, 'tag' | 'mainLink' | 'secondLink'>
    body?: CardBodyProps
    defaultChecked?: boolean
    onChange?: (newValue: boolean) => void
    checked?: boolean
}

const CardCheckbox = React.forwardRef<HTMLDivElement, CardCheckboxProps>((props, ref) => {
    const {
        header,
        body,
        defaultChecked,
        onChange,
        checked: checkedFromProps,
        ...rest
    } = props

    const initialChecked = useMemo(() => {
        if (typeof checkedFromProps !== 'undefined') {
            return checkedFromProps
        } else if (typeof defaultChecked !== 'undefined') {
            return defaultChecked
        } else return false
    }, [checkedFromProps, defaultChecked])

    const [checked, setChecked] = useState<boolean>(initialChecked)

    useEffect(() => {
        if (typeof checkedFromProps !== 'undefined') {
            setChecked(checkedFromProps)

            if (onChange) {
                onChange(checkedFromProps)
            }
        }
    }, [checkedFromProps])

    const handleClick = useCallback(() => {
        const newValue = !checked
        setChecked(newValue)

        if (onChange) {
            onChange(newValue)
        }
    }, [checked, onChange])

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
            onClick={handleClick}
            className={className}
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
