import { GetPropertyByIdQueryHookResult } from '@app/condo/gql'
import { BuildingSection, BuildingUnit, BuildingUnitSubType } from '@app/condo/schema'
import { LabeledValue } from 'antd/lib/select'
import flattenDeep from 'lodash/flattenDeep'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Space, Typography } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import Select, { CustomSelectProps } from '@condo/domains/common/components/antd/Select'
import { getFloorsBySection, UnitInfoMode } from '@condo/domains/property/components/UnitInfo'

export interface IUnitNameInputProps extends Pick<CustomSelectProps<string>, 'onChange' | 'onSelect'> {
    property: GetPropertyByIdQueryHookResult['data']['properties'][number]
    placeholder?: string
    allowClear?: boolean
    loading?: boolean
    disabled?: boolean
    mode?: UnitInfoMode
    selectedFloorName?: string
    selectedSectionName?: string
    selectedSections?: BuildingSection[]
    multiple?: boolean
    showUnitNotFoundLink?: boolean
}
interface IGetOptionGroupBySectionType {
    units: BuildingUnit[]
    unitType: BuildingUnitSubType
    groupLabel: string
}

export type UnitNameInputOption = LabeledValue & { 'data-unitType': BuildingUnitSubType, 'data-unitName': string }
const BASE_UNIT_NAME_INPUT_OPTION_STYLE: React.CSSProperties = { paddingLeft: '24px' }

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

const getOptionGroupBySectionType = (
    groupLabel: string,
    units: BuildingUnit[],
    unitType: BuildingUnitSubType,
) => {
    if (!units) return []

    const filteredUnits = units.filter((unit) => {
        if (unitType === BuildingUnitSubType.Flat) {
            return unit.unitType === null || unit.unitType === BuildingUnitSubType.Flat
        }
        return unit.unitType === unitType
    })

    const sortedUnits = filteredUnits.sort((a, b) =>
        String(a.label).localeCompare(String(b.label), 'en', { numeric: true, ignorePunctuation: true })
    )

    return sortedUnits.map((unit) => ({
        key: `${groupLabel}-${unitType}-${unit.label}`,
        label: unit.label,
        value: `${unitType}-${unit.label}`,
        title: String(unit.label),
        style: BASE_UNIT_NAME_INPUT_OPTION_STYLE,
        'data-unitType': unitType,
        'data-unitName': String(unit.label),
        'data-cy': 'user__unit-name-input-option',
    }))
}

export const BaseUnitNameInput: React.FC<IUnitNameInputProps> = (props) => {
    const intl = useIntl()
    const FlatGroupLabel = intl.formatMessage({ id: 'pages.condo.ticket.select.group.flat' })
    const ParkingGroupLabel = intl.formatMessage({ id: 'field.UnitType.act.parking' })
    const WarehouseGroupLabel = intl.formatMessage({ id: 'pages.condo.ticket.select.group.warehouse' })
    const CommercialGroupLabel = intl.formatMessage({ id: 'pages.condo.ticket.select.group.commercial' })
    const ApartmentGroupLabel = intl.formatMessage({ id: 'pages.condo.ticket.select.group.apartment' })
    const NotFoundMessage = intl.formatMessage({ id: 'field.UnitName.notFound' })
    const NotFoundLinkMessage = intl.formatMessage({ id: 'field.UnitName.notFound.link' })
    const SectionLabel = intl.formatMessage({ id: 'pages.condo.property.select.option.residentialBuilding' })
    const ParkingLabel = intl.formatMessage({ id: 'pages.condo.property.select.option.parking' })

    const {
        placeholder,
        property,
        loading,
        disabled = false,
        mode,
        selectedFloorName,
        selectedSectionName,
        selectedSections,
        multiple,
        showUnitNotFoundLink = true,
        ...restInputProps
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

    const notFoundContent = useMemo(() => (
        <Space size={12} direction='vertical'>
            <Typography.Text size='medium' type='secondary'>
                {NotFoundMessage}
            </Typography.Text>
            {showUnitNotFoundLink && (
                <Typography.Link href={`/property/${get(property, 'id')}/map/update`} target='_blank'>
                    {NotFoundLinkMessage}
                </Typography.Link>
            )}
        </Space>
    ), [NotFoundLinkMessage, NotFoundMessage, property, showUnitNotFoundLink])

    const unitOptions = useMemo(() => {
        const optionGroups = []

        const sectionUnits = getUnits(sections)
        const parkingUnits = getUnits(parking)

        const sectionSubGroups = [
            { unitType: BuildingUnitSubType.Flat, label: FlatGroupLabel },
            { unitType: BuildingUnitSubType.Apartment, label: ApartmentGroupLabel },
            { unitType: BuildingUnitSubType.Warehouse, label: WarehouseGroupLabel },
            { unitType: BuildingUnitSubType.Commercial, label: CommercialGroupLabel },
        ]

        const parkingSubGroups = [
            { unitType: BuildingUnitSubType.Parking, label: ParkingGroupLabel },
            { unitType: BuildingUnitSubType.Warehouse, label: WarehouseGroupLabel },
            { unitType: BuildingUnitSubType.Commercial, label: CommercialGroupLabel },
        ]

        const buildGroup = (sectionLabel: string, units: BuildingUnit[], unitTypeGroups: { unitType: BuildingUnitSubType, label: string }[]) => {
            const options = []

            for (const { unitType, label: unitTypeLabel } of unitTypeGroups) {
                const unitOptions = getOptionGroupBySectionType(sectionLabel, units, unitType)

                if (!isEmpty(unitOptions)) {
                    options.push({
                        label: unitTypeLabel,
                        disabled: true,
                        key: `label-${sectionLabel}-${unitType}-${unitTypeLabel}`,
                        className: 'category-option',
                    })
                    options.push(...unitOptions)
                }
            }

            if (!isEmpty(options)) {
                optionGroups.push({
                    label: sectionLabel,
                    options,
                })
            }
        }

        buildGroup(SectionLabel, sectionUnits, sectionSubGroups)
        buildGroup(ParkingLabel, parkingUnits, parkingSubGroups)

        return optionGroups
    }, [
        getUnits, sections, parking, FlatGroupLabel, ApartmentGroupLabel, WarehouseGroupLabel,
        CommercialGroupLabel, ParkingGroupLabel, SectionLabel, ParkingLabel,
    ])

    return (
        <Select
            mode={multiple ? 'multiple' : undefined}
            allowClear
            showSearch
            placeholder={placeholder}
            optionFilterProp='title'
            loading={loading}
            disabled={disabled}
            notFoundContent={notFoundContent}
            options={unitOptions}
            autoClearSearchValue
            {...restInputProps}
        />
    )
}

export const UnitNameInput = (props: IUnitNameInputProps) => {
    const { property, onSelect, onChange, ...baseInputProps } = props

    if (!property) {
        return <Input {...baseInputProps} disabled value={null}/>
    }

    return <BaseUnitNameInput {...props} onSelect={onSelect} onChange={onChange}/>
}
