import { Select, Input, SelectProps } from 'antd'
import React from 'react'
import get from 'lodash/get'
import flattenDeep from 'lodash/flattenDeep'
import isEmpty from 'lodash/isEmpty'
import { useIntl } from '@core/next/intl'

import { IPropertyUIState } from '@condo/domains/property/utils/clientSchema/Property'

export interface IUnitNameInputProps extends Pick<SelectProps<string>, 'onChange' | 'onSelect'> {
    property: IPropertyUIState
    placeholder?: string
    allowClear?: boolean
    loading: boolean
}

// TODO(Dimitreee): move search to serverside
const getOptionGroupBySectionType = (groupLabel, sections) => {
    if (!sections) return

    const unflattenUnits = sections.map((section) => {
        const floors = get(section, ['floors'], [])

        return floors.map((floor) => floor.units).reverse()
    })

    const flattenUnits: Array<{ id: string, label }> = flattenDeep(unflattenUnits)

    const options = flattenUnits.map(
        (unit) => (
            <Select.Option key={unit.label} value={unit.label} title={String(unit.label)}>{unit.label}</Select.Option>
        )
    )

    return !isEmpty(options) && (
        <Select.OptGroup label={groupLabel}>
            {options}
        </Select.OptGroup>
    )
}

export const BaseUnitNameInput: React.FC<IUnitNameInputProps> = (props) => {
    const intl = useIntl()
    const UnitsLabel = intl.formatMessage({ id: 'pages.condo.ticket.select.group.Units' })
    const ParkingLabel = intl.formatMessage({ id: 'pages.condo.ticket.select.group.Parking' })

    const { placeholder, property, loading, ...restInputProps } = props
    const sections = get(property, ['map', 'sections'], [])
    const parking = get(property, ['map', 'parking'], [])

    return (
        <Select
            allowClear
            showSearch
            placeholder={placeholder}
            optionFilterProp={'title'}
            loading={loading}
            disabled={loading}
            {...restInputProps}
        >
            {getOptionGroupBySectionType(UnitsLabel, sections)}
            {getOptionGroupBySectionType(ParkingLabel, parking)}
        </Select>
    )
}

export const UnitNameInput = (props: IUnitNameInputProps) => {
    const { property, onSelect, onChange, ...baseInputProps } = props

    if (!property) {
        return <Input {...baseInputProps} disabled value={null}/>
    }

    return <BaseUnitNameInput {...props} onSelect={onSelect} onChange={onChange}/>
}
