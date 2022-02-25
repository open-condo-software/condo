import React from 'react'
import { useIntl } from '@core/next/intl'

import { Input, Select, SelectProps } from 'antd'
import flattenDeep from 'lodash/flattenDeep'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'

import { BuildingSection, BuildingUnit, BuildingUnitType } from '@app/condo/schema'
import { IPropertyUIState } from '@condo/domains/property/utils/clientSchema/Property'
import { LabeledValue } from 'antd/lib/select'

export interface IUnitNameInputProps extends Pick<SelectProps<string>, 'onChange' | 'onSelect'> {
    property: IPropertyUIState
    placeholder?: string
    allowClear?: boolean
    loading: boolean
}
interface IGetOptionGroupBySectionType {
    ({ sections, unitType, groupLabel }: {
        sections: BuildingSection[], unitType: BuildingUnitType, groupLabel: string
    }): React.ReactNode
}

export type UnitNameInputOption = LabeledValue & { 'data-unitType': BuildingUnitType, 'data-unitName': string }
const BASE_UNIT_NAME_INPUT_OPTION_STYLE: React.CSSProperties = { paddingLeft: '12px' }

const getOptionGroupBySectionType: IGetOptionGroupBySectionType = (props) => {
    const { sections, unitType, groupLabel } = props
    if (!sections) return null

    const unflattenUnits = sections.map((section) => {
        const floors = get(section, ['floors'], [])

        return floors.map((floor) => floor.units).reverse()
    })

    const flattenUnits: Array<BuildingUnit> = flattenDeep(unflattenUnits)

    const options = flattenUnits.filter((unit) => {
        if (unitType === BuildingUnitType.Flat) {
            return unit.unitType === null || unit.unitType === BuildingUnitType.Flat
        }
        return unit.unitType === unitType
    }).map(
        (unit) => (
            <Select.Option
                key={`${unitType}-${unit.label}`}
                value={`${unitType}-${unit.label}`}
                data-unitType={unitType}
                data-unitName={String(unit.label)}
                title={String(unit.label)}
                style={BASE_UNIT_NAME_INPUT_OPTION_STYLE}
            >
                {unit.label}
            </Select.Option>
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
    const FlatGroupLabel = intl.formatMessage({ id: 'pages.condo.ticket.select.group.flat' })
    const ParkingGroupLabel = intl.formatMessage({ id: 'pages.condo.ticket.select.group.parking' })
    const WarehouseGroupLabel = intl.formatMessage({ id: 'pages.condo.ticket.select.group.warehouse' })
    const CommercialGroupLabel = intl.formatMessage({ id: 'pages.condo.ticket.select.group.commercial' })
    const ApartmentGroupLabel = intl.formatMessage({ id: 'pages.condo.ticket.select.group.apartment' })
    const { placeholder, property, loading, ...restInputProps } = props

    const sections = get(property, 'map.sections', [])
    const parking = get(property, 'map.parking', [])

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
            {getOptionGroupBySectionType({
                sections, unitType: BuildingUnitType.Flat, groupLabel: FlatGroupLabel,
            })}
            {getOptionGroupBySectionType({
                sections, unitType: BuildingUnitType.Apartment, groupLabel: ApartmentGroupLabel,
            })}
            {getOptionGroupBySectionType({
                sections: parking, unitType: BuildingUnitType.Parking, groupLabel: ParkingGroupLabel,
            })}
            {getOptionGroupBySectionType({
                sections, unitType: BuildingUnitType.Warehouse, groupLabel: WarehouseGroupLabel,
            })}
            {getOptionGroupBySectionType({
                sections, unitType: BuildingUnitType.Commercial, groupLabel: CommercialGroupLabel,
            })}
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
