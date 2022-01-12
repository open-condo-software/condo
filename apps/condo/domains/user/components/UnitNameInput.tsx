import { Select, Input, SelectProps } from 'antd'
import React, { useMemo } from 'react'
import get from 'lodash/get'
import flattenDeep from 'lodash/flattenDeep'
import { IPropertyUIState } from '@condo/domains/property/utils/clientSchema/Property'

export interface IUnitNameInputProps extends Pick<SelectProps<string>, 'onChange' | 'onSelect'> {
    property: IPropertyUIState
    placeholder?: string
    allowClear?: boolean
    loading: boolean
}

export const BaseUnitNameInput: React.FC<IUnitNameInputProps> = (props) => {
    const { placeholder, property, loading, ...restInputProps } = props

    // TODO(Dimitreee): move search to serverside
    const options = useMemo(() => {
        const sections = get(property, ['map', 'sections'], [])

        const unflattenUnits = sections.map((section) => {
            const floors = get(section, ['floors'], [])

            return floors.map((floor) => floor.units).reverse()
        })

        const flattenUnits: Array<{ id: string; label }> = flattenDeep(unflattenUnits)

        return flattenUnits.map((unit) => (
            <Select.Option key={unit.label} value={unit.label} title={String(unit.label)}>
                {unit.label}
            </Select.Option>
        ))
    }, [property])

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
            {options}
        </Select>
    )
}

export const UnitNameInput = (props: IUnitNameInputProps) => {
    const { property, onSelect, onChange, ...baseInputProps } = props

    if (!property) {
        return <Input {...baseInputProps} disabled value={null} />
    }

    return <BaseUnitNameInput {...props} onSelect={onSelect} onChange={onChange} />
}
