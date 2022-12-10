import { BuildingSection, BuildingUnit, BuildingUnitSubType, Property } from '@app/condo/schema'
import { LabeledValue } from 'antd/lib/select'
import flattenDeep from 'lodash/flattenDeep'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'

import Input from '@condo/domains/common/components/antd/Input'
import Select, { CustomSelectProps } from '@condo/domains/common/components/antd/Select'
import { TrackingEventPropertiesType } from '@condo/domains/common/components/TrackingContext'
import { getFloorsBySection, UnitInfoMode } from '@condo/domains/property/components/UnitInfo'

export interface IUnitNameInputProps extends Pick<CustomSelectProps<string>, 'onChange' | 'onSelect'> {
    property: Property
    placeholder?: string
    allowClear?: boolean
    loading: boolean
    disabled?: boolean
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
    mode?: UnitInfoMode
    selectedFloorName?: string
    selectedSectionName?: string
    selectedSections?: BuildingSection[]
    multiple?: boolean
}
interface IGetOptionGroupBySectionType {
    units: BuildingUnit[]
    unitType: BuildingUnitSubType,
    groupLabel: string
}

export type UnitNameInputOption = LabeledValue & { 'data-unitType': BuildingUnitSubType, 'data-unitName': string }
const BASE_UNIT_NAME_INPUT_OPTION_STYLE: React.CSSProperties = { paddingLeft: '12px' }

const getUnitsBySectionAndFloor = (selectedSectionName, selectedFloorName, sections: BuildingSection[]) => {
    if (!isEmpty(selectedSectionName) && !isEmpty(selectedFloorName)) {
        const floors = getFloorsBySection(selectedSectionName, sections)
        const selectedFloor = floors.find(floor => floor.name === selectedFloorName)

        return get(selectedFloor, 'units', [])
    } else if (!isEmpty(selectedSectionName)) {
        const floors = getFloorsBySection(selectedSectionName, sections)

        return floors.flatMap(floor => floor.units)
    }
}

const getAllSectionsUnits = (sections) => {
    if (!sections) return null

    const unflattenUnits = sections.map((section) => {
        const floors = get(section, ['floors'], [])

        return floors.map((floor) => floor.units).reverse()
    })

    return flattenDeep(unflattenUnits)
}

const getOptionGroupBySectionType: React.FC<IGetOptionGroupBySectionType> = (props) => {
    const { units, unitType, groupLabel } = props
    if (!units) return

    const filteredUnits = units.filter((unit) => {
        if (unitType === BuildingUnitSubType.Flat) {
            return unit.unitType === null || unit.unitType === BuildingUnitSubType.Flat
        }
        return unit.unitType === unitType
    })

    const sortedUnits = filteredUnits.sort((unitNameA, unitNameB) => String(unitNameA.label).localeCompare(String(unitNameB.label), 'en', { numeric: true, ignorePunctuation: true }))

    const options = sortedUnits.map(
        (unit) => (
            <Select.Option
                key={`${unitType}-${unit.label}`}
                value={`${unitType}-${unit.label}`}
                data-unitType={unitType}
                data-unitName={String(unit.label)}
                title={String(unit.label)}
                data-cy='user__unit-name-input-option'
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
    const FlatGroupLabel = intl.formatMessage({ id: 'ticket.select.group.flat' })
    const ParkingGroupLabel = intl.formatMessage({ id: 'ticket.select.group.parking' })
    const WarehouseGroupLabel = intl.formatMessage({ id: 'ticket.select.group.warehouse' })
    const CommercialGroupLabel = intl.formatMessage({ id: 'ticket.select.group.commercial' })
    const ApartmentGroupLabel = intl.formatMessage({ id: 'ticket.select.group.apartment' })
    const {
        placeholder, property, loading, disabled = false, mode, selectedFloorName, selectedSectionName, selectedSections, multiple, ...restInputProps
    } = props

    const sections = get(property, 'map.sections', [])
    const parking = get(property, 'map.parking', [])

    const getUnits = useCallback((sections) => {
        if (mode === UnitInfoMode.Unit || isEmpty(selectedSectionName)) {
            return getAllSectionsUnits(sections)
        } else if (mode === UnitInfoMode.All) {
            return getUnitsBySectionAndFloor(selectedSectionName, selectedFloorName, selectedSections)
        }
    }, [mode, selectedFloorName, selectedSectionName, selectedSections])

    return (
        <Select
            mode={multiple ? 'multiple' : undefined}
            allowClear
            showSearch
            placeholder={placeholder}
            optionFilterProp='title'
            loading={loading}
            disabled={disabled}
            {...restInputProps}
        >
            {getOptionGroupBySectionType({
                units: getUnits(sections), unitType: BuildingUnitSubType.Flat, groupLabel: FlatGroupLabel,
            })}
            {getOptionGroupBySectionType({
                units: getUnits(sections), unitType: BuildingUnitSubType.Apartment, groupLabel: ApartmentGroupLabel,
            })}
            {getOptionGroupBySectionType({
                units: getUnits(parking), unitType: BuildingUnitSubType.Parking, groupLabel: ParkingGroupLabel,
            })}
            {getOptionGroupBySectionType({
                units: getUnits(sections), unitType: BuildingUnitSubType.Warehouse, groupLabel: WarehouseGroupLabel,
            })}
            {getOptionGroupBySectionType({
                units: getUnits(sections), unitType: BuildingUnitSubType.Commercial, groupLabel: CommercialGroupLabel,
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
