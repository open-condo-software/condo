import { BuildingUnitSubType } from '@app/condo/schema'
import classNames from 'classnames'
import React, { useMemo } from 'react'

import { Button, ButtonProps, Tooltip } from '@open-condo/ui'


type CustomButtonProps = Omit<ButtonProps, 'type'> & {
    selected?: boolean
    preview?: boolean
    ellipsis?: boolean
    unitType?: BuildingUnitSubType
    isDuplicated?: boolean
    type: 'unit' | 'floor' | 'section'
}

export const UnitButton: React.FC<CustomButtonProps> = (props) => {
    const {
        type = 'unit', selected, preview, ellipsis = true,
        unitType, isDuplicated, children, ...restProps
    } = props

    const buttonClassName = useMemo(() => {
        const classes = {
            ['map-unit-button']: true,
            ['map-unit-button-selected']: selected,
            [`map-${unitType}-unit-button`]: typeof unitType !== 'undefined',
            ['map-preview-unit-button']: preview,
            ['map-duplicate-unit-button']: isDuplicated,
            [`map-unit-button-${type}`]: true,
        }

        return classNames(classes)
    }, [isDuplicated, preview, selected, type, unitType])

    const OriginalLabel = children ? children.toString() : ''
    if (type !== 'section' && OriginalLabel.length > 4 && ellipsis) {
        let ButtonLabel = OriginalLabel
        if (!isNaN(Number(ButtonLabel))) {
            ButtonLabel = `…${ButtonLabel.substring(ButtonLabel.length - 2)}`
        } else {
            ButtonLabel = `${ButtonLabel.substring(0, 2)}…`
        }

        return (
            <Tooltip
                placement='topLeft'
                title={OriginalLabel}
            >
                <Button
                    type='secondary'
                    stateless
                    className={buttonClassName}
                    {...restProps}
                >
                    {ButtonLabel}
                </Button>
            </Tooltip>
        )
    } else {
        return (
            <Button
                type='secondary'
                stateless
                className={buttonClassName}
                {...restProps}
            >
                {children || '\u00A0'}
            </Button>
        )
    }
}
