import React from 'react'

import { QuestionCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Checkbox, CheckboxProps, Space, Tooltip, Typography } from '@open-condo/ui'

import { MapViewMode } from '../MapConstructor'


type RenameNextUnitsCheckboxProps = {
    onChange: CheckboxProps['onChange']
    mapViewMode: MapViewMode
}

export const RenameNextUnitsCheckbox: React.FC<RenameNextUnitsCheckboxProps> = ({ onChange, mapViewMode }) => {
    const intl = useIntl()
    const RenameNextUnitsLabel = mapViewMode === MapViewMode.parking ?
        intl.formatMessage({ id: 'pages.condo.property.modal.RenameNextParkingUnits' }) :
        intl.formatMessage({ id: 'pages.condo.property.modal.RenameNextUnits' })
    const RenameNextUnitsTooltip = mapViewMode === MapViewMode.parking ?
        intl.formatMessage({ id: 'pages.condo.property.modal.RenameNextParkingUnits.tooltip' }) :
        intl.formatMessage({ id: 'pages.condo.property.modal.RenameNextUnits.tooltip' })

    return (
        <Checkbox
            onChange={onChange}
            data-cy='property-map__unit-form__rename-units-checkbox'
        >
            <Space size={8}>
                {RenameNextUnitsLabel}
                <Tooltip title={RenameNextUnitsTooltip}>
                    <Typography.Text type='secondary'>
                        <QuestionCircle size='small'/>
                    </Typography.Text>
                </Tooltip>
            </Space>
        </Checkbox>
    )
}